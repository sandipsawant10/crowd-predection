# File-Based Smart Crowd Management System

## Overview

This system is designed to **consume and visualize** results from external ML processing systems. It does **NOT** perform any ML computations, video analysis, or AI processing internally.

**Important**: All ML processing happens outside this codebase. This system only monitors and displays pre-generated result files.

## Key Features

### ✅ What This System Does

- **🔄 File Monitoring** - Watches `results/` folder for new JSON files created by external systems
- **📊 Data Visualization** - Interactive charts and tables for detection/forecast data
- **� File Management** - Browse, select, and view result files with metadata
- **⚡ Real-time Updates** - WebSocket notifications when external systems create new files
- **🌐 REST API** - Serves file data to frontend and external consumers

### ❌ What This System Does NOT Do

- **No ML Processing** - Does not run crowd detection or forecasting algorithms
- **No Video Analysis** - Does not process, upload, or analyze video files
- **No AI Computations** - No model training, inference, or predictions
- **No File Generation** - Only consumes files created by external systems
- **Passive System** - Only monitors and serves existing data

## File Structure

```
smart-crowd-management/
├── results/                          # ML model output files
│   ├── detections_30.json           # Detection results (frame 30)
│   ├── detections_60.json           # Detection results (frame 60)
│   ├── forecast_30.json             # Forecast results (frame 30)
│   └── forecast_60.json             # Forecast results (frame 60)
├── dashboard/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── services/
│   │   │   │   └── fileWatcherService.js    # File monitoring service
│   │   │   ├── routes/
│   │   │   │   └── resultRoutes.js          # API endpoints for files
│   │   │   ├── models/
│   │   │   │   ├── Detection.js             # Detection data model
│   │   │   │   └── Forecast.js              # Forecast data model
│   │   │   └── config/
│   │   │       └── socket.js                # WebSocket configuration
│   │   └── server.js                        # Updated server
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── FileSelector.jsx         # File browser component
│       │   │   ├── DataViewer.jsx           # Data visualization component
│       │   │   └── VideoFileInput.jsx       # Video upload component
│       │   ├── services/
│       │   │   └── webSocketService.js      # WebSocket client service
│       │   └── pages/
│       │       └── Dashboard.jsx            # Updated dashboard
└── utils/                                   # ML processing scripts
```

## Data Format Specifications

### Detection Files (`detections_*.json`)

```json
[
  {
    "timestamp": "2025-09-30T03:23:04.586548",
    "frame": 1,
    "count": 7,
    "average_count": 7.0,
    "alert": false
  }
]
```

### Forecast Files (`forecast_*.json`)

```json
{
  "timestamp": "2025-09-30T03:23:18.967838",
  "frame": 30,
  "lstm_predictions": [12.656, 13.121, 13.733, ...],
  "linear_predictions": [13.880, 14.100, 14.320, ...],
  "window_size": 30,
  "steps": 10
}
```

## API Endpoints

### File Management

- `GET /api/results/files` - List all available files with metadata
- `GET /api/results/files/:filename` - Get contents of specific file
- `GET /api/results/latest/:type` - Get latest detection or forecast file
- `GET /api/results/stats` - Get file statistics and summary

### File Utilities

- `POST /api/results/cleanup` - Clean up old result files (optional maintenance)

## Setup Instructions

### Backend Setup

1. **Install Dependencies**

   ```bash
   cd dashboard/backend
   npm install chokidar
   ```

2. **Update Environment Variables**

   ```env
   # Add to .env file
   RESULTS_PATH=../../results
   ```

3. **Start Backend Server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install Dependencies**

   ```bash
   cd dashboard/frontend
   npm install socket.io-client date-fns recharts
   ```

2. **Configure WebSocket URL**

   ```env
   # Add to .env.local
   REACT_APP_WS_URL=http://localhost:5000
   ```

3. **Start Frontend**
   ```bash
   npm start
   ```

## Usage Guide

### 1. Integration Workflow (For External ML Systems)

1. **Process Videos Externally**

   - Use your preferred ML framework (TensorFlow, PyTorch, OpenCV, etc.)
   - Run crowd detection and forecasting models
   - Generate result files in the expected JSON format

