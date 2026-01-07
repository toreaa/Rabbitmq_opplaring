import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Mørkt tema farger
        'dark': {
          '50': '#f7f7f8',
          '100': '#eeeef0',
          '200': '#d9d9de',
          '300': '#b8b8c1',
          '400': '#91919f',
          '500': '#737384',
          '600': '#5d5d6c',
          '700': '#4c4c58',
          '800': '#41414b',
          '900': '#393941',
          '950': '#1a1a1f',
        },
        'rabbit': {
          'orange': '#ff6600',
          'light': '#ff8533',
          'dark': '#cc5200',
        }
      },
    },
  },
  plugins: [],
}
export default config
