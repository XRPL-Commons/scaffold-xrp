/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "../../packages/ui/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#23292F",
        secondary: "#384552",
        accent: "#4f46e5",
        xrpl: "#00AAE4",
      },
    },
  },
  plugins: [],
};
