import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#7c3aed",
        "accent-2": "#4f46e5",
        "accent-light": "#a78bfa",
        gold: "#f59e0b",
        "gold-light": "#fbbf24",
        green: "#10b981",
        "green-light": "#34d399",
      },
    },
  },
  plugins: [],
};

export default config;
