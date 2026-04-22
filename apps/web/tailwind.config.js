/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "edf-blue": "#183F80",
        "edf-light": "#7DA8C9",
      },
    },
  },
  plugins: [],
};
