/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172033',
        mist: '#f5f7fb',
        lilac: '#e8e5ff',
        coral: '#ff8066'
      }
    }
  },
  plugins: []
}
