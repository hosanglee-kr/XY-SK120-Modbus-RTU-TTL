/**
 * This file provides an additional layer of card navigation fixing that runs
 * after all other scripts have loaded, to ensure card navigation works even if
 * other scripts interfere with it.
 */

// Wait for page to fully load
window.addEventListener('load', function() {
    console.log("Running card-fix.js to enforce card visibility...");
    
    setTimeout(function() {
        // Get all tabs and cards
        const tabs = document.querySelectorAll('.card-tab');
        const cards = document.querySelectorAll('.card');
        
        // Function to properly switch to a card
        function forceCardSwitch(tabElement) {
            const targetId = tabElement.getAttribute('data-target');
            console.log(`Forcing switch to card: ${targetId}`);
            
            // First hide all cards
            cards.forEach(card => {
                card.style.display = 'none';
                card.classList.add('hidden');
            });
            
            // Show only the target card
            const targetCard = document.getElementById(targetId);
            if (targetCard) {
                targetCard.style.display = 'block';
                targetCard.classList.remove('hidden');
            }
            
            // Update active tab styles
            tabs.forEach(tab => {
                if (tab === tabElement) {
                    tab.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
                    tab.classList.add('border-secondary', 'text-primary', 'dark:text-white');
                } else {
                    tab.classList.remove('border-secondary', 'text-primary', 'dark:text-white');
                    tab.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
                }
            });
        }
        
        // Add guaranteed click handlers to each tab
        tabs.forEach(tab => {
            // Remove existing event listeners by cloning
            const newTab = tab.cloneNode(true);
            if (tab.parentNode) {
                tab.parentNode.replaceChild(newTab, tab);
            }
            
            // Add new click handler
            newTab.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                forceCardSwitch(this);
            });
        });
        
        // Add keyboard navigation support
        document.addEventListener('keydown', function(e) {
            // If arrow keys are pressed and we're in mobile mode
            if (window.innerWidth < 768) {
                const activeTab = document.querySelector('.card-tab.border-secondary');
                if (activeTab) {
                    const activeTabs = Array.from(tabs);
                    const currentIndex = activeTabs.indexOf(activeTab);
                    
                    if (e.key === 'ArrowRight' && currentIndex < activeTabs.length - 1) {
                        // Navigate to next tab
                        forceCardSwitch(activeTabs[currentIndex + 1]);
                    } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                        // Navigate to previous tab
                        forceCardSwitch(activeTabs[currentIndex - 1]);
                    }
                }
            }
        });
        
        // Initialize based on current view mode
        if (window.innerWidth < 768) {
            // On mobile, force first tab to be active
            const activeTab = document.querySelector('.card-tab.border-secondary') || tabs[0];
            if (activeTab) {
                forceCardSwitch(activeTab);
            }
        } else {
            // On desktop, show all cards
            cards.forEach(card => {
                card.style.display = 'block';
                card.classList.remove('hidden');
            });
        }
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 768) {
                // Desktop mode - show all cards
                cards.forEach(card => {
                    card.style.display = 'block';
                    card.classList.remove('hidden');
                });
            } else {
                // Mobile mode - show only active card
                const activeTab = document.querySelector('.card-tab.border-secondary') || tabs[0];
                if (activeTab) {
                    forceCardSwitch(activeTab);
                }
            }
        });
        
        console.log("Card fix applied successfully");
    }, 300); // Add a delay to ensure all other scripts have initialized
});
