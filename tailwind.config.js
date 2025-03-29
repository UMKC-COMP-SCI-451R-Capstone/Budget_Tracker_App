/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#033b4a',    // Dark Blue
          dark: '#0f172a',       // Darker blue for dark mode
        },
        secondary: {
          DEFAULT: '#20c997',    // Teal/Green
          dark: '#10b981',       // Slightly darker teal for dark mode
        },
        'bg-primary': {
          DEFAULT: '#f8fafc',    // Light mode background
          dark: '#0f172a',       // Dark mode background
        },
        'text-primary': {
          DEFAULT: '#1e293b',    // Light mode text
          dark: '#f1f5f9',       // Dark mode text
        },
        'text-secondary': {
          DEFAULT: '#64748b',    // Light mode secondary text
          dark: '#94a3b8',       // Dark mode secondary text
        },
        card: {
          DEFAULT: '#ffffff',    // Light mode card
          dark: '#1e293b',       // Dark mode card
        },
        'card-hover': {
          DEFAULT: '#f8fafc',    // Light mode card hover
          dark: '#334155',       // Dark mode card hover
        },
        border: {
          DEFAULT: '#e2e8f0',    // Light mode border
          dark: '#334155',       // Dark mode border
        },
        success: {
          DEFAULT: '#20c997',    // Light mode success
          dark: '#10b981',       // Dark mode success
        },
        error: {
          DEFAULT: '#dc3545',    // Light mode error
          dark: '#ef4444',       // Dark mode error
        },
        warning: {
          DEFAULT: '#ffc107',    // Light mode warning
          dark: '#f59e0b',       // Dark mode warning
        },
        input: {
          DEFAULT: '#ffffff',    // Light mode input
          dark: '#1e293b',       // Dark mode input
        },
        'input-border': {
          DEFAULT: '#e2e8f0',    // Light mode input border
          dark: '#334155',       // Dark mode input border
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-dark': '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
      },
    },
  },
  plugins: [],
};