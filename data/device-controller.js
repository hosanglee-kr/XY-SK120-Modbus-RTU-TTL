/**
 * Standalone Device Controller
 * This file handles all device connection management independent of other modules
 */

// Global websocket object
let deviceSocket = null;
let isConnecting = false;
let reconnectTimer = null;

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Device Controller: Initializing');
    initDeviceManager();
});

// Primary initialization function
function initDeviceManager() {
    console.log('🔧 Device Controller: Setting up device manager');
    
    // Check if localStorage is available
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        console.log('🔧 Device Controller: localStorage is available');
    } catch (e) {
        console.error('🔧 Device Controller: localStorage is not available', e);
        alert('Your browser does not support localStorage, which is required for device management.');
        return;
    }
    
    // Initialize device list
    const devices = getSavedDevices();
    
    // Make sure localhost is in the list
    if (!devices.find(d => d.ip === 'localhost')) {
        devices.unshift({
            ip: 'localhost',
            name: 'This Device',
            isDefault: true,
            dateAdded: new Date().toISOString()
        });
        saveDevices(devices);
    }
    
    // Update device selector
    updateDeviceSelector();
    
    // Set up event listeners
    setupListeners();
    
    // Connect to default or last device
    const defaultDevice = devices.find(d => d.isDefault);
    const lastDevice = localStorage.getItem('lastConnectedDevice');
    
    // Always try to connect to a device on startup
    if (defaultDevice) {
        console.log(`🔧 Device Controller: Connecting to default device: ${defaultDevice.ip}`);
        connectToDevice(defaultDevice.ip);
    } else if (lastDevice) {
        console.log(`🔧 Device Controller: Connecting to last device: ${lastDevice}`);
        connectToDevice(lastDevice);
    } else {
        console.log('🔧 Device Controller: No default or last device, connecting to localhost');
        connectToDevice('localhost');
    }
}

// Set up all event listeners
function setupListeners() {
    console.log('🔧 Device Controller: Setting up event listeners');
    
    // Device selector change event
    const deviceSelector = document.getElementById('device-selector');
    if (deviceSelector) {
        // Remove existing listeners
        const newSelector = deviceSelector.cloneNode(true);
        if (deviceSelector.parentNode) {
            deviceSelector.parentNode.replaceChild(newSelector, deviceSelector);
        }
        
        // Add change event listener
        newSelector.addEventListener('change', function() {
            const selectedIP = this.value;
            console.log(`🔧 Device Controller: Device selection changed to ${selectedIP}`);
            connectToDevice(selectedIP);
        });
    } else {
        console.warn('🔧 Device Controller: Device selector not found');
    }
    
    // Add device form submission
    const addDeviceForm = document.getElementById('add-device-form');
    if (addDeviceForm) {
        // Remove existing listeners
        const newForm = addDeviceForm.cloneNode(true);
        if (addDeviceForm.parentNode) {
            addDeviceForm.parentNode.replaceChild(newForm, addDeviceForm);
        }
        
        // Add submit event listener
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const ipInput = document.getElementById('new-device-ip');
            const nameInput = document.getElementById('new-device-name');
            
            if (ipInput && ipInput.value) {
                const ip = ipInput.value.trim();
                const name = nameInput ? nameInput.value.trim() : '';
                
                console.log(`🔧 Device Controller: Adding device ${ip} (${name || 'No name'})`);
                addDevice(ip, name);
                
                // Clear inputs after adding
                ipInput.value = '';
                if (nameInput) nameInput.value = '';
            }
        });
    } else {
        console.warn('🔧 Device Controller: Add device form not found');
    }
    
    // Manage devices button
    const manageDevicesBtn = document.getElementById('manage-devices-btn');
    if (manageDevicesBtn) {
        manageDevicesBtn.addEventListener('click', function() {
            console.log('🔧 Device Controller: Opening device manager');
            showDeviceManager();
        });
    } else {
        console.warn('🔧 Device Controller: Manage devices button not found');
    }
    
    // Reconnect button
    const reconnectBtn = document.getElementById('reconnect-btn');
    if (reconnectBtn) {
        reconnectBtn.addEventListener('click', function() {
            const currentDevice = getCurrentDevice();
            console.log(`🔧 Device Controller: Manual reconnect to ${currentDevice}`);
            connectToDevice(currentDevice);
        });
    } else {
        console.warn('🔧 Device Controller: Reconnect button not found');
    }
}

