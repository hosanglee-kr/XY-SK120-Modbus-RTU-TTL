import { swipeElements } from './elements_registry.js';
import { sendCommand, requestPsuStatus, requestOperatingMode } from './menu_connection.js';

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

// Update dot indicators to match the number of cards
function updateDotIndicators(dots) {
  if (!dots) dots = document.querySelectorAll('.dot');
  
  // Make sure we have the right number of dots for all cards
  const cards = document.querySelectorAll('.card');
  const dotsContainer = document.getElementById('dots-indicator');
  
  if (dotsContainer) {
    // Check if we need to update the number of dots
    if (dots.length !== cards.length) {
      console.log(`Updating dots count from ${dots.length} to ${cards.length}`);
      
      // Clear existing dots
      dotsContainer.innerHTML = '';
      
      // Create the correct number of dots
      for (let i = 0; i < cards.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.title = `Card ${i+1}`;
        
        // Try to set a meaningful title based on card header if present
        const cardHeader = cards[i].querySelector('h2');
        if (cardHeader) {
          dot.title = cardHeader.textContent;
        }
        
        dotsContainer.appendChild(dot);
      }
      
      // Get the new dots
      dots = dotsContainer.querySelectorAll('.dot');
    }
    
    // First, remove existing event listeners from the dots container
    const newContainer = dotsContainer.cloneNode(true);
    dotsContainer.parentNode.replaceChild(newContainer, dotsContainer);
    
    // Then set up new event listeners for each dot
    const newDots = newContainer.querySelectorAll('.dot');
    newDots.forEach((dot, index) => {
      // Set active state
      dot.classList.toggle('active', index === activeCardIndex);
      
      // Add click handler with proper target check
      dot.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event bubbling
        if (isTransitioning) return;
        
        // Only switch if we're clicking on a different dot
        if (index !== activeCardIndex) {
          switchToCard(index);
        }
      });
    });
  }
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
  
  console.log(`Switching to card ${index}`);
  
  // Update active index
  activeCardIndex = index;
  
  // Update card visibility
  setCardVisibility(true);
  
  // Update dots
  updateDotIndicators();
  
  // Reset transition flag after animation completes
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

// Set up operating mode tabs
function setupOperatingModeTabs() {
  const tabs = document.querySelectorAll('.tw-mode-tab');
  const contents = document.querySelectorAll('#cv-settings, #cc-settings, #cp-settings');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding content
      const mode = tab.getAttribute('data-mode');
      contents.forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('block');
      });
      
      const activeContent = document.getElementById(`${mode}-settings`);
      if (activeContent) {
        activeContent.classList.remove('hidden');
        activeContent.classList.add('block');
      }
    });
  });
}

// Set up operating mode setting buttons
function setupOperatingModeSetters() {
  // CV mode apply button
  const applyCvButton = document.getElementById('apply-cv');
  if (applyCvButton) {
    applyCvButton.addEventListener('click', () => {
      const cvVoltageInput = document.getElementById('set-cv-voltage');
      if (cvVoltageInput && cvVoltageInput.value) {
        const voltage = parseFloat(cvVoltageInput.value);
        if (!isNaN(voltage) && voltage >= 0) {
          // Disable CP mode first
          sendCommand({ action: 'setConstantPowerMode', enable: false });
          
          // Then set the CV value
          setTimeout(() => {
            sendCommand({ action: 'setConstantVoltage', voltage: voltage });
            
            // Request updates after a short delay
            setTimeout(() => {
              requestPsuStatus();
              requestOperatingMode();
            }, 500);
          }, 200);
        }
      }
    });
  }
  
  // CC mode apply button
  const applyCcButton = document.getElementById('apply-cc');
  if (applyCcButton) {
    applyCcButton.addEventListener('click', () => {
      const ccCurrentInput = document.getElementById('set-cc-current');
      if (ccCurrentInput && ccCurrentInput.value) {
        const current = parseFloat(ccCurrentInput.value);
        if (!isNaN(current) && current >= 0) {
          // Disable CP mode first
          sendCommand({ action: 'setConstantPowerMode', enable: false });
          
          // Then set the CC value
          setTimeout(() => {
            sendCommand({ action: 'setConstantCurrent', current: current });
            
            // Request updates after a short delay
            setTimeout(() => {
              requestPsuStatus();
              requestOperatingMode();
            }, 500);
          }, 200);
        }
      }
    });
  }
  
  // CP mode apply button
  const applyCpButton = document.getElementById('apply-cp');
  if (applyCpButton) {
    applyCpButton.addEventListener('click', () => {
      const cpPowerInput = document.getElementById('set-cp-power');
      if (cpPowerInput && cpPowerInput.value) {
        const power = parseFloat(cpPowerInput.value);
        if (!isNaN(power) && power >= 0 && power <= 120) {
          // First set the power value
          sendCommand({ action: 'setConstantPower', power: power });
          
          // Then enable CP mode
          setTimeout(() => {
            sendCommand({ action: 'setConstantPowerMode', enable: true });
            
            // Request updates after a short delay
            setTimeout(() => {
              requestPsuStatus();
              requestOperatingMode();
            }, 500);
          }, 200);
        }
      }
    });
  }
  
  // CP mode enable/disable buttons
  const cpModeOnButton = document.getElementById('cp-mode-on');
  const cpModeOffButton = document.getElementById('cp-mode-off');
  
  if (cpModeOnButton) {
    cpModeOnButton.addEventListener('click', () => {
      sendCommand({ action: 'setConstantPowerMode', enable: true });
      
      // Request updates after a short delay
      setTimeout(() => {
        requestPsuStatus();
        requestOperatingMode();
      }, 500);
    });
  }
  
  if (cpModeOffButton) {
    cpModeOffButton.addEventListener('click', () => {
      sendCommand({ action: 'setConstantPowerMode', enable: false });
      
      // Request updates after a short delay
      setTimeout(() => {
        requestPsuStatus();
        requestOperatingMode();
      }, 500);
    });
  }
}

