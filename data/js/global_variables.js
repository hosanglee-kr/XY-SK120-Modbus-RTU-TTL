/**
 * GLOBAL VARIABLES
 * This file documents and initializes all global variables used across multiple JS files.
 * IMPORTANT: Include this file BEFORE any other JS files that use these variables.
 */

// ================ WEBSOCKET CONNECTION ================
// WebSocket connection object
window.websocket = null;
window.websocketConnected = false;
window.isConnecting = false;
window.manualDisconnect = false;
window.manualDeviceIP = null;
window.lastWebSocketMessage = 0;
window.lastStatusResponse = 0;
window.pendingCommand = null;
window.reconnectAttempts = 0;

// Promise for WebSocket readiness
window.websocketReadyPromise = new Promise((resolve) => {
    window.resolveWebsocketReady = resolve;
});

// ================ AUTO-REFRESH TIMERS ================
// Auto-refresh timer references
window.autoRefreshTimer = null;
window.refreshInterval = 5000; // 5 seconds default

// Timer objects for different processes
window.psuTimers = {
    autoRefresh: null,
    keyLock: null
};

// Key lock monitoring
window.keyLockMonitorActive = false;

// ================ DEVICE INFORMATION ================
// Device information
window.currentDeviceIP = null;
window.deviceName = null;

// Default control settings
window.controlSettings = {
    voltage: 0,
    current: 0,
    power: 0
};

// ================ UI STATE ================
// UI state
window.darkMode = false;
window.logsPaused = false;
window.maxLogEntries = 1000;

// Module loading state for error handling
window.moduleImportErrors = {};

// Application loading states for splash screen
window.appLoadingState = {
    componentsLoaded: false,
    coreScriptsLoaded: false,
    connectionEstablished: false
};

// For operating mode request tracking
window._operatingModeRequestData = null;

// ================ UTILITY FUNCTIONS ================
/**
 * Helper function to get current device IP from various sources
 * @returns {string} The current device IP
 */
window.getCurrentDeviceIP = function() {
    return window.currentDeviceIP || 
           localStorage.getItem('selectedDeviceIP') || 
           window.location.hostname;
};

/**
 * Safe way to execute code when WebSocket is ready
 * @param {Function} callback Function to execute when WebSocket is ready
 */
window.whenWebsocketReady = function(callback) {
    if (window.websocketConnected && window.websocket && 
        window.websocket.readyState === WebSocket.OPEN) {
        // If already connected, execute immediately
        callback();
    } else {
        // Otherwise wait for connection
        window.websocketReadyPromise.then(callback);
    }
};

// Log initialization for debugging
console.log("Global variables initialized");
