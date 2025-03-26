import { elements } from './modules/elements_registry.js';
import { initSwipeCards, forceReinitSwipeCards } from './modules/menu_interface.js';
import { initWebSocket, requestPsuStatus } from './modules/menu_connection.js';
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

// Fetch data from device
function fetchData() {
  console.log("Fetching data from API...");
  
  fetch('/api/data')
    .then(response => response.json())
    .then(data => {
      console.log("Data received:", data);
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
  
  // Initialize WebSocket connection
  initWebSocket();
  
  // Set up event listeners
  setupEventListeners();
  
  // Initialize UI components
  initPowerButton();
  initBasicControls();
  initSwipeCards();
  
  // Initial data fetch
  fetchData();
  requestPsuStatus();
  
  // Set up periodic data refresh
  setInterval(fetchData, 5000);
  
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
    elements.refreshPsu.addEventListener('click', requestPsuStatus);
  }
  
  // Theme toggle
  const themeCheckbox = document.getElementById('theme-checkbox');
  if (themeCheckbox) {
    themeCheckbox.checked = darkMode;
    themeCheckbox.addEventListener('change', toggleDarkMode);
  }
  
  // Handle window resize events
  window.addEventListener('resize', debounce(forceReinitSwipeCards, 250));
  
  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      requestPsuStatus();
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

// Initialize on DOM ready - single initialization point
document.addEventListener('DOMContentLoaded', init);

export { fetchData };
