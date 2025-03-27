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
        console.log("Found power toggle element, setting up event listener");
        
        // Remove any existing event listeners to prevent duplicates
        const newPowerToggle = powerToggle.cloneNode(true);
        powerToggle.parentNode.replaceChild(newPowerToggle, powerToggle);
        
        // Add event listener with improved error handling
        newPowerToggle.addEventListener('change', function() {
            console.log("Power toggle changed:", this.checked);
            
            const success = sendCommand({ 
                action: 'setOutputState', 
                enabled: this.checked 
            });
            
            if (!success) {
                console.error("Failed to send power toggle command");
                alert("Connection error. Couldn't toggle power.");
                // Revert the checkbox to original state since command failed
                this.checked = !this.checked;
            } else {
                // Update UI immediately for better user feedback
                const outputStatus = document.getElementById('output-status');
                if (outputStatus) {
                    outputStatus.textContent = this.checked ? "ON" : "OFF";
                    outputStatus.className = this.checked ? "status-value on" : "status-value off";
                }
            }
        });
    } else {
        console.error("Power toggle element not found in the DOM");
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

// Set up key lock control
function setupKeyLockControl() {
    const keyLock = document.getElementById('key-lock');
    if (keyLock) {
        keyLock.addEventListener('change', function() {
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
    }
    
    // Handle power state responses
    if (data.action === 'setOutputStateResponse' || 
        data.action === 'powerOutputResponse') {
        updateOutputStatus(data.enabled);
    }
    
    // Handle mode responses
    if (data.action === 'operatingModeResponse') {
        updateOperatingModeDisplay(data);
    }
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
    const outputStatus = document.getElementById('output-status');
    if (outputStatus) {
        outputStatus.textContent = enabled ? "ON" : "OFF";
        outputStatus.className = enabled ? "status-value on" : "status-value off";
    }
    
    // Update power toggle with proper checked state
    const powerToggle = document.getElementById('power-toggle');
    if (powerToggle) {
        console.log("Setting power toggle checkbox to:", enabled);
        powerToggle.checked = enabled;
    } else {
        console.warn("Power toggle element not found when updating status");
    }
}

// Update operating mode display
function updateOperatingModeDisplay(data) {
    const modeDisplay = document.getElementById('operatingModeDisplay');
    
    if (!modeDisplay) return;
    
    if (!data.operatingMode && !data.modeCode) {
        modeDisplay.textContent = '--';
        return;
    }
    
    // Use modeCode if available, otherwise fallback to operatingMode
    const modeCode = data.modeCode || data.operatingMode;
    let displayText = modeCode;
    
    // Add value information based on the mode
    if (modeCode === 'CV' && data.setValue !== undefined) {
        displayText += ' ' + data.setValue.toFixed(2) + 'V';
    } else if (modeCode === 'CC' && data.setValue !== undefined) {
        displayText += ' ' + data.setValue.toFixed(3) + 'A';
    } else if (modeCode === 'CP' && data.setValue !== undefined) {
        displayText += ' ' + data.setValue.toFixed(1) + 'W';
    }
    
    modeDisplay.textContent = displayText;
}

// Request PSU status
export function requestPsuStatus() {
    return sendCommand({ action: 'getStatus' });
}

// Set Constant Voltage (CV) mode
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

// Set Constant Current (CC) mode
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

// Lock or unlock front panel keys
export function toggleKeyLock(shouldLock) {
    return sendCommand({ 
        action: "setKeyLock", 
        lock: shouldLock 
    });
}

// Make functions available globally for direct HTML access
window.requestPsuStatus = requestPsuStatus;
window.setConstantVoltage = setConstantVoltage;
window.setConstantCurrent = setConstantCurrent;
window.setConstantPower = setConstantPower;
window.setConstantPowerMode = setConstantPowerMode;
window.toggleKeyLock = toggleKeyLock;
window.togglePower = function(enable) {
    console.log("Toggle power function called with:", enable);
    return sendCommand({ 
        action: 'setOutputState', 
        enabled: enable 
    });
};
