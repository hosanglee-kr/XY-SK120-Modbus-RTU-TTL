/**
 * Device Manager module 
 * Handles managing multiple XY-SK120 devices and saving configurations
 */
import { connectToDevice, getWebSocketIP } from './menu_connection.js';

// Initialize the device list from localStorage
function initDeviceManager() {
  // Load saved devices or create default
  const savedDevices = getSavedDevices();
  
  // Add localhost if not already in the list
  if (!savedDevices.find(d => d.ip === 'localhost')) {
    savedDevices.unshift({
      ip: 'localhost',
      name: 'This Device', 
      isDefault: true
    });
    saveDevices(savedDevices);
  }
  
  // Initialize the device selector dropdown
  updateDeviceSelector();
  
  // Set up event listeners
  setupEventListeners();
}

// Get all saved devices from localStorage
function getSavedDevices() {
  try {
    const devices = JSON.parse(localStorage.getItem('savedDevices')) || [];
    return devices;
  } catch (e) {
    console.error('Error loading saved devices:', e);
    return [];
  }
}

// Save devices to localStorage
function saveDevices(devices) {
  try {
    localStorage.setItem('savedDevices', JSON.stringify(devices));
    return true;
  } catch (e) {
    console.error('Error saving devices:', e);
    return false;
  }
}

// Add a new device to the saved list
function addDevice(ip, name) {
  if (!ip) return false;
  
  // Validate IP format
  if (ip !== 'localhost' && !isValidIP(ip)) {
    alert('Please enter a valid IP address');
    return false;
  }
  
  // Get current devices
  const devices = getSavedDevices();
  
  // Check if device already exists
  if (devices.find(d => d.ip === ip)) {
    // If device exists, just connect to it instead of showing error
    console.log('Device already exists, connecting to it...');
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
  
  // Connect to the new device immediately
  connectToDevice(ip);
  
  // Provide feedback
  const statusElement = document.getElementById('websocket-status');
  if (statusElement) {
    statusElement.textContent = 'Connecting...';
    statusElement.className = 'text-secondary font-bold';
  }
  
  return true;
}

// Remove a device from the saved list
function removeDevice(ip) {
  if (ip === 'localhost') {
    alert('Cannot remove the default local device');
    return false;
  }
  
  // Get current devices
  const devices = getSavedDevices();
  
  // Filter out the device to remove
  const updatedDevices = devices.filter(d => d.ip !== ip);
  
  // Save the updated list
  saveDevices(updatedDevices);
  
  // Update the UI
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
  
  // Save the updated list
  saveDevices(devices);
  
  // Connect to this device
  connectToDevice(ip);
  
  // Update the UI
  updateDeviceSelector();
  
  return true;
}

// Update the device selector dropdown
function updateDeviceSelector() {
  const deviceSelector = document.getElementById('device-selector');
  if (!deviceSelector) return;
  
  // Clear existing options
  deviceSelector.innerHTML = '';
  
  // Get devices and current selection
  const devices = getSavedDevices();
  const currentDevice = getWebSocketIP();
  
  // Add options to the selector
  devices.forEach(device => {
    const option = document.createElement('option');
    option.value = device.ip;
    option.textContent = device.name || device.ip;
    
    // Mark default device
    if (device.isDefault) {
      option.textContent += ' (Default)';
    }
    
    // Set selected device
    if (device.ip === currentDevice) {
      option.selected = true;
    }
    
    deviceSelector.appendChild(option);
  });
}

// Set up event listeners for device management
function setupEventListeners() {
  console.log('Setting up device manager event listeners...');
  
  // Device selector change
  const deviceSelector = document.getElementById('device-selector');
  if (deviceSelector) {
    // Remove any existing listeners
    const newSelector = deviceSelector.cloneNode(true);
    if (deviceSelector.parentNode) {
      deviceSelector.parentNode.replaceChild(newSelector, deviceSelector);
    }
    
    newSelector.addEventListener('change', function() {
      const selectedIP = this.value;
      console.log('Device selection changed to:', selectedIP);
      connectToDevice(selectedIP);
    });
  } else {
    console.warn('Device selector element not found');
  }
  
  // Add device form
  const addDeviceForm = document.getElementById('add-device-form');
  if (addDeviceForm) {
    // Remove any existing listeners
    const newForm = addDeviceForm.cloneNode(true);
    if (addDeviceForm.parentNode) {
      addDeviceForm.parentNode.replaceChild(newForm, addDeviceForm);
    }
    
    newForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const ipInput = document.getElementById('new-device-ip');
      const nameInput = document.getElementById('new-device-name');
      
      if (ipInput && ipInput.value) {
        console.log(`Adding and connecting to device: ${ipInput.value}`);
        const success = addDevice(ipInput.value, nameInput ? nameInput.value : '');
        
        if (success) {
          // Clear inputs
          ipInput.value = '';
          if (nameInput) nameInput.value = '';
          
          // Show feedback message
          alert(`Device added and connecting to: ${ipInput.value}`);
        }
      }
    });
  } else {
    console.warn('Add device form not found');
  }
  
  // Device list display and management
  const manageDevicesBtn = document.getElementById('manage-devices-btn');
  if (manageDevicesBtn) {
    manageDevicesBtn.addEventListener('click', function() {
      displayDeviceManager();
    });
  }
}

