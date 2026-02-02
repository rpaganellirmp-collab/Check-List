import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1f4bd6',
          dark: '#1a3cae'
        }
      }
    }
  },
  plugins: []
};

export default config;
