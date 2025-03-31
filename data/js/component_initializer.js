/**
 * Component Initializer
 * Ensures proper initialization of components after they're loaded
 */

// Wait for DOM Content Loaded first
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded - waiting for components to initialize");
    
    // Flag to track if we've already done the initialization
    window.componentsInitialized = false;
    
    // Set up the initialization sequence
    if (document.querySelector('[data-component]')) {
        document.addEventListener('components-loaded', initializeUIComponents);
    } else {
        // If there are no components to load, initialize directly
        setTimeout(initializeUIComponents, 100);
    }
});

// Initialize UI components
function initializeUIComponents() {
    // Prevent double initialization
    if (window.componentsInitialized) {
        console.log("Components already initialized - skipping");
        return;
    }
    
    console.log("Initializing UI components");
    window.componentsInitialized = true;
    
    // Initialize power toggle
    initializePowerToggle();
    
    // Initialize key lock toggle
    initializeKeyLockToggle();
    
    // Initialize auto-refresh last
    initializeAutoRefresh();
    
    console.log("UI component initialization complete");
}

// Initialize power toggle functionality
function initializePowerToggle() {
    const powerToggle = document.getElementById('power-toggle');
    if (powerToggle) {
        console.log("Power toggle found, setting up event listener");
        
        // Add the new event handler
        powerToggle.addEventListener('change', function() {
            console.log("Power toggle changed to:", this.checked);
            if (typeof togglePower === 'function') {
                togglePower(this.checked);
            } else {
                console.error("togglePower function not found");
            }
        });
    } else {
        console.warn("Power toggle element not found in DOM");
    }
}

// Initialize key lock toggle functionality
function initializeKeyLockToggle() {
    const keyLockToggle = document.getElementById('key-lock');
    if (keyLockToggle) {
        console.log("Key lock toggle found, setting up event listener");
        
        // Add the new event handler
        keyLockToggle.addEventListener('change', function() {
            console.log("Key lock toggle changed to:", this.checked);
            if (typeof toggleKeyLock === 'function') {
                toggleKeyLock(this.checked);
            } else {
                console.error("toggleKeyLock function not found");
            }
        });
    } else {
        console.warn("Key lock toggle element not found in DOM");
    }
}

// Initialize auto-refresh functionality
function initializeAutoRefresh() {
    console.log("Setting up auto-refresh");
    
    // More thorough check for auto-refresh function in global scope
    if (typeof window.startAutoRefresh === 'function') {
        console.log("Found global startAutoRefresh function");
        setTimeout(window.startAutoRefresh, 1000);
        return;
    }
    
    // Check if auto-refresh is already running (by checking the timer)
    if (window.autoRefreshTimer) {
        console.log("Auto-refresh timer already exists, no need to initialize");
        return;
    }
    
    console.log("Auto-refresh function not found in global scope, trying to load module");
    
    // Because modules might not support ES module exports, use script tag approach
    // for more reliable loading across browsers
    const scriptElement = document.createElement('script');
    scriptElement.src = 'js/auto_refresh.js';
    scriptElement.onload = function() {
        console.log("Auto-refresh script loaded successfully");
        if (typeof window.startAutoRefresh === 'function') {
            setTimeout(window.startAutoRefresh, 500);
        } else {
            console.error("startAutoRefresh function not found after script load");
            implementFallbackAutoRefresh();
        }
    };
    scriptElement.onerror = function() {
        console.error("Failed to load auto_refresh.js");
        fallbackToOtherModules();
    };
    
    document.head.appendChild(scriptElement);
    
    // Try other modules if the primary one fails
    function fallbackToOtherModules() {
        console.log("Trying to find auto-refresh in other modules");
        
        // Try to load from basic_control.js next
        Promise.all([
            import('./basic_control.js').catch(() => null),
            import('./web_interface.js').catch(() => null)
        ]).then(modules => {
            // Check each module for the startAutoRefresh function
            for (const module of modules) {
                if (module && typeof module.startAutoRefresh === 'function') {
                    window.startAutoRefresh = module.startAutoRefresh;
                    console.log("Auto-refresh function found in imported module");
                    setTimeout(window.startAutoRefresh, 500);
                    return;
                }
            }
            
            // If still not found, provide a basic implementation
            implementFallbackAutoRefresh();
        }).catch(error => {
            console.error("Failed to import modules:", error);
            implementFallbackAutoRefresh();
        });
    }
    
    // Fallback implementation if no module provides the function
    function implementFallbackAutoRefresh() {
        console.warn("Creating fallback auto-refresh implementation");
        
        window.startAutoRefresh = function() {
            console.log("Fallback auto-refresh started");
            
            if (window.autoRefreshTimer) {
                clearInterval(window.autoRefreshTimer);
            }
            
            window.autoRefreshTimer = setInterval(function() {
                console.log("Fallback auto-refresh tick");
                
                // Try each possible update function
                if (typeof window.updateAllStatus === 'function') {
                    window.updateAllStatus();
                } else if (typeof window.refreshPsuStatus === 'function') {
                    window.refreshPsuStatus();
                } else if (typeof window.requestPsuStatus === 'function') {
                    window.requestPsuStatus();
                } else if (window.sendCommand) {
                    window.sendCommand({ action: 'getStatus' });
                } else {
                    console.warn("No suitable update function found for auto-refresh");
                }
            }, 5000);
            
            // Define stop function as well
            window.stopAutoRefresh = function() {
                if (window.autoRefreshTimer) {
                    clearInterval(window.autoRefreshTimer);
                    window.autoRefreshTimer = null;
                    console.log("Fallback auto-refresh stopped");
                }
            };
            
            // Update UI indicator
            const indicator = document.getElementById('heartbeat-indicator');
            if (indicator) indicator.classList.remove('hidden');
        };
        
        // Start the fallback auto-refresh after a delay
        setTimeout(window.startAutoRefresh, 1500);
    }
}
