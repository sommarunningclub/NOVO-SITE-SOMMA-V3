import { ImageResponse } from "next/og";

export const alt = "Meeting Técnico | Maratona Monumental de Brasília 2026, com SOMMA Club e BORA Assessoria";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagem de compartilhamento, desenhada em código: preto, branco e o laranja do SOMMA. */
export default function Imagem() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#080808", color: "#fff", padding: 64, position: "relative" }}>
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0 }}>
          <path d="M-20 560 C 160 560, 200 430, 360 436 S 520 560, 680 500 S 780 250, 930 262 S 1060 380, 1130 210 S 1180 110, 1230 100" fill="none" stroke="#FF2C03" strokeWidth="4" strokeLinecap="round" />
          <circle cx="1130" cy="210" r="10" fill="#FF2C03" />
        </svg>
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 6, color: "#FF2C03" }}>SOMMA CLUB × BORA ASSESSORIA</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 170, fontWeight: 900, lineHeight: 0.9, letterSpacing: -6 }}>MEETING</div>
          <div style={{ display: "flex", fontSize: 170, fontWeight: 900, lineHeight: 0.9, letterSpacing: -6 }}>
            TÉCNICO<span style={{ color: "#FF2C03" }}>.</span>
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, marginTop: 26, letterSpacing: 1 }}>MARATONA MONUMENTAL DE BRASÍLIA 2026</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#c8c8c8" }}>Você treinou para a prova. Agora conheça o caminho.</div>
      </div>
    ),
    size
  );
}
