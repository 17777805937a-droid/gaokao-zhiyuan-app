import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
        },
        gold: {
          DEFAULT: 'var(--color-gold)',
          light: 'var(--color-gold-light)',
        },
        green: {
          DEFAULT: 'var(--color-green)',
          light: 'var(--color-green-light)',
          dark: 'var(--color-green-dark)',
        },
        blue: {
          DEFAULT: 'var(--color-blue)',
          light: 'var(--color-blue-light)',
        },
        red: {
          DEFAULT: 'var(--color-red)',
          light: 'var(--color-red-light)',
        },
        teal: {
          DEFAULT: 'var(--color-teal)',
          light: 'var(--color-teal-light)',
        },
        rush: {
          DEFAULT: 'var(--color-rush)',
          bg: 'var(--color-rush-bg)',
        },
        stable: {
          DEFAULT: 'var(--color-stable)',
          bg: 'var(--color-stable-bg)',
        },
        preserve: {
          DEFAULT: 'var(--color-preserve)',
          bg: 'var(--color-preserve-bg)',
        },
        cushion: {
          DEFAULT: 'var(--color-cushion)',
          bg: 'var(--color-cushion-bg)',
        },
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
      },
      textColor: {
        1: 'var(--color-text-1)',
        2: 'var(--color-text-2)',
        3: 'var(--color-text-3)',
      },
      borderColor: {
        DEFAULT: 'var(--color-border)',
        divider: 'var(--color-divider)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
        button: 'var(--radius-button)',
        tag: 'var(--radius-tag)',
        input: 'var(--radius-input)',
      },
      fontFamily: {
        sans: ['-apple-system', 'PingFang SC', 'SF Pro Text', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
