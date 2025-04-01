/**
 * Basic control functionality for XY-SK120
 * Handles power, voltage, current and operating mode controls
 */

// Initialize basic controls
export function initBasicControls() {
    // Set up event listeners for basic controls
    setupPowerToggle();
    setupVoltageControls();
    setupCurrentControls();
    setupOperatingModes();
    setupKeyLockControl();
    
    // Listen for WebSocket messages related to basic controls
    document.addEventListener('websocket-message', handleBasicMessages);
    
    // Request status when connected
    document.addEventListener('websocket-connected', () => {
        console.log("✅ WebSocket connected event received, starting auto-refresh");
        requestPsuStatus();
        // Start auto-refresh when connected
        setTimeout(() => startAutoRefresh(), 500);
        // Start key lock monitor when connected
        setTimeout(() => startKeyLockStatusMonitor(), 1000);
    });
    
    // Stop auto-refresh when disconnected
    document.addEventListener('websocket-disconnected', () => {
        console.log("❌ WebSocket disconnected event received, stopping auto-refresh");
        stopAutoRefresh();
        stopKeyLockStatusMonitor();
    });
    
    // Initialize auto-refresh if already connected - with a delay
    setTimeout(() => {
        if (window.websocketConnected) {
            console.log("WebSocket already connected on init, starting auto-refresh");
            startAutoRefresh();
            startKeyLockStatusMonitor();
        } else {
            console.log("WebSocket not connected on init, waiting for connection event");
        }
    }, 1000);
    
    // Fallback: force auto-refresh after 5 seconds regardless of connection status
    setTimeout(() => {
        if (!autoRefreshTimer) {
            console.log("⚠️ Auto-refresh not started after 5 seconds, starting as fallback");
            startAutoRefresh();
        }
        
        if (!window.keyLockMonitorActive) {
            console.log("⚠️ Key lock monitor not started after 5 seconds, starting as fallback");
            startKeyLockStatusMonitor();
        }
    }, 5000);

    // Start the key lock status monitor after a delay
    setTimeout(() => {
        if (window.websocketConnected) {
            startKeyLockStatusMonitor();
        }
    }, 3000);
}

// NO REDECLARATION - use global variable instead
// let autoRefreshTimer = null;

// Setup timer reference object properly at the top of the file
let timers = {
    autoRefresh: null,
    keyLock: null
};

// Expose timers globally for debugging
window.psuTimers = timers;

// Start auto-refresh timer to update status every second - Improved with better connection readiness check
function startAutoRefresh() {
    console.log("🔄 Attempting to start auto-refresh");
    
    // Clear any existing timer first
    stopAutoRefresh();
    
    // Use our new connection readiness check
    window.whenWebsocketReady(() => {
        console.log("WebSocket ready, starting auto-refresh timer");
        
        // First do an immediate status update
        try {
            updateAllStatus();
        } catch (err) {
            console.error("Error in initial status update:", err);
        }
        
        // Set up new timer for auto-refresh - Use our timer object structure
        timers.autoRefresh = setInterval(() => {
            // Debug in case the timer is running but updates aren't happening
            console.log("⏱️ Auto-refresh tick - checking connection status:", window.websocketConnected);
            
            // Double-check that websocket is defined and connected
            if (window.websocket && window.websocket.readyState === WebSocket.OPEN) {
                console.log("Sending status update via auto-refresh");
                try {
                    updateAllStatus();
                } catch (err) {
                    console.error("Error in auto-refresh status update:", err);
                }
            } else if (window.websocketConnected) {
                // If flag says connected but socket doesn't exist or isn't open
                console.log("⚠️ websocketConnected flag is true but socket is not ready");
                window.websocketConnected = false;
                stopAutoRefresh();
                
                // Try to re-initialize websocket
                if (typeof window.initWebSocket === 'function') {
                    console.log("Attempting to reconnect WebSocket");
                    window.initWebSocket();
                    
                    // Restart auto-refresh after a delay if reconnection succeeds
                    setTimeout(() => {
                        if (window.websocketConnected) {
                            startAutoRefresh();
                        }
                    }, 2000);
                }
            } else {
                console.log("❌ WebSocket disconnected, pausing auto-refresh");
                stopAutoRefresh();
                
                // Show manual refresh buttons
                showManualRefreshButtons();
                
                // Try to reconnect
                if (typeof window.initWebSocket === 'function') {
                    console.log("Attempting to reconnect WebSocket");
                    window.initWebSocket();
                    
                    // Restart auto-refresh after a delay if reconnection succeeds
                    setTimeout(() => {
                        if (window.websocketConnected) {
                            startAutoRefresh();
                        }
                    }, 2000);
                }
            }
        }, 5000); // Update every 5 seconds
        
        // Also store in window for backward compatibility
        window.autoRefreshTimer = timers.autoRefresh;
        
        // Hide manual refresh buttons since we don't need them anymore
        hideManualRefreshButtons();
        
        // Show the auto-refresh indicator
        const indicator = document.querySelector('.auto-refresh-indicator');
        if (indicator) {
            console.log("Making auto-refresh indicator visible");
            indicator.style.display = 'flex';
        } else {
            console.warn("Auto-refresh indicator element not found");
        }
    });
}

