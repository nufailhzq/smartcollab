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
          pink: "var(--ukm-pink)",
          purple: "var(--ukm-purple)",
          green: "var(--ukm-green)",
          amber: "var(--ukm-amber)",
          mint: "var(--ukm-mint)",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Lexend", "Plus Jakarta Sans", "ui-sans-serif", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.5" }],     /* 12px */
        sm: ["0.875rem", { lineHeight: "1.55" }],   /* 14px */
        base: ["0.9375rem", { lineHeight: "1.6" }], /* 15px */
        md: ["1rem", { lineHeight: "1.6" }],        /* 16px */
        lg: ["1.125rem", { lineHeight: "1.55" }],   /* 18px */
        xl: ["1.25rem", { lineHeight: "1.5" }],     /* 20px */
        "2xl": ["1.5rem", { lineHeight: "1.4" }],   /* 24px */
        "3xl": ["1.875rem", { lineHeight: "1.3" }], /* 30px */
        "4xl": ["2.25rem", { lineHeight: "1.25" }], /* 36px */
        "5xl": ["3rem", { lineHeight: "1.15" }],    /* 48px */
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float-y": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(14, 165, 233, 0)" },
          "50%": { boxShadow: "0 0 24px 4px rgba(14, 165, 233, 0.25)" },
        },
        "letter-bounce": {
          "0%, 60%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-22px) scale(1.06)" },
        },
        "shadow-pulse": {
          "0%, 60%, 100%": { transform: "scaleX(1)", opacity: "0.55" },
          "30%": { transform: "scaleX(0.55)", opacity: "0.2" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "60%": { opacity: "1", transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
        "scale-in": "scale-in 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-up": "slide-up 320ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "float-y": "float-y 4s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2.4s ease-in-out infinite",
        "letter-bounce": "letter-bounce 1.4s cubic-bezier(0.34, 1.56, 0.64, 1) infinite",
        "shadow-pulse": "shadow-pulse 1.4s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "wiggle": "wiggle 0.6s ease-in-out",
        "pop-in": "pop-in 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "shimmer": "shimmer 2.2s linear infinite",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 39, 68, 0.05), 0 1px 3px rgba(15, 39, 68, 0.04)",
        lift: "0 12px 30px -10px rgba(15, 39, 68, 0.18), 0 4px 12px -4px rgba(15, 39, 68, 0.08)",
        "lift-lg":
          "0 25px 50px -12px rgba(15, 39, 68, 0.22), 0 10px 20px -8px rgba(15, 39, 68, 0.12)",
        glow: "0 0 0 1px rgba(14, 165, 233, 0.25), 0 10px 40px -10px rgba(14, 165, 233, 0.35)",
        "glow-orange":
          "0 0 0 1px rgba(249, 115, 22, 0.3), 0 10px 30px -8px rgba(249, 115, 22, 0.45)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
