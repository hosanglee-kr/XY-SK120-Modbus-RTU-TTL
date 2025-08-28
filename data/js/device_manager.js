/**
 * Device Manager functionality for XY-SK120
 * Handles device selection and connection
 */

// Track connection attempts
let connectionInProgress = false;
let lastConnectionAttempt = null;
let verificationAttempts = 0;

// Initialize device manager
export function initDeviceManager() {
    // Load saved devices
    loadSavedDevices();
    
    // Set up add device form
    setupAddDeviceForm();
    
    // Set up event listeners for device selection
    setupDeviceSelection();
}

// Set up add device form
function setupAddDeviceForm() {
    const addDeviceForm = document.getElementById('add-device-form');
    if (!addDeviceForm) return;
    
    addDeviceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const ipInput = document.getElementById('new-device-ip');
        const nameInput = document.getElementById('new-device-name');
        
        if (!ipInput || !ipInput.value) {
            alert('Please enter a valid IP address');
            return;
        }
        
        const ip = ipInput.value.trim();
        const name = nameInput ? nameInput.value.trim() : '';
        
        // Add the device
        addDevice(ip, name);
        
        // Clear the form
        ipInput.value = '';
        if (nameInput) nameInput.value = '';
        
        // Update the device selector and saved devices list
        setupDeviceSelector();
        updateSavedDevicesList();
        
        // Don't automatically connect to the new device
        // which was causing the "connection method not available" error
        // connectToDevice(ip);
        
        // Show success message instead
        showConnectionStatus(`Device ${name || ip} added to saved devices`);
    });
}

// Load saved devices from localStorage
function loadSavedDevices() {
    try {
        const devicesJson = localStorage.getItem('savedDevices');
        return devicesJson ? JSON.parse(devicesJson) : [];
    } catch (e) {
        console.error('Error loading saved devices:', e);
        return [];
    }
}

// Save devices to localStorage
function saveDevices(devices) {
    try {
        localStorage.setItem('savedDevices', JSON.stringify(devices));
    } catch (e) {
        console.error('Error saving devices:', e);
    }
}

// Add a new device
function addDevice(ip, name) {
    const devices = loadSavedDevices();
    devices.push({ ip: ip, name: name });
    saveDevices(devices);
}

// Set up device selection
function setupDeviceSelection() {
    const deviceSelector = document.getElementById('device-selector');
    if (!deviceSelector) return;
    
    // Load saved devices
    const savedDevices = loadSavedDevices();
    
    // Clear existing options
    deviceSelector.innerHTML = '';
    
    // Add default option for current device
    const currentHostname = window.location.hostname;
    const defaultOption = document.createElement('option');
    defaultOption.value = currentHostname;
    defaultOption.textContent = `Current (${currentHostname})`;
    deviceSelector.appendChild(defaultOption);
    
    // Add saved devices
    savedDevices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.ip;
        option.textContent = device.name || device.ip;
        deviceSelector.appendChild(option);
    });
    
    // Select the currently connected device
    const connectedDevice = localStorage.getItem('selectedDeviceIP');
    if (connectedDevice) {
        deviceSelector.value = connectedDevice;
    }
    
    // Add change event listener
    deviceSelector.addEventListener('change', function() {
        const selectedIP = this.value;
        if (selectedIP) {
            connectToDevice(selectedIP);
        }
    });
}

// Add function to setup the device selector
function setupDeviceSelector() {
    const deviceSelector = document.getElementById('device-selector');
    if (!deviceSelector) return;
    
    // Load saved devices
    const savedDevices = loadSavedDevices();
    
    // Clear existing options
    deviceSelector.innerHTML = '';
    
    // Add default option for current device
    const currentHostname = window.location.hostname;
    const defaultOption = document.createElement('option');
    defaultOption.value = currentHostname;
    defaultOption.textContent = `Current (${currentHostname})`;
    deviceSelector.appendChild(defaultOption);
    
    // Add saved devices
    savedDevices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.ip;
        option.textContent = device.name || device.ip;
        deviceSelector.appendChild(option);
    });
    
    // Select the currently connected device
    const connectedDevice = localStorage.getItem('selectedDeviceIP');
    if (connectedDevice) {
        deviceSelector.value = connectedDevice;
    }
    
    // Add change event listener
    deviceSelector.addEventListener('change', function() {
        const selectedIP = this.value;
        if (selectedIP) {
            connectToDevice(selectedIP);
        }
    });
}

