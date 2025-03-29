/**
 * WebSocket Log Viewer
 * Displays real-time WebSocket communication for debugging
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Log viewer module loaded");
    
    // Initialize global variables
    window.logsPaused = false;
    window.maxLogEntries = 1000;
    
    // Make basic functions available
    window.toggleLogViewer = toggleLogViewer;
    window.addLogMessage = addLogMessage;
    
    // Setup will be done when components finish loading
    if (document.querySelector('[data-component]')) {
        document.addEventListener('components-loaded', setupLogViewer);
    } else {
        setupLogViewer();
    }
});

// Function to add a message to the log
function addLogMessage(message, type = "info", data = null) {
    if (window.logsPaused) return;
    
    const logs = document.getElementById('logs');
    if (!logs) return;
    
    // Create log entry
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry py-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0';
    
    // Add timestamp
    const timestamp = new Date().toLocaleTimeString();
    
    // Build log entry HTML
    logEntry.innerHTML = `
        <span class="text-xs text-gray-500 dark:text-gray-400">${timestamp}</span>
        <span class="text-gray-800 dark:text-gray-200">${message}</span>
    `;
    
    // Add to log container
    logs.appendChild(logEntry);
    
    // Auto-scroll to bottom
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

// Function to toggle log viewer visibility
function toggleLogViewer() {
    console.log("Toggle log viewer called");
    
    // Simple approach - just toggle a class
    const logViewer = document.getElementById('log-viewer-overlay');
    if (!logViewer) {
        console.error("Log viewer overlay element not found");
        return;
    }
    
    logViewer.classList.toggle('translate-y-full');
}

// Setup log viewer
function setupLogViewer() {
    console.log("Setting up log viewer");
    
    // Add keyboard shortcut
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
            e.preventDefault();
            toggleLogViewer();
        }
    });
    
    // Add a test message
    setTimeout(() => {
        addLogMessage("Log viewer ready");
    }, 500);
}
