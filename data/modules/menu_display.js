import { elements } from './elements_registry.js';

// Update the UI with data
function updateUI(data) {
  console.log('Updating UI with data:', data);
  
  // Power supply data update
  if (data.outputEnabled !== undefined) {
    updateOutputStatus(data.outputEnabled);
  }
  
  if (data.voltage !== undefined && elements.psuVoltage) {
    elements.psuVoltage.textContent = parseFloat(data.voltage).toFixed(2);
  }
  
  if (data.current !== undefined && elements.psuCurrent) {
    elements.psuCurrent.textContent = parseFloat(data.current).toFixed(3);
  }
  
  if (data.power !== undefined && elements.psuPower) {
    elements.psuPower.textContent = parseFloat(data.power).toFixed(1);
  }
}

// Update PSU UI with specific status response
function updatePsuUI(data) {
  if (!data.connected) {
    elements.outputStatus.textContent = "Not Connected";
    elements.outputStatus.className = "status-value error";
    return;
  }
  
  updateOutputStatus(data.outputEnabled);
  
  if (elements.psuVoltage) {
    elements.psuVoltage.textContent = parseFloat(data.voltage).toFixed(2);
  }
  
  if (elements.psuCurrent) {
    elements.psuCurrent.textContent = parseFloat(data.current).toFixed(3);
  }
  
  if (elements.psuPower) {
    elements.psuPower.textContent = parseFloat(data.power).toFixed(1);
  }
  
  // Prefill input fields with current values
  if (elements.setVoltage) {
    elements.setVoltage.value = parseFloat(data.voltage).toFixed(2);
  }
  
  if (elements.setCurrent) {
    elements.setCurrent.value = parseFloat(data.current).toFixed(3);
  }
}

// Update output status display
function updateOutputStatus(enabled) {
  if (elements.outputStatus) {
    elements.outputStatus.textContent = enabled ? "ON" : "OFF";
    elements.outputStatus.className = enabled ? "status-value on" : "status-value off";
  }
  
  // Update power button state visually
  const powerButton = document.querySelector('.power-button');
  if (powerButton) {
    powerButton.classList.toggle('on', enabled);
  }
  
  // Keep this for backward compatibility
  if (elements.toggleOutput) {
    elements.toggleOutput.textContent = enabled ? "Turn Output OFF" : "Turn Output ON";
  }
}

// Update WiFi UI
function updateWifiUI(data) {
  elements.wifiStatus.textContent = data.status;
  elements.wifiStatus.className = 'status-value ' + data.status;
  elements.wifiSsid.textContent = data.ssid;
  elements.wifiIp.textContent = data.ip;
  
  // Convert RSSI to a more user-friendly format
  const rssi = parseInt(data.rssi);
  let signalStrength = '';
  
  if (rssi >= -50) {
    signalStrength = 'Excellent';
  } else if (rssi >= -65) {
    signalStrength = 'Good';
  } else if (rssi >= -75) {
    signalStrength = 'Fair';
  } else if (rssi >= -85) {
    signalStrength = 'Weak';
  } else {
    signalStrength = 'Very Weak';
  }
  
  elements.wifiRssi.textContent = `${signalStrength} (${rssi} dBm)`;
}

export { updateUI, updatePsuUI, updateOutputStatus, updateWifiUI };