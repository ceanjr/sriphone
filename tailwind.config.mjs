/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          white: '#ffffff',
          black: '#000000',
          gray: '#e0e0e0',
          'dark-bg': '#030303',
        },
        admin: {
          bg: '#000000',
          'bg-secondary': '#0a0a0a',
          card: '#1a1a1a',
          border: '#2a2a2a',
        },
      },
    },
  },
  plugins: [],
}
