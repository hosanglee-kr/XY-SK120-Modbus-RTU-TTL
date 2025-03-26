import { swipeElements } from './elements_registry.js';

// Global variables for touch handling
let touchStartX = 0;
let touchEndX = 0;
let isMobileView = false;
let hasInitialized = false;

// Track current active card index
let activeCardIndex = 0;

// Flag to prevent swipe during transition
let isTransitioning = false;

// Restore a working version of the swipe card implementation with simpler mechanics
function initSwipeCards() {
  console.log('Initializing swipe cards, window width:', window.innerWidth);
  
  // Determine if we're in mobile view
  isMobileView = window.innerWidth <= 600;
  
  // Remove any existing touch handlers first
  cleanupTouchHandlers();
  
  if (isMobileView) {
    // Mobile view setup
    console.log('Mobile view detected, setting up card swipe');
    setupMobileView();
  } else {
    // Desktop view setup
    console.log('Desktop view detected, showing all cards');
    setupDesktopView();
  }
  
  hasInitialized = true;
}

// Setup for mobile view
function setupMobileView() {
  // Show dots indicator for navigation
  const dotsIndicator = document.getElementById('dots-indicator');
  if (dotsIndicator) {
    dotsIndicator.style.display = 'flex';
  }
  
  // Get cards and dots
  const cards = document.querySelectorAll('.card');
  const dots = document.querySelectorAll('.dot');
  
  if (cards.length === 0 || dots.length === 0) {
    console.error('No cards or dots found!');
    return;
  }
  
  console.log(`Found ${cards.length} cards and ${dots.length} dots`);
  
  // Add transition class to all cards if not already present
  cards.forEach(card => {
    if (!card.classList.contains('card-transition')) {
      card.classList.add('card-transition');
    }
  });
  
  // IMPORTANT: First hide all cards deliberately
  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.display = 'none';
  });
  
  // Then show only the first or current active card
  const cardToShow = (activeCardIndex >= 0 && activeCardIndex < cards.length) ? 
    activeCardIndex : 0;
  
  if (cards[cardToShow]) {
    cards[cardToShow].style.display = 'block';
    // Short timeout to trigger transition after display is set
    setTimeout(() => {
      cards[cardToShow].style.opacity = '1';
    }, 50);
    console.log(`Card at index ${cardToShow} made visible`);
  }
  
  // Setup dots for navigation
  const freshDots = setupDots(cards, dots);
  
  // Make sure the right dot is active
  if (freshDots && freshDots.length > 0) {
    freshDots.forEach(d => d.classList.remove('active'));
    if (freshDots[cardToShow]) {
      freshDots[cardToShow].classList.add('active');
    }
  }
  
  // Setup touch handlers for swiping
  setupTouchHandlers(cards, freshDots);
}

// Setup for desktop view
function setupDesktopView() {
  // Hide dots indicator
  const dotsIndicator = document.getElementById('dots-indicator');
  if (dotsIndicator) {
    dotsIndicator.style.display = 'none';
  }
  
  // Show all cards
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    // Remove transition for desktop view
    card.classList.remove('card-transition');
    card.style.opacity = '1';
    card.style.display = 'block';
  });
}

// Setup dots for card navigation
function setupDots(cards, dots) {
  // Reset all dots first
  dots.forEach(dot => {
    dot.classList.remove('active');
  });
  
  // Clear existing events by cloning
  const freshDots = [];
  dots.forEach((dot, index) => {
    const newDot = dot.cloneNode(true);
    dot.parentNode.replaceChild(newDot, dot);
    freshDots.push(newDot);
  });
  
  // Add click handlers to dots
  freshDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      // Prevent action during transition
      if (isTransitioning) return;
      
      // Update active index
      const previousIndex = activeCardIndex;
      activeCardIndex = index;
      
      // Transition to the new card
      transitionCards(cards, previousIndex, activeCardIndex);
      
      // Update active dot - this is crucial
      freshDots.forEach(d => {
        d.classList.remove('active');
      });
      dot.classList.add('active');
      
      console.log(`Dot clicked - showing card ${index}`);
    });
  });
  
  // Make sure the active dot corresponds to the active card
  if (activeCardIndex >= 0 && activeCardIndex < freshDots.length) {
    freshDots[activeCardIndex].classList.add('active');
  } else if (freshDots.length > 0) {
    freshDots[0].classList.add('active');
    activeCardIndex = 0;
  }
  
  return freshDots;
}

// Setup touch handlers for swiping
function setupTouchHandlers(cards, dots) {
  // Clean up any existing handlers first
  cleanupTouchHandlers();
  
  // Setup new handlers
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  // Store references to cards and dots for the swipe handler
  window.swipeCards = {
    cards: cards,
    dots: dots
  };
}

// Clean up touch handlers
function cleanupTouchHandlers() {
  document.removeEventListener('touchstart', handleTouchStart);
  document.removeEventListener('touchend', handleTouchEnd);
}

// Touch start handler
function handleTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
}

// Touch end handler
function handleTouchEnd(e) {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}

