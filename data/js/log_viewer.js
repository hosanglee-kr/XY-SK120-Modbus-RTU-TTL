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
    
    // Build log entry HTML
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
    
    // When showing the log viewer, make sure it fills the viewport correctly
    if (logViewer.classList.contains('active')) {
        adjustLogViewerSize();
    }
};

// Function to adjust log viewer size based on viewport
function adjustLogViewerSize() {
    const logViewer = document.getElementById('log-viewer-overlay');
    const logContainer = document.getElementById('log-container');
    
    if (!logViewer || !logContainer) return;
    
    // Set height to 33.33% of viewport height
    const viewportHeight = window.innerHeight;
    const logViewerHeight = Math.floor(viewportHeight * 0.3333);
    
    logViewer.style.height = `${logViewerHeight}px`;
    
    // Adjust log container height accordingly
    const headerHeight = logViewer.querySelector('.flex.justify-between').offsetHeight;
    logContainer.style.height = `${logViewerHeight - headerHeight - 16}px`; // 16px for padding
    
    // Apply Tailwind's dark mode classes instead of CSS variables
    if (document.documentElement.classList.contains('dark')) {
        logViewer.classList.add('bg-gray-800');
        logViewer.classList.remove('bg-white');
        logContainer.classList.add('bg-gray-900');
        logContainer.classList.remove('bg-gray-100');
    } else {
        logViewer.classList.add('bg-white');
        logViewer.classList.remove('bg-gray-800');
        logContainer.classList.add('bg-gray-100');
        logContainer.classList.remove('bg-gray-900');
    }
}

// Set up window resize listener to adjust log viewer dimensions
window.addEventListener('resize', function() {
    const logViewer = document.getElementById('log-viewer-overlay');
    if (logViewer && logViewer.classList.contains('active')) {
        adjustLogViewerSize();
    }
});

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
        // Use Tailwind classes instead of CSS variables and custom styles
        logViewer.className = 'fixed inset-x-0 bottom-0 w-full bg-white dark:bg-gray-800 shadow-lg rounded-t-lg border border-gray-200 dark:border-gray-700 p-2 transform translate-y-full transition-transform duration-300 ease-in-out z-50';
        logViewer.style.height = '33.33vh'; // Still need inline style for percentage height
        
        logViewer.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center space-x-3 text-sm">
                    <h3 class="font-medium text-gray-800 dark:text-white">Logs</h3>
                    <label class="flex items-center">
                        <input id="show-timestamp" type="checkbox" checked class="form-checkbox h-3 w-3 text-blue-500">
                        <span class="ml-1 text-xs text-gray-700 dark:text-gray-300">Time</span>
                    </label>
                    <label class="flex items-center">
                        <input id="show-ip" type="checkbox" checked class="form-checkbox h-3 w-3 text-blue-500">
                        <span class="ml-1 text-xs text-gray-700 dark:text-gray-300">IPs</span>
                    </label>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="log-pause" class="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition duration-200" title="Pause">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m-7-10a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-10z"></path>
                        </svg>
                    </button>
                    <button id="log-resume" class="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition duration-200 hidden" title="Resume">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </button>
                    <button id="log-clear" class="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition duration-200" title="Clear logs">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                    <button id="log-copy" class="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition duration-200" title="Copy logs">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-10z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                        </svg>
                    </button>
                    <button id="log-close" class="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition duration-200" title="Close logs">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div id="log-container" class="w-full overflow-auto bg-gray-100 dark:bg-gray-900 rounded p-2 text-xs font-mono" style="height: calc(33.33vh - 40px);">
                <div id="logs" class="w-full"></div>
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
    const copyBtn = document.getElementById('log-copy');
    
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
    
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const logText = logs.innerText;
            navigator.clipboard.writeText(logText)
                .then(() => {
                    console.log('Logs copied to clipboard');
                    alert('Logs copied to clipboard');
                })
                .catch(err => {
                    console.error('Error copying logs: ', err);
                    alert('Failed to copy logs: ' + err);
                });
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
    
    // Add this at the end of the function:
    
    // Set up theme change listener
    document.addEventListener('theme-changed', function() {
        const logViewer = document.getElementById('log-viewer-overlay');
        if (logViewer && logViewer.classList.contains('active')) {
            adjustLogViewerSize();
        }
    });
    
    // Initial size adjustment if opened
    if (showLogs) {
        setTimeout(adjustLogViewerSize, 100);
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
