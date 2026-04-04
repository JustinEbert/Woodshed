import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#4ab8d4',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
