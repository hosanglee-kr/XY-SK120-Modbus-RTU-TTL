/**
 * Tab Component
 * Handles tab switching with Tailwind CSS classes
 */

document.addEventListener('DOMContentLoaded', function() {
    // Find all tab containers
    const tabContainers = document.querySelectorAll('[data-tabs]');
    
    tabContainers.forEach(container => {
        const name = container.getAttribute('data-tabs');
        const tablist = container.querySelector('[role="tablist"]');
        
        if (!tablist) return;
        
        const tabs = tablist.querySelectorAll('[role="tab"]');
        
        // Set up click listeners for each tab
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Get the target panel ID
                const targetId = tab.getAttribute('aria-controls');
                const targetPanel = document.getElementById(targetId);
                
                if (!targetPanel) return;
                
                // Deactivate all tabs
                tabs.forEach(t => {
                    // Remove active styling
                    t.setAttribute('aria-selected', 'false');
                    t.classList.remove('text-blue-600', 'border-secondary', 'dark:text-blue-300', 'dark:border-blue-400');
                    t.classList.add('text-gray-700', 'dark:text-white', 'border-transparent', 'hover:border-gray-400', 'dark:hover:border-gray-500');
                });
                
                // Activate current tab
                tab.setAttribute('aria-selected', 'true');
                tab.classList.remove('text-gray-700', 'dark:text-white', 'border-transparent', 'hover:border-gray-400', 'dark:hover:border-gray-500');
                tab.classList.add('text-blue-600', 'border-secondary', 'dark:text-blue-300', 'dark:border-blue-400');
                
                // Hide all tab panels
                const allPanels = container.querySelectorAll('[role="tabpanel"]');
                allPanels.forEach(panel => {
                    panel.classList.add('hidden');
                    panel.setAttribute('aria-hidden', 'true');
                });
                
                // Show the target panel
                targetPanel.classList.remove('hidden');
                targetPanel.setAttribute('aria-hidden', 'false');
                
                // Dispatch a custom event for the tab change
                const tabChangeEvent = new CustomEvent('tab-changed', {
                    detail: {
                        tab: tab,
                        panel: targetPanel,
                        tabsName: name
                    }
                });
                
                document.dispatchEvent(tabChangeEvent);
            });
            
            // Add keyboard navigation
            tab.addEventListener('keydown', (e) => {
                // Handle keyboard navigation
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    
                    const tabsArray = Array.from(tabs);
                    const currentIndex = tabsArray.indexOf(tab);
                    let newIndex;
                    
                    if (e.key === 'ArrowLeft') {
                        newIndex = currentIndex > 0 ? currentIndex - 1 : tabsArray.length - 1;
                    } else {
                        newIndex = currentIndex < tabsArray.length - 1 ? currentIndex + 1 : 0;
                    }
                    
                    tabsArray[newIndex].focus();
                    tabsArray[newIndex].click();
                }
            });
        });
        
        // Activate the first tab by default, or the one marked as selected
        const defaultTab = Array.from(tabs).find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0];
        if (defaultTab) {
            defaultTab.click();
        }
    });
});