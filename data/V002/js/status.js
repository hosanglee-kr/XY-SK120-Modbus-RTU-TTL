/**
 * Status display functionality for XY-SK120
 * Handles updating UI with power supply readings and states
 */

// Track the last time we received a status update
let lastStatusUpdateTime = 0;
let heartbeatMonitorActive = false;

// Update the UI with power supply data
export function updateUI(data) {
    // Update basic PSU readings
    updatePsuUI(data);
    
    // Update output status if included
    if (data.outputEnabled !== undefined) {
        updateOutputStatus(data.outputEnabled);
    }
    
    // Update CP mode toggle if included
    if (data.cpModeEnabled !== undefined) {
        updateCpModeToggle(data.cpModeEnabled);
    }
    
    // Update key lock status if included
    if (data.keyLockEnabled !== undefined) {
        updateKeyLockStatus(data.keyLockEnabled);
    }
    
    // Update device name if included
    if (data.deviceName) {
        updateDeviceName(data.deviceName);
    }
    
    // Update operating mode if included
    if (data.operatingMode) {
        updateOperatingMode(data.operatingMode, data);
    }

    // Update protection values if included
    updateProtectionValues(data);

    // This comment suggests there was UI related to a refresh status button
    // that's no longer needed: "Remove the code that was creating the refresh status button"
    // Check HTML for related elements that may be unused
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

/**
 * Update CP mode toggle state
 * @param {boolean} isEnabled - Whether CP mode is enabled
 */
export function updateCpModeToggle(isEnabled) {
    const cpModeToggle = document.getElementById('cp-mode-toggle');
    if (cpModeToggle && cpModeToggle.checked !== isEnabled) {
        console.log("Status update: CP mode is", isEnabled ? "enabled" : "disabled");
        cpModeToggle.checked = isEnabled;
    }
}

/**
 * Update Key Lock status in UI
 * NOTE: This is now just a wrapper that calls the function in basic_control.js
 * @param {boolean} isLocked - Whether the keys are locked
 */
export function updateKeyLockStatus(isLocked) {
    // Call the function from basic_control.js instead
    if (typeof window.updateKeyLockStatus === 'function') {
        window.updateKeyLockStatus(isLocked);
    } else {
        console.error("updateKeyLockStatus function not available in window scope");
        
        // Fallback implementation in case the function isn't available yet
        const keyLockToggle = document.getElementById('key-lock');
        if (keyLockToggle && keyLockToggle.checked !== isLocked) {
            console.log("Status update: Key lock is", isLocked ? "enabled" : "disabled");
            keyLockToggle.checked = isLocked;
        }
        
        // Also update any visual indicator of lock status
        const keyLockIndicator = document.getElementById('key-lock-indicator');
        if (keyLockIndicator) {
            keyLockIndicator.textContent = isLocked ? "Locked" : "Unlocked";
            keyLockIndicator.className = isLocked ? 
                "ml-2 text-sm font-medium text-danger" : 
                "ml-2 text-sm font-medium text-success";
        }
    }
}

/**
 * Update device name in UI
 * @param {string} name - The device name
 */
export function updateDeviceName(name) {
    // Update device name in settings
    const deviceNameInput = document.getElementById('device-name');
    if (deviceNameInput && deviceNameInput.value !== name) {
        deviceNameInput.value = name;
    }
    
    // Also update any display of device name in the UI
    const deviceNameDisplay = document.getElementById('device-name-display');
    if (deviceNameDisplay) {
        deviceNameDisplay.textContent = name;
    }
}

// Update operating mode display - Use Tailwind CSS colors
export function updateOperatingMode(mode, data) {
    console.log("Updating operating mode:", mode, data);
    
    // Handle the old operatingModeDisplay for backward compatibility if it exists
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
        
        // Use Tailwind class names for colors instead of legacy class names
        if (mode === 'CV') {
            modeDisplay.classList.add('text-voltage'); // Use Tailwind voltage color class
        } else if (mode === 'CC') {
            modeDisplay.classList.add('text-current'); // Use Tailwind current color class
        } else if (mode === 'CP') {
            modeDisplay.classList.add('text-power'); // Use Tailwind power color class
        } else {
            modeDisplay.classList.add('text-gray-500'); // Default Tailwind gray
        }
    }

    // Update the mode display in the main readings section (already using Tailwind classes)
    const modeDisplayValue = document.getElementById('mode-display-value');
    if (modeDisplayValue) {
        // Remove all existing classes
        modeDisplayValue.className = '';
        
        if (mode === 'CV') {
            modeDisplayValue.textContent = 'CV';
            modeDisplayValue.classList.add('text-voltage'); // Tailwind voltage color
        } else if (mode === 'CC') {
            modeDisplayValue.textContent = 'CC';
            modeDisplayValue.classList.add('text-current'); // Tailwind current color
        } else if (mode === 'CP') {
            modeDisplayValue.textContent = 'CP';
            modeDisplayValue.classList.add('text-power'); // Tailwind power color
        } else {
            modeDisplayValue.textContent = '--';
            modeDisplayValue.classList.add('text-gray-500'); // Tailwind gray
        }
    }

    // Update the detailed mode display in the status area with Tailwind classes
    const modeDisplayElement = document.getElementById('mode-display');
    if (modeDisplayElement) {
        let displayHtml = '';
        
        if (mode === 'CV' && data && data.voltage !== undefined) {
            displayHtml = `<span class="text-voltage">CV ${parseFloat(data.voltage).toFixed(2)}V</span>`;
        } else if (mode === 'CC' && data && data.current !== undefined) {
            displayHtml = `<span class="text-current">CC ${parseFloat(data.current).toFixed(3)}A</span>`;
        } else if (mode === 'CP' && data && data.power !== undefined) {
            displayHtml = `<span class="text-power">CP ${parseFloat(data.power).toFixed(1)}W</span>`;
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
 * Handles the heartbeat pulse on actual message received
 * @param {Object} data - The status data received
 */
export function pulseHeartbeat(data) {
    if (!data || data.action !== 'statusResponse') return;
    
    lastStatusUpdateTime = Date.now();
    
    const heartbeatIndicator = document.getElementById('heartbeat-indicator');
    if (!heartbeatIndicator) return;
    
    const dot = heartbeatIndicator.querySelector('.dot');
    if (!dot) return;
    
    // Briefly increase opacity to show a "pulse" effect
    dot.style.opacity = '1';
    
    // Start fading after a brief delay
    setTimeout(() => {
        dot.style.opacity = '0.4';
    }, 200);
    
    // Make sure the indicator is visible
    heartbeatIndicator.style.display = 'flex';
    
    // Start monitoring the health of the heartbeat if not already running
    if (!heartbeatMonitorActive) {
        startHeartbeatMonitor();
    }
}

/**
 * Start monitoring the heartbeat to detect if updates stop
 */
function startHeartbeatMonitor() {
    heartbeatMonitorActive = true;
    
    // Check every 2 seconds if we're still getting updates
    const monitorInterval = setInterval(() => {
        const timeSinceLastUpdate = Date.now() - lastStatusUpdateTime;
        const heartbeatIndicator = document.getElementById('heartbeat-indicator');
        if (!heartbeatIndicator) return;
        
        // If it's been more than 10 seconds since last update, show a warning state
        if (timeSinceLastUpdate > 10000) {
            const span = heartbeatIndicator.querySelector('span');
            if (span) {
                span.textContent = 'Connection slow';
                span.style.color = '#e74c3c'; // Red to indicate issue
            }
            
            const dot = heartbeatIndicator.querySelector('.dot');
            if (dot) {
                dot.style.backgroundColor = '#e74c3c'; // Red dot
            }
        } else {
            const span = heartbeatIndicator.querySelector('span');
            if (span) {
                span.textContent = 'Auto-updating';
                span.style.color = '#3498db'; // Blue for normal state
            }
            
            const dot = heartbeatIndicator.querySelector('.dot');
            if (dot) {
                dot.style.backgroundColor = '#3498db'; // Blue dot
            }
        }
        
        // If indicator is gone, stop monitoring
        if (!document.getElementById('heartbeat-indicator')) {
            clearInterval(monitorInterval);
            heartbeatMonitorActive = false;
        }
    }, 2000);
}

/**
 * Shows or hides the heartbeat indicator
 * @param {boolean} visible - Whether the indicator should be visible
 */
export function toggleHeartbeatIndicator(visible) {
    const heartbeatIndicator = document.getElementById('heartbeat-indicator');
    if (heartbeatIndicator) {
        heartbeatIndicator.style.display = visible ? 'flex' : 'none';
        
        // Reset indicator appearance
        const dot = heartbeatIndicator.querySelector('.dot');
        if (dot) {
            dot.style.animation = 'none';
            dot.style.backgroundColor = '#3498db';
            dot.style.opacity = '0.4';
        }
        
        const span = heartbeatIndicator.querySelector('span');
        if (span) {
            span.textContent = 'Auto-updating';
            span.style.color = '#3498db';
        }
    }
    
    // If turning off, stop any active monitoring
    if (!visible) {
        heartbeatMonitorActive = false;
    }
}