/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',   // İndigo
        secondary: '#10B981', // Zümrüt
        background: '#F3F4F6', // Açık Gri
      },
    },
  },
  plugins: [],
}