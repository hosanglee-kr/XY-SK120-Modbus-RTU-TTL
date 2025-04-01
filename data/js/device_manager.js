/**
 * Device management functionality for XY-SK120
 */

// Initialize device manager
export function initDeviceManager() {
    // Setup device selector
    setupDeviceSelector();
    
    // Setup add device form
    setupAddDeviceForm();
}

// Set up device selector
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
    localStorage.setItem('savedDevices', JSON.stringify(devices));
}

// Add a new device
function addDevice(ip, name) {
    const devices = loadSavedDevices();
    
    // Check if device already exists
    const existingDeviceIndex = devices.findIndex(d => d.ip === ip);
    
    if (existingDeviceIndex >= 0) {
        // Update existing device name if provided
        if (name) {
            devices[existingDeviceIndex].name = name;
        }
    } else {
        // Add new device
        devices.push({ ip, name });
    }
    
    saveDevices(devices);
    
    // Make sure we update the saved devices list immediately
    updateSavedDevicesList();
}

// Track current connection attempt to prevent loops
let connectionInProgress = false;
let lastConnectionAttempt = null;

// Connect to a device
function connectToDevice(ip) {
    // Prevent connecting to the same device repeatedly
    if (connectionInProgress && lastConnectionAttempt === ip) {
        console.log('Connection attempt already in progress for:', ip);
        return;
    }
    
    // Set connection tracking
    connectionInProgress = true;
    lastConnectionAttempt = ip;
    
    // Store the selected device IP in localStorage
    localStorage.setItem('selectedDeviceIP', ip);
    
    // Show connecting message
    showConnectionStatus('Connecting to ' + ip + '...');
    
    // Create/update a device indicator in the UI
    updateActiveDeviceIndicator(ip);
    
    // Check if we're already on the correct device
    if (window.location.hostname === ip) {
        showConnectionStatus('Already connected to ' + ip);
        connectionInProgress = false;
        return;
    }
    
    // Try to connect using WebSocket - with a timeout
    const connectionTimeout = setTimeout(() => {
        // If we reach here, the connection attempt timed out
        if (connectionInProgress && lastConnectionAttempt === ip) {
            console.warn('WebSocket connection timeout for:', ip);
            showConnectionStatus('Connection timeout. Using simulated connection.');
            connectionInProgress = false;
        }
    }, 5000); // 5 second timeout
    
    // Check if the WebSocket setup function is available
    if (window.setupWebSocket && typeof window.setupWebSocket === 'function') {
        try {
            // Close existing websocket if open
            if (window.ws && window.ws.readyState === WebSocket.OPEN) {
                window.ws.close();
            }
            
            // Connect to the device via WebSocket
            window.setupWebSocket(ip);
            console.log('Connecting to device via WebSocket:', ip);
            
            // Request initial device status after connection
            setTimeout(() => {
                if (window.requestDeviceStatus && typeof window.requestDeviceStatus === 'function') {
                    window.requestDeviceStatus();
                }
                
                // Test the connection with a ping after connecting
                if (typeof window.pingWebSocketConnection === 'function') {
                    window.pingWebSocketConnection()
                        .then(() => {
                            console.log("✅ WebSocket ping test successful");
                            showConnectionStatus('Connected to ' + ip + ' (verified)');
                        })
                        .catch(error => {
                            console.error("WebSocket ping test failed:", error);
                            showConnectionStatus('Connection issue with ' + ip + '. Try refreshing.');
                        });
                }
                
                // Clear the timeout and tracking
                clearTimeout(connectionTimeout);
                connectionInProgress = false;
            }, 1000);
            
        } catch (e) {
            console.error('WebSocket connection failed:', e);
            showConnectionStatus('Connection failed! Check if device is online.');
            clearTimeout(connectionTimeout);
            connectionInProgress = false;
        }
    } else {
        console.warn('WebSocket setup function not available yet');
        
        // Show simulated connection message
        showConnectionStatus('Connected to ' + ip + ' (simulated)');
        
        // Clear timeout and tracking
        clearTimeout(connectionTimeout);
        connectionInProgress = false;
    }
}

// Update the UI to show which device is currently active
function updateActiveDeviceIndicator(ip) {
    const deviceName = getDeviceName(ip);
    const displayName = deviceName || ip;
    
    // Update the active device indicator in the navbar or elsewhere
    const activeDeviceEl = document.getElementById('active-device-name');
    if (activeDeviceEl) {
        activeDeviceEl.textContent = displayName;
    }
    
    // You might also update a dropdown or other UI element
    const deviceSelector = document.getElementById('device-selector');
    if (deviceSelector) {
        deviceSelector.value = ip;
    }
    
    // Update page title to include device name
    document.title = `${displayName} - XY-SK120 Control`;
}

// Get a device name from its IP
function getDeviceName(ip) {
    const devices = loadSavedDevices();
    const device = devices.find(d => d.ip === ip);
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
    
    // Update message and show
    statusEl.textContent = message;
    statusEl.classList.remove('opacity-0');
    statusEl.classList.add('opacity-100');
    
    // Hide after 3 seconds
    setTimeout(() => {
        statusEl.classList.remove('opacity-100');
        statusEl.classList.add('opacity-0');
    }, 3000);
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
        
        // Connect button
        const connectBtn = document.createElement('button');
        connectBtn.className = 'text-xs px-2 py-1 bg-secondary text-white rounded hover:bg-opacity-90';
        connectBtn.textContent = 'Connect';
        connectBtn.onclick = function(e) {
            e.preventDefault(); // Prevent default form submission
            e.stopPropagation(); // Stop event bubbling
            connectToDevice(device.ip);
        };
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-xs px-2 py-1 bg-danger text-white rounded hover:bg-opacity-90';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = function(e) {
            e.preventDefault(); // Prevent default form submission
            e.stopPropagation(); // Stop event bubbling
            removeDevice(index);
            updateSavedDevicesList();
        };
        
        buttonGroup.appendChild(connectBtn);
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
});

// Make functions available globally
window.addDevice = addDevice;
window.loadSavedDevices = loadSavedDevices;
window.connectToDevice = connectToDevice;
window.updateSavedDevicesList = updateSavedDevicesList;
window.removeDevice = removeDevice;
