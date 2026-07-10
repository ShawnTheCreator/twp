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
        background: "var(--background)",
        foreground: "var(--foreground)",
        babyBlue: {
          DEFAULT: "#B2E2F2",
          light: "#E0F4FA",
          dark: "#89CFF0",
        },
        twBlue: {
          DEFAULT: "#0047AB",
          light: "#4169E1",
          dark: "#000080",
        }
      },
      fontFamily: {
        humane: ["Humane", "sans-serif"],
        helvetica: ["Helvetica Neue", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
