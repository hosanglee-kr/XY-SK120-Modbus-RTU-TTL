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
    
    // Simple implementation that always works
    if (typeof window.startAutoRefresh === 'function') {
        setTimeout(window.startAutoRefresh, 1000);
    } else {
        console.warn("Auto-refresh function not available");
        
        // Provide a basic implementation
        window.startAutoRefresh = function() {
            console.log("Basic auto-refresh started");
            
            if (window.autoRefreshTimer) {
                clearInterval(window.autoRefreshTimer);
            }
            
            window.autoRefreshTimer = setInterval(function() {
                if (typeof window.updateAllStatus === 'function') {
                    window.updateAllStatus();
                }
            }, 5000);
            
            // Update UI
            const indicator = document.getElementById('heartbeat-indicator');
            if (indicator) indicator.classList.remove('hidden');
        };
        
        // Start it after a delay
        setTimeout(window.startAutoRefresh, 1500);
    }
}
