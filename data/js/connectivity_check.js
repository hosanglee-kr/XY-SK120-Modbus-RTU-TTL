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

// Make globally available
window.checkConnectivity = function() {
    console.log("Running simplified connectivity diagnostics...");
    checkBackendConnectivity().then(displayConnectivityResults);
};

// Make functions available globally
window.checkBackendConnectivity = checkBackendConnectivity;
window.displayConnectivityResults = displayConnectivityResults;
