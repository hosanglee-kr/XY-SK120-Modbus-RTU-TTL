/**
 * WiFi settings functionality for XY-SK120
 */

// Initialize WiFi settings
export function initWifiSettings() {
    // Setup add network form
    setupAddNetworkForm();

    // Load saved networks
    loadSavedNetworks();

    // Fetch and display WiFi status
    fetchWifiStatus();

    // Listen for WebSocket messages related to WiFi settings
    document.addEventListener('websocket-message', handleWifiMessages);

    // Handle refresh WiFi status button
    const refreshWifiStatusButton = document.getElementById('refresh-wifi-status');
    if (refreshWifiStatusButton) {
        refreshWifiStatusButton.addEventListener('click', fetchWifiStatus);
    }

    // Handle reset WiFi button
    const resetWifiButton = document.getElementById('reset-wifi');
    if (resetWifiButton) {
        resetWifiButton.addEventListener('click', resetWifi);
    }
}

// Set up add network form
function setupAddNetworkForm() {
    const addWifiForm = document.getElementById('add-wifi-form');
    if (!addWifiForm) return;

    addWifiForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const ssidInput = document.getElementById('new-wifi-ssid');
        const passwordInput = document.getElementById('new-wifi-password');

        if (!ssidInput || !ssidInput.value) {
            alert('Please enter a valid SSID');
            return;
        }

        const ssid = ssidInput.value.trim();
        const password = passwordInput ? passwordInput.value.trim() : '';

        // Save the WiFi credentials
        saveWifiCredentials(ssid, password);

        // Clear the form
        ssidInput.value = '';
        if (passwordInput) passwordInput.value = '';

        // Reload the saved networks
        loadSavedNetworks();
    });
}

// Load saved networks from the backend
function loadSavedNetworks() {
    console.log("Loading saved WiFi networks...");
    window.sendCommand({ action: 'loadWifiCredentials' });
}

// Fetch WiFi status from the backend
function fetchWifiStatus() {
    console.log("Fetching WiFi status...");
    window.sendCommand({ action: 'getWifiStatus' });
}

// Handle WebSocket messages related to WiFi settings
function handleWifiMessages(event) {
    const data = event.detail;
    console.log("Received WebSocket message:", data); // Debug print

    if (data.action === 'loadWifiCredentialsResponse') {
        displaySavedNetworks(data.wifiCredentials);
    } else if (data.action === 'wifiStatusResponse') {
        displayWifiStatus(data);
    }
}

// Display saved networks in the UI
function displaySavedNetworks(wifiCredentialsJson) {
    const savedNetworksContainer = document.getElementById('saved-wifi-networks');
    if (!savedNetworksContainer) return;

    // Clear existing content
    savedNetworksContainer.innerHTML = '';

    try {
        const wifiCredentials = JSON.parse(wifiCredentialsJson);

        if (!Array.isArray(wifiCredentials) || wifiCredentials.length === 0) {
            savedNetworksContainer.innerHTML = '<div class="p-4 text-sm text-gray-500 dark:text-gray-400">No saved networks</div>';
            return;
        }

        // Create a list of saved networks
        const list = document.createElement('ul');
        list.className = 'space-y-2';

        wifiCredentials.forEach(network => {
            const listItem = document.createElement('li');
            listItem.className = 'flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0';

            const ssidSpan = document.createElement('span');
            ssidSpan.className = 'text-sm font-medium text-gray-700 dark:text-gray-200';
            ssidSpan.textContent = network.ssid;

            listItem.appendChild(ssidSpan);
            list.appendChild(listItem);
        });

        savedNetworksContainer.appendChild(list);
    } catch (error) {
        console.error('Error parsing WiFi credentials:', error);
        savedNetworksContainer.innerHTML = '<div class="p-4 text-sm text-red-500 dark:text-red-400">Error loading networks</div>';
    }
}

// Display WiFi status in the UI
function displayWifiStatus(data) {
    console.log("Displaying WiFi status:", data); // Debug print
    const wifiStatus = document.getElementById('wifi-status');
    const wifiSsid = document.getElementById('wifi-ssid');
    const wifiIp = document.getElementById('wifi-ip');
    const wifiRssi = document.getElementById('wifi-rssi');

    if (wifiStatus) wifiStatus.textContent = data.status || 'Unknown';
    if (wifiSsid) wifiSsid.textContent = data.ssid || 'Unknown';
    if (wifiIp) wifiIp.textContent = data.ip || '--';
    if (wifiRssi) wifiRssi.textContent = data.rssi || '--';
}

// Save WiFi credentials to the backend
function saveWifiCredentials(ssid, password) {
    console.log("Saving WiFi credentials...");
    window.sendCommand({ action: 'saveWifiCredentials', ssid: ssid, password: password });
}

// Reset WiFi settings
function resetWifi() {
    console.log("Resetting WiFi settings...");
    window.sendCommand({ action: 'resetWifi' });
}
