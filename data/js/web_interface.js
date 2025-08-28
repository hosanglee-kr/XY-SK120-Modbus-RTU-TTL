/**
 * Web interface functionality for XY-SK120
 * Interfaces with web_interface.cpp backend firmware
 */

// Define placeholder functions that will be replaced when the module is loaded
let updateHeartbeatSpeed = function(interval) {
    console.log("Placeholder updateHeartbeatSpeed called with interval:", interval);
};

let toggleHeartbeatIndicator = function(visible) {
    console.log("Placeholder toggleHeartbeatIndicator called with visible:", visible);
};

// IMPORTANT: DO NOT declare autoRefreshTimer here - use the global instance
// Reference the global timer variable instead
window.autoRefreshTimer = window.autoRefreshTimer || null;

// Use dynamic import to get the actual implementations
document.addEventListener('DOMContentLoaded', function() {
    // Import status module
    import('./status.js')
        .then(module => {
            // Replace placeholder functions with actual implementations
            updateHeartbeatSpeed = module.updateHeartbeatSpeed;
            toggleHeartbeatIndicator = module.toggleHeartbeatIndicator;
            
            // Initialize the heartbeat with the current refresh interval
            const currentInterval = parseInt(localStorage.getItem('refreshInterval')) || 5000;
            if (typeof updateHeartbeatSpeed === 'function') {
                updateHeartbeatSpeed(currentInterval);
            }
            
            console.log("Successfully imported status.js functions");
        })
        .catch(err => console.error('Error importing status.js:', err));
    
    // Import card swiper module
    import('./card-swiper.js')
        .then(module => {
            console.log("Successfully imported card-swiper.js");
            // CardSwiper is exported as a global object so no need to do anything here
        })
        .catch(err => console.error('Error importing card-swiper.js:', err));
    
    // Update the heartbeat speed when the refresh interval changes
    const refreshIntervalSelector = document.getElementById('refresh-interval');
    if (refreshIntervalSelector) {
        refreshIntervalSelector.addEventListener('change', function() {
            const interval = parseInt(this.value) * 1000;
            
            // Update the heartbeat animation speed immediately
            if (typeof updateHeartbeatSpeed === 'function') {
                updateHeartbeatSpeed(interval);
            }
            
            // The rest of the interval change handling is likely already in your code
        });
    }
});

/**
 * Start auto-refresh
 */
function startAutoRefresh() {
    // This function is incomplete and likely unused
    // The implementation in auto_refresh.js and core.js has taken precedence
    console.log(`Auto-refresh started with interval ${interval}ms`);
    // Missing implementation - no interval is set
}

/**
 * Stop auto-refresh
 */
function stopAutoRefresh() {
    if (window.autoRefreshTimer) {
        clearInterval(window.autoRefreshTimer);
        window.autoRefreshTimer = null;
        
        // Hide the heartbeat indicator - check if function is available
        if (typeof toggleHeartbeatIndicator === 'function') {
            toggleHeartbeatIndicator(false);
        }
        
        updateHeartbeatIndicator(false);
        
        console.log('Auto-refresh stopped');
    }
}

/**
 * Update the heartbeat indicator visibility
 */
function updateHeartbeatIndicator(active = true) {
    const heartbeatIndicator = document.getElementById('heartbeat-indicator');
    const heartbeatDot = heartbeatIndicator ? heartbeatIndicator.querySelector('.dot') : null;
    
    if (!heartbeatIndicator || !heartbeatDot) {
        console.error("Auto-refresh indicator elements not found");
        return;
    }
    
    if (active) {
        // Make sure it has the auto-refresh-indicator class
        heartbeatIndicator.classList.add('auto-refresh-indicator');
        
        // Add animation by toggling opacity
        heartbeatDot.style.animation = 'pulse 1.5s infinite';
        heartbeatIndicator.style.opacity = '1';
    } else {
        // Remove animation when not active
        heartbeatDot.style.animation = 'none';
        heartbeatIndicator.style.opacity = '0.5';
    }
}

// Export functions for external use
window.startAutoRefresh = startAutoRefresh;
window.stopAutoRefresh = stopAutoRefresh;