// Function to initialize card swiping for mobile
function initSwipeCards() {
  const isMobile = window.innerWidth <= 600;
  
  if (!isMobile) {
    // On desktop, show all cards
    showAllCards();
    return;
  }
  
  const cards = document.querySelectorAll('.tw-card');
  const dots = document.querySelectorAll('.tw-dot');
  let currentCardIndex = 0;
  
  // Show only the first card initially
  updateCardVisibility();
  
  // Set up touch handling
  setupTouchHandling();
  
  // Set up dot indicators
  setupDotIndicators();
  
  function setupTouchHandling() {
    const container = document.querySelector('.max-w-4xl');
    if (!container) return;
    
    let startX, startY, distX, distY;
    const threshold = 100; // Minimum distance required for swipe
    
    container.addEventListener('touchstart', function(e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      document.body.classList.add('swiping');
    }, { passive: true });
    
    container.addEventListener('touchmove', function(e) {
      if (!startX || !startY) return;
      
      distX = e.touches[0].clientX - startX;
      distY = e.touches[0].clientY - startY;
      
      // If mostly horizontal swipe, prevent default to avoid page scrolling
      if (Math.abs(distX) > Math.abs(distY) && Math.abs(distX) > 10) {
        e.preventDefault();
      }
    }, { passive: false });
    
    container.addEventListener('touchend', function(e) {
      if (!distX) return;
      
      if (Math.abs(distX) >= threshold) {
        if (distX > 0 && currentCardIndex > 0) {
          // Swipe right - show previous card
          currentCardIndex--;
        } else if (distX < 0 && currentCardIndex < cards.length - 1) {
          // Swipe left - show next card
          currentCardIndex++;
        }
        updateCardVisibility();
      }
      
      // Reset
      startX = startY = distX = distY = null;
      document.body.classList.remove('swiping');
    }, { passive: true });
  }
  
  function setupDotIndicators() {
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        currentCardIndex = index;
        updateCardVisibility();
      });
    });
  }
  
  function updateCardVisibility() {
    // Hide all cards
    cards.forEach(card => {
      card.style.display = 'none';
    });
    
    // Show current card
    if (cards[currentCardIndex]) {
      cards[currentCardIndex].style.display = 'block';
    }
    
    // Update dots
    dots.forEach((dot, index) => {
      if (index === currentCardIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }
}

// Force reinitialize card swiping (used when window resizes)
function forceReinitSwipeCards() {
  const isMobile = window.innerWidth <= 600;
  const cards = document.querySelectorAll('.tw-card');
  const dots = document.getElementById('dots-indicator');
  
  if (isMobile) {
    // Mobile view - first fix visibility issues
    cards.forEach(card => {
      card.style.removeProperty('display');
    });
    
    // Then reinitialize swiping
    initSwipeCards();
    
    // Show dots
    if (dots) dots.style.display = 'flex';
  } else {
    // Desktop view - show all cards
    showAllCards();
    
    // Hide dots
    if (dots) dots.style.display = 'none';
  }
}

// Helper function to show all cards (desktop view)
function showAllCards() {
  const cards = document.querySelectorAll('.tw-card');
  cards.forEach(card => {
    card.style.display = 'block';
  });
}

export { initSwipeCards, forceReinitSwipeCards, setupOperatingModeTabs, setupOperatingModeSetters };