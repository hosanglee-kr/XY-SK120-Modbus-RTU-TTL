/**
 * Auto Refresh Module
 * Handles periodic data updates and visual indicators
 */

// Global auto-refresh timer reference
window.autoRefreshTimer = null;
let autoRefreshInterval = 1000; // Default 1 second

// Initialize auto-refresh when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auto-refresh module initialized');
    
    // Set default auto-refresh interval from settings if available
    if (localStorage.getItem('autoRefreshInterval')) {
        autoRefreshInterval = parseInt(localStorage.getItem('autoRefreshInterval'));
    }
    
    // Check if auto-refresh should be enabled
    const autoRefreshDisabled = localStorage.getItem('autoRefreshDisabled') === 'true';
    
    if (!autoRefreshDisabled) {
        startAutoRefresh();
    }
    
    // Initialize auto-refresh toggle in settings if it exists
    const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
    if (autoRefreshToggle) {
        autoRefreshToggle.checked = !autoRefreshDisabled;
        
        autoRefreshToggle.addEventListener('change', function() {
            if (this.checked) {
                localStorage.removeItem('autoRefreshDisabled');
                startAutoRefresh();
            } else {
                localStorage.setItem('autoRefreshDisabled', 'true');
                stopAutoRefresh();
            }
        });
    }
});

// Start auto-refresh timer
function startAutoRefresh() {
    if (window.autoRefreshTimer) {
        clearInterval(window.autoRefreshTimer);
    }
    
    window.autoRefreshTimer = setInterval(function() {
        refreshData();
        updateHeartbeatIndicator(true);
    }, autoRefreshInterval);
    
    console.log(`Auto-refresh started with interval: ${autoRefreshInterval}ms`);
    
    // Initialize indicator immediately
    updateHeartbeatIndicator(true);
}

// Stop auto-refresh timer
function stopAutoRefresh() {
    if (window.autoRefreshTimer) {
        clearInterval(window.autoRefreshTimer);
        window.autoRefreshTimer = null;
        console.log('Auto-refresh stopped');
    }
    
    // Update indicator to show stopped state
    updateHeartbeatIndicator(false);
}

// Update data from device
function refreshData() {
    if (typeof window.updateAllStatus === 'function') {
        window.updateAllStatus();
    } else {
        console.warn('updateAllStatus function not available');
    }
}

// Update the visual heartbeat indicator
function updateHeartbeatIndicator(active) {
    const indicator = document.getElementById('heartbeat-indicator');
    if (!indicator) return;
    
    const dotElement = indicator.querySelector('div');
    
    if (active) {
        // Use Tailwind's animate-pulse class instead of custom animation
        if (dotElement) {
            dotElement.classList.add('animate-pulse', 'bg-green-500');
            dotElement.classList.remove('bg-gray-400');
        }
    } else {
        // Show inactive state
        if (dotElement) {
            dotElement.classList.remove('animate-pulse', 'bg-green-500');
            dotElement.classList.add('bg-gray-400');
        }
    }
}

// Set auto-refresh interval (in milliseconds)
function setAutoRefreshInterval(interval) {
    if (interval >= 500) { // Minimum 500ms to prevent excessive requests
        autoRefreshInterval = interval;
        localStorage.setItem('autoRefreshInterval', interval.toString());
        
        // Restart timer if running
        if (window.autoRefreshTimer) {
            startAutoRefresh();
        }
        
        return true;
    }
    return false;
}

// Make functions available globally
window.startAutoRefresh = startAutoRefresh;
window.stopAutoRefresh = stopAutoRefresh;
window.setAutoRefreshInterval = setAutoRefreshInterval;
