/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // macOS System Colors (Dark Mode optimized)
        macos: {
          bg: "rgba(30, 30, 32, 0.4)", // Highly transparent for vibrancy
          sidebar: "rgba(40, 40, 45, 0.3)",
          active: "#007AFF", // System Blue
          activeHover: "#0062C4",
          text: "#FFFFFF",
          textSecondary: "rgba(255, 255, 255, 0.55)",
          border: "rgba(255, 255, 255, 0.08)", // Ultra-subtle
          hover: "rgba(255, 255, 255, 0.05)",
          selected: "rgba(0, 122, 255, 0.2)",
          glass: "rgba(20, 20, 20, 0.6)" // Base glass tint
        }
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "Menlo",
          "Monaco",
          "Courier New",
          "monospace",
        ],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
