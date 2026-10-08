/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0f0f0f',
        darker: '#0a0a0a',
        accent: '#8b5cf6', // purple
      }
    },
  },
  plugins: [],
}
