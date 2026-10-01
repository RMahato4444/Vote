/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(96,165,250,.12), 0 24px 70px rgba(2,8,23,.35)'
      }
    }
  },
  plugins: []
}
