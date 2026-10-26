import localFont from "next/font/local";

// Altone, a família oficial da BORA. É a mesma que a BORA Experience
// (/ppt-somma-bora) já usa como fonte local; a licença de uso web ainda não
// foi confirmada com a BORA.
export const altone = localFont({
  src: [
    { path: "./fonts/Altone-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Altone-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Altone-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Altone-Heavy.ttf", weight: "900", style: "normal" },
    { path: "./fonts/Altone-HeavyOblique.ttf", weight: "900", style: "italic" },
  ],
  variable: "--font-altone",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});
