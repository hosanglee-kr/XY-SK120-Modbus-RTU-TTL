import { updateUI, updatePsuUI, updateOutputStatus } from './menu_display.js';

// Make WebSocket available globally for debugging
let websocket = null;
let reconnectTimeout = null;
let isConnecting = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 5000;
let websocketConnected = false;

// Add operating mode enum constants to match backend
const OperatingMode = {
  CV: 0,  // Constant Voltage
  CC: 1,  // Constant Current
  CP: 2   // Constant Power
};

// Simple mode name mapping
const OperatingModeNames = {
  0: 'CV', // Constant Voltage
  1: 'CC', // Constant Current
  2: 'CP'  // Constant Power
};

// Function to convert numeric mode to string
function getModeName(modeValue) {
  if (typeof modeValue === 'number') {
    return OperatingModeNames[modeValue] || 'Unknown';
  }
  return modeValue; // Return as-is if already a string
}

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

// Handle incoming WebSocket messages with correct response handling
function handleMessage(event) {
  try {
    const data = JSON.parse(event.data);
    console.log("WebSocket received response:", data);
    
    // Dispatch custom event for other modules to handle
    const wsEvent = new CustomEvent('websocket-message', { detail: data });
    document.dispatchEvent(wsEvent);
    
    // Handle specific responses for key functionality
    if (data.action === 'powerOutput') {
      console.log("Power output response:", data);
      if (data.enable !== undefined) {
        updateOutputStatus(data.enable);
        console.log("Power state successfully changed to:", data.enable ? "ON" : "OFF");
      }
      
      // Request operating mode after power state changes
      setTimeout(() => requestOperatingMode(), 300);
    }
    else if (data.action === 'setOutputStateResponse') {
      // Keep for backward compatibility
      console.log("Legacy power state change response:", data);
      if (data.success === true || data.enabled !== undefined) {
        updateOutputStatus(data.enabled);
        console.log("Power state successfully changed to:", data.enabled ? "ON" : "OFF");
      } else {
        console.error("Failed to change power state:", data);
        setTimeout(() => sendCommand({ action: 'getStatus' }), 300);
      }
      
      // Also request operating mode update
      setTimeout(() => requestOperatingMode(), 300);
    }
    else if (data.action === 'setKeyLockResponse') {
      console.log("Key lock response:", data);
      // Update UI based on response if needed
    }
    else if (data.action === 'statusResponse') {
      updatePsuUI(data);
      
      // Extract operating mode from status response if available
      if (data.operatingMode || data.modeCode) {
        console.log("Updating operating mode from status response");
        const modeData = {
          action: 'operatingModeResponse',
          success: true,
          modeCode: data.operatingMode || data.modeCode,
          setValue: data.setValue
        };
        updateOperatingModeUI(modeData.modeCode, modeData.setValue);
      } else {
        // If status doesn't contain mode info, request it explicitly
        requestOperatingMode();
      }
    } 
    else if (data.action === 'powerOutputResponse') {
      updateOutputStatus(data.enable !== undefined ? data.enable : data.enabled);
      
      // Request operating mode after power state changes
      setTimeout(() => requestOperatingMode(), 300);
    }
    // FIXED: Handle the operatingModeResponse action from server
    else if (data.action === 'operatingModeResponse') {
      console.log("Received operating mode response:", data);
      
      // Clear any pending timeout
      if (window._operatingModeRequestData && window._operatingModeRequestData.timeoutId) {
        clearTimeout(window._operatingModeRequestData.timeoutId);
      }
      
      if (data.success === true) {
        // Extract the mode code and set value
        const mode = data.modeCode || data.operatingMode;
        const setValue = data.setValue;
        
        console.log(`Updating operating mode display: ${mode} with value ${setValue}`);
        updateOperatingModeUI(mode, setValue);
        
        // Highlight the tab
        if (window.highlightActiveOperatingMode) {
          window.highlightActiveOperatingMode(mode);
        }
      } else {
        console.warn("Operating mode response indicates failure:", data);
      }
    }
  } catch (error) {
    console.error('Error parsing WebSocket message:', error, event.data);
  }
}

// Improved request operating mode function with loading state
function requestOperatingMode() {
  console.log("requestOperatingMode called - Using updateAllStatus instead");
  return window.updateAllStatus();
}

