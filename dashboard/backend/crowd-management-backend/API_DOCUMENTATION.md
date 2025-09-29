# Crowd Management System API Documentation

This document provides comprehensive details about the Crowd Management System API, including endpoints, request/response formats, and example usage.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header as follows:

```
Authorization: Bearer <your_token>
```

---

## User Authentication

### Register a new user

**Endpoint:** `POST /auth/register`

**Access:** Public

**Request Body:**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "viewer" // Optional, defaults to "viewer"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "5f8d0e352b...",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "viewer"
  }
}
```

### Login

**Endpoint:** `POST /auth/login`

**Access:** Public

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "5f8d0e352b...",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "viewer"
  }
}
```

### Get Current User Profile

**Endpoint:** `GET /auth/me`

**Access:** Private (requires authentication)

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "5f8d0e352b...",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "viewer",
    "lastLogin": "2025-09-28T14:25:40.123Z"
  }
}
```

---

## Crowd Data API

### Submit New Crowd Data

**Endpoint:** `POST /crowd`

**Access:** Private (requires authentication)

**Request Body:**

```json
{
  "cameraId": "Gate1",
  "timestamp": "2025-09-29T00:02:00Z", // Optional, defaults to current time
  "count": 132,
  "prediction": [105, 118, 132, 150, 173, 200],
  "alertTriggered": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "5f8d0e352b...",
    "cameraId": "Gate1",
    "timestamp": "2025-09-29T00:02:00Z",
    "count": 132,
    "prediction": [105, 118, 132, 150, 173, 200],
    "alertTriggered": true,
    "density": "medium",
    "createdAt": "2025-09-29T00:02:01.123Z",
    "updatedAt": "2025-09-29T00:02:01.123Z"
  }
}
```

### Get Latest Crowd Data

**Endpoint:** `GET /crowd/latest`

**Access:** Public with optional authentication

**Query Parameters:**

- `cameraId` (optional) - Filter by specific camera

**Response (when cameraId provided):**

```json
{
  "success": true,
  "count": 1,
  "data": {
    "_id": "5f8d0e352b...",
    "cameraId": "Gate1",
    "timestamp": "2025-09-29T00:02:00Z",
    "count": 132,
    "prediction": [105, 118, 132, 150, 173, 200],
    "alertTriggered": true,
    "density": "medium"
  }
}
```

**Response (when no cameraId provided):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "5f8d0e352b...",
      "cameraId": "Gate1",
      "timestamp": "2025-09-29T00:02:00Z",
      "count": 132,
      "prediction": [105, 118, 132, 150, 173, 200],
      "alertTriggered": true,
      "density": "medium"
    },
    {
      "_id": "5f8d0f452c...",
      "cameraId": "Gate2",
      "timestamp": "2025-09-29T00:01:30Z",
      "count": 87,
      "prediction": [85, 90, 95, 100, 110, 115],
      "alertTriggered": false,
      "density": "low"
    },
    {
      "_id": "5f8d0g567d...",
      "cameraId": "Gate3",
      "timestamp": "2025-09-29T00:01:45Z",
      "count": 215,
      "prediction": [210, 220, 240, 260, 275, 290],
      "alertTriggered": true,
      "density": "high"
    }
  ]
}
```

### Get Crowd History

**Endpoint:** `GET /crowd/history`

**Access:** Public with optional authentication

**Query Parameters:**

- `cameraId` (required) - Camera ID to fetch history for
- `limit` (optional) - Number of records to return, defaults to 100
- `startDate` (optional) - Start date for filtering (ISO format)
- `endDate` (optional) - End date for filtering (ISO format)

**Example Request:** `/crowd/history?cameraId=Gate1&limit=100`

**Response:**

```json
{
  "success": true,
  "count": 100,
  "data": [
    {
      "_id": "5f8d0e352b...",
      "cameraId": "Gate1",
      "timestamp": "2025-09-29T00:02:00Z",
      "count": 132,
      "prediction": [105, 118, 132, 150, 173, 200],
      "alertTriggered": true,
      "density": "medium"
    },
    {
      "_id": "5f8d0e352a...",
      "cameraId": "Gate1",
      "timestamp": "2025-09-29T00:01:00Z",
      "count": 120,
      "prediction": [100, 110, 120, 135, 150, 160],
      "alertTriggered": false,
      "density": "medium"
    }
    // ... more entries
  ]
}
```

---

## Alert Management API

### Create a New Alert

**Endpoint:** `POST /alerts`

**Access:** Private (requires authentication)

**Request Body:**

