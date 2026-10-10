import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official Mudra 5-Color System
        graphite: {
          DEFAULT: "#353535",
          light: "#454545",
          dark: "#262626",
        },
        stormyTeal: {
          DEFAULT: "#3c6e71",
          light: "#4e8b8f",
          dark: "#2e5456",
        },
        alabaster: {
          DEFAULT: "#d9d9d9",
          light: "#ebebeb",
          dark: "#bfbfbf",
        },
        yaleBlue: {
          DEFAULT: "#284b63",
          light: "#346282",
          dark: "#1c3546",
        },
        // Semantic financial colors
        market: {
          gain: "#10b981", // Emerald green for stock rise
          loss: "#f43f5e", // Rose for stock drop
          neutral: "#94a3b8",
          warning: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
