/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF7F2',
        'warm-white': '#FFFDFC',
        terracotta: '#A65D43',
        charcoal: '#252321',
        olive: '#727462',
        sand: '#DDD3C5',
      },
    },
  },
  plugins: [],
};
