import { ImageResponse } from "next/og";
import { EVENT_CAPACITY, TICKET_PRICE, distanciasLabel, EVENT_TIME, EVENT } from "@/lib/sunday-social-run/event.config";

export const alt = "SUNDAY SOCIAL RUN · SOMMA Club × Santa Monica Gastrobar · powered by Hype On Club";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imagem social gerada em código, para não sair de sincronia com o config: se o
 * preço ou a capacidade mudarem lá, o card do WhatsApp muda junto. Se o fetch da
 * fonte falhar, o ImageResponse cai na fonte embutida — a imagem sai, só com
 * menos caráter.
 */
async function carregarFonte(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@800&display=swap",
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
          background: "linear-gradient(150deg, #fdfaf4 0%, #f4ead8 55%, #ceeefe 100%)",
          color: "#141e09",
          fontFamily: fonte ? "Bricolage" : "sans-serif",
          padding: 64,
          position: "relative",
        }}
      >
        {/* halo laranja da corrida */}
        <div
          style={{
            position: "absolute",
            top: -300,
            right: -220,
            width: 620,
            height: 620,
            borderRadius: 620,
            background: "rgba(255,44,4,0.28)",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, textTransform: "uppercase" }}>
            SOMMA Club × Santa Monica Gastrobar
          </div>
          <div style={{ display: "flex", fontSize: 20, letterSpacing: 3, opacity: 0.6 }}>
            powered by Hype On Club
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 132, lineHeight: 0.86, letterSpacing: -4, fontWeight: 800 }}>
            SUNDAY
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 132,
              lineHeight: 0.86,
              letterSpacing: -4,
              fontWeight: 800,
              color: "#ff2c04",
            }}
          >
            SOCIAL RUN
          </div>
          <div style={{ display: "flex", fontSize: 40, marginTop: 18, opacity: 0.75 }}>Run. Connect. Stay.</div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "1px solid rgba(20,30,9,0.18)",
            paddingTop: 24,
            fontSize: 26,
          }}
        >
          <div style={{ display: "flex", gap: 32 }}>
            <div style={{ display: "flex" }}>{EVENT_CAPACITY} SPOTS</div>
            <div style={{ display: "flex" }}>R$ {TICKET_PRICE}</div>
            <div style={{ display: "flex" }}>{`${EVENT.diaSemana.slice(0, 3).toUpperCase()} · ${EVENT_TIME}`}</div>
            <div style={{ display: "flex" }}>{distanciasLabel.toUpperCase()}</div>
            <div style={{ display: "flex" }}>BRASÍLIA</div>
          </div>
          <div style={{ display: "flex", color: "#ff2c04" }}>AFTER PACE</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonte
        ? [{ name: "Bricolage", data: fonte, style: "normal" as const, weight: 800 as const }]
        : [],
    }
  );
}
