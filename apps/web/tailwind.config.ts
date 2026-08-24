import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#261930',      // Primary deep plum
          accent: '#BEFF53',    // Electric Lime Accent
          surface: '#FFFFFF',   // Pure White surface
          elevated: '#F6F5F8',  // Soft elevated light grey
          text: '#0C0C0C',      // Deep text
          muted: '#727272'      // Muted text
        }
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'Arial', 'sans-serif'],
        display: ['var(--font-manrope)', 'Arial', 'sans-serif'],
        body: ['var(--font-manrope)', 'Arial', 'sans-serif']
      },
      borderRadius: {
        'card': '24px',
        'chip': '10px',
        'pill': '9999px'
      },
      boxShadow: {
        'subtle': '0px 0px 6.6px 0px rgba(0, 0, 0, 0.05)',
        'soft': '0px 8px 24px 0px rgba(38, 25, 48, 0.06)'
      }
    }
  },
  plugins: []
};

export default config;
