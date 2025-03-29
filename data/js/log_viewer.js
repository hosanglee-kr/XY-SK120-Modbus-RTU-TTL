/**
 * Log Viewer functionality for XY-SK120
 * Provides WebSocket logging capabilities
 */

// Immediately set up the log viewer when this script loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("Log viewer script loaded");
    setupLogViewer();
});

// State variables for log viewer
let logsEnabled = false; // Whether logging is enabled
let logsPaused = false;  // Whether logging is paused
let logsBuffer = [];     // Buffer for storing logs
const MAX_LOGS = 1000;   // Maximum number of logs to keep

/**
 * Setup log viewer controls
 */
function setupLogViewer() {
    console.log("Setting up log viewer controls");
    
    // Get all the elements we need
    const logOverlay = document.getElementById('log-viewer-overlay');
    const startButton = document.getElementById('log-start');
    const pauseButton = document.getElementById('log-pause');
    const resumeButton = document.getElementById('log-resume');
    const clearButton = document.getElementById('log-clear');
    const copyButton = document.getElementById('log-copy');
    const closeButton = document.getElementById('log-close');
    const showTimestampCheckbox = document.getElementById('show-timestamp');
    const showIpCheckbox = document.getElementById('show-ip');
    
    if (!logOverlay) {
        console.error('Log viewer overlay not found');
        return;
    }
    
    // Set up button event listeners
    if (startButton) {
        startButton.addEventListener('click', function() {
            startLogging();
            startButton.classList.add('hidden');
            pauseButton.classList.remove('hidden');
        });
    }
    
    if (pauseButton) {
        pauseButton.addEventListener('click', function() {
            pauseLogging();
            pauseButton.classList.add('hidden');
            resumeButton.classList.remove('hidden');
        });
    }
    
    if (resumeButton) {
        resumeButton.addEventListener('click', function() {
            resumeLogging();
            resumeButton.classList.add('hidden');
            pauseButton.classList.remove('hidden');
        });
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            clearLogs();
        });
    }
    
    if (copyButton) {
        copyButton.addEventListener('click', function() {
            copyLogsToClipboard();
        });
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            toggleLogViewer(false);
            
            // Update the toggle in settings if it exists
            const showLogsToggle = document.getElementById('show-logs-toggle');
            if (showLogsToggle) {
                showLogsToggle.checked = false;
            }
        });
    }
    
    if (showTimestampCheckbox || showIpCheckbox) {
        // Redraw logs when display options change
        const updateDisplayOptions = function() {
            redrawLogs();
        };
        
        showTimestampCheckbox?.addEventListener('change', updateDisplayOptions);
        showIpCheckbox?.addEventListener('change', updateDisplayOptions);
    }
    
    // Set up WebSocket message listener
    document.addEventListener('websocket-message', function(event) {
        if (logsEnabled && !logsPaused) {
            addLog(event.detail);
        }
    });
    
    // Set up WebSocket sent message listener (if implemented)
    document.addEventListener('websocket-sent', function(event) {
        if (logsEnabled && !logsPaused) {
            addLog(event.detail, true);
        }
    });
    
    console.log("Log viewer setup complete");
}

/**
 * Toggle log viewer visibility - with updated height variable and compact header
 * @param {boolean} show - Whether to show or hide the log viewer
 */
