/**
 * Theme Manager
 * Handles dark/light mode toggling with proper events
 */

// Self-executing function to avoid polluting global scope
(function() {
  // Store references
  const html = document.documentElement;
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  // Dark mode colors
  const DARK_THEME_COLOR = '#111827'; // gray-900
  const LIGHT_THEME_COLOR = '#ffffff'; // white

  /**
   * Set theme with proper events and persistence
   * @param {string} theme - 'dark', 'light', or 'system'
   */
  function setTheme(theme) {
    // Check if we should follow system preference
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }

    // Apply theme
    if (theme === 'dark') {
      html.classList.add('dark');
      if (themeColorMeta) themeColorMeta.setAttribute('content', DARK_THEME_COLOR);
    } else {
      html.classList.remove('dark');
      if (themeColorMeta) themeColorMeta.setAttribute('content', LIGHT_THEME_COLOR);
    }

    // Store preference if it's not system (otherwise we'll check system on load)
    if (theme !== 'system') {
      try {
        localStorage.setItem('theme', theme);
      } catch (e) {
        console.error('Could not save theme preference:', e);
      }
    }

    // Dispatch event for components to react if needed
    window.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { theme, system: theme === 'system' } 
    }));
  }

  // Initialize theme toggle listeners when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Find theme toggle elements
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    if (darkModeToggle) {
      // Set initial state based on current theme
      darkModeToggle.checked = html.classList.contains('dark');
      
      // Add change listener
      darkModeToggle.addEventListener('change', function() {
        setTheme(this.checked ? 'dark' : 'light');
      });
    }

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      // Only respond to system changes if we're in "system" mode (no user preference)
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
        
        // Update the toggle
        if (darkModeToggle) {
          darkModeToggle.checked = e.matches;
        }
      }
    });
  });

  // Expose the API to window
  window.themeManager = {
    setTheme,
    getCurrentTheme: function() {
      return html.classList.contains('dark') ? 'dark' : 'light';
    },
    resetToSystem: function() {
      localStorage.removeItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  };
})();
