/**
 * Auto Refresh Module
 * Handles periodic refreshing of power supply data
 */

// Make sure to define functions immediately in the global scope
// AVOID REDECLARING GLOBAL VARIABLES
window.autoRefreshInterval = window.autoRefreshInterval || 5000;

// Check if variable already exists before declaring
if (typeof window.autoRefreshTimer === 'undefined') {
    window.autoRefreshTimer = null;
}

// Define the auto-refresh function in the global scope immediately
window.startAutoRefresh = function() {
    // Check if auto-refresh is already running
    if (window.autoRefreshTimer) {
        console.log("Auto-refresh already running");
        return;
    }
    
    // Get the refresh interval from localStorage or use default
    const savedInterval = localStorage.getItem('refreshInterval');
    if (savedInterval) {
        window.autoRefreshInterval = parseInt(savedInterval);
    }
    
    console.log(`Starting auto-refresh with interval ${window.autoRefreshInterval}ms`);
    
    // Update the heartbeat indicator
    const heartbeatIndicator = document.getElementById('heartbeat-indicator');
    if (heartbeatIndicator) {
        heartbeatIndicator.classList.remove('hidden');
        
        // Add pulse animation to the dot
        const dot = heartbeatIndicator.querySelector('.dot');
        if (dot) {
            dot.classList.add('pulse');
        }
    }
    
    // Start the auto-refresh timer - USE GLOBAL VARIABLE
    window.autoRefreshTimer = setInterval(() => {
        // Call the update function if it exists
        if (typeof window.updateAllStatus === 'function') {
            window.updateAllStatus();
        } else {
            console.warn("updateAllStatus function not available for auto-refresh");
        }
    }, window.autoRefreshInterval);
};

// Define the stop function also in the global scope
window.stopAutoRefresh = function() {
    if (window.autoRefreshTimer) {
        console.log("Stopping auto-refresh");
        clearInterval(window.autoRefreshTimer);
        window.autoRefreshTimer = null;
        
        // Update the heartbeat indicator
        const heartbeatIndicator = document.getElementById('heartbeat-indicator');
        if (heartbeatIndicator) {
            heartbeatIndicator.classList.add('hidden');
            
            // Remove pulse animation
            const dot = heartbeatIndicator.querySelector('.dot');
            if (dot) {
                dot.classList.remove('pulse');
            }
        }
    }
};

// Define the update interval function
window.updateRefreshInterval = function(interval) {
    if (!interval || isNaN(interval)) return;
    
    // Convert to milliseconds if it's in seconds
    const msInterval = interval < 100 ? interval * 1000 : interval;
    window.autoRefreshInterval = msInterval;
    
    // Store in localStorage
    localStorage.setItem('refreshInterval', msInterval);
    
    // Restart auto-refresh if it's running
    if (window.autoRefreshTimer) {
        window.stopAutoRefresh();
        window.startAutoRefresh();
    }
    
    console.log(`Auto-refresh interval updated to ${msInterval}ms`);
};

console.log("Auto-refresh functions defined and available globally");

// DOM ready handler - set up UI interactions
document.addEventListener('DOMContentLoaded', function() {
    console.log("Setting up auto-refresh UI interactions");
    
    // Setup auto-refresh toggle
    const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
    if (autoRefreshToggle) {
        // Clean any existing event listeners
        const newToggle = autoRefreshToggle.cloneNode(true);
        if (autoRefreshToggle.parentNode) {
            autoRefreshToggle.parentNode.replaceChild(newToggle, autoRefreshToggle);
        }
        
        // Add fresh event listener
        newToggle.addEventListener('change', function() {
            if (this.checked) {
                window.startAutoRefresh();
            } else {
                window.stopAutoRefresh();
            }
        });
    }
    
    // Start auto-refresh when appropriate
    const uiConfig = localStorage.getItem('uiConfig');
    let shouldAutoRefresh = true;
    
    try {
        if (uiConfig) {
            const config = JSON.parse(uiConfig);
            shouldAutoRefresh = config.autoRefresh !== false;
        }
    } catch (e) {
        console.error("Error parsing UI config:", e);
    }
    
    if (shouldAutoRefresh) {
        // Wait for components if needed
        if (document.querySelector('[data-component]')) {
            console.log("Waiting for components before starting auto-refresh");
            document.addEventListener('components-loaded', function() {
                setTimeout(window.startAutoRefresh, 500);
            });
        } else {
            setTimeout(window.startAutoRefresh, 500);
        }
    }
});
