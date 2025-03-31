// ...existing code...

// Remove or rename the duplicate autoRefreshTimer variable
// If there are two declarations, keep only one
let wsReconnectTimer = null;
const MAX_RECONNECT_DELAY = 5000;
let reconnectAttempts = 0;

function initWebSocket() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        console.log("WebSocket already connected or connecting");
        return;
    }
    
    try {
        ws = new WebSocket(`ws://${window.location.hostname}/ws`);
        
        ws.onopen = function() {
            console.log("WebSocket connected");
            reconnectAttempts = 0;
            if (wsReconnectTimer) {
                clearTimeout(wsReconnectTimer);
                wsReconnectTimer = null;
            }
            // Initialize any data needed after connection
            updateAllStatus();
        };
        
        ws.onclose = function() {
            console.log("WebSocket disconnected");
            // Implement reconnection with exponential backoff
            if (!wsReconnectTimer) {
                const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), MAX_RECONNECT_DELAY);
                reconnectAttempts++;
                console.log(`Attempting to reconnect in ${delay}ms`);
                wsReconnectTimer = setTimeout(initWebSocket, delay);
            }
        };
        
        ws.onerror = function(event) {
            console.error("WebSocket error:", event);
            // Error handling is managed by onclose handler
        };
        
        // ...existing message handling code...
    } catch (error) {
        console.error("WebSocket initialization error:", error);
        if (!wsReconnectTimer) {
            wsReconnectTimer = setTimeout(initWebSocket, 3000);
        }
    }
}

// Safe websocket send function that checks connection status first
function wsSendSafe(message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        return true;
    } else {
        console.warn("WebSocket not connected. Current state:", ws ? ws.readyState : "undefined");
        // Try to reconnect if not already attempting
        if (!wsReconnectTimer) {
            initWebSocket();
        }
        return false;
    }
}

// Replace existing ws.send calls with wsSendSafe
// ...existing code...
