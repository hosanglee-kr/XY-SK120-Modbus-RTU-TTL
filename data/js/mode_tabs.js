/**
 * Mode Tabs Functionality
 * Handles switching between operating modes
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get all mode tabs
    const modeTabs = document.querySelectorAll('[data-mode]');
    const tabContents = {
        cv: document.getElementById('cv-settings'),
        cc: document.getElementById('cc-settings'),
        cp: document.getElementById('cp-settings')
    };
    
    // Set initial active tab (default to CV)
    let activeMode = 'cv';
    
    // Tab click handler
    modeTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const mode = this.getAttribute('data-mode');
            
            // Skip if this tab is already active
            if (mode === activeMode) return;
            
            // Update tabs visual state with Tailwind classes
            modeTabs.forEach(tab => {
                const tabMode = tab.getAttribute('data-mode');
                // Remove active state
                tab.classList.remove('border-voltage', 'border-current', 'border-power');
                tab.classList.remove('text-voltage', 'text-current', 'text-power');
                
                // Set hover state
                tab.classList.add('border-transparent', 'hover:border-gray-400', 'dark:hover:border-gray-500');
            });
            
            // Add active state to clicked tab with theme colors
            if (mode === 'cv') {
                this.classList.add('border-voltage', 'text-voltage');
            } else if (mode === 'cc') {
                this.classList.add('border-current', 'text-current');
            } else if (mode === 'cp') {
                this.classList.add('border-power', 'text-power');
            }
            this.classList.remove('border-transparent');
            
            // Show the selected tab content
            Object.keys(tabContents).forEach(tabId => {
                if (tabId === mode) {
                    tabContents[tabId].classList.remove('hidden');
                } else {
                    tabContents[tabId].classList.add('hidden');
                }
            });
            
            // Update active mode
            activeMode = mode;
        });
    });
    
    // Initialize: Set first tab as active
    if (modeTabs.length > 0) {
        const firstTab = modeTabs[0];
        const mode = firstTab.getAttribute('data-mode');
        
        // Set active state
        if (mode === 'cv') {
            firstTab.classList.add('border-voltage', 'text-voltage');
        } else if (mode === 'cc') {
            firstTab.classList.add('border-current', 'text-current');
        } else if (mode === 'cp') {
            firstTab.classList.add('border-power', 'text-power');
        }
        firstTab.classList.remove('border-transparent');
        
        // Show the first tab content
        if (tabContents[mode]) {
            tabContents[mode].classList.remove('hidden');
        }
        
        // Set active mode
        activeMode = mode;
    }
});
