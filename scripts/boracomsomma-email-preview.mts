/**
 * Prévia local do e-mail do ingresso do BORA com SOMMA (desktop e celular lado a lado).
 *
 *   npx tsx --conditions=react-server scripts/boracomsomma-email-preview.mts [saida.html]
 *
 * As imagens vêm de public/ pelo caminho do disco, então não precisa do dev rodando.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import QRCode from "qrcode";
import { renderIngressoEmail, assunto } from "../lib/emails/boracomsomma-ingresso";
import { MAPA } from "../lib/boracomsomma/config";

const saida = resolve(process.argv[2] ?? join(process.cwd(), "boracomsomma-email-preview.html"));
const id = "4040d794-972e-48f5-9cf9-c6bde1cafac2";
const qr = await QRCode.toDataURL(`BORACOMSOMMA:${id}`, { margin: 0, width: 360, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#CEFF00" } });

const html = renderIngressoEmail({
  nome: "Maria Souza",
  codigo: "BCS-4040D7",
  pelotao: "6km",
  url: "https://sommaclub.com.br/boracomsomma/obrigado?t=exemplo",
  qrSrc: qr,
  evento: { data: "2026-11-14", horario: "07:00", local: "Parque da Cidade, Estacionamento 10, Brasília, DF", localUrl: MAPA.url },
  base: "file://" + resolve("public"),
});

// Imagens embutidas: o arquivo abre em qualquer navegador sem depender do disco.
const base = "file://" + resolve("public");
const embutido = html.replace(new RegExp(base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "/([^\"]+)", "g"), (_, rel: string) => {
  const tipo = rel.endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${tipo};base64,${readFileSync(join("public", rel)).toString("base64")}`;
});

const srcdoc = embutido.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
writeFileSync(
  saida,
  `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Prévia · e-mail do ingresso BORA com SOMMA</title>
<style>body{margin:0;background:#202020;color:#eee;font-family:-apple-system,system-ui,sans-serif}
header{max-width:1100px;margin:0 auto;padding:28px 24px 8px}h1{margin:6px 0 0;font-size:26px}
.k{color:#CEFF00;font-size:11px;letter-spacing:.2em;text-transform:uppercase}.s{color:#9a9a9a;font-size:14px}
.f{display:flex;gap:36px;align-items:flex-start;justify-content:center;flex-wrap:wrap;padding:24px}
figure{margin:0}figcaption{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#9a9a9a;margin-bottom:8px}
iframe{border:0;border-radius:14px;background:#0B0B0B;box-shadow:0 20px 60px rgba(0,0,0,.5)}</style></head><body>
<header><div class="k">Prévia local</div><h1>Assunto: ${assunto()}</h1><p class="s">De: SOMMA Club · Para: maria@example.com · dados de exemplo</p></header>
<div class="f"><figure><figcaption>Computador · 600 px</figcaption><iframe width="640" height="1960" srcdoc="${srcdoc}"></iframe></figure>
<figure><figcaption>Celular · 390 px</figcaption><iframe width="390" height="1960" srcdoc="${srcdoc}"></iframe></figure></div>
</body></html>`
);
console.log(saida);
