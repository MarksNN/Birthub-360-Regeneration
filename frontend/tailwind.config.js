/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        neon: {
          blue: 'var(--neon-blue)',
          pink: 'var(--neon-pink)',
          gold: 'var(--neon-gold)',
          success: 'var(--neon-success)',
          danger: 'var(--neon-danger)',
          iris: 'var(--neon-iris)'
        }
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        interface: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        control: '12px',
        card: '16px',
        modal: '20px',
        pill: '9999px',
      }
    },
  },
  plugins: [],
}
