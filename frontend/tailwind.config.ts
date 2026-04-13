import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: "#EAE8E2",
        "surface-hover": "rgba(168, 162, 158, 0.2)",
        "surface-active": "rgba(168, 162, 158, 0.4)",
        border: "rgba(168, 162, 158, 0.4)",
        "border-subtle": "rgba(168, 162, 158, 0.2)",
        accent: "#1c1917",
        "accent-hover": "#292524",
        "text-primary": "#1c1917",
        "text-secondary": "#57534e",
        "text-muted": "#a8a29e",
      },
      fontFamily: {
        display: ['"DM Sans"', "sans-serif"],
        body: ['"Inter"', "sans-serif"],
      },
      letterSpacing: {
        display: "-0.05em",
        tight: "-0.025em",
      },
      animation: {
        "reveal-flow":
          "revealFlow 1.2s cubic-bezier(0.2, 0.6, 0.2, 1) both",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        revealFlow: {
          "0%": {
            opacity: "0",
            transform: "translateY(40px) scale(0.98)",
            filter: "blur(12px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
            filter: "blur(0)",
          },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
