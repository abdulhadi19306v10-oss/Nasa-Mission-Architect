/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#040914',
          900: '#081226',
          850: '#0e1b33',
          800: '#162642',
          700: '#273c5f',
          gold: '#f59e0b',
          cyan: '#38bdf8',
          blue: '#0b3d91',
          radar: '#10b981',
          alert: '#fc3d21'
        },
        nasa: {
          blue: '#0b3d91',
          bright: '#105bd8',
          red: '#fc3d21',
          silver: '#cbd5e1'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
