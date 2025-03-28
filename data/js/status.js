/**
 * Status display functionality for XY-SK120
 * Handles updating UI with power supply readings and states
 */

// Update the UI with power supply data
export function updateUI(data) {
    // Update basic PSU readings
    updatePsuUI(data);
    
    // Update output status if included
    if (data.outputEnabled !== undefined) {
        updateOutputStatus(data.outputEnabled);
    }
    
    // Update operating mode if included
    if (data.operatingMode) {
        updateOperatingMode(data.operatingMode);
    }
}

// Update PSU readings
export function updatePsuUI(data) {
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

// Update output status
export function updateOutputStatus(isOn) {
    const outputStatus = document.getElementById('output-status');
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

// Update operating mode display
export function updateOperatingMode(mode, setValue) {
    const modeDisplay = document.getElementById('operatingModeDisplay');
    if (!modeDisplay) return;
    
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
}