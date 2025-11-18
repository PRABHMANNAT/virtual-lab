import { fontFamily } from 'tailwindcss/defaultTheme'
import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' }
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'Space Grotesk', ...fontFamily.sans],
        mono: ['Space Mono', ...fontFamily.mono]
      },
      colors: {
        brand: '#0a0a0a',
        accent: '#f97316'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: `calc(var(--radius) - 6px)`,
        sm: '12px'
      },
      backgroundImage: {
        'grid-glow':
          'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 55%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.05), transparent 60%)'
      },
      boxShadow: {
        aurora: '0 40px 120px rgba(0,0,0,0.7)'
      },
      keyframes: {
        'pulse-soft': {
          '0%,100%': { opacity: 0.6 },
          '50%': { opacity: 1 }
        },
        'float': {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        }
      },
      animation: {
        'pulse-soft': 'pulse-soft 4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite'
      }
    }
  },
  plugins: [tailwindcssAnimate]
}
