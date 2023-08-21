/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    colors: {
      black: '#040404',
      white: '#fefefe',
      orange: '#fd7356',
      grey: '#a3a2a7'
    },
    fontFamily: {
      regular: ['Carbon Regular'],
      bold: ['Carbon Bold']
    },
    fontWeight: {},
    extend: {}
  },
  plugins: []
};
