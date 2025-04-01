/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './data/**/*.{html,js}',
    './js/**/*.js',
  ],
  darkMode: 'class', // Using class-based dark mode
  theme: {
    extend: {
      colors: {
        // Primary UI colors
        primary: '#2c3e50',
        secondary: '#3498db',
        success: '#2ecc71',
        danger: '#e74c3c',
        warning: '#f39c12',
        
        // Background and card colors
        card: {
          DEFAULT: '#ffffff',
          dark: '#1e1e1e',
        },
        background: {
          DEFAULT: '#f5f5f5',
          dark: '#121212',
        },
        border: {
          DEFAULT: '#e0e0e0',
          dark: '#333333',
        },
        text: {
          DEFAULT: '#333333',
          dark: '#f5f5f5',
        },
        
        // Device indicator colors
        voltage: '#64ff00', // Green for CV mode
        current: '#fff500', // Yellow for CC mode
        power: '#b73dff',   // Purple for CP mode
        temperature: '#00e5ff', // Cyan for temperature
        
        // Standard grays for dark mode consistency
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      
      // Element sizes 
      height: {
        'input': '40px',
      },
      minHeight: {
        'card': '300px',
      },
      width: {
        'header-logo': '64px',
      },
      
      // Z-index levels
      zIndex: {
        'popup': '100000',
        'overlay': '99999',
        'readings': '20',
        'content': '10',
        'lower': '5',
      },
      
      // Transitions
      transitionDuration: {
        'theme': '300ms',
      },
      transitionTimingFunction: {
        'theme': 'ease-in-out',
      },
      transitionProperty: {
        'theme': 'background-color, color, border-color',
      },
    },
    screens: {
      'xs': '360px',
      'sm': '480px',
      'md': '768px',
      'lg': '992px',
      'xl': '1200px',
    },
  },
  plugins: [],
}