```json
{
  "cameraId": "Gate1",
  "timestamp": "2025-09-29T00:02:00Z", // Optional, defaults to current time
  "type": "HighCrowd",
  "message": "Crowd exceeds threshold",
  "triggeredBy": "system" // or "admin"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "5f8d0e352b...",
    "cameraId": "Gate1",
    "timestamp": "2025-09-29T00:02:00Z",
    "type": "HighCrowd",
    "message": "Crowd exceeds threshold",
    "triggeredBy": "system",
    "status": "active",
    "createdAt": "2025-09-29T00:02:01.123Z",
    "updatedAt": "2025-09-29T00:02:01.123Z"
  }
}
```

### Get All Alerts

**Endpoint:** `GET /alerts`

**Access:** Private (requires authentication)

**Query Parameters:**

- `cameraId` (optional) - Filter by camera ID
- `type` (optional) - Filter by alert type
- `status` (optional) - Filter by alert status
- `triggeredBy` (optional) - Filter by who triggered the alert
- `startDate` (optional) - Start date for filtering (ISO format)
- `endDate` (optional) - End date for filtering (ISO format)
- `page` (optional) - Page number for pagination, defaults to 1
- `limit` (optional) - Number of records per page, defaults to 20

**Example Request:** `/alerts?cameraId=Gate1&status=active&page=1&limit=10`

**Response:**

```json
{
  "success": true,
  "count": 2,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "total": 2
  },
  "data": [
    {
      "_id": "5f8d0e352b...",
      "cameraId": "Gate1",
      "timestamp": "2025-09-29T00:02:00Z",
      "type": "HighCrowd",
      "message": "Crowd exceeds threshold",
      "triggeredBy": "system",
      "status": "active",
      "crowdCount": 132
    },
    {
      "_id": "5f8d0e352c...",
      "cameraId": "Gate1",
      "timestamp": "2025-09-29T00:00:00Z",
      "type": "RapidIncrease",
      "message": "Crowd increased by 50% in 5 minutes",
      "triggeredBy": "system",
      "status": "active",
      "crowdCount": 120
    }
  ]
}
```

### Update Alert Status

**Endpoint:** `PUT /alerts/:id/status`

**Access:** Private (requires authentication)

**Request Body:**

```json
{
  "status": "acknowledged" // or "resolved", "active"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "5f8d0e352b...",
    "cameraId": "Gate1",
    "timestamp": "2025-09-29T00:02:00Z",
    "type": "HighCrowd",
    "message": "Crowd exceeds threshold",
    "triggeredBy": "system",
    "status": "acknowledged",
    "acknowledgedBy": "5f8d0a123d...",
    "acknowledgedAt": "2025-09-29T00:05:30Z"
  }
}
```

---

## Camera/Location Management API

### Register a New Camera

**Endpoint:** `POST /cameras`

**Access:** Private (requires admin role)

**Request Body:**

```json
{
  "cameraId": "Gate2",
  "location": "West Gate",
  "status": "active",
  "maxCapacity": 1000,
  "alertThreshold": 800,
  "description": "Main entrance to west wing",
  "ipAddress": "192.168.1.101",
  "coordinates": {
    "latitude": 34.0522,
    "longitude": -118.2437
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "5f8d0e352b...",
    "cameraId": "Gate2",
    "location": "West Gate",
    "status": "active",
    "maxCapacity": 1000,
    "alertThreshold": 800,
    "description": "Main entrance to west wing",
    "ipAddress": "192.168.1.101",
    "coordinates": {
      "latitude": 34.0522,
      "longitude": -118.2437
    },
    "lastUpdate": null,
    "createdAt": "2025-09-29T00:02:01.123Z",
    "updatedAt": "2025-09-29T00:02:01.123Z"
  }
}
```

### Get All Cameras

**Endpoint:** `GET /cameras`

**Access:** Private (requires authentication)

**Query Parameters:**

- `activityThreshold` (optional) - Minutes threshold for active status, defaults to 5

