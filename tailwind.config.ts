import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Identidade SOMMA Club
        primary: {
          DEFAULT: "#FF2C03",
          hover: "#FB4C00",
        },
        accent: "#EF4444",
        ink: "#0A0A0A",
        muted: "#737373",
        dark: {
          bg: "#000000",
          card: "#0E0E0E",
          text: "#FFFFFF",
        },
        light: "#F5F5F5",
        // Paleta do Wings das Atléticas (Wings for Life x Red Bull), usada só
        // em /wings-das-atleticas-2026 e /wings/ranking.
        wfl: {
          red: "#E30D3F",
          navy: "#022755",
          yellow: "#F6E331",
          dark: "#34383B",
          card: "#ECEEF3",
          border: "#DEE1E7",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        // Condensada, usada nos decks comerciais (ex.: /ppt-michelob)
        display: ["var(--font-display)", "var(--font-geist-sans)", "sans-serif"],
        // Ultra Balance Challenge: condensada nos títulos, limpa nos textos
        title: ["var(--font-ubc-title)", "var(--font-display)", "sans-serif"],
        copy: ["var(--font-ubc-body)", "var(--font-geist-sans)", "sans-serif"],
      },
      maxWidth: {
        container: "1200px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
