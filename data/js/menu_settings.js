import { initWifiSettings } from './wifi_settings.js';

/**
 * Settings functionality for XY-SK120
 * Mirrors firmware's menu_settings functionality
 */

// Initialize settings
export function initSettings() {
    // Set up event listeners for settings controls
    setupWifiControls();
    
    // Initialize WiFi settings
    initWifiSettings();
    
    // Listen for WebSocket messages related to settings
    document.addEventListener('websocket-message', handleSettingsMessages);
    
    // Initial WiFi status fetch
    setTimeout(fetchWifiStatus, 1000);
}

// Set up WiFi controls
function setupWifiControls() {
    const wifiRefreshBtn = document.getElementById('wifi-refresh-btn');
    if (wifiRefreshBtn) {
        wifiRefreshBtn.addEventListener('click', fetchWifiStatus);
    }
    
    const wifiResetBtn = document.getElementById('wifi-reset-btn');
    if (wifiResetBtn) {
        wifiResetBtn.addEventListener('click', resetWifiSettings);
    }
}

// Handle WebSocket messages related to settings
function handleSettingsMessages(event) {
    const data = event.detail;
    
    // Handle WiFi status responses
    if (data.action === 'wifiStatusResponse') {
        updateWifiUI(data);
    }
}

// Update WiFi UI elements
function updateWifiUI(data) {
    const wifiStatus = document.getElementById('wifi-status');
    const wifiSsid = document.getElementById('wifi-ssid');
    const wifiIp = document.getElementById('wifi-ip');
    
    if (wifiStatus) wifiStatus.textContent = data.status || 'Unknown';
    if (wifiSsid) wifiSsid.textContent = data.ssid || 'Not connected';
    if (wifiIp) wifiIp.textContent = data.ip || 'No IP';
}

// Fetch WiFi status
export function fetchWifiStatus() {
    console.log("Fetching WiFi status...");
    
    // Check if we have an active WebSocket connection first
    if (window.websocketConnected && window.websocket && window.websocket.readyState === WebSocket.OPEN) {
        console.log("Using WebSocket to fetch WiFi status");
        // Use WebSocket command if available
        window.sendCommand({ action: 'getWifiStatus' });
        return;
    }
    
    // Fallback to HTTP API if WebSocket not available
    // Remove HTTP API fallback
    console.log("WebSocket not available");
}

// Reset WiFi settings
export function resetWifiSettings() {
    if (confirm('Are you sure you want to reset WiFi settings? The device will restart and create an access point for new configuration.')) {
        window.sendCommand({ action: 'resetWifi' });
    }
}

// Save device configuration
export function saveDeviceConfig(config) {
    fetch('/api/config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Configuration saved successfully!');
            } else {
                alert('Error saving configuration: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error saving configuration:', error);
            alert('Error saving configuration. Check console for details.');
        });
}

// Save WiFi settings
export function saveWifiSettings(settings) {
    fetch('/api/wifi/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('WiFi settings saved successfully!');
            } else {
                alert('Error saving WiFi settings: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error saving WiFi settings:', error);
            alert('Error saving WiFi settings. Check console for details.');
        });
}

// Load WiFi settings
export function loadWifiSettings() {
    fetch('/api/wifi/settings')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update UI with loaded settings
                document.getElementById('wifi-ssid').value = data.settings.ssid;
                document.getElementById('wifi-password').value = data.settings.password;
            } else {
                alert('Error loading WiFi settings: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error loading WiFi settings:', error);
            alert('Error loading WiFi settings. Check console for details.');
        });
}

// Make functions available globally
window.fetchWifiStatus = fetchWifiStatus;
window.resetWifiSettings = resetWifiSettings;
window.saveDeviceConfig = saveDeviceConfig;
window.saveWifiSettings = saveWifiSettings;
window.loadWifiSettings = loadWifiSettings;
