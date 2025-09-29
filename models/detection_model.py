from ultralytics import YOLO
import numpy as np
import cv2
import torch
import argparse
import csv
import math
import time
from collections import deque
import json
from datetime import datetime

class CrowdAnalyzer:
    def __init__(self,  # Fix: Changed from _init_ to __init__
                 yolo_weights,
                 device="cpu",
                 min_head_radius=5,
                 max_head_radius=30,
                 conf_threshold=0.35,
                 iou_threshold=0.5,
                 imgsz=640,
                 max_det=300,
                 head_top_ratio=0.18,
                 head_radius_scale=0.25,
                 smooth_window=30,
                 circle_nms_factor=0.8,
                 min_bbox_area=600,
                 adaptive=True,
                 target_fps=24,
                 min_imgsz=448,
                 max_imgsz=960,
                 enable_refine=True,
                 refine_top_scale=0.3,
                 hough_dp=1.2,
                 hough_min_dist=8,
                 hough_param1=120,
                 hough_param2=12,
                 hough_min_radius_scale=0.15,
                 hough_max_radius_scale=0.4,
                 nms_mode="distance",
                 nms_iou=0.3,
                 count_mode="heads"):
        # Device/setup
        self.device = "cuda" if device == "cuda" and torch.cuda.is_available() else "cpu"
        try:
            self.model = YOLO(yolo_weights)
            if self.device == "cuda":
                self.model.to("cuda")
                torch.backends.cudnn.benchmark = True
            # Fuse for faster inference where supported
            try:
                self.model.fuse()
            except Exception:
                pass
        except Exception as e:
            raise RuntimeError(f"Failed to load YOLO model: {e}")

        # Config
        self.min_head_radius = min_head_radius
        self.max_head_radius = max_head_radius
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        self.imgsz = imgsz
        self.max_det = max_det
        self.head_top_ratio = head_top_ratio
        self.head_radius_scale = head_radius_scale
        self.circle_nms_factor = circle_nms_factor
        self.min_bbox_area = int(min_bbox_area)
        self.adaptive = adaptive
        self.target_fps = max(5, int(target_fps))
        self.min_imgsz = int(min_imgsz)
        self.max_imgsz = int(max_imgsz)
        self.enable_refine = bool(enable_refine)
        self.refine_top_scale = float(refine_top_scale)
        self.hough_dp = float(hough_dp)
        self.hough_min_dist = int(hough_min_dist)
        self.hough_param1 = float(hough_param1)
        self.hough_param2 = float(hough_param2)
        self.hough_min_radius_scale = float(hough_min_radius_scale)
        self.hough_max_radius_scale = float(hough_max_radius_scale)
        self.nms_mode = nms_mode
        self.nms_iou = float(nms_iou)
        self.count_mode = count_mode if count_mode in ("heads", "persons") else "heads"

        # State
        self.frame_counter = 0
        self.count_history = deque(maxlen=30)  # smoothing
        self._last_infer_end_ts = None

    def _nms_circles_area(self, circles, iou_thresh: float):
        """Area-based NMS for circles using IoU of circle overlap."""
        if not circles:
            return []
        circles_sorted = sorted(circles, key=lambda c: c[2], reverse=True)
        kept = []

        def circle_iou(c1, c2):
            x1, y1, r1 = c1
            x2, y2, r2 = c2
            d = math.hypot(x1 - x2, y1 - y2)
            if d >= r1 + r2:
                return 0.0
            if d <= abs(r1 - r2):
                inter = math.pi * min(r1, r2) ** 2
            else:
                # ✅ FIXED: Proper exponentiation
                alpha = math.acos((r1*2 + d2 - r2*2) / (2 * r1 * d))
                beta = math.acos((r2*2 + d2 - r1*2) / (2 * r2 * d))
                inter = r1*2 * alpha + r2*2 * beta - 0.5 * math.sqrt(
                    max(0.0, (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2))
                )
            union = math.pi * r1*2 + math.pi * r2*2 - inter
            return inter / union if union > 0 else 0.0

        for c in circles_sorted:
            keep = True
            for k in kept:
                if circle_iou(c, k) > iou_thresh:
                    keep = False
                    break
            if keep:
                kept.append(c)
        return kept

    def _refine_head_with_hough(self, frame_bgr, bbox):
        """Refine head center within top region of bbox using HoughCircles."""
        x1, y1, x2, y2 = bbox
        h = max(1, y2 - y1)
        w = max(1, x2 - x1)
        top_h = max(4, int(h * self.refine_top_scale))
        roi = frame_bgr[y1:y1 + top_h, x1:x2]
        if roi.size == 0:
            return None
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        gray = cv2.medianBlur(gray, 5)

        # Expected radius range based on bbox size
        min_r = max(2, int(min(w, h) * self.hough_min_radius_scale))
        max_r = max(min_r + 1, int(min(w, h) * self.hough_max_radius_scale))

        circles = cv2.HoughCircles(
            gray,
            cv2.HOUGH_GRADIENT,
            dp=self.hough_dp,
            minDist=self.hough_min_dist,
            param1=self.hough_param1,
            param2=self.hough_param2,
            minRadius=min_r,
            maxRadius=max_r,
        )
        if circles is None:
            return None
        circles = np.round(circles[0, :]).astype(int)
        # Choose the circle closest to the horizontal center
        cx_global = x1 + w // 2
        best = None
        best_dist = 1e9
        for (cx, cy, r) in circles:
            gcx, gcy = x1 + int(cx), y1 + int(cy)
            d = abs(gcx - cx_global)
            if d < best_dist:
                best_dist = d
                best = (gcx, gcy, int(r))
        return best

    def _body_to_circular_head(self, bbox, frame_shape):
        """Estimate head circle from person bounding box"""
        x1, y1, x2, y2 = bbox
        body_height = y2 - y1
        body_width = x2 - x1

        # Approximate head position near top of body
        head_center_x = (x1 + x2) // 2
        head_center_y = y1 + int(body_height * self.head_top_ratio)

        # Clamp inside frame
        head_center_x = max(0, min(head_center_x, frame_shape[1] - 1))
        head_center_y = max(0, min(head_center_y, frame_shape[0] - 1))

        # Estimate radius
        head_radius = max(
            self.min_head_radius,
            min(int(min(body_width, body_height) * self.head_radius_scale), self.max_head_radius)
        )
        return (head_center_x, head_center_y, head_radius)

    def _filter_overlapping_circles(self, circles, factor=None):
        """Greedy NMS over head circles based on center distance.
        Keeps larger circles first and removes neighbors within a fraction of min radius.
        """
        if not circles:
            return []
        # Sort by radius descending
        circles_sorted = sorted(circles, key=lambda c: c[2], reverse=True)
        kept = []
        eff_factor = factor if factor is not None else self.circle_nms_factor
        for cx, cy, r in circles_sorted:
            keep = True
            for kx, ky, kr in kept:
                dist = math.hypot(cx - kx, cy - ky)
                min_r = min(r, kr)
                if dist < min_r * eff_factor:
                    keep = False
                    break
            if keep:
                kept.append((cx, cy, r))
        return kept

    def detect_circular_heads(self, frame_bgr):
        """Run YOLO, detect people, convert to head circles. Returns (circles, boxes)."""
        infer_start = time.time()
        with torch.inference_mode():  # ✅ FIXED: Proper context manager
            results = self.model.predict(
                frame_bgr,
                device=self.device,
                conf=self.conf_threshold,
                iou=self.iou_threshold,
                imgsz=self.imgsz,
                classes=[0],  # person
                max_det=self.max_det,
                half=(self.device == "cuda"),
                verbose=False,
            )
        infer_end = time.time()
        self._last_infer_end_ts = infer_end

        circles = []
        boxes = []
        if results and len(results) > 0:
            r = results[0]
            if hasattr(r, "boxes") and r.boxes is not None and len(r.boxes) > 0:
                xyxy = r.boxes.xyxy.cpu().numpy()
                cls_ids = r.boxes.cls.cpu().numpy()

                for i, box in enumerate(xyxy):
                    if int(cls_ids[i]) == 0:  # person class
                        x1, y1, x2, y2 = box.astype(int)
                        area = max(0, (x2 - x1)) * max(0, (y2 - y1))
                        if area < self.min_bbox_area:
                            continue
                        boxes.append((x1, y1, x2, y2))
                        # Aspect-ratio aware head placement
                        body_h = max(1, y2 - y1)
                        body_w = max(1, x2 - x1)
                        aspect = body_h / body_w
                        # Adjust top ratio for very tall vs. squat boxes
                        if aspect >= 2.0:
                            adj_ratio = max(0.12, min(0.20, self.head_top_ratio * 0.9))
                        elif aspect <= 1.2:
                            adj_ratio = min(0.26, max(0.16, self.head_top_ratio * 1.2))
                        else:
                            adj_ratio = self.head_top_ratio
                        orig_ratio = self.head_top_ratio
                        self.head_top_ratio = adj_ratio
                        circle = None
                        if self.enable_refine:
                            circle = self._refine_head_with_hough(frame_bgr, (x1, y1, x2, y2))
                        if circle is None:
                            circle = self._body_to_circular_head((x1, y1, x2, y2), frame_bgr.shape)
                        self.head_top_ratio = orig_ratio
                        if circle:
                            circles.append(circle)

        # Dynamic NMS factor: more suppression when many candidates
        if self.nms_mode == "area":
            circles = self._nms_circles_area(circles, iou_thresh=self.nms_iou)
        else:
            dynamic_factor = self.circle_nms_factor
            if len(circles) > 120:
                dynamic_factor = max(0.9, self.circle_nms_factor) * 1.25
            elif len(circles) > 60:
                dynamic_factor = max(0.85, self.circle_nms_factor) * 1.1
            circles = self._filter_overlapping_circles(circles, factor=dynamic_factor)

        # Adaptive imgsz to hit target FPS
        if self.adaptive and self._last_infer_end_ts is not None:
            infer_ms = (infer_end - infer_start) * 1000.0
            if infer_ms > 0:
                current_fps = 1000.0 / infer_ms
                if current_fps < self.target_fps * 0.9 and self.imgsz > self.min_imgsz:
                    self.imgsz = max(self.min_imgsz, self.imgsz - 64)
                elif current_fps > self.target_fps * 1.2 and self.imgsz < self.max_imgsz:
                    self.imgsz = min(self.max_imgsz, self.imgsz + 64)
        return circles, boxes

    def analyze_frame(self, frame_bgr, threshold=50, visualize=True):
        """Main loop: detect heads, smooth count, visualize"""
        self.frame_counter += 1
        circles, boxes = self.detect_circular_heads(frame_bgr)

        head_count = len(circles)
        if self.count_mode == "persons":
            head_count = len(boxes)
        self.count_history.append(head_count)
        avg_count = int(sum(self.count_history) / len(self.count_history))

        alert_triggered = head_count >= 9
        if alert_triggered:
            print(f"[ALERT] Frame {self.frame_counter}: High crowd detected ({avg_count})")

        if visualize:
            display_frame = frame_bgr.copy()
            if self.count_mode == "persons":
                for idx, (x1, y1, x2, y2) in enumerate(boxes, 1):
                    cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(display_frame, str(idx), (x1, max(0, y1 - 5)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
            else:
                if head_count < 100:
                    for idx, (cx, cy, r) in enumerate(circles, 1):
                        cv2.circle(display_frame, (cx, cy), r, (0, 255, 0), 2)
                        cv2.putText(display_frame, str(idx), (cx - 5, cy - 5),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
                else:
                    for (cx, cy, _) in circles:
                        cv2.circle(display_frame, (cx, cy), 2, (0, 255, 0), -1)

            count_text = f"Count : {head_count}"
            cv2.putText(display_frame, count_text,
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            # Draw alert signal next to count when triggered
            if alert_triggered:
                text_size, _ = cv2.getTextSize(count_text, cv2.FONT_HERSHEY_SIMPLEX, 1, 2)
                dot_x = 10 + text_size[0] + 16
                dot_y = 30 - 10
                cv2.circle(display_frame, (dot_x, dot_y), 8, (0, 0, 255), -1)

            if alert_triggered:
                cv2.putText(display_frame, "ALERT: Crowd Exceeded!",
                            (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
            return display_frame, head_count, avg_count, alert_triggered

        return None, head_count, avg_count, alert_triggered

    def get_detection_data(self):
        """Get current detection data as dictionary"""
        return {
            "timestamp": datetime.now().isoformat(),
            "frame": self.frame_counter,
            "count": len(self.count_history[-1]) if self.count_history else 0,
            "average_count": int(sum(self.count_history) / len(self.count_history)) if self.count_history else 0,
            "history": list(self.count_history)
        }

    def save_detection_json(self, filepath):
        """Save detection data to JSON file"""
        data = self.get_detection_data()
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        return data

    def __call__(self, frame, device=None, classes=None):
        """Make the class callable for detection"""
        if device is None:
            device = self.device
        return self.model(frame, device=device, classes=classes)


def main():
    parser = argparse.ArgumentParser(description="Crowd Detection and Analysis")
    parser.add_argument("--source", required=True, help="Video source (file path or camera index)")
    parser.add_argument("--weights", required=True, help="Path to YOLO weights file")
    parser.add_argument("--device", default="cuda", choices=["cpu", "cuda"], help="Inference device")
    parser.add_argument("--count-mode", default="persons", choices=["persons", "heads"], help="Counting mode")
    parser.add_argument("--threshold", type=int, default=9, help="Crowd alert threshold")
    args = parser.parse_args()
    
    cap = None  # Initialize cap in broader scope
    
    try:
        analyzer = CrowdAnalyzer(
            yolo_weights=args.weights,
            device=args.device,
            count_mode=args.count_mode
        )
        
        cap = cv2.VideoCapture(args.source)
        if not cap.isOpened():
            raise RuntimeError(f"Failed to open video source: {args.source}")

        print("Starting analysis... Press 'q' to quit")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            annotated, count, avg_count, alert = analyzer.analyze_frame(
                frame, 
                threshold=args.threshold, 
                visualize=True
            )
            
            cv2.imshow("Crowd Analyzer", annotated)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                print("Quitting on user request")
                break

    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        if cap is not None:
            cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()  # Move main logic to function