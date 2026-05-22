import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde7ff',
          200: '#c3d3ff',
          300: '#9db4ff',
          400: '#7490ff',
          500: '#4f6ef7',
          600: '#3a51ed',
          700: '#2f3fd9',
          800: '#2b35b0',
          900: '#1a1a2e',
          950: '#0d0d1a',
        },
        accent: {
          DEFAULT: '#e94560',
          light:   '#ff6b82',
          dark:    '#c02040',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [forms],
}

export default config
