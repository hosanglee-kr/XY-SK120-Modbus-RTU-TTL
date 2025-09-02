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
    document.querySelectorAll('.mode-tab, [data-mode]').forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab styling
            document.querySelectorAll('[data-mode]').forEach(t => {
                t.classList.remove('text-blue-600', 'border-blue-500', 'dark:text-blue-300', 'dark:border-blue-400');
                t.classList.add('text-gray-700', 'border-transparent', 'dark:text-white');
            });
            
            // Get the mode from data attribute
            const mode = this.getAttribute('data-mode');
            this.classList.remove('text-gray-700', 'border-transparent', 'dark:text-white');
            this.classList.add('text-blue-600', 'border-blue-500', 'dark:text-blue-300', 'dark:border-blue-400');
            
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
}

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
        
        // Dispatch theme changed event
        document.dispatchEvent(new CustomEvent('theme-changed', {
            detail: { theme: this.checked ? 'dark' : 'light' }
        }));
    });
}

// Update setupLogsToggle function to create a better WebSocket logs UI
function setupLogsToggle() {
    // Check if the UI settings tab exists
    const uiSettingsTab = document.getElementById('ui-settings-tab');
    if (uiSettingsTab) {
        const settingsContainer = uiSettingsTab.querySelector('.max-w-lg');
        if (settingsContainer) {
            // Look for the logs toggle
            const showLogsToggle = document.getElementById('show-logs-toggle');
            if (showLogsToggle) {
                // Add event listener for the logs toggle
                showLogsToggle.addEventListener('change', function() {
                    // If toggle is switched on, show logs
                    if (this.checked) {
                        toggleLogViewer(true);
                    } else {
                        toggleLogViewer(false);
                    }
                });
            }
            
            // Add open logs button
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
            }
            
            // Add event listener for the open logs button
            setTimeout(() => {
                const openLogsBtn = document.getElementById('open-logs-btn');
                if (openLogsBtn) {
                    openLogsBtn.addEventListener('click', function() {
                        toggleLogViewer(true);
                        console.log("Log viewer opened from settings");
                    });
                }
            }, 100);
        }
    }
    
    // Initialize log viewer
    setupLogViewer();
}

// Add function to toggle log viewer
window.toggleLogViewer = function(show) {
    const logViewer = document.getElementById('log-viewer-overlay');
    if (!logViewer) return;
    
    if (show) {
        logViewer.classList.add('active');
    } else {
        logViewer.classList.remove('active');
    }
    
    // Store preference in localStorage
    localStorage.setItem('showLogs', show ? 'true' : 'false');
};

// Add function to setup log viewer
window.setupLogViewer = function() {
    const logViewer = document.getElementById('log-viewer-overlay');
    const logs = document.getElementById('logs');
    
    if (!logViewer || !logs) {
        console.error("Log viewer elements not found");
        return;
    }
    
    // Set up log viewer controls
    const closeBtn = document.getElementById('log-close');
    const clearBtn = document.getElementById('log-clear');
    const pauseBtn = document.getElementById('log-pause');
    const resumeBtn = document.getElementById('log-resume');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            toggleLogViewer(false);
            // Also update the UI toggle if it exists
            const showLogsToggle = document.getElementById('show-logs-toggle');
            if (showLogsToggle) {
                showLogsToggle.checked = false;
            }
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            logs.innerHTML = '';
        });
    }
    
    if (pauseBtn && resumeBtn) {
        pauseBtn.addEventListener('click', function() {
            window.logsPaused = true;
            pauseBtn.classList.add('hidden');
            resumeBtn.classList.remove('hidden');
        });
        
        resumeBtn.addEventListener('click', function() {
            window.logsPaused = false;
            resumeBtn.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
        });
    }
    
    // Check localStorage for previous state
    const showLogs = localStorage.getItem('showLogs') === 'true';
    if (showLogs) {
        toggleLogViewer(true);
        // Also update the UI toggle if it exists
        const showLogsToggle = document.getElementById('show-logs-toggle');
        if (showLogsToggle) {
            showLogsToggle.checked = true;
        }
    }
};

// Populate settings tabs with content if they're empty
function populateSettingsTabs() {
    // ...existing code...
}

// Add a global function to apply the theme from localStorage (called on page load)
window.applyThemeFromStorage = function() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply the appropriate theme
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#111827');
    } else {
        document.documentElement.classList.remove('dark');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff');
    }
    
    // Update any toggle elements
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.checked = document.documentElement.classList.contains('dark');
    }
    
    console.log("Theme applied from storage:", document.documentElement.classList.contains('dark') ? 'dark' : 'light');
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