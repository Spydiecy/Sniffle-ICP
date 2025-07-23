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
        'solana-purple': '#9945FF',
        'solana-purple-light': '#B07AFF',
        'solana-purple-dark': '#7B2BF9',
        'solana-gradient-start': '#9945FF',
        'solana-gradient-end': '#7B2BF9',
      },
      backgroundImage: {
        'solana-gradient': 'linear-gradient(135deg, #9945FF, #7B2BF9)',
        'solana-gradient-hover': 'linear-gradient(135deg, #B07AFF, #9945FF)',
      },
    },
  },
  plugins: [],
}