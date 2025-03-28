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
    });
    
    // Stop auto-refresh when disconnected
    document.addEventListener('websocket-disconnected', () => {
        console.log("❌ WebSocket disconnected event received, stopping auto-refresh");
        stopAutoRefresh();
    });
    
    // Initialize auto-refresh if already connected - with a delay
    setTimeout(() => {
        if (window.websocketConnected) {
            console.log("WebSocket already connected on init, starting auto-refresh");
            startAutoRefresh();
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
    }, 5000);
}

// Auto-refresh timer variable
let autoRefreshTimer = null;

// Make autoRefreshTimer globally accessible for debugging
window.autoRefreshTimer = null;

// Start auto-refresh timer to update status every second
function startAutoRefresh() {
    console.log("🔄 Starting auto-refresh (5-second interval)");
    
    // Clear any existing timer first
    stopAutoRefresh();
    
    // First make sure we're really connected
    if (!window.websocketConnected) {
        console.log("⚠️ Can't start auto-refresh - WebSocket not connected");
        
        // Show manual refresh buttons since auto-refresh won't work
        showManualRefreshButtons();
        
        // Try reconnecting
        if (typeof window.initWebSocket === 'function') {
            console.log("Attempting to reconnect WebSocket");
            window.initWebSocket();
        }
        
        return;
    }
    
    // First do an immediate status update
    updateAllStatus();
    
    // Set up new timer for auto-refresh - Use window to make it accessible
    window.autoRefreshTimer = setInterval(() => {
        // Debug in case the timer is running but updates aren't happening
        console.log("⏱️ Auto-refresh tick - checking connection status:", window.websocketConnected);
        
        // Double-check that websocket is defined and connected
        if (typeof window.websocket !== 'undefined' && window.websocket && window.websocket.readyState === 1) {
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
            }
        } else {
            console.log("❌ WebSocket disconnected, pausing auto-refresh");
            stopAutoRefresh();
        }
    }, 5000); // Update every 5 seconds
    
    // Hide manual refresh buttons since we don't need them anymore
    hideManualRefreshButtons();
    
    // Show the auto-refresh indicator
    const indicator = document.querySelector('.auto-refresh-indicator');
    if (indicator) {
        console.log("Making auto-refresh indicator visible");
        indicator.style.display = 'flex';
    } else {
        console.error("Auto-refresh indicator element not found");
    }
}