function toggleLogViewer(show) {
    console.log("toggleLogViewer called with:", show);
    const logOverlay = document.getElementById('log-viewer-overlay');
    if (!logOverlay) {
        console.error("Log viewer overlay element not found");
        return;
    }
    
    // Update the height if it's not already set correctly
    if (logOverlay.style.height !== '33.33vh') {
        logOverlay.style.height = '33.33vh';
        
        // Also update the log container height with new smaller header size
        const logContainer = document.getElementById('log-container');
        if (logContainer) {
            logContainer.style.height = 'calc(33.33vh - 40px)';
        }
    }
    
    if (show) {
        // Show log viewer with slide up animation
        logOverlay.classList.remove('translate-y-full');
        logOverlay.classList.add('active');
        
        // Start logging automatically
        startLogging();
        
        // Show pause button, hide resume button (no more start button in compact layout)
        const pauseButton = document.getElementById('log-pause');
        const resumeButton = document.getElementById('log-resume');
        
        if (pauseButton) pauseButton.classList.remove('hidden');
        if (resumeButton) resumeButton.classList.add('hidden');
    } else {
        // Hide log viewer with slide down animation
        logOverlay.classList.add('translate-y-full');
        logOverlay.classList.remove('active');
        
        // Stop logging
        stopLogging();
        
        // Reset button states
        const pauseButton = document.getElementById('log-pause');
        const resumeButton = document.getElementById('log-resume');
        
        if (pauseButton) pauseButton.classList.remove('hidden');
        if (resumeButton) resumeButton.classList.add('hidden');
    }
}

/**
 * Start logging WebSocket messages
 */
function startLogging() {
    logsEnabled = true;
    logsPaused = false;
    console.log('WebSocket logging started');
}

/**
 * Pause logging (keep existing logs)
 */
function pauseLogging() {
    logsPaused = true;
    console.log('WebSocket logging paused');
}

/**
 * Resume logging
 */
function resumeLogging() {
    logsPaused = false;
    console.log('WebSocket logging resumed');
}

/**
 * Stop logging
 */
function stopLogging() {
    logsEnabled = false;
    logsPaused = false;
    console.log('WebSocket logging stopped');
}

/**
 * Clear all logs
 */
function clearLogs() {
    logsBuffer = [];
    const logsElement = document.getElementById('logs');
    if (logsElement) {
        logsElement.innerHTML = '';
    }
    console.log('Logs cleared');
}

/**
 * Copy logs to clipboard - Enhanced for iOS Safari compatibility
 */
function copyLogsToClipboard() {
    const showTimestamp = document.getElementById('show-timestamp')?.checked || false;
    const showIp = document.getElementById('show-ip')?.checked || false;
    
    // Generate plain text version of logs
    let textLogs = '';
    logsBuffer.forEach(log => {
        let logText = '';
        
        // Add timestamp if enabled
        if (showTimestamp && log.timestamp) {
            logText += `${log.timestamp} `;
        }
        
        // Add IP addresses if enabled
        if (showIp && log.srcIp && log.dstIp) {
            logText += `(${log.srcIp} > ${log.dstIp}) `;
        }
        
        // Add message content
        logText += log.outgoing ? '>> ' + JSON.stringify(log.data) : '<< ' + JSON.stringify(log.data);
        textLogs += logText + '\n';
    });
    
    // iOS Safari compatibility approach
    const copyButton = document.getElementById('log-copy');
    const originalText = copyButton ? copyButton.textContent || copyButton.innerHTML : 'Copy';
    
    // Try the modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textLogs)
            .then(() => {
                console.log('Logs copied to clipboard using Clipboard API');
                showCopyFeedback(copyButton, originalText);
            })
            .catch(err => {
                console.error('Clipboard API failed:', err);
                // Fallback to manual copy for Safari
                safariCopyFallback(textLogs, copyButton, originalText);
            });
    } else {
        // Fallback for browsers without clipboard API support
        safariCopyFallback(textLogs, copyButton, originalText);
    }
}

/**
 * Safari-compatible fallback for copying text
 * @param {string} text - Text to copy
 * @param {HTMLElement} button - Button element for feedback
 * @param {string} originalText - Original button text
 */
function safariCopyFallback(text, button, originalText) {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';  // Avoid scrolling to bottom
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.style.left = '-9999px';
    textArea.style.top = '0px';
    
    document.body.appendChild(textArea);
    
    // Special handling for iOS Safari
    if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
        const range = document.createRange();
        range.selectNodeContents(textArea);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        textArea.setSelectionRange(0, 999999);
    } else {
        textArea.select();
    }
    
    try {
        const successful = document.execCommand('copy');
        console.log('Fallback: Copying text ' + (successful ? 'successful' : 'unsuccessful'));
        showCopyFeedback(button, originalText);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        if (button) button.textContent = 'Error!';
    }
    
    document.body.removeChild(textArea);
}

