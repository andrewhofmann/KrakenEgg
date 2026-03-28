/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // macOS-inspired color palette
        macos: {
          bg: {
            light: '#ffffff',
            dark: '#1e1e1e',
            panel: {
              light: '#f5f5f7',
              dark: '#2d2d2d'
            }
          },
          text: {
            primary: {
              light: '#1d1d1f',
              dark: '#f5f5f7'
            },
            secondary: {
              light: '#6e6e73',
              dark: '#98989d'
            }
          },
          border: {
            light: '#d2d2d7',
            dark: '#424245'
          },
          blue: '#007aff',
          red: '#ff3b30',
          green: '#30d158',
          orange: '#ff9500',
          purple: '#af52de'
        }
      },
      fontFamily: {
        'system': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      fontSize: {
        'xs': ['11px', '16px'],
        'sm': ['12px', '18px'],
        'base': ['13px', '20px'],
        'lg': ['14px', '22px']
      }
    },
  },
  plugins: [],
}