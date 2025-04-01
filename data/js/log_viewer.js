/**
 * WebSocket Log Viewer
 * Displays real-time WebSocket communication for debugging
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Log viewer module loaded");
    window.setupLogViewer();
    
    // Initialize logs with message about log viewer ready
    addLogMessage("Log viewer initialized", "system");
});

// Global variable to track if logs are paused
window.logsPaused = false;

// Global variable to store the maximum number of log entries
window.maxLogEntries = 1000;

// Function to add a message to the log
window.addLogMessage = function(message, type = "info", data = null) {
    if (window.logsPaused) return;
    
    const logs = document.getElementById('logs');
    if (!logs) return;
    
    // Create log entry
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry py-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0';
    
    // Add timestamp
    const timestamp = new Date().toLocaleTimeString();
    
    // Format message based on type
    let formattedMessage = '';
    let messageClass = '';
    
    switch (type) {
        case 'send':
            messageClass = 'text-blue-600 dark:text-blue-400';
            formattedMessage = `➡️ ${message}`;
            break;
        case 'receive':
            messageClass = 'text-green-600 dark:text-green-400';
            formattedMessage = `⬅️ ${message}`;
            break;
        case 'error':
            messageClass = 'text-danger';
            formattedMessage = `❌ ${message}`;
            break;
        case 'system':
            messageClass = 'text-gray-500 dark:text-gray-400';
            formattedMessage = `ℹ️ ${message}`;
            break;
        default:
            messageClass = 'text-gray-800 dark:text-gray-200';
            formattedMessage = message;
    }
    
    // Always include timestamp in the log entry
    logEntry.innerHTML = `
        <span class="text-xs text-gray-500 dark:text-gray-400">${timestamp}</span>
        <span class="${messageClass}">${formattedMessage}</span>
    `;
    
    // Add data if provided
    if (data) {
        const dataEl = document.createElement('pre');
        dataEl.className = 'text-xs mt-1 bg-gray-100 dark:bg-gray-900 p-1 rounded overflow-x-auto';
        dataEl.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
        logEntry.appendChild(dataEl);
    }
    
    // Add to log container
    logs.appendChild(logEntry);
    
    // Limit the number of entries
    while (logs.children.length > window.maxLogEntries) {
        logs.removeChild(logs.firstChild);
    }
    
    // Auto-scroll to bottom
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
    }
};

// Function to toggle log viewer visibility
window.toggleLogViewer = function(show) {
    const logViewer = document.getElementById('log-viewer-overlay');
    if (!logViewer) return;
    
    if (show === undefined) {
        // Toggle current state
        logViewer.classList.toggle('active');
    } else if (show) {
        logViewer.classList.add('active');
    } else {
        logViewer.classList.remove('active');
    }
    
    // Store preference in localStorage
    localStorage.setItem('showLogs', logViewer.classList.contains('active') ? 'true' : 'false');
};

// Setup log viewer controls and event listeners
window.setupLogViewer = function() {
    // Add WebSocket event listeners to capture messages
    if (typeof window.addWebSocketEventListeners === 'function') {
        window.addWebSocketEventListeners();
    }
    
    // Check if the log viewer already exists
    if (!document.getElementById('log-viewer-overlay')) {
        // Create and append the log viewer to the body if it doesn't exist
        const logViewer = document.createElement('div');
        logViewer.id = 'log-viewer-overlay';
        logViewer.className = 'fixed inset-x-0 bottom-0 bg-white dark:bg-gray-800 shadow-lg rounded-t-lg border border-gray-200 dark:border-gray-700 p-2 transform translate-y-full transition duration-300 ease-in-out z-50';
        logViewer.style.height = '33.33vh';
        
        logViewer.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center space-x-3 text-sm">
                    <h3 class="font-medium text-gray-800 dark:text-white">WebSocket Logs</h3>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="log-pause" class="p-1 text-secondary" title="Pause">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m-7-10a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-10z"></path>
                        </svg>
                    </button>
                    <button id="log-resume" class="p-1 text-secondary hidden" title="Resume">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </button>
                    <button id="log-clear" class="p-1 text-gray-500" title="Clear logs">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                    <button id="log-close" class="p-1 text-gray-500" title="Close logs">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div id="log-container" class="overflow-auto bg-gray-100 dark:bg-gray-900 rounded p-2 text-xs font-mono" style="height: calc(33.33vh - 40px);">
                <div id="logs"></div>
            </div>
        `;
        
        document.body.appendChild(logViewer);
    }
    
    // Setup log viewer controls
    const logViewer = document.getElementById('log-viewer-overlay');
    const logs = document.getElementById('logs');
    
    if (!logViewer || !logs) {
        console.error("Log viewer elements not found");
        return;
    }
    
    // Set up log viewer controls
    const closeBtn = document.getElementById('log-close');
    const clearBtn = document.getElementById('log-clear');
    const pauseBtn = document.getElementById('log-pause');
    const resumeBtn = document.getElementById('log-resume');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            window.toggleLogViewer(false);
            // Also update the UI toggle if it exists
            const showLogsToggle = document.getElementById('show-logs-toggle');
            if (showLogsToggle) {
                showLogsToggle.checked = false;
            }
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            logs.innerHTML = '';
        });
    }
    
    if (pauseBtn && resumeBtn) {
        pauseBtn.addEventListener('click', function() {
            window.logsPaused = true;
            pauseBtn.classList.add('hidden');
            resumeBtn.classList.remove('hidden');
        });
        
        resumeBtn.addEventListener('click', function() {
            window.logsPaused = false;
            resumeBtn.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
        });
    }
    
    // Check localStorage for previous state
    const showLogs = localStorage.getItem('showLogs') === 'true';
    if (showLogs) {
        window.toggleLogViewer(true);
        // Also update the UI toggle if it exists
        const showLogsToggle = document.getElementById('show-logs-toggle');
        if (showLogsToggle) {
            showLogsToggle.checked = true;
        }
    }
};

// Helper function to add WebSocket event listeners
window.addWebSocketEventListeners = function() {
    // Hook into the core.js WebSocket functionality
    if (window.originalWebSocketSend) return; // Already hooked
    
    // Get the WebSocket send function
    if (typeof WebSocket !== 'undefined') {
        // Save the original WebSocket send method
        window.originalWebSocketSend = WebSocket.prototype.send;
        
        // Override the send method to log messages
        WebSocket.prototype.send = function(data) {
            // Call the original method
            window.originalWebSocketSend.call(this, data);
            
            // Log the message
            try {
                const parsedData = JSON.parse(data);
                window.addLogMessage(`Sent: ${parsedData.type || 'WebSocket message'}`, 'send', parsedData);
            } catch (e) {
                window.addLogMessage(`Sent: ${data}`, 'send');
            }
        };
        
        // Add listener for WebSocket messages
        document.addEventListener('websocket-message', function(event) {
            if (event.detail && event.detail.data) {
                try {
                    const data = event.detail.data;
                    window.addLogMessage(`Received: ${data.type || 'WebSocket message'}`, 'receive', data);
                } catch (e) {
                    window.addLogMessage(`Received: ${event.detail.data}`, 'receive');
                }
            }
        });
        
        // Add listener for WebSocket errors
        document.addEventListener('websocket-error', function(event) {
            window.addLogMessage(`WebSocket Error: ${event.detail || 'Connection error'}`, 'error');
        });
        
        // Add listener for WebSocket connection changes
        document.addEventListener('websocket-state-change', function(event) {
            if (event.detail) {
                window.addLogMessage(`WebSocket: ${event.detail}`, 'system');
            }
        });
    }
};
