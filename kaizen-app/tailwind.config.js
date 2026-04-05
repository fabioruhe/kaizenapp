/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        build: {
          DEFAULT: '#22c55e',
          light: '#bbf7d0',
          dark: '#15803d',
        },
        quit: {
          DEFAULT: '#ef4444',
          light: '#fecaca',
          dark: '#b91c1c',
        },
        priority: {
          high: '#ef4444',
          medium: '#eab308',
          low: '#6b7280',
        },
      },
    },
  },
  plugins: [],
};
