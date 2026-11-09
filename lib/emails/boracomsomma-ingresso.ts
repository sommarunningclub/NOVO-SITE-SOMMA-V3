import "server-only";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import { linkGoogleAgenda } from "@/lib/boracomsomma/agenda";
import { PELOTOES, URL_LP, YANN } from "@/lib/boracomsomma/config";
import { horarioCurto, partesDaData, type EventoBora } from "@/lib/boracomsomma/evento";

/**
 * E-mail do ingresso do BORA com SOMMA (14/11/2026), na linguagem da LP:
 * fundo preto, verde-limão da BORA, ingresso em cartão limão com picote e QR.
 *
 * Regras de e-mail: tudo em tabela e estilo inline (Gmail, Outlook, app do
 * celular). O Gmail ignora fonte da web, então o título usa Arial Black em
 * itálico, que é o mais perto da Altone que todo cliente tem. Cada imagem tem
 * alt e cor de fundo: com imagens bloqueadas o e-mail continua legível.
 * Sem travessão na copy.
 */

const LIMA = "#CEFF00";
const PRETO = "#0B0B0B";
const CINZA = "#1A1A1A";
const DISPLAY = "'Arial Black','Helvetica Neue',Arial,sans-serif";
const TEXTO = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const SITE = "https://sommaclub.com.br";
export const QR_CID = "boracomsomma-qr";

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const primeiro = (nome: string) => nome.trim().split(/\s+/)[0] || nome;
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export function assunto(reenvio = false): string {
  return reenvio ? "Seu ingresso do BORA com SOMMA" : "Você está no corre: seu ingresso do BORA com SOMMA";
}

export type DadosEmailIngresso = {
  nome: string;
  codigo: string;
  pelotao: string | null;
  /** Link da página de obrigado com o token. */
  url: string;
  /** `cid:...` no envio; data URL na prévia. */
  qrSrc: string;
  evento: Pick<EventoBora, "data" | "horario" | "local" | "localUrl">;
  reenvio?: boolean;
  /** Origem das imagens; a prévia local passa "" para servir do próprio dev. */
  base?: string;
};

function quando(ev: DadosEmailIngresso["evento"]) {
  const d = partesDaData(ev.data);
  return {
    data: `${capital(d.semana)}, ${Number(d.dia)} de ${d.mesLongo}`,
    curta: `${d.dia}.${String(ev.data.split("-")[1])}`,
    hora: horarioCurto(ev.horario),
  };
}

function rotuloPelotao(p: string | null): string {
  if (!p) return "Escolhe no dia";
  const info = PELOTOES[p];
  return info ? `${p.replace("km", " km")} · ${info.rotulo}` : p;
}

const linha = (rotulo: string, valor: string) => `
  <tr>
    <td style="padding:10px 0;border-top:1px solid rgba(0,0,0,.18);font-family:${TEXTO};font-size:11px;line-height:14px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#3b4a00;width:104px;vertical-align:top">${rotulo}</td>
    <td style="padding:10px 0;border-top:1px solid rgba(0,0,0,.18);font-family:${TEXTO};font-size:16px;line-height:20px;font-weight:700;color:#000000;vertical-align:top">${valor}</td>
  </tr>`;

const bloco = (conteudo: string, o: { fundo?: string; topo?: number; base?: number } = {}) => `
  <tr><td class="bcs-pad" bgcolor="${o.fundo ?? PRETO}" style="background:${o.fundo ?? PRETO};padding:${o.topo ?? 32}px 40px ${o.base ?? 32}px">${conteudo}</td></tr>`;

