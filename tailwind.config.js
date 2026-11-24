/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#004626',
          dark: '#0c6038',
          soft: '#a6f4bf',
        },
        alert: {
          DEFAULT: '#791315',
          dark: '#992c29',
          light: '#ffdad6',
        },
        secondary: {
          DEFAULT: '#5b6326',
          soft: '#e0e99d',
        },
        surface: '#f5faff',
        ink: '#0b1e27',
        ink2: '#404941',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
