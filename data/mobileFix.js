// Mobile fix script - handles edge cases in card visibility

document.addEventListener('DOMContentLoaded', function() {
  console.log('Mobile fix script loaded');
  
  // Fix for mobile card display
  setTimeout(function() {
    const isMobile = window.innerWidth <= 600;
    if (isMobile) {
      const cards = document.querySelectorAll('.card');
      let visibleCardFound = false;
      
      // Check if any card is visible
      cards.forEach(card => {
        if (card.style.display === 'block') {
          visibleCardFound = true;
        }
      });
      
      // If no card is visible, fix it
      if (!visibleCardFound && cards.length > 0) {
        console.log('No visible cards found, fixing...');
        
        // Hide all cards first
        cards.forEach(card => {
          card.style.display = 'none';
        });
        
        // Show first card
        cards[0].style.display = 'block';
        
        // Activate first dot
        const dots = document.querySelectorAll('.dot');
        if (dots[0]) {
          dots.forEach(dot => dot.classList.remove('active'));
          dots[0].classList.add('active');
        }
      }
    }
  }, 1500); // Wait for other scripts to finish
});
