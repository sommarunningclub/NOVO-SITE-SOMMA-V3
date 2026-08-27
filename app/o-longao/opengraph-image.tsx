import { ImageResponse } from "next/og";
import { EVENTO, PREMIACAO_TOTAL } from "@/lib/o-longao/config";

export const alt = "O Longão · O único que dura 24 horas · Evolve + Somma Club · Star Trac";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imagem social do evento, gerada em código para não sair de sincronia com o
 * `config.ts`. A fonte vem do Google Fonts; se o fetch falhar, o
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
          background: "#050508",
          color: "#f2f0ec",
          fontFamily: fonte ? "Archivo" : "sans-serif",
          padding: 64,
          position: "relative",
        }}
      >
        {/* faixa de timing: largada laranja, cronometragem âmbar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, display: "flex" }}>
          <div style={{ flex: 1, background: "#ff2c04" }} />
          <div style={{ flex: 1, background: "#ffc400" }} />
        </div>

        {/*
          Halos de canto. O satori não aplica `filter: blur`, então o círculo
          sai com a borda dura: ficam nos cantos e bem apagados, para dar
          profundidade sem cortar a headline ao meio.
        */}
        <div
          style={{
            position: "absolute",
            top: -300,
            left: -240,
            width: 620,
            height: 620,
            borderRadius: 999,
            background: "#ff2c04",
            opacity: 0.14,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -320,
            right: -220,
            width: 560,
            height: 560,
            borderRadius: 999,
            background: "#ffc400",
            opacity: 0.08,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 24,
              letterSpacing: 6,
              color: "#ffc400",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            EVOLVE + SOMMA CLUB · POWERED BY STAR TRAC
          </div>

          <div
            style={{
              fontSize: 170,
              fontWeight: 800,
              lineHeight: 0.86,
              letterSpacing: -6,
              marginTop: 30,
              display: "flex",
            }}
          >
            O LONGÃO
          </div>

          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: "#ff2c04",
              marginTop: 28,
              letterSpacing: -1,
              display: "flex",
            }}
          >
            {EVENTO.mote.toUpperCase()}
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
            <span style={{ letterSpacing: 3 }}>24:00:00 · {EVENTO.cidade.toUpperCase()}, {EVENTO.uf}</span>
            <span style={{ color: "rgba(242,240,236,0.65)", fontSize: 22, letterSpacing: 2 }}>
              R$ {PREMIACAO_TOTAL.toLocaleString("pt-BR")} EM PREMIAÇÃO
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
