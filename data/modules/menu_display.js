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

// Update PSU UI with comprehensive data
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
  
  // Update operating mode if provided
  if (data.operatingMode) {
    const modeElement = document.getElementById('operatingMode');
    if (modeElement) {
      modeElement.textContent = data.operatingMode;
      modeElement.className = `mode-${data.operatingMode.toLowerCase()}`;
    }
  }
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
  updatePowerState
};