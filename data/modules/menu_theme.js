import { elements } from './elements_registry.js';

/**
 * Theme management module
 */

// Initialize theme toggle
function initThemeToggle() {
  const themeCheckbox = document.getElementById('theme-checkbox');
  const themeSlider = document.getElementById('theme-slider');
  
  if (!themeCheckbox || !themeSlider) {
    console.error('Theme toggle elements not found');
    return;
  }
  
  // Apply saved theme on page load
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeCheckbox.checked = true;
    themeSlider.classList.add('active');
    updateMetaThemeColor('#1a2530');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    themeCheckbox.checked = false;
    themeSlider.classList.remove('active');
    updateMetaThemeColor('#ecf0f1');
  }
  
  // Toggle theme when slider is clicked
  themeSlider.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      themeCheckbox.checked = false;
      themeSlider.classList.remove('active');
      updateMetaThemeColor('#ecf0f1');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      themeCheckbox.checked = true;
      themeSlider.classList.add('active');
      updateMetaThemeColor('#1a2530');
    }
  });
}

// Update meta theme color for mobile browser
function updateMetaThemeColor(color) {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', color);
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

export { initThemeToggle, toggleTheme, updateLogoColor, setTheme, updateMetaThemeColor };