/**
 * Core WebSocket functionality for XY-SK120 control
 * Minimal version that initializes modules and handles connections
 */

// Global WebSocket object
let websocket = null;
let websocketConnected = false;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Import and initialize all modules
    initializeModules();
    
    // Setup base WebSocket connection
    setTimeout(initWebSocket, 500);
});

// Initialize all modules
function initializeModules() {
    // Import basic functionality
    import('./menu_basic.js').then(module => {
        if(module.initBasicControls) module.initBasicControls();
    }).catch(err => console.error('Failed to load basic controls:', err));
    
    // Import settings
    import('./menu_settings.js').then(module => {
        if(module.initSettings) module.initSettings();
    }).catch(err => console.error('Failed to load settings:', err));
    
    // Import device manager (web-specific)
    import('./device_manager.js').then(module => {
        if(module.initDeviceManager) module.initDeviceManager();
    }).catch(err => console.error('Failed to load device manager:', err));
    
    // Import other modules as needed
    // Note: Each module should handle its own initialization
}

// WebSocket connection functions
function initWebSocket() {
    // Get device IP
    const deviceIP = localStorage.getItem('selectedDeviceIP') || 'localhost';
    
    // Close existing connection if any
    if (websocket) {
        try {
            websocket.close();
            websocket = null;
        } catch (e) {
            console.error('Error closing WebSocket:', e);
        }
    }
    
    // Build WebSocket URL
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${deviceIP}/ws`;
    
    try {
        // Create new WebSocket connection
        console.log(`Connecting to WebSocket at: ${wsUrl}`);
        updateStatus('connecting', deviceIP);
        
        websocket = new WebSocket(wsUrl);
        
        // Setup event handlers
        websocket.onopen = function() {
            console.log('WebSocket connected');
            websocketConnected = true;
            updateStatus('connected', deviceIP);
            
            // Broadcast connection event to modules
            document.dispatchEvent(new CustomEvent('websocket-connected'));
        };
        
        websocket.onclose = function() {
            console.log('WebSocket disconnected');
            websocketConnected = false;
            updateStatus('disconnected', deviceIP);
            
            // Broadcast disconnection event
            document.dispatchEvent(new CustomEvent('websocket-disconnected'));
        };
        
        websocket.onerror = function(error) {
            console.error('WebSocket error:', error);
            websocketConnected = false;
            updateStatus('error', deviceIP);
        };
        
        websocket.onmessage = function(event) {
            handleMessage(event);
        };
    } catch (error) {
        console.error('Error creating WebSocket:', error);
        updateStatus('error', deviceIP);
    }
}

// Update connection status
function updateStatus(status, deviceIP) {
    const statusElement = document.getElementById('websocket-status');
    const deviceElement = document.getElementById('connected-device');
    
    if (statusElement) {
        switch(status) {
            case 'connected':
                statusElement.textContent = 'Connected';
                break;
            case 'connecting':
                statusElement.textContent = 'Connecting...';
                break;
            case 'disconnected':
                statusElement.textContent = 'Disconnected';
                break;
            case 'error':
                statusElement.textContent = 'Connection Error';
                break;
        }
    }
    
    if (deviceElement) {
        deviceElement.textContent = deviceIP;
    }
}

// Handle incoming messages and route to appropriate modules - IMPROVED VERSION
function handleMessage(event) {
    try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        // Special handling for power commands to ensure UI is updated
        if (data.action === 'setOutputStateResponse' || data.action === 'powerOutputResponse') {
            console.log('Received power state update:', data.enabled ? 'ON' : 'OFF');
            
            // Update UI directly for immediate feedback
            const outputStatus = document.getElementById('output-status');
            const powerToggle = document.getElementById('power-toggle');
            
            if (outputStatus) {
                outputStatus.textContent = data.enabled ? "ON" : "OFF";
                outputStatus.className = data.enabled ? "status-value on" : "status-value off";
            }
            
            if (powerToggle) {
                powerToggle.checked = data.enabled;
            }
        }
        
        // Broadcast the message as a custom event for modules to handle
        document.dispatchEvent(new CustomEvent('websocket-message', { 
            detail: data 
        }));
    } catch (error) {
        console.error('Error parsing message:', error);
    }
}

// Send a command to the device - available globally - IMPROVED VERSION
window.sendCommand = function(command) {
    // Log all commands for debugging
    console.log('Attempting to send command:', command);
    
    if (!websocket) {
        console.error('WebSocket not initialized');
        return false;
    }
    
    if (websocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not connected. Current state:', websocket.readyState);
        
        // Special handling for critical commands like power toggle
        if (command.action === 'setOutputState') {
            console.log('Attempting to reconnect before sending power command...');
            
            // Try to reconnect first
            initWebSocket();
            
            // Alert user about connection issues
            setTimeout(() => {
                if (websocket.readyState !== WebSocket.OPEN) {
                    alert('Connection to device lost. Please check your connection and try again.');
                }
            }, 500);
        }
        
        return false;
    }
    
    try {
        const commandStr = JSON.stringify(command);
        websocket.send(commandStr);
        console.log('Successfully sent command:', command);
        
        // For power commands, log additional info
        if (command.action === 'setOutputState') {
            console.log('Sent power state change to:', command.enabled ? 'ON' : 'OFF');
        }
        
        return true;
    } catch (e) {
        console.error('Error sending command:', e);
        return false;
    }
}

// Expose key functions globally
window.initWebSocket = initWebSocket;
