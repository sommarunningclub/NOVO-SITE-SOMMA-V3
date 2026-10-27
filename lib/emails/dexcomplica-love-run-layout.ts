import { CORES, EVENTO_URL, LEVAR, SITE_URL } from "@/lib/dexcomplica-love-run/event.config";

/**
 * Blocos dos e-mails do Love Run, na linguagem da LP: fundo tinta, abertura
 * em imagem (foto real + título em Anton, gerada por
 * scripts/love-run-email-herois), letreiro vermelho, passe com picote,
 * número de peito, mochila amarela, festa vermelha, botão em pílula com a
 * sombra deslocada.
 *
 * Regras de e-mail que moldam o código: tudo em tabela e estilo inline
 * (Outlook, Gmail, app do celular); título grande é imagem porque o Gmail
 * ignora fonte da web; o resto é texto de verdade, com Anton para quem
 * suporta (Apple Mail/iOS) e Impact/Arial Black de reserva. Cada imagem tem
 * `alt` e cor de fundo: com imagens bloqueadas o e-mail continua legível.
 */

export const DISPLAY = "Anton,Impact,'Arial Narrow Bold','Arial Black',sans-serif";
export const TEXTO = "Archivo,'Helvetica Neue',Arial,sans-serif";

export const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const img = (base: string, p: string) => `${base}/dexcomplica-love-run/${p}`;

export function casca(o: {
  base?: string;
  preheader: string;
  heroi: { arquivo: string; alt: string };
  corpo: string;
}): string {
  const base = o.base ?? SITE_URL;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light">
<title>Dexcomplica Love Run</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;700;800&display=swap');
@media (max-width:620px){
  .lr-pad{padding-left:20px !important;padding-right:20px !important}
  .lr-h{font-size:40px !important;line-height:44px !important}
  .lr-col{display:block !important;width:100% !important}
  .lr-codigo{font-size:30px !important}
}
</style></head>
<body style="margin:0;padding:0;background:${CORES.tinta};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${CORES.tinta}">${o.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${CORES.tinta}" style="background:${CORES.tinta}"><tr><td align="center" style="padding:0">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${CORES.tinta}">
  <tr><td style="padding:0;line-height:0;background:${CORES.tinta}">
    <img src="${img(base, `email/${o.heroi.arquivo}`)}" width="600" alt="${esc(o.heroi.alt)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;color:#ffffff;font-family:${DISPLAY};font-size:36px;line-height:44px;background:${CORES.tinta}">
  </td></tr>
  ${o.corpo}
  ${rodape(base)}
</table></td></tr></table></body></html>`;
}

/** A faixa vermelha do bordão, como o letreiro da LP. */
export function letreiro(): string {
  return `<tr><td bgcolor="${CORES.vermelho}" style="background:${CORES.vermelho};border-top:3px solid #000;border-bottom:3px solid #000;padding:14px 10px;text-align:center;font-family:${DISPLAY};font-size:22px;line-height:26px;letter-spacing:1px;color:#ffffff;text-transform:uppercase">
    Desapega <span style="color:${CORES.tinta}">&#9829;</span> Desilude <span style="color:${CORES.rosa}">&#9829;</span> Dexcomplica <span style="color:${CORES.amarelo}">&#9829;</span> 07.11
  </td></tr>`;
}

export function bloco(conteudo: string, o: { fundo?: string; cor?: string; padTop?: number; padBottom?: number } = {}): string {
  const fundo = o.fundo ?? CORES.tinta;
  return `<tr><td class="lr-pad" bgcolor="${fundo}" style="background:${fundo};color:${o.cor ?? "#ffffff"};padding:${o.padTop ?? 36}px 40px ${o.padBottom ?? 36}px;font-family:${TEXTO}">${conteudo}</td></tr>`;
}

export const eyebrow = (t: string, cor: string = CORES.rosa) =>
  `<div style="font-family:${TEXTO};font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:${cor};margin:0 0 10px"><span style="display:inline-block;width:24px;height:3px;background:${cor};vertical-align:middle;margin-right:10px;border-radius:2px"></span>${t}</div>`;

/** `corDestaque`: em bloco vermelho a 2ª linha vai em amarelo (vermelho sobre vermelho some). */
export const titulo = (t: string, cor = "#ffffff", destaque?: string, corDestaque: string = CORES.vermelho) =>
  `<div class="lr-h" style="font-family:${DISPLAY};font-size:48px;line-height:52px;text-transform:uppercase;color:${cor};margin:0 0 14px">${t}${destaque ? `<br><span style="color:${corDestaque}">${destaque}</span>` : ""}</div>`;

export const p = (t: string, cor = "#e6e1da") =>
  `<p style="margin:0 0 14px;font-family:${TEXTO};font-size:17px;line-height:26px;color:${cor}">${t}</p>`;

export function selos(itens: { t: string; cor: "amarelo" | "rosa" | "vermelho" }[]): string {
  const fundo = { amarelo: CORES.amarelo, rosa: CORES.rosa, vermelho: CORES.vermelho };
  const texto = { amarelo: CORES.tinta, rosa: CORES.tinta, vermelho: "#ffffff" };
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 18px"><tr>${itens
    .map(
      (s) =>
        `<td style="padding:0 8px 8px 0"><span style="display:inline-block;background:${fundo[s.cor]};color:${texto[s.cor]};border:3px solid #ffffff;border-radius:999px;padding:6px 14px;font-family:${TEXTO};font-size:14px;font-weight:800;white-space:nowrap">${s.t}</span></td>`
    )
    .join("")}</tr></table>`;
}

/** Pílula com a sombra deslocada dos botões da LP (borda inferior escura). */
export function botao(texto: string, url: string, cor: "vermelho" | "branco" | "amarelo" = "vermelho"): string {
  const fundo = { vermelho: CORES.vermelho, branco: "#ffffff", amarelo: CORES.amarelo }[cor];
  const letra = cor === "vermelho" ? "#ffffff" : CORES.tinta;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 6px"><tr><td bgcolor="${fundo}" style="background:${fundo};border-radius:999px;border-bottom:5px solid rgba(0,0,0,0.45)">
    <a href="${esc(url)}" style="display:inline-block;padding:16px 30px;font-family:${TEXTO};font-size:17px;font-weight:800;color:${letra};text-decoration:none;border-radius:999px">${texto}</a>
  </td></tr></table>`;
}

