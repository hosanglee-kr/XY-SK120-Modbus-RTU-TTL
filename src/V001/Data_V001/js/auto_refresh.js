/**
 * Auto Refresh Service
 * Centralized management of auto-refresh functionality
 */

// Store all refresh tasks
const refreshTasks = new Map();

// Global refresh timer
let globalRefreshTimer = null;

/**
 * Register a new auto-refresh task
 * @param {string} id - Unique identifier for the task
 * @param {Function} callback - Function to execute on refresh
 * @param {number} [priority=0] - Priority level (higher numbers run first)
 */
export function registerRefreshTask(id, callback, priority = 0) {
    refreshTasks.set(id, { callback, priority, enabled: true });
    console.log(`Registered refresh task: ${id}`);
}

/**
 * Start the auto-refresh service
 * @param {number} [interval=5000] - Refresh interval in milliseconds
 */
export function startAutoRefresh(interval = 5000) {
    if (globalRefreshTimer) {
        console.log("Auto-refresh already running");
        return;
    }

    console.log("Starting auto-refresh service");
    
    // Initial refresh
    executeRefreshTasks();
    
    // Set up periodic refresh
    globalRefreshTimer = setInterval(executeRefreshTasks, interval);
    
    // Update UI indicator if exists
    updateRefreshIndicator(true);
}

/**
 * Stop the auto-refresh service
 */
export function stopAutoRefresh() {
    if (globalRefreshTimer) {
        clearInterval(globalRefreshTimer);
        globalRefreshTimer = null;
        console.log("Auto-refresh service stopped");
        
        // Update UI indicator
        updateRefreshIndicator(false);
    }
}

/**
 * Enable/disable specific refresh task
 * @param {string} id - Task identifier
 * @param {boolean} enabled - Enable/disable flag
 */
export function setTaskEnabled(id, enabled) {
    const task = refreshTasks.get(id);
    if (task) {
        task.enabled = enabled;
        console.log(`${id} refresh task ${enabled ? 'enabled' : 'disabled'}`);
    }
}

/**
 * Execute all registered refresh tasks
 */
function executeRefreshTasks() {
    if (!window.websocketConnected) {
        console.log("WebSocket disconnected, pausing refresh tasks");
        stopAutoRefresh();
        return;
    }

    // Sort tasks by priority and execute
    Array.from(refreshTasks.entries())
        .filter(([_, task]) => task.enabled)
        .sort((a, b) => b[1].priority - a[1].priority)
        .forEach(([id, task]) => {
            try {
                task.callback();
            } catch (error) {
                console.error(`Error in refresh task ${id}:`, error);
            }
        });
}

/**
 * Update refresh indicator in UI
 */
function updateRefreshIndicator(active) {
    const indicator = document.querySelector('.auto-refresh-indicator');
    if (indicator) {
        indicator.style.display = active ? 'flex' : 'none';
        
        // Update pulse animation
        const dot = indicator.querySelector('.dot');
        if (dot) {
            dot.classList.toggle('pulse', active);
        }
    }
}

// Make functions available globally
window.autoRefreshService = {
    register: registerRefreshTask,
    start: startAutoRefresh,
    stop: stopAutoRefresh,
    setTaskEnabled
};
