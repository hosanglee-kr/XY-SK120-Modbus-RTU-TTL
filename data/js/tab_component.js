/**
 * Reusable Tab Component
 * Based on Meraki UI "Line with Icons" design
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Tab component module loaded");
    
    // Initialize all tab groups on the page
    initAllTabGroups();
    
    // Initialize dark mode toggle right away
    initDarkModeToggle();
    
    // Set up logs toggle if needed
    setupLogsToggle();
});

/**
 * Initialize all tab groups found on the page
 */
function initAllTabGroups() {
    // Find all tab container elements
    const tabContainers = document.querySelectorAll('[data-tabs]');
    
    tabContainers.forEach(container => {
        const groupId = container.getAttribute('data-tabs');
        initTabGroup(groupId);
    });
    
    // For backward compatibility, also initialize the old tab styles
    initLegacyTabs();
}

/**
 * Initialize a specific tab group by its identifier
 * @param {string} groupId - The identifier for the tab group
 */
function initTabGroup(groupId) {
    // Select all tabs in this group
    const tabs = document.querySelectorAll(`[data-tabs="${groupId}"] [role="tab"]`);
    
    if (!tabs.length) {
        console.warn(`No tabs found for group: ${groupId}`);
        return;
    }
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('aria-controls');
            const tabTarget = this.getAttribute('data-tab-target');
            
            // Deactivate all tabs in this group
            tabs.forEach(t => {
                t.setAttribute('aria-selected', 'false');
                t.classList.remove('text-blue-600', 'border-blue-500', 'dark:text-blue-300', 'dark:border-blue-400');
                t.classList.add('text-gray-700', 'border-transparent', 'dark:text-white');
            });
            
            // Activate this tab
            this.setAttribute('aria-selected', 'true');
            this.classList.remove('text-gray-700', 'border-transparent', 'dark:text-white');
            this.classList.add('text-blue-600', 'border-blue-500', 'dark:text-blue-300', 'dark:border-blue-400');
            
            // Hide all tab panels in this group
            const panels = document.querySelectorAll(`[data-tabs="${groupId}"] [role="tabpanel"]`);
            panels.forEach(panel => {
                panel.classList.add('hidden');
                panel.setAttribute('aria-hidden', 'true');
            });
            
            // Show the target panel
            if (tabId) {
                const targetPanel = document.getElementById(tabId);
                if (targetPanel) {
                    targetPanel.classList.remove('hidden');
                    targetPanel.setAttribute('aria-hidden', 'false');
                }
            } else if (tabTarget) {
                const targetPanel = document.getElementById(tabTarget);
                if (targetPanel) {
                    targetPanel.classList.remove('hidden');
                    targetPanel.setAttribute('aria-hidden', 'false');
                }
            }
            
            // Store the last active tab for this group
            localStorage.setItem(`lastActiveTab-${groupId}`, this.getAttribute('id'));
        });
    });
    
    // Restore the last active tab or activate the first tab
    const lastActiveTabId = localStorage.getItem(`lastActiveTab-${groupId}`);
    let tabToActivate;
    
    if (lastActiveTabId) {
        tabToActivate = document.getElementById(lastActiveTabId);
    }
    
    if (!tabToActivate) {
        // If no saved tab or the saved tab doesn't exist anymore, activate the first tab
        tabToActivate = tabs[0];
    }
    
    if (tabToActivate) {
        tabToActivate.click();
    }
}

/**
 * Initialize legacy tab systems for backward compatibility
 */
function initLegacyTabs() {
    // Initialize settings tabs (old style)
    initSettingsTabs();
    
    // Initialize mode tabs (old style)
    initModeTabs();
}

// Initialize tabs functionality (legacy method)
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

// Initialize mode tabs functionality (legacy method)
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

// Function to initialize dark mode toggle with the proper event listener
function initDarkModeToggle() {
    // ...existing code...
}

// Update setupLogsToggle function to create a better WebSocket logs UI
function setupLogsToggle() {
    // ...existing code...
}

// Populate settings tabs with content if they're empty
function populateSettingsTabs() {
    // ...existing code...
}

// Add a global function to apply the theme from localStorage (called on page load)
window.applyThemeFromStorage = function() {
    // ...existing code...
};

// Call the function to apply theme when the script loads
window.applyThemeFromStorage();

// Export the function to allow calling it from console for debugging
window.initTabGroup = initTabGroup;
window.initAllTabGroups = initAllTabGroups;
window.initSettingsTabs = initSettingsTabs;
window.initModeTabs = initModeTabs;
window.initDarkModeToggle = initDarkModeToggle;

/**
 * Helper function to create a tab structure
 * @param {string} containerId - ID for the tab container
 * @param {string} groupId - Group identifier for the tabs
 * @param {Array} tabs - Array of tab objects with id, label, icon, and panelId properties
 * @returns {string} HTML markup for the tab structure
 */
window.createTabGroup = function(containerId, groupId, tabs) {
    // Generate a unique ID for the tablist
    const tablistId = `tablist-${groupId}`;
    
    // Start building the HTML markup
    let html = `
    <div id="${containerId}" data-tabs="${groupId}">
        <div class="flex overflow-x-auto overflow-y-hidden border-b border-gray-200 whitespace-nowrap dark:border-gray-700" role="tablist" id="${tablistId}" aria-label="${groupId} tabs">
    `;
    
    // Add each tab button - now with better responsive styling
    tabs.forEach((tab, index) => {
        const isFirst = index === 0;
        html += `
            <button id="${tab.id}" role="tab" aria-selected="${isFirst ? 'true' : 'false'}" 
                aria-controls="${tab.panelId}" 
                class="inline-flex items-center h-10 px-2 py-2 -mb-px text-center ${isFirst ? 
                    'text-blue-600 bg-transparent border-b-2 border-blue-500 dark:border-blue-400 dark:text-blue-300' : 
                    'text-gray-700 bg-transparent border-b-2 border-transparent dark:text-white'} sm:px-4 whitespace-nowrap focus:outline-none hover:border-gray-400" 
                tabindex="${isFirst ? '0' : '-1'}">
                ${tab.icon.replace('sm:w-5 sm:h-5', 'sm:w-6 sm:h-6')}
                <span class="mx-1 text-sm sm:text-base">
                    ${tab.label}
                </span>
            </button>
        `;
    });
    
    // Close the tablist
    html += `
        </div>
    `;
    
    // Add each tab panel
    tabs.forEach((tab, index) => {
        const isFirst = index === 0;
        html += `
        <div id="${tab.panelId}" role="tabpanel" aria-labelledby="${tab.id}" 
             class="${isFirst ? '' : 'hidden'} p-4" 
             tabindex="0" aria-hidden="${isFirst ? 'false' : 'true'}">
            <!-- Tab content for ${tab.label} will be inserted here -->
        </div>
        `;
    });
    
    // Close the container
    html += `
    </div>
    `;
    
    return html;
};