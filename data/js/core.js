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

// Add a connection ready promise that other modules can await
window.websocketReadyPromise = new Promise((resolve) => {
    window.resolveWebsocketReady = resolve;
});

// Expose a safe way to use the websocket
window.whenWebsocketReady = function(callback) {
    if (window.websocketConnected && window.websocket && 
        window.websocket.readyState === WebSocket.OPEN) {
        // If already connected, execute immediately
        callback();
    } else {
        // Otherwise wait for connection
        window.websocketReadyPromise.then(callback);
    }
};

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

// Load basic controls with better error handling
function loadBasicControls() {
    try {
        // Define default versions of key functions to prevent errors until modules load
        window.togglePower = window.togglePower || function(isOn) {
            console.log("Placeholder togglePower called with:", isOn);
        };
        
        window.updateAllStatus = window.updateAllStatus || function() {
            console.log("Placeholder updateAllStatus called");
        };
        
        window.requestPsuStatus = window.requestPsuStatus || function() {
            console.log("Placeholder requestPsuStatus called");
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
    console.log('DOM loaded, initializing core functionality');
    
    // Initialize core functionality
    initializeModules();
    
    // Setup base WebSocket connection with a delay
    setTimeout(initWebSocket, 1000);
    
    // Add a ping mechanism to keep the connection alive
    setInterval(() => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            // Send a lightweight ping message
            sendCommand({ action: 'ping' });
        }
    }, 30000); // Send a ping every 30 seconds
});

// Initialize modules
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
    
    // Import device manager
    import('./device_manager.js').then(module => {
        if(module.initDeviceManager) module.initDeviceManager();
    }).catch(err => console.error('Failed to load device manager:', err));
}

