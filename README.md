# Smart Crowd Management System

An intelligent monitoring solution for crowd management in real-time with analytics and prediction capabilities.

## Overview

This system provides real-time crowd monitoring and analytics through:

- Computer vision for crowd detection
- Real-time alerts for overcrowding situations
- Historical data analysis
- Predictive modeling for crowd forecasting
- Interactive dashboard for visualization

## Project Structure

The project consists of:

1. **Python Backend** - For data processing, AI models and analytics
2. **Node.js API** - For serving data to the dashboard
3. **React Frontend** - For visualization and monitoring

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- Python 3.8+
- npm or yarn

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/smart-crowd-management.git
cd smart-crowd-management
```

#### 2. Backend Setup

```bash
cd dashboard/backend
npm install
```

Create a `.env` file:

```
MONGODB_URI=mongodb://localhost:27017/crowd-management
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=24h
PORT=5000
```

#### 3. Seed the Database

This will populate the database with sample data including cameras, crowd measurements, and user accounts:

```bash
npm run seed
```

#### 4. Start the Backend Server

```bash
npm run dev
```

#### 5. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173 or http://localhost:3000

### Default User Credentials

After running the seed script:

**Admin User:**

- Email: admin@crowdmanagement.com
- Password: Admin123!

**Standard User:**

- Email: user@crowdmanagement.com
- Password: User123!

## Features

### Camera Management

- Add/edit/remove camera locations
- Monitor camera status and health
- View camera-specific analytics

### Real-time Monitoring

- Current crowd counts by location
- Density heatmaps
- Alert notifications

### Analytics

- Historical trends
- Peak time analysis
- Anomaly detection

### Predictions

- Short-term crowd forecasting
- Event impact modeling

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)

### Cameras

- `GET /api/cameras` - List all cameras
- `GET /api/cameras/:id` - Get camera details
- `POST /api/cameras` - Add new camera
- `PUT /api/cameras/:id` - Update camera
- `DELETE /api/cameras/:id` - Delete camera

### Crowd Data

- `GET /api/crowd/latest` - Latest crowd data for all cameras
- `GET /api/crowd/latest/:cameraId` - Latest crowd data for specific camera
- `GET /api/crowd/history/:cameraId` - Historical data for specific camera
- `POST /api/crowd` - Add new crowd data point

### Alerts

- `GET /api/alerts` - List all alerts
- `GET /api/alerts/:id` - Get alert details
- `PUT /api/alerts/:id` - Update alert status

## Development

### Adding New Features

To add new features to the dashboard:

1. Create React components in `frontend/src/components/`
2. Add API endpoints in `backend/src/routes/`
3. Implement controllers in `backend/src/controllers/`
4. Create services as needed in `backend/src/services/`

### Running Tests

```bash
# Backend tests
cd dashboard/backend
npm run test

# Frontend tests
cd dashboard/frontend
npm run test
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**

   - Ensure MongoDB is running
   - Verify connection string in `.env` file

2. **Missing Data on Dashboard**

   - Run the seed script to populate with sample data
   - Check browser console for API errors
   - Verify correct camera IDs are being referenced

3. **Authentication Issues**
   - Clear browser cookies and local storage
   - Reset user password in database if necessary

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenCV for computer vision algorithms
- TensorFlow for prediction models
- MongoDB for database
- Express for API framework
- React for frontend library
