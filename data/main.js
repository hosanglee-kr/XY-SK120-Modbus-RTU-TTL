let websocket;
let reconnectInterval;
const updateInterval = 3000; // 3 seconds

// DOM elements - remove temperature/humidity elements
const elements = {
  configForm: document.getElementById('configForm'),
  resetBtn: document.getElementById('resetBtn'),
  // WiFi elements
  wifiStatus: document.getElementById('wifi-status'),
  wifiSsid: document.getElementById('wifi-ssid'),
  wifiIp: document.getElementById('wifi-ip'),
  wifiRssi: document.getElementById('wifi-rssi'),
  wifiResetBtn: document.getElementById('wifiResetBtn'),
  wifiRefreshBtn: document.getElementById('wifiRefreshBtn'),
  deviceIp: document.getElementById('device-ip'),
  // Power Supply elements
  outputStatus: document.getElementById('output-status'),
  toggleOutput: document.getElementById('toggle-output'),
  psuVoltage: document.getElementById('psu-voltage'),
  psuCurrent: document.getElementById('psu-current'),
  psuPower: document.getElementById('psu-power'),
  setVoltage: document.getElementById('set-voltage'),
  applyVoltage: document.getElementById('apply-voltage'),
  setCurrent: document.getElementById('set-current'),
  applyCurrent: document.getElementById('apply-current'),
  refreshPsu: document.getElementById('refresh-psu'),
  themeToggle: document.getElementById('theme-toggle'),
  sunIcon: document.querySelector('.sun-icon'),
  moonIcon: document.querySelector('.moon-icon'),
  themeColorMeta: document.getElementById('theme-color')
};

// Add swipe elements to DOM elements
const swipeElements = {
  cardsContainer: document.getElementById('cards-container'),
  dots: document.querySelectorAll('.dot'),
  cards: document.querySelectorAll('.card')
};

// Initialize application
function init() {
  console.log("Initializing application");
  
  // Add loading class to body to disable transitions during initial load
  document.body.classList.add('loading');
  
  // Check that all required DOM elements exist
  console.log("Elements found:", elements);
  
  // Load initial data
  fetchData();
  
  // Setup periodic data updates
  setInterval(fetchData, updateInterval);
  
  // Setup WebSocket connection
  initWebSocket();
  
  // Load configuration
  loadConfiguration();
  
  // Setup event listeners
  setupEventListeners();
  
  // Load WiFi status
  fetchWifiStatus();
  
  // Update WiFi status every 30 seconds
  setInterval(fetchWifiStatus, 30000);
  
  // Display the device IP address in the header
  if (elements.deviceIp) {
    elements.deviceIp.textContent = window.location.hostname;
  }
  
  // Send initial status request via WebSocket
  setTimeout(() => {
    requestPsuStatus();
  }, 1000);
  
  // Initialize theme based on saved preference
  initTheme();
  
  // Initialize swipeable cards for mobile
  initSwipeCards();
  
  // Initialize the Lottie animation
  initPowerButton();
  
  // Remove the loading class after layout calculations are complete
  setTimeout(() => {
    document.body.classList.remove('loading');
  }, 500);
}

// Handle WebSocket communication
function initWebSocket() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
  
  console.log(`Connecting to WebSocket at ${wsUrl}`);
  
  websocket = new WebSocket(wsUrl);
  
  websocket.onopen = () => {
    console.log('WebSocket connected');
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
    requestData();
  };
  
  websocket.onclose = () => {
    console.log('WebSocket disconnected');
    if (!reconnectInterval) {
      reconnectInterval = setInterval(initWebSocket, 5000);
    }
  };
  
  websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  websocket.onmessage = (event) => {
    console.log('WebSocket message received:', event.data);
    try {
      const data = JSON.parse(event.data);
      
      // Handle different response types
      if (data.action === 'statusResponse') {
        updatePsuUI(data);
      } else if (data.action === 'powerOutputResponse') {
        updateOutputStatus(data.enabled);
        fetchData(); // Refresh all data
      } else if (data.action === 'setVoltageResponse' || data.action === 'setCurrentResponse') {
        // Refresh data after voltage/current change
        requestPsuStatus();
      } else {
        // Handle regular data updates
        updateUI(data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
}

// Request data through WebSocket
function requestData() {
  if (websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({ action: 'getData' }));
  }
}

// Fetch data from API endpoint if WebSocket is not available
function fetchData() {
  fetch('/api/data')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Received data:", data); // Debug log
      updateUI(data);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
    
  // Try WebSocket connection periodically if it's not connected
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    initWebSocket();
  }
}

// Update the UI with data - remove references to temperature/humidity
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

// Update output status display - updated to work with new power button
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

// Request PSU status via WebSocket
function requestPsuStatus() {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({ action: "getStatus" }));
  } else {
    console.log("WebSocket not connected, using fetch instead");
    fetchData();
  }
}