// Connect to a specific device IP
function connectToDevice(deviceIP) {
    // Get the currently connected IP
    const currentConnectedIP = window.websocket && window.websocketConnected ? 
        (window.manualDeviceIP || localStorage.getItem('selectedDeviceIP') || window.location.hostname) : null;
    
    // If trying to connect to the currently connected device, just show success
    if (currentConnectedIP && currentConnectedIP === deviceIP) {
        showConnectionStatus(`Already connected to ${deviceIP}`);
        updateActiveDeviceIndicator(deviceIP);
        updateSavedDevicesList(); // Refresh list to show correct connection status
        return;
    }
    
    // Prevent connecting to the same device repeatedly
    if (connectionInProgress && lastConnectionAttempt === deviceIP) {
        console.log('Connection attempt already in progress for:', deviceIP);
        return;
    }
    
    // Reset verification attempts counter
    verificationAttempts = 0;
    
    // Set connection tracking
    connectionInProgress = true;
    lastConnectionAttempt = deviceIP;
    
    // Store the selected device IP in localStorage
    localStorage.setItem('selectedDeviceIP', deviceIP);
    
    // Show connecting message
    showConnectionStatus('Connecting to ' + deviceIP + '...');
    
    // Create/update a device indicator in the UI
    updateActiveDeviceIndicator(deviceIP);
    
    // Check if we're already on the correct device
    if (window.location.hostname === deviceIP) {
        showConnectionStatus('Already connected to ' + deviceIP);
        connectionInProgress = false;
        return;
    }
    
    // Try to connect using WebSocket - with a longer timeout for ESP32 device
    const connectionTimeout = setTimeout(() => {
        // If we reach here, the connection attempt timed out
        if (connectionInProgress && lastConnectionAttempt === deviceIP) {
            console.warn('WebSocket connection timeout for:', deviceIP);
            showConnectionStatus('Connection failed: Cannot reach device at ' + deviceIP);
            connectionInProgress = false;
        }
    }, 8000); // Increased to 8 seconds for ESP32
    
    // Always use direct WebSocket connection through core.js
    // This avoids the "Connection feature not ready" message
    if (typeof window.initWebSocket === 'function') {
        console.log('Using core WebSocket connection...');
        
        // First close any existing connection
        if (window.websocket && window.websocket.readyState === WebSocket.OPEN) {
            try {
                window.websocket.close();
            } catch(e) {
                console.error('Error closing existing connection:', e);
            }
        }
        
        // Store the IP for the connection
        window.manualDeviceIP = deviceIP;
        
        // Connect to the device using the core method
        window.initWebSocket();
        
        // After connecting, check the connection status after giving it time to establish
        setTimeout(() => {
            if (window.websocket && window.websocket.readyState === WebSocket.OPEN) {
                console.log('WebSocket connection established, verifying...');
                verifyConnection(deviceIP, connectionTimeout);
            } else {
                // Still attempting to connect
                setTimeout(() => {
                    if (window.websocket && window.websocket.readyState === WebSocket.OPEN) {
                        console.log('WebSocket connection established (delayed), verifying...');
                        verifyConnection(deviceIP, connectionTimeout);
                    } else {
                        console.warn('WebSocket connection failed to establish');
                        showConnectionStatus('Connection failed to ' + deviceIP);
                        clearTimeout(connectionTimeout);
                        connectionInProgress = false;
                    }
                }, 3000); // Check again after 3 more seconds
            }
        }, 2000); // Initial check after 2 seconds
    } else {
        // Fallback to setupWebSocket if available
        if (typeof window.setupWebSocket === 'function') {
            try {
                window.setupWebSocket(deviceIP);
                console.log('Using setupWebSocket connection...');
                
                // Wait for the connection to establish
                setTimeout(() => {
                    verifyConnection(deviceIP, connectionTimeout);
                }, 2000);
            } catch (e) {
                console.error('WebSocket setup failed:', e);
                showConnectionStatus('Connection failed! Error setting up WebSocket.');
                clearTimeout(connectionTimeout);
                connectionInProgress = false;
            }
        } else {
            // Last resort - reload the page with the new IP
            console.warn('No WebSocket connection methods available, reloading page to connect');
            showConnectionStatus('No connection method available, reloading page...');
            clearTimeout(connectionTimeout);
            connectionInProgress = false;
            
            // Set a flag in session storage to indicate we're trying to connect to a different device
            sessionStorage.setItem('connectingToDevice', deviceIP);
            
            // Reload the page after a short delay
            setTimeout(() => {
                window.location.href = `${window.location.protocol}//${deviceIP}`;
            }, 1500);
        }
    }
}

