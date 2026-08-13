/**
 * Gera um HTML local com o template em celular e inbox, para revisão visual.
 *
 *   npx tsx --conditions=react-server scripts/desafio-esteiras-email-preview.mts
 */
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { UNITS } from "../lib/desafio-esteiras/event.config";
import { ticketQrPng } from "../lib/desafio-esteiras/qr";
import { generateTicketToken, ticketUrl } from "../lib/desafio-esteiras/ticket";
import { renderDesafioEsteirasTicketEmail, emailLogoDataUris } from "../lib/emails/desafio-esteiras-ticket";

const unit = UNITS.find((u) => u.id === "alameda") ?? UNITS[0];
const token = generateTicketToken();
const png = await ticketQrPng(token);
const logos = emailLogoDataUris();
const emailHtml = renderDesafioEsteirasTicketEmail({
  nome: "Maria Souza",
  email: "maria@example.com",
  ticketCode: `DST-${unit.ticketPrefix}-8F4X29`,
  ticketUrl: ticketUrl(token),
  unitNome: unit.nome,
  unitEndereco: unit.endereco,
  qrSrc: `data:image/png;base64,${png.toString("base64")}`,
  evolveLogoSrc: logos.evolve,
  sommaLogoSrc: logos.somma,
});

const escaped = emailHtml.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

const page = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Preview · e-mail Desafio das Esteiras</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #08080a; color: #f2f0ec; font-family: ui-sans-serif, system-ui, sans-serif; }
    header { padding: 28px 24px 8px; max-width: 1100px; margin: 0 auto; }
    h1 { margin: 8px 0 0; font-size: clamp(1.8rem, 5vw, 3rem); letter-spacing: -0.04em; text-transform: uppercase; }
    .kicker { color: #ff2c04; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; }
    .sub { color: #8a8884; font-size: 14px; line-height: 1.5; max-width: 62ch; }
    .frames { display: grid; gap: 32px; padding: 28px 24px 64px; max-width: 1100px; margin: 0 auto; }
    @media (min-width: 960px) { .frames { grid-template-columns: 390px 1fr; } }
    figure { margin: 0; }
    figcaption { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 10px; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #8a8884; }
    figcaption b { color: #ff2c04; font-weight: 600; }
    .phone, .inbox { border: 1px solid rgba(242,240,236,0.12); background: #08080a; overflow: auto; }
    iframe { display: block; border: 0; background: #08080a; }
  </style>
</head>
<body>
  <header>
    <p class="kicker">Revisão · não enviado</p>
    <h1>Template do e-mail</h1>
    <p class="sub">Credencial que cada inscrito recebe. Celular 390px à esquerda, inbox 560px à direita. Ainda não está ligado no cadastro.</p>
  </header>
  <div class="frames">
    <figure>
      <figcaption><b>Celular</b><span>390px · Gmail / Apple Mail</span></figcaption>
      <div class="phone"><iframe title="Celular" width="390" height="1320" srcdoc="${escaped}"></iframe></div>
    </figure>
    <figure>
      <figcaption><b>Inbox</b><span>560px · Gmail web</span></figcaption>
      <div class="inbox"><iframe title="Inbox" width="560" height="1320" srcdoc="${escaped}"></iframe></div>
    </figure>
  </div>
</body>
</html>`;

const out = join(tmpdir(), "desafio-esteiras-email-preview.html");
writeFileSync(out, page);
console.log(out);