**Response:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "5f8d0e352b...",
      "cameraId": "Gate1",
      "location": "East Gate",
      "status": "active",
      "lastUpdate": "2025-09-29T00:02:00Z",
      "active": true,
      "maxCapacity": 1000,
      "alertThreshold": 800
    },
    {
      "_id": "5f8d0f452c...",
      "cameraId": "Gate2",
      "location": "West Gate",
      "status": "active",
      "lastUpdate": "2025-09-29T00:01:30Z",
      "active": true,
      "maxCapacity": 1000,
      "alertThreshold": 800
    },
    {
      "_id": "5f8d0g567d...",
      "cameraId": "Gate3",
      "location": "South Gate",
      "status": "inactive",
      "lastUpdate": "2025-09-28T23:30:00Z",
      "active": false,
      "maxCapacity": 1000,
      "alertThreshold": 800
    }
  ]
}
```

---

## Authority Control API

### Record an Action

**Endpoint:** `POST /actions`

**Access:** Private (requires authentication)

**Request Body:**

```json
{
  "action": "Redirect Crowd",
  "cameraId": "Gate1",
  "timestamp": "2025-09-29T01:00:00Z",
  "details": "Redirected crowd to East exit due to congestion",
  "relatedAlertId": "5f8d0e352b...", // Optional
  "crowdCountBefore": 300 // Optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "5f8d0e352b...",
    "action": "Redirect Crowd",
    "cameraId": "Gate1",
    "timestamp": "2025-09-29T01:00:00Z",
    "performedBy": "5f8d0a123d...",
    "performedByUsername": "john_doe",
    "details": "Redirected crowd to East exit due to congestion",
    "status": "completed",
    "relatedAlertId": "5f8d0e352b...",
    "crowdCountBefore": 300,
    "createdAt": "2025-09-29T01:00:01.123Z",
    "updatedAt": "2025-09-29T01:00:01.123Z"
  }
}
```

### Get Actions

**Endpoint:** `GET /actions`

**Access:** Private (requires authentication)

**Query Parameters:**

- `cameraId` (optional) - Filter by camera ID
- `action` (optional) - Filter by action type
- `performedBy` (optional) - Filter by user ID who performed the action
- `startDate` (optional) - Start date for filtering (ISO format)
- `endDate` (optional) - End date for filtering (ISO format)
- `page` (optional) - Page number for pagination, defaults to 1
- `limit` (optional) - Number of records per page, defaults to 20

**Example Request:** `/actions?cameraId=Gate1&page=1&limit=10`

**Response:**

```json
{
  "success": true,
  "count": 2,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "total": 2
  },
  "data": [
    {
      "_id": "5f8d0e352b...",
      "action": "Redirect Crowd",
      "cameraId": "Gate1",
      "timestamp": "2025-09-29T01:00:00Z",
      "performedBy": {
        "_id": "5f8d0a123d...",
        "username": "john_doe"
      },
      "details": "Redirected crowd to East exit due to congestion",
      "status": "completed",
      "effectivenessRating": 4
    },
    {
      "_id": "5f8d0e352c...",
      "action": "Make Announcement",
      "cameraId": "Gate1",
      "timestamp": "2025-09-29T00:30:00Z",
      "performedBy": {
        "_id": "5f8d0a123d...",
        "username": "john_doe"
      },
      "details": "Made announcement to use alternative exits",
      "status": "completed",
      "effectivenessRating": 3
    }
  ]
}
```

---

## WebSocket Integration (Socket.io)

The API supports real-time updates via WebSocket using Socket.io. Connect to the WebSocket server at the root URL of the API.

### Authentication for WebSocket

Include the JWT token in the auth object during connection:

```javascript
const socket = io("http://localhost:5000", {
  auth: {
    token: "your-jwt-token",
  },
});
```

### Events

#### Subscribe to Camera Alerts

```javascript
// Subscribe to a specific camera's alerts
socket.emit("subscribe-camera", "Gate1");

// Unsubscribe from a camera's alerts
socket.emit("unsubscribe-camera", "Gate1");
```

#### Receive New Alerts

```javascript
// Listen for new alerts
socket.on("new-alert", (alert) => {
  console.log("New alert received:", alert);
  // Update UI as needed
});

// Listen for alert status updates
socket.on("alert-status-update", (alert) => {
  console.log("Alert status updated:", alert);
  // Update UI as needed
});

// Listen for new actions
socket.on("new-action", (action) => {
  console.log("New action recorded:", action);
  // Update UI as needed
});
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message description",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ],
  "stack": "Error stack trace (only in development mode)"
}
```

## Sample cURL Commands

### Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "role": "viewer"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Submit Crowd Data

```bash
curl -X POST http://localhost:5000/api/crowd \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "cameraId": "Gate1",
    "timestamp": "2025-09-29T00:02:00Z",
    "count": 132,
    "prediction": [105, 118, 132, 150, 173, 200],
    "alertTriggered": true
  }'
```

### Get Latest Crowd Data

```bash
curl -X GET http://localhost:5000/api/crowd/latest \
  -H "Content-Type: application/json"
```

### Get Crowd History

```bash
curl -X GET "http://localhost:5000/api/crowd/history?cameraId=Gate1&limit=100" \
  -H "Content-Type: application/json"
```

### Create a New Alert

```bash
curl -X POST http://localhost:5000/api/alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "cameraId": "Gate1",
    "timestamp": "2025-09-29T00:02:00Z",
    "type": "HighCrowd",
    "message": "Crowd exceeds threshold",
    "triggeredBy": "system"
  }'
```
