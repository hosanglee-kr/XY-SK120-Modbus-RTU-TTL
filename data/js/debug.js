/**
 * Debug utility script for XY-SK120
 * Used to diagnose UI interaction issues
 */

(function() {
    console.log('Debug script loaded');
    
    /**
     * Check for DOM elements with duplicate IDs
     */
    function checkDuplicateIds() {
        const allElements = document.querySelectorAll('[id]');
        const idMap = {};
        
        let duplicatesFound = false;
        
        allElements.forEach(element => {
            const id = element.id;
            if (idMap[id]) {
                console.error(`Duplicate ID found: "${id}"`);
                console.log('First element:', idMap[id]);
                console.log('Duplicate element:', element);
                duplicatesFound = true;
            } else {
                idMap[id] = element;
            }
        });
        
        if (!duplicatesFound) {
            console.log('No duplicate IDs found');
        }
        
        return !duplicatesFound;
    }
    
    /**
     * Verify all tab panels exist
     */
    function verifyTabPanels() {
        console.log('Verifying tab panels...');
        
        // Check operating mode panels
        const modes = ['cv', 'cc', 'cp'];
        let allPanelsFound = true;
        
        modes.forEach(mode => {
            const panelId = `${mode}-settings`;
            const panel = document.getElementById(panelId);
            
            if (panel) {
                console.log(`Found panel: ${panelId}`);
            } else {
                console.error(`Missing panel: ${panelId}`);
                allPanelsFound = false;
            }
        });
        
        return allPanelsFound;
    }
    
    /**
     * Monitor tab clicks for proper panel display
     */
    function monitorTabClicks() {
        document.querySelectorAll('.mode-tab').forEach(tab => {
            const originalClickHandler = tab.onclick;
            
            tab.onclick = function(e) {
                const mode = this.getAttribute('data-mode');
                console.log(`Tab clicked: ${mode}`);
                
                // Call the original click handler
                if (originalClickHandler) {
                    originalClickHandler.call(this, e);
                }
                
                // Check if the panel is visible after the handler
                setTimeout(() => {
                    const panel = document.getElementById(`${mode}-settings`);
                    if (panel) {
                        const isVisible = !panel.classList.contains('hidden');
                        console.log(`Panel ${mode}-settings visible: ${isVisible}`);
                        
                        if (!isVisible) {
                            console.error(`Panel should be visible but is not!`);
                            console.log('Panel classes:', panel.className);
                        }
                    }
                }, 10);
            };
        });
    }
    
    // Run diagnostics when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Running UI diagnostics...');
        
        const noDuplicateIds = checkDuplicateIds();
        const allPanelsExist = verifyTabPanels();
        
        if (noDuplicateIds && allPanelsExist) {
            console.log('Basic DOM structure looks good');
            monitorTabClicks();
        } else {
            console.error('DOM structure issues detected');
        }
    });
})();
