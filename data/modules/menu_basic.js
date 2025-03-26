import { elements } from './elements_registry.js';
import { sendCommand, requestPsuStatus } from './menu_connection.js';
import { initWebSocket } from './menu_connection.js';

// Toggle power output
function togglePowerOutput() {
  // Get current state
  const currentState = elements.outputStatus && elements.outputStatus.textContent === "ON";
  console.log("Current output state:", currentState, "Toggling to:", !currentState);
  
  // Send command to toggle to opposite state
  const success = sendCommand({ 
    action: "powerOutput", 
    enable: !currentState 
  });
  
  if (success) {
    // Temporary UI feedback while waiting for response
    const powerButton = document.querySelector('.power-button');
    if (powerButton) {
      // Show opposite state immediately for better UX
      powerButton.classList.toggle('on', !currentState);
    }
    
    if (elements.toggleOutput) {
      elements.toggleOutput.disabled = true;
      setTimeout(() => {
        elements.toggleOutput.disabled = false;
      }, 1000);
    }
  } else {
    alert("WebSocket not connected. Cannot control power supply.");
    
    // Try to reconnect
    initWebSocket();
  }
}

// Set voltage
function setVoltageValue() {
  const voltage = parseFloat(elements.setVoltage.value);
  if (isNaN(voltage) || voltage < 0 || voltage > 30) {
    alert("Please enter a valid voltage between 0 and 30V");
    return;
  }
  
  const success = sendCommand({ 
    action: "setVoltage", 
    voltage: voltage 
  });
  
  if (!success) {
    alert("WebSocket not connected. Cannot set voltage.");
  }
}

// Set current
function setCurrentValue() {
  const current = parseFloat(elements.setCurrent.value);
  if (isNaN(current) || current < 0 || current > 5) {
    alert("Please enter a valid current between 0 and 5A");
    return;
  }
  
  const success = sendCommand({ 
    action: "setCurrent", 
    current: current 
  });
  
  if (!success) {
    alert("WebSocket not connected. Cannot set current.");
  }
}

// Turn output ON
function turnOutputOn() {
  const success = sendCommand({ 
    action: "powerOutput", 
    enable: true 
  });
  
  if (!success) {
    alert("WebSocket not connected. Cannot turn output on.");
  }
}

// Turn output OFF
function turnOutputOff() {
  const success = sendCommand({ 
    action: "powerOutput", 
    enable: false 
  });
  
  if (!success) {
    alert("WebSocket not connected. Cannot turn output off.");
  }
}

// Lock front panel keys
function toggleKeyLock(shouldLock) {
  const success = sendCommand({ 
    action: "setKeyLock", 
    lock: shouldLock 
  });
  
  if (success) {
    console.log("Front panel keys " + (shouldLock ? "locked" : "unlocked"));
  } else {
    alert("WebSocket not connected. Cannot control keys.");
  }
}

// Update key lock status from device
function updateKeyLockStatus(isLocked) {
  const keyLockSlider = document.getElementById('key-lock-slider');
  
  if (keyLockSlider) {
    // Toggle the active class based on lock state
    keyLockSlider.classList.toggle('active', isLocked);
  }
}

// Set Constant Voltage (CV) mode
function setConstantVoltage() {
  const voltage = parseFloat(document.getElementById('set-cv-voltage').value);
  if (isNaN(voltage) || voltage < 0 || voltage > 30) {
    alert("Please enter a valid voltage between 0 and 30V");
    return;
  }
  
  const success = sendCommand({ 
    action: "setConstantVoltage", 
    voltage: voltage 
  });
  
  if (success) {
    console.log("Constant voltage mode set to", voltage, "V");
  } else {
    alert("WebSocket not connected. Cannot set constant voltage.");
  }
}

// Set Constant Current (CC) mode
function setConstantCurrent() {
  const current = parseFloat(document.getElementById('set-cc-current').value);
  if (isNaN(current) || current < 0 || current > 5) {
    alert("Please enter a valid current between 0 and 5A");
    return;
  }
  
  const success = sendCommand({ 
    action: "setConstantCurrent", 
    current: current 
  });
  
  if (success) {
    console.log("Constant current mode set to", current, "A");
  } else {
    alert("WebSocket not connected. Cannot set constant current.");
  }
}

// Set Constant Power (CP) mode
function setConstantPower() {
  const power = parseFloat(document.getElementById('set-cp-power').value);
  if (isNaN(power) || power < 0 || power > 120) {
    alert("Please enter a valid power between 0 and 120W");
    return;
  }
  
  const success = sendCommand({ 
    action: "setConstantPower", 
    power: power 
  });
  
  if (success) {
    console.log("Constant power set to", power, "W");
  } else {
    alert("WebSocket not connected. Cannot set constant power.");
  }
}