// Verify the connection works by requesting device status
function verifyConnection(deviceIP, connectionTimeout) {
    // Try to verify using getStatus command first
    if (typeof window.sendCommand === 'function') {
        verificationAttempts++;
        console.log(`Verifying connection to ${deviceIP} (attempt ${verificationAttempts})...`);
        
        const result = window.sendCommand({ 
            action: 'getStatus',
            timestamp: Date.now() // Prevent caching
        });
        
        if (result) {
            console.log(`Status request sent to ${deviceIP}, waiting for response...`);
            
            // Set a timeout for the getStatus response
            const statusTimeout = setTimeout(() => {
                // If we're still waiting for a response after the timeout
                if (connectionInProgress && lastConnectionAttempt === deviceIP) {
                    if (verificationAttempts < 3) {
                        console.log(`No status response, retrying (attempt ${verificationAttempts + 1})...`);
                        // Try again a couple times
                        verifyConnection(deviceIP, connectionTimeout);
                    } else {
                        // After 3 attempts, try the ping as a fallback
                        console.log("No status response after multiple attempts, trying ping test...");
                        tryPingTest(deviceIP, connectionTimeout);
                    }
                }
            }, 2000);
            
            // Set up a one-time listener for status response
            const statusListener = function(event) {
                try {
                    const data = event.detail;
                    if (data && data.action === 'statusResponse') {
                        // We got a status response, connection is working!
                        clearTimeout(statusTimeout);
                        document.removeEventListener('websocket-message', statusListener);
                        
                        console.log(`✅ Status response received from ${deviceIP}`);
                        clearTimeout(connectionTimeout);
                        
                        // Show success message - real confirmed connection
                        showConnectionStatus('Connected to ' + deviceIP);
                        connectionInProgress = false;
                        
                        // Update the saved devices list to reflect the new connection status
                        updateSavedDevicesList();
                    }
                } catch (e) {
                    console.error("Error in status listener:", e);
                }
            };
            
            // Listen for the status response
            document.addEventListener('websocket-message', statusListener);
        } else {
            // sendCommand returned false, WebSocket probably not ready
            console.log("Send command returned false, attempting fallback...");
            tryPingTest(deviceIP, connectionTimeout);
        }
    } else {
        // sendCommand function not available, try ping test
        console.log("sendCommand function not available, trying ping test...");
        tryPingTest(deviceIP, connectionTimeout);
    }
}

