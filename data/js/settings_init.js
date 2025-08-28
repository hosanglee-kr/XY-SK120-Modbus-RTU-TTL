/**
 * Settings initialization for XY-SK120
 * Initializes all settings tabs and components
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing settings tabs");
    
    // Initialize settings tabs
    initSettingsTabs();
    
    // Initialize WiFi settings
    if (typeof window.initWifiSettings === 'function') {
        console.log("Initializing WiFi settings");
        window.initWifiSettings();
    } else {
        console.error("WiFi settings initialization function not found");
    }
    
    // Initialize theme toggle
    initThemeToggle();
    
    // Initialize device settings
    initDeviceSettings();
    
    // Initialize auto refresh toggle
    initAutoRefreshToggle();
});

// Function to initialize settings tabs
function initSettingsTabs() {
    const tabsContainer = document.getElementById('settings-tablist');
    if (!tabsContainer) {
        console.error("Settings tablist container not found");
        return;
    }
    
    // Get all tab buttons
    const tabButtons = tabsContainer.querySelectorAll('button[role="tab"]');
    
    // Setup tab click handlers
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active state from all tabs
            tabButtons.forEach(tab => {
                tab.setAttribute('aria-selected', 'false');
                tab.classList.remove('border-blue-500', 'text-blue-600', 'dark:text-blue-300', 'dark:border-blue-400');
                tab.classList.add('border-transparent', 'text-gray-700', 'dark:text-white');
            });
            
            // Add active state to current tab
            this.setAttribute('aria-selected', 'true');
            this.classList.remove('border-transparent', 'text-gray-700', 'dark:text-white');
            this.classList.add('border-blue-500', 'text-blue-600', 'dark:text-blue-300', 'dark:border-blue-400');
            
            // Hide all panels
            const panels = document.querySelectorAll('.settings-panel');
            panels.forEach(panel => {
                panel.classList.add('hidden');
                panel.setAttribute('aria-hidden', 'true');
            });
            
            // Show the selected panel
            const panelId = this.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.classList.remove('hidden');
                panel.setAttribute('aria-hidden', 'false');
                
                // If WiFi tab is selected, refresh WiFi status
                if (panelId === 'wifi-settings-tab' && typeof window.wifiSettings?.fetchWifiStatus === 'function') {
                    try {
                        // Only attempt to fetch if WebSocket is connected
                        if (window.websocketConnected) {
                            window.wifiSettings.fetchWifiStatus()
                                .catch(error => {
                                    console.warn("Could not fetch WiFi status:", error.message);
                                    // This error is now handled
                                });
                        } else {
                            console.log("WebSocket not connected, WiFi status will be updated when connection is established");
                        }
                    } catch (error) {
                        console.error("Error calling fetchWifiStatus:", error);
                    }
                }
            }
        });
    });
    
    // Initialize with the first tab selected, or keep existing selection
    const activeTab = tabsContainer.querySelector('button[aria-selected="true"]') || tabButtons[0];
    if (activeTab) {
        activeTab.click();
    }
}

// Function to initialize theme toggle
function initThemeToggle() {
    // Implementation as needed...
}

// Function to initialize device settings
function initDeviceSettings() {
    // Implementation as needed...
}

// Function to initialize auto refresh toggle
function initAutoRefreshToggle() {
    // Implementation as needed...
}
