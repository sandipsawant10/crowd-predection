// API base URL - change this based on your backend configuration
const API_BASE_URL = "http://localhost:5000/api";

// Auth token handling
const getAuthToken = () => localStorage.getItem("authToken");
const setAuthToken = (token) => localStorage.setItem("authToken", token);
const removeAuthToken = () => localStorage.removeItem("authToken");

// Check if we have a saved token and log authentication status
console.log(
  `API Client: Authentication ${
    getAuthToken() ? "token found" : "token not found"
  }`
);

// Authentication is managed through the login process

// Headers for authenticated requests
const getHeaders = (includeAuth = true) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Generic API request function with error handling
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    // Check if there's content and try to parse it as JSON
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // For non-JSON responses, create a simple object with the text
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      // Create an enhanced error with additional response data for validation errors
      const error = new Error(data.message || "Something went wrong");
      error.status = response.status;
      error.statusText = response.statusText;
      error.data = data; // Include the full error response data

      if (data.errors) {
        error.validationErrors = data.errors;
      }

      throw error;
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  // Register a new user
  register: async (userData) => {
    return apiRequest("/auth/register", {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (credentials) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify(credentials),
    });

    if (data.token) {
      setAuthToken(data.token);
    }

    return data;
  },

  // Get current user profile
  getProfile: async () => {
    return apiRequest("/auth/me", {
      headers: getHeaders(),
    });
  },

  // Logout (client-side)
  logout: () => {
    removeAuthToken();
  },
};

// Crowd Data API
export const crowdAPI = {
  // Get latest crowd data for all cameras or specific camera
  getLatest: async (cameraId = null) => {
    const query = cameraId ? `?cameraId=${cameraId}` : "";
    return apiRequest(`/crowd/latest${query}`);
  },

  // Get crowd history for a specific camera
  getHistory: async (
    cameraId,
    limit = 100,
    startDate = null,
    endDate = null
  ) => {
    let query = `?cameraId=${cameraId}&limit=${limit}`;
    if (startDate) query += `&startDate=${startDate}`;
    if (endDate) query += `&endDate=${endDate}`;

    return apiRequest(`/crowd/history${query}`);
  },

  // Get crowd statistics
  getStats: async (cameraId, period = "day") => {
    return apiRequest(`/crowd/stats?cameraId=${cameraId}&period=${period}`);
  },

  // Submit new crowd data
  submitData: async (crowdData) => {
    return apiRequest("/crowd", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(crowdData),
    });
  },
};

// Alert API
export const alertAPI = {
  // Get all alerts with optional filtering
  getAlerts: async (filters = {}) => {
    const queryParams = new URLSearchParams();

    // Add filters to query params
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== null && filters[key] !== undefined) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/alerts?${queryString}` : "/alerts";

    return apiRequest(endpoint, {
      headers: getHeaders(),
    });
  },

  // Create a new alert
  createAlert: async (alertData) => {
    return apiRequest("/alerts", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(alertData),
    });
  },

  // Update alert status
  updateAlertStatus: async (alertId, status) => {
    return apiRequest(`/alerts/${alertId}/status`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
  },

  // Get alert statistics
  getAlertStats: async (startDate = null, endDate = null) => {
    let query = "";
    if (startDate || endDate) {
      query = "?";
      if (startDate) query += `startDate=${startDate}&`;
      if (endDate) query += `endDate=${endDate}`;
      query = query.replace(/&$/, "");
    }

    return apiRequest(`/alerts/stats${query}`, {
      headers: getHeaders(),
    });
  },
};

// Camera API
export const cameraAPI = {
  // Get all cameras
  getAllCameras: async (activityThreshold = 5) => {
    return apiRequest(`/cameras?activityThreshold=${activityThreshold}`, {
      headers: getHeaders(),
    });
  },

  // Get a specific camera by ID
  getCamera: async (cameraId) => {
    return apiRequest(`/cameras/byId/${cameraId}`, {
      headers: getHeaders(),
    });
  },

  // Register a new camera (admin only)
  registerCamera: async (cameraData) => {
    return apiRequest("/cameras", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(cameraData),
    });
  },

  // Update a camera (admin only)
  updateCamera: async (cameraId, cameraData) => {
    return apiRequest(`/cameras/${cameraId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(cameraData),
    });
  },
};