// Try a ping test if available
function tryPingTest(deviceIP, connectionTimeout) {
    if (typeof window.pingWebSocketConnection === 'function') {
        window.pingWebSocketConnection()
            .then(() => {
                console.log("✅ WebSocket ping test successful");
                // Show success message - ping confirmed connection
                showConnectionStatus('Connected to ' + deviceIP);
                
                // Request initial device status
                if (typeof window.requestDeviceStatus === 'function') {
                    window.requestDeviceStatus();
                } else if (typeof window.updateAllStatus === 'function') {
                    window.updateAllStatus();
                }
                
                // Clear the timeout and tracking
                clearTimeout(connectionTimeout);
                connectionInProgress = false;
                
                // Update the saved devices list to reflect the new connection
                updateSavedDevicesList();
            })
            .catch(error => {
                console.error("WebSocket ping test failed:", error);
                
                // Try one more time with the global websocket
                if (window.websocket && window.websocket.readyState === WebSocket.OPEN) {
                    showConnectionStatus('Connected to ' + deviceIP + ' (unverified)');
                    clearTimeout(connectionTimeout);
                    connectionInProgress = false;
                } else {
                    showConnectionStatus('Connection problem with ' + deviceIP + '. Device not responding.');
                    clearTimeout(connectionTimeout);
                    connectionInProgress = false;
                }
            });
    } else {
        // No ping test available but socket seems connected
        if (window.websocket && window.websocket.readyState === WebSocket.OPEN) {
            showConnectionStatus('Connected to ' + deviceIP + ' (unverified)');
        } else {
            showConnectionStatus('Connection to ' + deviceIP + ' uncertain. Try refreshing.');
        }
        clearTimeout(connectionTimeout);
        connectionInProgress = false;
    }
}

// Update the UI to show which device is currently active
function updateActiveDeviceIndicator(deviceIP) {
    const deviceName = getDeviceName(deviceIP);
    const displayName = deviceName || deviceIP;
    
    // Update the active device indicator in the navbar or elsewhere
    const activeDeviceEl = document.getElementById('active-device-name');
    if (activeDeviceEl) {
        activeDeviceEl.textContent = displayName;
    }
    
    // You might also update a dropdown or other UI element
    const deviceSelector = document.getElementById('device-selector');
    if (deviceSelector) {
        deviceSelector.value = deviceIP;
    }
    
    // Update page title to include device name
    document.title = `${displayName} - XY-SK120 Control`;
    
    // Update saved devices list to reflect the new connection state
    updateSavedDevicesList();
}

// Get a device name from its IP
function getDeviceName(deviceIP) {
    const devices = loadSavedDevices();
    const device = devices.find(d => d.ip === deviceIP);
    return device ? device.name : null;
}

// Show connection status message
function showConnectionStatus(message) {
    // Check if status element exists, create if not
    let statusEl = document.getElementById('connection-status');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'connection-status';
        statusEl.className = 'fixed bottom-4 right-4 bg-secondary text-white px-4 py-2 rounded-md shadow-lg z-50 transition-opacity duration-500 opacity-0';
        document.body.appendChild(statusEl);
    }
    
    // Customize appearance based on message content
    if (message.includes('failed') || message.includes('problem') || message.includes('not accessible')) {
        statusEl.className = 'fixed bottom-4 right-4 bg-danger text-white px-4 py-2 rounded-md shadow-lg z-50 transition-opacity duration-500 opacity-0';
    } else if (message.includes('Connected')) {
        statusEl.className = 'fixed bottom-4 right-4 bg-success text-white px-4 py-2 rounded-md shadow-lg z-50 transition-opacity duration-500 opacity-0';
    } else {
        statusEl.className = 'fixed bottom-4 right-4 bg-secondary text-white px-4 py-2 rounded-md shadow-lg z-50 transition-opacity duration-500 opacity-0';
    }
    
    // Update message and show
    statusEl.textContent = message;
    statusEl.classList.remove('opacity-0');
    statusEl.classList.add('opacity-100');
    
    // For error messages, show longer
    const displayTime = message.includes('failed') || message.includes('problem') ? 5000 : 3000;
    
    // Hide after display time
    setTimeout(() => {
        statusEl.classList.remove('opacity-100');
        statusEl.classList.add('opacity-0');
    }, displayTime);
}

