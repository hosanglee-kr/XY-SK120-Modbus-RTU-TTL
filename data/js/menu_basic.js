/**
 * Basic control functionality for XY-SK120
 * Mirrors firmware's menu_basic functionality
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
        requestPsuStatus();
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

// Function to sync the toggle with the actual device state
function syncPowerToggleWithActualState() {
    try {
        console.log("Syncing power toggle with actual device state");
        // Changed action from 'getOutputState' to 'powerOutput'
        const status = sendCommand({ action: 'powerOutput' });
        
        if (status && typeof status.enabled !== 'undefined') {
            console.log("Received output state from device:", status.enabled);
            
            // Update the toggle without triggering the change event
            const powerToggle = document.getElementById('power-toggle');
            if (powerToggle && powerToggle.checked !== status.enabled) {
                console.log("Updating power toggle to match device state:", status.enabled);
                powerToggle.checked = status.enabled;
            }
            
            // Update status display
            updateOutputStatusDisplay(status.enabled);
        } else {
            console.warn("Invalid status response received:", status);
        }
    } catch (error) {
        console.error("Error syncing power toggle state:", error);
    }
}

// Helper to update just the output status display
function updateOutputStatusDisplay(isOn) {
    const outputStatus = document.getElementById('output-status');
    if (outputStatus) {
        // Update text content
        outputStatus.textContent = isOn ? "ON" : "OFF";
        
        // Remove previous classes
        outputStatus.classList.remove('output-on-bg', 'output-off-bg', 'text-success', 'text-danger');
        
        // Add appropriate background class for consistent styling with mode display
        if (isOn) {
            outputStatus.classList.add('output-on-bg');
        } else {
            outputStatus.classList.add('output-off-bg');
        }
        
        // Add a pulse animation for visual feedback
        outputStatus.classList.add('mode-pulse');
        setTimeout(() => {
            outputStatus.classList.remove('mode-pulse');
        }, 300);
    }
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
    
    // CP mode toggles
    const cpModeOnBtn = document.getElementById('cp-mode-on');
    const cpModeOffBtn = document.getElementById('cp-mode-off');
    
    if (cpModeOnBtn) {
        cpModeOnBtn.addEventListener('click', () => {
            setConstantPowerMode(true);
        });
    }
    
    if (cpModeOffBtn) {
        cpModeOffBtn.addEventListener('click', () => {
            setConstantPowerMode(false);
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

// Handle WebSocket messages related to basic controls
function handleBasicMessages(event) {
    const data = event.detail;
    
    // Handle basic status responses
    if (data.action === 'statusResponse') {
        updateBasicUI(data);
        
        // If status contains operating mode, highlight the appropriate mode tab
        if (data.operatingMode || data.modeCode) {
            highlightActiveOperatingMode(data.operatingMode || data.modeCode);
        }
    }
    
    // Handle power state responses
    if (data.action === 'setOutputStateResponse' || 
        data.action === 'powerOutputResponse') {
        updateOutputStatus(data.enabled !== undefined ? data.enabled : data.enable);
        
        // Request operating mode after power state changes
        setTimeout(() => requestOperatingMode(), 300);
    }
    
    // Handle mode responses
    if (data.action === 'operatingModeResponse' && data.success === true) {
        const mode = data.modeCode || data.operatingMode;
        const setValue = data.setValue;
        
        if (mode) {
            // Update the operating mode display directly
            const modeDisplay = document.getElementById('operatingModeDisplay');
            if (modeDisplay) {
                let displayText = mode;
                
                if (setValue !== undefined) {
                    if (mode === 'CV') {
                        displayText += ' ' + parseFloat(setValue).toFixed(2) + 'V';
                    } else if (mode === 'CC') {
                        displayText += ' ' + parseFloat(setValue).toFixed(3) + 'A';
                    } else if (mode === 'CP') {
                        displayText += ' ' + parseFloat(setValue).toFixed(1) + 'W';
                    }
                }
                
                // Remove all mode classes first
                modeDisplay.classList.remove('mode-cv-bg', 'mode-cc-bg', 'mode-cp-bg');
                
                // Update text content before applying the class
                modeDisplay.textContent = displayText;
                
                // Add the appropriate mode class
                if (mode === 'CV') {
                    modeDisplay.classList.add('mode-cv-bg');
                } else if (mode === 'CC') {
                    modeDisplay.classList.add('mode-cc-bg');
                } else if (mode === 'CP') {
                    modeDisplay.classList.add('mode-cp-bg');
                }
                
                // Add pulse animation for feedback
                modeDisplay.classList.add('mode-pulse');
                setTimeout(() => {
                    modeDisplay.classList.remove('mode-pulse');
                }, 300);
            }
            
            highlightActiveOperatingMode(mode);
        }
    }
}

// New function to highlight the active operating mode tab - Updated to handle both string and numeric modes
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
    tabs.forEach(tab => {
        const dataMode = tab.getAttribute('data-mode');
        if (dataMode && (dataMode === tabMode || tabMode.startsWith(dataMode))) {
            // This is the active tab, highlight it
            tabs.forEach(t => {
                t.classList.remove('tab-active');
                t.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            });
            
            tab.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            tab.classList.add('tab-active');
            
            console.log(`Highlighted ${dataMode} tab for mode ${mode}`);
        }
    });
}

// Update the basic UI elements
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
    
    // Update output status
    if (data.outputEnabled !== undefined) {
        updateOutputStatus(data.outputEnabled);
    }
}

// Update output status display - IMPROVED VERSION
function updateOutputStatus(enabled) {
    console.log("Updating output status UI to:", enabled ? "ON" : "OFF");
    
    // Update output status text
    updateOutputStatusDisplay(enabled);
    
    // Update power toggle with proper checked state
    const powerToggle = document.getElementById('power-toggle');
    if (powerToggle) {
        console.log("Setting power toggle checkbox to:", enabled);
        // Only update if the state doesn't match to avoid triggering the change event
        if (powerToggle.checked !== enabled) {
            powerToggle.checked = enabled;
        }
    } else {
        console.warn("Power toggle element not found when updating status");
    }
}

// Update operating mode display - This will be called from menu_basic.js
// Keep this for reference but rely on the implementation in menu_connection.js
function updateOperatingModeDisplay(data) {
    const modeDisplay = document.getElementById('operatingModeDisplay');
    
    if (!modeDisplay) return;
    
    if (!data.operatingMode && !data.modeCode) {
        modeDisplay.textContent = '--';
        return;
    }
    
    // Log that this function is being called for debugging
    console.log("menu_basic.js: updateOperatingModeDisplay called with:", data);
    
    // Defer to menu_connection.js implementation which is already being called
}

// Request PSU status
export function requestPsuStatus() {
    console.log("Requesting PSU status");
    return sendCommand({ action: 'getStatus' });
}

// IMPROVED - Toggle power with correct action name and parameter
export function togglePower(isOn) {
    console.log("togglePower called with:", isOn);
    
    // Make sure we have a valid connection and command function
    if (typeof sendCommand !== 'function') {
        console.error("sendCommand function is not available");
        alert("Error: Connection to device not established");
        return false;
    }
    
    try {
        // Use the CORRECT action and parameter names
        const command = { 
            action: 'powerOutput',  // Changed from 'setOutputState' to 'powerOutput'
            enable: isOn            // Changed from 'enabled' to 'enable'
        };
        console.log("Sending power command:", JSON.stringify(command));
        
        // Send the command
        const result = sendCommand(command);
        console.log("Power command send result:", result);
        
        // Update the UI immediately for feedback
        updateOutputStatusDisplay(isOn);
        
        // Request a status update after a delay to confirm the change
        setTimeout(() => {
            console.log("Requesting status update after power toggle");
            requestPsuStatus();
            
            // ADDED: Also request operating mode after power toggle
            setTimeout(() => requestOperatingMode(), 200);
        }, 500);
        
        return result;
    } catch (error) {
        console.error("Error in togglePower:", error);
        alert("Failed to toggle power: " + (error.message || "Unknown error"));
        
        // Sync with actual state after error
        setTimeout(syncPowerToggleWithActualState, 1000);
        return false;
    }
}

// Request operating mode data
export function requestOperatingMode() {
    console.log("Requesting operating mode from menu_basic.js");
    return sendCommand({ action: 'getOperatingMode' });
}

// Set Constant Voltage (CV) mode
export function setConstantVoltage(voltage) {
    if (isNaN(voltage) || voltage < 0 || voltage > 30) {
        alert("Please enter a valid voltage between 0 and 30V");
        return false;
    }
    
    const result = sendCommand({ 
        action: "setConstantVoltage", 
        voltage: voltage 
    });
    
    // Request operating mode after setting CV mode
    if (result) {
        setTimeout(() => requestOperatingMode(), 300);
    }
    
    return result;
}

// Set Constant Current (CC) mode
export function setConstantCurrent(current) {
    if (isNaN(current) || current < 0 || current > 5) {
        alert("Please enter a valid current between 0 and 5A");
        return false;
    }
    
    const result = sendCommand({ 
        action: "setConstantCurrent", 
        current: current 
    });
    
    // Request operating mode after setting CC mode
    if (result) {
        setTimeout(() => requestOperatingMode(), 300);
    }
    
    return result;
}

// Set Constant Power (CP) mode
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
    
    // Then enable CP mode
    if (success) {
        setTimeout(() => {
            sendCommand({ action: "setConstantPowerMode", enable: true });
        }, 200);
    }
    
    return success;
}

// Enable/Disable Constant Power mode
export function setConstantPowerMode(enable) {
    return sendCommand({ 
        action: "setConstantPowerMode", 
        enable: enable 
    });
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

// Call directly from HTML button for debugging - ENHANCED with proper class handling
export function debugOperatingMode() {
    console.log("Manual operating mode debug request");
    const modeDisplay = document.getElementById('operatingModeDisplay');
    if (modeDisplay) {
        // Store original classes before changing
        const originalClasses = [...modeDisplay.classList];
        
        // Remove only animation classes, preserve mode classes for consistency
        modeDisplay.classList.remove('mode-pulse');
        
        // Show loading state without removing mode classes
        const originalText = modeDisplay.textContent;
        modeDisplay.textContent = "Requesting...";
        
        // Add temporary loading style
        modeDisplay.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-gray-100');
        
        // Create timeout to restore original state if request fails
        const timeoutId = setTimeout(() => {
            // Restore original text and remove temporary styles
            modeDisplay.textContent = originalText;
            modeDisplay.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-gray-100');
        }, 3000);
        
        // Store data for potential cleanup
        window._operatingModeRequestData = {
            originalText: originalText,
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
window.highlightActiveOperatingMode = highlightActiveOperatingMode;
