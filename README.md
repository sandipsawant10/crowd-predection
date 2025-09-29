# Smart Crowd Management System

A machine learning system for crowd detection and prediction using computer vision and time series forecasting.

## Features

- Real-time crowd detection using YOLOv8/HOG
- Crowd count forecasting using LSTM and Linear Regression
- Interactive visualization and progress tracking
- CSV logging support

## Installation

```bash
git clone <your-repo-url>
cd crowd-predection
pip install -r requirements.txt
```

## Usage

```bash
# Run crowd detection
python models/detection_model.py --source <video_source>

# Run crowd forecasting
python models/forecasting_model.py
```
