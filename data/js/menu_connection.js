import { updateUI, updatePsuUI, updateOutputStatus } from './menu_display.js';

// REMOVE LOCAL WEBSOCKET VARIABLE - use the global one instead
// let websocket = null;
let reconnectTimeout = null;
let isConnecting = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 5000;
// let websocketConnected = false; - REMOVE LOCAL VARIABLE

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

// Redefine this function to use the central WebSocket connection
function initWebSocket() {
    console.log("🔄 Using central WebSocket connection (from core.js)");
    
    // Call the central initialization function
    if (typeof window.initWebSocket === 'function') {
        window.initWebSocket();
    } else {
        console.error("Central WebSocket initialization function not available");
    }
}

// Handle WebSocket disconnection
function handleDisconnect() {
  console.log('WebSocket disconnected');
  isConnecting = false;
  window.websocketConnected = false;
  
  // Make sure websocket object is also nulled in the window
  if (window.websocket === websocket) {
    window.websocket = null;
  }
  
  // Dispatch disconnect event for other modules
  try {
    const wsEvent = new CustomEvent('websocket-disconnected');
    document.dispatchEvent(wsEvent);
    console.log("Dispatched websocket-disconnected event");
  } catch (err) {
    console.error("Error dispatching disconnect event:", err);
  }
  
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
    
    // Use the central sendCommand function if available
    if (typeof window.sendCommand === 'function') {
        return window.sendCommand(command);
    }
    
    // Fallback implementation if central function not available
    console.log('Using fallback sendCommand implementation');
    
    // Generate a unique ID for this command
    const commandId = new Date().getTime();
    const commandWithId = {...command, _id: commandId};
    
    // Debug which command is being sent
    console.log(`🔼 Sending command #${commandId}:`, JSON.stringify(commandWithId));
    
    // Use window.websocket instead of local websocket
    if (!window.websocket) {
        console.error("❌ WebSocket not initialized");
        return false;
    }
    
    if (window.websocket.readyState === WebSocket.OPEN) {
        try {
            // Track when the command was sent
            const commandStr = JSON.stringify(command);
            window.websocket.send(commandStr);
            
            // Log success
            console.log(`✅ Command #${commandId} sent successfully`);
            return true;
        } catch (e) {
            console.error(`❌ Error sending command #${commandId}:`, e);
            return false;
        }
    } else {
        console.log(`⚠️ WebSocket not ready (state: ${window.websocket.readyState}) for command #${commandId}`);
        
        // Try HTTP fallback for important commands
        if (command.action !== 'getStatus' && command.action !== 'getOperatingMode') {
            useFallbackHttp(command);
        }
        
        // If closed, try to reconnect
        if (window.websocket.readyState === WebSocket.CLOSED) {
            console.log("⚠️ WebSocket closed, attempting to reconnect");
            // Use the central initWebSocket function
            if (typeof window.initWebSocket === 'function') {
                window.initWebSocket();
            }
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

// Direct UI update for operating mode using data-attributes for styling - REMOVE ANIMATION
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
  
  // Remove the pulse animation
  // No more animation effect
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
    if (!window.websocketConnected) {
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
        if (window.websocketConnected) {
            // Always use the unified status update function
            window.updateAllStatus();
        } else {
            // Try to reconnect WebSocket first
            if (reconnectAttempts < maxReconnectAttempts) {
                console.log("🔄 Trying to reconnect WebSocket...");
                initWebSocket();
            }
            
            // Use HTTP fallback if not connected
            if (!window.websocketConnected) {
                console.log("ℹ️ Using HTTP fallback for status update");
                fetch('/api/data')
                    .then(response => response.json())
                    .then(data => updateUI(data))
                    .catch(err => console.error("❌ HTTP fallback error:", err));
            }
        }
    }, 5000); // Already at 5 seconds, which is good
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

// Make sure window.sendCommand is available
window.sendCommand = sendCommand;

// Export the essential functions
export { 
  initWebSocket, 
  requestData, 
  requestPsuStatus, 
  sendCommand, 
  requestOperatingMode, 
  updateOperatingModeDisplay, 
  updateModeSettingsDisplay,
  startPeriodicUpdates,
  connectToDevice,
  getWebSocketIP
};