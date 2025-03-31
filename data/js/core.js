/**
 * Core functionality for XY-SK120
 * Handles WebSocket communication and module loading
 */

// WebSocket connection variables - CENTRAL DECLARATION
let websocket = null;
let websocketConnected = false;
let autoRefreshTimer = null; // SINGLE GLOBAL DECLARATION - all modules should use this

// Declare global connection management functions
window.websocket = null;
window.websocketConnected = false;
window.autoRefreshTimer = null;

// Default control settings
const DEFAULT_CONTROL_SETTINGS = {
    voltage: 0,
    current: 0,
    power: 0
};

// Store control settings
let controlSettings = { ...DEFAULT_CONTROL_SETTINGS };

// Add error handling for importing modules
window.moduleImportErrors = {};

// Load basic controls with better error handling - make key functions available early
function loadBasicControls() {
    try {
        // Define default versions of key functions to prevent errors until modules load
        window.togglePower = window.togglePower || function(isOn) {
            console.log("Placeholder togglePower called with:", isOn);
            // Will be replaced when module loads
        };
        
        window.updateAllStatus = window.updateAllStatus || function() {
            console.log("Placeholder updateAllStatus called");
            // Will be replaced when module loads
        };
        
        window.requestPsuStatus = window.requestPsuStatus || function() {
            console.log("Placeholder requestPsuStatus called");
            // Will be replaced when module loads
        };
        
        // Load the actual module
        import('./basic_control.js')
            .then(module => {
                console.log("Basic controls module loaded");
                window.initBasicControls = module.initBasicControls;
                window.togglePower = module.togglePower;
                window.updateAllStatus = module.updateAllStatus;
                window.requestPsuStatus = module.requestPsuStatus;
                window.requestOperatingMode = module.requestOperatingMode;
                window.startAutoRefresh = module.startAutoRefresh;
                window.stopAutoRefresh = module.stopAutoRefresh;
                
                // Initialize basic controls if ready
                if (typeof window.initBasicControls === 'function') {
                    window.initBasicControls();
                }
            })
            .catch(error => {
                console.error("Failed to load basic controls:", error);
                window.moduleImportErrors.basicControl = error.message;
            });
    } catch (error) {
        console.error("Failed to import basic_control.js", error);
        window.moduleImportErrors.basicControl = error.message;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Import and initialize all modules
    initializeModules();
    
    // Setup base WebSocket connection
    setTimeout(initWebSocket, 500);
    
    // Add a ping mechanism to keep the connection alive
    setInterval(() => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            // Send a lightweight ping message
            sendCommand({ action: 'ping' });
        }
    }, 30000); // Send a ping every 30 seconds
});

// Improved initializeModules function - provide default implementations
function initializeModules() {
    // Define placeholders for critical functions
    window.togglePower = function(isOn) {
        console.log("Default togglePower called, waiting for module to load");
        setTimeout(() => initWebSocket(), 500);
    };
    
    window.updateAllStatus = function() {
        console.log("Default updateAllStatus called, waiting for module to load");
    };
    
    window.requestPsuStatus = function() {
        console.log("Default requestPsuStatus called, waiting for module to load");
    };
    
    // Import status module first
    import('./status.js').then(module => {
        window.updateOperatingMode = module.updateOperatingMode;
        window.updateOutputStatus = module.updateOutputStatus;
        window.updatePsuUI = module.updatePsuUI;
        window.updateUI = module.updateUI;
        window.updateHeartbeatSpeed = module.updateHeartbeatSpeed;
        window.toggleHeartbeatIndicator = module.toggleHeartbeatIndicator;
        console.log("Status module loaded successfully");
    }).catch(err => console.error('Failed to load status module:', err));
    
    // Then import basic functionality with key lock monitoring
    import('./basic_control.js').then(module => {
        window.initBasicControls = module.initBasicControls;
        window.togglePower = module.togglePower;
        window.updateAllStatus = module.updateAllStatus;
        window.requestPsuStatus = module.requestPsuStatus;
        window.requestOperatingMode = module.requestOperatingMode;
        window.setConstantVoltage = module.setConstantVoltage;
        window.setConstantCurrent = module.setConstantCurrent;
        window.setConstantPower = module.setConstantPower;
        window.setConstantPowerMode = module.setConstantPowerMode;
        window.startAutoRefresh = module.startAutoRefresh;
        window.stopAutoRefresh = module.stopAutoRefresh;
        window.requestKeyLockStatus = module.requestKeyLockStatus;
        window.startKeyLockStatusMonitor = module.startKeyLockStatusMonitor;
        window.stopKeyLockStatusMonitor = module.stopKeyLockStatusMonitor;
        
        // Expose the key lock status update function globally
        window.updateKeyLockStatus = module.updateKeyLockStatus;
        
        if(module.initBasicControls) module.initBasicControls();
        console.log("Basic controls module loaded successfully");
    }).catch(err => console.error('Failed to load basic controls:', err));
    
    // Import settings
    import('./menu_settings.js').then(module => {
        if(module.initSettings) module.initSettings();
    }).catch(err => console.error('Failed to load settings:', err));
    
    // Import device manager - name remains the same
    import('./device_manager.js').then(module => {
        if(module.initDeviceManager) module.initDeviceManager();
    }).catch(err => console.error('Failed to load device manager:', err));
    
    // Remove status_monitor.js import - already commented out
    
    // Import other modules as needed
    // Note: Each module should handle its own initialization
}

