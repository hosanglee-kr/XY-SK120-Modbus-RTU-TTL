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

// Stop auto-refresh timer - updated to handle both timers
function stopAutoRefresh() {
    if (window.autoRefreshTimer) {
        console.log("⏹️ Stopping all auto-refresh timers");
        
        if (window.autoRefreshTimer.fast) {
            clearInterval(window.autoRefreshTimer.fast);
        }
        
        if (window.autoRefreshTimer.slow) {
            clearInterval(window.autoRefreshTimer.slow);
        }
        
        window.autoRefreshTimer = null;
        
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
        
        // Fix: Explicitly add the change event listener
        powerToggle.addEventListener('change', function() {
            // Only call togglePower when the user actually interacts with the switch
            console.log("Power toggle changed by user to:", this.checked);
            togglePower(this.checked);
        });
        
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

// Add missing togglePower function
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

// Add missing updateAllStatus function
export function updateAllStatus() {
    console.log("Updating all PSU status");
    
    try {
        // Request complete status update
        return sendCommand({ action: 'getStatus' });
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