export const linkSeta = (texto: string, url: string, cor = "#ffffff") =>
  `<a href="${esc(url)}" style="font-family:${TEXTO};font-size:15px;font-weight:800;color:${cor};text-decoration:none;border-bottom:2px solid ${cor};padding-bottom:2px">${texto} &rarr;</a>`;

/** O passe do ingresso: topo vermelho, picote tracejado, QR sobre branco. */
export function passe(o: { nome: string; dados: [string, string][]; qrSrc: string; codigo: string; base?: string }): string {
  const base = o.base ?? SITE_URL;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:22px;overflow:hidden">
    <tr><td bgcolor="${CORES.vermelho}" align="center" style="background:${CORES.vermelho};padding:22px 20px 16px">
      <img src="${img(base, "marca/dex-logo.png")}" width="230" alt="Dexcomplica" style="display:block;width:230px;max-width:80%;height:auto;border:0;margin:0 auto">
      <div style="font-family:${DISPLAY};font-size:46px;line-height:50px;color:#ffffff;text-transform:uppercase">Love Run</div>
      <div style="font-family:${TEXTO};font-size:11px;font-weight:800;letter-spacing:2px;color:#ffffff;text-transform:uppercase;opacity:.9">Somma Club × Dexcomplica · produção Monu</div>
    </td></tr>
    <tr><td style="padding:22px 26px 6px;font-family:${TEXTO};color:${CORES.tinta}">
      <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:${CORES.cinza};text-transform:uppercase">Participante</div>
      <div style="font-family:${DISPLAY};font-size:32px;line-height:36px;text-transform:uppercase;margin:2px 0 14px">${esc(o.nome)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${o.dados
        .map(
          ([r, v]) =>
            `<tr><td style="padding:6px 0;border-top:1px dashed #d6cfc6"><div style="font-size:11px;font-weight:800;letter-spacing:2px;color:${CORES.cinza};text-transform:uppercase">${r}</div><div style="font-size:16px;font-weight:700;margin-top:2px">${v}</div></td></tr>`
        )
        .join("")}</table>
    </td></tr>
    <tr><td style="padding:10px 0"><div style="border-top:3px dashed #d6cfc6;margin:0 26px;height:0;line-height:0;font-size:0">&nbsp;</div></td></tr>
    <tr><td align="center" style="padding:14px 26px 26px;font-family:${TEXTO};color:${CORES.tinta}">
      <img src="${o.qrSrc}" width="230" height="230" alt="QR Code do ingresso" style="display:block;width:230px;height:230px;border:0;margin:0 auto">
      <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:${CORES.cinza};text-transform:uppercase;margin-top:14px">Código de check-in</div>
      <div class="lr-codigo" style="font-family:'Courier New',monospace;font-size:36px;font-weight:900;letter-spacing:4px;margin-top:4px">${esc(o.codigo)}</div>
      <div style="font-size:14px;color:#4a4642;margin-top:6px">Apresente o QR Code (ou o código) no check-in.</div>
    </td></tr>
  </table>`;
}

/** O "número de peito" da LP: cabeçalho vermelho e células tracejadas. */
export function peito(linhas: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden">
    <tr><td bgcolor="${CORES.vermelho}" style="background:${CORES.vermelho};padding:14px 22px;font-family:${DISPLAY};font-size:24px;color:#ffffff;letter-spacing:1px">LOVE RUN <span style="float:right">Nº 07.11</span></td></tr>
    ${linhas
      .map(
        ([r, v]) =>
          `<tr><td style="padding:14px 22px;border-top:1px dashed #d4cec6;font-family:${TEXTO};color:${CORES.tinta}"><div style="font-size:11px;font-weight:800;letter-spacing:2px;color:${CORES.cinza};text-transform:uppercase">${r}</div><div style="font-size:17px;font-weight:700;line-height:24px;margin-top:3px">${v}</div></td></tr>`
      )
      .join("")}
  </table>`;
}

/** "Na mochila" em bloco amarelo com corações, como na seção do after. */
export function mochila(): string {
  return bloco(
    `<div style="font-family:${DISPLAY};font-size:34px;line-height:38px;color:${CORES.tinta};text-transform:uppercase;margin:0 0 12px">Na mochila</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${LEVAR.map(
      (l, i) =>
        `<tr><td valign="top" width="34" style="padding:10px 0;border-top:2px solid ${CORES.tinta};font-size:22px;color:${i % 2 ? CORES.tinta : CORES.vermelho}">&#9829;</td><td style="padding:10px 0;border-top:2px solid ${CORES.tinta};font-family:${TEXTO};color:${CORES.tinta}"><div style="font-size:17px;font-weight:800">${l.item}</div><div style="font-size:14px;color:#3a3326">${l.detalhe}</div></td></tr>`
    ).join("")}</table>`,
    { fundo: CORES.amarelo, cor: CORES.tinta }
  );
}

function rodape(base: string): string {
  return `<tr><td class="lr-pad" bgcolor="${CORES.tinta}" style="background:${CORES.tinta};padding:34px 40px 40px;border-top:1px solid #2a2826;font-family:${TEXTO}">
    <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:#8c8780;text-transform:uppercase;margin-bottom:10px">Realização</div>
    <img src="${img(base, "email/somma-branca.png")}" height="22" alt="Somma Club" style="height:22px;width:auto;border:0;vertical-align:middle">
    <span style="color:#8c8780;font-size:16px;padding:0 10px;vertical-align:middle">×</span>
    <img src="${img(base, "marca/dex-logo.png")}" height="26" alt="Dexcomplica" style="height:26px;width:auto;border:0;vertical-align:middle">
    <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:#8c8780;text-transform:uppercase;margin:18px 0 8px">Produção</div>
    <img src="${img(base, "marca/monu-branca.png")}" height="16" alt="Monu" style="height:16px;width:auto;border:0">
    <div style="font-family:${DISPLAY};font-size:24px;line-height:30px;color:${CORES.vermelho};margin:22px 0 6px;text-transform:uppercase">Desapega, desilude... Dexcomplica!</div>
    <div style="font-size:12px;line-height:18px;color:#8c8780"><a href="${EVENTO_URL}" style="color:#cfc9c2">sommaclub.com.br/dexcomplica</a> · <a href="https://instagram.com/somma.club" style="color:#cfc9c2">@somma.club</a> · <a href="https://www.instagram.com/dexxcomplica/" style="color:#cfc9c2">@dexxcomplica</a></div>
  </td></tr>`;
}
