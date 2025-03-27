/**
 * Device manager - Web UI specific functionality
 * Allows controlling multiple XY-SK120 devices
 */

// Initialize device manager
export function initDeviceManager() {
    // Load saved devices
    const devices = getSavedDevices();
    
    // Add localhost if not already present
    if (!devices.find(d => d.ip === 'localhost')) {
        devices.push({
            ip: 'localhost',
            name: 'This Device',
            isDefault: true,
            dateAdded: new Date().toISOString()
        });
        saveDevices(devices);
    }
    
    // Update device selector
    updateDeviceSelector();
    
    // Setup event listeners
    setupDeviceManagerEvents();
}

// Set up device manager event listeners
function setupDeviceManagerEvents() {
    // Set up device selector change event
    const deviceSelector = document.getElementById('device-selector');
    if (deviceSelector) {
        deviceSelector.addEventListener('change', function() {
            connectToDevice(this.value);
        });
    }
    
    // Set up add device form
    const addDeviceForm = document.getElementById('add-device-form');
    if (addDeviceForm) {
        addDeviceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const ip = document.getElementById('new-device-ip').value;
            const name = document.getElementById('new-device-name').value;
            addDevice(ip, name);
        });
    }
}

// Get saved devices from localStorage
export function getSavedDevices() {
    try {
        return JSON.parse(localStorage.getItem('savedDevices')) || [];
    } catch (e) {
        console.error('Error loading saved devices:', e);
        return [];
    }
}

// Save devices to localStorage
export function saveDevices(devices) {
    try {
        localStorage.setItem('savedDevices', JSON.stringify(devices));
        return true;
    } catch (e) {
        console.error('Error saving devices:', e);
        return false;
    }
}

// Update device selector dropdown
export function updateDeviceSelector() {
    const deviceSelector = document.getElementById('device-selector');
    if (!deviceSelector) return;
    
    // Clear existing options
    deviceSelector.innerHTML = '';
    
    // Get devices and current selection
    const devices = getSavedDevices();
    const currentDevice = localStorage.getItem('selectedDeviceIP') || 'localhost';
    
    // Add options to the selector
    devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.ip;
        option.textContent = device.name || device.ip;
        if (device.ip === currentDevice) {
            option.selected = true;
        }
        deviceSelector.appendChild(option);
    });
}

// Add a new device
export function addDevice(ip, name) {
    if (!ip) return false;
    
    const devices = getSavedDevices();
    
    // Check if device already exists
    if (devices.find(d => d.ip === ip)) {
        // Just connect to it
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
    
    // Save the updated list
    saveDevices(devices);
    
    // Update the UI
    updateDeviceSelector();
    
    // Connect to the new device
    connectToDevice(ip);
    
    return true;
}

// Connect to a specific device
export function connectToDevice(deviceIP) {
    if (!deviceIP) return false;
    
    // Save the selected device
    localStorage.setItem('selectedDeviceIP', deviceIP);
    
    // Initialize WebSocket connection to the device
    if (window.initWebSocket) {
        window.initWebSocket();
    }
    
    return true;
}

// Make functions available globally
window.addDevice = addDevice;
window.connectToDevice = connectToDevice;
