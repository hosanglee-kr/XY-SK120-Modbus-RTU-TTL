/**
 * Card swiper functionality for mobile view
 * Handles touch gestures and card navigation
 */

document.addEventListener('DOMContentLoaded', function() {
    // Card swipe variables
    let startX = 0;
    let currentX = 0;
    let currentCardIndex = 0;
    let isDragging = false;
    const cardContainer = document.querySelector('.card-container');
    const cards = document.querySelectorAll('.swipeable-card');
    const dots = document.querySelectorAll('.dot');
    
    // Initialize based on screen width
    initializeCards();
    
    // Handle resize events
    window.addEventListener('resize', initializeCards);
    
    // Initialize cards based on screen width
    function initializeCards() {
        const isMobile = window.innerWidth <= 640;
        
        if (isMobile) {
            initializeSwipeCards();
        } else {
            // Desktop: show all cards
            resetToDesktopLayout();
        }
    }
    
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
        
        // Remove event listeners
        if (cardContainer) {
            cardContainer.removeEventListener('touchstart', handleTouchStart);
            cardContainer.removeEventListener('touchmove', handleTouchMove);
            cardContainer.removeEventListener('touchend', handleTouchEnd);
        }
    }
    
    function initializeSwipeCards() {
        if (!cardContainer || !cards.length) return;
        
        // Set initial states
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
        
        // Update dots
        updateDots();
        
        // Show dots navigation
        const dotsContainer = document.querySelector('.dot-indicators');
        if (dotsContainer) {
            dotsContainer.style.display = 'flex';
        }
        
        // Add touch event listeners
        cardContainer.removeEventListener('touchstart', handleTouchStart);
        cardContainer.removeEventListener('touchmove', handleTouchMove);
        cardContainer.removeEventListener('touchend', handleTouchEnd);
        
        cardContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
        cardContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
        cardContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        // Add click event listeners to dots
        dots.forEach((dot, index) => {
            dot.removeEventListener('click', dotClickHandler);
            dot.addEventListener('click', dotClickHandler);
        });
    }
    
    function dotClickHandler() {
        const index = parseInt(this.getAttribute('data-index'));
        if (!isNaN(index)) {
            currentCardIndex = index;
            updateCards();
            updateDots();
        }
    }
    
    function handleTouchStart(e) {
        startX = e.touches[0].clientX;
        isDragging = true;
    }
    
    function handleTouchMove(e) {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
    }
    
    function handleTouchEnd(e) {
        if (!isDragging) return;
        
        const diffX = startX - (currentX || e.changedTouches[0].clientX);
        const threshold = window.innerWidth * 0.15; // 15% of screen width
        
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0 && currentCardIndex < cards.length - 1) {
                // Swipe left - next card
                currentCardIndex++;
            } else if (diffX < 0 && currentCardIndex > 0) {
                // Swipe right - previous card
                currentCardIndex--;
            }
        }
        
        updateCards();
        updateDots();
        
        isDragging = false;
    }
    
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
    
    function updateDots() {
        dots.forEach((dot, index) => {
            if (index === currentCardIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
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
});