// Toggle power output - improved version
function togglePowerOutput() {
  // Get current state
  const currentState = elements.outputStatus.textContent === "ON";
  console.log("Current output state:", currentState, "Toggling to:", !currentState);
  
  // Send command to toggle to opposite state
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({ 
      action: "powerOutput", 
      enable: !currentState 
    }));
    
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
  
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({ 
      action: "setVoltage", 
      voltage: voltage 
    }));
  } else {
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
  
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({ 
      action: "setCurrent", 
      current: current 
    }));
  } else {
    alert("WebSocket not connected. Cannot set current.");
  }
}

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
  
  // The device IP header update has been removed
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

// Initialize theme based on saved preference
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
}

// Toggle between light and dark theme
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  localStorage.setItem('theme', newTheme);
}

// Update logo color function - increase stroke width for better visibility
function updateLogoColor() {
  const headerLogo = document.querySelector('.header-logo svg path');
  if (headerLogo) {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    if (theme === 'dark') {
      // Use brighter yellow-green gradient colors in dark mode
      headerLogo.style.fill = 'var(--secondary-color)';
      headerLogo.setAttribute('stroke-width', '1.5'); // Slightly thicker stroke in dark mode
    } else {
      // Use default gradient in light mode
      headerLogo.style.fill = 'var(--secondary-color)';
      headerLogo.setAttribute('stroke-width', '1'); // Normal stroke in light mode
    }
  }
}

// Set the theme
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update icons
  if (elements.sunIcon && elements.moonIcon) {
    if (theme === 'dark') {
      elements.sunIcon.style.display = 'block';
      elements.moonIcon.style.display = 'none';
      elements.themeColorMeta.setAttribute('content', '#121212');
    } else {
      elements.sunIcon.style.display = 'none';
      elements.moonIcon.style.display = 'block';
      elements.themeColorMeta.setAttribute('content', '#2c3e50');
    }
  }
  
  // Update logo color
  updateLogoColor();
}

// Restore a working version of the swipe card implementation with simpler mechanics
function initSwipeCards() {
  // Check if we're on mobile
  if (window.innerWidth <= 600) {
    // Show dots indicator for navigation
    const dotsIndicator = document.getElementById('dots-indicator');
    if (dotsIndicator) {
      dotsIndicator.style.display = 'flex';
    }
    
    // Add click event to dots for direct navigation
    const dots = document.querySelectorAll('.dot');
    const cards = document.querySelectorAll('.card');
    
    if (dots.length > 0 && cards.length > 0) {
      // Clear any existing event listeners to prevent duplicates
      dots.forEach((dot) => {
        const newDot = dot.cloneNode(true);
        dot.parentNode.replaceChild(newDot, dot);
      });
      
      // Reselect dots after replacement
      const freshDots = document.querySelectorAll('.dot');
      
      // Add click event handlers to dots
      freshDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          // Hide all cards
          cards.forEach((card, i) => {
            card.style.display = 'none';
          });
          
          // Show the selected card
          if (cards[index]) {
            cards[index].style.display = 'block';
          }
          
          // Update active dot
          freshDots.forEach(d => {
            d.classList.remove('active');
          });
          dot.classList.add('active');
        });
      });
      
      // Initialize the first card as visible, others hidden
      cards.forEach((card, i) => {
        card.style.display = i === 0 ? 'block' : 'none';
      });
      
      // Ensure first dot is active
      if (freshDots[0]) {
        freshDots[0].classList.add('active');
      }
      
      // Add basic touch swipe detection
      let touchStartX = 0;
      let touchEndX = 0;
      
      document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
      }, false);
      
      document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, false);
      
      function handleSwipe() {
        const swipeThreshold = 50;
        const activeDotIndex = Array.from(freshDots).findIndex(dot => dot.classList.contains('active'));
        
        if (touchEndX < touchStartX - swipeThreshold) {
          // Left swipe - next card
          const nextIndex = (activeDotIndex + 1) % freshDots.length;
          freshDots[nextIndex].click();
        } else if (touchEndX > touchStartX + swipeThreshold) {
          // Right swipe - previous card
          const prevIndex = (activeDotIndex - 1 + freshDots.length) % freshDots.length;
          freshDots[prevIndex].click();
        }
      }
    }
  } else {
    // On desktop, show all cards and hide dot indicators
    const dotsIndicator = document.getElementById('dots-indicator');
    if (dotsIndicator) {
      dotsIndicator.style.display = 'none';
    }
    
    // Show all cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.style.display = 'block';
    });
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
      
      // Get current state from the output status display
      const currentState = elements.outputStatus.textContent === "ON";
      
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

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  init();
  
  // Call initSwipeCards once at startup
  setTimeout(initSwipeCards, 500);
  
  // Recalculate on resize
  window.addEventListener('resize', initSwipeCards);
  
  // Recalculate on orientation change
  window.addEventListener('orientationchange', function() {
    setTimeout(initSwipeCards, 300);
  });

  // Add logo color update
  updateLogoColor();
});
