import { updateUI, updatePsuUI, updateOutputStatus } from './menu_display.js';

// Make WebSocket available globally for debugging
let websocket = null;
let reconnectTimeout = null;
let isConnecting = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 5000;
let websocketConnected = false;

// Get the configured WebSocket IP or use default
function getWebSocketIP() {
  // Get the selected device from localStorage or use default (localhost)
  const selectedDevice = localStorage.getItem('selectedDeviceIP') || 'localhost';
  
  // If using "localhost", replace with the current hostname when not in development
  if (selectedDevice === 'localhost' && 
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1') {
    return window.location.hostname;
  }
  
  return selectedDevice;
}

// Initialize WebSocket connection with device selection support
function initWebSocket() {
  // Show connection debug information
  console.log("🔌 WEBSOCKET CONNECTION ATTEMPT");
  console.log("Protocol:", window.location.protocol);
  console.log("Host:", window.location.hostname);
  console.log("Port:", window.location.port);
  
  // Don't reconnect if already connecting
  if (isConnecting) {
    console.log("Already attempting to connect WebSocket, skipping duplicate request");
    return;
  }
  
  // Reset state
  isConnecting = true;
  clearTimeout(reconnectTimeout);
  
  // Close existing connection if any
  if (websocket) {
    try { 
      websocket.close(); 
      websocket = null;
    } catch (e) { 
      console.error('Error closing WebSocket:', e); 
    }
  }
  
  try {
    // Get the configured WebSocket IP
    const deviceIP = getWebSocketIP();
    
    // Determine protocol (ws:// or wss://)
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Build WebSocket URL with configured IP
    const wsUrl = `${wsProtocol}//${deviceIP}/ws`;
    console.log(`Connecting to WebSocket at: ${wsUrl} (Device: ${deviceIP})`);
    
    // Create new WebSocket with the URL
    websocket = new WebSocket(wsUrl);
    
    // Make websocket available globally for debugging
    window.websocket = websocket;
    
    // Update the connection status display
    updateConnectionStatusDisplay('connecting', deviceIP);
    
    // Set up event handlers
    websocket.onopen = function() {
      console.log("✅ WebSocket connected successfully!");
      isConnecting = false;
      reconnectAttempts = 0;
      websocketConnected = true;
      window.websocketConnected = true; // Global flag for debugging
      
      // Update connection status display
      updateConnectionStatusDisplay('connected', deviceIP);
      
      // Request initial data
      requestPsuStatus();
      setTimeout(requestOperatingMode, 500);
      
      // Show success notification
      alert(`Successfully connected to ${deviceIP}`);
    };
    
    websocket.onclose = function(event) {
      console.log(`WebSocket closed with code: ${event.code}`);
      updateConnectionStatusDisplay('disconnected', deviceIP);
      handleDisconnect();
    };
    
    websocket.onerror = function(error) {
      console.error("❌ WebSocket error:", error);
      updateConnectionStatusDisplay('error', deviceIP);
      handleError(error);
    };
    
    websocket.onmessage = function(event) {
      handleMessage(event);
    };
  } catch (error) {
    console.error("⚠️ Error creating WebSocket:", error);
    updateConnectionStatusDisplay('error', getWebSocketIP());
    handleDisconnect();
    
    // Show detailed error
    alert(`Failed to connect to ${getWebSocketIP()}: ${error.message}`);
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

// Modified sendCommand with better error handling
function sendCommand(command) {
  // Debug which command is being sent
  console.log("🔼 Sending command:", command);
  
  if (!websocket) {
    console.error("❌ WebSocket not initialized");
    // Try to connect
    initWebSocket();
    
    // Queue command to send after connection
    if (command.action !== 'getStatus') { // Avoid queuing status requests
      setTimeout(() => {
        if (websocketConnected) sendCommand(command);
      }, 1000);
    }
    return false;
  }
  
  if (websocket.readyState === WebSocket.OPEN) {
    try {
      const commandStr = JSON.stringify(command);
      websocket.send(commandStr);
      return true;
    } catch (e) {
      console.error("❌ Error sending command:", e);
      websocketConnected = false;
      return false;
    }
  } else {
    // Try HTTP fallback for important commands
    if (command.action !== 'getStatus' && command.action !== 'getOperatingMode') {
      useFallbackHttp(command);
    }
    
    // If closed, try to reconnect
    if (websocket.readyState === WebSocket.CLOSED) {
      console.log("⚠️ WebSocket closed, attempting to reconnect");
      initWebSocket();
    } else {
      console.log(`⚠️ WebSocket not ready (state: ${websocket.readyState})`);
    }
    return false;
  }
}

// Fallback to HTTP API when WebSocket fails
function useFallbackHttp(command) {
  console.log("ℹ️ Using HTTP fallback for command:", command);
  
  let url = '/api/';
  let method = 'GET';
  let body = null;
  
  // Map WebSocket commands to REST API endpoints
  switch (command.action) {
    case 'setOutputState':
      url += 'power';
      method = 'POST';
      body = { enable: command.enabled };
      break;
    case 'setVoltage':
      url += 'voltage';
      method = 'POST';
      body = { voltage: command.voltage };
      break;
    case 'setCurrent':
      url += 'current';
      method = 'POST';
      body = { current: command.current };
      break;
    case 'getStatus':
      url += 'data';
      break;
    default:
      console.warn("⚠️ No HTTP fallback for command:", command.action);
      return;
  }
  
  // Send HTTP request
  if (method === 'GET') {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log("✅ HTTP fallback success:", data);
        updateUI(data);
      })
      .catch(err => console.error("❌ HTTP fallback error:", err));
  } else {
    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(response => response.json())
      .then(data => {
        console.log("✅ HTTP fallback success:", data);
        // Get updated data
        fetch('/api/data')
          .then(response => response.json())
          .then(data => updateUI(data))
          .catch(err => console.error("❌ Error fetching data:", err));
      })
      .catch(err => console.error("❌ HTTP fallback error:", err));
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
  console.log("⏱️ Starting periodic updates");
  
  // Initially try HTTP if WebSocket isn't connected
  if (!websocketConnected) {
    console.log("ℹ️ WebSocket not connected, using HTTP for initial data");
    fetch('/api/data')
      .then(response => response.json())
      .then(data => {
        updateUI(data);
        console.log("✅ Initial HTTP data loaded");
      })
      .catch(err => console.error("❌ Error fetching initial data:", err));
  }
  
  // Set up recurring updates with WebSocket or HTTP fallback
  setInterval(() => {
    if (websocketConnected) {
      requestPsuStatus();
    } else {
      // Try to reconnect WebSocket first
      if (reconnectAttempts < maxReconnectAttempts) {
        console.log("🔄 Trying to reconnect WebSocket...");
        initWebSocket();
      }
      
      // Use HTTP fallback if not connected
      if (!websocketConnected) {
        console.log("ℹ️ Using HTTP fallback for status update");
        fetch('/api/data')
          .then(response => response.json())
          .then(data => updateUI(data))
          .catch(err => console.error("❌ HTTP fallback error:", err));
      }
    }
  }, 5000);
}

// Update the connection status display in the UI - improved with better visual feedback
function updateConnectionStatusDisplay(status, deviceIP) {
  const statusElement = document.getElementById('websocket-status');
  const deviceElement = document.getElementById('connected-device');
  
  if (!statusElement || !deviceElement) return;
  
  // Update status text and styles
  switch(status) {
    case 'connected':
      statusElement.textContent = 'Connected';
      statusElement.className = 'text-success font-bold';
      break;
    case 'connecting':
      statusElement.textContent = 'Connecting...';
      statusElement.className = 'text-secondary font-bold';
      break;
    case 'disconnected':
      statusElement.textContent = 'Disconnected';
      statusElement.className = 'text-danger font-bold';
      break;
    case 'error':
      statusElement.textContent = 'Connection Error';
      statusElement.className = 'text-danger font-bold';
      break;
  }
  
  // Update device IP display
  deviceElement.textContent = deviceIP;
  
  // Save connected device to make it easier to reconnect
  if (status === 'connected') {
    localStorage.setItem('lastConnectedIP', deviceIP);
  }
}

// Connect to a specific device IP
function connectToDevice(deviceIP) {
  if (!deviceIP) return false;
  
  console.log(`Switching to device: ${deviceIP}`);
  
  // Save the selected device
  localStorage.setItem('selectedDeviceIP', deviceIP);
  
  // Close any existing connection
  if (websocket) {
    try {
      websocket.close();
      websocket = null;
    } catch (e) {
      console.error('Error closing WebSocket:', e);
    }
  }
  
  // Reset connection state
  websocketConnected = false;
  isConnecting = false;
  reconnectAttempts = 0;
  
  // Initialize connection to the new device
  setTimeout(initWebSocket, 100);
  
  return true;
}

// Make these functions available globally for direct access
window.initWebSocket = initWebSocket;
window.connectToDevice = connectToDevice;
window.getWebSocketIP = getWebSocketIP;

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
  startPeriodicUpdates,
  connectToDevice,
  getWebSocketIP
};