// Stop auto-refresh timer
function stopAutoRefresh() {
    if (autoRefreshTimer) {
        console.log("⏹️ Stopping auto-refresh");
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
        
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

// Set up power toggle functionality - FIXED VERSION
function setupPowerToggle() {
    const powerToggle = document.getElementById('power-toggle');
    if (powerToggle) {
        console.log("Found power toggle element, setting up event handler");
        
        // IMPORTANT: Don't clone the element because it would remove the inline handler
        // Just make sure our global function works correctly
        
        // Check if the toggle already has the latest state
        setTimeout(syncPowerToggleWithActualState, 1000);
    } else {
        console.error("Power toggle element not found in the DOM");
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
    if (applyVoltage) {
        applyVoltage.addEventListener('click', function() {
            const voltage = parseFloat(document.getElementById('set-voltage').value);
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
    if (applyCurrent) {
        applyCurrent.addEventListener('click', function() {
            const current = parseFloat(document.getElementById('set-current').value);
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
            setConstantVoltage(voltage);
        });
    }
    
    // CC mode
    const applyCcBtn = document.getElementById('apply-cc');
    if (applyCcBtn) {
        applyCcBtn.addEventListener('click', () => {
            const current = parseFloat(document.getElementById('set-cc-current').value);
            setConstantCurrent(current);
        });
    }
    
    // CP mode
    const applyCpBtn = document.getElementById('apply-cp');
    if (applyCpBtn) {
        applyCpBtn.addEventListener('click', () => {
            const power = parseFloat(document.getElementById('set-cp-power').value);
            setConstantPower(power);
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

// Set up key lock control - FIXED to prevent duplicate listeners
function setupKeyLockControl() {
    const keyLock = document.getElementById('key-lock');
    if (keyLock) {
        console.log("Setting up key lock control listener");
        
        // Remove any existing listeners by cloning
        const newKeyLock = keyLock.cloneNode(true);
        keyLock.parentNode.replaceChild(newKeyLock, keyLock);
        
        // Add the event listener once
        newKeyLock.addEventListener('change', function() {
            console.log("Key lock changed to:", this.checked);
            toggleKeyLock(this.checked);
        });
    }
}

// Handle WebSocket messages related to basic controls - simplified for consistent classes
function handleBasicMessages(event) {
    const data = event.detail;
    
    // Handle basic status responses
    if (data.action === 'statusResponse') {
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
        
        // Update operation mode if included in status
        if (data.operatingMode) {
            updateOperatingMode(data.operatingMode, data.operatingModeSetValue);
        }
        
        // Update CP mode toggle state if included in status
        if (data.cpModeEnabled !== undefined) {
            const cpModeToggle = document.getElementById('cp-mode-toggle');
            if (cpModeToggle && cpModeToggle.checked !== data.cpModeEnabled) {
                console.log("Updating CP mode toggle to match device state:", data.cpModeEnabled);
                cpModeToggle.checked = data.cpModeEnabled;
            }
        }
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
        const setValue = data.setValue;
        
        if (mode) {
            updateOperatingMode(mode, setValue);
            // REMOVED: Do not automatically highlight tab based on mode responses
            // highlightActiveOperatingMode(mode);
        }
    }
    
    // Handle constant power mode response
    if (data.action === 'constantPowerModeResponse' && data.success) {
        console.log("Received CP mode response:", data);
        const enabled = data.enabled !== undefined ? data.enabled : false;
        
        // Update the CP mode toggle state
        const cpModeToggle = document.getElementById('cp-mode-toggle');
        if (cpModeToggle && cpModeToggle.checked !== enabled) {
            cpModeToggle.checked = enabled;
        }
    }
}

// New function to highlight the active operating mode tab with mode-specific colors
function highlightActiveOperatingMode(mode) {
    console.log("highlightActiveOperatingMode called with:", mode, typeof mode);
    
    if (mode === undefined || mode === null) return;
    
    // Convert numeric mode to tab mode string
    let tabMode;
    if (typeof mode === 'number') {
        // Using numeric enum values
        switch(mode) {
            case 0: tabMode = 'cv'; break; // Constant Voltage 
            case 1: tabMode = 'cc'; break; // Constant Current
            case 2: tabMode = 'cp'; break; // Constant Power
            default: tabMode = 'cv'; // Default to CV for unknown values
        }
        console.log("Converted numeric mode to tab mode:", tabMode);
    } else {
        // Using string mode (normalize to lowercase)
        tabMode = String(mode).toLowerCase();
    }
    
    console.log("Highlighting tab for mode:", tabMode);
    
    // Find the corresponding tab
    const tabs = document.querySelectorAll('.mode-tab');
    
    // First remove all possible active classes from all tabs
    tabs.forEach(t => {
        t.classList.remove('tab-active', 'tab-active-cv', 'tab-active-cc', 'tab-active-cp');
        t.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
    });
    
    // Find and highlight the correct tab with MODE-SPECIFIC STYLES
    let foundTab = false;
    tabs.forEach(tab => {
        const dataMode = tab.getAttribute('data-mode');
        
        // Match exact mode or mode name that starts with the data-mode value
        if (dataMode && (dataMode === tabMode || tabMode.startsWith(dataMode))) {
            tab.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            
            // Apply the mode-specific active class
            if (dataMode === 'cv') {
                tab.classList.add('tab-active-cv');
            } else if (dataMode === 'cc') {
                tab.classList.add('tab-active-cc');
            } else if (dataMode === 'cp') {
                tab.classList.add('tab-active-cp');
            } else {
                tab.classList.add('tab-active'); // fallback
            }
            
            console.log(`Highlighted ${dataMode} tab for mode ${mode}`);
            foundTab = true;
        }
    });
    
    // If no tab was found, default to CV tab as fallback
    if (!foundTab && tabs.length > 0) {
        const defaultTab = Array.from(tabs).find(tab => tab.getAttribute('data-mode') === 'cv');
        if (defaultTab) {
            defaultTab.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            defaultTab.classList.add('tab-active-cv');
            console.log("No matching tab found, defaulted to CV tab");
        }
    }
}

// Update operating mode display - REMOVE ANIMATION
function updateOperatingMode(mode, setValue) {
    const modeDisplay = document.getElementById('operatingModeDisplay');
    if (!modeDisplay) return;
    
    console.log(`Updating operating mode display: ${mode} with value ${setValue}`);
    
    // Clear all mode classes first
    modeDisplay.classList.remove('mode-cv', 'mode-cc', 'mode-cp', 'mode-unknown', 'status-loading');
    
    // Format display text
    let displayText = mode || "--";
    
    if (setValue !== undefined) {
        if (mode === 'CV') {
            displayText += ' ' + parseFloat(setValue).toFixed(2) + 'V';
        } else if (mode === 'CC') {
            displayText += ' ' + parseFloat(setValue).toFixed(3) + 'A';
        } else if (mode === 'CP') {
            displayText += ' ' + parseFloat(setValue).toFixed(1) + 'W';
        }
    }
    
    // Update text and apply appropriate class
    modeDisplay.textContent = displayText;
    
    if (mode === 'CV') {
        modeDisplay.classList.add('mode-cv');
    } else if (mode === 'CC') {
        modeDisplay.classList.add('mode-cc');
    } else if (mode === 'CP') {
        modeDisplay.classList.add('mode-cp');
    } else {
        modeDisplay.classList.add('mode-unknown');
    }
    
    // Remove the animation effect
    // No more pulse animation
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

// Update output status display - IMPROVED AND SIMPLIFIED VERSION
function updateOutputStatus(enabled) {
    console.log("Updating output status UI to:", enabled ? "ON" : "OFF");
    
    // Update output status display
    updateOutputStatusDisplay(enabled);
    
    // Update power toggle with proper checked state
    const powerToggle = document.getElementById('power-toggle');
    if (powerToggle) {
        console.log("Setting power toggle checkbox to:", enabled);
        // Only update if the state doesn't match to avoid triggering the change event
        if (powerToggle.checked !== enabled) {
            powerToggle.checked = enabled;
        }
    }
}

// SIMPLIFIED - Remove backward compatibility code
export function togglePower(isOn) {
    console.log("togglePower called with:", isOn);
    
    // Check if this is triggered by user or initial load
    const eventType = window.event ? window.event.type : null;
    
    // If this is triggered programmatically during initialization, don't send command
    if (!eventType && document.readyState !== 'complete') {
        console.log("Skipping automatic power toggle during page load");
        return false;
    }
    
    // Make sure we have a valid connection and command function
    if (typeof sendCommand !== 'function') {
        console.error("sendCommand function is not available");
        alert("Error: Connection to device not established");
        return false;
    }
    
    try {
        // Use the CORRECT action and parameter names
        const command = { 
            action: 'powerOutput',
            enable: isOn
        };
        console.log("Sending power command:", JSON.stringify(command));
        
        // Send the command
        const result = sendCommand(command);
        console.log("Power command send result:", result);
        
        // Update the UI immediately for feedback
        updateOutputStatusDisplay(isOn);
        
        // Request a comprehensive status update after a delay to confirm the change
        setTimeout(updateAllStatus, 500);
        
        return result;
    } catch (error) {
        console.error("Error in togglePower:", error);
        alert("Failed to toggle power: " + (error.message || "Unknown error"));
        
        // Sync with actual state after error
        setTimeout(syncPowerToggleWithActualState, 1000);
        return false;
    }
}

// Deprecated - Keep for reference but no longer used
export function requestPsuStatus() {
    console.log("DEPRECATED: requestPsuStatus called. Use updateAllStatus instead.");
    return updateAllStatus();
}

// Deprecated - Keep for reference but no longer used
export function requestOperatingMode() {
    console.log("DEPRECATED: requestOperatingMode called. Operating mode is included in updateAllStatus.");
    return sendCommand({ action: 'getOperatingMode' });
}

// Simplified updateAllStatus function
export function updateAllStatus() {
    console.log("📊 Updating all PSU status");
    
    // Show loading state for indicators
    const outputStatus = document.getElementById('output-status');
    const modeDisplay = document.getElementById('operatingModeDisplay');
    
    if (outputStatus) {
        outputStatus.classList.remove('status-on', 'status-off', 'status-unknown');
        outputStatus.classList.add('status-loading');
        outputStatus.textContent = "...";
    } else {
        console.warn("Output status element not found");
    }
    
    if (modeDisplay) {
        modeDisplay.classList.remove('mode-cv', 'mode-cc', 'mode-cp', 'mode-unknown');
        modeDisplay.classList.add('status-loading');
        modeDisplay.textContent = "...";
    } else {
        console.warn("Operating mode display element not found");
    }
    
    try {
        // Ensure sendCommand is available
        if (typeof window.sendCommand !== 'function') {
            console.error("❌ sendCommand function is not available on window");
            handleFailedStatusRequest(outputStatus, modeDisplay);
            return false;
        }
        
        // Request complete status update
        const result = window.sendCommand({ action: 'getStatus' });
        
        // Handle failed status request
        if (!result) {
            console.error("Failed to send status request - sendCommand returned false");
            handleFailedStatusRequest(outputStatus, modeDisplay);
            return false;
        }
        
        console.log("Status request sent successfully");
        return true;
    } catch (err) {
        console.error("Exception in updateAllStatus:", err);
        handleFailedStatusRequest(outputStatus, modeDisplay);
        return false;
    }
}

// Helper function to handle failed status requests
function handleFailedStatusRequest(outputStatus, modeDisplay) {
    console.error("Failed to send status request");
    setTimeout(() => {
        if (outputStatus && outputStatus.classList.contains('status-loading')) {
            outputStatus.classList.remove('status-loading');
            outputStatus.classList.add('status-unknown');
            outputStatus.textContent = "--";
        }
        
        if (modeDisplay && modeDisplay.classList.contains('status-loading')) {
            modeDisplay.classList.remove('status-loading');
            modeDisplay.classList.add('mode-unknown');
            modeDisplay.textContent = "--";
        }
    }, 1500);
}

// Set Constant Voltage (CV) mode - Simplified to use only updateAllStatus
export function setConstantVoltage(voltage) {
    if (isNaN(voltage) || voltage < 0 || voltage > 30) {
        alert("Please enter a valid voltage between 0 and 30V");
        return false;
    }
    
    const result = sendCommand({ 
        action: "setConstantVoltage", 
        voltage: voltage 
    });
    
    // Request a comprehensive status update
    if (result) {
        setTimeout(updateAllStatus, 300);
    }
    
    return result;
}

// Set Constant Current (CC) mode - Simplified to use only updateAllStatus
export function setConstantCurrent(current) {
    if (isNaN(current) || current < 0 || current > 5) {
        alert("Please enter a valid current between 0 and 5A");
        return false;
    }
    
    const result = sendCommand({ 
        action: "setConstantCurrent", 
        current: current 
    });
    
    // Request a comprehensive status update
    if (result) {
        setTimeout(updateAllStatus, 300);
    }
    
    return result;
}

// Set Constant Power (CP) mode - Simplified to use only updateAllStatus
export function setConstantPower(power) {
    if (isNaN(power) || power < 0 || power > 120) {
        alert("Please enter a valid power between 0 and 120W");
        return false;
    }
    
    // First set the power value
    const success = sendCommand({ 
        action: "setConstantPower", 
        power: power 
    });
    
    if (success) {
        setTimeout(() => {
            // Enable CP mode
            sendCommand({ action: "setConstantPowerMode", enable: true });
            // Request a comprehensive status update
            setTimeout(updateAllStatus, 300);
        }, 200);
    }
    
    return success;
}

// Enable/Disable Constant Power mode - Simplified to use only updateAllStatus
export function setConstantPowerMode(enable) {
    const result = sendCommand({ 
        action: "setConstantPowerMode", 
        enable: enable 
    });
    
    // Request a comprehensive status update
    if (result) {
        setTimeout(updateAllStatus, 300);
    }
    
    return result;
}

// Improved key lock toggle function with better logging
export function toggleKeyLock(shouldLock) {
    console.log("toggleKeyLock called with:", shouldLock);
    
    try {
        const command = {
            action: "setKeyLock", 
            lock: shouldLock
        };
        console.log("Sending key lock command:", JSON.stringify(command));
        
        return sendCommand(command);
    } catch (error) {
        console.error("Error toggling key lock:", error);
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

// Make functions available globally for direct HTML access
window.requestPsuStatus = requestPsuStatus;
window.requestOperatingMode = requestOperatingMode; // Add this export
window.debugOperatingMode = debugOperatingMode; // New debug function
window.setConstantVoltage = setConstantVoltage;
window.setConstantCurrent = setConstantCurrent;
window.setConstantPower = setConstantPower;
window.setConstantPowerMode = setConstantPowerMode;
window.toggleKeyLock = toggleKeyLock;
window.togglePower = togglePower;  // Make sure this is properly exposed
window.refreshPsuStatus = updateAllStatus; // Redirect to the new function
window.updateAllStatus = updateAllStatus; // Make the unified status update function available globally
window.startAutoRefresh = startAutoRefresh;
window.stopAutoRefresh = stopAutoRefresh;