/**
 * Show a success feedback on the copy button
 * @param {HTMLElement} button - The copy button
 * @param {string} originalText - Original button text
 */
function showCopyFeedback(button, originalText) {
    if (!button) return;
    
    // Show success feedback
    if (button.tagName.toLowerCase() === 'button') {
        // Text button
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 1500);
    } else {
        // Icon button
        const originalHTML = button.innerHTML;
        button.innerHTML = '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        button.classList.add('text-success');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('text-success');
        }, 1500);
    }
}

/**
 * Add a log entry
 * @param {Object} data - The data to log
 * @param {boolean} outgoing - Whether this is an outgoing message
 */
function addLog(data, outgoing = false) {
    // Create a log entry with timestamp and data
    const log = {
        timestamp: new Date().toISOString(),
        data: data,
        outgoing: outgoing,
        srcIp: outgoing ? window.location.hostname : data.srcIP || 'unknown',
        dstIp: outgoing ? data.dstIP || 'unknown' : window.location.hostname
    };
    
    // Add to buffer (limit size)
    logsBuffer.push(log);
    if (logsBuffer.length > MAX_LOGS) {
        logsBuffer.shift(); // Remove oldest log
    }
    
    // Add to display
    appendLogToDisplay(log);
}

/**
 * Append a log entry to the display
 * @param {Object} log - The log entry to append
 */
function appendLogToDisplay(log) {
    const logsElement = document.getElementById('logs');
    if (!logsElement) return;
    
    const showTimestamp = document.getElementById('show-timestamp')?.checked || false;
    const showIp = document.getElementById('show-ip')?.checked || false;
    
    // Create log element
    const logElement = document.createElement('div');
    logElement.className = log.outgoing ? 'log-entry text-blue-600 dark:text-blue-400' : 'log-entry text-green-600 dark:text-green-400';
    
    let logText = '';
    
    // Add timestamp if enabled
    if (showTimestamp && log.timestamp) {
        const timeElement = document.createElement('span');
        timeElement.className = 'text-gray-500 dark:text-gray-400';
        timeElement.textContent = new Date(log.timestamp).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            fractionalSecondDigits: 3
        }) + ' ';
        logElement.appendChild(timeElement);
    }
    
    // Add IP addresses if enabled
    if (showIp && log.srcIp && log.dstIp) {
        const ipElement = document.createElement('span');
        ipElement.className = 'text-gray-600 dark:text-gray-300';
        ipElement.textContent = `(${log.srcIp} > ${log.dstIp}) `;
        logElement.appendChild(ipElement);
    }
    
    // Add direction indicator and data
    const dataElement = document.createElement('span');
    dataElement.textContent = (log.outgoing ? '>> ' : '<< ') + JSON.stringify(log.data);
    logElement.appendChild(dataElement);
    
    // Add to logs container
    logsElement.appendChild(logElement);
    
    // Auto-scroll to bottom
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

/**
 * Redraw all logs with current display options
 */
function redrawLogs() {
    const logsElement = document.getElementById('logs');
    if (!logsElement) return;
    
    // Clear logs display
    logsElement.innerHTML = '';
    
    // Redraw all logs
    logsBuffer.forEach(log => {
        appendLogToDisplay(log);
    });
}

// Export functions to make them globally available
window.setupLogViewer = setupLogViewer;
window.toggleLogViewer = toggleLogViewer;
window.startLogging = startLogging;
window.pauseLogging = pauseLogging;
window.resumeLogging = resumeLogging;
window.stopLogging = stopLogging;
window.clearLogs = clearLogs;
window.copyLogsToClipboard = copyLogsToClipboard;

// Add a global test function for debugging
window.showLogViewer = function() {
    toggleLogViewer(true);
};

window.hideLogViewer = function() {
    toggleLogViewer(false);
};

// Make sure setupLogViewer runs after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Setting up log viewer from DOM loaded event");
    setTimeout(setupLogViewer, 500);
});