// Handle swipe gesture
function handleSwipe() {
  // Don't handle swipes during transitions
  if (isTransitioning) return;
  
  const swipeThreshold = 50;
  const swipeDifference = touchStartX - touchEndX;
  
  // Only process swipes if we have the necessary references
  if (!window.swipeCards || !window.swipeCards.dots) {
    console.warn('Swipe data not available');
    return;
  }
  
  const dots = window.swipeCards.dots;
  const cards = window.swipeCards.cards;
  
  // Find the active dot by checking the DOM directly
  const activeDotIndex = Array.from(dots).findIndex(dot => dot.classList.contains('active'));
  
  if (activeDotIndex === -1) {
    console.warn('No active dot found in DOM, using stored index:', activeCardIndex);
    // Use the stored active index as fallback
    handleSwipeWithIndex(activeCardIndex, dots, cards, swipeDifference, swipeThreshold);
  } else {
    // Update our stored index
    activeCardIndex = activeDotIndex;
    handleSwipeWithIndex(activeDotIndex, dots, cards, swipeDifference, swipeThreshold);
  }
}

// Process swipe with a known index
function handleSwipeWithIndex(currentIndex, dots, cards, swipeDifference, swipeThreshold) {
  if (Math.abs(swipeDifference) < swipeThreshold) {
    return; // Not a significant swipe
  }
  
  if (swipeDifference > 0) {
    // Left swipe - next card
    const nextIndex = (currentIndex + 1) % dots.length;
    console.log(`Swiping left from ${currentIndex} to ${nextIndex}`);
    
    // Update dots
    dots.forEach(d => d.classList.remove('active'));
    if (dots[nextIndex]) {
      dots[nextIndex].classList.add('active');
    }
    
    // Perform transition
    transitionCards(cards, currentIndex, nextIndex);
    
    // Update active index
    activeCardIndex = nextIndex;
  } else {
    // Right swipe - previous card
    const prevIndex = (currentIndex - 1 + dots.length) % dots.length;
    console.log(`Swiping right from ${currentIndex} to ${prevIndex}`);
    
    // Update dots
    dots.forEach(d => d.classList.remove('active'));
    if (dots[prevIndex]) {
      dots[prevIndex].classList.add('active');
    }
    
    // Perform transition
    transitionCards(cards, currentIndex, prevIndex);
    
    // Update active index
    activeCardIndex = prevIndex;
  }
}

// Transition between cards with fade effect
function transitionCards(cards, fromIndex, toIndex) {
  if (isTransitioning) return;
  
  isTransitioning = true;
  
  const fromCard = cards[fromIndex];
  const toCard = cards[toIndex];
  
  if (!fromCard || !toCard) {
    isTransitioning = false;
    return;
  }
  
  // First make sure both cards have transition class
  fromCard.classList.add('card-transition');
  toCard.classList.add('card-transition');
  
  // 1. Fade out current card
  fromCard.style.opacity = '0';
  
  // 2. Wait for fade out to complete
  setTimeout(() => {
    // 3. Hide old card and show new card (but still transparent)
    fromCard.style.display = 'none';
    toCard.style.display = 'block';
    
    // Short delay to ensure display change is processed
    setTimeout(() => {
      // 4. Fade in the new card
      toCard.style.opacity = '1';
      
      // 5. Clear transition flag after animation completes
      setTimeout(() => {
        isTransitioning = false;
      }, 300); // Match transition duration
    }, 50);
  }, 300); // Match transition duration
}

// Check if mobile cards are visible and fix if needed
function checkAndFixMobileCards() {
  if (isMobileView && hasInitialized) {
    const cards = document.querySelectorAll('.card');
    let visibleCardFound = false;
    let visibleCardIndex = -1;
    
    // Check if any card is visible and get its index
    cards.forEach((card, index) => {
      if (card.style.display === 'block' || card.style.display === '') {
        visibleCardFound = true;
        visibleCardIndex = index;
      }
    });
    
    if (visibleCardFound) {
      // Update active index to match visible card
      activeCardIndex = visibleCardIndex;
      
      // Make sure dot matches visible card
      const dots = document.querySelectorAll('.dot');
      if (dots.length > 0) {
        dots.forEach(d => d.classList.remove('active'));
        if (dots[visibleCardIndex]) {
          dots[visibleCardIndex].classList.add('active');
        }
      }
      
      // Ensure the visible card is fully opaque
      cards[visibleCardIndex].style.opacity = '1';
    } else {
      console.log('No visible cards found in mobile view, fixing...');
      
      // Make first card visible with opacity
      if (cards[0]) {
        cards.forEach(card => {
          card.style.opacity = '0';
          card.style.display = 'none';
        });
        
        cards[0].style.display = 'block';
        setTimeout(() => {
          cards[0].style.opacity = '1';
        }, 50);
      }
      
      // Reset active index
      activeCardIndex = 0;
      
      // Make sure first dot is active
      const dots = document.querySelectorAll('.dot');
      if (dots[0]) {
        dots.forEach(d => d.classList.remove('active'));
        dots[0].classList.add('active');
      }
    }
  }
}

// Force reinitialize swipe cards
function forceReinitSwipeCards() {
  hasInitialized = false;
  isTransitioning = false;
  initSwipeCards();
  
  // Double-check after slight delay
  setTimeout(checkAndFixMobileCards, 100);
}

// Export functions
export { initSwipeCards, forceReinitSwipeCards };