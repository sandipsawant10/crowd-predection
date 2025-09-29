"""
models/model_utils.py

Utility functions and helper classes for Smart Crowd Management models.

- Provides reusable loaders for YOLOv8 and fallback HOG.
- Handles preprocessing and annotation helpers.
- Forecasting utilities (saving/loading models, error metrics).
- Common CSV logger for detections and forecasts.
"""

import os
import json
import logging
import csv
from datetime import datetime
from pathlib import Path
from contextlib import contextmanager
from typing import List, Tuple, Dict, Any, Optional, Generator, Union

import cv2
import numpy as np

# logger config
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("model_utils")


def validate_frame(frame: Optional[np.ndarray]) -> bool:
    """Validate if frame is a valid BGR image."""
    if frame is None:
        return False
    return isinstance(frame, np.ndarray) and len(frame.shape) == 3 and frame.shape[2] == 3


# ---------------- Detection Helpers ----------------
def load_yolo_model(weights: str = "yolov8n.pt", device: str = "cpu") -> Any:
    """Load YOLOv8 model with proper error handling."""
    if not os.path.exists(weights) and not weights.startswith("yolov8"):
        logger.error(f"Weights file not found: {weights}")
        return None
    
    try:
        from ultralytics import YOLO
        model = YOLO(weights)
        model.to(device)
        logger.info(f"✅ YOLOv8 loaded successfully ({weights}) on {device}")
        return model
    except Exception as e:
        logger.warning(f"⚠️ Could not load YOLOv8. Error: {str(e)}")
        return None


def init_hog_detector():
    """
    Initialise OpenCV HOG person detector.
    """
    hog = cv2.HOGDescriptor()
    hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
    logger.info("Initialized OpenCV HOG descriptor (fallback detector).")
    return hog


def annotate_frame(
    frame: np.ndarray, 
    boxes: List[Tuple[int, int, int, int]], 
    count: int, 
    source_label: str = "",
    threshold: int = 120
) -> np.ndarray:
    """Draw bounding boxes and overlay count with validation."""
    if not validate_frame(frame):
        raise ValueError("Invalid frame format")
    
    annotated = frame.copy()
    for box in boxes:
        if len(box) != 4:
            continue
        x1, y1, x2, y2 = box
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
    
    txt = f"{source_label} Count: {count}" if source_label else f"Count: {count}"
    color = (0, 0, 255) if count >= threshold else (255, 0, 0)
    cv2.putText(annotated, txt, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)
    return annotated


# ---------------- Forecasting Helpers ----------------
def save_forecast_model(model: Any, filepath: str) -> bool:
    """Save forecast model with path validation and error handling."""
    try:
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        ext = path.suffix.lower()
        if ext == ".h5":  # Keras LSTM model
            model.save(str(path))
        else:  # sklearn model
            import joblib
            joblib.dump(model, str(path))
        logger.info(f"✅ Model saved successfully at {filepath}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to save model: {str(e)}")
        return False


def load_forecast_model(filepath: str):
    """
    Load forecast model from disk.
    """
    try:
        ext = os.path.splitext(filepath)[1]
        if ext == ".h5":
            from tensorflow.keras.models import load_model
            model = load_model(filepath)
        else:
            import joblib
            model = joblib.load(filepath)
        logger.info(f"✅ Model loaded from {filepath}")
        return model
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return None


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Calculate comprehensive error metrics with validation."""
    if len(y_true) != len(y_pred):
        raise ValueError("Length mismatch between true and predicted values")
    
    from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
    metrics = {
        "mse": float(mean_squared_error(y_true, y_pred)),
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "r2": float(r2_score(y_true, y_pred))
    }
    return metrics


# ---------------- CSV Logger ----------------
class CSVLogger:
    """Enhanced CSV logger with context manager and validation."""
    
    def __init__(self, filepath: str, header: List[str]):
        self.filepath = Path(filepath)
        self.header = header
        self._initialize_file()
    
    def _initialize_file(self) -> None:
        """Initialize CSV file with header if needed."""
        try:
            self.filepath.parent.mkdir(parents=True, exist_ok=True)
            if not self.filepath.exists():
                with open(self.filepath, "w", newline="") as f:
                    writer = csv.writer(f)
                    writer.writerow(self.header)
            logger.info(f"✅ CSV Logger initialized at {self.filepath}")
        except Exception as e:
            logger.error(f"❌ Failed to initialize CSV logger: {str(e)}")
            raise
    
    @contextmanager
    def batch_logging(self) -> Generator[None, None, None]:
        """Context manager for batch logging operations."""
        try:
            yield
        except Exception as e:
            logger.error(f"❌ Batch logging failed: {str(e)}")
            raise
    
    def log(self, row: List[Any]) -> None:
        """Log a single row with validation."""
        if len(row) != len(self.header):
            raise ValueError(f"Row length {len(row)} does not match header length {len(self.header)}")
        try:
            with open(self.filepath, "a", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(row)
        except Exception as e:
            logger.error(f"❌ Failed to log row: {str(e)}")
            raise

    def log_detection(self, frame_idx: int, camera_id: str, count: int, boxes: List[Tuple[int, int, int, int]]):
        ts = datetime.utcnow().isoformat() + "Z"
        self.log([ts, frame_idx, camera_id, count, json.dumps(boxes)])

    def log_forecast(self, step: int, prediction: float, model_name: str):
        ts = datetime.utcnow().isoformat() + "Z"
        self.log([ts, step, model_name, prediction])
