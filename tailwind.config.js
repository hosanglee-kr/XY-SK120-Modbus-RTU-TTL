/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./data/**/*.{html,js}",
  ],
  darkMode: 'class', // Use class-based dark mode for user toggling
  theme: {
    extend: {
      colors: {
        // Primary UI colors
        'primary': '#2c3e50',
        'secondary': '#3498db',
        'success': '#2ecc71',
        'danger': '#e74c3c',
        'card': '#ffffff',
        'card-dark': '#1e1e1e',
        'background': '#f5f5f5',
        'background-dark': '#121212',
        'border': '#e0e0e0',
        'border-dark': '#333333',
        'text': '#333333',
        'text-dark': '#f5f5f5',
        
        // Device indicator colors
        'voltage': '#64ff00', // Green for CV mode
        'current': '#fff500', // Yellow for CC mode
        'power': '#b73dff',   // Purple for CP mode
      },
      fontFamily: {
        'sans': ['Arial', 'sans-serif'],
        'display': ['Arial', 'sans-serif'],
        'body': ['Arial', 'sans-serif'],
      },
      height: {
        'input': '40px', // Standard input height
      },
      minHeight: {
        'card': '300px', // Minimum card height
      },
      maxHeight: {
        'card-mobile': 'calc(80vh - 120px)', // Max card height on mobile
      },
      zIndex: {
        // Removed custom z-1 definition
        'popup': '100000',
        'overlay': '99999',
        'readings': '20',
        'content': '10',
        'lower': '5',
      },
      animation: {
        'pulse': 'pulse 2s infinite alternate ease-in-out',
        'spin': 'spin 1s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.3s ease',
        'slowPulse': 'slowPulse 3s infinite',
      },
      keyframes: {
        pulse: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.05)' },
        },
        spin: {
          'to': { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slowPulse: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.6' },
        }
      },
      transitionProperty: {
        'theme': 'background-color, color, border-color',
      }
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
