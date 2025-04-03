/**
 * GLOBAL VARIABLES
 * This file documents and initializes all global variables used across multiple JS files.
 * IMPORTANT: Include this file BEFORE any other JS files that use these variables.
 */

// Auto-refresh timer - used across multiple files to manage refresh interval
window.autoRefreshTimer = null;

// WebSocket connection state
window.websocket = null;
window.websocketConnected = false;

// Device information
window.currentDeviceIP = null;
window.deviceName = null;

// UI state
window.darkMode = false;
window.refreshInterval = 5000; // 5 seconds default

console.log("Global variables initialized");
