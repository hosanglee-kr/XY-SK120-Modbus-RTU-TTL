import { updateUI, updatePsuUI, updateOutputStatus } from './menu_display.js';

let websocket = null;
let reconnectTimeout = null;
let isConnecting = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 5000;

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
      requestPsuStatus();
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
  isConnecting = false;
  
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
}

// Handle incoming WebSocket messages
function handleMessage(event) {
  try {
    const data = JSON.parse(event.data);
    
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

// Send a command through the WebSocket
function sendCommand(command) {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    try {
      websocket.send(JSON.stringify(command));
      return true;
    } catch (e) {
      console.error('Error sending command:', e);
      return false;
    }
  } else {
    console.log("WebSocket not connected, attempting reconnect");
    initWebSocket();
    return false;
  }
}

export { initWebSocket, requestData, requestPsuStatus, sendCommand };