/**
 * Dedicated script for the settings tabs functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Settings tabs module loaded");
    
    // Settings tab switcher - independent implementation
    const settingTabs = document.querySelectorAll('.settings-tab');
    console.log("Found settings tabs:", settingTabs.length);
    
    // Fix empty settings tab content by populating them
    populateSettingsTabs();
    
    // Initialize dark mode toggle right away
    initDarkModeToggle();
    
    settingTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            console.log("Settings tab clicked:", this.getAttribute('data-settings-tab'));
            
            // Remove active class from all tabs
            settingTabs.forEach(t => {
                t.classList.remove('border-secondary', 'text-secondary');
                t.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            });
            
            // Add active class to clicked tab - use blue color consistently
            this.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            this.classList.add('border-secondary', 'text-secondary');
            
            // Get the tab name from data attribute
            const tabName = this.getAttribute('data-settings-tab');
            
            // Hide all tab content
            const tabContents = document.querySelectorAll('.settings-panel');
            tabContents.forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('block');
            });
            
            // Show the selected tab content
            const selectedTab = document.getElementById(`${tabName}-settings-tab`);
            if (selectedTab) {
                selectedTab.classList.remove('hidden');
                selectedTab.classList.add('block');
                console.log(`Displayed ${tabName} settings tab`);
            } else {
                console.error(`Tab content for ${tabName} not found`);
            }
            
            // Store the last active settings tab
            localStorage.setItem('lastActiveSettingsTab', tabName);
        });
    });
    
    // Restore the last active settings tab when page loads
    const lastActiveTab = localStorage.getItem('lastActiveSettingsTab') || 'wifi';
    console.log("Restoring last active settings tab:", lastActiveTab);
    
    const tabToActivate = document.querySelector(`.settings-tab[data-settings-tab="${lastActiveTab}"]`);
    if (tabToActivate) {
        // Simulate a click to restore state
        tabToActivate.click();
    } else {
        console.warn(`Last active settings tab ${lastActiveTab} not found`);
        // Activate the first tab as fallback
        const firstTab = document.querySelector('.settings-tab');
        if (firstTab) firstTab.click();
    }
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
                    <label for="refresh-interval" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Refresh Interval (seconds)</label>
                    <select id="refresh-interval" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-secondary focus:border-secondary">
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
        }
    }
}

// Export the function to allow calling it from console for debugging
window.initDarkModeToggle = initDarkModeToggle;
