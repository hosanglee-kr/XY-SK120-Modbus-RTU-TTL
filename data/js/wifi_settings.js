/**
 * WiFi settings functionality for XY-SK120
 * Handles WiFi configuration and status display
 */

// Use IIFE to create a module-like scope
(function() {
    // Flag to track if initialization has been done
    let initialized = false;

    // Store the current WiFi connection information
    let currentWifiStatus = {
        ssid: '',
        status: '',
        ip: '',
        rssi: 0
    };

    // Initialize WiFi settings module
    function initWifiSettings() {
        // Only initialize once
        if (initialized) {
            console.log("WiFi settings already initialized");
            return;
        }
        
        console.log("Initializing WiFi settings module");
        
        // Set up event listeners
        setupWifiRefreshButton();
        setupWifiResetButton();
        setupAddWifiForm();
        setupRefreshNetworksButton();
        
        // Listen for WebSocket connection events
        document.addEventListener('websocket-connected', handleWebSocketConnected);
        document.addEventListener('websocket-disconnected', handleWebSocketDisconnected);
        
        // Check if WebSocket is already connected
        if (window.websocketConnected && window.websocket && window.websocket.readyState === 1) {
            console.log("WebSocket already connected, fetching WiFi status");
            fetchWifiStatus();
        } else {
            console.log("WebSocket not yet connected, showing disconnected state");
            // Show disconnected state
            updateWifiStatusUI({
                status: 'waiting',
                ssid: 'Waiting for connection...',
                ip: '--',
                rssi: 0,
                mac: '--'
            });
        }
        
        initialized = true;
    }

    // Set up WiFi refresh button
    function setupWifiRefreshButton() {
        const refreshBtn = document.getElementById('wifi-refresh-btn');
        if (refreshBtn) {
            // Remove any existing listeners to prevent duplicates
            const newRefreshBtn = refreshBtn.cloneNode(true);
            refreshBtn.parentNode.replaceChild(newRefreshBtn, refreshBtn);
            
            // Add new event listener
            newRefreshBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Show loading state
                this.disabled = true;
                const originalText = this.innerHTML;
                this.innerHTML = `
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                `;
                
                // Check WebSocket connection first
                if (!window.websocketConnected) {
                    console.log("WebSocket not connected, trying to reconnect");
                    
                    // Attempt to trigger a reconnection
                    if (typeof window.initWebSocket === 'function') {
                        window.initWebSocket();
                    }
                    
                    // Show error message after a short delay if still disconnected
                    setTimeout(() => {
                        if (!window.websocketConnected) {
                            alert("Cannot refresh WiFi status: WebSocket not connected");
                            
                            // Restore button state
                            this.disabled = false;
                            this.innerHTML = originalText;
                        } else {
                            // If now connected, fetch the status
                            fetchWifiStatus()
                                .finally(() => {
                                    // Restore button state after 2 seconds
                                    setTimeout(() => {
                                        this.disabled = false;
                                        this.innerHTML = originalText;
                                    }, 2000);
                                });
                        }
                    }, 2000);
                    
                    return;
                }
                
                // Fetch WiFi status if connected
                refreshWifiStatusAndNetworks()
                    .finally(() => {
                        // Restore button state after 2 seconds
                        setTimeout(() => {
                            this.disabled = false;
                            this.innerHTML = originalText;
                        }, 2000);
                    });
            });
        }
    }

    // Set up WiFi reset button
    function setupWifiResetButton() {
        const resetBtn = document.getElementById('wifi-reset-btn');
        if (resetBtn) {
            // Remove any existing listeners to prevent duplicates
            const newResetBtn = resetBtn.cloneNode(true);
            resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
            
            // Add new event listener
            newResetBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (confirm('Are you sure you want to reset WiFi settings? This will remove all saved networks and the device will restart.')) {
                    // Show loading state
                    this.disabled = true;
                    this.textContent = 'Resetting...';
                    
                    // Reset WiFi
                    window.wifiInterface.resetWifi()
                        .then(result => {
                            if (result.success) {
                                alert('WiFi settings reset successfully. The device will restart.');
                            } else {
                                alert(`Failed to reset WiFi settings: ${result.error || 'Unknown error'}`);
                            }
                        })
                        .catch(error => {
                            console.error('Error resetting WiFi:', error);
                            alert('Error resetting WiFi: ' + error.message);
                        })
                        .finally(() => {
                            // Restore button state
                            this.disabled = false;
                            this.innerHTML = `
                                <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5m0 0l9-5-9 5-9 5 9 5m0 0v8"></path>
                                </svg>
                                Reset WiFi
                            `;
                        });
                }
            });
        }
    }

    // Set up add WiFi form
    function setupAddWifiForm() {
        const form = document.getElementById('add-wifi-form');
        if (form) {
            // Remove any existing listeners to prevent duplicates
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            // Add new event listener
            newForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Get form values
                const ssidInput = this.querySelector('#new-wifi-ssid');
                const passwordInput = this.querySelector('#new-wifi-password');
                const submitBtn = this.querySelector('[type="submit"]');
                
                if (!ssidInput || !passwordInput) {
                    alert('Form inputs not found');
                    return;
                }
                
                const ssid = ssidInput.value.trim();
                const password = passwordInput.value;
                
                if (!ssid) {
                    alert('Please enter an SSID');
                    return;
                }
                
                // Check WebSocket connection before attempting to add
                if (!window.websocketConnected) {
                    alert('Cannot add network: WebSocket not connected. Please check your connection.');
                    return;
                }
                
                // Show loading state
                submitBtn.disabled = true;
                submitBtn.textContent = 'Adding...';
                
                // Add WiFi network with better error handling
                window.wifiInterface.addWifiNetwork(ssid, password)
                    .then(result => {
                        if (result.success) {
                            alert(`WiFi network "${ssid}" added successfully!`);
                            
                            // Clear form
                            ssidInput.value = '';
                            passwordInput.value = '';
                            
                            // Perform a combined refresh (status and networks)
                            refreshWifiStatusAndNetworks();
                        } else {
                            alert(`Failed to add WiFi network: ${result.error || 'Unknown error'}`);
                        }
                    })
                    .catch(error => {
                        console.error('Error adding WiFi network:', error);
                        alert('Error adding WiFi network: ' + error.message);
                    })
                    .finally(() => {
                        // Restore button state
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Add Network';
                    });
            });
        }
    }

    // Add setup for the refresh networks button
    function setupRefreshNetworksButton() {
        const refreshBtn = document.getElementById('refresh-networks-btn');
        if (refreshBtn) {
            // Remove any existing listeners to prevent duplicates
            const newRefreshBtn = refreshBtn.cloneNode(true);
            refreshBtn.parentNode.replaceChild(newRefreshBtn, refreshBtn);
            
            // Add new event listener
            newRefreshBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Show loading state
                this.disabled = true;
                const originalText = this.innerHTML;
                this.innerHTML = `
                    <svg class="animate-spin -ml-1 mr-1 h-3 w-3 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                `;
                
                // Use combined refresh function
                refreshWifiStatusAndNetworks()
                    .finally(() => {
                        // Restore button state after 1 second
                        setTimeout(() => {
                            this.disabled = false;
                            this.innerHTML = originalText;
                        }, 1000);
                    });
            });
        }
    }

    // Handle WebSocket connected event
    function handleWebSocketConnected() {
        console.log('WebSocket connected - updating WiFi status');
        
        // Wait a moment for the connection to fully stabilize
        setTimeout(() => {
            // Add try-catch to handle any errors that might occur
            try {
                fetchWifiStatus()
                    .then(status => {
                        // Store the current status for later reference
                        currentWifiStatus = status;
                        
                        // Now fetch saved networks with the current status
                        return fetchSavedNetworks();
                    })
                    .catch(error => {
                        console.warn("Error during automatic WiFi status fetch:", error.message);
                        // Error is now handled
                    });
            } catch (error) {
                console.error("Unexpected error during WebSocket connected handler:", error);
            }
        }, 500);
    }

    // Handle WebSocket disconnected event
    function handleWebSocketDisconnected() {
        console.log('WebSocket disconnected - marking WiFi status as unknown');
        
        // Set the WiFi status elements to show disconnect state
        updateWifiStatusUI({
            status: 'disconnected',
            ssid: 'Not connected',
            ip: '--',
            rssi: 0,
            mac: '--'
        });
    }

    // Fetch WiFi status with improved error handling
    function fetchWifiStatus() {
        console.log('Fetching WiFi status');
        
        // Show loading state
        setWifiStatusLoading(true);
        
        // Check if WebSocket is connected
        if (!window.websocketConnected) {
            console.warn('Cannot fetch WiFi status: WebSocket not connected');
            setWifiStatusError('WebSocket disconnected');
            
            // Return rejected promise but make sure it's caught somewhere
            return Promise.reject(new Error('WebSocket not connected'))
                .catch(err => {
                    // This ensures the promise rejection is handled at this level
                    // even if the caller doesn't have a catch block
                    console.warn("WiFi status fetch failed (handled):", err.message);
                    throw err; // Still propagate the error for external catch blocks
                });
        }
        
        return window.wifiInterface.getWifiStatus()
            .then(wifiStatus => {
                console.log('WiFi status received:', wifiStatus);
                
                // Update UI with WiFi status
                updateWifiStatusUI(wifiStatus);
                
                return wifiStatus;
            })
            .catch(error => {
                console.error('Error fetching WiFi status:', error);
                
                // Show error state
                setWifiStatusError(error.message);
                
                // Make sure this doesn't become an unhandled rejection
                // The error is handled here but still propagated
                return Promise.reject(error);
            });
    }

    // Enhance fetchSavedNetworks to include currently connected network
    function fetchSavedNetworks() {
        console.log('Fetching saved WiFi networks');
        
        // Show loading state for saved networks
        const networksContainer = document.getElementById('saved-wifi-networks');
        if (networksContainer) {
            networksContainer.innerHTML = '<div class="p-4 text-sm text-gray-500 dark:text-gray-400">Loading saved networks...</div>';
        }
        
        // Debug - ensure WebSocket is connected
        if (!window.websocketConnected) {
            console.warn('Cannot fetch networks: WebSocket not connected');
            if (networksContainer) {
                networksContainer.innerHTML = '<div class="p-4 text-sm text-gray-500 dark:text-gray-400">Cannot load networks: WebSocket disconnected</div>';
            }
            return Promise.reject(new Error('WebSocket not connected'));
        }
        
        return window.wifiInterface.loadWifiCredentials()
            .then(networks => {
                console.log('Saved networks received:', networks);
                
                // Debug - make sure networks is a valid array
                if (!Array.isArray(networks)) {
                    console.warn('Received networks is not an array:', networks);
                    
                    // Try to parse networks if it's a string
                    if (typeof networks === 'string') {
                        try {
                            networks = JSON.parse(networks);
                            console.log('Successfully parsed networks string:', networks);
                        } catch (e) {
                            console.error('Error parsing networks string:', e);
                            networks = [];
                        }
                    } else {
                        networks = [];
                    }
                }
                
                // Make sure the currently connected network is in the list
                if (currentWifiStatus && currentWifiStatus.ssid && currentWifiStatus.status === 'connected') {
                    // Check if the current network is already in the list
                    const currentNetworkExists = networks.some(network => network.ssid === currentWifiStatus.ssid);
                    
                    // If not, add it
                    if (!currentNetworkExists) {
                        console.log('Adding currently connected network to list:', currentWifiStatus.ssid);
                        networks.push({
                            ssid: currentWifiStatus.ssid,
                            // We don't have the password, but that's OK since we're already connected
                            connected: true
                        });
                    }
                }
                
                // Show how many networks we have
                console.log(`Found ${networks.length} saved networks`);
                
                // Update UI with saved networks
                updateSavedNetworksUI(networks);
                
                return networks;
            })
            .catch(error => {
                console.error('Error fetching saved networks:', error);
                
                // Show error state
                if (networksContainer) {
                    networksContainer.innerHTML = `
                        <div class="p-4">
                            <p class="text-sm text-danger mb-2">Failed to load saved networks.</p>
                            <button id="retry-networks-btn" class="text-xs px-2 py-1 bg-secondary text-white rounded hover:bg-opacity-90">
                                Retry
                            </button>
                        </div>
                    `;
                    
                    // Add retry button functionality
                    const retryBtn = document.getElementById('retry-networks-btn');
                    if (retryBtn) {
                        retryBtn.addEventListener('click', () => fetchSavedNetworks());
                    }
                }
                
                throw error;
            });
    }

    // Set WiFi status elements to loading state
    function setWifiStatusLoading(loading) {
        const elements = ['wifi-status', 'wifi-ssid', 'wifi-ip', 'wifi-rssi'];
        
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (loading) {
                    el.classList.add('loading');
                    el.setAttribute('data-previous', el.textContent);
                    el.textContent = 'Loading...';
                } else {
                    el.classList.remove('loading');
                    const previous = el.getAttribute('data-previous');
                    if (previous) {
                        el.textContent = previous;
                    }
                }
            }
        });
    }

    // Show a more specific error message
    function setWifiStatusError(errorMessage = 'Error') {
        const statusEl = document.getElementById('wifi-status');
        if (statusEl) {
            statusEl.classList.remove('loading');
            statusEl.textContent = 'Error';
            statusEl.className = 'text-base font-semibold text-danger';
        }
        
        const elements = ['wifi-ssid', 'wifi-ip', 'wifi-rssi'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('loading');
                if (id === 'wifi-ssid') {
                    el.textContent = errorMessage || 'Connection error';
                } else {
                    el.textContent = '--';
                }
            }
        });
    }

    // Update WiFi status UI
    function updateWifiStatusUI(data) {
        // Store the current status for later reference
        currentWifiStatus = data;
        
        // Update status
        const statusEl = document.getElementById('wifi-status');
        if (statusEl) {
            statusEl.classList.remove('loading');
            statusEl.textContent = data.status || 'Unknown';
            
            // Set color based on status
            statusEl.className = 'text-base font-semibold';
            
            if (data.status === 'connected') {
                statusEl.classList.add('text-success');
            } else if (data.status === 'connecting') {
                statusEl.classList.add('text-secondary');
            } else if (data.status === 'disconnected') {
                statusEl.classList.add('text-danger');
            } else {
                statusEl.classList.add('text-gray-700', 'dark:text-gray-200');
            }
        }
        
        // Update SSID
        const ssidEl = document.getElementById('wifi-ssid');
        if (ssidEl) {
            ssidEl.classList.remove('loading');
            ssidEl.textContent = data.ssid || 'Not connected';
        }
        
        // Update IP
        const ipEl = document.getElementById('wifi-ip');
        if (ipEl) {
            ipEl.classList.remove('loading');
            ipEl.textContent = data.ip || '--';
        }
        
        // Update RSSI
        const rssiEl = document.getElementById('wifi-rssi');
        if (rssiEl) {
            rssiEl.classList.remove('loading');
            
            const rssi = parseInt(data.rssi) || 0;
            
            let signalStrength = '';
            if (rssi > -50) signalStrength = 'Excellent';
            else if (rssi > -60) signalStrength = 'Good';
            else if (rssi > -70) signalStrength = 'Fair';
            else if (rssi > -80) signalStrength = 'Weak';
            else signalStrength = 'Very Weak';
            
            rssiEl.textContent = `${rssi} dBm (${signalStrength})`;
        }
        
        // After updating the status, also update the saved networks display
        // to reflect the current connection status
        fetchSavedNetworks().catch(error => {
            console.warn("Error refreshing saved networks after status update:", error.message);
        });
    }

    // Update saved networks UI with improved error handling and default content
    function updateSavedNetworksUI(networks) {
        const networksContainer = document.getElementById('saved-wifi-networks');
        if (!networksContainer) return;
        
        // Ensure networks is an array
        if (!networks) networks = [];
        
        // Check if we have any networks
        if (networks.length === 0) {
            networksContainer.innerHTML = `
                <div class="p-4 text-sm text-gray-500 dark:text-gray-400">
                    No saved networks found. Add a network using the form below.
                </div>
            `;
            return;
        }
        
        let html = '';
        networks.forEach((network, index) => {
            const ssid = network.ssid || 'Unknown SSID';
            const isConnected = currentWifiStatus && currentWifiStatus.ssid === ssid && 
                              currentWifiStatus.status === 'connected';
            const isConnecting = currentWifiStatus && currentWifiStatus.ssid === ssid && 
                               currentWifiStatus.status === 'connecting';
            
            // Generate classes for the network item container
            const containerClasses = isConnected ? 
                'flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 bg-green-50 dark:bg-green-900/20' : 
                'flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0';
            
            // Determine button state based on connection status
            let connectButton = '';
            if (isConnected) {
                // Already connected - show a disabled "Connected" button
                connectButton = `
                    <button class="text-xs px-2 py-1 bg-green-500 text-white rounded cursor-default">
                        <svg xmlns="http://www.w3.org/2000/svg" class="inline-block h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Connected
                    </button>
                `;
            } else if (isConnecting) {
                // Currently connecting - show indicator
                connectButton = `
                    <button class="text-xs px-2 py-1 bg-yellow-500 text-white rounded cursor-default">
                        <svg xmlns="http://www.w3.org/2000/svg" class="inline-block animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Connecting...
                    </button>
                `;
            } else {
                // Not connected - show connect button
                connectButton = `
                    <button onclick="window.wifiSettings.connectToNetwork('${ssid}')" class="text-xs px-2 py-1 bg-secondary text-white rounded hover:bg-opacity-90">
                        Connect
                    </button>
                `;
            }
            
            // Signal strength indicator (for the connected network)
            let signalStrength = '';
            if (isConnected && currentWifiStatus.rssi) {
                const rssi = currentWifiStatus.rssi;
                let signalQuality = '';
                let signalIcon = '';
                
                if (rssi > -50) {
                    signalQuality = 'Excellent';
                    signalIcon = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="inline-block h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0" />
                        </svg>
                    `;
                } else if (rssi > -60) {
                    signalQuality = 'Good';
                    signalIcon = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="inline-block h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0" />
                        </svg>
                    `;
                } else if (rssi > -70) {
                    signalQuality = 'Fair';
                    signalIcon = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="inline-block h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01" />
                        </svg>
                    `;
                } else {
                    signalQuality = 'Weak';
                    signalIcon = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="inline-block h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01" />
                        </svg>
                    `;
                }
                
                signalStrength = `
                    <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        ${signalIcon} ${signalQuality} (${rssi} dBm)
                    </div>
                `;
            }
            
            // Build the network item HTML
            html += `
                <div class="${containerClasses}">
                    <div class="flex-1">
                        <p class="text-sm font-medium ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}">
                            ${ssid}
                            ${isConnected ? 
                                `<span class="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 px-1.5 py-0.5 rounded-full">
                                    Connected
                                </span>` : ''}
                        </p>
                        ${signalStrength}
                        ${isConnected && currentWifiStatus.ip ? 
                            `<div class="mt-1 text-xs text-gray-500 dark:text-gray-400">IP: ${currentWifiStatus.ip}</div>` : ''}
                    </div>
                    <div class="flex space-x-2">
                        ${connectButton}
                        <button onclick="window.wifiSettings.removeNetwork(${index})" class="text-xs px-2 py-1 bg-danger text-white rounded hover:bg-opacity-90">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        });
        
        networksContainer.innerHTML = html;
    }

    // Improved connectToNetwork function to handle connection state
    function connectToNetwork(ssid) {
        console.log(`Connecting to network: ${ssid}`);
        
        // Check if we're already connected to this network
        if (currentWifiStatus && currentWifiStatus.ssid === ssid && currentWifiStatus.status === 'connected') {
            alert(`Already connected to ${ssid}`);
            return;
        }
        
        // Show connecting state in UI immediately
        const oldStatus = {...currentWifiStatus};
        currentWifiStatus = {
            ...currentWifiStatus,
            ssid: ssid,
            status: 'connecting'
        };
        
        // Update the saved networks display to show connecting state
        fetchSavedNetworks().catch(error => {
            console.warn("Error refreshing networks while connecting:", error.message);
        });
        
        // This function would need to be implemented on the backend
        // For now, simulate a connection attempt
        alert(`Feature not implemented: Connect to ${ssid}`);
        
        // After the simulated attempt, restore the previous status
        setTimeout(() => {
            currentWifiStatus = oldStatus;
            fetchSavedNetworks().catch(error => {
                console.warn("Error refreshing networks after connection attempt:", error.message);
            });
        }, 2000);
    }

    // Remove a saved WiFi network
    function removeNetwork(index) {
        console.log(`Removing network at index: ${index}`);
        
        // This function would need to be implemented on the backend
        // For now, show an alert
        alert(`Feature not implemented: Remove network at index ${index}`);
    }

    // Add function to manually refresh networks
    function refreshNetworks() {
        if (window.websocketConnected) {
            return fetchSavedNetworks()
                .then(() => {
                    console.log('Networks refreshed successfully');
                    return true;
                })
                .catch(error => {
                    console.error('Error refreshing networks:', error);
                    return false;
                });
        } else {
            console.warn('Cannot refresh networks: WebSocket not connected');
            return Promise.reject(new Error('WebSocket not connected'));
        }
    }

    // Add a combined refresh function
    function refreshWifiStatusAndNetworks() {
        console.log('Performing combined WiFi refresh');
        
        // First fetch the WiFi status
        return fetchWifiStatus()
            .then(status => {
                // After status is updated, fetch the networks
                return fetchSavedNetworks();
            })
            .catch(error => {
                console.warn('Error during combined WiFi refresh:', error.message);
                // Even if fetching status fails, try to fetch networks
                return fetchSavedNetworks()
                    .catch(networkError => {
                        console.warn('Error fetching networks after status error:', networkError.message);
                    });
            });
    }

    // Export functions for global access
    window.wifiSettings = {
        initWifiSettings,
        fetchWifiStatus,
        connectToNetwork,
        removeNetwork,
        refreshNetworks,
        refreshWifiStatusAndNetworks
    };

    // Make initWifiSettings available directly
    window.initWifiSettings = initWifiSettings;
})();