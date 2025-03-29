/**
 * Debug Tools for XY-SK120
 * Provides minimal debug functionality without complex features
 */

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Debug module initialized");
    
    // Add the reconnect button functionality
    const reconnectBtn = document.getElementById('reconnect-btn');
    if (reconnectBtn) {
        reconnectBtn.addEventListener('click', function() {
            if (typeof window.initWebSocket === 'function') {
                window.initWebSocket();
                alert("WebSocket reconnection attempted");
            } else {
                alert("Reconnect function not available");
            }
        });
    }
});
