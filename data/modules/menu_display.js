import { elements } from './elements_registry.js';
import { updateKeyLockStatus, updatePowerState } from './menu_basic.js';

// Update the UI with data
function updateUI(data) {
  console.log('Updating UI with data:', data);
  
  // Power supply data update - with additional null checks
  if (data.outputEnabled !== undefined) {
    updateOutputStatus(data.outputEnabled);
  }
  
  // Get the reading elements directly for maximum reliability
  const voltageElement = document.getElementById('psu-voltage');
  const currentElement = document.getElementById('psu-current');
  const powerElement = document.getElementById('psu-power');
  
  if (data.voltage !== undefined && voltageElement) {
    voltageElement.textContent = parseFloat(data.voltage).toFixed(2);
  }
  
  if (data.current !== undefined && currentElement) {
    currentElement.textContent = parseFloat(data.current).toFixed(3);
  }
  
  if (data.power !== undefined && powerElement) {
    powerElement.textContent = parseFloat(data.power).toFixed(1);
  }
}

// Update PSU UI with specific status response
function updatePsuUI(data) {
  // Debug output to help diagnose issues
  console.log('Updating PSU UI with:', data);
  
  if (!data.connected) {
    const outputStatus = document.getElementById('output-status');
    if (outputStatus) {
      outputStatus.textContent = "Not Connected";
      outputStatus.className = "status-value error";
    }
    return;
  }
  
  // Update output status
  updateOutputStatus(data.outputEnabled);
  
  // Update key lock status if available in data
  if (data.keyLocked !== undefined) {
    updateKeyLockStatus(data.keyLocked);
  }
  
  // Get the reading elements directly
  const voltageElement = document.getElementById('psu-voltage');
  const currentElement = document.getElementById('psu-current');
  const powerElement = document.getElementById('psu-power');
  
  if (voltageElement) {
    voltageElement.textContent = parseFloat(data.voltage).toFixed(2);
  }
  
  if (currentElement) {
    currentElement.textContent = parseFloat(data.current).toFixed(3);
  }
  
  if (powerElement) {
    powerElement.textContent = parseFloat(data.power).toFixed(1);
  }
  
  // Prefill input fields with current values if they exist
  const setVoltageInput = document.getElementById('set-voltage');
  const setCurrentInput = document.getElementById('set-current');
  
  if (setVoltageInput) {
    setVoltageInput.value = parseFloat(data.voltage).toFixed(2);
  }
  
  if (setCurrentInput) {
    setCurrentInput.value = parseFloat(data.current).toFixed(3);
  }
}

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

export { updateUI, updatePsuUI, updateOutputStatus };