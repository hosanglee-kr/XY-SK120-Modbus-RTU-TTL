import { updateUI, updatePsuUI, updateOutputStatus } from './menu_display.js';
import { fetchData } from '../main.js';

let websocket;
let reconnectInterval;

// Handle WebSocket communication
function initWebSocket() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
  
  console.log(`Connecting to WebSocket at ${wsUrl}`);
  
  websocket = new WebSocket(wsUrl);
  window.websocket = websocket; // Make it globally accessible
  
  websocket.onopen = () => {
    console.log('WebSocket connected');
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
    requestData();
  };
  
  websocket.onclose = () => {
    console.log('WebSocket disconnected');
    if (!reconnectInterval) {
      reconnectInterval = setInterval(initWebSocket, 5000);
    }
  };
  
  websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  websocket.onmessage = (event) => {
    console.log('WebSocket message received:', event.data);
    try {
      const data = JSON.parse(event.data);
      
      // Handle different response types
      if (data.action === 'statusResponse') {
        updatePsuUI(data);
      } else if (data.action === 'powerOutputResponse') {
        updateOutputStatus(data.enabled);
        fetchData(); // Refresh all data
      } else if (data.action === 'setVoltageResponse' || data.action === 'setCurrentResponse') {
        // Refresh data after voltage/current change
        requestPsuStatus();
      } else {
        // Handle regular data updates
        updateUI(data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
}

// Request data through WebSocket
function requestData() {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({ action: 'getData' }));
  }
}

// Request PSU status via WebSocket
function requestPsuStatus() {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({ action: "getStatus" }));
  } else {
    console.log("WebSocket not connected, using fetch instead");
    fetchData();
  }
}

// Send a command through the WebSocket
function sendCommand(command) {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify(command));
    return true;
  } else {
    console.error("WebSocket not connected");
    return false;
  }
}

export { initWebSocket, requestData, requestPsuStatus, sendCommand };