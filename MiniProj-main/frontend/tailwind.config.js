/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: '#590907',
          hover: '#420605',
          light: '#731210',
          dark: '#380403',
        },
        beige: {
          DEFAULT: '#E8D2B5',
          subtle: '#F7EFE4',
          paper: '#FDFBF7',
        },
        sage: {
          DEFAULT: '#A5A79B',
          soft: '#D9DBD3',
          light: '#ECEEE9',
          border: 'rgba(165, 167, 155, 0.45)',
        },
        ink: {
          DEFAULT: '#1C1E1B',
          muted: '#545850',
          light: '#70756B',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        sans: ['Poppins', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
