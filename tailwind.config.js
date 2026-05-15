/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        text: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)'
        },
        pastel: {
          pink: '#FFE5EC',
          blue: '#D4E7FF',
          purple: '#E5D4FF',
          yellow: '#FFF4D4',
          green: '#D4FFE5',
          peach: '#FFD4D4',
        }
      },
    },
  },
  plugins: [],
}
