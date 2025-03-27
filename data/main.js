import { elements } from './modules/elements_registry.js';
import { initSwipeCards, forceReinitSwipeCards, setupOperatingModeTabs } from './modules/menu_interface.js';
import { 
  initWebSocket, 
  requestPsuStatus, 
  requestOperatingMode, 
  websocketConnected,
  startPeriodicUpdates 
} from './modules/menu_connection.js';
import { setVoltageValue, setCurrentValue, initPowerButton, initBasicControls } from './modules/menu_basic.js';
import { updateUI } from './modules/menu_display.js';

// Global state
let lastDataUpdate = 0;
let darkMode = localStorage.getItem('darkMode') === 'true';

// Apply theme immediately
applyTheme(darkMode);

// Single function to apply theme changes
function applyTheme(isDark) {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  
  // Update theme color meta tag
  const themeColorMeta = document.getElementById('theme-color');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', isDark ? '#121212' : '#2c3e50');
  }
  
  // Update theme toggle icons
  const moonIcon = document.querySelector('.moon-icon');
  const sunIcon = document.querySelector('.sun-icon');
  if (moonIcon && sunIcon) {
    moonIcon.style.display = isDark ? 'none' : 'block';
    sunIcon.style.display = isDark ? 'block' : 'none';
  }
}

// Fetch data from device - fallback to REST API if WebSocket is not available
function fetchData() {
  console.log("Fetching data from API...");
  
  if (websocketConnected) {
    requestPsuStatus();
    return;
  }
  
  // Fallback to REST API
  fetch('/api/data')
    .then(response => response.json())
    .then(data => {
      console.log("Data received from REST API:", data);
      updateUI(data);
      lastDataUpdate = Date.now();
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

// Initialize the application
function init() {
  console.log("Initializing application...");
  
  // Set up event listeners first
  setupEventListeners();
  
  // Initialize WebSocket connection
  initWebSocket();
  
  // Initialize UI components
  initPowerButton();
  initBasicControls();
  
  // Initialize card swiping
  setTimeout(() => {
    initSwipeCards();
    setupOperatingModeTabs(); // Make sure this is called to initialize operation mode tabs
  }, 500);
  
  // Start periodic updates
  startPeriodicUpdates();
  
  // Initial data fetch (as fallback)
  setTimeout(() => {
    fetchData();
  }, 1000);
  
  // Fetch WiFi status
  fetchWifiStatus();
  setInterval(fetchWifiStatus, 30000);
}

// Set up event listeners
function setupEventListeners() {
  // Voltage and current controls
  if (elements.applyVoltage) {
    elements.applyVoltage.addEventListener('click', setVoltageValue);
  }
  
  if (elements.applyCurrent) {
    elements.applyCurrent.addEventListener('click', setCurrentValue);
  }
  
  if (elements.refreshPsu) {
    elements.refreshPsu.addEventListener('click', () => {
      requestPsuStatus();
      requestOperatingMode();
    });
  }
  
  // Theme toggle
  const themeCheckbox = document.getElementById('theme-checkbox');
  if (themeCheckbox) {
    themeCheckbox.checked = darkMode;
    themeCheckbox.addEventListener('change', toggleDarkMode);
  }
  
  // Handle window resize events
  window.addEventListener('resize', debounce(forceReinitSwipeCards, 250));
  
  // Handle visibility change - update data when page becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      requestPsuStatus();
      requestOperatingMode();
    }
  });
}

// Toggle dark mode function 
function toggleDarkMode() {
  darkMode = !darkMode;
  localStorage.setItem('darkMode', darkMode);
  applyTheme(darkMode);
}

// Fetch WiFi status
function fetchWifiStatus() {
  fetch('/api/wifi/status')
    .then(response => response.json())
    .then(data => {
      if (elements.wifiStatus) elements.wifiStatus.textContent = data.status;
      if (elements.wifiStatus) elements.wifiStatus.className = 'status-value ' + (data.status === 'connected' ? 'connected' : 'error');
      if (elements.wifiSsid) elements.wifiSsid.textContent = data.ssid || 'Not connected';
      if (elements.wifiIp) elements.wifiIp.textContent = data.ip || 'None';
      
      // Convert RSSI to a more user-friendly format
      if (elements.wifiRssi) {
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
    })
    .catch(error => {
      console.error('Error fetching WiFi status:', error);
    });
}

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

export { fetchData };
