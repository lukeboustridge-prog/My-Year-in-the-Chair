import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 600: "#2d61cc", 700: "#234b99" }
      }
    }
  },
  plugins: []
} satisfies Config;
