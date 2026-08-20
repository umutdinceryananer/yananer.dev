/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#e4e4e4',
            a: {
              color: '#9c9c9c',
              '&:hover': {
                color: '#b9b9b9',
              },
            },
            h1: {
              color: '#e4e4e4',
            },
            h2: {
              color: '#e4e4e4',
            },
            h3: {
              color: '#e4e4e4',
            },
            h4: {
              color: '#e4e4e4',
            },
            strong: {
              color: '#e4e4e4',
            },
            code: {
              color: '#e4e4e4',
              backgroundColor: '#1c1c1c',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 