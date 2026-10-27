/**
 * Envia os 5 e-mails do Love Run para UM endereço de teste, via Resend.
 *
 *   npx tsx --conditions=react-server scripts/love-run-email-teste.mts voce@exemplo.com
 *
 * As imagens vão como anexo inline (cid:), não pela URL do site: assim o
 * teste mostra o e-mail completo mesmo antes do deploy. Assunto com [TESTE];
 * nas campanhas, {{primeiro_nome}} vira o primeiro nome do exemplo. Lê
 * RESEND_API_KEY e EMAIL_FROM do .env.local; não imprime segredo.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resend } from "resend";
import { SITE_URL } from "../lib/dexcomplica-love-run/event.config";
import { qrPng } from "../lib/dexcomplica-love-run/ticket";
import { assunto, renderIngressoEmail } from "../lib/emails/dexcomplica-love-run-ingresso";
import { CAMPANHAS } from "../lib/emails/dexcomplica-love-run-campanhas";

const para = process.argv[2];
if (!para || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(para)) {
  console.error("Uso: npx tsx --conditions=react-server scripts/love-run-email-teste.mts <email>");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(join(process.cwd(), ".env.local"), "utf8")
    .split("\n")
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")])
);
const from = env.VIP_EMAIL_FROM || env.EMAIL_FROM;
if (!env.RESEND_API_KEY || !from) {
  console.error("RESEND_API_KEY ou EMAIL_FROM ausente no .env.local");
  process.exit(1);
}
const resend = new Resend(env.RESEND_API_KEY);

const TOKEN = "previa_previa_previa_previa_previa_previa_x";
const PUB = join(process.cwd(), "public");

/** Troca cada imagem do site por um anexo inline com o mesmo arquivo. */
function inline(html: string) {
  const anexos: { filename: string; content: Buffer; contentId: string }[] = [];
  const vistos = new Map<string, string>();
  const out = html.replace(new RegExp(`${SITE_URL}(/dexcomplica-love-run/[^"')\\s]+\\.(?:png|jpg))`, "g"), (_, caminho: string) => {
    if (!vistos.has(caminho)) {
      const cid = `lr-${vistos.size}`;
      vistos.set(caminho, cid);
      anexos.push({ filename: caminho.split("/").pop()!, content: readFileSync(join(PUB, caminho)), contentId: cid });
    }
    return `cid:${vistos.get(caminho)}`;
  });
  return { html: out, anexos };
}

const nome = "Alex Rodrigues";
const primeiro = nome.split(" ")[0];
const qr = await qrPng(TOKEN);
const url = `${SITE_URL}/dexcomplica/ingresso/${TOKEN}`;

const envios = [
  {
    assunto: assunto(false),
    html: renderIngressoEmail({ nome, ticketCode: "DLR-8F4X29", url, pelotao: "6km", qrSrc: "cid:lr-qr" }),
    qr: true,
  },
  {
    assunto: assunto(true),
    html: renderIngressoEmail({ nome, ticketCode: "DLR-8F4X29", url, pelotao: "6km", qrSrc: "cid:lr-qr", reenvio: true }),
    qr: true,
  },
  ...CAMPANHAS.map((c) => ({
    assunto: c.assunto,
    html: c.html(SITE_URL).replace(/\{\{\s*primeiro_nome\s*\}\}/g, primeiro).replace(/\{\{\s*nome\s*\}\}/g, nome),
    qr: false,
  })),
];

for (const [i, e] of envios.entries()) {
  const { html, anexos } = inline(e.html);
  const { data, error } = await resend.emails.send({
    from,
    to: para,
    subject: `[TESTE ${i + 1}/${envios.length}] ${e.assunto}`,
    html,
    attachments: [...anexos, ...(e.qr ? [{ filename: "ingresso-DLR-8F4X29.png", content: qr, contentId: "lr-qr" }] : [])],
  });
  console.log(error ? `✗ ${i + 1}. ${e.assunto}: ${error.message}` : `✓ ${i + 1}. ${e.assunto} (${data?.id})`);
  await new Promise((r) => setTimeout(r, 700)); // folga para o limite de envios por segundo
}
