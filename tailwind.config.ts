import { nextui } from '@nextui-org/theme'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
    colors: {
      light: {
        50: '#FFFFFF',
        100: '#F5F2F2',
        200: '#E5D9D9',
        300: '#9E7878',
        400: '#171212',
        500: '#C73838',
      },
    },
    screens: {
      '3xl': '2560',
      '2xl': '1440px',
      xl: '1024px',
      lg: '768px',
      md: '425px',
      sm: '375px',
      xs: '320px',
    },
    transitionDuration: {
      '1000': '1000ms',
      '2000': '2000ms',
      '3000': '3000ms',
      '4000': '4000ms',
      '5000': '5000ms',
    },
  },
  darkMode: 'class',
  plugins: [nextui()],
}
export default config
