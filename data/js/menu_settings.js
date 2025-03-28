/**
 * Settings functionality for XY-SK120
 * Mirrors firmware's menu_settings functionality
 */

// Initialize settings
export function initSettings() {
    // Set up event listeners for settings controls
    setupWifiControls();
    
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
    console.log("Using HTTP API to fetch WiFi status");
    
    // Get correct base URL
    const baseUrl = getAPIBaseUrl();
    const url = `${baseUrl}/api/wifi/status`;
    
    // Properly handle the fetch with error handling
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("WiFi status received:", data);
            updateWifiStatusDisplay(data);
        })
        .catch(err => {
            console.error("Error fetching WiFi status:", err);
            // Show error in UI
            document.getElementById('wifi-status').textContent = 'Error';
            document.getElementById('wifi-ssid').textContent = 'Connection failed';
            document.getElementById('wifi-ip').textContent = '--';
        });
}

/**
 * Helper function to get the correct API base URL
 */
function getAPIBaseUrl() {
    // Get base URL from the current window location
    const deviceIP = localStorage.getItem('selectedDeviceIP') || window.location.hostname;
    
    // Default to current location if deviceIP is 'localhost' and we're not on localhost
    if (deviceIP === 'localhost' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
        return `${window.location.protocol}//${window.location.host}`;
    }
    
    // Otherwise use the protocol from current window + deviceIP
    return `${window.location.protocol}//${deviceIP}`;
}

/**
 * Update the WiFi status UI
 */
function updateWifiStatusDisplay(data) {
    if (!data) return;
    
    const wifiStatus = document.getElementById('wifi-status');
    const wifiSsid = document.getElementById('wifi-ssid');
    const wifiIp = document.getElementById('wifi-ip');
    
    if (wifiStatus) wifiStatus.textContent = data.status || 'Unknown';
    if (wifiSsid) wifiSsid.textContent = data.ssid || 'Unknown';
    if (wifiIp) wifiIp.textContent = data.ip || '--';
}

// Reset WiFi settings
export function resetWifiSettings() {
    if (confirm('Are you sure you want to reset WiFi settings? The device will restart and create an access point for new configuration.')) {
        fetch('/api/wifi/reset', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                alert('WiFi settings reset. Device will restart. Connect to the "XY-SK120-Setup" WiFi network to configure new settings.');
            })
            .catch(error => {
                console.error('Error resetting WiFi:', error);
            });
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

// Make functions available globally
window.fetchWifiStatus = fetchWifiStatus;
window.resetWifiSettings = resetWifiSettings;
window.saveDeviceConfig = saveDeviceConfig;
