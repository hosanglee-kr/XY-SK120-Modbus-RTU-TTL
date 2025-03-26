/**
 * Emergency card visibility fixer
 * This script runs independently of the module system to ensure cards are visible
 */
(function() {
    // Run on load and DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixCards);
    } else {
        fixCards();
    }
    
    window.addEventListener('load', fixCards);
    
    function fixCards() {
        const isMobile = window.innerWidth <= 600;
        const cards = document.querySelectorAll('.card');
        
        if (cards.length === 0) return;
        
        // Update dot indicators if necessary
        updateDots(cards.length);
        
        if (isMobile) {
            // Mobile view: show only first card
            cards.forEach((card, index) => {
                card.style.cssText = index === 0 
                    ? 'display: block !important; visibility: visible !important; opacity: 1 !important;'
                    : 'display: none !important;';
            });
            
            // Show dots
            const dots = document.getElementById('dots-indicator');
            if (dots) dots.style.display = 'flex';
        } else {
            // Desktop view: show all cards
            cards.forEach(card => {
                card.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
            });
            
            // Hide dots
            const dots = document.getElementById('dots-indicator');
            if (dots) dots.style.display = 'none';
        }
    }
    
    // Helper function to ensure the correct number of dots
    function updateDots(cardCount) {
        const dotsContainer = document.getElementById('dots-indicator');
        if (!dotsContainer) return;
        
        const existingDots = dotsContainer.querySelectorAll('.dot');
        
        // Only update if the number of dots doesn't match the cards
        if (existingDots.length !== cardCount) {
            // Clear existing dots
            dotsContainer.innerHTML = '';
            
            // Create new dots based on card count
            for (let i = 0; i < cardCount; i++) {
                const dot = document.createElement('div');
                dot.className = i === 0 ? 'dot active' : 'dot';
                dotsContainer.appendChild(dot);
            }
        }
    }
})();
