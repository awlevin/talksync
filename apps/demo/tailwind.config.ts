import type { Config } from "tailwindcss";

const config = {
  darkMode: "media",
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    extend: {
      colors: {
        bg: "hsl(var(--bg) / <alpha-value>)",
        panel: "hsl(var(--panel) / <alpha-value>)",
        sunken: "hsl(var(--sunken) / <alpha-value>)",
        ink: "hsl(var(--ink) / <alpha-value>)",
        "ink-2": "hsl(var(--ink-2) / <alpha-value>)",
        rule: "hsl(var(--rule) / <alpha-value>)",
        rust: "hsl(var(--rust) / <alpha-value>)",
        amber: "hsl(var(--amber) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      maxWidth: {
        page: "78rem",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
