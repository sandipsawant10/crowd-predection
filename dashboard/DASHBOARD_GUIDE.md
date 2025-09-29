# Dashboard Setup Instructions

## Getting Started with the Dashboard

The Smart Crowd Management dashboard provides real-time monitoring capabilities for crowd levels across multiple camera locations. This guide will help you set up and understand the dashboard.

## Initial Setup

1. **Backend Setup**

   ```bash
   cd dashboard/backend
   npm install
   cp .env.example .env   # Copy example env file and modify as needed
   npm run seed           # Add sample data to the database
   npm run dev            # Start the development server
   ```

2. **Frontend Setup**
   ```bash
   cd dashboard/frontend
   npm install
   npm run dev
   ```

## Accessing the Dashboard

Once the servers are running:

- Frontend: http://localhost:5173 (or port 3000 if using Create React App)
- Backend API: http://localhost:5000/api

## Understanding the Dashboard

### Dashboard Components

1. **Camera Selector**

   - Switch between different camera locations
   - Shows active/inactive status for each camera

2. **Crowd Count Display**

   - Real-time count of people in the selected area
   - Color-coded status (green = normal, yellow = busy, red = overcrowded)

3. **Historical Chart**

   - Shows crowd trends over the past 24 hours
   - Highlights peak times and potential issues

4. **Prediction Chart**

   - Forecasts crowd levels for the next 30 minutes
   - Based on historical patterns and current trends

5. **Alerts Log**

   - Recent alert notifications
   - Filter by severity and camera location

6. **System Health**
   - Status of cameras and backend services
   - Connection status indicators

### Using the Dashboard Effectively

1. **Monitoring Multiple Locations**

   - Use the camera selector to switch between different monitored areas
   - The overview page shows critical alerts from all cameras

2. **Responding to Alerts**

   - Click on an alert to see details and recommended actions
   - Acknowledge alerts to mark them as being handled

3. **Analyzing Trends**

   - Use the historical chart to identify patterns in crowd behavior
   - Compare weekdays vs weekends using the date selector

4. **Planning Based on Predictions**
   - Use forecast data to allocate resources proactively
   - Receive early warnings about potential overcrowding

## Troubleshooting

If you encounter issues:

1. **Data not loading**

   - Ensure the backend server is running
   - Check browser console for API errors
   - Verify MongoDB connection

2. **Charts not displaying**

   - Make sure you've selected a valid camera
   - Check if data exists for the selected timeframe

3. **Authentication issues**
   - Default admin user: admin@crowdmanagement.com / Admin123!
   - Default standard user: user@crowdmanagement.com / User123!

For further assistance, check the main README or contact the system administrator.
