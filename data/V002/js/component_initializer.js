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
    
    // Register with auto-refresh service instead
    import('./auto_refresh.js').then(module => {
        // UI components can register their refresh needs here
        console.log("UI components initialized, auto-refresh service available");
    }).catch(err => console.error("Failed to load auto-refresh service:", err));
    
    console.log("UI component initialization complete");
}

// Initialize power toggle functionality
function initializePowerToggle() {
    // This is now just a wrapper around the setupPowerToggle function in basic_control.js
    // to avoid duplicating the event listener setup logic
    if (typeof window.setupPowerToggle === 'function') {
        window.setupPowerToggle();
    } else {
        console.log("Deferring power toggle setup to basic_control.js");
        // Will be handled by basic_control.js when it loads
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
