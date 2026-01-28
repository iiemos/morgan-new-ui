/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7c3bed',
        'accent-blue': '#3b82f6',
        'background-light': '#f7f6f8',
        'background-dark': '#0a0a0c',
        'surface-dark': '#13131a',
        'neon-blue': '#00d4ff',
        'glass': 'rgba(49, 35, 72, 0.4)',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        sans: ['Noto Sans', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px'
      },
    },
  },
  plugins: [],
}
