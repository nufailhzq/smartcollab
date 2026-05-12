import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ukm: {
          navy: "var(--ukm-navy)",
          dark: "var(--ukm-dark)",
          orange: "var(--ukm-orange)",
          "orange-soft": "var(--ukm-orange-soft)",
          red: "var(--ukm-red)",
          teal: "var(--ukm-teal)",
          cyan: "var(--ukm-cyan)",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
