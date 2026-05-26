import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,html}',
    './components/**/*.{ts,tsx}',
    './index.html',
    './app/**/*.html'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      colors: {
        postbloom: {
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          ink: '#09090b'
        }
      }
    }
  },
  plugins: []
};

export default config;
