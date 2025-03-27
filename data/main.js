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

// Updated applyTheme function to handle checkbox state properly
function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Update theme color meta tag
  const themeColorMeta = document.getElementById('theme-color');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', isDark ? '#121212' : '#2c3e50');
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

// Initialize the application with a slight delay to ensure DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded, initializing application...');
    
    // Force re-initialize elements registry first
    document.dispatchEvent(new Event('elementsRegistryInit'));
    
    // Set a short timeout to make sure all elements are available
    setTimeout(init, 100);
});

// Apply theme immediately
const darkMode = localStorage.getItem('darkMode') === 'true';
applyTheme(darkMode);

// Function to initialize the UI and components with better error handling
function init() {
    console.log("Initializing application components...");
    
    try {
        // Debug: Check critical elements exist
        console.log("Power toggle element exists:", !!document.getElementById('power-toggle'));
        console.log("Power slider element exists:", !!document.getElementById('power-slider'));
        
        // Set up event listeners first
        setupEventListeners();
        
        // Initialize WebSocket connection
        initWebSocket();
        
        // Initialize UI components
        initPowerButton();
        initBasicControls();
        
        // Start periodic updates
        startPeriodicUpdates();
        
        // Initial data fetch (as fallback)
        setTimeout(() => {
            fetchData();
        }, 1000);
        
        // Fetch WiFi status
        fetchWifiStatus();
        setInterval(fetchWifiStatus, 30000);
        
        console.log("Application initialization complete");
    } catch (err) {
        console.error("Error during initialization:", err);
    }
}

// Enhanced event listener setup with resilience
function setupEventListeners() {
    // Voltage and current controls
    attachClickHandler('apply-voltage', setVoltageValue);
    attachClickHandler('apply-current', setCurrentValue);
    attachClickHandler('refresh-psu', () => {
        requestPsuStatus();
        requestOperatingMode();
    });
    
    // Theme toggle with peer-based styling
    const themeCheckbox = document.getElementById('theme-checkbox');
    if (themeCheckbox) {
        themeCheckbox.checked = darkMode;
        themeCheckbox.addEventListener('change', toggleDarkMode);
    }
    
    // Setup voltage preset popup
    setupVoltagePresetPopup();
    
    // Document visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            requestPsuStatus();
            requestOperatingMode();
        }
    });
}

// Helper function to safely attach click handlers
function attachClickHandler(id, handler) {
    const element = document.getElementById(id);
    if (element) {
        // Remove any existing handlers first (to prevent duplicates)
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        newElement.addEventListener('click', handler);
    } else {
        console.warn(`Element with ID "${id}" not found for click handler`);
    }
}

// Setup voltage preset popup
function setupVoltagePresetPopup() {
    const presetButton = document.getElementById('voltage-preset-btn');
    const popup = document.getElementById('voltage-popup');
    const overlay = document.getElementById('voltage-overlay');
    
    if (!presetButton || !popup || !overlay) {
        console.warn('Voltage preset elements not found');
        return;
    }
    
    // Open popup when button is clicked
    presetButton.addEventListener('click', () => {
        popup.classList.remove('hidden');
        popup.classList.add('flex');
        overlay.classList.remove('hidden');
        document.body.classList.add('popup-open');
    });
    
    // Close popup when overlay is clicked
    overlay.addEventListener('click', closePopup);
    
    // Handle voltage selection
    const voltageOptions = popup.querySelectorAll('div[data-voltage]');
    voltageOptions.forEach(option => {
        option.addEventListener('click', () => {
            const voltage = option.getAttribute('data-voltage');
            const voltageInput = document.getElementById('set-voltage');
            
            if (voltageInput && voltage) {
                voltageInput.value = voltage;
                
                // Close popup after selection
                closePopup();
            }
        });
    });
    
    function closePopup() {
        popup.classList.add('hidden');
        popup.classList.remove('flex');
        overlay.classList.add('hidden');
        document.body.classList.remove('popup-open');
    }
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