// WebSocket connection function
function initWebSocket() {
    // Get device IP - with fallback to current hostname
    // Check for manual override first (for device manager connections)
    let deviceIP = window.manualDeviceIP || localStorage.getItem('selectedDeviceIP') || window.location.hostname;
    
    // Don't clear the manual device IP so it persists for connection status checks
    // Instead, store it directly as the currentDeviceIP
    window.currentDeviceIP = deviceIP;
    
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
    
    console.log(`Creating WebSocket connection to ${wsUrl}`);
    updateStatus('connecting', deviceIP);
    
    try {
        // Create new WebSocket connection
        websocket = new WebSocket(wsUrl);
        
        // Make it globally available immediately
        window.websocket = websocket;
        window.socket = websocket; // For compatibility
        
        // Setup event handlers
        websocket.onopen = function() {
            console.log('WebSocket connected to', deviceIP);
            websocketConnected = true;
            window.websocketConnected = true;
            
            updateStatus('connected', deviceIP);
            
            // Resolve the ready promise
            if (window.resolveWebsocketReady) {
                window.resolveWebsocketReady();
            }
            
            // Test connection with a ping - but be gentler on ESP32
            setTimeout(() => {
                // Request initial status - safer than ping test
                if (typeof window.requestDeviceStatus === 'function') {
                    window.requestDeviceStatus();
                }
                
                // Broadcast connection event to modules
                document.dispatchEvent(new CustomEvent('websocket-connected', {
                    detail: { deviceIP: deviceIP }
                }));
                
                // Update saved devices list to reflect new connection
                if (typeof window.updateSavedDevicesList === 'function') {
                    setTimeout(() => window.updateSavedDevicesList(), 500);
                }
            }, 500);
        };
        
        websocket.onclose = function(event) {
            console.log('WebSocket disconnected, code:', event.code);
            websocketConnected = false;
            window.websocketConnected = false;
            updateStatus('disconnected', deviceIP);
            
            // Broadcast disconnection event
            document.dispatchEvent(new CustomEvent('websocket-disconnected', {
                detail: { deviceIP: deviceIP }
            }));
            
            // Update saved devices list to reflect disconnection
            if (typeof window.updateSavedDevicesList === 'function') {
                setTimeout(() => window.updateSavedDevicesList(), 500);
            }
            
            // Attempt automatic reconnection after a delay
            setTimeout(() => {
                if (!websocketConnected && !window.manualDisconnect) {
                    console.log("Attempting automatic reconnection...");
                    initWebSocket();
                }
            }, 3000);
        };
        
        websocket.onerror = function(error) {
            console.error('WebSocket error:', error);
            websocketConnected = false;
            window.websocketConnected = false;
            updateStatus('error', deviceIP);
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

// Add a more reliable WebSocket setup function that other code can use
window.setupWebSocket = function(ip) {
    window.manualDeviceIP = ip;
    
    // Also store it in localStorage to be consistent
    if (ip) {
        localStorage.setItem('selectedDeviceIP', ip);
    }
    
    return initWebSocket();
};

// Update connection status with enhanced UI
function updateStatus(status, deviceIP) {
    const statusElement = document.getElementById('websocket-status');
    const statusIndicator = document.getElementById('websocket-status-indicator');
    const activeDeviceName = document.getElementById('active-device-name');
    
    // Also update popup elements if they exist
    const popupStatus = document.getElementById('popup-status');
    const popupDeviceIP = document.getElementById('popup-device-ip');
    
    // Get the device name if available
    let deviceName = '';
    if (typeof window.getDeviceName === 'function') {
        deviceName = window.getDeviceName(deviceIP) || '';
    }
    
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
    
    // Update active device name display
    if (activeDeviceName) {
        if (deviceName) {
            activeDeviceName.textContent = deviceName;
        } else {
            activeDeviceName.textContent = deviceIP;
        }
        
        // Make it visible
        activeDeviceName.classList.remove('hidden');
        activeDeviceName.classList.add('md:inline');
    }
    
    // Update popup details if it exists
    if (popupStatus) {
        switch(status) {
            case 'connected':
                popupStatus.textContent = 'Connected';
                popupStatus.className = 'text-success';
                break;
            case 'connecting':
                popupStatus.textContent = 'Connecting...';
                popupStatus.className = 'text-secondary';
                break;
            case 'disconnected':
                popupStatus.textContent = 'Disconnected';
                popupStatus.className = 'text-danger';
                break;
            case 'error':
                popupStatus.textContent = 'Connection Error';
                popupStatus.className = 'text-danger';
                break;
        }
    }
    
    if (popupDeviceIP) {
        popupDeviceIP.textContent = deviceIP;
    }
    
    // Store the selected device for reconnection
    if (deviceIP) {
        localStorage.setItem('selectedDeviceIP', deviceIP);
        window.currentDeviceIP = deviceIP;
    }
}

// Handle incoming messages - Enhanced to detect both status and pong responses
function handleMessage(event) {
    try {
        const data = JSON.parse(event.data);
        
        // Only log non-pong messages to avoid console spam
        if (data.action !== 'pong') {
            console.log('Received message:', data);
        } else {
            console.debug('Received pong response');
        }
        
        // Special handling for pong responses for connection testing
        if (data.action === 'pong') {
            console.debug("✅ Received pong response for connection test");
        }
        
        // Special handling for status responses
        if (data.action === 'statusResponse') {
            // Update the last message timestamp
            window.lastStatusResponse = Date.now();
            
            // Remove the "Refresh Status" button if it exists
            const refreshStatusBtn = document.getElementById('refresh-status-button');
            if (refreshStatusBtn) {
                refreshStatusBtn.parentNode.removeChild(refreshStatusBtn);
            }
        }
        
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

// Send a command to the device - Enhanced with better error handling for ESP32
window.sendCommand = function(command) {
    // Log all commands for debugging (except routine pings which would flood the console)
    if (command.action !== 'ping') {
        console.log('Sending command:', command);
    } else {
        console.debug('Sending ping');
    }
    
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
            }, 3000); // Increased for ESP32
        }
        
        return false;
    }
    
    try {
        const commandStr = JSON.stringify(command);
        websocket.send(commandStr);
        
        // Only log non-ping commands fully
        if (command.action !== 'ping') {
            console.log('Successfully sent command:', command);
            
            // Dispatch a custom event for logging in the log viewer
            document.dispatchEvent(new CustomEvent('websocket-sent', { 
                detail: command 
            }));
        }
        
        return true;
    } catch (e) {
        console.error('Error sending command:', e);
        return false;
    }
}

// Add a function to request device status that other components can use
window.requestDeviceStatus = function() {
    return window.sendCommand({ action: 'getStatus', timestamp: Date.now() });
};

// Expose key functions globally (consolidated exports)
window.initWebSocket = initWebSocket;
window.sendCommand = window.sendCommand || sendCommand;

// Add getCurrentDeviceIP helper
window.getCurrentDeviceIP = function() {
    return window.currentDeviceIP || localStorage.getItem('selectedDeviceIP') || window.location.hostname;
};

// Fallback initialization for auto-refresh
document.addEventListener('DOMContentLoaded', function() {
    // Check for auto-refresh after 3 seconds
    setTimeout(() => {
        if (typeof window.startAutoRefresh === 'function') {
            if (window.websocketConnected) {
                window.startAutoRefresh();
            }
        } else {
            // Try to manually import the basic_control.js module
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

// Track WebSocket connection status
window.lastWebSocketMessage = 0; 

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("Core module loaded");
    
    // Connect to WebSocket if not connected
    if (!window.socket || window.socket.readyState !== 1) {
        window.initWebSocket();
    }
    
    // Remove any refresh status buttons that might be created during initialization
    setTimeout(removeRefreshStatusButtons, 2000);
    
    // Add a mutation observer to remove any dynamically added refresh status buttons
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                for (const node of mutation.addedNodes) {
                    if (node.id && node.id.includes('refresh-status')) {
                        node.parentNode.removeChild(node);
                    }
                }
            }
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
});

// Initialize websocket status indicator popup
function setupWebSocketStatusIndicator() {
    const statusContainer = document.querySelector('.websocket-status-container');
    const detailsPopup = document.querySelector('.websocket-details-popup');
    
    if (statusContainer && detailsPopup) {
        // Toggle popup on click
        statusContainer.addEventListener('click', (e) => {
            // Prevent this from triggering if we click the Test Connection button
            if (e.target.id === 'popup-test-connection') return;
            
            detailsPopup.classList.toggle('hidden');
            
            // Update last message time
            const lastMessageEl = document.getElementById('popup-last-message');
            if (lastMessageEl) {
                if (window.lastStatusResponse) {
                    const timeSince = Math.floor((Date.now() - window.lastStatusResponse) / 1000);
                    if (timeSince < 60) {
                        lastMessageEl.textContent = `${timeSince} seconds ago`;
                    } else if (timeSince < 3600) {
                        lastMessageEl.textContent = `${Math.floor(timeSince / 60)} minutes ago`;
                    } else {
                        lastMessageEl.textContent = `${Math.floor(timeSince / 3600)} hours ago`;
                    }
                } else {
                    lastMessageEl.textContent = 'No response yet';
                }
            }
        });
        
        // Setup test connection button
        const testButton = document.getElementById('popup-test-connection');
        if (testButton) {
            testButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the popup toggle
                detailsPopup.classList.add('hidden'); // Hide popup
                
                if (typeof window.checkFullConnectivity === 'function') {
                    window.checkFullConnectivity();
                } else {
                    alert('Connection test function not available');
                }
            });
        }
        
        // Close popup when clicking outside
        document.addEventListener('click', (e) => {
            if (!statusContainer.contains(e.target) && !detailsPopup.classList.contains('hidden')) {
                detailsPopup.classList.add('hidden');
            }
        });
    }
}

// Initialize on page load - add WebSocket status indicator setup
document.addEventListener('DOMContentLoaded', function() {
    console.log("Core module loaded");
    
    // Setup WebSocket status indicator
    setupWebSocketStatusIndicator();
    
    // Connect to WebSocket if not connected
    if (!window.socket || window.socket.readyState !== 1) {
        window.initWebSocket();
    }
});

// Remove any status refresh buttons that might be created by other modules
function removeRefreshStatusButtons() {
    const refreshButtons = document.querySelectorAll('[id^="refresh-status"]');
    refreshButtons.forEach(button => {
        if (button && button.parentNode) {
            button.parentNode.removeChild(button);
        }
    });
}

// Function to forcibly continue UI loading despite WebSocket failures
function forceUiContinuation() {
    console.log("Forcing UI to continue loading despite WebSocket failure");
    
    // Set a flag indicating offline mode
    window.offlineMode = true;
    
    // Create an error banner for the user
    setTimeout(showConnectionErrorBanner, 1500);
}
