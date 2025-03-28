/**
 * Card fixer script - ensures the cards are properly displayed
 * This runs before the main module script is loaded
 */

// Function to fix card visibility
function fixCardsNow() {
  console.log('Fixing card visibility');
  const isMobile = window.innerWidth <= 600;
  const cards = document.querySelectorAll('.card');
  const dots = document.getElementById('dots-indicator');
  
  if (isMobile) {
    // Mobile view - show only first card
    cards.forEach((card, index) => {
      if (index === 0) {
        card.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
      } else {
        card.style.cssText = 'display: none !important;';
      }
    });
    
    // Show dots
    if (dots) dots.style.display = 'flex';
    
    // Setup dot click handlers
    setupDotHandlers();
  } else {
    // Desktop view - show all cards
    cards.forEach(card => {
      card.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
    });
    
    // Hide dots
    if (dots) dots.style.display = 'none';
  }
}

// Setup dot click handlers
function setupDotHandlers() {
  const dots = document.querySelectorAll('.dot');
  const cards = document.querySelectorAll('.card');
  
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      // Update active dot
      dots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      
      // Show selected card, hide others
      cards.forEach((card, cardIndex) => {
        if (cardIndex === index) {
          card.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
        } else {
          card.style.cssText = 'display: none !important;';
        }
      });
    });
  });
}

// Run this immediately after script is loaded
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, applying initial card fixes');
  
  // Run immediately
  fixCardsNow();
  
  // And run again after a delay to ensure it takes effect
  setTimeout(fixCardsNow, 100);
  setTimeout(fixCardsNow, 500);
  setTimeout(fixCardsNow, 1000);
  
  // Monitor window resize
  window.addEventListener('resize', () => {
    fixCardsNow();
  });
});
