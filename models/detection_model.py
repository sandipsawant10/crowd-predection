"""
models/detection_model.py

Person detection module for Smart Crowd Management.

Features:
- Uses YOLOv8 (ultralytics) when available (recommended).
- Falls back to OpenCV HOG person detector if YOLO isn't installed.
- Functions:
    - PersonDetector.detect_frame(frame) -> (count, boxes, annotated_bgr)
    - PersonDetector.stream(source, sample_rate, ...) -> generator of dicts for each analyzed frame
- Optional: save counts to CSV or SQLite (simple logger).
- CLI for quick testing (webcam, video file, or RTSP).

Requirements (for full features):
    pip install opencv-python numpy
    # if you want YOLOv8 (recommended for accuracy/speed):
    pip install ultralytics
    # (ultralytics brings torch as a dependency)
"""

from __future__ import annotations
import os
import sys
import time
import json
import csv
import argparse
import logging
from datetime import datetime
from typing import List, Tuple, Iterable, Optional, Dict, Generator

import numpy as np
import cv2

# logger
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("detection_model")


class PersonDetector:
    """
    Unified person detector wrapper.
    Attempts to use YOLOv8 (ultralytics). If unavailable, uses OpenCV HOG detector.

    Typical use:
        det = PersonDetector(yolo_weights="yolov8n.pt", conf=0.35)
        count, boxes, annotated = det.detect_frame(frame)
        for event in det.stream(source="0"): ...
    """

    def __init__(
        self,
        yolo_weights: str = "yolov8n.pt",
        conf: float = 0.25,
        use_gpu: Optional[str] = None,  # 'cuda'|'cpu'|None
    ):
        self.conf = conf
        self.model = None
        self.use_yolo = False
        self.device = "cpu"

        # Try to import ultralytics YOLO
        try:
            from ultralytics import YOLO  # type: ignore

            # decide device
            try:
                import torch  # type: ignore

                if use_gpu is not None:
                    self.device = use_gpu
                else:
                    self.device = "cuda" if torch.cuda.is_available() else "cpu"
            except Exception:
                self.device = "cpu"

            logger.info("Attempting to load YOLOv8 model (%s) on device=%s", yolo_weights, self.device)
            self.model = YOLO(yolo_weights)  # will download if not present (requires internet)
            self.use_yolo = True
            logger.info("YOLOv8 loaded successfully.")
        except Exception as e:
            logger.warning("YOLOv8 not available or failed to load (%s). Falling back to OpenCV HOG. Error: %s", type(e).__name__, e)
            self._init_hog()

    def _init_hog(self):
        """Initialise OpenCV HOG person detector fallback."""
        self.hog = cv2.HOGDescriptor()
        self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        self.use_yolo = False
        logger.info("Initialized OpenCV HOG descriptor as fallback detector.")

    # ---------------- Core API ----------------
    def detect_frame(self, frame_bgr: np.ndarray) -> Tuple[int, List[Tuple[int, int, int, int]], np.ndarray]:
        """
        Detect people in a single BGR frame.

        Returns:
            count (int): number of people detected (after filtering)
            boxes (list of (x1, y1, x2, y2)): bounding boxes in pixel coordinates
            annotated_bgr (np.ndarray): frame annotated with boxes and count (BGR)
        """
        if frame_bgr is None:
            return 0, [], frame_bgr

        if self.use_yolo and self.model is not None:
            try:
                # ultralytics YOLO API: model.predict accepts numpy array as source
                res = self.model.predict(source=frame_bgr, conf=self.conf, imgsz=640, verbose=False, device=self.device)
                r = res[0]  # first (and only) result for this image
                boxes: List[Tuple[int, int, int, int]] = []

                # r.boxes may be a Boxes object with attributes xyxy and cls (tensors)
                if hasattr(r, "boxes") and len(r.boxes) > 0:
                    # get numpy arrays (works for CPU or CUDA tensors)
                    try:
                        xyxy = r.boxes.xyxy.cpu().numpy()
                        cls = r.boxes.cls.cpu().numpy()
                    except Exception:
                        # if not on GPU or different structure
                        xyxy = r.boxes.xyxy.numpy()
                        cls = r.boxes.cls.numpy()

                    for box, cls_id in zip(xyxy, cls):
                        # COCO class 0 is 'person'
                        if int(cls_id) == 0:
                            x1, y1, x2, y2 = map(int, box[:4])
                            boxes.append((x1, y1, x2, y2))
                count = len(boxes)
                annotated = self._annotate_frame(frame_bgr, boxes, count, source_label="YOLOv8")
                return count, boxes, annotated
            except Exception as e:
                logger.warning("YOLO detection failed at runtime: %s. Falling back to HOG for this frame.", e)
                # fallback to HOG detection for this frame
                return self._detect_hog_frame(frame_bgr)
        else:
            # HOG fallback
            return self._detect_hog_frame(frame_bgr)

        def _detect_hog_frame(self, frame_bgr: np.ndarray) -> Tuple[int, List[Tuple[int, int, int, int]], np.ndarray]:
            """Detect using OpenCV HOG person detector with NMS filtering."""
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        rects, weights = self.hog.detectMultiScale(
            gray, winStride=(8, 8), padding=(8, 8), scale=1.05
        )

        # Convert to (x, y, x2, y2) format for NMS
        boxes = []
        confidences = []
        for (x, y, w, h), w_conf in zip(rects, weights):
            boxes.append([int(x), int(y), int(x + w), int(y + h)])
            confidences.append(float(w_conf))

        # Apply Non-Maximum Suppression to filter overlapping boxes
        indices = cv2.dnn.NMSBoxes(boxes, confidences, score_threshold=0.3, nms_threshold=0.4)

        filtered_boxes: List[Tuple[int, int, int, int]] = []
        if len(indices) > 0:
            for i in indices.flatten():
                filtered_boxes.append(tuple(boxes[i]))

        count = len(filtered_boxes)
        annotated = self._annotate_frame(frame_bgr, filtered_boxes, count, source_label="HOG+NMS")
        return count, filtered_boxes, annotated

    def _annotate_frame(self, frame_bgr: np.ndarray, boxes: List[Tuple[int, int, int, int]], count: int, source_label: str = "") -> np.ndarray:
        """Draw bounding boxes and overlay count on the frame (BGR)."""
        annotated = frame_bgr.copy()
        for (x1, y1, x2, y2) in boxes:
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
        # put count text top-left
        txt = f"{source_label} Count: {count}" if source_label else f"Count: {count}"
        color = (0, 0, 255) if count >= 120 else (255, 0, 0)  # highlight if near threshold (example)
        cv2.putText(annotated, txt, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)
        return annotated

    # -------- streaming / processing helpers ----------
    def stream(
        self,
        source: str | int = 0,
        camera_id: Optional[str] = None,
        sample_rate: int = 1,
        max_frames: Optional[int] = None,
        visualize: bool = True,
        save_csv: Optional[str] = None,
        timestamp_fmt: str = "%Y-%m-%dT%H:%M:%S%z",
    ) -> Generator[Dict, None, None]:
        """
        Stream and analyze frames from a source (webcam index, file path, or rtsp url).

        Args:
            source: '0' or 0 for webcam index 0, or path to video file, or RTSP URL.
            camera_id: optional id included in output.
            sample_rate: process every n-th frame to reduce load (1 = every frame).
            max_frames: limit number of analyzed frames (None = unlimited).
            visualize: if True, show annotated frames in cv2 window and allow 'q' to quit.
            save_csv: optional path to append counts as CSV (timestamp,frame_idx,count,boxes)
            timestamp_fmt: format for timestamp (default ISO-like)

        Yields:
            dict with keys: timestamp, frame_idx, camera_id, count, boxes, annotated (BGR)
        """
        # open capture
        try:
            # if source is a digit string, convert to int
            if isinstance(source, str) and source.isdigit():
                src = int(source)
            else:
                src = source
            cap = cv2.VideoCapture(src)
            if not cap.isOpened():
                logger.error("Unable to open video source: %s", source)
                if not os.path.exists(source):
                    logger.error("The file does not exist at the specified path: %s", source)
                else:
                    logger.error("The file exists but could not be opened. Check format or permissions.")
                return
        except Exception as e:
            logger.exception("Error opening source %s: %s", source, e)
            return

        frame_idx = 0
        saved_csv_header = False
        if save_csv and not os.path.exists(save_csv):
            saved_csv_header = True

        while True:
            ret, frame = cap.read()
            if not ret:
                logger.info("End of stream or cannot fetch frame. Exiting stream loop.")
                break
            frame_idx += 1
            if sample_rate > 1 and (frame_idx % sample_rate) != 0:
                # optionally skip frames to save compute
                if visualize:
                    # still show un-annotated frame at lower rate? skipping for simplicity
                    pass
                continue

            ts = datetime.utcnow().isoformat() + "Z"
            count, boxes, annotated = self.detect_frame(frame)
            row = {
                "timestamp": ts,
                "frame_idx": frame_idx,
                "camera_id": camera_id or str(source),
                "count": int(count),
                "boxes": boxes,
            }

            # optionally append to CSV
            if save_csv:
                try:
                    self._append_csv(save_csv, row, header=saved_csv_header)
                    saved_csv_header = False
                except Exception as e:
                    logger.warning("Failed to write CSV row: %s", e)

            # yield to caller
            yield {
                "timestamp": ts,
                "frame_idx": frame_idx,
                "camera_id": camera_id or str(source),
                "count": int(count),
                "boxes": boxes,
                "annotated": annotated,
            }

            # visualization (blocking)
            if visualize:
                cv2.imshow(f"Detection - {camera_id or source}", annotated)
                # press 'q' to quit
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    logger.info("User requested quit (q). Exiting.")
                    break

            if max_frames is not None and frame_idx >= max_frames:
                logger.info("Reached max_frames=%s; exiting stream.", max_frames)
                break

        cap.release()
        if visualize:
            cv2.destroyAllWindows()

    # -------------------- utilities --------------------
    @staticmethod
    def _append_csv(csv_path: str, row: Dict, header: bool = False):
        """Append a detection row (timestamp,frame_idx,camera_id,count,boxes_json) to CSV."""
        boxes_json = json.dumps(row.get("boxes", []))
        file_exists = os.path.exists(csv_path)
        with open(csv_path, "a", newline="") as f:
            writer = csv.writer(f)
            if header and not file_exists:
                writer.writerow(["timestamp", "frame_idx", "camera_id", "count", "boxes"])
            writer.writerow([row["timestamp"], row["frame_idx"], row["camera_id"], row["count"], boxes_json])

    # convenience wrapper for programmatic use
    def analyze_frames_iterable(self, frames: Iterable[np.ndarray]) -> List[Dict]:
        """Given an iterable of BGR frames, detect on each and return list of dicts."""
        out = []
        idx = 0
        for frame in frames:
            idx += 1
            count, boxes, annotated = self.detect_frame(frame)
            out.append({"frame_idx": idx, "count": count, "boxes": boxes, "annotated": annotated})
        return out


