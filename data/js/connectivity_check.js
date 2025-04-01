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

// New ping test function to verify WebSocket connection
function pingWebSocketConnection() {
    console.log("🏓 Testing WebSocket connection with ping...");
    
    return new Promise((resolve, reject) => {
        // Check if WebSocket is defined and connected
        if (!window.websocket || window.websocket.readyState !== WebSocket.OPEN) {
            console.error("❌ WebSocket not connected. Current state:", 
                         window.websocket ? window.websocket.readyState : "undefined");
            reject(new Error("WebSocket not connected"));
            return;
        }
        
        // Set up timeout for ping response
        const pingTimeout = setTimeout(() => {
            document.removeEventListener('websocket-message', pongListener);
            reject(new Error("Ping timeout - no response received"));
        }, 5000);
        
        // Setup listener for pong response
        const pongListener = function(event) {
            if (event.detail && event.detail.action === 'pong') {
                console.log("✅ Received pong response! Connection working correctly.");
                clearTimeout(pingTimeout);
                document.removeEventListener('websocket-message', pongListener);
                resolve(true);
            }
        };
        
        // Listen for response
        document.addEventListener('websocket-message', pongListener);
        
        // Send ping command
        try {
            const pingCommand = { action: 'ping', timestamp: Date.now() };
            window.websocket.send(JSON.stringify(pingCommand));
            console.log("📤 Ping sent:", pingCommand);
        } catch (error) {
            clearTimeout(pingTimeout);
            document.removeEventListener('websocket-message', pongListener);
            console.error("❌ Error sending ping:", error);
            reject(error);
        }
    });
}

// Extended connectivity check that includes WebSocket ping test
async function checkFullConnectivity() {
    console.log("🔍 Running comprehensive connectivity check...");
    
    const results = {
        httpPing: false,
        websocket: false,
        websocketPing: false,
        errors: []
    };
    
    // Get the base URL
    const deviceIP = localStorage.getItem('selectedDeviceIP') || window.location.hostname;
    
    // Check WebSocket connection status
    results.websocket = window.websocketConnected && 
                        window.websocket && 
                        window.websocket.readyState === WebSocket.OPEN;
    
    // If WebSocket seems connected, test with ping
    if (results.websocket) {
        try {
            await pingWebSocketConnection();
            results.websocketPing = true;
        } catch (error) {
            console.error("WebSocket ping test failed:", error.message);
            results.errors.push(`WebSocket ping test failed: ${error.message}`);
            
            // Try to reconnect if ping fails
            if (typeof window.initWebSocket === 'function') {
                console.log("🔄 Attempting to reconnect WebSocket after failed ping test");
                window.initWebSocket();
            }
        }
    }
    
    // Try HTTP ping to see if server is responding
    try {
        const response = await fetch(`${window.location.protocol}//${deviceIP}/ping`);
        if (response.ok) {
            results.httpPing = true;
        }
    } catch (error) {
        console.error("HTTP ping failed:", error);
        results.errors.push(`HTTP ping failed: ${error.message}`);
    }
    
    // Display results
    displayConnectionResults(results);
    
    return results;
}

// Enhanced results display
function displayConnectionResults(results) {
    console.log("📊 Connection Test Results:", results);
    
    // Create a more detailed alert
    let message = "Connection Status:\n\n";
    message += `🌐 HTTP API: ${results.httpPing ? "✅ Working" : "❌ Not working"}\n`;
    message += `🔌 WebSocket Connected: ${results.websocket ? "✅ Connected" : "❌ Disconnected"}\n`;
    
    if (results.websocket) {
        message += `🏓 WebSocket Ping Test: ${results.websocketPing ? "✅ Working" : "❌ Failed"}\n`;
    }
    
    if (results.errors.length > 0) {
        message += "\nErrors:\n";
        results.errors.forEach(error => {
            message += `• ${error}\n`;
        });
        
        message += "\nRecommended Actions:\n";
        message += "1. Check if the device is powered on and connected to the network\n";
        message += "2. Verify the correct IP address is being used\n";
        message += "3. Try refreshing the page\n";
        message += "4. Check the browser console for more details";
    }
    
    alert(message);
}

// Make globally available
window.checkConnectivity = function() {
    console.log("Running simplified connectivity diagnostics...");
    checkBackendConnectivity().then(displayConnectivityResults);
};

// Make functions available globally
window.checkBackendConnectivity = checkBackendConnectivity;
window.displayConnectivityResults = displayConnectivityResults;
window.pingWebSocketConnection = pingWebSocketConnection;
window.checkFullConnectivity = checkFullConnectivity;
window.checkConnectivity = checkFullConnectivity; // Replace the old function with the more comprehensive one
