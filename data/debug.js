// Simple debug script to diagnose module loading issues
console.log('Debug script loaded');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded from debug.js');
  
  // Check if module files exist by trying to load them
  const moduleFiles = [
    './modules/elements_registry.js',
    './modules/menu_connection.js',
    './modules/menu_display.js',
    './modules/menu_basic.js',
    './modules/menu_settings.js',
    './modules/menu_theme.js',
    './modules/menu_interface.js'
  ];
  
  moduleFiles.forEach(file => {
    const script = document.createElement('script');
    script.type = 'module';
    script.onload = () => console.log(`Module ${file} loaded successfully`);
    script.onerror = () => console.error(`Module ${file} failed to load`);
    script.src = file;
    document.head.appendChild(script);
  });
  
  // Basic UI check
  setTimeout(() => {
    console.log('Running DOM checks:');
    console.log('Cards found:', document.querySelectorAll('.card').length);
    console.log('Power button container:', document.getElementById('power-animation-container'));
    console.log('PSU voltage element:', document.getElementById('psu-voltage'));
    
    // Try to render basic UI if modules failed
    const cards = document.querySelectorAll('.card');
    if (cards.length > 0) {
      cards.forEach(card => {
        card.style.display = 'block';
      });
      console.log('Made all cards visible as fallback');
    }
  }, 1000);
});
