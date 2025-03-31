// ...existing code...

// Update the updateAllStatus function to handle disconnected websocket
function updateAllStatus() {
    if (!wsSendSafe(JSON.stringify({ command: "get_all_status" }))) {
        // If send failed due to disconnection, handle gracefully
        displayConnectionError();
    }
}

// Add a function to display connection error to the user
function displayConnectionError() {
    // Show a visible error or status indicator in the UI
    const statusElements = document.querySelectorAll('.device-status');
    statusElements.forEach(el => {
        el.textContent = "Disconnected";
        el.style.color = "red";
    });
    
    // Optionally show a toast notification
    if (typeof showToast === 'function') {
        showToast("Connection lost. Attempting to reconnect...", "error");
    }
}

// Fix any duplicate autoRefreshTimer declarations
// If you have autoRefreshTimer defined in multiple places, make sure it's only defined once
let autoRefreshTimer; // Keep only one declaration
// ...existing code...

// Make sure auto-refresh function checks connection status
function startAutoRefresh() {
    stopAutoRefresh(); // Clear any existing timer
    autoRefreshTimer = setInterval(function() {
        if (document.visibilityState === 'visible') {
            updateAllStatus();
        }
    }, 5000); // Update every 5 seconds
}

// ...existing code...
