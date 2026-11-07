import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { PELOTOES } from "@/lib/boracomsomma/config";
import { horarioCurto, partesDaData } from "@/lib/boracomsomma/evento";
import { lerIngresso, qrPng } from "@/lib/boracomsomma/ingresso";

/**
 * Ingresso em PNG 1080x1920 (formato de stories), para baixar e postar.
 * GET /boracomsomma/ingresso/imagem?t=<token do ingresso>
 *
 * As fontes Altone são lidas do disco (next.config inclui a pasta no bundle
 * desta rota), para não ficarem expostas em public/.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERDE = "#CEFF00";
const FONTES = join(process.cwd(), "components/bora/fonts");

async function fonte(arquivo: string) {
  try {
    return await readFile(join(FONTES, arquivo));
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ingresso = await lerIngresso(url.searchParams.get("t"));
  if (!ingresso) return new Response("Ingresso não encontrado", { status: 404 });

  const [pesada, negrito, qr] = await Promise.all([
    fonte("Altone-HeavyOblique.ttf"),
    fonte("Altone-Bold.ttf"),
    qrPng(ingresso.id),
  ]);
  const fonts = [
    ...(pesada ? [{ name: "AltoneHeavy", data: pesada, weight: 900 as const, style: "italic" as const }] : []),
    ...(negrito ? [{ name: "Altone", data: negrito, weight: 700 as const, style: "normal" as const }] : []),
  ];
  const titulo = pesada ? "AltoneHeavy" : "sans-serif";
  const texto = negrito ? "Altone" : "sans-serif";

  const ev = ingresso.evento;
  const d = partesDaData(ev.data);
  const pelotao = ingresso.pelotao
    ? `${ingresso.pelotao.replace("km", " km")}${PELOTOES[ingresso.pelotao] ? ` · ${PELOTOES[ingresso.pelotao].rotulo}` : ""}`
    : "Escolhe no dia";
  const origem = url.origin;
  const nome = ingresso.nome.length > 28 ? `${ingresso.nome.split(/\s+/).slice(0, 2).join(" ")}` : ingresso.nome;

  const dado = (rotulo: string, valor: string) => (
    <div style={{ display: "flex", flexDirection: "column", width: "50%", padding: "18px 0" }}>
      <div style={{ fontFamily: texto, fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: "rgba(0,0,0,0.55)" }}>
        {rotulo}
      </div>
      <div style={{ fontFamily: texto, fontSize: 38, marginTop: 6, lineHeight: 1.15, color: "#000", paddingRight: 16 }}>{valor}</div>
    </div>
  );

  const resposta = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#000",
          color: "#fff",
          padding: "88px 72px 72px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -260,
            left: -200,
            width: 900,
            height: 900,
            borderRadius: 900,
            background: "rgba(206,255,0,0.22)",
            filter: "blur(120px)",
            display: "flex",
          }}
        />
        {/* logos */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${origem}/logo-somma.svg`} width={200} height={53} alt="" />
          <div style={{ fontFamily: texto, fontSize: 40, color: "rgba(255,255,255,0.4)" }}>×</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${origem}/bora/logo-white.png`} width={172} height={44} alt="" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 70, fontFamily: titulo, fontSize: 170, lineHeight: 0.84 }}>
          <div style={{ color: VERDE, display: "flex" }}>BORA</div>
          <div style={{ display: "flex" }}>COM SOMMA</div>
        </div>
        <div style={{ fontFamily: texto, fontSize: 36, marginTop: 34, color: "rgba(255,255,255,0.75)", display: "flex" }}>
          O corre do anúncio oficial, com Yann Rodrigues
        </div>

        {/* ingresso */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 64,
            background: VERDE,
            borderRadius: 48,
            color: "#000",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", padding: "52px 56px 30px" }}>
            <div style={{ fontFamily: texto, fontSize: 26, letterSpacing: 6, textTransform: "uppercase", display: "flex" }}>
              Ingresso · check-in confirmado
            </div>
            <div style={{ fontFamily: titulo, fontSize: 84, lineHeight: 0.95, marginTop: 18, textTransform: "uppercase", display: "flex" }}>
              {nome}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", marginTop: 26 }}>
              {dado("Quando", `${d.semana[0].toUpperCase()}${d.semana.slice(1)}, ${Number(d.dia)} de ${d.mesLongo}`)}
              {dado("Concentração", `A partir das ${horarioCurto(ev.horario)}`)}
              {dado("Onde", "Parque da Cidade, Estacionamento 10")}
              {dado("Pelotão", pelotao)}
            </div>
          </div>
          {/* picote */}
          <div style={{ display: "flex", alignItems: "center", position: "relative", height: 2 }}>
            <div style={{ position: "absolute", left: -30, top: -30, width: 60, height: 60, borderRadius: 60, background: "#000", display: "flex" }} />
            <div style={{ flex: 1, margin: "0 50px", borderTop: "4px dashed rgba(0,0,0,0.3)", display: "flex" }} />
            <div style={{ position: "absolute", right: -30, top: -30, width: 60, height: 60, borderRadius: 60, background: "#000", display: "flex" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "40px 56px 52px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: texto, fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: "rgba(0,0,0,0.55)" }}>
                Código
              </div>
              <div style={{ fontFamily: titulo, fontSize: 72, marginTop: 6, display: "flex" }}>{ingresso.codigo}</div>
              <div style={{ fontFamily: texto, fontSize: 28, marginTop: 14, color: "rgba(0,0,0,0.65)", display: "flex" }}>
                Gratuito · aberto a todos
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={230} height={230} alt="" />
          </div>
        </div>

        <div style={{ display: "flex", flex: 1 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontFamily: titulo, fontSize: 64, color: VERDE, display: "flex" }}>EU VOU!</div>
          <div style={{ fontFamily: texto, fontSize: 30, color: "rgba(255,255,255,0.6)", display: "flex" }}>sommaclub.com.br/boracomsomma</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts },
  );

  const headers = new Headers(resposta.headers);
  headers.set("Cache-Control", "private, no-store");
  if (url.searchParams.get("baixar") === "1") {
    headers.set("Content-Disposition", `attachment; filename="ingresso-bora-com-somma-${ingresso.codigo}.png"`);
  }
  return new Response(resposta.body, { status: 200, headers });
}
