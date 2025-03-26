import { elements } from './elements_registry.js';
import { sendCommand, requestPsuStatus } from './menu_connection.js';
import { initWebSocket } from './menu_connection.js';

// Toggle power output
function togglePowerOutput() {
  // Get current state
  const currentState = elements.outputStatus.textContent === "ON";
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

// Fix power button initialization
function initPowerButton() {
  const powerAnimContainer = document.getElementById('power-animation-container');
  if (!powerAnimContainer) {
    console.error('Power animation container not found');
    return;
  }
  
  console.log('Initializing power button');
  
  // Create a simple button with text
  powerAnimContainer.innerHTML = '<div class="power-button">POWER</div>';
  
  // Get the button and add click handler
  const powerButton = powerAnimContainer.querySelector('.power-button');
  if (powerButton) {
    powerButton.addEventListener('click', function() {
      console.log('Power button clicked');
      
      // Add visual feedback
      powerButton.classList.add('active');
      setTimeout(() => {
        powerButton.classList.remove('active');
      }, 300);
      
      // Send the toggle command
      togglePowerOutput();
    });
    
    // Set initial state
    setTimeout(() => {
      const isOn = elements.outputStatus.textContent === "ON";
      powerButton.classList.toggle('on', isOn);
    }, 1000);
  }
}

export { togglePowerOutput, setVoltageValue, setCurrentValue, initPowerButton };