// Enable Constant Power mode
function enableCpMode() {
  const success = sendCommand({ 
    action: "setConstantPowerMode", 
    enable: true 
  });
  
  if (success) {
    console.log("Constant Power mode enabled");
  } else {
    alert("WebSocket not connected. Cannot enable CP mode.");
  }
}

// Disable Constant Power mode
function disableCpMode() {
  const success = sendCommand({ 
    action: "setConstantPowerMode", 
    enable: false 
  });
  
  if (success) {
    console.log("Constant Power mode disabled");
  } else {
    alert("WebSocket not connected. Cannot disable CP mode.");
  }
}

// Handle operation mode tabs
function initModeTabs() {
  const tabs = document.querySelectorAll('.mode-tab');
  const modeSettings = document.querySelectorAll('.mode-settings');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Deactivate all tabs
      tabs.forEach(t => t.classList.remove('active'));
      
      // Hide all settings
      modeSettings.forEach(setting => setting.classList.remove('active'));
      
      // Activate the clicked tab
      tab.classList.add('active');
      
      // Show the corresponding settings
      const mode = tab.getAttribute('data-mode');
      if (mode !== 'normal') {
        const modeElement = document.getElementById(`${mode}-settings`);
        if (modeElement) {
          modeElement.classList.add('active');
        }
      }
    });
  });
}

// Fix power button initialization
function initPowerButton() {
  const powerCheckbox = document.getElementById('power-checkbox');
  if (!powerCheckbox) {
    console.error('Power checkbox not found');
    return;
  }
  
  console.log('Initializing power toggle');
  
  // Add click handler
  powerCheckbox.addEventListener('change', function() {
    console.log('Power toggle changed to:', this.checked);
    
    // Send the toggle command
    togglePowerOutput();
  });
  
  // Set initial state with null check after a small delay to ensure the UI is ready
  setTimeout(() => {
    const isOn = elements.outputStatus && elements.outputStatus.textContent === "ON";
    powerCheckbox.checked = isOn;
  }, 1000);
}

// Update output state for power toggle
function updatePowerState(isOn) {
  const powerCheckbox = document.getElementById('power-checkbox');
  if (powerCheckbox) {
    powerCheckbox.checked = isOn;
  }
}

// Initialize all control buttons
function initBasicControls() {
  // Mode tabs
  initModeTabs();
  
  // Key lock slider direct toggle
  const keyLockSlider = document.getElementById('key-lock-slider');
  if (keyLockSlider) {
    keyLockSlider.addEventListener('click', function() {
      // Toggle active state
      const isCurrentlyActive = this.classList.contains('active');
      const newState = !isCurrentlyActive;
      
      // Send command to toggle lock
      toggleKeyLock(newState);
      
      // Update UI immediately for responsiveness (will be confirmed by response)
      this.classList.toggle('active', newState);
    });
  }
  
  // Output control buttons - removed from UI but keeping functions for power button
  // These references will now be null since elements were removed
  const outputOnBtn = document.getElementById('output-on');
  const outputOffBtn = document.getElementById('output-off');
  
  // Only attach listeners if buttons exist (which they won't after removal)
  if (outputOnBtn) {
    outputOnBtn.addEventListener('click', turnOutputOn);
  }
  
  if (outputOffBtn) {
    outputOffBtn.addEventListener('click', turnOutputOff);
  }
  
  // Key lock toggle
  const keyLockCheckbox = document.getElementById('key-lock-checkbox');
  if (keyLockCheckbox) {
    keyLockCheckbox.addEventListener('change', function() {
      toggleKeyLock(this.checked);
    });
  }
  
  // CV mode
  const applyCvBtn = document.getElementById('apply-cv');
  if (applyCvBtn) {
    applyCvBtn.addEventListener('click', setConstantVoltage);
  }
  
  // CC mode
  const applyCcBtn = document.getElementById('apply-cc');
  if (applyCcBtn) {
    applyCcBtn.addEventListener('click', setConstantCurrent);
  }
  
  // CP mode
  const applyCpBtn = document.getElementById('apply-cp');
  if (applyCpBtn) {
    applyCpBtn.addEventListener('click', setConstantPower);
  }
  
  const cpModeOnBtn = document.getElementById('cp-mode-on');
  const cpModeOffBtn = document.getElementById('cp-mode-off');
  
  if (cpModeOnBtn) {
    cpModeOnBtn.addEventListener('click', enableCpMode);
  }
  
  if (cpModeOffBtn) {
    cpModeOffBtn.addEventListener('click', disableCpMode);
  }
}

export { 
  togglePowerOutput, 
  setVoltageValue, 
  setCurrentValue, 
  initPowerButton,
  initBasicControls,
  turnOutputOn,
  turnOutputOff,
  toggleKeyLock,
  updateKeyLockStatus,
  setConstantVoltage,
  setConstantCurrent,
  setConstantPower,
  enableCpMode,
  disableCpMode,
  updatePowerState
};