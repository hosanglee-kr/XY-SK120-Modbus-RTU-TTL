import { elements } from './elements_registry.js';
import { updateWifiUI } from './menu_display.js';
import { togglePowerOutput, setVoltageValue, setCurrentValue } from './menu_basic.js';
import { requestPsuStatus } from './menu_connection.js';
import { toggleTheme } from './menu_theme.js';

// Load configuration from server
function loadConfiguration() {
  fetch('/api/config')
    .then(response => response.json())
    .then(config => {
      document.getElementById('deviceName').value = config.deviceName || '';
      document.getElementById('modbusId').value = config.modbusId || 1;
      document.getElementById('baudRate').value = config.baudRate || 9600;
      document.getElementById('dataBits').value = config.dataBits || 8;
      document.getElementById('parity').value = config.parity || 0;
      document.getElementById('stopBits').value = config.stopBits || 1;
      document.getElementById('updateInterval').value = config.updateInterval || 5000;
    })
    .catch(error => {
      console.error('Error loading configuration:', error);
    });
}

// Fetch WiFi status
function fetchWifiStatus() {
  fetch('/api/wifi/status')
    .then(response => response.json())
    .then(data => {
      updateWifiUI(data);
    })
    .catch(error => {
      console.error('Error fetching WiFi status:', error);
    });
}

// Save configuration to server
function saveConfiguration(config) {
  fetch('/api/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config)
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Configuration saved successfully!');
      } else {
        alert('Error saving configuration: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error saving configuration:', error);
      alert('Error saving configuration. Check console for details.');
    });
}

// Setup event listeners
function setupEventListeners() {
  // Configuration form submission
  elements.configForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const formData = new FormData(this);
    const config = {
      deviceName: formData.get('deviceName'),
      modbusId: parseInt(formData.get('modbusId')),
      baudRate: parseInt(formData.get('baudRate')),
      dataBits: parseInt(formData.get('dataBits')),
      parity: parseInt(formData.get('parity')),
      stopBits: parseInt(formData.get('stopBits')),
      updateInterval: parseInt(formData.get('updateInterval'))
    };
    
    saveConfiguration(config);
  });
  
  // Reset button
  elements.resetBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to restart the device?')) {
      fetch('/api/reset', { method: 'POST' })
        .catch(error => {
          console.error('Error resetting device:', error);
        });
    }
  });
  
  // WiFi reset button
  elements.wifiResetBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset WiFi settings? The device will restart and create an access point for new configuration.')) {
      fetch('/api/wifi/reset', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
          alert('WiFi settings reset. Device will restart. Connect to the "XY-SK120-Setup" WiFi network to configure new settings.');
        })
        .catch(error => {
          console.error('Error resetting WiFi:', error);
        });
    }
  });
  
  // WiFi refresh button
  if (elements.wifiRefreshBtn) {
    elements.wifiRefreshBtn.addEventListener('click', function() {
      fetchWifiStatus();
    });
  }
  
  // Power supply control listeners
  if (elements.toggleOutput) {
    elements.toggleOutput.addEventListener('click', togglePowerOutput);
  }
  
  if (elements.applyVoltage) {
    elements.applyVoltage.addEventListener('click', setVoltageValue);
  }
  
  if (elements.applyCurrent) {
    elements.applyCurrent.addEventListener('click', setCurrentValue);
  }
  
  if (elements.refreshPsu) {
    elements.refreshPsu.addEventListener('click', requestPsuStatus);
  }
  
  // Theme toggle
  if (elements.themeToggle) {
    elements.themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Add validation for decimal number inputs
  const decimalInputs = document.querySelectorAll('input[inputmode="decimal"]');
  decimalInputs.forEach(input => {
    input.addEventListener('input', function(e) {
      // Allow only numbers and a single decimal point
      let value = e.target.value;
      value = value.replace(/[^0-9.]/g, ''); // Remove anything that's not a digit or decimal
      
      // Ensure only one decimal point
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      
      e.target.value = value;
    });
  });
  
  // Add validation for numeric inputs (integers only)
  const numericInputs = document.querySelectorAll('input[inputmode="numeric"]');
  numericInputs.forEach(input => {
    input.addEventListener('input', function(e) {
      // Allow only numbers
      let value = e.target.value;
      value = value.replace(/[^0-9]/g, ''); // Remove anything that's not a digit
      e.target.value = value;
    });
  });
}

export { loadConfiguration, fetchWifiStatus, saveConfiguration, setupEventListeners };