2. **Save Results**

   - Place detection files as `detections_*.json` in the `results/` folder
   - Place forecast files as `forecast_*.json` in the `results/` folder
   - Files are automatically detected when created/modified

3. **View in Dashboard**
   - New files appear automatically in the File Selector
   - Select files to view charts and data
   - Download JSON files if needed

### 2. Dashboard Monitoring

1. **File Selector**

   - Browse available detection and forecast files
   - Filter by type (All, Detection, Forecast)
   - Auto-refreshes every 10 seconds
   - Shows file metadata (size, timestamp, frame number)

2. **Data Viewer**
   - Interactive charts for detection data (count over time, alert status)
   - Forecast comparisons (LSTM vs Linear predictions)
   - Toggle between chart and table views
   - Summary statistics and trends

### 3. WebSocket Integration

The system automatically:

- Notifies when new files are detected
- Updates file lists in real-time
- Broadcasts analysis completion status
- Synchronizes data across multiple browser sessions

## Adding New File Types

To support additional file types or data sources:

### Backend Changes

1. **Update File Watcher Service**

   ```javascript
   // In src/services/fileWatcherService.js
   isValidFile(filename) {
     return filename.match(/^(detections|forecast|newtype)_.*\.json$/) ||
            filename === 'detections.json' ||
            filename === 'forecast.json' ||
            filename === 'newtype.json';
   }
   ```

2. **Create New Data Model**

   ```javascript
   // Create src/models/NewType.js
   const mongoose = require("mongoose");

   const newTypeSchema = new mongoose.Schema({
     // Define your schema here
   });

   module.exports = mongoose.model("NewType", newTypeSchema);
   ```

3. **Add API Routes**
   ```javascript
   // In src/routes/resultRoutes.js
   router.get("/newtype/latest", async (req, res) => {
     // Implementation for new type
   });
   ```

### Frontend Changes

1. **Update File Type Detection**

   ```javascript
   // In components/FileSelector.jsx
   const getFileIcon = (type) => {
     switch (type) {
       case "detection":
         return <DetectionIcon />;
       case "forecast":
         return <ForecastIcon />;
       case "newtype":
         return <NewTypeIcon />;
       default:
         return <DefaultIcon />;
     }
   };
   ```

2. **Add Data Processing**
   ```javascript
   // In components/DataViewer.jsx
   const processNewTypeData = (data) => {
     // Process new data format for visualization
   };
   ```

## Troubleshooting

### Common Issues

1. **Files Not Appearing**

   - Check file naming convention: `detections_*.json` or `forecast_*.json`
   - Ensure files are valid JSON format
   - Verify file watcher service is running

2. **WebSocket Connection Failed**

   - Check backend server is running on correct port
   - Verify authentication token is valid
   - Check firewall/network settings

3. **Dashboard Not Updating**
   - Verify external system is writing files to correct folder
   - Check file permissions on results folder
   - Ensure WebSocket connection is established

### Debug Mode

Enable verbose logging:

```bash
# Backend
DEBUG=fileWatcher,socket npm run dev

# Frontend
REACT_APP_DEBUG=true npm start
```

## Performance Considerations

1. **File Cleanup**

   - Automatically removes old files when limit is reached
   - Configurable via `/api/results/cleanup` endpoint
   - Default: keeps 50 most recent files

2. **Memory Management**

   - File contents cached in memory for quick access
   - WebSocket connections pooled efficiently
   - Large files streamed rather than loaded entirely

3. **Scalability**
   - Supports multiple concurrent users
   - Horizontal scaling via load balancer
   - Database indexing for fast file queries

## Future Enhancements

- [ ] Real-time video streaming analysis
- [ ] Batch processing of multiple videos
- [ ] Custom alert thresholds per file type
- [ ] Export reports in multiple formats (PDF, CSV)
- [ ] Machine learning model versioning
- [ ] Cloud storage integration (AWS S3, Google Cloud)

## Support

For additional help or feature requests:

1. Check the logs for detailed error messages
2. Review the API documentation
3. Test with sample data files provided in `/examples`
4. Contact the development team with specific use cases

---

**Note**: This system is designed to be flexible and extensible. New file types, data sources, and visualization methods can be added following the patterns established in the existing code.
