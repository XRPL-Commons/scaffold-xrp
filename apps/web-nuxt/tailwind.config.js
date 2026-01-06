/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    '../../packages/ui/**/*.{js,vue,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#23292F',
        secondary: '#384552',
        accent: '#4f46e5',
        xrpl: '#00AAE4',
      },
    },
  },
  plugins: [],
}
