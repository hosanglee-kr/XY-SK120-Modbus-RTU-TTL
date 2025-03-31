/**
 * Connection status handler
 * Provides visual feedback on WebSocket connection status
 */

document.addEventListener('DOMContentLoaded', function() {
    // Create connection status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'connection-status';
    statusIndicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 1000;
        background: green;
        color: white;
        display: none;
    `;
    statusIndicator.textContent = 'Connected';
    document.body.appendChild(statusIndicator);
    
    // Update the connection status display
    window.updateConnectionStatus = function(isConnected) {
        if (!statusIndicator) return;
        
        if (isConnected) {
            statusIndicator.textContent = 'Connected';
            statusIndicator.style.background = 'green';
            // Hide after 3 seconds when connected
            statusIndicator.style.display = 'block';
            setTimeout(() => {
                statusIndicator.style.display = 'none';
            }, 3000);
        } else {
            statusIndicator.textContent = 'Disconnected - Reconnecting...';
            statusIndicator.style.background = 'red';
            statusIndicator.style.display = 'block';
        }
    };
    
    // Patch WebSocket events to update status indicator
    const originalWsOpen = window.ws?.onopen;
    const originalWsClose = window.ws?.onclose;
    
    if (window.ws) {
        window.ws.onopen = function(event) {
            updateConnectionStatus(true);
            if (originalWsOpen) originalWsOpen.call(window.ws, event);
        };
        
        window.ws.onclose = function(event) {
            updateConnectionStatus(false);
            if (originalWsClose) originalWsClose.call(window.ws, event);
        };
    }
    
    // Update connection status on page load
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
        updateConnectionStatus(true);
    } else {
        updateConnectionStatus(false);
    }
});

// Helper function to create toast notifications
window.showToast = function(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        background: ${type === 'error' ? '#f44336' : '#4CAF50'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 1001;
        min-width: 200px;
        text-align: center;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 500);
    }, 3000);
};