// Stop auto-refresh timer - updated to handle all timers
function stopAutoRefresh() {
    if (timers.autoRefresh || window.autoRefreshTimer) {
        console.log("⏹️ Stopping all auto-refresh timers");
        
        if (timers.autoRefresh) {
            clearInterval(timers.autoRefresh);
            timers.autoRefresh = null;
        }
        
        if (window.autoRefreshTimer) {
            clearInterval(window.autoRefreshTimer);
            window.autoRefreshTimer = null;
        }
        
        // Also clear the key lock monitor
        stopKeyLockStatusMonitor();
        
        // Show manual refresh buttons again
        showManualRefreshButtons();
        
        // Hide the auto-refresh indicator
        const indicator = document.querySelector('.auto-refresh-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
}

// Hide manual refresh buttons when auto-refresh is active
function hideManualRefreshButtons() {
    const refreshButtons = document.querySelectorAll('#refresh-psu, #refresh-mode-btn');
    refreshButtons.forEach(btn => {
        if (btn) {
            btn.style.display = 'none';
        }
    });
}

// Show manual refresh buttons when auto-refresh is inactive
function showManualRefreshButtons() {
    const refreshButtons = document.querySelectorAll('#refresh-psu, #refresh-mode-btn');
    refreshButtons.forEach(btn => {
        if (btn) {
            btn.style.display = '';
        }
    });
}

// Set up power toggle functionality - CONSOLIDATED VERSION
function setupPowerToggle() {
    const powerToggle = document.getElementById('power-toggle');
    if (powerToggle) {
        console.log("Found power toggle element, setting up event handler");
        
        // Remove existing listeners to prevent duplicates
        const newPowerToggle = powerToggle.cloneNode(true);
        powerToggle.parentNode.replaceChild(newPowerToggle, powerToggle);
        
        // Add the change event listener
        newPowerToggle.addEventListener('change', function() {
            console.log("Power toggle changed by user to:", this.checked);
            togglePower(this.checked);
        });
        
        // Check if the toggle already has the latest state
        setTimeout(syncPowerToggleWithActualState, 1000);
    } else {
        console.error("Power toggle element not found in the DOM");
    }
}

// Central implementation of togglePower - All code should use this
export function togglePower(isOn) {
    console.log("togglePower called with:", isOn);
    
    try {
        const command = { 
            action: 'powerOutput',
            enable: isOn
        };
        console.log("Sending power command:", JSON.stringify(command));
        
        // Send the command
        const result = sendCommand(command);
        
        // Update UI for immediate feedback
        updateOutputStatusDisplay(isOn);
        
        return result;
    } catch (error) {
        console.error("Error in togglePower:", error);
        return false;
    }
}

// Function to sync the toggle with the actual device state WITHOUT changing it
function syncPowerToggleWithActualState() {
    try {
        console.log("Syncing power toggle with actual device state (read-only)");
        
        // Use getStatus instead of powerOutput to prevent sending command
        const result = sendCommand({ action: 'getStatus' });
        
        console.log("Status request sent for initializing power toggle");
        
        // The actual update will happen when the response is received via the WebSocket event
        // No need to do anything else here - the handler will update the UI
    } catch (error) {
        console.error("Error syncing power toggle state:", error);
    }
}

// Revert back to original helper function for updating output status display - REMOVE ANIMATION
function updateOutputStatusDisplay(isOn) {
    const outputStatus = document.getElementById('output-status');
    if (!outputStatus) return;
    
    // Clear all state classes first
    outputStatus.classList.remove('status-on', 'status-off', 'status-unknown', 'status-loading');
    
    // Add appropriate class for current state
    if (isOn === true) {
        outputStatus.textContent = "ON";
        outputStatus.classList.add('status-on');
    } else if (isOn === false) {
        outputStatus.textContent = "OFF";
        outputStatus.classList.add('status-off');
    } else {
        outputStatus.textContent = "--";
        outputStatus.classList.add('status-unknown');
    }
    
    // Remove the animation effect
    // No more pulse animation
}

// Single function to refresh all PSU status
export function refreshPsuStatus() {
    console.log("Refreshing PSU status");
    
    // Show loading state for both indicators
    const outputStatus = document.getElementById('output-status');
    const modeDisplay = document.getElementById('operatingModeDisplay');
    
    if (outputStatus) {
        outputStatus.classList.remove('status-on', 'status-off', 'status-unknown');
        outputStatus.classList.add('status-loading');
        outputStatus.textContent = "...";
    }
    
    if (modeDisplay) {
        modeDisplay.classList.remove('mode-cv', 'mode-cc', 'mode-cp', 'mode-unknown');
        modeDisplay.classList.add('status-loading');
        modeDisplay.textContent = "...";
    }
    
    // Request status update - both output state and mode will be handled by response
    const result = sendCommand({ action: 'getStatus' });
    
    // If request failed, restore previous state after timeout
    if (!result) {
        setTimeout(() => {
            if (outputStatus) {
                outputStatus.classList.remove('status-loading');
                outputStatus.classList.add('status-unknown');
                outputStatus.textContent = "--";
            }
            
            if (modeDisplay) {
                modeDisplay.classList.remove('status-loading');
                modeDisplay.classList.add('mode-unknown');
                modeDisplay.textContent = "--";
            }
        }, 1500);
    }
    
    return result;
}

// Set up voltage control
function setupVoltageControls() {
    const applyVoltage = document.getElementById('apply-voltage');
    const setVoltageInput = document.getElementById('voltage-preset'); // Changed to voltage-preset
    if (applyVoltage) {
        applyVoltage.addEventListener('click', function() {
            const voltage = parseFloat(setVoltageInput.value); // Changed to voltage-preset
            if (!isNaN(voltage) && voltage >= 0 && voltage <= 30) {
                sendCommand({ 
                    action: 'setVoltage', 
                    voltage: voltage 
                });
            } else {
                alert('Please enter a valid voltage (0-30V)');
            }
        });
    }
}

// Set up current control
function setupCurrentControls() {
    const applyCurrent = document.getElementById('apply-current');
    const setCurrentInput = document.getElementById('current-preset'); // Changed to current-preset
    if (applyCurrent) {
        applyCurrent.addEventListener('click', function() {
            const current = parseFloat(setCurrentInput.value); // Changed to current-preset
            if (!isNaN(current) && current >= 0 && current <= 5) {
                sendCommand({ 
                    action: 'setCurrent', 
                    current: current 
                });
            } else {
                alert('Please enter a valid current (0-5A)');
            }
        });
    }
}

// Set up operating modes (CV, CC, CP)
function setupOperatingModes() {
    // CV mode
    const applyCvBtn = document.getElementById('apply-cv');
    if (applyCvBtn) {
        applyCvBtn.addEventListener('click', () => {
            const voltage = parseFloat(document.getElementById('set-cv-voltage').value);
            if (!isNaN(voltage)) {
                setConstantVoltage(voltage);
            } else {
                alert('Please enter a valid voltage');
            }
        });
    }
    
    // CC mode
    const applyCcBtn = document.getElementById('apply-cc');
    if (applyCcBtn) {
        applyCcBtn.addEventListener('click', () => {
            const current = parseFloat(document.getElementById('set-cc-current').value);
             if (!isNaN(current)) {
                setConstantCurrent(current);
            } else {
                alert('Please enter a valid current');
            }
        });
    }
    
    // CP mode
    const applyCpBtn = document.getElementById('apply-cp');
    if (applyCpBtn) {
        applyCpBtn.addEventListener('click', () => {
            const power = parseFloat(document.getElementById('set-cp-power').value);
            if (!isNaN(power)) {
                setConstantPower(power);
            } else {
                 alert('Please enter a valid power');
            }
        });
    }
    
    // CP mode toggle
    const cpModeToggle = document.getElementById('cp-mode-toggle');
    if (cpModeToggle) {
        cpModeToggle.addEventListener('change', function() {
            console.log("CP mode toggle changed to:", this.checked);
            setConstantPowerMode(this.checked);
        });
    }
}

// Enhanced setup function with better listener management
function setupKeyLockControl() {
    const keyLock = document.getElementById('key-lock');
    if (keyLock) {
        console.log("Setting up key lock control listener");
        
        // Remove any existing listeners by cloning
        const newKeyLock = keyLock.cloneNode(true);
        keyLock.parentNode.replaceChild(newKeyLock, keyLock);
        
        // Create a handler function and store reference to it for later removal
        const changeHandler = function() {
            console.log("Key lock changed by user to:", this.checked);
            toggleKeyLock(this.checked);
        };
        
        // Store reference to the handler
        newKeyLock._changeHandler = changeHandler;
        
        // Add the event listener once
        newKeyLock.addEventListener('change', changeHandler);
        
        // Request initial key lock status once connected
        if (window.websocketConnected) {
            console.log("WebSocket connected, requesting initial key lock status");
            setTimeout(() => requestKeyLockStatus(), 500);
        }
        
        // Ensure the visual state gets updated based on the initial state
        updateKeyLockVisualState(newKeyLock.checked);
    } else {
        console.error("Key lock toggle element not found in the DOM");
    }
}

// Handle WebSocket messages related to basic controls - simplified for consistent classes
function handleBasicMessages(event) {
    const data = event.detail;
    
    // Trigger heartbeat pulse on status response
    if (data.action === 'statusResponse') {
        // Trigger heartbeat pulse using status module
        import('./status.js').then(module => {
            if (typeof module.pulseHeartbeat === 'function') {
                module.pulseHeartbeat(data);
            }
        }).catch(err => console.error('Error importing status.js:', err));
        
        // Continue with normal status response handling
        console.log("Received status response:", data);
        updateBasicUI(data);
        
        // Update power toggle state without sending commands
        if (data.outputEnabled !== undefined) {
            // ONLY update the UI, do not send commands
            updateOutputStatusDisplay(data.outputEnabled);
            
            // Update checkbox without triggering change event
            const powerToggle = document.getElementById('power-toggle');
            if (powerToggle && powerToggle.checked !== data.outputEnabled) {
                console.log("Updating power toggle to match device state:", data.outputEnabled);
                powerToggle.checked = data.outputEnabled;
            }
        }
        
        // Update CP mode toggle state if available in the status response
        if (data.cpModeEnabled !== undefined) {
            updateCpModeToggle(data.cpModeEnabled);
        }
        
        // Update operation mode if included in status - now using the imported function from status.js
        if (data.operatingMode) {
            // Call the function from status.js instead of the local one
            import('./status.js').then(module => {
                if (typeof module.updateOperatingMode === 'function') {
                    module.updateOperatingMode(data.operatingMode, data);
                }
            }).catch(err => console.error('Error importing status.js:', err));
            }
        }
    
    // Handle readings-only responses (faster updates for V/I/P)
    if (data.action === 'readingsResponse') {
        console.log("Received readings update:", data);
        
        // Update only the voltage, current, power readings
        updatePsuReadings(data);
        return;
    }
    
    // Handle power state responses
    if (data.action === 'setOutputStateResponse' || 
        data.action === 'powerOutputResponse') {
        console.log("Received power response:", data);
        const enabled = data.enabled !== undefined ? data.enabled : data.enable;
        updateOutputStatus(enabled);
    }
    
    // Handle mode responses
    if (data.action === 'operatingModeResponse' && data.success === true) {
        console.log("Received operating mode response:", data);
        const mode = data.modeCode || data.operatingMode;
        
        if (mode) {
            // For mode changes, immediately update UI since it's user-initiated
            import('./status.js').then(module => {
                if (typeof module.updateOperatingMode === 'function') {
                    module.updateOperatingMode(mode, data);
                }
            }).catch(err => console.error('Error importing status.js:', err));
            }
        }
    
    // Handle CP mode toggle responses
    if (data.action === 'setConstantPowerModeResponse' && data.success === true) {
        console.log("Received CP mode toggle response:", data);
        if (data.enabled !== undefined) {
            updateCpModeToggle(data.enabled);
        }
    }
    
    // Handle key lock responses
    if (data.action === 'setKeyLockResponse' && data.success === true) {
        console.log("Received key lock response:", data);
        if (data.locked !== undefined) {
            updateKeyLockStatus(data.locked);
        }
    }

    // Add specific handler for key lock status response
    if (data.action === 'keyLockStatusResponse') {
        console.log("Received key lock status response:", data);
        if (data.locked !== undefined) {
            updateKeyLockStatus(data.locked);
        }
    }

    // Handle status response that includes key lock state
    if (data.action === 'statusResponse' && data.keyLockEnabled !== undefined) {
        console.log("Status response includes key lock state:", data.keyLockEnabled);
        updateKeyLockStatus(data.keyLockEnabled);
    }
}

// New function to handle readings-only updates
function updatePsuReadings(data) {
    // Update voltage
    const voltageEl = document.getElementById('psu-voltage');
    if (voltageEl && data.voltage !== undefined) {
        voltageEl.textContent = parseFloat(data.voltage).toFixed(2);
    }
    
    // Update current
    const currentEl = document.getElementById('psu-current');
    if (currentEl && data.current !== undefined) {
        currentEl.textContent = parseFloat(data.current).toFixed(3);
    }
    
    // Update power
    const powerEl = document.getElementById('psu-power');
    if (powerEl && data.power !== undefined) {
        powerEl.textContent = parseFloat(data.power).toFixed(1);
    }
}

// New function to update CP mode toggle without triggering events
function updateCpModeToggle(isEnabled) {
    console.log("Updating CP mode toggle to:", isEnabled);
    const cpModeToggle = document.getElementById('cp-mode-toggle');
    if (cpModeToggle && cpModeToggle.checked !== isEnabled) {
        // Update the toggle without triggering the change event
        cpModeToggle.checked = isEnabled;
    }
}

// Update the basic UI elements with improved output state handling
function updateBasicUI(data) {
    // Update voltage
    const voltageEl = document.getElementById('psu-voltage');
    if (voltageEl && data.voltage !== undefined) {
        voltageEl.textContent = parseFloat(data.voltage).toFixed(2);
    }
    
    // Update current
    const currentEl = document.getElementById('psu-current');
    if (currentEl && data.current !== undefined) {
        currentEl.textContent = parseFloat(data.current).toFixed(3);
    }
    
    // Update power
    const powerEl = document.getElementById('psu-power');
    if (powerEl && data.power !== undefined) {
        powerEl.textContent = parseFloat(data.power).toFixed(1);
    }
    
    // Update output status - more robust handling with data validation
    if (data.outputEnabled !== undefined) {
        updateOutputStatus(!!data.outputEnabled); // Convert to boolean
    }
}

// Fix for missing output status element warning
export function updateOutputStatus(isOn) {
    const outputStatus = document.getElementById('output-status');
    // Only update if the element exists to avoid warnings
    if (outputStatus) {
        // Clear all state classes first
        outputStatus.classList.remove('status-on', 'status-off', 'status-unknown', 'status-loading');
        
        // Add appropriate class for current state
        if (isOn === true) {
            outputStatus.textContent = "ON";
            outputStatus.classList.add('status-on');
        } else if (isOn === false) {
            outputStatus.textContent = "OFF";
            outputStatus.classList.add('status-off');
        } else {
            outputStatus.textContent = "--";
            outputStatus.classList.add('status-unknown');
        }
    }
    
    // Update power toggle with proper checked state
    const powerToggle = document.getElementById('power-toggle');
    if (powerToggle && powerToggle.checked !== isOn) {
        powerToggle.checked = isOn;
    }
}

// Enhanced toggle function with better error handling and feedback
export function toggleKeyLock(shouldLock) {
    console.log("toggleKeyLock called with:", shouldLock);
    
    try {
        // Immediately update visual state to provide feedback
        updateKeyLockVisualState(shouldLock);
        
        const command = {
            action: "setKeyLock", 
            lock: shouldLock,
            timestamp: Date.now() // Add timestamp to prevent caching
        };
        console.log("Sending key lock command:", JSON.stringify(command));
        
        // Send the command
        const success = sendCommand(command);
        
        // Request status again shortly after to confirm change
        if (success) {
            setTimeout(() => requestKeyLockStatus(), 500);
        }
        
        return success;
    } catch (error) {
        console.error("Error toggling key lock:", error);
        // Reset visual state if there was an error
        setTimeout(() => requestKeyLockStatus(), 1000);
        return false;
    }
}

// Call directly from HTML button for debugging - Enhanced for data-attribute approach
export function debugOperatingMode() {
    console.log("Manual operating mode debug request");
    const modeDisplay = document.getElementById('operatingModeDisplay');
    if (modeDisplay) {
        // Store original text
        const originalText = modeDisplay.textContent;
        const originalMode = modeDisplay.getAttribute('data-mode');
        
        // Show loading state
        modeDisplay.textContent = "Requesting...";
        modeDisplay.setAttribute('data-mode', 'loading');
        
        // Create timeout to restore original state if request fails
        const timeoutId = setTimeout(() => {
            // Restore original text and data attribute
            modeDisplay.textContent = originalText;
            modeDisplay.setAttribute('data-mode', originalMode || 'unknown');
        }, 3000);
        
        // Store data for potential cleanup
        window._operatingModeRequestData = {
            originalText: originalText,
            originalMode: originalMode,
            timeoutId: timeoutId
        };
    }
    
    // Send the request
    return requestOperatingMode();
}

// Add missing functions - requestPsuStatus is referenced but not defined
export function requestPsuStatus() {
    console.log("Requesting PSU status");
    return updateAllStatus();
}

// Add missing requestOperatingMode function
export function requestOperatingMode() {
    console.log("Requesting operating mode status");
    return sendCommand({ action: 'getOperatingMode' });
}

// Add missing updateAllStatus function - improved with better error handling
export function updateAllStatus() {
    console.log("Updating all PSU status");
    
    try {
        // Check if WebSocket is connected first
        if (!window.websocket || window.websocket.readyState !== WebSocket.OPEN) {
            console.error("WebSocket not connected. Current state:", 
                          window.websocket ? window.websocket.readyState : "undefined");
            
            // Try to reconnect
            if (typeof window.initWebSocket === 'function') {
                window.initWebSocket();
            }
            
            return false;
        }
        
        // Request complete status update
        return window.sendCommand({ action: 'getStatus' });
    } catch (err) {
        console.error("Exception in updateAllStatus:", err);
        return false;
    }
}

// Add missing setConstantVoltage function
export function setConstantVoltage(voltage) {
    if (isNaN(voltage) || voltage < 0 || voltage > 30) {
        alert("Please enter a valid voltage between 0 and 30V");
        return false;
    }
    
    return sendCommand({ 
        action: "setConstantVoltage", 
        voltage: voltage 
    });
}

// Add missing setConstantCurrent function
export function setConstantCurrent(current) {
    if (isNaN(current) || current < 0 || current > 5) {
        alert("Please enter a valid current between 0 and 5A");
        return false;
    }
    
    return sendCommand({ 
        action: "setConstantCurrent", 
        current: current 
    });
}

// Add missing setConstantPower function
export function setConstantPower(power) {
    if (isNaN(power) || power < 0 || power > 120) {
        alert("Please enter a valid power between 0 and 120W");
        return false;
    }
    
    return sendCommand({ 
        action: "setConstantPower", 
        power: power 
    });
}

// Add missing setConstantPowerMode function
export function setConstantPowerMode(enable) {
    return sendCommand({ 
        action: "setConstantPowerMode", 
        enable: enable 
    });
}

// Enhanced key lock request function with debug logging
export function requestKeyLockStatus() {
    console.log("Requesting key lock status from device");
    try {
        return sendCommand({ 
            action: 'getKeyLockStatus',
            timestamp: Date.now() // Add timestamp to prevent caching
        });
    } catch (err) {
        console.error("Error requesting key lock status:", err);
        return false;
    }
}

// Track if key lock monitor is active
window.keyLockMonitorActive = false;

// Add a more frequent key lock status check interval - Make it shorter for better responsiveness
export function startKeyLockStatusMonitor() {
    if (window.keyLockMonitorActive) {
        console.log("Key lock status monitor already running");
        return;
    }
    
    console.log("Starting key lock status monitor");
    window.keyLockMonitorActive = true;
    const checkInterval = 2000; // Check every 2 seconds (reduced from 5s for quicker response)
    
    // Request status immediately
    if (window.websocketConnected) {
        requestKeyLockStatus();
    }
    
    // Create separate interval for key lock status
    const keyLockTimer = setInterval(() => {
        if (window.websocketConnected) {
            console.log("Checking key lock status...");
            requestKeyLockStatus();
        } else {
            console.log("Cannot check key lock status - WebSocket disconnected");
            // Auto-stop if disconnected for too long
            if (window.keyLockMonitorActive) {
                stopKeyLockStatusMonitor();
            }
        }
    }, checkInterval);
    
    // Store timer reference in our timer object
    timers.keyLock = keyLockTimer;
    
    return keyLockTimer;
}

// Stop key lock status monitor
export function stopKeyLockStatusMonitor() {
    window.keyLockMonitorActive = false;
    
    if (timers.keyLock) {
        clearInterval(timers.keyLock);
        timers.keyLock = null;
        console.log("Key lock status monitor stopped");
    }
}

// Make functions available globally for direct HTML access
window.requestPsuStatus = requestPsuStatus;
window.requestOperatingMode = requestOperatingMode; 
window.debugOperatingMode = debugOperatingMode;
window.setConstantVoltage = setConstantVoltage;
window.setConstantCurrent = setConstantCurrent;
window.setConstantPower = setConstantPower;
window.setConstantPowerMode = setConstantPowerMode;
window.toggleKeyLock = toggleKeyLock;
window.togglePower = togglePower;
window.refreshPsuStatus = updateAllStatus;
window.updateAllStatus = updateAllStatus;
window.startAutoRefresh = startAutoRefresh;
window.stopAutoRefresh = stopAutoRefresh;
window.requestKeyLockStatus = requestKeyLockStatus;
window.startKeyLockStatusMonitor = startKeyLockStatusMonitor;
window.stopKeyLockStatusMonitor = stopKeyLockStatusMonitor;

// Enhanced key lock status update function with improved sync handling
export function updateKeyLockStatus(isLocked) {
    console.log("updateKeyLockStatus called with:", isLocked);
    
    const keyLockToggle = document.getElementById('key-lock');
    if (keyLockToggle && keyLockToggle.checked !== isLocked) {
        console.log("Status update: Key lock is", isLocked ? "enabled" : "disabled");
        
        // Temporarily remove the change event handler to prevent infinite loops
        if (keyLockToggle._changeHandler) {
            keyLockToggle.removeEventListener('change', keyLockToggle._changeHandler);
        }
        
        // Update the toggle state
        keyLockToggle.checked = isLocked;
        
        // Re-attach the event listener after a short delay
        setTimeout(() => {
            if (keyLockToggle._changeHandler) {
                keyLockToggle.addEventListener('change', keyLockToggle._changeHandler);
            }
        }, 100);
        
        // Update visual styling of the lock toggle to reflect status
        updateKeyLockVisualState(isLocked);
    }
}

// Add function to update visual styling of the key lock toggle
function updateKeyLockVisualState(isLocked) {
    const keyLockSlider = document.querySelector('.key-lock-slider');
    if (keyLockSlider) {
        if (isLocked) {
            keyLockSlider.classList.add('locked');
            keyLockSlider.title = "Panel Keys Locked - Click to unlock";
        } else {
            keyLockSlider.classList.remove('locked');
            keyLockSlider.title = "Panel Keys Unlocked - Click to lock";
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Mode tab switcher - updated to use mode-specific active classes
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab styling - remove all possible classes first
            document.querySelectorAll('.mode-tab').forEach(t => {
                t.classList.remove('tab-active', 'tab-active-cv', 'tab-active-cc', 'tab-active-cp');
                t.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            });
            
            // Get the mode from data attribute
            const mode = this.getAttribute('data-mode');
            this.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            
            // Apply the mode-specific active class with specific colors
            if (mode === 'cv') {
                this.classList.add('tab-active-cv');
            } else if (mode === 'cc') {
                this.classList.add('tab-active-cc');
            } else if (mode === 'cp') {
                this.classList.add('tab-active-cp');
            } else {
                this.classList.add('tab-active'); // fallback
            }
            
            // Show the corresponding settings panel
            document.querySelectorAll('.mode-settings').forEach(panel => {
                panel.classList.add('hidden');
                panel.classList.remove('block');
            });
            
            document.getElementById(`${mode}-settings`).classList.remove('hidden');
            document.getElementById(`${mode}-settings`).classList.add('block');
            
            // Store the last active tab in local storage so it persists
            localStorage.setItem('lastActiveTab', mode);
        });
    });

    // Restore the last active tab from local storage when page loads
    const lastActiveTab = localStorage.getItem('lastActiveTab') || 'cv'; // Default to CV if none stored
    const tabToActivate = document.querySelector(`.mode-tab[data-mode="${lastActiveTab}"]`);
    
    if (tabToActivate) {
        // Simulate a click on the tab to restore its state
        console.log("Activating tab for mode:", lastActiveTab);
        tabToActivate.click();
    } else {
        console.warn("No tab found for mode:", lastActiveTab);
        // Default to first tab as fallback
        const firstTab = document.querySelector('.mode-tab');
        if (firstTab) firstTab.click();
    }
});