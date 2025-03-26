import { initWebSocket, requestData, requestPsuStatus } from './modules/menu_connection.js';
import { updateUI, updateOutputStatus } from './modules/menu_display.js';
import { loadConfiguration, fetchWifiStatus, setupEventListeners } from './modules/menu_settings.js';
import { initTheme } from './modules/menu_theme.js';
import { initSwipeCards, forceReinitSwipeCards } from './modules/menu_interface.js';
import { initPowerButton } from './modules/menu_basic.js';
import { elements } from './modules/elements_registry.js';

const updateInterval = 3000; // 3 seconds

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
  if (!window.websocket || window.websocket.readyState !== WebSocket.OPEN) {
    initWebSocket();
  }
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  init();
  
  // Improved mobile card initialization with multiple checks
  // First call immediately
  initSwipeCards();
  
  // Second call after a short delay
  setTimeout(initSwipeCards, 200);
  
  // Force reinitialize after splash screen likely gone
  setTimeout(forceReinitSwipeCards, 1000);
  
  // Recalculate on resize with debouncing
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(forceReinitSwipeCards, 250);
  });
  
  // Recalculate on orientation change with force
  window.addEventListener('orientationchange', function() {
    setTimeout(forceReinitSwipeCards, 300);
  });
});

// Export functions for use in other modules
export { fetchData };
