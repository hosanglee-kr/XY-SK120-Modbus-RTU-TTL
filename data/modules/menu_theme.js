import { elements } from './elements_registry.js';

/**
 * Theme management module
 */

// Initialize theme based on user preference or system setting
function initTheme() {
  const savedTheme = localStorage.getItem('darkMode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Apply theme
  const isDarkMode = savedTheme === 'true' || (savedTheme === null && prefersDark);
  applyTheme(isDarkMode);
  
  // Update toggle button state
  const themeCheckbox = document.getElementById('theme-checkbox');
  if (themeCheckbox) {
    themeCheckbox.checked = isDarkMode;
  }
  
  // Set the slider active state
  const themeSlider = document.getElementById('theme-slider');
  if (themeSlider) {
    if (isDarkMode) {
      themeSlider.classList.add('active');
    } else {
      themeSlider.classList.remove('active');
    }
  }
}

// Toggle dark mode
function toggleTheme() {
  const isDarkMode = document.documentElement.classList.contains('dark');
  applyTheme(!isDarkMode);
  
  // Save preference
  localStorage.setItem('darkMode', !isDarkMode);
  
  // Update checkbox status (for systems that don't automatically update it)
  const themeCheckbox = document.getElementById('theme-checkbox');
  if (themeCheckbox) {
    themeCheckbox.checked = !isDarkMode;
  }
}

// Apply theme to document
function applyTheme(isDarkMode) {
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Update meta theme color
  const metaThemeColor = document.getElementById('theme-color');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', isDarkMode ? '#121212' : '#2c3e50');
  }
  
  // Update slider UI
  const themeSlider = document.getElementById('theme-slider');
  if (themeSlider) {
    if (isDarkMode) {
      themeSlider.classList.add('active');
    } else {
      themeSlider.classList.remove('active');
    }
  }
}

// Setup theme toggle event listeners
function setupThemeToggle() {
  const themeCheckbox = document.getElementById('theme-checkbox');
  const themeSlider = document.getElementById('theme-slider');
  
  if (themeCheckbox) {
    themeCheckbox.addEventListener('change', toggleTheme);
  }
  
  if (themeSlider) {
    themeSlider.addEventListener('click', function() {
      // Toggle the checkbox
      if (themeCheckbox) {
        themeCheckbox.checked = !themeCheckbox.checked;
        
        // Manually dispatch change event
        const event = new Event('change');
        themeCheckbox.dispatchEvent(event);
      }
    });
  }
}

// Update logo color function - increase stroke width for better visibility
function updateLogoColor() {
  const headerLogo = document.querySelector('.header-logo svg path');
  if (headerLogo) {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    if (theme === 'dark') {
      // Use brighter yellow-green gradient colors in dark mode
      headerLogo.style.fill = 'var(--secondary-color)';
      headerLogo.setAttribute('stroke-width', '1.5'); // Slightly thicker stroke in dark mode
    } else {
      // Use default gradient in light mode
      headerLogo.style.fill = 'var(--secondary-color)';
      headerLogo.setAttribute('stroke-width', '1'); // Normal stroke in light mode
    }
  }
}

export { initTheme, toggleTheme, applyTheme, setupThemeToggle, updateLogoColor };