// Modified sendCommand with improved error handling and request tracking
function sendCommand(command) {
  // Check if we need to remap action names for backward compatibility
  if (command.action === 'getOutputState') {
    console.log("Remapping deprecated action 'getOutputState' to 'powerOutput'");
    command.action = 'powerOutput';
  }
  
  // Generate a unique ID for this command
  const commandId = new Date().getTime();
  const commandWithId = {...command, _id: commandId};
  
  // Debug which command is being sent
  console.log(`🔼 Sending command #${commandId}:`, JSON.stringify(commandWithId));
  
  if (!websocket) {
    console.error("❌ WebSocket not initialized");
    // Try to connect
    initWebSocket();
    return false;
  }
  
  if (websocket.readyState === WebSocket.OPEN) {
    try {
      // Track when the command was sent
      const commandStr = JSON.stringify(command); // Don't send the ID to the server
      websocket.send(commandStr);
      
      // Log success
      console.log(`✅ Command #${commandId} sent successfully`);
      return true;
    } catch (e) {
      console.error(`❌ Error sending command #${commandId}:`, e);
      websocketConnected = false;
      return false;
    }
  } else {
    console.log(`⚠️ WebSocket not ready (state: ${websocket.readyState}) for command #${commandId}`);
    
    // Try HTTP fallback for important commands
    if (command.action !== 'getStatus' && command.action !== 'getOperatingMode') {
      useFallbackHttp(command);
    }
    
    // If closed, try to reconnect
    if (websocket.readyState === WebSocket.CLOSED) {
      console.log("⚠️ WebSocket closed, attempting to reconnect");
      initWebSocket();
    }
    return false;
  }
}

// Fallback to HTTP API when WebSocket fails
function useFallbackHttp(command) {
  console.log("ℹ️ Using HTTP fallback for command:", command);
  
  // Create a copy of the command to modify for HTTP
  let httpCommand = {...command};
  
  // Remap actions for HTTP API if needed
  if (httpCommand.action === 'powerOutput') {
    httpCommand.action = 'setOutputState';  // Map to HTTP endpoint
    // Also rename the parameter if needed
    if (httpCommand.enable !== undefined) {
      httpCommand.enabled = httpCommand.enable;
      delete httpCommand.enable;
    }
  }
  
  let url = '/api/';
  let method = 'GET';
  let body = null;
  
  // Map WebSocket commands to REST API endpoints
  switch (httpCommand.action) {
    case 'setOutputState':
      url += 'power';
      method = 'POST';
      body = { enable: httpCommand.enabled };
      break;
    case 'setVoltage':
      url += 'voltage';
      method = 'POST';
      body = { voltage: httpCommand.voltage };
      break;
    case 'setCurrent':
      url += 'current';
      method = 'POST';
      body = { current: httpCommand.current };
      break;
    case 'getStatus':
      url += 'data';
      break;
    default:
      console.warn("⚠️ No HTTP fallback for command:", httpCommand.action);
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

// Direct UI update for operating mode using data-attributes for styling
function updateOperatingModeUI(mode, setValue) {
  // Get the operating mode display element
  const modeDisplay = document.getElementById('operatingModeDisplay');
  if (!modeDisplay) {
    console.error("operatingModeDisplay element not found!");
    return;
  }
  
  // Format the display text
  let displayText = mode || "--";
  
  if (setValue !== undefined) {
    if (mode === 'CV') {
      displayText += ' ' + parseFloat(setValue).toFixed(2) + 'V';
    } else if (mode === 'CC') {
      displayText += ' ' + parseFloat(setValue).toFixed(3) + 'A';
    } else if (mode === 'CP') {
      displayText += ' ' + parseFloat(setValue).toFixed(1) + 'W';
    }
  }
  
  // Update text content
  modeDisplay.textContent = displayText;
  
  // Set data-mode attribute for styling (more direct than class manipulation)
  modeDisplay.setAttribute('data-mode', mode || 'unknown');
  
  // Add a pulse animation for visual feedback
  modeDisplay.classList.add('mode-pulse');
  
  // Remove the pulse animation after it completes
  setTimeout(() => {
    modeDisplay.classList.remove('mode-pulse');
  }, 300);
}

// Update mode settings display - ENHANCED to use all available data
function updateModeSettingsDisplay(data) {
  console.log("Updating mode settings display with:", data);
  
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

// Simplified - Use only updateAllStatus without fallbacks
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
            // Always use the unified status update function
            window.updateAllStatus();
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

// Simplified - Use only updateAllStatus without fallbacks
function initializeStatusUpdates() {
    // Request complete status on initial connection
    document.addEventListener('websocket-connected', () => {
        console.log("Connection established, requesting full status update");
        setTimeout(window.updateAllStatus, 500);
    });
}

// Make sure this gets called during initialization
window.addEventListener('DOMContentLoaded', initializeStatusUpdates);

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
window.OperatingMode = OperatingMode;
window.getModeName = getModeName;

// Make requestOperatingMode a wrapper around updateAllStatus for compatibility
function requestOperatingMode() {
    console.log("requestOperatingMode called - Using updateAllStatus instead");
    return window.updateAllStatus();
}

// Make requestPsuStatus a wrapper around updateAllStatus for compatibility
function requestPsuStatus() {
    console.log("requestPsuStatus called - Using updateAllStatus instead");
    return window.updateAllStatus();
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
  startPeriodicUpdates,
  connectToDevice,
  getWebSocketIP
};