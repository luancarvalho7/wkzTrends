/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F8F8F8',
          100: '#F0F0F0',
          200: '#E0E0E0',
          300: '#C0C0C0',
          400: '#808080',
          500: '#404040',
          600: '#202020',
          700: '#101010',
          800: '#080808',
          900: '#000000',
        },
        secondary: {
          50: '#F8F8F8',
          100: '#F0F0F0',
          200: '#E0E0E0',
          300: '#C0C0C0',
          400: '#808080',
          500: '#404040',
          600: '#202020',
          700: '#101010',
          800: '#080808',
          900: '#000000',
        },
        accent: {
          50: '#F8F8F8',
          100: '#F0F0F0',
          200: '#E0E0E0',
          300: '#C0C0C0',
          400: '#808080',
          500: '#404040',
          600: '#202020',
          700: '#101010',
          800: '#080808',
          900: '#000000',
        },
      },
      boxShadow: {
        'card': '0 2px 20px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      maxHeight: {
        '128': '32rem',
      },
    },
  },
  plugins: [],
};