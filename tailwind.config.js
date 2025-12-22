/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#19e65e",
        "background-light": "#f6f8f6",
        "background-dark": "#112116",
        "surface-light": "#ffffff",
        "surface-dark": "#1c3023",
        "text-main-light": "#0e1b12",
        "text-main-dark": "#e8f5e9",
        "text-sub-light": "#4e9767",
        "text-sub-dark": "#8abf9e",
        "border-light": "#e2e8f0",
        "border-dark": "#2f4035",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"],
        "sans": ["Manrope", "Noto Sans", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem", 
        "2xl": "1rem"
      }
    },
  },
  plugins: [],
}