const botao = (texto: string, href: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
    <td bgcolor="${LIMA}" style="background:${LIMA};border-radius:999px;text-align:center">
      <a href="${esc(href)}" style="display:inline-block;padding:16px 34px;font-family:${DISPLAY};font-size:16px;line-height:20px;font-style:italic;text-transform:uppercase;color:#000000;text-decoration:none;letter-spacing:.5px">${texto} &rarr;</a>
    </td>
  </tr></table>`;

export function renderIngressoEmail(d: DadosEmailIngresso): string {
  const base = d.base ?? SITE;
  const img = (p: string) => `${base}/boracomsomma/${p}`;
  const q = quando(d.evento);
  const nome = esc(primeiro(d.nome));
  const agenda = linkGoogleAgenda({ data: d.evento.data, horario: d.evento.horario, local: d.evento.local });

  const abertura = d.reenvio
    ? { eyebrow: "Seu ingresso, de novo", titulo: `${nome}, aqui está<br><span style="color:${LIMA}">seu ingresso.</span>`, texto: "Você pediu o seu ingresso do BORA com SOMMA e ele veio direto para cá. É ele que você mostra na chegada." }
    : { eyebrow: "Check-in confirmado", titulo: `${nome}, você<br><span style="color:${LIMA}">está no corre!</span>`, texto: `Sábado a BORA vira, oficialmente, a assessoria do SOMMA Club, e você vai estar lá. Seu ingresso está aqui embaixo e também no link.` };

  const corpo = [
    // logos
    `<tr><td class="bcs-pad" bgcolor="${PRETO}" style="background:${PRETO};padding:28px 40px 22px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle"><img src="${img("email/somma-logo.png")}" width="112" height="30" alt="SOMMA Club" style="display:block;border:0;width:112px;height:30px;color:#ffffff;font-family:${TEXTO};font-size:14px"></td>
        <td style="vertical-align:middle;padding:0 14px;font-family:${TEXTO};font-size:20px;color:${LIMA}">&times;</td>
        <td style="vertical-align:middle"><img src="${img("email/bora-logo.png")}" width="110" height="28" alt="BORA Assessoria" style="display:block;border:0;width:110px;height:28px;color:#ffffff;font-family:${TEXTO};font-size:14px"></td>
      </tr></table>
    </td></tr>`,
    // foto da turma
    `<tr><td style="padding:0;line-height:0;background:${CINZA}">
      <img src="${img("email/abertura.jpg")}" width="600" alt="A turma da BORA reunida depois do treino" style="display:block;width:100%;max-width:600px;height:auto;border:0;background:${CINZA};color:#ffffff;font-family:${TEXTO};font-size:14px">
    </td></tr>`,
    // faixa quadriculada
    `<tr><td height="14" style="height:14px;line-height:14px;font-size:0;background:${LIMA};background-image:repeating-linear-gradient(90deg,#000 0 14px,${LIMA} 14px 28px)">&nbsp;</td></tr>`,
    // abertura
    bloco(
      `<div style="font-family:${TEXTO};font-size:12px;line-height:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${LIMA}">${abertura.eyebrow}</div>
       <div class="bcs-h" style="margin-top:12px;font-family:${DISPLAY};font-size:40px;line-height:42px;font-style:italic;text-transform:uppercase;color:#ffffff;letter-spacing:-1px">${abertura.titulo}</div>
       <p style="margin:16px 0 0;font-family:${TEXTO};font-size:16px;line-height:24px;color:#cfcfcf">${abertura.texto}</p>`,
      { topo: 34, base: 26 }
    ),
    // ingresso
    bloco(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${LIMA}" style="background:${LIMA};border-radius:22px">
        <tr><td style="padding:26px 26px 6px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-family:${TEXTO};font-size:11px;line-height:14px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#000000">Ingresso · BORA com SOMMA</td>
            <td align="right" style="font-family:${DISPLAY};font-size:14px;line-height:14px;font-style:italic;color:#000000">${q.curta}</td>
          </tr></table>
          <div style="margin-top:14px;font-family:${DISPLAY};font-size:26px;line-height:30px;font-style:italic;text-transform:uppercase;color:#000000">${esc(d.nome.trim())}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px">
            ${linha("Quando", esc(q.data))}
            ${linha("Horário", `Concentração a partir das ${esc(q.hora)}`)}
            ${linha("Onde", "Parque da Cidade, Estacionamento 10")}
            ${linha("Pelotão", esc(rotuloPelotao(d.pelotao)))}
          </table>
        </td></tr>
        <tr><td style="padding:8px 0;font-size:0;line-height:0"><div style="border-top:3px dashed rgba(0,0,0,.35);margin:0 26px"></div></td></tr>
        <tr><td style="padding:12px 26px 26px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle">
              <div style="font-family:${TEXTO};font-size:11px;line-height:14px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#3b4a00">Código</div>
              <div class="bcs-codigo" style="margin-top:6px;font-family:${DISPLAY};font-size:30px;line-height:32px;font-style:italic;color:#000000;white-space:nowrap">${esc(d.codigo)}</div>
              <div style="margin-top:8px;font-family:${TEXTO};font-size:13px;line-height:18px;color:#26300a">Mostre o QR ou o código na chegada.</div>
            </td>
            <td align="right" width="132" style="vertical-align:middle;width:132px">
              <img src="${esc(d.qrSrc)}" width="120" height="120" alt="QR Code do ingresso ${esc(d.codigo)}" style="display:block;width:120px;height:120px;border:0;background:${LIMA}">
            </td>
          </tr></table>
        </td></tr>
      </table>`,
      { topo: 0, base: 26 }
    ),
    // ações
    bloco(
      `${botao("Abrir meu ingresso", d.url)}
       <p style="margin:20px 0 0;text-align:center;font-family:${TEXTO};font-size:14px;line-height:24px;color:#bdbdbd">
         <a href="${esc(d.evento.localUrl)}" style="color:${LIMA};font-weight:700;text-decoration:none">Como chegar ao Estacionamento 10 &rarr;</a><br>
         Salvar na agenda: <a href="${esc(agenda)}" style="color:${LIMA};font-weight:700">Google</a> · <a href="${SITE}/boracomsomma/agenda.ics" style="color:${LIMA};font-weight:700">iPhone ou Outlook</a>
       </p>`,
      { topo: 4, base: 34 }
    ),
    // o que vai rolar
    bloco(
      `<div style="font-family:${TEXTO};font-size:12px;line-height:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${LIMA}">O que vai rolar</div>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px">
         ${[
           ["Anúncio oficial", "A BORA passa a ser a assessoria do SOMMA Club. Um novo ciclo começa ali, no parque."],
           ["Yann Rodrigues no corre", "O fundador da BORA corre com a gente, do aquecimento até a última foto."],
           ["O desafio mais irado", "Os desafios do Yann rodam o Brasil. Sábado o palco é o Parque da Cidade."],
         ]
           .map(
             ([t, x]) => `<tr><td style="padding:12px 0;border-top:1px solid #2a2a2a">
               <div style="font-family:${DISPLAY};font-size:16px;line-height:20px;font-style:italic;text-transform:uppercase;color:#ffffff">${t}</div>
               <div style="margin-top:4px;font-family:${TEXTO};font-size:14px;line-height:21px;color:#a8a8a8">${x}</div>
             </td></tr>`
           )
           .join("")}
       </table>`,
      { fundo: CINZA, topo: 30, base: 22 }
    ),
    // desafio
    bloco(
      `<div style="font-family:${DISPLAY};font-size:26px;line-height:28px;font-style:italic;text-transform:uppercase;color:#000000">Chama aquele amigo que voa</div>
       <p style="margin:10px 0 0;font-family:${TEXTO};font-size:15px;line-height:22px;color:#1d2400">O check-in é gratuito e aberto a todo mundo, aluno ou não. Manda o link: <a href="${URL_LP}" style="color:#000000;font-weight:700">sommaclub.com.br/boracomsomma</a></p>
       <p style="margin:10px 0 0;font-family:${TEXTO};font-size:13px;line-height:20px;color:#3b4a00">Este ingresso é pessoal. Não compartilhe o QR Code. Desafios do Yann: <a href="${YANN.instagram}" style="color:#000000;font-weight:700">${YANN.arroba}</a></p>`,
      { fundo: LIMA, topo: 28, base: 28 }
    ),
    // rodapé
    bloco(
      `<p style="margin:0;text-align:center;font-family:${TEXTO};font-size:12px;line-height:19px;color:#7a7a7a">
         SOMMA Club × BORA Assessoria<br>
         ${esc(q.data)}, ${esc(q.hora)} · Parque da Cidade, Estacionamento 10, Brasília<br>
         <a href="${URL_LP}" style="color:#9a9a9a">sommaclub.com.br/boracomsomma</a>
       </p>`,
      { topo: 26, base: 34 }
    ),
  ].join("");

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light">
<title>BORA com SOMMA</title>
<style>
@media (max-width:620px){
  .bcs-pad{padding-left:20px !important;padding-right:20px !important}
  .bcs-h{font-size:32px !important;line-height:35px !important}
  .bcs-codigo{font-size:24px !important}
}
</style></head>
<body style="margin:0;padding:0;background:${PRETO};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${PRETO}">${
    d.reenvio ? "Seu QR Code e o código para a chegada." : `Seu ingresso com QR Code. ${esc(q.data)}, ${esc(q.hora)}, Estacionamento 10.`
  }</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${PRETO}" style="background:${PRETO}"><tr><td align="center" style="padding:0">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${PRETO}">
