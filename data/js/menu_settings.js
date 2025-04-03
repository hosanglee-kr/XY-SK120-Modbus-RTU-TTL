/**
 * Settings menu functionality for XY-SK120
 * WiFi-related code has been removed for fresh implementation
 */

// Initialize settings
export function initSettings() {
    console.log("Initializing settings module (WiFi functionality removed)");
    
    // Listen for WebSocket messages related to settings
    document.addEventListener('websocket-message', handleSettingsMessages);
}

// Handle WebSocket messages related to settings
function handleSettingsMessages(event) {
    const data = event.detail;
    
    // WiFi-specific responses handling has been removed
    
    // Handle device settings responses
    if (data.action === 'setDeviceSettingsResponse') {
        if (data.success) {
            alert('Device settings saved successfully');
        } else {
            alert(`Failed to save device settings: ${data.error || 'Unknown error'}`);
        }
    }
    
    // Handle UI settings responses
    if (data.action === 'setUISettingsResponse') {
        if (data.success) {
            alert('UI settings saved successfully');
        } else {
            alert(`Failed to save UI settings: ${data.error || 'Unknown error'}`);
        }
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
window.initSettings = initSettings;
window.saveDeviceConfig = saveDeviceConfig;

// Placeholder for WiFi functions to prevent errors
window.fetchWifiStatus = function() { return false; };
window.resetWifiSettings = function() { console.log("WiFi reset placeholder"); };