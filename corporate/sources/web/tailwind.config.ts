import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#FAFAF8',
          /** Tiers — depth via tonal layering (no hard section borders) */
          'container-lowest': '#F8F6F1',
          'container-low': '#EEEBE4',
          container: '#E4E0D6',
          'container-high': '#DCD8CC',
          'container-highest': '#FFFFFF',
          /** Aliases for existing components */
          muted: '#EEEBE4',
          elevated: '#FFFFFF',
          /** Dark band = authoritative primary foundation */
          dark: '#00333C',
          'dark-elevated': '#004B57',
        },
        primary: {
          DEFAULT: '#00333C',
          container: '#004B57',
          light: '#005566',
          dark: '#00292F',
          foreground: '#FFFFFF',
        },
        /** Soft amber — tertiary_fixed_dim; use sparingly for focus */
        accent: {
          DEFAULT: '#E9C176',
          light: '#F0D49A',
          dark: '#D4A85A',
          muted: 'rgba(233, 193, 118, 0.15)',
          foreground: '#00333C',
        },
        secondary: {
          DEFAULT: '#5CB8C4',
          light: '#7BC9D3',
          dark: '#3D9DAA',
          muted: 'rgba(92, 184, 196, 0.14)',
          container: '#D4EEF1',
          'on-container': '#00333C',
        },
        neutral: {
          50: '#FAFAF8',
          100: '#F3F1EC',
          200: '#E5E2DB',
          300: '#C8C4BB',
          400: '#9B9688',
          500: '#757778',
          600: '#5A5B5C',
          700: '#3D3E3F',
          800: '#252627',
          900: '#131415',
        },
        /** Ghost / blueprint lines — never 100% opaque dividers */
        ghost: {
          line: 'rgba(0, 51, 60, 0.15)',
          'line-strong': 'rgba(0, 51, 60, 0.2)',
        },
        /** Tinted “on surface” for ambient shadows */
        on_surface: {
          DEFAULT: '#1E3A40',
        },
        border: {
          DEFAULT: 'rgba(0, 51, 60, 0.12)',
          subtle: 'rgba(0, 51, 60, 0.08)',
          dark: 'rgba(0, 51, 60, 0.22)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': [
          '3.5rem',
          { lineHeight: '1.08', letterSpacing: '-0.02em', fontWeight: '700' },
        ],
        'headline-lg': [
          '2rem',
          { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' },
        ],
        'title-md': ['1.125rem', { lineHeight: '1.45', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.6' }],
        'label-md': [
          '0.75rem',
          { lineHeight: '1.25', letterSpacing: '0.08em', fontWeight: '600' },
        ],
      },
      boxShadow: {
        ambient:
          '0 24px 48px -12px rgba(30, 58, 64, 0.06), 0 12px 24px -8px rgba(30, 58, 64, 0.04)',
        'ambient-float':
          '0 32px 64px -16px rgba(30, 58, 64, 0.08), 0 16px 32px -12px rgba(30, 58, 64, 0.05)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
