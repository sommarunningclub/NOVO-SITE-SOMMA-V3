import { ImageResponse } from "next/og";
import { EVENT, UNITS } from "@/lib/desafio-esteiras/event.config";

export const alt = "Desafio das Esteiras · Evolve + SOMMA Club · 19.08 · 19h";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imagem social do evento, gerada em código para não sair de sincronia com o
 * `event.config.ts`. A fonte vem do Google Fonts; se o fetch falhar, o
 * ImageResponse cai na fonte embutida — a imagem sai, só com menos caráter.
 */
async function carregarFonte(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Archivo:wght@800&display=swap",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    ).then((r) => r.text());

    const url = css.match(/src:\s*url\((https:\/\/[^)]+\.(?:ttf|woff))\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image() {
  const fonte = await carregarFonte();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08080a",
          color: "#f2f0ec",
          fontFamily: fonte ? "Archivo" : "sans-serif",
          padding: 64,
          position: "relative",
        }}
      >
        {/* faixa de energia */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, display: "flex" }}>
          <div style={{ flex: 1, background: "#e0261b" }} />
          <div style={{ flex: 1, background: "#ff2c04" }} />
        </div>

        {/* halo */}
        <div
          style={{
            position: "absolute",
            top: -160,
            left: -120,
            width: 620,
            height: 620,
            borderRadius: 999,
            background: "#e0261b",
            opacity: 0.28,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220,
            right: -140,
            width: 560,
            height: 560,
            borderRadius: 999,
            background: "#ff2c04",
            opacity: 0.2,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 24,
              letterSpacing: 6,
              color: "#ff2c04",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            {EVENT.realizacao}
          </div>

          <div
            style={{
              fontSize: 128,
              fontWeight: 800,
              lineHeight: 0.86,
              letterSpacing: -4,
              marginTop: 26,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>DESAFIO</span>
            <span>DAS ESTEIRAS</span>
          </div>

          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: "#ff2c04",
              marginTop: 30,
              letterSpacing: -1,
              display: "flex",
            }}
          >
            4 UNIDADES. 1 DESAFIO.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ height: 2, background: "rgba(242,240,236,0.25)", display: "flex" }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: 22,
              fontSize: 26,
            }}
          >
            <span style={{ letterSpacing: 3 }}>
              {EVENT.dataLabel} · {EVENT.horaLabel}
            </span>
            <span style={{ color: "rgba(242,240,236,0.65)", fontSize: 22, letterSpacing: 2 }}>
              {UNITS.map((u) => u.curto.toUpperCase()).join(" · ")}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonte
        ? [{ name: "Archivo", data: fonte, weight: 800 as const, style: "normal" as const }]
        : undefined,
    }
  );
}