// WebSocket connection functions - improved with better error handling
function initWebSocket() {
    // Get device IP - with fallback to current hostname
    let deviceIP = localStorage.getItem('selectedDeviceIP') || window.location.hostname;
    
    // If device IP is localhost but we're accessing from a remote host, use the current hostname
    if (deviceIP === 'localhost' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
        deviceIP = window.location.hostname;
    }
    
    // Close existing connection if any
    if (websocket) {
        try {
            if (websocket.readyState < 2) { // Only close if not already closing or closed
                websocket.close();
            }
            websocket = null;
            window.websocket = null;
        } catch (e) {
            console.error('Error closing WebSocket:', e);
        }
    }
    
    // Build WebSocket URL - ensure it has the correct protocol
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${deviceIP}/ws`;
    
    try {
        // Create new WebSocket connection
        console.log(`Creating central WebSocket at: ${wsUrl}`);
        updateStatus('connecting', deviceIP);
        
        websocket = new WebSocket(wsUrl);
        
        // Make it globally available immediately
        window.websocket = websocket;
        window.socket = websocket; // For compatibility
        
        // Setup event handlers
        websocket.onopen = function() {
            console.log('🟢 WebSocket connected');
            websocketConnected = true;
            window.websocketConnected = true; // Make sure global flag is set
            
            updateStatus('connected', deviceIP);
            
            // Broadcast connection event to modules
            document.dispatchEvent(new CustomEvent('websocket-connected'));
            
            // Request initial status
            if (typeof window.updateAllStatus === 'function') {
                setTimeout(() => {
                    try {
                        window.updateAllStatus();
                    } catch (e) {
                        console.error("Error in updateAllStatus:", e);
                    }
                }, 500);
            }
        };
        
        websocket.onclose = function(event) {
            console.log('🔴 WebSocket disconnected, code:', event.code);
            websocketConnected = false;
            window.websocketConnected = false;
            updateStatus('disconnected', deviceIP);
            
            // Broadcast disconnection event
            document.dispatchEvent(new CustomEvent('websocket-disconnected'));
            
            // Attempt automatic reconnection after a delay
            setTimeout(() => {
                if (!websocketConnected && !window.manualDisconnect) {
                    console.log("Attempting automatic reconnection...");
                    initWebSocket();
                }
            }, 3000);
        };
        
        websocket.onerror = function(error) {
            console.error('⚠️ WebSocket error:', error);
            websocketConnected = false;
            window.websocketConnected = false;
            updateStatus('error', deviceIP);
            
            // Don't attempt immediate reconnection - let onclose handler do it
        };
        
        websocket.onmessage = function(event) {
            handleMessage(event);
        };
        
        return true;
    } catch (error) {
        console.error('Error creating WebSocket:', error);
        updateStatus('error', deviceIP);
        websocketConnected = false;
        window.websocketConnected = false;
        
        // Attempt reconnection after a delay
        setTimeout(() => {
            if (!websocketConnected) {
                console.log("Attempting reconnection after error...");
                initWebSocket();
            }
        }, 5000);
        
        return false;
    }
}

// Enhanced update status function
function updateStatus(status, deviceIP) {
    const statusElement = document.getElementById('websocket-status');
    const statusIndicator = document.getElementById('websocket-status-indicator');
    
    if (statusElement) {
        switch(status) {
            case 'connected':
                statusElement.textContent = 'Connected';
                statusElement.className = 'text-sm text-success font-bold';
                break;
            case 'connecting':
                statusElement.textContent = 'Connecting...';
                statusElement.className = 'text-sm text-secondary font-bold';
                break;
            case 'disconnected':
                statusElement.textContent = 'Disconnected';
                statusElement.className = 'text-sm text-danger font-bold';
                break;
            case 'error':
                statusElement.textContent = 'Connection Error';
                statusElement.className = 'text-sm text-danger font-bold';
                break;
        }
    }
    
    // Update the status indicator dot
    if (statusIndicator) {
        switch(status) {
            case 'connected':
                statusIndicator.className = 'h-3 w-3 rounded-full bg-success mr-2';
                break;
            case 'connecting':
                statusIndicator.className = 'h-3 w-3 rounded-full bg-secondary mr-2';
                break;
            case 'disconnected':
            case 'error':
                statusIndicator.className = 'h-3 w-3 rounded-full bg-danger mr-2';
                break;
        }
    }
    
    // Store the selected device for reconnection
    if (deviceIP) {
        localStorage.setItem('selectedDeviceIP', deviceIP);
    }
}

// Handle incoming messages and route to appropriate modules - IMPROVED VERSION
function handleMessage(event) {
    try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        // REMOVED: Don't automatically highlight tabs on status updates
        // if (data.action === 'statusResponse' && data.operatingMode) {
        //     if (typeof window.highlightActiveOperatingMode === 'function') {
        //         window.highlightActiveOperatingMode(data.operatingMode);
        //     }
        // }
        
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

// Send a command to the device with improved error handling
window.sendCommand = function(command) {
    // Log all commands for debugging
    console.log('Attempting to send command:', command);
    
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not connected. Current state:', websocket ? websocket.readyState : 'undefined');
        
        // Special handling for critical commands - reconnect first
        if (command.action === 'setOutputState' || command.action === 'getStatus' || 
            command.action === 'powerOutput') {
            console.log('Critical command - attempting to reconnect first...');
            
            // Try to reconnect first and queue the command for retry
            window.pendingCommand = command;
            initWebSocket();
            
            // Schedule command retry after reconnection attempt
            setTimeout(() => {
                if (websocket && websocket.readyState === WebSocket.OPEN && window.pendingCommand) {
                    console.log('Retrying command after reconnection:', window.pendingCommand);
                    const cmd = window.pendingCommand;
                    window.pendingCommand = null;
                    window.sendCommand(cmd);
                }
            }, 1500);
        }
        
        return false;
    }
    
    try {
        const commandStr = JSON.stringify(command);
        websocket.send(commandStr);
        console.log('Successfully sent command:', command);
        
        // Dispatch a custom event for logging in the log viewer
        document.dispatchEvent(new CustomEvent('websocket-sent', { 
            detail: command 
        }));
        
        return true;
    } catch (e) {
        console.error('Error sending command:', e);
        return false;
    }
}

// Expose key functions globally
window.initWebSocket = initWebSocket;

// Add this check at the end of the file to ensure auto-refresh starts

// Fallback initialization for auto-refresh - updated import path
document.addEventListener('DOMContentLoaded', function() {
    // Check for auto-refresh after 3 seconds
    setTimeout(() => {
        if (typeof window.startAutoRefresh === 'function') {
            if (window.websocketConnected) {
                window.startAutoRefresh();
            }
        } else {
            // Try to manually import the basic_control.js module (renamed)
            import('./basic_control.js')
                .then(module => {
                    if (typeof module.startAutoRefresh === 'function') {
                        window.startAutoRefresh = module.startAutoRefresh;
                        if (window.websocketConnected) {
                            window.startAutoRefresh();
                        }
                    }
                })
                .catch(err => console.error("Failed to import basic_control.js"));
        }
    }, 3000);
});

/**
 * Core functionality for XY-SK120 Power Supply Control
 */

// Track WebSocket connection status for proper debugging
window.lastWebSocketMessage = 0; 

// Store the original WebSocket constructor if not already stored
if (typeof window.OriginalWebSocket === 'undefined') {
    window.OriginalWebSocket = WebSocket;
    
    // Override WebSocket constructor to track connections
    window.WebSocket = function(url, protocols) {
        console.log(`Creating WebSocket connection to ${url}`);
        
        // Create the actual WebSocket instance
        const ws = new window.OriginalWebSocket(url, protocols);
        
        // Store the global reference to use for debugging
        window.socket = ws;
        
        // Track the last message timestamp
        ws.addEventListener('message', function() {
            window.lastWebSocketMessage = Date.now();
            
            // Also update the UI indicator if it exists
            const indicator = document.getElementById('websocket-status-indicator');
            if (indicator) {
                indicator.classList.remove('bg-gray-300', 'bg-red-500');
                indicator.classList.add('bg-green-500');
            }
            
            // Update text status if it exists
            const statusText = document.getElementById('websocket-status');
            if (statusText) {
                statusText.textContent = 'Connected';
            }
        });
        
        // Handle connection open
        ws.addEventListener('open', function() {
            console.log('WebSocket connection established');
            window.lastWebSocketMessage = Date.now();
            
            // Update UI if it exists
            const indicator = document.getElementById('websocket-status-indicator');
            if (indicator) {
                indicator.classList.remove('bg-gray-300', 'bg-red-500');
                indicator.classList.add('bg-green-500');
            }
            
            // Update text status if it exists
            const statusText = document.getElementById('websocket-status');
            if (statusText) {
                statusText.textContent = 'Connected';
            }
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('websocket-state-change', { detail: 'Connected' }));
        });
        
        // Handle connection close
        ws.addEventListener('close', function() {
            console.log('WebSocket connection closed');
            
            // Update UI if it exists
            const indicator = document.getElementById('websocket-status-indicator');
            if (indicator) {
                indicator.classList.remove('bg-gray-300', 'bg-green-500');
                indicator.classList.add('bg-red-500');
            }
            
            // Update text status if it exists
            const statusText = document.getElementById('websocket-status');
            if (statusText) {
                statusText.textContent = 'Disconnected';
            }
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('websocket-state-change', { detail: 'Disconnected' }));
        });
        
        // Handle errors
        ws.addEventListener('error', function(error) {
            console.error('WebSocket error:', error);
            
            // Update UI if it exists
            const indicator = document.getElementById('websocket-status-indicator');
            if (indicator) {
                indicator.classList.remove('bg-gray-300', 'bg-green-500');
                indicator.classList.add('bg-red-500');
            }
            
            // Update text status if it exists
            const statusText = document.getElementById('websocket-status');
            if (statusText) {
                statusText.textContent = 'Error';
            }
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('websocket-error', { detail: error }));
        });
        
        return ws;
    };
    
    // Copy over static properties
    for (const prop in window.OriginalWebSocket) {
        if (window.OriginalWebSocket.hasOwnProperty(prop)) {
            window.WebSocket[prop] = window.OriginalWebSocket[prop];
        }
    }
    
    console.log("WebSocket tracking initialized");
}

// Initialize WebSocket connection (if not already defined)
if (typeof window.initWebSocket !== 'function') {
    window.initWebSocket = function() {
        // Close existing connection if any
        if (window.socket && window.socket.readyState < 2) {
            window.socket.close();
        }
        
        try {
            // Determine host from current location by default
            const host = window.location.hostname;
            const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsURL = `${wsProtocol}//${host}:${port}/ws`;
            
            console.log(`Connecting to WebSocket: ${wsURL}`);
            window.socket = new WebSocket(wsURL);
            
            // Already have event handlers from our WebSocket constructor override
            return true;
        } catch (error) {
            console.error("Error establishing WebSocket connection:", error);
            return false;
        }
    };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("Core module loaded");
    
    // Connect to WebSocket if not connected
    if (!window.socket || window.socket.readyState !== 1) {
        window.initWebSocket();
    }
});
