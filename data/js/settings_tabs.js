/**
 * Dedicated script for the settings tabs functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Settings tabs module loaded");
    
    // Fix empty settings tab content by populating them first
    populateSettingsTabs();
    
    // Initialize dark mode toggle right away
    initDarkModeToggle();
    
    // Set up logs toggle
    setupLogsToggle();
    
    // Properly initialize the settings tabs after a short delay to ensure DOM is ready
    setTimeout(initSettingsTabs, 100);
});

// Update setupLogsToggle function to create a better WebSocket logs UI
function setupLogsToggle() {
    // Check if the UI settings tab exists
    const uiSettingsTab = document.getElementById('ui-settings-tab');
    if (uiSettingsTab) {
        const settingsContainer = uiSettingsTab.querySelector('.max-w-lg');
        if (settingsContainer) {
            // Look for the auto-refresh toggle item
            const autoRefreshToggle = settingsContainer.querySelector('.flex:nth-child(2)');
            if (autoRefreshToggle) {
                // Create a more descriptive WebSocket logs section
                const logsSection = document.createElement('div');
                logsSection.className = 'mt-6 border-t border-gray-200 dark:border-gray-700 pt-4';
                logsSection.innerHTML = `
                    <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">WebSocket Communication Logs</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        View real-time communication between the browser and device. Helpful for troubleshooting.
                    </p>
                    <button id="open-logs-btn" class="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-opacity-90 focus:outline-none">
                        <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        Open WebSocket Logs
                    </button>
                `;
                
                // Insert after the save button container
                const saveButtonContainer = settingsContainer.querySelector('.flex.justify-end');
                if (saveButtonContainer) {
                    saveButtonContainer.after(logsSection);
                } else {
                    // As fallback, append to the end of settings container
                    settingsContainer.appendChild(logsSection);
                }
                
                // Add event listener for the open logs button
                setTimeout(() => {
                    const openLogsBtn = document.getElementById('open-logs-btn');
                    if (openLogsBtn) {
                        openLogsBtn.addEventListener('click', function() {
                            if (typeof window.toggleLogViewer === 'function') {
                                window.toggleLogViewer(true);
                                console.log("Log viewer opened from settings");
                            } else {
                                console.error("toggleLogViewer function not available");
                            }
                        });
                    }
                }, 100);
            }
        }
    }
    
    // Make sure log viewer is initialized
    if (typeof window.setupLogViewer === 'function') {
        window.setupLogViewer();
    }
}

// Initialize tabs functionality
function initSettingsTabs() {
    // Settings tab switcher
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab styling
            document.querySelectorAll('.settings-tab').forEach(t => {
                t.classList.remove('border-secondary', 'text-secondary');
                t.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            });
            
            // Get the settings tab from data attribute
            const tabName = this.getAttribute('data-settings-tab');
            this.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            this.classList.add('border-secondary', 'text-secondary');
            
            // Show the corresponding settings panel
            document.querySelectorAll('.settings-panel').forEach(panel => {
                panel.classList.add('hidden');
                panel.classList.remove('block');
            });
            document.getElementById(`${tabName}-settings-tab`).classList.remove('hidden');
            document.getElementById(`${tabName}-settings-tab`).classList.add('block');
            
            // Store the last active settings tab
            localStorage.setItem('lastActiveSettingsTab', tabName);
        });
    });
    
    // Restore the last active settings tab
    const lastActiveSettingsTab = localStorage.getItem('lastActiveSettingsTab') || 'wifi';
    const settingsTabToActivate = document.querySelector(`.settings-tab[data-settings-tab="${lastActiveSettingsTab}"]`);
    
    if (settingsTabToActivate) {
        // Simulate a click on the tab to restore its state
        settingsTabToActivate.click();
    }
}

// Initialize mode tabs functionality
function initModeTabs() {
    // Mode tab switcher
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab styling
            document.querySelectorAll('.mode-tab').forEach(t => {
                t.classList.remove('tab-active', 'tab-active-cv', 'tab-active-cc', 'tab-active-cp');
                t.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            });
            
            // Get the mode from data attribute
            const mode = this.getAttribute('data-mode');
            this.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            
            // Apply the mode-specific active class
            if (mode === 'cv') {
                this.classList.add('tab-active-cv');
            } else if (mode === 'cc') {
                this.classList.add('tab-active-cc');
            } else if (mode === 'cp') {
                this.classList.add('tab-active-cp');
            } else {
                this.classList.add('tab-active'); // fallback
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
    const tabToActivate = document.querySelector(`.mode-tab[data-mode="${lastActiveTab}"]`);
    
    if (tabToActivate) {
        // Simulate a click on the tab to restore its state
        tabToActivate.click();
    }
}

// Initialize all tab functionality when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    initSettingsTabs();
    initModeTabs();
});

// Function to initialize dark mode toggle with the proper event listener
function initDarkModeToggle() {
    console.log("Initializing dark mode toggle");
    
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (!darkModeToggle) {
        console.error("Dark mode toggle element not found!");
        return;
    }
    
    // Set initial state based on document class and localStorage
    const savedTheme = localStorage.getItem('theme');
    
    // Update the toggle to match the current theme state
    darkModeToggle.checked = document.documentElement.classList.contains('dark');
    console.log("Initial dark mode state:", darkModeToggle.checked, "Saved theme:", savedTheme);
    
    // Add change listener with proper reference to document element
    darkModeToggle.addEventListener('change', function() {
        console.log("Dark mode toggle changed to:", this.checked);
        
        // Update DOM and persist to localStorage
        if (this.checked) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            console.log("Saved dark theme to localStorage");
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            console.log("Saved light theme to localStorage");
        }
    });
}

// Add a global function to apply the theme from localStorage (called on page load)
window.applyThemeFromStorage = function() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    
    console.log("Applied theme from storage:", savedTheme || (systemPrefersDark ? "dark (system)" : "light (system)"));
    
    // Also initialize the toggle if the UI settings tab has been loaded
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.checked = document.documentElement.classList.contains('dark');
    }
};

// Call the function to apply theme when the script loads
window.applyThemeFromStorage();

// Populate settings tabs with content if they're empty
function populateSettingsTabs() {
    // Add text to empty tab buttons
    const wifiTab = document.querySelector('.settings-tab[data-settings-tab="wifi"]');
    if (wifiTab && !wifiTab.textContent.trim()) {
        wifiTab.textContent = "WiFi";
    }
    
    const deviceTab = document.querySelector('.settings-tab[data-settings-tab="device"]');
    if (deviceTab && !deviceTab.textContent.trim()) {
        deviceTab.textContent = "Device";
    }
    
    const uiTab = document.querySelector('.settings-tab[data-settings-tab="ui"]');
    if (uiTab && !uiTab.textContent.trim()) {
        uiTab.textContent = "Web UI";
    }
    
    const managerTab = document.querySelector('.settings-tab[data-settings-tab="manager"]');
    if (managerTab && !managerTab.textContent.trim()) {
        managerTab.textContent = "Devices";
    }
    
    // Check for empty WiFi settings tab content
    const wifiSettingsTab = document.getElementById('wifi-settings-tab');
    if (wifiSettingsTab) {
        const statusGrid = wifiSettingsTab.querySelector('.grid-cols-1');
        if (statusGrid && !statusGrid.innerHTML.trim()) {
            statusGrid.innerHTML = `
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</p>
                    <p id="wifi-status" class="text-lg font-semibold text-gray-800 dark:text-gray-200">--</p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">SSID</p>
                    <p id="wifi-ssid" class="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate">--</p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">IP</p>
                    <p id="wifi-ip" class="text-lg font-semibold text-gray-800 dark:text-gray-200">--</p>
                </div>
            `;
        }
        
        const buttonsContainer = wifiSettingsTab.querySelector('.mt-6.flex');
        if (buttonsContainer && !buttonsContainer.innerHTML.trim()) {
            buttonsContainer.innerHTML = `
                <button id="wifi-refresh-btn" onclick="fetchWifiStatus()" class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                    <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Refresh WiFi Status
                </button>
                <button id="wifi-reset-btn" onclick="resetWifiSettings()" class="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-danger hover:bg-opacity-90 focus:outline-none">
                    <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9-5m0 0l9-5-9 5-9 5 9 5m0 0v8"></path>
                    </svg>
                    Reset WiFi
                </button>
            `;
        }
    }
    
    // Check for empty UI settings tab content
    const uiSettingsTab = document.getElementById('ui-settings-tab');
    if (uiSettingsTab) {
        const settingsContainer = uiSettingsTab.querySelector('.max-w-lg');
        if (settingsContainer && !settingsContainer.innerHTML.trim()) {
            settingsContainer.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="block text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="dark-mode-toggle">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="flex items-center justify-between">
                    <span class="block text-sm font-medium text-gray-700 dark:text-gray-300">Auto-refresh Status</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="auto-refresh-toggle" checked>
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div>
                    <label for="refresh-interval" class="form-label">Refresh Interval (seconds)</label>
                    <select id="refresh-interval" class="form-select">
                        <option value="1">1 second</option>
                        <option value="2">2 seconds</option>
                        <option value="5" selected>5 seconds</option>
                        <option value="10">10 seconds</option>
                        <option value="30">30 seconds</option>
                    </select>
                </div>
                
                <div class="flex justify-end pt-4">
                    <button id="save-ui-settings" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-opacity-90 focus:outline-none">
                        Save UI Settings
                    </button>
                </div>
            `;
            
            // Initialize dark mode toggle after adding the HTML
            setTimeout(initDarkModeToggle, 100);
        } else {
            // Content already exists, just initialize the toggle
            setTimeout(initDarkModeToggle, 100);
            
            // Update existing refresh interval select with new styling
            const refreshInterval = uiSettingsTab.querySelector('#refresh-interval');
            if (refreshInterval) {
                refreshInterval.className = 'form-select';
            }
            
            // Update any other input elements with the standardized classes
            uiSettingsTab.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="password"]').forEach(input => {
                input.className = 'form-input';
            });
            
            uiSettingsTab.querySelectorAll('label:not(.toggle-switch)').forEach(label => {
                label.className = 'form-label';
            });
        }
    }
}

// Export the function to allow calling it from console for debugging
window.initDarkModeToggle = initDarkModeToggle;
window.initSettingsTabs = initSettingsTabs;
window.initModeTabs = initModeTabs;

// Add a global diagnostic function to debug tab issues
window.debugSettingsTabs = function() {
    console.log("=== Settings Tabs Debug ===");
    
    // Check tab elements
    const tabs = document.querySelectorAll('.settings-tab');
    console.log(`Found ${tabs.length} tab elements:`);
    tabs.forEach((tab, i) => {
        const tabName = tab.getAttribute('data-settings-tab');
        const isActive = tab.classList.contains('border-secondary');
        console.log(`Tab ${i}: ${tabName} (${isActive ? 'active' : 'inactive'})`);
    });
    
    // Check panel elements
    const panels = document.querySelectorAll('.settings-panel');
    console.log(`Found ${panels.length} panel elements:`);
    panels.forEach((panel, i) => {
        const id = panel.id;
        const isVisible = !panel.classList.contains('hidden');
        console.log(`Panel ${i}: ${id} (${isVisible ? 'visible' : 'hidden'})`);
    });
    
    // Check localStorage
    const lastTab = localStorage.getItem('lastActiveSettingsTab');
    console.log(`Last active tab in localStorage: ${lastTab || 'none'}`);
    
    console.log("=== End Debug ===");
    
    // Try to fix any issues found
    if (tabs.length > 0 && panels.length > 0) {
        console.log("Attempting automatic fix...");
        // Force reinitialization
        initSettingsTabs();
    }
    
    return { 
        tabs: tabs.length, 
        panels: panels.length, 
        lastTab: lastTab
    };
};