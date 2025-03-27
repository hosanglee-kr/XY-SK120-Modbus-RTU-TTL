import { elements } from './elements_registry.js';

// Update output status display
function updateOutputStatus(enabled) {
  // Debug
  console.log('Updating output status to:', enabled ? 'ON' : 'OFF');
  
  const outputStatus = document.getElementById('output-status');
  if (outputStatus) {
    outputStatus.textContent = enabled ? "ON" : "OFF";
    outputStatus.className = enabled ? "status-value on" : "status-value off";
  }
  
  // Update power toggle state
  updatePowerState(enabled);
}

// Updated to handle operating mode display in status row
function updatePsuUI(data) {
  console.log('Updating PSU UI with data:', data);
  
  // Check if we have valid data
  if (!data || !data.connected) {
    console.warn('Cannot update UI: Power supply not connected');
    return;
  }
  
  // Update voltage display
  const voltageElement = document.getElementById('psu-voltage');
  if (voltageElement && data.voltage !== undefined) {
    voltageElement.textContent = data.voltage.toFixed(2);
  }
  
  // Update current display
  const currentElement = document.getElementById('psu-current');
  if (currentElement && data.current !== undefined) {
    currentElement.textContent = data.current.toFixed(3);
  }
  
  // Update power display
  const powerElement = document.getElementById('psu-power');
  if (powerElement && data.power !== undefined) {
    powerElement.textContent = data.power.toFixed(2);
  }
  
  // Update output status if provided
  if (data.outputEnabled !== undefined) {
    updateOutputStatus(data.outputEnabled);
  }
  
  // Update operating mode in status row
  if (data.operatingMode) {
    updateOperatingModeDisplay(data);
  }
}

// New function to update operating mode display in status row
function updateOperatingModeDisplay(data) {
  const modeDisplay = document.getElementById('operatingModeDisplay');
  
  if (!modeDisplay) {
    console.warn('Operating mode display element not found');
    return;
  }
  
  if (!data.operatingMode && !data.modeCode) {
    modeDisplay.textContent = '--';
    modeDisplay.className = '';
    return;
  }
  
  // Use modeCode if available, otherwise fallback to operatingMode
  const modeCode = data.modeCode || data.operatingMode;
  let displayText = modeCode;
  let modeClass = 'mode-' + modeCode.toLowerCase();
  
  // Add value information based on the mode
  if (modeCode === 'CV' && data.setValue !== undefined) {
    displayText += ' ' + data.setValue.toFixed(2) + 'V';
  } else if (modeCode === 'CC' && data.setValue !== undefined) {
    displayText += ' ' + data.setValue.toFixed(3) + 'A';
  } else if (modeCode === 'CP' && data.setValue !== undefined) {
    displayText += ' ' + data.setValue.toFixed(1) + 'W';
  } else if (modeCode === 'CV' && data.voltageSet !== undefined) {
    displayText += ' ' + data.voltageSet.toFixed(2) + 'V';
  } else if (modeCode === 'CC' && data.currentSet !== undefined) {
    displayText += ' ' + data.currentSet.toFixed(3) + 'A';
  } else if (modeCode === 'CP' && data.powerSet !== undefined) {
    displayText += ' ' + data.powerSet.toFixed(1) + 'W';
  }
  
  modeDisplay.textContent = displayText;
  modeDisplay.className = modeClass;
}

// Update power button state
function updatePowerState(isOn) {
  const powerCheckbox = document.getElementById('power-checkbox');
  if (powerCheckbox) {
    powerCheckbox.checked = isOn;
  }
}

// Update UI from basic API data (fallback)
function updateUI(data) {
  // Basic fallback for when we don't have the comprehensive data structure
  console.log('Updating UI with basic data:', data);
  
  // Update voltage display
  const voltageElement = document.getElementById('psu-voltage');
  if (voltageElement && data.voltage !== undefined) {
    voltageElement.textContent = data.voltage.toFixed(2);
  }
  
  // Update current display
  const currentElement = document.getElementById('psu-current');
  if (currentElement && data.current !== undefined) {
    currentElement.textContent = data.current.toFixed(3);
  }
  
  // Update power display
  const powerElement = document.getElementById('psu-power');
  if (powerElement && data.power !== undefined) {
    powerElement.textContent = data.power.toFixed(2);
  }
  
  // Update output status if provided
  if (data.outputEnabled !== undefined) {
    updateOutputStatus(data.outputEnabled);
  }
}

export {
  updateOutputStatus,
  updatePsuUI,
  updateUI,
  updatePowerState,
  updateOperatingModeDisplay // Export the new function
};