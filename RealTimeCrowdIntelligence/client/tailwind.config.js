/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#1f2933',
        steel: '#536171',
        mist: '#f4f7f8',
        signal: '#dc2626',
        civic: '#0f766e',
        amberline: '#d97706'
      },
      boxShadow: {
        panel: '0 12px 30px rgba(31, 41, 51, 0.08)'
      }
    }
  },
  plugins: []
};