// Display the device manager popup
function displayDeviceManager() {
  // Create popup if it doesn't exist
  let popup = document.getElementById('device-manager-popup');
  
  if (!popup) {
    // Create popup element
    popup = document.createElement('div');
    popup.id = 'device-manager-popup';
    popup.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-overlay flex items-center justify-center';
    
    // Create popup content container
    const content = document.createElement('div');
    content.className = 'bg-card dark:bg-card-dark rounded-xl shadow-lg z-popup w-[90%] max-w-[400px] max-h-[80vh] overflow-hidden flex flex-col';
    
    // Add close button and header
    content.innerHTML = `
      <div class="text-center p-3 font-bold border-b border-border dark:border-border-dark bg-primary text-white rounded-t-xl flex justify-between items-center">
        <span>Device Manager</span>
        <button id="close-device-manager" class="text-white hover:text-gray-300">&times;</button>
      </div>
      <div class="overflow-y-auto flex-1 p-4">
        <h3 class="font-bold mb-2">Saved Devices</h3>
        <div id="device-list" class="mb-4">
          <!-- Device list will be populated here -->
        </div>
        
        <h3 class="font-bold mb-2">Add New Device</h3>
        <form id="device-form" class="flex flex-col gap-2">
          <div>
            <label class="block text-sm">IP Address</label>
            <input type="text" id="device-ip" required class="w-full">
          </div>
          <div>
            <label class="block text-sm">Name (Optional)</label>
            <input type="text" id="device-name" class="w-full">
          </div>
          <button type="submit" class="bg-secondary text-white py-2 px-4 rounded">Add Device</button>
        </form>
      </div>
    `;
    
    popup.appendChild(content);
    document.body.appendChild(popup);
    
    // Add event listeners
    document.getElementById('close-device-manager').addEventListener('click', function() {
      popup.remove();
    });
    
    document.getElementById('device-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const ip = document.getElementById('device-ip').value;
      const name = document.getElementById('device-name').value;
      
      if (addDevice(ip, name)) {
        // Reset form
        document.getElementById('device-ip').value = '';
        document.getElementById('device-name').value = '';
        
        // Update device list
        populateDeviceList();
      }
    });
  }
  
  // Populate the device list
  populateDeviceList();
  
  // Show the popup
  popup.style.display = 'flex';
}

// Populate the device list in the manager
function populateDeviceList() {
  const deviceList = document.getElementById('device-list');
  if (!deviceList) return;
  
  // Clear existing list
  deviceList.innerHTML = '';
  
  // Get devices
  const devices = getSavedDevices();
  const currentDevice = getWebSocketIP();
  
  // Create list items
  devices.forEach(device => {
    const item = document.createElement('div');
    item.className = 'flex justify-between items-center p-2 border-b border-border dark:border-border-dark';
    
    // Name and IP
    const info = document.createElement('div');
    info.innerHTML = `
      <div class="font-bold">${device.name || device.ip}</div>
      <div class="text-sm text-gray-500">${device.ip}</div>
    `;
    
    // Current indicator
    if (device.ip === currentDevice) {
      const indicator = document.createElement('span');
      indicator.className = 'text-sm text-success';
      indicator.textContent = 'Connected';
      info.appendChild(indicator);
    }
    
    item.appendChild(info);
    
    // Buttons container
    const buttons = document.createElement('div');
    buttons.className = 'flex gap-2';
    
    // Connect button
    const connectBtn = document.createElement('button');
    connectBtn.className = 'text-sm bg-secondary text-white py-1 px-2 rounded';
    connectBtn.textContent = 'Connect';
    connectBtn.addEventListener('click', function() {
      connectToDevice(device.ip);
      document.getElementById('device-manager-popup').remove();
    });
    buttons.appendChild(connectBtn);
    
    // Set default button
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

// Validate IP address format
function isValidIP(ip) {
  // Simple regex for IPv4 address
  const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  
  if (!ipRegex.test(ip)) return false;
  
  // Check each octet
  const parts = ip.split('.');
  for (let i = 0; i < 4; i++) {
    const part = parseInt(parts[i]);
    if (part < 0 || part > 255) return false;
  }
  
  return true;
}

// Improved connect to device with better feedback
function connectToDevice(deviceIP) {
  if (!deviceIP) return false;
  
  console.log(`Switching to device: ${deviceIP}`);
  
  // Update connection status display
  const statusElement = document.getElementById('websocket-status');
  const deviceElement = document.getElementById('connected-device');
  
  if (statusElement) {
    statusElement.textContent = 'Connecting...';
    statusElement.className = 'text-secondary font-bold';
  }
  
  if (deviceElement) {
    deviceElement.textContent = deviceIP;
  }
  
  // Save the selected device
  localStorage.setItem('selectedDeviceIP', deviceIP);
  
  // Close any existing connection
  if (window.websocket) {
    try {
      window.websocket.close();
      window.websocket = null;
    } catch (e) {
      console.error('Error closing WebSocket:', e);
    }
  }
  
  // Reset connection state
  window.websocketConnected = false;
  
  // Import the connection module if needed
  if (typeof window.initWebSocket !== 'function') {
    import('./menu_connection.js').then(module => {
      if (module.initWebSocket) {
        // Call with a slight delay
        setTimeout(() => module.initWebSocket(), 100);
      }
    }).catch(err => {
      console.error('Error importing connection module:', err);
    });
  } else {
    // Initialize connection to the new device
    setTimeout(window.initWebSocket, 100);
  }
  
  return true;
}

export { 
  initDeviceManager, 
  addDevice, 
  removeDevice, 
  setDefaultDevice,
  displayDeviceManager,
  getSavedDevices,
  updateDeviceSelector
};
