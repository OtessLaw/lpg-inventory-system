/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
      },
      colors: {
        gas: {
          dark: '#090d16',
          card: '#111827',
          border: '#1f2937',
          orange: '#f97316',
          amber: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};
