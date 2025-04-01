// Wait for DOM Content Loaded first
document.addEventListener('DOMContentLoaded', function() {
    // Then wait for components to be loaded before initializing
    if (document.querySelector('[data-component]')) {
        document.addEventListener('components-loaded', initializeSettings);
    } else {
        // If there are no components to load, initialize directly
        initializeSettings();
    }
});

function initializeSettings() {
    console.log("Initializing settings...");
    
    // Wait a short time to ensure all components are fully loaded and processed
    setTimeout(() => {
        setupControls();
    }, 500);
    
    // Rest of initialization
    initializeSettingsTabs();
    initializeDeviceSettings();
}

function setupControls() {
    // Add event listener programmatically instead of using inline
    const powerToggle = document.getElementById('power-toggle');
    if (powerToggle) {
        console.log("Power toggle found, adding event listener");
        powerToggle.addEventListener('change', function() {
            // Only call togglePower when the user actually interacts with the switch
            if (document.readyState === 'complete') {
                console.log("User toggled power switch to:", this.checked);
                togglePower(this.checked);
            }
        });
    } else {
        console.warn("Power toggle element not found - may be in a component that's not fully loaded");
    }

    // Add event handler for refresh status button - Simplified, always use updateAllStatus
    const refreshStatusBtn = document.getElementById('refresh-mode-btn');
    if (refreshStatusBtn) {
        refreshStatusBtn.addEventListener('click', function() {
            console.log("Manual status refresh requested");
            updateAllStatus();
        });
    }
    
    // Add event handler for main refresh button - Simplified, always use updateAllStatus
    const refreshPsuBtn = document.getElementById('refresh-psu');
    if (refreshPsuBtn) {
        refreshPsuBtn.addEventListener('click', function() {
            console.log("PSU refresh requested");
            updateAllStatus();
        });
    }
    
    // Mode tab switcher - completely fixed to work properly
    document.querySelectorAll('[data-mode]').forEach(tab => {
        tab.addEventListener('click', function() {
            console.log("Mode tab clicked:", this.getAttribute('data-mode'));
            
            // Update active tab styling
            document.querySelectorAll('[data-mode]').forEach(t => {
                t.classList.remove('tab-active', 'tab-active-cv', 'tab-active-cc', 'tab-active-cp');
                t.classList.add('border-transparent', 'text-gray-700', 'dark:text-white');
            });
            
            // Get the mode from data attribute
            const mode = this.getAttribute('data-mode');
            this.classList.remove('border-transparent');
            
            // Apply the mode-specific active class
            if (mode === 'cv') {
                this.classList.add('tab-active-cv', 'border-blue-500');
            } else if (mode === 'cc') {
                this.classList.add('tab-active-cc', 'border-blue-500');
            } else if (mode === 'cp') {
                this.classList.add('tab-active-cp', 'border-blue-500');
            } else {
                this.classList.add('tab-active', 'border-blue-500'); // fallback
            }
            
            // Show the corresponding settings panel
            document.querySelectorAll('.mode-settings').forEach(panel => {
                panel.classList.add('hidden');
            });
            
            const targetPanel = document.getElementById(`${mode}-settings`);
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
                targetPanel.classList.add('block');
            } else {
                console.error("Could not find panel with ID:", `${mode}-settings`);
            }
            
            // Store the last active tab in local storage so it persists
            localStorage.setItem('lastActiveTab', mode);
        });
    });
    
    // Restore the last active tab from local storage when page loads
    const lastActiveTab = localStorage.getItem('lastActiveTab') || 'cv'; // Default to CV if none stored
    const tabToActivate = document.querySelector(`[data-mode="${lastActiveTab}"]`);
    
    if (tabToActivate) {
        // Simulate a click on the tab to restore its state
        tabToActivate.click();
    }

    // Add CP Mode toggle event listener
    const cpModeToggle = document.getElementById('cp-mode-toggle');
    if (cpModeToggle) {
        cpModeToggle.addEventListener('change', function() {
            console.log("CP mode toggle changed to:", this.checked);
            setConstantPowerMode(this.checked);
        });
    }
    
    // Setup key lock toggle
    const keyLockToggle = document.getElementById('key-lock');
    if (keyLockToggle) {
        console.log("Key lock toggle found, adding event listener");
        keyLockToggle.addEventListener('change', function() {
            toggleKeyLock(this.checked);
        });
    } else {
        console.warn("Key lock toggle element not found - may be in a component that's not fully loaded");
    }
}

// Initialize settings tabs
function initializeSettingsTabs() {
    // Settings tab switcher
    document.querySelectorAll('[role="tab"]').forEach(tab => {
        tab.addEventListener('click', function() {
            // Get the target panel id from aria-controls
            const tabPanelId = this.getAttribute('aria-controls');
            if (!tabPanelId) return;
            
            // Update active tab styling
            document.querySelectorAll('[role="tab"]').forEach(t => {
                t.setAttribute('aria-selected', 'false');
                t.classList.remove('text-blue-600', 'border-blue-500', 'dark:text-blue-300', 'dark:border-blue-400');
                t.classList.add('text-gray-700', 'border-transparent', 'dark:text-white');
            });
            
            // Set this tab as active
            this.setAttribute('aria-selected', 'true');
            this.classList.remove('text-gray-700', 'border-transparent', 'dark:text-white');
            this.classList.add('text-blue-600', 'border-blue-500', 'dark:text-blue-300', 'dark:border-blue-400');
            
            // Show the corresponding panel
            document.querySelectorAll('[role="tabpanel"]').forEach(panel => {
                panel.setAttribute('aria-hidden', 'true');
                panel.classList.add('hidden');
            });
            
            const targetPanel = document.getElementById(tabPanelId);
            if (targetPanel) {
                targetPanel.setAttribute('aria-hidden', 'false');
                targetPanel.classList.remove('hidden');
            }
            
            // Store the last active settings tab
            const tabId = this.id;
            if (tabId.startsWith('tab-')) {
                localStorage.setItem('lastActiveSettingsTab', tabId.substring(4));
            }
        });
    });
    
    // Restore the last active settings tab
    const lastActiveSettingsTab = localStorage.getItem('lastActiveSettingsTab') || 'wifi';
    const settingsTabToActivate = document.getElementById(`tab-${lastActiveSettingsTab}`);
    
    if (settingsTabToActivate) {
        // Simulate a click on the tab to restore its state
        settingsTabToActivate.click();
    }
}

