import { updateUI, updatePsuUI, updateOutputStatus } from './menu_display.js';

let websocket = null;
let reconnectTimeout = null;
let isConnecting = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 5000;
let websocketConnected = false;

// Initialize WebSocket connection
function initWebSocket() {
  // Don't reconnect if already connecting or connected
  if (isConnecting) return;
  if (websocket && websocket.readyState === WebSocket.OPEN) return;
  
  // Reset state
  isConnecting = true;
  clearTimeout(reconnectTimeout);
  
  // Close existing connection if any
  if (websocket) {
    try { websocket.close(); } 
    catch (e) { console.error('Error closing WebSocket:', e); }
  }
  
  // Create WebSocket connection
  try {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    
    websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('WebSocket connected successfully');
      isConnecting = false;
      reconnectAttempts = 0;
      websocketConnected = true;
      
      // Request initial data
      requestPsuStatus();
      setTimeout(() => {
        requestOperatingMode();
      }, 1000); // Add delay before requesting operating mode
    };
    
    websocket.onclose = handleDisconnect;
    websocket.onerror = handleError;
    websocket.onmessage = handleMessage;
  } catch (error) {
    console.error('Error creating WebSocket:', error);
    handleDisconnect();
  }
}

// Handle WebSocket disconnection
function handleDisconnect() {
  console.log('WebSocket disconnected');
  isConnecting = false;
  websocketConnected = false;
  
  // Try to reconnect if under max attempts
  if (reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++;
    console.log(`WebSocket reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
    
    reconnectTimeout = setTimeout(initWebSocket, reconnectDelay);
  } else {
    console.log('Max reconnect attempts reached');
  }
}

// Handle WebSocket errors
function handleError(error) {
  console.error('WebSocket error:', error);
  isConnecting = false;
  websocketConnected = false;
}

// Handle incoming WebSocket messages
function handleMessage(event) {
  try {
    const data = JSON.parse(event.data);
    console.log("WebSocket received:", data);
    
    // Handle different response types
    if (data.action === 'statusResponse') {
      updatePsuUI(data);
    } else if (data.action === 'powerOutputResponse') {
      updateOutputStatus(data.enabled);
    } else if (data.action === 'setVoltageResponse' || data.action === 'setCurrentResponse') {
      // Update relevant UI element
      if (data.success && data.action === 'setVoltageResponse') {
        const voltageEl = document.getElementById('psu-voltage');
        if (voltageEl) voltageEl.textContent = parseFloat(data.voltage).toFixed(2);
      } else if (data.success && data.action === 'setCurrentResponse') {
        const currentEl = document.getElementById('psu-current');
        if (currentEl) currentEl.textContent = parseFloat(data.current).toFixed(3);
      }
      
      // Request updated status
      requestPsuStatus();
    } else if (data.action === 'operatingModeResponse') {
      // Handle operating mode response in status row
      updateOperatingModeDisplay(data);
    } else {
      // Handle regular data updates
      updateUI(data);
    }
  } catch (error) {
    console.error('Error parsing WebSocket message:', error);
  }
}

// Request data through WebSocket
function requestData() {
  return sendCommand({ action: 'getData' });
}

// Request PSU status
function requestPsuStatus() {
  return sendCommand({ action: 'getStatus' });
}

// Request operating mode data
function requestOperatingMode() {
  console.log("Requesting operating mode data...");
  return sendCommand({ action: 'getOperatingMode' });
}

// Send a command through the WebSocket with fixed error handling
function sendCommand(command) {
  if (!websocket) {
    console.log("WebSocket not initialized, attempting to connect");
    initWebSocket();
    return false;
  }
  
  if (websocket.readyState === WebSocket.OPEN) {
    try {
      const commandStr = JSON.stringify(command);
      console.log("Sending command:", commandStr);
      websocket.send(commandStr);
      return true;
    } catch (e) {
      console.error('Error sending command:', e);
      websocketConnected = false;
      return false;
    }
  } else if (websocket.readyState === WebSocket.CONNECTING) {
    console.log("WebSocket is connecting, command will be queued");
    // Queue command to be sent when connected
    setTimeout(() => {
      sendCommand(command);
    }, 1000);
    return false;
  } else {
    console.log("WebSocket not connected (state: " + websocket.readyState + "), attempting reconnect");
    websocketConnected = false;
    initWebSocket();
    return false;
  }
}

// Update operating mode display - Updated for status row display
function updateOperatingModeDisplay(data) {
  console.log("Updating operating mode display with data:", data);
  
  // Import the new display function if it's not already available
  if (typeof window.updateOperatingModeDisplay !== 'function') {
    // Try to import from other modules
    import('./menu_display.js').then(module => {
      if (module.updateOperatingModeDisplay) {
        module.updateOperatingModeDisplay(data);
      }
    }).catch(err => {
      console.error("Could not import updateOperatingModeDisplay:", err);
    });
  } else {
    // If the function is already available, call it directly
    window.updateOperatingModeDisplay(data);
  }
}

// Update mode settings display
function updateModeSettingsDisplay(data) {
  // Display voltage setting
  const voltageSetValue = document.getElementById('voltageSetValue');
  if (voltageSetValue && data.voltageSet !== undefined) {
    voltageSetValue.textContent = `${data.voltageSet.toFixed(2)} V`;
  }
  
  // Display current setting
  const currentSetValue = document.getElementById('currentSetValue');
  if (currentSetValue && data.currentSet !== undefined) {
    currentSetValue.textContent = `${data.currentSet.toFixed(3)} A`;
  }
  
  // Display power setting if CP mode is enabled
  const powerSetValue = document.getElementById('powerSetValue');
  const powerSetSection = document.getElementById('powerSetSection');
  
  if (powerSetValue && powerSetSection) {
    if (data.cpModeEnabled && data.powerSet !== undefined) {
      powerSetValue.textContent = `${data.powerSet.toFixed(1)} W`;
      powerSetSection.style.display = 'flex';
    } else {
      powerSetSection.style.display = 'none';
    }
  }
}

// Start periodic status updates
function startPeriodicUpdates() {
  // Initial request
  requestPsuStatus();
  
  // Set up recurring updates
  setInterval(() => {
    if (websocketConnected) {
      requestPsuStatus();
    }
  }, 5000);
  
  // Less frequent operating mode updates
  setInterval(() => {
    if (websocketConnected) {
      requestOperatingMode();
    }
  }, 10000);
}

// Export the essential functions
export { 
  initWebSocket, 
  requestData, 
  requestPsuStatus, 
  sendCommand, 
  requestOperatingMode, 
  updateOperatingModeDisplay, 
  updateModeSettingsDisplay,
  websocketConnected,
  startPeriodicUpdates
};