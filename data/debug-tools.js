/**
 * Debug Tools for Power Supply Interface
 * 
 * This file contains utilities to help diagnose and fix connection issues.
 */

// Display the full system status
function systemStatus() {
  // Check DOM elements
  const criticalElements = [
    'power-toggle',
    'set-voltage',
    'set-current',
    'apply-voltage',
    'apply-current',
    'psu-voltage',
    'psu-current',
    'psu-power',
    'output-status'
  ];
  
  console.log('=== SYSTEM STATUS ===');
  console.log('Critical Elements:');
  
  let allElementsFound = true;
  criticalElements.forEach(id => {
    const found = !!document.getElementById(id);
    console.log(`- ${id}: ${found ? '✓ Found' : '❌ Missing'}`);
    if (!found) allElementsFound = false;
  });
  
  // Check WebSocket
  console.log('\nWebSocket:');
  const ws = window.websocket || { readyState: -1 };
  const wsStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
  const wsStatus = ws.readyState >= 0 && ws.readyState <= 3 ? wsStates[ws.readyState] : 'UNKNOWN';
  
  console.log(`- Status: ${wsStatus}`);
  console.log(`- Connected: ${window.websocketConnected ? '✓ Yes' : '❌ No'}`);
  
  // Return overall status
  return {
    allElementsFound,
    wsConnected: window.websocketConnected,
    wsStatus
  };
}

// Debug function to test the WebSocket
function testWebSocket() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname || 'localhost';
  const port = window.location.port || (wsProtocol === 'wss:' ? '443' : '80');
  const wsUrl = `${wsProtocol}//${hostname}:${port}/ws`;
  
  console.log(`Testing WebSocket connection to: ${wsUrl}`);
  
  try {
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('✅ WebSocket test connection successful!');
      
      // Try sending a simple command
      try {
        ws.send(JSON.stringify({ action: 'getStatus' }));
        console.log('Test command sent successfully');
      } catch (e) {
        console.error('Failed to send test command:', e);
      }
      
      // Close after 2 seconds
      setTimeout(() => ws.close(), 2000);
    };
    
    ws.onerror = (err) => {
      console.error('❌ WebSocket test connection failed:', err);
    };
    
    ws.onmessage = (msg) => {
      console.log('Received response:', msg.data);
    };
    
    ws.onclose = () => {
      console.log('WebSocket test connection closed');
    };
    
    return 'WebSocket test started, check console for results...';
  } catch (err) {
    console.error('Failed to create test WebSocket:', err);
    return 'Failed to create test WebSocket: ' + err.message;
  }
}

// Try direct HTTP API as fallback
function testApi() {
  console.log('Testing HTTP API fallback...');
  
  fetch('/api/data')
    .then(response => {
      console.log('API response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('✅ API test successful:', data);
      
      // Try to update UI with this data
      updateUIFromApiData(data);
      
      return 'API test successful, see console for details';
    })
    .catch(err => {
      console.error('❌ API test failed:', err);
      return 'API test failed: ' + err.message;
    });
}

// Update UI directly from API data
function updateUIFromApiData(data) {
  try {
    // Update voltage
    const voltageElem = document.getElementById('psu-voltage');
    if (voltageElem && data.voltage !== undefined) {
      voltageElem.textContent = parseFloat(data.voltage).toFixed(2);
    }
    
    // Update current
    const currentElem = document.getElementById('psu-current');
    if (currentElem && data.current !== undefined) {
      currentElem.textContent = parseFloat(data.current).toFixed(3);
    }
    
    // Update power
    const powerElem = document.getElementById('psu-power');
    if (powerElem && data.power !== undefined) {
      powerElem.textContent = parseFloat(data.power).toFixed(1);
    }
    
    // Update output status
    const statusElem = document.getElementById('output-status');
    if (statusElem && data.outputEnabled !== undefined) {
      statusElem.textContent = data.outputEnabled ? "ON" : "OFF";
      statusElem.className = data.outputEnabled ? "status-on" : "status-off";
      
      // Also update power toggle
      const toggleElem = document.getElementById('power-toggle');
      if (toggleElem) {
        toggleElem.checked = data.outputEnabled;
      }
    }
    
    console.log('UI updated from API data');
  } catch (err) {
    console.error('Failed to update UI from API data:', err);
  }
}

// Add specific ESP32 WebSocket test function
function testESP32WebSocket() {
  console.log("🧪 Testing WebSocket with alternate connection methods...");
  
  // Try connection with different URL formats
  const urls = [
    `ws://${window.location.hostname}/ws`,
    `ws://${window.location.hostname}:80/ws`,
    `ws://${window.location.hostname}/socket`
  ];
  
  let results = [];
  
  urls.forEach((url, index) => {
    console.log(`Testing URL ${index+1}: ${url}`);
    
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log(`✅ Connection successful to ${url}`);
        results.push({ url, success: true });
        
        // Send a simple test message
        try {
          ws.send(JSON.stringify({ action: 'ping' }));
        } catch (e) {
          console.error('Error sending test message:', e);
        }
        
        // Close after 2 seconds
        setTimeout(() => ws.close(), 2000);
      };
      
      ws.onerror = (err) => {
        console.error(`❌ Connection failed to ${url}:`, err);
        results.push({ url, success: false, error: err });
      };
      
      ws.onclose = () => {
        console.log(`Connection closed for ${url}`);
      };
    } catch (err) {
      console.error(`❌ Error creating WebSocket for ${url}:`, err);
      results.push({ url, success: false, error: err.message });
    }
  });
  
  return "WebSocket tests started - check console for results";
}

// Add WiFi connection test
function testWiFiConnection() {
  console.log("🌐 Testing WiFi connection...");
  
  fetch('/api/wifi/status')
    .then(response => response.json())
    .then(data => {
      console.log("WiFi status:", data);
      
      // Display connection quality
      let quality = "Unknown";
      if (data.rssi !== undefined) {
        const rssi = parseInt(data.rssi);
        if (rssi >= -50) quality = "Excellent";
        else if (rssi >= -65) quality = "Good";
        else if (rssi >= -75) quality = "Fair";
        else if (rssi >= -85) quality = "Poor";
        else quality = "Very Poor";
      }
      
      return `WiFi connected: ${data.connected ? 'Yes' : 'No'}\nSSID: ${data.ssid || 'None'}\nSignal: ${quality}\nIP: ${data.ip || 'None'}`;
    })
    .catch(err => {
      console.error("Error testing WiFi:", err);
      return "WiFi test failed. Device might be in AP mode or HTTP server is not responding.";
    });
}

// Export diagnostics to global namespace
window.diagTools = {
  systemStatus,
  testWebSocket,
  testApi,
  updateUIFromApiData,
  testESP32WebSocket,
  testWiFiConnection,
  emergencyControl: {
    powerOn: () => fetch('/api/power', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable: true })
    }).then(r => r.json()).then(testApi),
    powerOff: () => fetch('/api/power', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable: false })
    }).then(r => r.json()).then(testApi),
    setVoltage: (v) => fetch('/api/voltage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voltage: parseFloat(v) })
    }).then(r => r.json()).then(testApi),
    setCurrent: (c) => fetch('/api/current', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: parseFloat(c) })
    }).then(r => r.json()).then(testApi)
  },
  httpCommands: {
    getStatus: () => fetch('/api/data').then(r => r.json()).then(console.log),
    setPower: (on) => fetch('/api/power', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable: on })
    }).then(r => r.json()).then(console.log),
    // ... other commands ...
  }
};

console.log('📊 Diagnostic tools loaded! Access via diagTools in console');
