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
        primary: '#00d4aa',
        danger: '#ff6b6b',
        warning: '#fbbf24',
      }
    },
  },
  plugins: [],
}