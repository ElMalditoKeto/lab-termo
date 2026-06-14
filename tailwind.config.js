/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cc: {
          red:   '#E61C24',
          dark:  '#CC0000',
          black: '#111111',
        },
      },
    },
  },
  plugins: [],
}