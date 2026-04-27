/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "edf-blue": "#183F80",
        "edf-light": "#7DA8C9",
        "o-accent": "var(--accent)",
        "o-accent-ink": "var(--accent-ink)",
        "o-accent-soft": "var(--accent-soft)",
        "o-accent-line": "var(--accent-line)",
        "o-bg": "var(--bg)",
        "o-bg-soft": "var(--bg-soft)",
        "o-bg-panel": "var(--bg-panel)",
        "o-bg-sunken": "var(--bg-sunken)",
        "o-ink": "var(--ink)",
        "o-ink-2": "var(--ink-2)",
        "o-ink-3": "var(--ink-3)",
        "o-ink-4": "var(--ink-4)",
        "o-line": "var(--line)",
        "o-line-2": "var(--line-2)",
        "o-sky": "var(--sky)",
        "o-sky-soft": "var(--sky-soft)",
        "o-violet": "var(--violet)",
        "o-violet-soft": "var(--violet-soft)",
        "o-amber": "var(--amber)",
        "o-amber-soft": "var(--amber-soft)",
        "o-emerald": "var(--emerald)",
        "o-emerald-soft": "var(--emerald-soft)",
        "o-rose": "var(--rose)",
        "o-rose-soft": "var(--rose-soft)",
      },
      fontFamily: {
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "Menlo", "monospace"],
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
