/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      screens: {
        'xs': '475px', // Extra small screens (under 500px)
        'sidebar': '900px', // Custom breakpoint for sidebar
      },
      colors: {
        // Custom colors for better dark mode support
        'scrollbar-light': '#e5e7eb',
        'scrollbar-dark': '#374151',
        'scrollbar-thumb-light': '#d1d5db',
        'scrollbar-thumb-dark': '#4b5563',
      }
    },
  },
  plugins: [],
}
