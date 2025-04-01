/**
 * Simple connectivity checker
 */

// Function to check backend connectivity
function checkBackendConnectivity() {
    console.log("Running basic connectivity check");
    
    // Create results container
    const results = {
        httpPing: false,
        websocket: false,
        errors: []
    };
    
    // Get the base URL
    const deviceIP = localStorage.getItem('selectedDeviceIP') || window.location.hostname;
    const baseUrl = `${window.location.protocol}//${deviceIP}`;
    
    // Simple check to see if WebSocket is connected
    results.websocket = window.websocketConnected && 
                        window.websocket && 
                        window.websocket.readyState === WebSocket.OPEN;
    
    // Return the results directly without additional network calls that might interfere
    return Promise.resolve(results);
}

// Simplified display function
function displayConnectivityResults(results) {
    alert(results.websocket ? 
        "WebSocket is connected" : 
        "WebSocket is disconnected - check console for details");
        
    console.log("WebSocket connection status:", results.websocket ? "Connected" : "Disconnected");
    console.log("WebSocket state:", window.websocket ? 
        ["Connecting", "Open", "Closing", "Closed"][window.websocket.readyState] : 
        "Not initialized");
}

// Simplified ping test that first checks if we're testing the currently connected device
function pingWebSocketConnection() {
    console.log("🏓 Testing WebSocket connection...");
    
    return new Promise((resolve, reject) => {
        // Check if WebSocket is defined and connected
        if (!window.websocket || window.websocket.readyState !== WebSocket.OPEN) {
            console.error("❌ WebSocket not connected. Current state:", 
                         window.websocket ? window.websocket.readyState : "undefined");
            reject(new Error("WebSocket not connected"));
            return;
        }
        
        // Try with just a basic status request (simpler and more reliable)
        if (typeof window.sendCommand === 'function') {
            console.log("📤 Testing connection with getStatus command...");
            
            // Track if we've received a response
            let responseReceived = false;
            
            // Set up a one-time listener for status response
            const statusListener = function(event) {
                const data = event.detail;
                if (data && (data.action === 'statusResponse' || data.action === 'pong')) {
                    responseReceived = true;
                    document.removeEventListener('websocket-message', statusListener);
                    clearTimeout(statusTimeout);
                    console.log("✅ Response received! Connection working correctly.");
                    resolve(true);
                }
            };
            
            // Listen for the status response
            document.addEventListener('websocket-message', statusListener);
            
            // Set timeout for response
            const statusTimeout = setTimeout(() => {
                if (!responseReceived) {
                    document.removeEventListener('websocket-message', statusListener);
                    console.log("⏱️ Response timeout, connection test failed");
                    reject(new Error("Response timeout - no response received"));
                }
            }, 5000); // Reasonable timeout
            
            // Send the status request
            const result = window.sendCommand({ 
                action: 'getStatus',
                timestamp: Date.now() // Prevent caching
            });
            
            if (!result) {
                // If send command failed
                document.removeEventListener('websocket-message', statusListener);
                clearTimeout(statusTimeout);
                console.log("❌ Failed to send command");
                reject(new Error("Failed to send command"));
            }
        } else {
            // Fallback to simple check if we can't send commands
            if (window.websocketConnected && window.websocket.readyState === WebSocket.OPEN) {
                console.log("✅ WebSocket appears to be connected (basic check)");
                resolve(true);
            } else {
                reject(new Error("WebSocket not properly connected"));
            }
        }
    });
}

// Simplified full connectivity check
async function checkFullConnectivity() {
    console.log("🔍 Running connectivity check...");
    
    const results = {
        websocket: false,
        responseTest: false,
        errors: []
    };
    
    // Check WebSocket connection status
    results.websocket = window.websocketConnected && 
                        window.websocket && 
                        window.websocket.readyState === WebSocket.OPEN;
    
    // If WebSocket seems connected, test with a command
    if (results.websocket) {
        try {
            await pingWebSocketConnection();
            results.responseTest = true;
        } catch (error) {
            console.error("Connection test failed:", error.message);
            results.errors.push(`Connection test failed: ${error.message}`);
        }
    } else {
        results.errors.push("WebSocket not connected");
    }
    
    // Display results
    displaySimplifiedResults(results);
    
    return results;
}

// Simplified results display
function displaySimplifiedResults(results) {
    console.log("📊 Connection Test Results:", results);
    
    if (results.websocket && results.responseTest) {
        alert("✅ Connection test successful! The device is connected and responding.");
    } else {
        let message = "❌ Connection test failed\n\n";
        
        if (!results.websocket) {
            message += "• WebSocket is not connected\n";
        } else if (!results.responseTest) {
            message += "• Device is not responding to commands\n";
        }
        
        if (results.errors.length > 0) {
            message += "\nErrors:\n";
            results.errors.forEach(error => {
                message += `• ${error}\n`;
            });
        }
        
        message += "\nTry refreshing the page or check your connection.";
        alert(message);
    }
}

// Make functions available globally
window.checkBackendConnectivity = checkBackendConnectivity;
window.displayConnectivityResults = displayConnectivityResults;
window.pingWebSocketConnection = pingWebSocketConnection;
window.checkFullConnectivity = checkFullConnectivity;
window.checkConnectivity = checkFullConnectivity; // Replace the old function with the more comprehensive one
