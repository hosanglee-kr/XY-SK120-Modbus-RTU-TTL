// Enhanced debug script to diagnose module loading issues
console.log('Debug script loaded');

// Store module file paths in a global variable for access in debug.html
window.moduleFiles = [
  './modules/elements_registry.js',
  './modules/menu_connection.js',
  './modules/menu_display.js',
  './modules/menu_basic.js',
  './modules/menu_settings.js',
  './modules/menu_theme.js',
  './modules/menu_interface.js'
];

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded from debug.js');
  
  // Check if module files exist by trying to load them
  moduleFiles.forEach(file => {
    const script = document.createElement('script');
    script.type = 'module';
    script.onload = () => {
      console.log(`Module ${file} loaded successfully`);
      // Update module status in debug.html if available
      if (window.updateModuleStatus) {
        window.updateModuleStatus(file, true);
      }
    };
    script.onerror = () => {
      console.error(`Module ${file} failed to load`);
      // Update module status in debug.html if available
      if (window.updateModuleStatus) {
        window.updateModuleStatus(file, false);
      }
    };
    script.src = file;
    document.head.appendChild(script);
  });
  
  // Basic UI check with improved logging
  setTimeout(() => {
    console.log('Running DOM checks:');
    const cards = document.querySelectorAll('.card');
    const cardCount = cards.length;
    console.log(`Cards found: ${cardCount}`);
    
    const powerContainer = document.getElementById('power-animation-container');
    console.log(`Power button container: ${powerContainer ? 'Found' : 'Missing'}`);
    
    const psuVoltage = document.getElementById('psu-voltage');
    console.log(`PSU voltage element: ${psuVoltage ? 'Found' : 'Missing'}`);
    
    // Log additional critical elements
    const criticalElements = [
      'psu-current', 'psu-power', 'output-status', 'toggle-output',
      'theme-toggle', 'configForm', 'wifi-status', 'dots-indicator'
    ];
    
    criticalElements.forEach(id => {
      const element = document.getElementById(id);
      console.log(`Element ${id}: ${element ? 'Found' : 'Missing'}`);
    });
    
    // Try to render basic UI if modules failed
    if (cardCount > 0) {
      cards.forEach(card => {
        card.style.display = 'block';
      });
      console.log('Made all cards visible as fallback');
    }
    
    // Notify debug.html if available
    if (window.debugCheckComplete) {
      window.debugCheckComplete();
    }
  }, 1000);
});