// Get the current/last used device IP
function getCurrentDevice() {
    // Try to get from local storage or default to localhost
    return localStorage.getItem('lastConnectedDevice') || 'localhost';
}

// Get all saved devices
function getSavedDevices() {
    try {
        const devices = JSON.parse(localStorage.getItem('savedDevices')) || [];
        return devices;
    } catch (e) {
        console.error('🔧 Device Controller: Error loading saved devices', e);
        return [];
    }
}

// Save devices to localStorage
function saveDevices(devices) {
    try {
        localStorage.setItem('savedDevices', JSON.stringify(devices));
        return true;
    } catch (e) {
        console.error('🔧 Device Controller: Error saving devices', e);
        return false;
    }
}

// Update the device selector dropdown
function updateDeviceSelector() {
    const deviceSelector = document.getElementById('device-selector');
    if (!deviceSelector) {
        console.warn('🔧 Device Controller: Device selector not found for updating');
        return;
    }
    
    // Clear existing options
    deviceSelector.innerHTML = '';
    
    // Get the devices and current device
    const devices = getSavedDevices();
    const currentDevice = getCurrentDevice();
    
    // Add options for each device
    devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.ip;
        option.textContent = device.name || device.ip;
        
        // Mark default device
        if (device.isDefault) {
            option.textContent += ' (Default)';
        }
        
        // Select the current device
        if (device.ip === currentDevice) {
            option.selected = true;
        }
        
        deviceSelector.appendChild(option);
    });
    
    console.log(`🔧 Device Controller: Updated device selector with ${devices.length} devices`);
}

// Add a new device
function addDevice(ip, name) {
    // Validate IP address
    if (!isValidIP(ip) && ip !== 'localhost') {
        alert('Please enter a valid IP address (e.g., 192.168.1.123)');
        return false;
    }
    
    // Get current devices
    const devices = getSavedDevices();
    
    // Check if device already exists
    const existingDevice = devices.find(d => d.ip === ip);
    if (existingDevice) {
        console.log(`🔧 Device Controller: Device ${ip} already exists, connecting to it`);
        connectToDevice(ip);
        return true;
    }
    
    // Add the new device
    devices.push({
        ip: ip,
        name: name || ip,
        isDefault: false,
        dateAdded: new Date().toISOString()
    });
    
    // Save devices
    saveDevices(devices);
    console.log(`🔧 Device Controller: Added new device ${ip} (${name || 'No name'})`);
    
    // Update selector
    updateDeviceSelector();
    
    // Connect to the new device
    connectToDevice(ip);
    
    return true;
}

// Remove a device
function removeDevice(ip) {
    // Cannot remove localhost
    if (ip === 'localhost') {
        alert('Cannot remove the default device (localhost)');
        return false;
    }
    
    // Get current devices
    const devices = getSavedDevices();
    
    // Filter out the device to remove
    const updatedDevices = devices.filter(d => d.ip !== ip);
    
    // Save updated device list
    saveDevices(updatedDevices);
    console.log(`🔧 Device Controller: Removed device ${ip}`);
    
    // Update selector
    updateDeviceSelector();
    
    return true;
}

// Set a device as the default
function setDefaultDevice(ip) {
    // Get current devices
    const devices = getSavedDevices();
    
    // Update default status
    devices.forEach(d => {
        d.isDefault = (d.ip === ip);
    });
    
    // Save updated devices
    saveDevices(devices);
    console.log(`🔧 Device Controller: Set ${ip} as default device`);
    
    // Update selector
    updateDeviceSelector();
    
    return true;
}

