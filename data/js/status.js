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
        updateOperatingMode(data.operatingMode, data);
    }

    // Update protection values if included
    updateProtectionValues(data);
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

// Update operating mode display - Fixed to correctly show the mode
export function updateOperatingMode(mode, data) {
    console.log("Updating operating mode:", mode, data);
    
    // First handle old operatingModeDisplay for backward compatibility
    const modeDisplay = document.getElementById('operatingModeDisplay');
    if (modeDisplay) {
        // Clear all mode classes first
        modeDisplay.classList.remove('mode-cv', 'mode-cc', 'mode-cp', 'mode-unknown', 'status-loading');
        
        // Format display text
        let displayText = mode || "--";
        
        if (data && data.voltage !== undefined && mode === 'CV') {
            displayText += ' ' + parseFloat(data.voltage).toFixed(2) + 'V';
        } else if (data && data.current !== undefined && mode === 'CC') {
            displayText += ' ' + parseFloat(data.current).toFixed(3) + 'A';
        } else if (data && data.power !== undefined && mode === 'CP') {
            displayText += ' ' + parseFloat(data.power).toFixed(1) + 'W';
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

    // Handle the mode display in the status area
    // This is a simple approach that doesn't use the conditional spans
    const modeDisplayElement = document.getElementById('mode-display');
    if (modeDisplayElement) {
        let displayHtml = '';
        
        if (mode === 'CV' && data && data.voltage !== undefined) {
            displayHtml = `<span class="text-volt">CV ${parseFloat(data.voltage).toFixed(2)}V</span>`;
        } else if (mode === 'CC' && data && data.current !== undefined) {
            displayHtml = `<span class="text-amp">CC ${parseFloat(data.current).toFixed(3)}A</span>`;
        } else if (mode === 'CP' && data && data.power !== undefined) {
            displayHtml = `<span class="text-watt">CP ${parseFloat(data.power).toFixed(1)}W</span>`;
        } else {
            displayHtml = `<span class="text-gray-500">--</span>`;
        }
        
        modeDisplayElement.innerHTML = displayHtml;
    }
}

// Update protection values display
export function updateProtectionValues(data) {
    // Update OVP value if available
    if (data.ovp !== undefined) {
        const ovpValue = document.getElementById('ovp-value');
        if (ovpValue) ovpValue.textContent = parseFloat(data.ovp).toFixed(2);
    }
    
    // Update OCP value if available
    if (data.ocp !== undefined) {
        const ocpValue = document.getElementById('ocp-value');
        if (ocpValue) ocpValue.textContent = parseFloat(data.ocp).toFixed(3);
    }
    
    // Update OPP value if available
    if (data.opp !== undefined) {
        const oppValue = document.getElementById('opp-value');
        if (oppValue) oppValue.textContent = parseFloat(data.opp).toFixed(1);
    }
    
    // Update LVP value if available
    if (data.lvp !== undefined) {
        const lvpValue = document.getElementById('lvp-value');
        if (lvpValue) lvpValue.textContent = parseFloat(data.lvp).toFixed(2);
    }
    
    // Update OTP value if available
    if (data.otp !== undefined) {
        const otpValue = document.getElementById('otp-value');
        if (otpValue) otpValue.textContent = parseFloat(data.otp).toFixed(1);
    }
}

/**
 * Updates the heartbeat animation speed based on refresh interval
 * @param {number} refreshInterval - Refresh interval in milliseconds
 */
export function updateHeartbeatSpeed(refreshInterval) {
    // Convert to seconds for easier calculations
    const intervalSeconds = refreshInterval / 1000;
    
    // Calculate animation duration: faster for shorter intervals, slower for longer ones
    // Use a logarithmic scale to make differences more noticeable
    // Clamp between 0.5s (very fast) and 2s (slower)
    const animationDuration = Math.max(0.5, Math.min(2, Math.log10(intervalSeconds) + 0.5));
    
    // Find the heartbeat indicator
    const heartbeatIndicator = document.getElementById('heartbeat-indicator');
    if (!heartbeatIndicator) return;
    
    // Find the dot element that pulses
    const dot = heartbeatIndicator.querySelector('.dot');
    if (!dot) return;
    
    // Set the animation duration
    dot.style.animationDuration = `${animationDuration}s`;
    
    // Make sure the indicator is visible
    heartbeatIndicator.style.display = 'flex';
    
    // Optional: Show a tooltip with the actual refresh rate
    heartbeatIndicator.title = `Refreshing every ${intervalSeconds} second${intervalSeconds !== 1 ? 's' : ''}`;
}

/**
 * Shows or hides the heartbeat indicator
 * @param {boolean} visible - Whether the indicator should be visible
 */
export function toggleHeartbeatIndicator(visible) {
    const heartbeatIndicator = document.getElementById('heartbeat-indicator');
    if (heartbeatIndicator) {
        heartbeatIndicator.style.display = visible ? 'flex' : 'none';
    }
}