${corpo}
</table></td></tr></table></body></html>`;
}

export function renderIngressoTexto(d: Omit<DadosEmailIngresso, "qrSrc" | "base">): string {
  const q = quando(d.evento);
  return [
    d.reenvio ? `Oi, ${primeiro(d.nome)}! Aqui está o seu ingresso do BORA com SOMMA.` : `Oi, ${primeiro(d.nome)}! Você está no corre do BORA com SOMMA.`,
    "",
    `${q.data}, concentração a partir das ${q.hora}`,
    "Parque da Cidade, Estacionamento 10, Brasília",
    `Pelotão: ${rotuloPelotao(d.pelotao)}`,
    "",
    `Código do ingresso: ${d.codigo}`,
    `Seu ingresso (QR Code): ${d.url}`,
    `Como chegar: ${d.evento.localUrl}`,
    "",
    "Mostre o QR ou o código na chegada. O ingresso é pessoal.",
    "",
    "SOMMA Club × BORA Assessoria · sommaclub.com.br/boracomsomma",
  ].join("\n");
}

/** Nunca lança: o check-in já está gravado quando isto roda. */
export async function enviarIngresso(input: {
  email: string;
  nome: string;
  codigo: string;
  pelotao: string | null;
  url: string;
  qrPng: Buffer;
  evento: DadosEmailIngresso["evento"];
  reenvio?: boolean;
}): Promise<{ ok: boolean }> {
  const resend = getResendClient();
  const from = getEmailFrom();
  if (!resend || !from) {
    console.warn("[boracomsomma-email] Resend não configurado: ingresso não enviado.");
    return { ok: false };
  }
  try {
    const dados = { nome: input.nome, codigo: input.codigo, pelotao: input.pelotao, url: input.url, evento: input.evento, reenvio: input.reenvio };
    const { error } = await resend.emails.send({
      from,
      to: input.email,
      subject: assunto(input.reenvio),
      html: renderIngressoEmail({ ...dados, qrSrc: `cid:${QR_CID}` }),
      text: renderIngressoTexto(dados),
      attachments: [{ filename: `ingresso-${input.codigo}.png`, content: input.qrPng, contentId: QR_CID }],
    });
    if (error) {
      console.error("[boracomsomma-email] Falha ao enviar:", error.name, error.message);
      return { ok: false };
    }
    return { ok: true };
  } catch (erro) {
    console.error("[boracomsomma-email] Erro inesperado:", erro instanceof Error ? erro.message : erro);
    return { ok: false };
  }
}
