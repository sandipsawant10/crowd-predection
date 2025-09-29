import cv2
import numpy as np
import os

def create_test_video(output_path, duration=10, fps=25):
    """Create a test video with moving rectangles simulating people."""
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Video settings
    width, height = 640, 480
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    # Create moving rectangles
    for i in range(duration * fps):
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        # Add some moving "people" (rectangles)
        for j in range(5):
            x = int((i + j*50) % width)
            y = 200 + j*50
            cv2.rectangle(frame, (x, y), (x+30, y+60), (0, 255, 0), -1)
        
        out.write(frame)
    
    out.release()
    print(f"Created test video at: {output_path}")

if __name__ == "__main__":
    video_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                             "videos", "test_video.mp4")
    create_test_video(video_path)
