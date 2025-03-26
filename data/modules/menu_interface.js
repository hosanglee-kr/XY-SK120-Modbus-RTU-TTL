import { swipeElements } from './elements_registry.js';

// Global variables for touch handling
let touchStartX = 0;
let touchEndX = 0;
let isMobileView = false;
let activeCardIndex = 0;
let isTransitioning = false;

// Consolidated card visibility function - handles both operations
function setCardVisibility(isMobile = null) {
  if (isMobile === null) {
    isMobile = window.innerWidth <= 600;
  }
  
  const cards = document.querySelectorAll('.card');
  const dots = document.getElementById('dots-indicator');
  
  if (cards.length === 0) return;
  
  // Apply visibility based on mobile/desktop mode
  if (isMobile) {
    // Mobile: only show active card
    cards.forEach((card, index) => {
      const isVisible = index === activeCardIndex;
      card.style.cssText = isVisible 
        ? 'display: block !important; visibility: visible !important; opacity: 1 !important;'
        : 'display: none !important;';
    });
    
    // Show dots navigation
    if (dots) dots.style.display = 'flex';
  } else {
    // Desktop: show all cards
    cards.forEach(card => {
      card.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
    });
    
    // Hide dots navigation
    if (dots) dots.style.display = 'none';
  }
  
  return cards;
}

// Main swipe cards initialization
function initSwipeCards() {
  isMobileView = window.innerWidth <= 600;
  
  // Set initial card visibility
  const cards = setCardVisibility(isMobileView);
  if (!cards) return;
  
  // In mobile mode, set up swiping
  if (isMobileView) {
    setupMobileView();
  }
}

// Setup mobile view with swipe
function setupMobileView() {
  // Get cards and dots
  const cards = document.querySelectorAll('.card');
  const dots = document.querySelectorAll('.dot');
  
  if (cards.length === 0 || dots.length === 0) {
    console.error('No cards or dots found!');
    return;
  }
  
  // Update dots to reflect current active card
  updateDotIndicators(dots);
  
  // Setup touch handlers
  setupTouchHandlers();
}

// Update dot indicators
function updateDotIndicators(dots) {
  if (!dots) dots = document.querySelectorAll('.dot');
  
  dots.forEach((dot, index) => {
    // Clear existing listeners
    const newDot = dot.cloneNode(true);
    dot.parentNode.replaceChild(newDot, dot);
    
    // Set active state
    newDot.classList.toggle('active', index === activeCardIndex);
    
    // Add click handler
    newDot.addEventListener('click', () => {
      if (isTransitioning) return;
      switchToCard(index);
    });
  });
}

// Setup touch handlers
function setupTouchHandlers() {
  // Remove existing handlers
  document.removeEventListener('touchstart', handleTouchStart);
  document.removeEventListener('touchend', handleTouchEnd);
  
  // Add new handlers
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
}

// Touch start handler
function handleTouchStart(e) {
  touchStartX = e.touches[0].screenX;
}

// Touch end handler
function handleTouchEnd(e) {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}

// Handle swipe gesture
function handleSwipe() {
  if (isTransitioning || !isMobileView) return;
  
  const swipeThreshold = 50;
  const swipeDifference = touchStartX - touchEndX;
  
  if (Math.abs(swipeDifference) < swipeThreshold) return;
  
  // Get cards
  const cards = document.querySelectorAll('.card');
  
  // Calculate new index
  let newIndex;
  if (swipeDifference > 0) {
    // Left swipe - next card
    newIndex = (activeCardIndex + 1) % cards.length;
  } else {
    // Right swipe - previous card
    newIndex = (activeCardIndex - 1 + cards.length) % cards.length;
  }
  
  switchToCard(newIndex);
}

// Switch to specific card
function switchToCard(index) {
  if (isTransitioning) return;
  isTransitioning = true;
  
  // Update active index
  activeCardIndex = index;
  
  // Update card visibility
  setCardVisibility(true);
  
  // Update dots
  updateDotIndicators();
  
  // Reset transition flag
  setTimeout(() => isTransitioning = false, 300);
}

// Force reinitialize swipe cards
function forceReinitSwipeCards() {
  isTransitioning = false;
  setCardVisibility();
  initSwipeCards();
}

// Initialize on DOM ready and window load
window.addEventListener('DOMContentLoaded', initSwipeCards);
window.addEventListener('load', forceReinitSwipeCards);
window.addEventListener('orientationchange', () => setTimeout(forceReinitSwipeCards, 300));

export { initSwipeCards, forceReinitSwipeCards };