// Action API
export const actionAPI = {
  // Record a new action
  recordAction: async (actionData) => {
    return apiRequest("/actions", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(actionData),
    });
  },

  // Get all actions with optional filtering
  getActions: async (filters = {}) => {
    const queryParams = new URLSearchParams();

    // Add filters to query params
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== null && filters[key] !== undefined) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/actions?${queryString}` : "/actions";

    return apiRequest(endpoint, {
      headers: getHeaders(),
    });
  },

  // Get action statistics
  getActionStats: async (startDate = null, endDate = null) => {
    let query = "";
    if (startDate || endDate) {
      query = "?";
      if (startDate) query += `startDate=${startDate}&`;
      if (endDate) query += `endDate=${endDate}`;
      query = query.replace(/&$/, "");
    }

    return apiRequest(`/actions/stats${query}`, {
      headers: getHeaders(),
    });
  },
};

// Helper function to determine crowd density zone
function getZoneFromCount(count) {
  const criticalThreshold = 500; // You can adjust these thresholds or load from env
  const highThreshold = 200;

  if (count >= criticalThreshold) return "danger";
  if (count >= highThreshold) return "warning";
  return "safe";
}

// Legacy support functions for existing code
export async function fetchPeopleCount(cameraId = null) {
  try {
    const data = await crowdAPI.getLatest(cameraId);
    return {
      count: data.data.count || 0,
      timestamp: data.data.timestamp,
      zone: getZoneFromCount(data.data.count),
    };
  } catch (error) {
    console.error("Error fetching people count:", error);
    return { count: 0, timestamp: new Date().toISOString(), zone: "safe" };
  }
}

export async function fetchCrowdHistory(cameraId, limit = 15) {
  try {
    // Convert from minutes to proper time format
    const endDate = new Date();
    const startDate = new Date(endDate - limit * 60 * 1000);

    const data = await crowdAPI.getHistory(
      cameraId,
      limit,
      startDate.toISOString(),
      endDate.toISOString()
    );

    // Format data for chart
    return {
      history: data.data.map((item) => ({
        time: new Date(item.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        count: item.count,
        zone: getZoneFromCount(item.count),
      })),
    };
  } catch (error) {
    console.error("Error fetching crowd history:", error);
    return { history: [] };
  }
}

export async function fetchCrowdForecast(cameraId) {
  try {
    // For now, we'll use the latest crowd data which includes prediction array
    const data = await crowdAPI.getLatest(cameraId);

    if (!data.data.prediction || !Array.isArray(data.data.prediction)) {
      return { forecast: [] };
    }

    // Process the prediction data from the latest crowd data
    // The prediction array contains future values at regular intervals
    const forecast = data.data.prediction.map((count, index) => {
      // Each element is a prediction for the next "index+1" minutes
      return {
        in: index + 1,
        count,
        zone: getZoneFromCount(count),
      };
    });

    return { forecast };
  } catch (error) {
    console.error("Error fetching crowd forecast:", error);
    return { forecast: [] };
  }
}

// Diagnostic functions to check connection status
export const diagnostic = {
  // Check backend connection
  checkHealth: async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL.replace("/api", "")}/health`
      );
      const data = await response.json();
      console.log("Backend health check:", data);
      return {
        connected: true,
        data,
      };
    } catch (error) {
      console.error("Backend connection failed:", error);
      return {
        connected: false,
        error: error.message,
      };
    }
  },

  // Check if authentication is working
  checkAuth: async () => {
    try {
      // Try to get user profile with current token
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getHeaders(),
      });

      // Try to get response data
      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        console.warn("Could not parse auth response as JSON");
      }

      // A 401 response means the endpoint is working but user is not authenticated
      // This is actually an expected result when not logged in
      return {
        authenticated: response.ok,
        // If status is 401, endpoint is working correctly but requires login
        endpointWorking: response.ok || response.status === 401,
        status: response.status,
        data,
      };
    } catch (error) {
      console.error("Auth check failed:", error);
      return {
        authenticated: false,
        endpointWorking: false,
        error: error.message,
      };
    }
  },

  // Get CORS information
  checkCORS: async () => {
    try {
      // Try using GET instead of OPTIONS for CORS check
      // Some servers don't respond to preflight OPTIONS requests properly
      const response = await fetch(
        `${API_BASE_URL.replace("/api", "")}/health`,
        {
          method: "GET",
          headers: {
            Origin: window.location.origin,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        corsEnabled:
          response.headers.get("Access-Control-Allow-Origin") !== null,
        headers: {
          "Access-Control-Allow-Origin": response.headers.get(
            "Access-Control-Allow-Origin"
          ),
          "Access-Control-Allow-Methods": response.headers.get(
            "Access-Control-Allow-Methods"
          ),
          "Access-Control-Allow-Headers": response.headers.get(
            "Access-Control-Allow-Headers"
          ),
        },
      };
    } catch (error) {
      console.error("CORS check failed:", error);
      return {
        corsEnabled: false,
        error: error.message,
      };
    }
  },
};

// Export a default API object with all methods
export default {
  auth: authAPI,
  crowd: crowdAPI,
  alert: alertAPI,
  camera: cameraAPI,
  action: actionAPI,
  fetchPeopleCount,
  fetchCrowdHistory,
  fetchCrowdForecast,
  diagnostic, // Add diagnostic functions
};
