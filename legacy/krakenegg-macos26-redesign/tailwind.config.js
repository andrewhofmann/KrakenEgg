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
        // macOS 26 Ultra-Modern Color Palette
        mac26: {
          // Ultra-clean backgrounds with subtle gradients
          bg: {
            primary: {
              light: '#ffffff',
              dark: '#0a0a0a'
            },
            secondary: {
              light: '#fafafa',
              dark: '#111111'
            },
            tertiary: {
              light: '#f5f5f7',
              dark: '#1a1a1a'
            },
            panel: {
              light: 'rgba(255, 255, 255, 0.8)',
              dark: 'rgba(26, 26, 26, 0.8)'
            },
            glass: {
              light: 'rgba(255, 255, 255, 0.7)',
              dark: 'rgba(0, 0, 0, 0.7)'
            }
          },
          // Ultra-refined text colors
          text: {
            primary: {
              light: '#1d1d1f',
              dark: '#f5f5f7'
            },
            secondary: {
              light: '#6e6e73',
              dark: '#a1a1a6'
            },
            tertiary: {
              light: '#8e8e93',
              dark: '#636366'
            },
            accent: {
              light: '#007aff',
              dark: '#0a84ff'
            }
          },
          // Sophisticated borders and dividers
          border: {
            primary: {
              light: 'rgba(0, 0, 0, 0.08)',
              dark: 'rgba(255, 255, 255, 0.08)'
            },
            secondary: {
              light: 'rgba(0, 0, 0, 0.04)',
              dark: 'rgba(255, 255, 255, 0.04)'
            },
            focus: {
              light: 'rgba(0, 122, 255, 0.3)',
              dark: 'rgba(10, 132, 255, 0.3)'
            }
          },
          // Apple's signature colors with modern twist
          blue: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            500: '#007aff',
            600: '#0056cc',
            700: '#003d99',
            900: '#001d4d'
          },
          purple: {
            50: '#faf5ff',
            500: '#af52de',
            600: '#8e3ab8'
          },
          green: {
            50: '#f0fdf4',
            500: '#30d158',
            600: '#28a745'
          },
          orange: {
            50: '#fff7ed',
            500: '#ff9500',
            600: '#e6850e'
          },
          red: {
            50: '#fef2f2',
            500: '#ff3b30',
            600: '#dc2626'
          },
          // Ultra-subtle selection and hover states
          selection: {
            light: 'rgba(0, 122, 255, 0.1)',
            dark: 'rgba(10, 132, 255, 0.15)'
          },
          hover: {
            light: 'rgba(0, 0, 0, 0.03)',
            dark: 'rgba(255, 255, 255, 0.03)'
          }
        }
      },
      fontFamily: {
        'system': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Courier New', 'monospace']
      },
      fontSize: {
        'xs': ['11px', { lineHeight: '16px', letterSpacing: '0.005em' }],
        'sm': ['12px', { lineHeight: '18px', letterSpacing: '0.0025em' }],
        'base': ['13px', { lineHeight: '20px', letterSpacing: '0em' }],
        'lg': ['14px', { lineHeight: '22px', letterSpacing: '-0.0025em' }],
        'xl': ['16px', { lineHeight: '24px', letterSpacing: '-0.005em' }],
        '2xl': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        '3xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.015em' }]
      },
      fontWeight: {
        'ultralight': '100',
        'thin': '200',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'heavy': '800',
        'black': '900'
      },
      borderRadius: {
        'none': '0',
        'xs': '2px',
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'full': '9999px'
      },
      spacing: {
        '0.5': '2px',
        '1.5': '6px',
        '2.5': '10px',
        '3.5': '14px',
        '4.5': '18px',
        '5.5': '22px',
        '6.5': '26px',
        '7.5': '30px',
        '8.5': '34px',
        '9.5': '38px',
        '18': '72px',
        '22': '88px',
        '26': '104px',
        '30': '120px'
      },
      boxShadow: {
        'mac26-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.02), 0 1px 3px 0 rgba(0, 0, 0, 0.03)',
        'mac26': '0 4px 8px 0 rgba(0, 0, 0, 0.04), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        'mac26-md': '0 8px 16px 0 rgba(0, 0, 0, 0.06), 0 4px 8px 0 rgba(0, 0, 0, 0.03)',
        'mac26-lg': '0 16px 32px 0 rgba(0, 0, 0, 0.08), 0 8px 16px 0 rgba(0, 0, 0, 0.04)',
        'mac26-xl': '0 24px 48px 0 rgba(0, 0, 0, 0.1), 0 12px 24px 0 rgba(0, 0, 0, 0.05)',
        'mac26-glow': '0 0 0 1px rgba(0, 122, 255, 0.1), 0 0 20px rgba(0, 122, 255, 0.15)',
        'mac26-inner': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)'
      },
      backdropBlur: {
        'mac26': '20px',
        'mac26-lg': '40px'
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        bounceSubtle: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' }
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 122, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 122, 255, 0.4)' }
        }
      }
    },
  },
  plugins: [],
}