/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // Deep dark palette
        base:    '#0d0d0f',
        surface: '#141417',
        panel:   '#1a1a1f',
        border:  '#2a2a32',
        muted:   '#3a3a45',
        // Accent — electric indigo
        accent:  { DEFAULT: '#7c6dfa', hover: '#6b5ce7', light: '#a89bfb' },
        // Text scale
        ink:     { 1: '#f0eff5', 2: '#a8a6b8', 3: '#6e6c82' },
        // Status
        online:  '#22c55e',
        danger:  '#f87171',
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(124,109,250,0.25)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
      keyframes: {
        'slide-up':   { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'fade-in':    { from: { opacity: 0 }, to: { opacity: 1 } },
        'dot-bounce': { '0%,80%,100%': { transform: 'scale(0)' }, '40%': { transform: 'scale(1)' } },
        'pulse-dot':  { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
      },
      animation: {
        'slide-up':   'slide-up 0.2s ease-out',
        'fade-in':    'fade-in 0.15s ease-out',
        'dot-1': 'dot-bounce 1.4s infinite ease-in-out both',
        'dot-2': 'dot-bounce 1.4s 0.16s infinite ease-in-out both',
        'dot-3': 'dot-bounce 1.4s 0.32s infinite ease-in-out both',
      },
    },
  },
  plugins: [],
}