// Add function to update the saved devices list
function updateSavedDevicesList() {
    const devices = loadSavedDevices();
    const listContainer = document.getElementById('saved-devices-list');
    
    if (!listContainer) return;
    
    // Clear existing content
    listContainer.innerHTML = '';
    
    if (devices.length === 0) {
        listContainer.innerHTML = '<div class="p-4 text-sm text-gray-500 dark:text-gray-400">No saved devices yet</div>';
        return;
    }
    
    // Get the currently connected IP
    const currentConnectedIP = window.websocket && window.websocketConnected ? 
        (window.manualDeviceIP || localStorage.getItem('selectedDeviceIP') || window.location.hostname) : null;
    
    // Create list items for each device
    devices.forEach((device, index) => {
        const deviceRow = document.createElement('div');
        deviceRow.className = 'flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0';
        
        const deviceInfo = document.createElement('div');
        deviceInfo.className = 'flex-1';
        
        const deviceName = document.createElement('div');
        deviceName.className = 'font-medium text-gray-800 dark:text-gray-200';
        deviceName.textContent = device.name || 'Unnamed Device';
        
        const deviceIP = document.createElement('div');
        deviceIP.className = 'text-sm text-gray-500 dark:text-gray-400';
        deviceIP.textContent = device.ip;
        
        deviceInfo.appendChild(deviceName);
        deviceInfo.appendChild(deviceIP);
        
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'flex space-x-2';
        
        // Check if this device is already connected
        const isConnectedDevice = currentConnectedIP && currentConnectedIP === device.ip;
        
        if (isConnectedDevice) {
            // Show a "Connected" button instead of "Connect"
            const connectedBtn = document.createElement('button');
            connectedBtn.className = 'text-xs px-2 py-1 bg-success text-white rounded cursor-default';
            connectedBtn.textContent = 'Connected';
            connectedBtn.title = 'Currently connected to this device';
            buttonGroup.appendChild(connectedBtn);
        } else {
            // Connect button for non-connected devices
            const connectBtn = document.createElement('button');
            connectBtn.className = 'text-xs px-2 py-1 bg-secondary text-white rounded hover:bg-opacity-90';
            connectBtn.textContent = 'Connect';
            connectBtn.onclick = function(e) {
                e.preventDefault(); // Prevent default form submission
                e.stopPropagation(); // Stop event bubbling
                connectToDevice(device.ip);
            };
            buttonGroup.appendChild(connectBtn);
        }
        
        // Delete button (always show)
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-xs px-2 py-1 bg-danger text-white rounded hover:bg-opacity-90';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = function(e) {
            e.preventDefault(); // Prevent default form submission
            e.stopPropagation(); // Stop event bubbling
            removeDevice(index);
            updateSavedDevicesList();
        };
        buttonGroup.appendChild(deleteBtn);
        
        deviceRow.appendChild(deviceInfo);
        deviceRow.appendChild(buttonGroup);
        
        listContainer.appendChild(deviceRow);
    });
}

// Remove a device
function removeDevice(index) {
    const devices = loadSavedDevices();
    devices.splice(index, 1);
    saveDevices(devices);
}

// Make sure to initialize device list when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('saved-devices-list')) {
        updateSavedDevicesList();
    }
    
    // Initialize the currently selected device
    const selectedDeviceIP = localStorage.getItem('selectedDeviceIP');
    if (selectedDeviceIP) {
        // Just update the indicator without reconnecting
        updateActiveDeviceIndicator(selectedDeviceIP);
    }
    
    // Add event listeners for WebSocket connection changes
    document.addEventListener('websocket-connected', function() {
        // When a new connection is established, update the saved devices list
        setTimeout(() => updateSavedDevicesList(), 500);
    });
    
    document.addEventListener('websocket-disconnected', function() {
        // When connection is lost, update the saved devices list
        setTimeout(() => updateSavedDevicesList(), 500);
    });
});

// Also update device indicator when connecting
window.getCurrentDeviceIP = window.getCurrentDeviceIP || function() {
    return window.currentDeviceIP || localStorage.getItem('selectedDeviceIP') || window.location.hostname;
};

// Make functions available globally
window.initDeviceManager = initDeviceManager;
window.connectToDevice = connectToDevice;
window.updateSavedDevicesList = updateSavedDevicesList;
window.removeDevice = removeDevice; // Make sure removeDevice is exported globally
window.getDeviceName = getDeviceName; // Export this as well for good measure
window.addDevice = addDevice;
window.saveDevices = saveDevices;
window.setupDeviceSelector = setupDeviceSelector;
