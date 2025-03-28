/**
 * Simplified card swiper using CSS scroll snap
 * Requires minimal JavaScript - just to update the dots indicator
 */

document.addEventListener('DOMContentLoaded', function() {
    const snapContainer = document.querySelector('.snap-container');
    const dots = document.querySelectorAll('.dot');
    
    if (!snapContainer || !dots.length) return;
    
    // Only initialize on mobile
    if (window.innerWidth <= 640) {
        initSnapScroll();
    }
    
    // Handle resize events
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 640) {
            initSnapScroll();
        } else {
            // On desktop, no need for special handling
            resetDesktopLayout();
        }
    });
    
    function initSnapScroll() {
        // Set up scroll event to update dots
        snapContainer.addEventListener('scroll', updateDots);
        
        // Set up click events for dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                scrollToCard(index);
            });
        });
        
        // Initial dots update
        updateDots();
    }
    
    function updateDots() {
        // Calculate which card is most visible
        const containerWidth = snapContainer.offsetWidth;
        const scrollPosition = snapContainer.scrollLeft;
        
        // Calculate the card index from scroll position
        const index = Math.round(scrollPosition / containerWidth);
        
        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
    
    function scrollToCard(index) {
        const cardWidth = snapContainer.offsetWidth;
        const scrollTarget = index * cardWidth;
        
        // Smooth scroll to the card
        snapContainer.scrollTo({
            left: scrollTarget,
            behavior: 'smooth'
        });
    }
    
    function resetDesktopLayout() {
        // Remove scroll event listener
        snapContainer.removeEventListener('scroll', updateDots);
        
        // Show dots container on mobile only
        const dotsContainer = document.querySelector('.dot-indicators');
        if (dotsContainer) {
            dotsContainer.style.display = 'none';
        }
    }
    
    // Export API for other modules
    window.CardSwiper = {
        goToCard: scrollToCard,
        
        getCurrentCardIndex: function() {
            return Math.round(snapContainer.scrollLeft / snapContainer.offsetWidth);
        },
        
        getCardCount: function() {
            return dots.length;
        },
        
        next: function() {
            const currentIndex = this.getCurrentCardIndex();
            if (currentIndex < dots.length - 1) {
                scrollToCard(currentIndex + 1);
                return true;
            }
            return false;
        },
        
        previous: function() {
            const currentIndex = this.getCurrentCardIndex();
            if (currentIndex > 0) {
                scrollToCard(currentIndex - 1);
                return true;
            }
            return false;
        }
    };
});
