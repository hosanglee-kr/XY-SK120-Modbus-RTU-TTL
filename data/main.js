import { elements } from './modules/elements_registry.js';
import { initSwipeCards, forceReinitSwipeCards, setupOperatingModeTabs } from './modules/menu_interface.js';
import { 
  initWebSocket, 
  requestPsuStatus, 
  requestOperatingMode, 
  websocketConnected,
  startPeriodicUpdates,
  sendCommand
} from './modules/menu_connection.js';
import { setVoltageValue, setCurrentValue, initPowerButton, initBasicControls } from './modules/menu_basic.js';
import { updateUI } from './modules/menu_display.js';
import { initDeviceManager } from './modules/device_manager.js';

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

// Initialize the application with better WebSocket handling
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded, initializing application...');
    
    // Log WebSocket support
    if ('WebSocket' in window) {
        console.log('✅ WebSocket is supported by this browser');
    } else {
        console.error('❌ WebSocket is NOT supported by this browser');
    }
    
    // Add debugging tools
    window.debugInfo = {
        testConnection,
        reinitWebSocket: initWebSocket,
        sendManualCommand: sendCommand,
        requestStatus: requestPsuStatus
    };
    
    // Allow more time for slow connections to initialize
    setTimeout(init, 500);
});

// Testing function for connection troubleshooting
function testConnection() {
  console.log("Testing connection...");
  
  // Test WebSocket
  if (websocketConnected) {
    console.log("WebSocket connected: YES");
  } else {
    console.log("WebSocket connected: NO");
    console.log("Attempting connection...");
    initWebSocket();
  }
  
  // Test critical elements
  const powerToggle = document.getElementById('power-toggle');
  const voltageInput = document.getElementById('set-voltage');
  const voltageButton = document.getElementById('apply-voltage');
  
  console.log("Power toggle found:", !!powerToggle);
  console.log("Voltage input found:", !!voltageInput);
  console.log("Voltage button found:", !!voltageButton);
  
  // Try sending a command
  console.log("Attempting to send status request...");
  const success = sendCommand({ action: 'getStatus' });
  console.log("Command send result:", success);
  
  return {
    websocketConnected,
    powerToggleExists: !!powerToggle,
    voltageInputExists: !!voltageInput,
    voltageButtonExists: !!voltageButton,
    commandSent: success
  };
}

// Function to initialize the UI and components with better error handling
function init() {
    console.log("Initializing application components...");
    
    try {
        // Initialize device manager first to ensure connection settings are loaded
        initDeviceManager();
        
        // Initialize WebSocket with multiple attempts
        initWebSocket();
        
        // Try again after a short delay in case of initial timing issues
        setTimeout(initWebSocket, 1000);
        
        // Initialize UI components
        initPowerButton();
        initBasicControls();
        
        // Set up event listeners after elements are available
        setupEventListeners();
        
        // Start periodic updates with fallback mechanisms
        setTimeout(startPeriodicUpdates, 1500);
        
        // Force data refresh after 2 seconds - fallback to HTTP if WebSocket fails
        setTimeout(() => {
            if (!websocketConnected) {
                console.log("WebSocket not connected after 2 seconds, trying HTTP fallback");
                fetch('/api/data')
                    .then(response => response.json())
                    .then(data => {
                        updateUI(data);
                        console.log("Initial data loaded via HTTP");
                    })
                    .catch(error => {
                        console.error('Error fetching data via HTTP:', error);
                    });
            }
        }, 2000);
        
        // Setup reconnect button with clearer feedback
        const reconnectBtn = document.getElementById('reconnect-btn');
        if (reconnectBtn) {
            reconnectBtn.addEventListener('click', () => {
                console.log("Manual reconnect requested");
                
                // Update status display
                const statusElement = document.getElementById('websocket-status');
                if (statusElement) {
                    statusElement.textContent = 'Reconnecting...';
                    statusElement.className = 'text-secondary font-bold';
                }
                
                // Get current device IP
                const currentDevice = localStorage.getItem('selectedDeviceIP') || 'localhost';
                
                // Try to reconnect
                initWebSocket();
                
                // Provide feedback
                alert(`Reconnecting to: ${currentDevice}`);
            });
        }
        
        console.log("Application initialization complete");
    } catch (err) {
        console.error("Error during initialization:", err);
        
        // Try to recover by using the HTTP API
        fetch('/api/data')
            .then(response => response.json())
            .then(data => updateUI(data))
            .catch(error => console.error('Recovery attempt failed:', error));
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
