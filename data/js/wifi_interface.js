/**
 * Shared WiFi interface module for XY-SK120
 * Provides a standardized API for WiFi operations
 */

// Use IIFE to create a module-like scope
(function() {
    // Default WiFi status data format
    const DEFAULT_WIFI_STATUS = {
        status: 'unknown',
        ssid: '',
        ip: '--',
        rssi: 0,
        mac: ''
    };

    /**
     * Get WiFi status from the device
     * @returns {Promise} Resolves to WiFi status object
     */
    function getWifiStatus() {
        return new Promise((resolve, reject) => {
            // Use the global function to wait for WebSocket readiness
            if (typeof window.whenWebsocketReady === 'function') {
                window.whenWebsocketReady(() => {
                    // This will only execute when the WebSocket is connected
                    sendWifiStatusRequest(resolve, reject);
                });
            } else {
                // Fallback to direct check if the helper function isn't available
                if (!window.websocketConnected) {
                    reject(new Error('WebSocket not connected'));
                    return;
                }
                sendWifiStatusRequest(resolve, reject);
            }
        });
    }

    // Helper function to send the actual request after connection check
    function sendWifiStatusRequest(resolve, reject) {
        // Create a one-time event listener for the response
        const messageHandler = function(event) {
            const data = event.detail;
            if (data.action === 'wifiStatusResponse') {
                // Clean up the listener
                document.removeEventListener('websocket-message', messageHandler);
                
                // Resolve with the WiFi status data
                resolve({
                    status: data.status || 'unknown',
                    ssid: data.ssid || '',
                    ip: data.ip || '--',
                    rssi: data.rssi || 0,
                    mac: data.mac || ''
                });
            }
        };
        
        // Add the event listener
        document.addEventListener('websocket-message', messageHandler);
        
        // Send the command using the global function
        const success = window.sendCommand({
            action: 'getWifiStatus',
            timestamp: Date.now()
        });
        
        // If sending fails, reject immediately
        if (!success) {
            document.removeEventListener('websocket-message', messageHandler);
            reject(new Error('Failed to send WiFi status request'));
        }
        
        // Set a timeout to prevent hanging
        setTimeout(() => {
            document.removeEventListener('websocket-message', messageHandler);
            reject(new Error('WiFi status request timeout'));
        }, 5000);
    }

    /**
     * Add a new WiFi network
     * @param {string} ssid - Network SSID
     * @param {string} password - Network password
     * @returns {Promise} Resolves to success status
     */
    function addWifiNetwork(ssid, password) {
        return new Promise((resolve, reject) => {
            // Use the global function to wait for WebSocket readiness
            if (typeof window.whenWebsocketReady === 'function') {
                window.whenWebsocketReady(() => {
                    // This will only execute when the WebSocket is connected
                    sendAddWifiNetworkRequest(ssid, password, resolve, reject);
                });
            } else {
                // Fallback to direct check
                if (!window.websocketConnected) {
                    reject(new Error('WebSocket not connected'));
                    return;
                }
                sendAddWifiNetworkRequest(ssid, password, resolve, reject);
            }
        });
    }

    // Helper function to send the add network request
    function sendAddWifiNetworkRequest(ssid, password, resolve, reject) {
        // Create a one-time event listener for the response
        const messageHandler = function(event) {
            const data = event.detail;
            if (data.action === 'addWifiNetworkResponse' && data.ssid === ssid) {
                // Clean up the listener
                document.removeEventListener('websocket-message', messageHandler);
                
                // Resolve with the success status
                resolve({
                    success: data.success,
                    ssid: data.ssid,
                    error: data.error
                });
            }
        };
        
        // Add the event listener
        document.addEventListener('websocket-message', messageHandler);
        
        // Send the command
        const success = window.sendCommand({
            action: 'addWifiNetwork',
            ssid: ssid,
            password: password
        });
        
        // If sending fails, reject immediately
        if (!success) {
            document.removeEventListener('websocket-message', messageHandler);
            reject(new Error('Failed to send add WiFi network request'));
        }
        
        // Set a timeout to prevent hanging
        setTimeout(() => {
            document.removeEventListener('websocket-message', messageHandler);
            reject(new Error('Add WiFi network request timeout'));
        }, 10000);
    }

    /**
     * Load saved WiFi credentials
     * @returns {Promise} Resolves to array of WiFi networks
     */
    function loadWifiCredentials() {
        return new Promise((resolve, reject) => {
            // Use the global function to wait for WebSocket readiness
            if (typeof window.whenWebsocketReady === 'function') {
                window.whenWebsocketReady(() => {
                    sendLoadCredentialsRequest(resolve, reject);
                });
            } else {
                // Fallback to direct check
                if (!window.websocketConnected) {
                    reject(new Error('WebSocket not connected'));
                    return;
                }
                sendLoadCredentialsRequest(resolve, reject);
            }
        });
    }

    // Helper function to send the load credentials request
    function sendLoadCredentialsRequest(resolve, reject) {
        // Create a one-time event listener for the response
        const messageHandler = function(event) {
            const data = event.detail;
            if (data.action === 'loadWifiCredentialsResponse') {
                // Clean up the listener
                document.removeEventListener('websocket-message', messageHandler);
                
                // Parse the credentials JSON if needed
                let credentials = [];
                try {
                    if (typeof data.credentials === 'string') {
                        credentials = JSON.parse(data.credentials);
                    } else if (Array.isArray(data.credentials)) {
                        credentials = data.credentials;
                    }
                } catch (e) {
                    console.error('Error parsing WiFi credentials:', e);
                }
                
                // Resolve with the credentials
                resolve(credentials);
            }
        };
        
        // Add the event listener
        document.addEventListener('websocket-message', messageHandler);
        
        // Send the command
        const success = window.sendCommand({
            action: 'loadWifiCredentials'
        });
        
        // If sending fails, reject immediately
        if (!success) {
            document.removeEventListener('websocket-message', messageHandler);
            reject(new Error('Failed to send load WiFi credentials request'));
        }
        
        // Set a timeout to prevent hanging
        setTimeout(() => {
            document.removeEventListener('websocket-message', messageHandler);
            reject(new Error('Load WiFi credentials request timeout'));
        }, 5000);
    }

    /**
     * Reset WiFi settings
     * @returns {Promise} Resolves to success status
     */
    function resetWifi() {
        return new Promise((resolve, reject) => {
            // Use the global function to wait for WebSocket readiness
            if (typeof window.whenWebsocketReady === 'function') {
                window.whenWebsocketReady(() => {
                    sendResetWifiRequest(resolve, reject);
                });
            } else {
                // Fallback to direct check
                if (!window.websocketConnected) {
                    reject(new Error('WebSocket not connected'));
                    return;
                }
                sendResetWifiRequest(resolve, reject);
            }
        });
    }

    // Helper function to send the reset WiFi request
    function sendResetWifiRequest(resolve, reject) {
        // Create a one-time event listener for the response
        const messageHandler = function(event) {
            const data = event.detail;
            if (data.action === 'resetWifiResponse') {
                // Clean up the listener
                document.removeEventListener('websocket-message', messageHandler);
                
                // Resolve with the success status
                resolve({
                    success: data.success,
                    error: data.error
                });
            }
        };
        
        // Add the event listener
        document.addEventListener('websocket-message', messageHandler);
        
        // Send the command
        const success = window.sendCommand({
            action: 'resetWifi'
        });
        
        // If sending fails, reject immediately
        if (!success) {
            document.removeEventListener('websocket-message', messageHandler);
            reject(new Error('Failed to send reset WiFi request'));
        }
        
        // Set a timeout to prevent hanging
        setTimeout(() => {
            document.removeEventListener('websocket-message', messageHandler);
            reject(new Error('Reset WiFi request timeout'));
        }, 5000);
    }

    // Make functions available globally
    window.wifiInterface = {
        getWifiStatus,
        addWifiNetwork,
        loadWifiCredentials,
        resetWifi,
        DEFAULT_WIFI_STATUS
    };
})();
