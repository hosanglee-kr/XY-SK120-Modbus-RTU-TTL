import { elements } from './elements_registry.js';

// Initialize theme based on saved preference
function initTheme() {
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  const themeCheckbox = document.getElementById('theme-checkbox');
  const moonIcon = document.querySelector('.moon-icon');
  const sunIcon = document.querySelector('.sun-icon');
  
  // Function to set theme
  function setTheme(theme) {
    if (theme === 'dark') {
      body.setAttribute('data-theme', 'dark');
      if (moonIcon) moonIcon.style.display = 'none';
      if (sunIcon) sunIcon.style.display = 'block';
      if (themeCheckbox) themeCheckbox.checked = true;
    } else {
      body.removeAttribute('data-theme');
      if (moonIcon) moonIcon.style.display = 'block';
      if (sunIcon) sunIcon.style.display = 'none';
      if (themeCheckbox) themeCheckbox.checked = false;
    }
    
    // Update theme-color meta tag for mobile browsers
    const themeColorMeta = document.getElementById('theme-color');
    if (themeColorMeta) {
      themeColorMeta.content = theme === 'dark' ? '#121212' : '#2c3e50';
    }
    
    // Save the theme preference
    localStorage.setItem('theme', theme);
  }
  
  // Get saved theme preference
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  // Apply saved theme
  setTheme(savedTheme);
  
  // Add event listeners
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(currentTheme);
    });
  }
  
  // Add event listener for checkbox
  if (themeCheckbox) {
    themeCheckbox.addEventListener('change', () => {
      const currentTheme = themeCheckbox.checked ? 'dark' : 'light';
      setTheme(currentTheme);
    });
  }
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