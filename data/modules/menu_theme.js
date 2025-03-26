import { elements } from './elements_registry.js';

// Initialize theme based on saved preference
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
}

// Toggle between light and dark theme
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  localStorage.setItem('theme', newTheme);
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

// Set the theme
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update icons
  if (elements.sunIcon && elements.moonIcon) {
    if (theme === 'dark') {
      elements.sunIcon.style.display = 'block';
      elements.moonIcon.style.display = 'none';
      elements.themeColorMeta.setAttribute('content', '#121212');
    } else {
      elements.sunIcon.style.display = 'none';
      elements.moonIcon.style.display = 'block';
      elements.themeColorMeta.setAttribute('content', '#2c3e50');
    }
  }
  
  // Update logo color
  updateLogoColor();
}

export { initTheme, toggleTheme, updateLogoColor, setTheme };