// Initialize device settings and UI controls
function initializeDeviceSettings() {
    // Setup dark mode toggle in UI settings
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        // Set initial state based on current theme
        darkModeToggle.checked = document.documentElement.classList.contains('dark');
        
        // Add change listener
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Setup auto-refresh toggle
    const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
    if (autoRefreshToggle) {
        autoRefreshToggle.addEventListener('change', function() {
            if (this.checked) {
                if (typeof window.startAutoRefresh === 'function') {
                    window.startAutoRefresh();
                }
            } else {
                if (typeof window.stopAutoRefresh === 'function') {
                    window.stopAutoRefresh();
                }
            }
        });
    }

    // Setup refresh interval selector
    const refreshIntervalSelector = document.getElementById('refresh-interval');
    if (refreshIntervalSelector) {
        refreshIntervalSelector.addEventListener('change', function() {
            const interval = parseInt(this.value) * 1000;
            // Store the selected interval
            localStorage.setItem('refreshInterval', interval);
            
            // Restart auto-refresh with new interval if it's running
            if (typeof window.autoRefreshTimer !== 'undefined' && window.autoRefreshTimer) {
                if (typeof window.stopAutoRefresh === 'function' && 
                    typeof window.startAutoRefresh === 'function') {
                    window.stopAutoRefresh();
                    window.startAutoRefresh();
                }
            }
        });
    }

    // Setup saved devices list
    updateSavedDevicesList();

    // Save device settings button
    const saveDeviceSettingsBtn = document.getElementById('save-device-settings');
    if (saveDeviceSettingsBtn) {
        saveDeviceSettingsBtn.addEventListener('click', function() {
            const deviceName = document.getElementById('device-name').value;
            const modbusId = document.getElementById('modbus-id').value;
            const baudrate = document.getElementById('baudrate').value;
            const updateInterval = document.getElementById('update-interval').value;
            
            const config = {
                deviceName: deviceName,
                modbusId: modbusId,
                baudRate: baudrate,
                updateInterval: updateInterval
            };
            
            // Save using the global function if available
            if (typeof window.saveDeviceConfig === 'function') {
                window.saveDeviceConfig(config);
            } else {
                alert('Device settings saved locally');
                localStorage.setItem('deviceConfig', JSON.stringify(config));
            }
        });
    }

    // Save UI settings button
    const saveUiSettingsBtn = document.getElementById('save-ui-settings');
    if (saveUiSettingsBtn) {
        saveUiSettingsBtn.addEventListener('click', function() {
            const theme = document.getElementById('dark-mode-toggle').checked ? 'dark' : 'light';
            const autoRefresh = document.getElementById('auto-refresh-toggle').checked;
            const refreshInterval = document.getElementById('refresh-interval').value;
            
            const uiConfig = {
                theme: theme,
                autoRefresh: autoRefresh,
                refreshInterval: refreshInterval
            };
            
            // Save to localStorage
            localStorage.setItem('uiConfig', JSON.stringify(uiConfig));
            alert('UI settings saved');
            
            // Apply theme immediately
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        });
    }

    // Add more frequent status check for key lock specifically
    setTimeout(() => {
        if (typeof window.startKeyLockStatusMonitor === 'function') {
            window.startKeyLockStatusMonitor();
            console.log("Started dedicated key lock status monitor");
        }
    }, 2000);
}

// Setup saved devices list
function updateSavedDevicesList() {
    const savedDevicesList = document.getElementById('saved-devices-list');
    if (!savedDevicesList) return;
    
    const devices = window.loadSavedDevices ? window.loadSavedDevices() : [];
    if (devices.length === 0) {
        savedDevicesList.innerHTML = '<div class="p-4 text-sm text-gray-500 dark:text-gray-400">No saved devices</div>';
        return;
    }
    
    let html = '';
    devices.forEach((device, index) => {
        html += `
        <div class="border-b border-gray-200 dark:border-gray-700 last:border-b-0 p-3 flex justify-between items-center">
            <div>
                <span class="font-medium">${device.name || 'Unnamed Device'}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">${device.ip}</span>
            </div>
            <div>
                <button 
                    onclick="connectToDevice('${device.ip}')"
                    class="text-xs px-2 py-1 bg-secondary text-white rounded hover:bg-opacity-90">
                    Connect
                </button>
                <button 
                    onclick="removeSavedDevice(${index})"
                    class="text-xs px-2 py-1 bg-danger text-white rounded hover:bg-opacity-90 ml-1">
                    Remove
                </button>
            </div>
        </div>`;
    });
    
    savedDevicesList.innerHTML = html;
}

// Function to remove a saved device - making it available globally
window.removeSavedDevice = function(index) {
    if (!window.loadSavedDevices) return;
    
    const devices = window.loadSavedDevices();
    devices.splice(index, 1);
    localStorage.setItem('savedDevices', JSON.stringify(devices));
    
    // Update the list display
    updateSavedDevicesList();
    
    // Also update the device selector
    if (typeof setupDeviceSelector === 'function') {
        setupDeviceSelector();
    }
};
