import os
import json
import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
import cv2
from collections import deque
from pathlib import Path
import time
import requests

from .detection_model import CrowdAnalyzer
from .forecasting_model import train_lstm_model, train_linear_model

class CrowdPipeline:
    def __init__(self, detection_weights="yolov8n.pt", device="cuda", source_type="file", camera_id="default_cam"):
        self.detector = CrowdAnalyzer(
            yolo_weights=detection_weights,
            device=device
        )
        self.device = device
        self.counts_history = deque(maxlen=30)  # Store just the counts
        self.detection_data = []  # Store full detection data separately
        self.forecast_window = 30
        self.forecast_steps = 10
        self.source_type = source_type
        self.frame_idx = 0
        self.last_forecast = time.time()
        self.forecast_interval = 1.0  # seconds
        self.camera_id = camera_id
        self.backend_url = "http://localhost:5000/api/crowd"
        self.auth_token = None

    def authenticate(self, email, password):
        """Authenticate with the backend and store the token."""
        auth_url = "http://localhost:5000/api/auth/login"
        try:
            response = requests.post(auth_url, json={"email": email, "password": password})
            if response.status_code == 200:
                self.auth_token = response.json().get("token")
                print("Successfully authenticated with the backend.")
            else:
                print(f"Authentication failed. Status: {response.status_code}, Body: {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"Error during authentication: {e}")
    
    def process_frame(self, frame: np.ndarray, save_detections: bool = True) -> Tuple[np.ndarray, int, float, bool]:
        """Process a frame through detection and update history"""
        self.frame_idx += 1
        results = self.detector(frame, classes=[0])  # Pass classes=[0] to only detect persons
        
        # Get person detections (class 0)
        person_boxes = results[0].boxes[results[0].boxes.cls == 0]
        count = len(person_boxes)
        
        # Add count to counts history
        self.counts_history.append(count)
        avg_count = sum(self.counts_history) / len(self.counts_history)
        
        # Draw boxes and count
        annotated = frame.copy()
        for box in person_boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        # Generate alert if count exceeds the threshold
        alert = count > 9

        # Add text overlays
        cv2.putText(annotated, f"Count: {count}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(annotated, f"Status: {'ALERT!' if alert else 'Normal'}", (10, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0) if not alert else (0, 0, 255), 2)
        
        if alert:
            cv2.putText(annotated, "High Crowd Density Detected!", (10, 110),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        if save_detections:
            detection_data = {
                "timestamp": datetime.now().isoformat(),
                "frame": self.frame_idx,
                "count": count,
                "average_count": float(avg_count),
                "alert": alert
            }
            self.detection_data.append(detection_data)
        
        # Send data to backend
        self.send_data_to_backend(count, alert)

        return annotated, count, avg_count, alert

    def send_data_to_backend(self, count: int, alert: bool):
        """Send detection data to the backend server"""
        if not self.auth_token:
            print("Cannot send data to backend. Not authenticated.")
            return

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.auth_token}'
        }
        payload = {
            "cameraId": self.camera_id,
            "timestamp": datetime.now().isoformat(),
            "count": count,
            "alertTriggered": alert
        }
        try:
            response = requests.post(self.backend_url, json=payload, headers=headers)
            if response.status_code == 201:
                print(f"Successfully sent data to backend: {response.json()}")
            else:
                print(f"Failed to send data. Status: {response.status_code}, Body: {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"Error sending data to backend: {e}")

    def forecast_crowd(self, method="lstm"):
        """Generate crowd forecast from detection history"""
        if len(self.counts_history) < self.forecast_window:
            return None, None

        # Prepare data for forecasting
        counts = list(self.counts_history)
        
        if method.lower() == "lstm":
            model, predictions = train_lstm_model(
                counts, 
                look_back=self.forecast_window,
                n_steps=self.forecast_steps
            )
        else:
            model, predictions = train_linear_model(
                counts,
                n_steps=self.forecast_steps
            )
        
        return model, predictions

    def save_pipeline_data(self, output_dir: str) -> Tuple[str, str]:
        """Save both detection and forecast data"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Save detection history
        detection_path = os.path.join(output_dir, f"detections_{self.frame_idx}.json")
        with open(detection_path, 'w') as f:
            json.dump(self.detection_data[-30:], f, indent=2)  # Keep last 30 frames
        
        # Generate and save forecasts if we have enough history
        if len(self.counts_history) >= self.forecast_window:
            counts = list(self.counts_history)
            lstm_model, lstm_preds = train_lstm_model(counts, n_steps=self.forecast_steps)
            linear_model, linear_preds = train_linear_model(counts, n_steps=self.forecast_steps)
            
            forecast_data = {
                "timestamp": datetime.now().isoformat(),
                "frame": self.frame_idx,
                "lstm_predictions": lstm_preds.tolist() if isinstance(lstm_preds, np.ndarray) else lstm_preds,
                "linear_predictions": linear_preds.tolist() if isinstance(linear_preds, np.ndarray) else linear_preds,
                "window_size": self.forecast_window,
                "steps": self.forecast_steps
            }
            
            forecast_path = os.path.join(output_dir, f"forecast_{self.frame_idx}.json")
            with open(forecast_path, 'w') as f:
                json.dump(forecast_data, f, indent=2)
                
            return detection_path, forecast_path
            
        return detection_path, ""
        return detection_path, forecast_path
            
        return detection_path, ""