// Connect to a device via WebSocket
function connectToDevice(ip) {
    if (!ip) {
        console.error('🔧 Device Controller: No IP provided for connection');
        return false;
    }
    
    // Save as last connected device
    localStorage.setItem('lastConnectedDevice', ip);
    console.log(`🔧 Device Controller: Attempting to connect to ${ip}`);
    
    // Update UI
    const statusElement = document.getElementById('websocket-status');
    const deviceElement = document.getElementById('connected-device');
    
    if (statusElement) {
        statusElement.textContent = 'Connecting...';
        statusElement.className = 'text-secondary font-bold';
    }
    
    if (deviceElement) {
        deviceElement.textContent = ip;
    }
    
    // Don't proceed if already connecting
    if (isConnecting) {
        console.log('🔧 Device Controller: Already connecting, waiting...');
        return false;
    }
    
    // Mark as connecting
    isConnecting = true;
    
    // Clear any existing reconnect timer
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    
    // Close any existing connection
    if (deviceSocket) {
        try {
            deviceSocket.close();
        } catch (e) {
            console.error('🔧 Device Controller: Error closing existing WebSocket', e);
        }
        deviceSocket = null;
    }
    
    // Handle the actual hostname - if localhost and we're not on localhost, use the actual hostname
    let targetIp = ip;
    if (ip === 'localhost' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
        targetIp = window.location.hostname;
        console.log(`🔧 Device Controller: Converting localhost to actual hostname: ${targetIp}`);
    }
    
    try {
        // Create WebSocket URL
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${targetIp}/ws`;
        console.log(`🔧 Device Controller: Creating WebSocket connection to ${wsUrl}`);
        
        // Create WebSocket
        deviceSocket = new WebSocket(wsUrl);
        
        // Expose globally for debugging
        window.deviceWebSocket = deviceSocket;
        
        // Set up event handlers
        deviceSocket.onopen = function() {
            console.log(`🔧 Device Controller: Connected to ${ip}!`);
            isConnecting = false;
            
            // Update UI
            if (statusElement) {
                statusElement.textContent = 'Connected';
                statusElement.className = 'text-success font-bold';
            }
            
            // Update global state for other scripts
            window.websocketConnected = true;
            window.websocket = deviceSocket;
            
            // Request initial data
            sendCommand({ action: 'getStatus' });
            setTimeout(() => sendCommand({ action: 'getOperatingMode' }), 500);
        };
        
        deviceSocket.onclose = function(event) {
            console.log(`🔧 Device Controller: Connection to ${ip} closed (code: ${event.code})`);
            isConnecting = false;
            window.websocketConnected = false;
            
            // Update UI
            if (statusElement) {
                statusElement.textContent = 'Disconnected';
                statusElement.className = 'text-danger font-bold';
            }
            
            // Try to reconnect
            reconnectTimer = setTimeout(() => connectToDevice(ip), 5000);
        };
        
        deviceSocket.onerror = function(error) {
            console.error(`🔧 Device Controller: Error connecting to ${ip}`, error);
            isConnecting = false;
            window.websocketConnected = false;
            
            // Update UI
            if (statusElement) {
                statusElement.textContent = 'Connection Error';
                statusElement.className = 'text-danger font-bold';
            }
        };
        
        deviceSocket.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                console.log('🔧 Device Controller: Received data', data);
                
                // Forward message to any existing handler
                if (window.handleMessage && typeof window.handleMessage === 'function') {
                    window.handleMessage(event);
                }
                
                // Basic handling for status updates to ensure UI stays in sync
                if (data.action === 'statusResponse') {
                    updateBasicUI(data);
                }
            } catch (e) {
                console.error('🔧 Device Controller: Error parsing WebSocket message', e);
            }
        };
        
        return true;
    } catch (e) {
        console.error(`🔧 Device Controller: Error creating WebSocket for ${ip}`, e);
        isConnecting = false;
        window.websocketConnected = false;
        
        // Update UI
        if (statusElement) {
            statusElement.textContent = 'Connection Failed';
            statusElement.className = 'text-danger font-bold';
        }
        
        return false;
    }
}

// Show device manager dialog
function showDeviceManager() {
    let popup = document.getElementById('device-manager-popup');
    
    // Create popup if it doesn't exist
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'device-manager-popup';
        popup.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center';
        
        const content = document.createElement('div');
        content.className = 'bg-card dark:bg-card-dark rounded-xl shadow-lg w-[90%] max-w-[400px] max-h-[80vh] overflow-hidden flex flex-col';
        
        content.innerHTML = `
            <div class="text-center p-3 font-bold border-b border-border dark:border-border-dark bg-primary text-white rounded-t-xl flex justify-between items-center">
                <span>Device Manager</span>
                <button id="close-device-manager" class="text-white hover:text-gray-300">&times;</button>
            </div>
            <div class="overflow-y-auto flex-1 p-4">
                <h3 class="font-bold mb-2">Saved Devices</h3>
                <div id="device-list" class="mb-4 mt-2">
                    <!-- Device list will be populated here -->
                </div>
                
                <h3 class="font-bold mb-2 mt-4">Add New Device</h3>
                <form id="popup-device-form" class="flex flex-col gap-2">
                    <div>
                        <label class="block text-sm mb-1">IP Address</label>
                        <input type="text" id="popup-device-ip" required class="w-full h-input px-3 py-2 border border-border dark:border-border-dark rounded">
                    </div>
                    <div>
                        <label class="block text-sm mb-1">Name (Optional)</label>
                        <input type="text" id="popup-device-name" class="w-full h-input px-3 py-2 border border-border dark:border-border-dark rounded">
                    </div>
                    <button type="submit" class="bg-secondary text-white py-2 px-4 rounded mt-2">Add Device</button>
                </form>
            </div>
        `;
        
        popup.appendChild(content);
        document.body.appendChild(popup);
        
        // Add event listeners
        document.getElementById('close-device-manager').addEventListener('click', function() {
            popup.remove();
        });
        
        document.getElementById('popup-device-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const ip = document.getElementById('popup-device-ip').value.trim();
            const name = document.getElementById('popup-device-name').value.trim();
            
            if (addDevice(ip, name)) {
                // Reset form
                document.getElementById('popup-device-ip').value = '';
                document.getElementById('popup-device-name').value = '';
                
                // Update the list
                populateDeviceList();
            }
        });
    }
    
    // Show the popup
    document.body.appendChild(popup);
    
    // Populate the device list
    populateDeviceList();
}

// Populate the device list in the manager
function populateDeviceList() {
    const deviceList = document.getElementById('device-list');
    if (!deviceList) {
        console.warn('🔧 Device Controller: Device list element not found');
        return;
    }
    
    // Clear existing list
    deviceList.innerHTML = '';
    
    // Get devices and current device
    const devices = getSavedDevices();
    const currentDevice = getCurrentDevice();
    
    // Check if we have any devices
    if (devices.length === 0) {
        deviceList.innerHTML = '<div class="text-center py-4 text-gray-500">No devices added yet</div>';
        return;
    }
    
    // Add each device to the list
    devices.forEach(device => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center p-2 border-b border-border dark:border-border-dark';
        
        // Info section
        const info = document.createElement('div');
        info.className = 'flex-1';
        
        const nameEl = document.createElement('div');
        nameEl.className = 'font-bold';
        nameEl.textContent = device.name || device.ip;
        info.appendChild(nameEl);
        
        const ipEl = document.createElement('div');
        ipEl.className = 'text-sm text-gray-500';
        ipEl.textContent = device.ip;
        info.appendChild(ipEl);
        
        // Status indicator
        if (device.ip === currentDevice) {
            const statusEl = document.createElement('div');
            statusEl.className = 'text-sm text-success mt-1';
            statusEl.textContent = 'Connected';
            info.appendChild(statusEl);
        }
        
        if (device.isDefault) {
            const defaultEl = document.createElement('div');
            defaultEl.className = 'text-xs text-secondary mt-1';
            defaultEl.textContent = 'Default Device';
            info.appendChild(defaultEl);
        }
        
        item.appendChild(info);
        
        // Buttons
        const buttons = document.createElement('div');
        buttons.className = 'flex flex-col gap-1';
        
        // Connect button
        const connectBtn = document.createElement('button');
        connectBtn.className = 'text-sm bg-secondary text-white py-1 px-2 rounded';
        connectBtn.textContent = 'Connect';
        connectBtn.addEventListener('click', function() {
            connectToDevice(device.ip);
            popup.remove();
        });
        buttons.appendChild(connectBtn);
        
        // Default button (only for non-default devices)
        if (!device.isDefault) {
            const defaultBtn = document.createElement('button');
            defaultBtn.className = 'text-sm bg-gray-500 text-white py-1 px-2 rounded';
            defaultBtn.textContent = 'Set Default';
            defaultBtn.addEventListener('click', function() {
                setDefaultDevice(device.ip);
                populateDeviceList();
            });
            buttons.appendChild(defaultBtn);
        }
        
        // Remove button (only for non-localhost)
        if (device.ip !== 'localhost') {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'text-sm bg-danger text-white py-1 px-2 rounded';
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', function() {
                if (confirm(`Are you sure you want to remove ${device.name || device.ip}?`)) {
                    removeDevice(device.ip);
                    populateDeviceList();
                }
            });
            buttons.appendChild(removeBtn);
        }
        
        item.appendChild(buttons);
        deviceList.appendChild(item);
    });
}

// Send a command to the device
function sendCommand(command) {
    if (!deviceSocket || deviceSocket.readyState !== WebSocket.OPEN) {
        console.warn('🔧 Device Controller: WebSocket not open, cannot send command', command);
        return false;
    }
    
    try {
        const commandStr = JSON.stringify(command);
        deviceSocket.send(commandStr);
        console.log('🔧 Device Controller: Sent command', command);
        return true;
    } catch (e) {
        console.error('🔧 Device Controller: Error sending command', e);
        return false;
    }
}

// Update basic UI elements
function updateBasicUI(data) {
    // Update voltage
    const voltageEl = document.getElementById('psu-voltage');
    if (voltageEl && data.voltage !== undefined) {
        voltageEl.textContent = parseFloat(data.voltage).toFixed(2);
    }
    
    // Update current
    const currentEl = document.getElementById('psu-current');
    if (currentEl && data.current !== undefined) {
        currentEl.textContent = parseFloat(data.current).toFixed(3);
    }
    
    // Update power
    const powerEl = document.getElementById('psu-power');
    if (powerEl && data.power !== undefined) {
        powerEl.textContent = parseFloat(data.power).toFixed(1);
    }
    
    // Update output status
    const outputEl = document.getElementById('output-status');
    if (outputEl && data.outputEnabled !== undefined) {
        outputEl.textContent = data.outputEnabled ? 'ON' : 'OFF';
        outputEl.className = data.outputEnabled ? 'text-success' : 'text-danger';
    }
}

// Check if an IP address is valid
function isValidIP(ip) {
    if (ip === 'localhost') return true;
    
    const regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (!regex.test(ip)) return false;
    
    const parts = ip.split('.');
    for (let i = 0; i < 4; i++) {
        const part = parseInt(parts[i]);
        if (part < 0 || part > 255) return false;
    }
    
    return true;
}

// Expose functions globally for debugging and direct access
window.deviceController = {
    connect: connectToDevice,
    add: addDevice,
    remove: removeDevice,
    setDefault: setDefaultDevice,
    getDevices: getSavedDevices,
    showManager: showDeviceManager,
    send: sendCommand
};

console.log('🔧 Device Controller: Script loaded, functions available via window.deviceController');
