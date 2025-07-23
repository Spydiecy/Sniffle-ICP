/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        bounce: 'bounce 1s infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      colors: {
        icp: {
          teal: '#29b6af',
          'teal-light': '#3ddbd9',
          'teal-dark': '#1e9e98',
          gradient: {
            start: '#29b6af',
            end: '#1a7f7a',
          },
          bg: '#f0f9f9',
          'bg-light': '#e0f2f1',
          'bg-dark': '#b2dfdb',
        },
      },
      backgroundImage: {
        'icp-gradient': 'linear-gradient(135deg, #29b6af, #1a7f7a)',
        'icp-gradient-hover': 'linear-gradient(135deg, #3ddbd9, #29b6af)',
      },
    },
  },
  plugins: [],
}