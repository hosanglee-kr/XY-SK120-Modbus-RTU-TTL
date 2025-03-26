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
})();
