/**
 * WebSocket Service for Real-time File Updates
 *
 * Handles WebSocket connections to receive real-time updates
 * when new detection/forecast files are created or modified
 */

import io from "socket.io-client";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000; // 5 seconds
    this.listeners = new Map();
  }

  /**
   * Connect to the WebSocket server
   */
  connect(token) {
    try {
      const serverUrl = import.meta.env.VITE_WS_URL || "http://localhost:5000";

      this.socket = io(serverUrl, {
        auth: {
          token: token,
        },
        transports: ["websocket", "polling"],
        timeout: 10000,
        forceNew: true,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("[WS] Connected to server");
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Subscribe to result file updates
      this.socket.emit("subscribe-results");

      // Notify listeners about connection
      this.emit("connected");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[WS] Disconnected from server:", reason);
      this.isConnected = false;

      // Notify listeners about disconnection
      this.emit("disconnected", reason);

      // Auto-reconnect if not manually disconnected
      if (reason !== "io client disconnect") {
        this.handleReconnection();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("[WS] Connection error:", error);
      this.handleReconnection();
    });

    // File update events
    this.socket.on("fileUpdate", (event) => {
      console.log("[WS] File update received:", event);
      this.emit("fileUpdate", event);
    });

    this.socket.on("fileList", (data) => {
      console.log("[WS] File list received:", data);
      this.emit("fileList", data);
    });

    // Analysis events
    this.socket.on("analysisComplete", (data) => {
      console.log("[WS] Analysis completed:", data);
      this.emit("analysisComplete", data);
    });

    this.socket.on("analysisStarted", (data) => {
      console.log("[WS] Analysis started:", data);
      this.emit("analysisStarted", data);
    });

    this.socket.on("analysisError", (data) => {
      console.error("[WS] Analysis error:", data);
      this.emit("analysisError", data);
    });

    // Latest data events
    this.socket.on("latestDetection", (data) => {
      console.log("[WS] Latest detection received");
      this.emit("latestDetection", data);
    });

    this.socket.on("latestForecast", (data) => {
      console.log("[WS] Latest forecast received");
      this.emit("latestForecast", data);
    });
  }

  /**
   * Handle reconnection logic
   */
  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `[WS] Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        if (this.socket && !this.isConnected) {
          this.socket.connect();
        }
      }, this.reconnectInterval);
    } else {
      console.error("[WS] Max reconnection attempts reached");
      this.emit("maxReconnectAttemptsReached");
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.emit("unsubscribe-results");
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log("[WS] Manually disconnected");
    }
  }

  /**
   * Request latest detection data
   */
  requestLatestDetection() {
    if (this.socket && this.isConnected) {
      this.socket.emit("get-latest-detection");
    }
  }

  /**
   * Request latest forecast data
   */
  requestLatestForecast() {
    if (this.socket && this.isConnected) {
      this.socket.emit("get-latest-forecast");
    }
  }

  // NOTE: Video analysis request functionality removed - system now uses external ML processing

  // NOTE: Camera subscription methods removed - system now uses file-based monitoring

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `Error in WebSocket event listener for ${event}:`,
            error
          );
        }
      });
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id,
    };
  }

  /**
   * Check if connected
   */
  isSocketConnected() {
    return this.socket && this.isConnected;
  }
}

// Export singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
