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

// Crowd Data API (Legacy - maintained for backward compatibility)
export const crowdAPI = {
  // Get latest crowd data (legacy endpoint)
  getLatest: async (locationId = null) => {
    // Support both locationId (new) and legacy cameraId for backward compatibility
    const query = locationId ? `?cameraId=${locationId}` : "";
    return apiRequest(`/crowd/latest${query}`);
  },

  // Get crowd history (legacy endpoint)
  getHistory: async (
    locationId,
    limit = 100,
    startDate = null,
    endDate = null
  ) => {
    // Use locationId but send as cameraId for legacy API compatibility
    let query = `?cameraId=${locationId}&limit=${limit}`;
    if (startDate) query += `&startDate=${startDate}`;
    if (endDate) query += `&endDate=${endDate}`;

    return apiRequest(`/crowd/history${query}`);
  },

  // Get crowd statistics (legacy endpoint)
  getStats: async (locationId, period = "day") => {
    // Use locationId but send as cameraId for legacy API compatibility
    return apiRequest(`/crowd/stats?cameraId=${locationId}&period=${period}`);
  },

  // Submit new crowd data (legacy endpoint)
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

// NOTE: Camera API removed - system now uses file-based monitoring
// Legacy support maintained through simulation

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

// File-based API functions for new system
export const resultAPI = {
  async getFiles() {
    return apiRequest("/results/files", {
      method: "GET",
      headers: getHeaders(),
    });
  },

  async getFileContents(filename) {
    return apiRequest(`/results/files/${filename}`, {
      method: "GET",
      headers: getHeaders(),
    });
  },

  async getLatest(type) {
    return apiRequest(`/results/latest/${type}`, {
      method: "GET",
      headers: getHeaders(),
    });
  },

  async getStats() {
    return apiRequest("/results/stats", {
      method: "GET",
      headers: getHeaders(),
    });
  },

  async cleanup(maxFiles = 50) {
    return apiRequest("/results/cleanup", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ maxFiles }),
    });
  },
};

// Legacy support functions updated to use file-based data
export async function fetchPeopleCount(locationId = null) {
  try {
    // Try to get latest detection file instead of location/camera data
    const data = await resultAPI.getLatest("detection");

    if (data && data.success && data.data && data.data.length > 0) {
      const latestDetection = data.data[data.data.length - 1];
      return {
        count: latestDetection.count || 0,
        timestamp: latestDetection.timestamp,
        zone: getZoneFromCount(latestDetection.count),
      };
    }

    // Fallback to default if no detection data
    return { count: 0, timestamp: new Date().toISOString(), zone: "safe" };
  } catch (error) {
    console.error("Error fetching people count from detection files:", error);
    // Fallback to legacy API if file-based fails (using locationId as legacy cameraId)
    try {
      const data = await crowdAPI.getLatest(locationId);
      return {
        count: data.data.count || 0,
        timestamp: data.data.timestamp,
        zone: getZoneFromCount(data.data.count),
      };
    } catch (legacyError) {
      console.error("Legacy API also failed:", legacyError);
      return { count: 0, timestamp: new Date().toISOString(), zone: "safe" };
    }
  }
}

export async function fetchCrowdHistory(locationId, limit = 15) {
  try {
    // Try to get latest detection file for historical data
    const data = await resultAPI.getLatest("detection");

    if (data && data.success && data.data && Array.isArray(data.data)) {
      // Take the last 'limit' items from detection data
      const recentData = data.data.slice(-limit);

      return {
        history: recentData.map((item) => ({
          time: new Date(item.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          count: item.count,
          zone: getZoneFromCount(item.count),
        })),
      };
    }

    // Fallback to empty array if no detection data
    return { history: [] };
  } catch (error) {
    console.error("Error fetching crowd history from detection files:", error);
    // Fallback to legacy API (using locationId as legacy cameraId)
    try {
      const endDate = new Date();
      const startDate = new Date(endDate - limit * 60 * 1000);

      const data = await crowdAPI.getHistory(
        locationId,
        limit,
        startDate.toISOString(),
        endDate.toISOString()
      );

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
    } catch (legacyError) {
      console.error("Legacy API also failed:", legacyError);
      return { history: [] };
    }
  }
}

export async function fetchCrowdForecast(locationId) {
  try {
    // Try to get latest forecast file instead of location/camera data
    const data = await resultAPI.getLatest("forecast");

    if (data && data.success && data.data) {
      const forecastData = data.data;

      // Use LSTM predictions as primary forecast
      if (
        forecastData.lstm_predictions &&
        Array.isArray(forecastData.lstm_predictions)
      ) {
        const forecast = forecastData.lstm_predictions.map((count, index) => ({
          in: index + 1,
          count: Math.round(count * 100) / 100, // Round to 2 decimal places
          zone: getZoneFromCount(count),
        }));

        return { forecast };
      }

      // Fallback to linear predictions if LSTM not available
      if (
        forecastData.linear_predictions &&
        Array.isArray(forecastData.linear_predictions)
      ) {
        const forecast = forecastData.linear_predictions.map(
          (count, index) => ({
            in: index + 1,
            count: Math.round(count * 100) / 100,
            zone: getZoneFromCount(count),
          })
        );

        return { forecast };
      }
    }

    // Return empty forecast if no data
    return { forecast: [] };
  } catch (error) {
    console.error("Error fetching crowd forecast from forecast files:", error);
    // Fallback to legacy API (using locationId as legacy cameraId)
    try {
      const data = await crowdAPI.getLatest(locationId);

      if (!data.data.prediction || !Array.isArray(data.data.prediction)) {
        return { forecast: [] };
      }

      const forecast = data.data.prediction.map((count, index) => {
        return {
          in: index + 1,
          count,
          zone: getZoneFromCount(count),
        };
      });

      return { forecast };
    } catch (legacyError) {
      console.error("Legacy API also failed:", legacyError);
      return { forecast: [] };
    }
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
  action: actionAPI,
  result: resultAPI, // Add new result API
  fetchPeopleCount,
  fetchCrowdHistory,
  fetchCrowdForecast,
  diagnostic, // Add diagnostic functions
};
