/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "edf-blue": "#183F80",
        "edf-light": "#7DA8C9",
      },
      keyframes: {
        "slide-in": {
          from: { transform: "translateX(30px)", opacity: "0" },
          to: { transform: "none", opacity: "1" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
