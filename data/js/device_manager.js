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
        
        // Update the device selector
        setupDeviceSelector();
        
        // Connect to the new device
        connectToDevice(ip);
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
}

// Connect to a device
function connectToDevice(ip) {
    if (typeof window.connectToDevice === 'function') {
        window.connectToDevice(ip);
    } else {
        console.error('connectToDevice function not available');
        
        // Fallback: set the IP and reload
        localStorage.setItem('selectedDeviceIP', ip);
        window.location.reload();
    }
}

// Make functions available globally
window.addDevice = addDevice;
window.loadSavedDevices = loadSavedDevices;
