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
     * Add a new WiFi network with priority
     * @param {string} ssid - Network SSID
     * @param {string} password - Network password
     * @param {number} priority - Network priority (lower is higher priority)
     * @returns {Promise} Resolves to success status
     */
    function addWifiNetwork(ssid, password, priority = -1) {
        return new Promise((resolve, reject) => {
            // Use the global function to wait for WebSocket readiness
            if (typeof window.whenWebsocketReady === 'function') {
                window.whenWebsocketReady(() => {
                    sendAddWifiNetworkRequest(ssid, password, priority, resolve, reject);
                });
            } else {
                // Fallback to direct check
                if (!window.websocketConnected) {
                    reject(new Error('WebSocket not connected'));
                    return;
                }
                sendAddWifiNetworkRequest(ssid, password, priority, resolve, reject);
            }
        });
    }

    // Helper function to send the add network request with priority
    function sendAddWifiNetworkRequest(ssid, password, priority, resolve, reject) {
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
        
        // Log what we're sending - helpful for debugging
        console.log(`Adding WiFi network: SSID=${ssid}, priority=${priority}`);
        
        // Send the command with priority
        const success = window.sendCommand({
            action: 'addWifiNetwork',
            ssid: ssid,
            password: password,
            priority: priority
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
     * Update WiFi network priority
     * @param {number} index - Network index to update
     * @param {number} newPriority - New priority value
     * @returns {Promise} Resolves to success status
     */
    function updateWifiPriority(index, newPriority) {
        return new Promise((resolve, reject) => {
            // Use the global function to wait for WebSocket readiness
            if (typeof window.whenWebsocketReady === 'function') {
                window.whenWebsocketReady(() => {
                    sendUpdatePriorityRequest(index, newPriority, resolve, reject);
                });
            } else {
                // Fallback to direct check
                if (!window.websocketConnected) {
                    reject(new Error('WebSocket not connected'));
                    return;
                }
                sendUpdatePriorityRequest(index, newPriority, resolve, reject);
            }
        });
    }

    // Helper function to send the update priority request
    function sendUpdatePriorityRequest(index, newPriority, resolve, reject) {
        console.log(`Sending request to update network ${index} priority to ${newPriority}`);
        
        // Create a one-time event listener for the response
        const messageHandler = function(event) {
            const data = event.detail;
            
            // Debug all incoming messages to find the response
            console.log('WebSocket message received while waiting for priority update:', data.action);
            
            if (data.action === 'updateWifiPriorityResponse') {
                // Clean up the listener
                document.removeEventListener('websocket-message', messageHandler);
                
                console.log('Received priority update response:', data);
                
                // Resolve with the success status
                resolve({
                    success: data.success,
                    error: data.error
                });
            }
        };
        
        // Add the event listener
        document.addEventListener('websocket-message', messageHandler);
        
        // Send the command with debug information
        console.log('Sending updateWifiPriority command:', { index, newPriority });
        const success = window.sendCommand({
            action: 'updateWifiPriority',
            index: index,
            priority: newPriority,
            timestamp: Date.now() // Add timestamp to prevent caching
        });
        
        // If sending fails, reject immediately
        if (!success) {
            document.removeEventListener('websocket-message', messageHandler);
            reject(new Error('Failed to send update WiFi priority request'));
        }
        
        // Set a timeout to prevent hanging - extend to 10 seconds for slower devices
        setTimeout(() => {
            document.removeEventListener('websocket-message', messageHandler);
            reject(new Error('Update WiFi priority request timeout'));
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

    // Helper function to send the load credentials request with more debugging
    function sendLoadCredentialsRequest(resolve, reject) {
        // Create a one-time event listener for the response
        const messageHandler = function(event) {
            const data = event.detail;
            
            // Debug all incoming messages to find the response
            console.log('Received WebSocket message while waiting for credentials:', data.action);
            
            if (data.action === 'loadWifiCredentialsResponse') {
                // Clean up the listener
                document.removeEventListener('websocket-message', messageHandler);
                
                console.log('Received WiFi credentials response:', data);
                
                // Parse the credentials JSON if needed
                let credentials = [];
                try {
                    if (typeof data.credentials === 'string') {
                        console.log('Credentials received as string, parsing JSON');
                        credentials = JSON.parse(data.credentials);
                    } else if (Array.isArray(data.credentials)) {
                        console.log('Credentials received as array');
                        credentials = data.credentials;
                    } else if (data.wifiCredentials) {
                        // Also check for wifiCredentials field (alternate format)
                        console.log('Using wifiCredentials field instead');
                        if (typeof data.wifiCredentials === 'string') {
                            credentials = JSON.parse(data.wifiCredentials);
                        } else {
                            credentials = data.wifiCredentials;
                        }
                    }
                    console.log('Parsed credentials:', credentials);
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
        console.log('Sending loadWifiCredentials command');
        const success = window.sendCommand({
            action: 'loadWifiCredentials',
            timestamp: Date.now() // Add timestamp to prevent caching
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
        }, 8000); // Increased timeout for slow devices
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
        updateWifiPriority,
        DEFAULT_WIFI_STATUS
    };
})();