# ---------------------- CLI for quick test ----------------------
def parse_args():
    p = argparse.ArgumentParser("detection_model.py - YOLOv8 / HOG person detection tester")
    p.add_argument("--source", "-s", type=str, default="0", help="Video source (0 for webcam, file path, or RTSP URL)")
    p.add_argument("--weights", "-w", type=str, default="yolov8n.pt", help="YOLOv8 weights file (only used if ultralytics installed)")
    p.add_argument("--conf", "-c", type=float, default=0.35, help="YOLO confidence threshold")
    p.add_argument("--sample-rate", "-r", type=int, default=1, help="Process every Nth frame (1 = every frame)")
    p.add_argument("--max-frames", type=int, default=None, help="Stop after analyzing this many frames")
    p.add_argument("--save-csv", type=str, default=None, help="Append detection rows to this CSV file")
    p.add_argument("--no-vis", action="store_true", help="Disable visualization windows")
    p.add_argument("--camera-id", type=str, default=None, help="Optional camera id to log")
    return p.parse_args()


def main_cli():
    args = parse_args()
    det = PersonDetector(yolo_weights=args.weights, conf=args.conf)

    # Preferred: allow --source arg. If not provided, use fallback video.
    if args.source and args.source != "0":
        video_source = args.source
    else:
        # Fallback path: change this to your OS path as needed.
        # Use the Linux-style path if running in this environment:
        fallback_path_unix = "/mnt/data/6574291-hd_1280_720_25fps.mp4"
        # Windows example fallback (raw string) - uncomment if running on Windows local machine:
        # fallback_path_win = r"C:\NOVA\crowd-predection\videos\6574291-hd_1280_720_25fps.mp4"
        # Choose which fallback to use automatically based on platform:
        if os.name == "nt":
            # Windows
            video_source = r"C:\NOVA\crowd-predection\videos\6574291-hd_1280_720_25fps.mp4"
        else:
            # Linux/macOS/Colab/remote runner where file was uploaded
            video_source = fallback_path_unix

    logger.info("Using video source: %s", video_source)

    try:
        for event in det.stream(
            source=video_source,
            camera_id=args.camera_id,
            sample_rate=args.sample_rate,
            max_frames=args.max_frames,
            visualize=not args.no_vis,
            save_csv=args.save_csv,
        ):
            # simple console output
            logger.info("Frame %d | camera=%s | count=%d", event["frame_idx"], event["camera_id"], event["count"])
    except KeyboardInterrupt:
        logger.info("Interrupted by user.")
    except Exception as e:
        logger.exception("Error during streaming: %s", e)



if __name__ == "__main__":
    main_cli()
