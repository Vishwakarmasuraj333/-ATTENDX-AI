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
        midnight: {
          DEFAULT: '#101827',
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          900: '#101827',
          950: '#0b101b',
        },
        deepNavy: {
          DEFAULT: '#172B46',
          light: '#233d60',
          dark: '#0f1c2e',
        },
        aiTeal: {
          DEFAULT: '#13B8A6',
          light: '#2dd4bf',
          dark: '#0f766e',
        },
        electricBlue: {
          DEFAULT: '#55A6FF',
          light: '#7ebbff',
          dark: '#2563eb',
        },
        successGreen: {
          DEFAULT: '#22C987',
          light: '#4ade80',
          dark: '#16a34a',
        },
        warningAmber: {
          DEFAULT: '#F5A524',
          light: '#fbbf24',
          dark: '#d97706',
        },
        dangerRed: {
          DEFAULT: '#F05D6C',
          light: '#f87171',
          dark: '#dc2626',
        },
        canvasBg: '#F4F7FB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)',
        'soft': '0 4px 12px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'glow-teal': '0 0 15px rgba(19, 184, 166, 0.35)',
        'glow-blue': '0 0 15px rgba(85, 166, 255, 0.35)',
      }
    },
  },
  plugins: [],
}

