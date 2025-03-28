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

// Use dynamic import to get the actual implementations
document.addEventListener('DOMContentLoaded', function() {
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
});

document.addEventListener('DOMContentLoaded', function() {
    // Card swipe variables
    const cardContainer = document.querySelector('.card-container');
    const cards = document.querySelectorAll('.swipeable-card');
    const dots = document.querySelectorAll('.dot');
    let currentCardIndex = 0;
    
    // Flag to disable card swiping
    let preventSwipe = false;
    
    // Initialize based on screen width
    initializeCards();
    
    // Handle resize events
    window.addEventListener('resize', initializeCards);
    
    /**
     * Initialize cards based on screen width
     */
    function initializeCards() {
        const isMobile = window.innerWidth <= 640;
        
        if (isMobile) {
            // Initialize the card swiper
            setupCardSwiper();
            
            // Initialize the card states
            updateCards();
            updateDots();
        } else {
            // Desktop: show all cards
            resetToDesktopLayout();
        }
    }
    
    /**
     * Reset to desktop layout
     */
    function resetToDesktopLayout() {
        // Show all cards and remove animation classes
        cards.forEach(card => {
            card.classList.remove('active', 'next', 'previous');
            card.style.display = 'block';
            card.style.position = 'relative';
            card.style.transform = 'none';
            card.style.opacity = '1';
        });
        
        // Hide dots navigation
        const dotsContainer = document.querySelector('.dot-indicators');
        if (dotsContainer) {
            dotsContainer.style.display = 'none';
        }
    }
    
    /**
     * Set up the card swiper
     */
    function setupCardSwiper() {
        // Show dots navigation
        const dotsContainer = document.querySelector('.dot-indicators');
        if (dotsContainer) {
            dotsContainer.style.display = 'flex';
        }
        
        // Setup touch event handler for swipe
        if (cardContainer) {
            // Simple swipe detection
            let xDown = null;
            let yDown = null;
            
            cardContainer.addEventListener('touchstart', function(e) {
                if (preventSwipe) return;
                
                // Get initial touch position
                xDown = e.touches[0].clientX;
                yDown = e.touches[0].clientY;
            }, { passive: true });
            
            cardContainer.addEventListener('touchmove', function(e) {
                if (!xDown || !yDown || preventSwipe) return;
                
                const xUp = e.touches[0].clientX;
                const yUp = e.touches[0].clientY;
                
                // Calculate difference
                const xDiff = xDown - xUp;
                const yDiff = yDown - yUp;
                
                // Check if horizontal swipe (more horizontal than vertical)
                if (Math.abs(xDiff) > Math.abs(yDiff)) {
                    // Handle horizontal swipe
                    if (xDiff > 50) { // Swipe left
                        if (currentCardIndex < cards.length - 1) {
                            currentCardIndex++;
                            updateCards();
                            updateDots();
                        }
                    } else if (xDiff < -50) { // Swipe right
                        if (currentCardIndex > 0) {
                            currentCardIndex--;
                            updateCards();
                            updateDots();
                        }
                    }
                    
                    // Reset values
                    xDown = null;
                    yDown = null;
                }
            }, { passive: true });
            
            cardContainer.addEventListener('touchend', function() {
                // Reset values
                xDown = null;
                yDown = null;
            }, { passive: true });
        }
        
        // Add click event listeners to dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', function() {
                currentCardIndex = parseInt(this.getAttribute('data-index'));
                updateCards();
                updateDots();
            });
        });
        
        // Prevent swiping on interactive elements - apply to common interactive elements
        setupInteractiveElements();
    }
    
    /**
     * Set up interactive elements to prevent swiping
     */
    function setupInteractiveElements() {
        // Find all interactive elements
        const interactiveElements = document.querySelectorAll('button, input, select, .mode-tab, a, label, [role="button"], textarea, .tab');
        
        // Add the prevent swipe handler to each
        interactiveElements.forEach(el => {
            el.addEventListener('touchstart', disableCardSwipe);
            el.addEventListener('mousedown', disableCardSwipe);
            
            // Also prevent default to avoid any browser handling
            el.addEventListener('touchmove', function(e) {
                e.stopPropagation();
            }, { passive: false });
        });
        
        // Add the global document handlers to re-enable swiping
        document.addEventListener('touchend', enableCardSwipe);
        document.addEventListener('mouseup', enableCardSwipe);
    }
    
    /**
     * Disable card swiping - called when interactive element is touched
     */
    function disableCardSwipe(e) {
        // Stop event propagation completely
        e.stopPropagation();
        
        // Set the prevent swipe flag
        preventSwipe = true;
    }
    
    /**
     * Enable card swiping - called when touch ends
     */
    function enableCardSwipe() {
        // Wait a moment before re-enabling to avoid false triggers
        setTimeout(function() {
            preventSwipe = false;
        }, 100);
    }
    
    /**
     * Update the card classes based on current index
     */
    function updateCards() {
        cards.forEach((card, index) => {
            if (index === currentCardIndex) {
                card.classList.add('active');
                card.classList.remove('next', 'previous');
            } else if (index > currentCardIndex) {
                card.classList.add('next');
                card.classList.remove('active', 'previous');
            } else {
                card.classList.add('previous');
                card.classList.remove('active', 'next');
            }
        });
    }
    
    /**
     * Update dot indicators
     */
    function updateDots() {
        dots.forEach((dot, index) => {
            if (index === currentCardIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    // REMOVE the mode tab event listeners from web_interface.js which is causing conflicts
    // Mode tab switcher - special handling to prevent swipe
    /*
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.addEventListener('click', function(e) {
            // Ensure click doesn't trigger swipe
            e.stopPropagation();
            
            // Disable swipe temporarily
            preventSwipe = true;
            setTimeout(() => { preventSwipe = false; }, 300);
            
            // Get the mode from data attribute
            const mode = this.getAttribute('data-mode');
            
            // Select all mode tabs and remove active styling
            document.querySelectorAll('.mode-tab').forEach(t => {
                t.classList.remove('border-secondary', 'text-secondary');
                t.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            });
            
            // Add active styling to the clicked tab
            this.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            this.classList.add('border-secondary', 'text-secondary');
            
            // Hide all mode settings
            document.querySelectorAll('.mode-settings').forEach(panel => {
                panel.classList.add('hidden');
                panel.classList.remove('block');
            });
            
            // Show the selected mode settings
            const settingsPanel = document.getElementById(mode + '-settings');
            if (settingsPanel) {
                settingsPanel.classList.remove('hidden');
                settingsPanel.classList.add('block');
            }
        });
    });
    */

    // Expose API for other modules
    window.CardSwiper = {
        goToCard: function(index) {
            if (index >= 0 && index < cards.length) {
                currentCardIndex = index;
                updateCards();
                updateDots();
                return true;
            }
            return false;
        },
        
        getCurrentCardIndex: function() {
            return currentCardIndex;
        },
        
        getCardCount: function() {
            return cards.length;
        },
        
        next: function() {
            if (currentCardIndex < cards.length - 1) {
                currentCardIndex++;
                updateCards();
                updateDots();
                return true;
            }
            return false;
        },
        
        previous: function() {
            if (currentCardIndex > 0) {
                currentCardIndex--;
                updateCards();
                updateDots();
                return true;
            }
            return false;
        }
    };

    // Add method to disable conflicting tab handlers
    window.CardSwiper.disableTabHandlers = function() {
        // This is a placeholder function that can be called from index.html
        // to ensure no conflicting handlers are running
        console.log("Disabling conflicting tab handlers");
    };

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
    
    // Initialize the heartbeat with the current refresh interval
    const currentInterval = parseInt(localStorage.getItem('refreshInterval')) || 5000;
    if (typeof updateHeartbeatSpeed === 'function') {
        updateHeartbeatSpeed(currentInterval);
    }
});

/**
 * Start auto-refresh
 */
function startAutoRefresh() {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
    }
    
    // Get the refresh interval from settings, or use default (5000ms)
    const interval = parseInt(localStorage.getItem('refreshInterval')) || 5000;
    
    // Update the heartbeat animation speed - check if function is available
    if (typeof updateHeartbeatSpeed === 'function') {
        updateHeartbeatSpeed(interval);
    }
    
    // Show the heartbeat indicator - check if function is available
    if (typeof toggleHeartbeatIndicator === 'function') {
        toggleHeartbeatIndicator(true);
    }
    
    // Start the auto-refresh timer
    autoRefreshTimer = setInterval(() => {
        updateAllStatus();
    }, interval);
    
    console.log(`Auto-refresh started with interval ${interval}ms`);
}

/**
 * Stop auto-refresh
 */
function stopAutoRefresh() {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
        
        // Hide the heartbeat indicator - check if function is available
        if (typeof toggleHeartbeatIndicator === 'function') {
            toggleHeartbeatIndicator(false);
        }
        
        console.log('Auto-refresh stopped');
    }
}