import cv2
import json
import os
import sys
from pathlib import Path
import urllib.request
from tqdm import tqdm
from ultralytics import YOLO

# Ensure models directory is in the Python path
current_dir = Path(__file__).parent
models_dir = current_dir / "models"
sys.path.append(str(current_dir))

from models.crowd_pipeline import CrowdPipeline

def download_with_progress(url: str, output_path: str):
    """Download file with progress bar"""
    try:
        response = urllib.request.urlopen(url)
        total_size = int(response.headers.get('content-length', 0))
        
        with open(output_path, 'wb') as f, tqdm(
            total=total_size,
            unit='B',
            unit_scale=True,
            unit_divisor=1024,
            desc="Downloading"
        ) as pbar:
            while True:
                chunk = response.read(8192)
                if not chunk:
                    break
                f.write(chunk)
                pbar.update(len(chunk))
        return True
    except Exception as e:
        print(f"Download failed: {str(e)}")
        if os.path.exists(output_path):
            os.remove(output_path)
        return False

def download_sample_video(video_name="crowd2.mp4"):
    """Download sample video if not present"""
    videos_dir = Path(__file__).parent / "videos"
    videos_dir.mkdir(exist_ok=True)
    
    video_path = videos_dir / video_name
    if not video_path.exists():
        print(f"Downloading sample video to {video_path}...")
        # Updated URLs with more reliable sources
        urls = [
            "https://github.com/ultralytics/yolov5/releases/download/v1.0/pedestrians.mp4",
            "https://github.com/Intel-OpenVINO/sample-videos/raw/master/people-detection.mp4",
            "https://storage.googleapis.com/public-datasets-ml/crowd-videos/sample1.mp4",
            # Fallback to webcam if download fails
            "0"  # Will use webcam as last resort
        ]
        
        for url in urls:
            if url == "0":
                print("All downloads failed. Attempting to use webcam...")
                video_path = "0"
                return video_path
                
            print(f"Trying URL: {url}")
            try:
                if download_with_progress(url, str(video_path)):
                    if os.path.getsize(video_path) > 0:
                        print("Download complete!")
                        return str(video_path)
                    else:
                        os.remove(video_path)
            except Exception as e:
                print(f"Failed to download from {url}: {str(e)}")
                continue
        
        print("Warning: Could not download any sample videos.")
        print("Options:")
        print("1. Place your own video file in the videos directory")
        print("2. Use --video with full path to your video")
        print("3. Use --video 0 to use webcam")
        raise RuntimeError("No valid video source available")
    
    return str(video_path)

def download_yolo_weights(weights_name="yolov8m.pt"):
    """Download YOLO weights if not present"""
    weights_dir = Path(__file__).parent / "weights"
    weights_dir.mkdir(exist_ok=True)
    
    weights_path = weights_dir / weights_name
    if not weights_path.exists():
        print(f"Downloading YOLO weights to {weights_path}...")
        try:
            # Let ultralytics handle the download
            model = YOLO(weights_name)
            # Move weights to our weights directory
            if hasattr(model, 'model') and hasattr(model.model, 'pt_path'):
                downloaded_path = Path(model.model.pt_path)
                if downloaded_path.exists():
                    os.replace(downloaded_path, weights_path)
                    print("Download complete!")
                    return str(weights_path)
        except Exception as e:
            print(f"Failed to download weights: {e}")
            
        print("Warning: Could not download YOLO weights.")
        print("Options:")
        print("1. Download manually from https://github.com/ultralytics/yolov8/releases")
        print("2. Place weights file in the weights directory")
        raise RuntimeError("No valid weights file available")
    
    return str(weights_path)

def run_pipeline(video_path: str, weights_path: str, output_dir: str, camera_id: str, email: str, password: str):
    """Run the complete detection and forecasting pipeline"""
    # Handle video path
    if str(video_path).lower() in ["0", "webcam"]:
        print("Using webcam as video source...")
        video_path = 0
        
    elif not os.path.exists(str(video_path)):
        # Try relative to videos directory
        videos_dir = Path(__file__).parent / "videos"
        alt_path = videos_dir / video_path
        if alt_path.exists():
            video_path = str(alt_path)
        else:
            # Try to download sample video
            if video_path == "crowd2.mp4":
                video_path = download_sample_video()
            else:
                raise FileNotFoundError(f"Video file not found: {video_path}")
    
    # Handle weights path
    if not os.path.exists(weights_path):
        # Try relative to weights directory
        weights_dir = Path(__file__).parent / "weights"
        alt_path = weights_dir / weights_path
        if alt_path.exists():
            weights_path = str(alt_path)
        else:
            # Try to download weights
            try:
                weights_path = download_yolo_weights(weights_path)
            except Exception as e:
                raise FileNotFoundError(f"Could not find or download weights: {e}")

    pipeline = CrowdPipeline(
        detection_weights=weights_path,
        device="cuda",
        source_type="webcam" if video_path == 0 else "file",
        camera_id=camera_id
    )

    # Authenticate with the backend
    if email and password:
        print("Authenticating with the backend...")
        pipeline.authenticate(email, password)
    else:
        print("Running without backend authentication.")
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")
        
    frame_count = 0
    try:
        print(f"Processing video: {video_path}")
        print(f"Saving results to: {output_dir}")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            # Process frame
            annotated, count, avg_count, alert = pipeline.process_frame(frame)
            frame_count += 1
            
            # Generate forecasts every 30 frames
            if frame_count % 30 == 0:
                detection_path, forecast_path = pipeline.save_pipeline_data(output_dir)
                print(f"Frame {frame_count}: Saved detection and forecast data")
            
            # Display progress
            cv2.imshow("Crowd Analysis", annotated)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("Interrupted by user")
                break
                
    finally:
        cap.release()
        cv2.destroyAllWindows()
        
    print("Processing complete!")
    return frame_count

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Crowd Analysis Pipeline")
    parser.add_argument("--video", required=True, help="Input video path")
    parser.add_argument("--weights", required=True, help="YOLO weights path")
    parser.add_argument("--output", default="results", help="Output directory")
    parser.add_argument("--camera_id", default="cam01", help="Camera ID for the backend")
    parser.add_argument("--email", help="Email for backend authentication")
    parser.add_argument("--password", help="Password for backend authentication")
    args = parser.parse_args()
    
    try:
        # Ensure directories exist
        videos_dir = Path(__file__).parent / "videos"
        weights_dir = Path(__file__).parent / "weights"
        videos_dir.mkdir(exist_ok=True)
        weights_dir.mkdir(exist_ok=True)
        
        # Allow direct webcam usage
        if args.video.lower() in ["0", "webcam"]:
            args.video = "0"
            
        total_frames = run_pipeline(args.video, args.weights, args.output, args.camera_id, args.email, args.password)
        print(f"Processed {total_frames} frames")
    except FileNotFoundError as e:
        print(f"Error: {e}")
        print("Try putting your video in the 'videos' directory or use absolute path")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)