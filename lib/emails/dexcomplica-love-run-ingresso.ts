import "server-only";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import {
  CORES,
  DATA_EXTENSO_ANO,
  EVENTO_NOME,
  EVENTO_URL,
  GRUPO_WHATSAPP,
  HORARIO,
  LOCAL_AFTER,
  LOCAL_CORRE,
  urlComoChegar,
} from "@/lib/dexcomplica-love-run/event.config";
import { rotuloPelotao } from "@/lib/dexcomplica-love-run/estado";
import { urlGoogleAgenda } from "@/lib/dexcomplica-love-run/agenda";
import { qrPng, urlIngresso } from "@/lib/dexcomplica-love-run/ticket";
import { bloco, botao, casca, esc, eyebrow, grupoWhatsapp, letreiro, linkSeta, mochila, p, passe, selos, TEXTO, titulo } from "./dexcomplica-love-run-layout";

const QR_CID = "love-run-qr";

export interface IngressoEmail {
  nome: string;
  email: string;
  ticketCode: string;
  ticketToken: string;
  pelotao: string | null;
  /** Reenvio (recuperação ou segunda tentativa): o assunto não pode parecer inscrição nova. */
  reenvio?: boolean;
}

const primeiro = (nome: string) => nome.trim().split(/\s+/)[0] || nome;

export function assunto(reenvio = false): string {
  return reenvio ? "Seu ingresso do Dexcomplica Love Run" : "Você está dentro: seu ingresso do Dexcomplica Love Run";
}

/**
 * Confirmação (e reenvio) na linguagem da LP: abertura com foto e título,
 * letreiro, o passe com QR, a mochila em amarelo e o after/festa em vermelho.
 * Blocos em `./dexcomplica-love-run-layout`.
 */
export function renderIngressoEmail(d: {
  nome: string;
  ticketCode: string;
  url: string;
  pelotao: string | null;
  qrSrc: string;
  reenvio?: boolean;
  /** Origem das imagens; a prévia local passa "" para servir do próprio dev. */
  base?: string;
}): string {
  const nome = esc(primeiro(d.nome));
  const dados: [string, string][] = [
    ["Data", esc(DATA_EXTENSO_ANO) + (HORARIO.concentracao ? ` · ${esc(HORARIO.concentracao)}` : "")],
    ["Local", esc(LOCAL_CORRE.nome)],
    ...(d.pelotao ? ([["Pelotão", esc(rotuloPelotao(d.pelotao))]] as [string, string][]) : []),
  ];
  const corpo = [
    letreiro(),
    bloco(
      eyebrow(d.reenvio ? "Seu ingresso, de novo" : "Vaga garantida") +
        titulo(d.reenvio ? `${nome}, aqui está` : `${nome}, seu coração`, "#ffffff", d.reenvio ? "seu ingresso." : "já está no ritmo.") +
        p(
          d.reenvio
            ? "Pediram o seu ingresso do Dexcomplica Love Run e ele veio direto para este e-mail. Guarda bem: é ele que você mostra no check-in."
            : "Agora é só preparar o tênis e vir viver o Dexcomplica Love Run com a gente. Seu ingresso está aqui embaixo e também no link."
        ) +
        selos([
          { t: "Sáb · 07.11", cor: "amarelo" },
          { t: "Gratuito", cor: "rosa" },
          { t: "Est. 1 · Parque da Cidade", cor: "vermelho" },
        ]),
      { padBottom: 20 }
    ),
    bloco(passe({ nome: d.nome, dados, qrSrc: d.qrSrc, codigo: d.ticketCode, base: d.base }), { padTop: 8, padBottom: 18 }),
    bloco(
      botao("Abrir meu ingresso", d.url) +
        `<div style="margin-top:18px;font-family:${TEXTO};font-size:14px;line-height:26px;color:#cfc9c2">` +
        `${linkSeta("Como chegar ao Estacionamento 1", urlComoChegar(LOCAL_CORRE))}<br>` +
        `Adicionar à agenda: <a href="${esc(urlGoogleAgenda(d.url))}" style="color:${CORES.rosa};font-weight:800">Google Agenda</a> · <a href="${esc(EVENTO_URL)}/agenda.ics" style="color:${CORES.rosa};font-weight:800">Apple ou Outlook</a></div>`,
      { padTop: 10 }
    ),
    grupoWhatsapp(),
    mochila(),
    bloco(
      eyebrow("Depois do corre", CORES.amarelo) +
        titulo("A experiência", "#ffffff", "continua.", CORES.amarelo) +
        p(`O after é no ${esc(LOCAL_AFTER.nome)}: estrutura esportiva, ducha e vestiários. Quem estiver presente no corre ainda ganha uma condição especial na festa Dexcomplica (os detalhes saem em breve).`, "#ffffff") +
        p("Este ingresso é pessoal: não compartilhe o QR Code. Para chamar alguém, mande o link do evento.", "#ffe1e8"),
      { fundo: CORES.vermelho }
    ),
  ].join("");

  return casca({
    base: d.base,
    preheader: d.reenvio ? "Seu QR Code e o código de check-in." : "Seu ingresso com QR Code está aqui. Sábado, 7 de novembro.",
    heroi: d.reenvio
      ? { arquivo: "reenvio.jpg", alt: "Seu ingresso. Dexcomplica Love Run, sábado 07.11" }
      : { arquivo: "confirmacao.jpg", alt: "Você está dentro. Dexcomplica Love Run, sábado 07.11" },
    corpo,
  });
}

export function renderIngressoTexto(d: { nome: string; ticketCode: string; url: string; pelotao: string | null }): string {
  return [
    `Oi, ${primeiro(d.nome)}! Você está dentro do ${EVENTO_NOME}.`,
    "",
    DATA_EXTENSO_ANO,
    LOCAL_CORRE.nome,
    d.pelotao ? `Pelotão: ${rotuloPelotao(d.pelotao)}` : "",
    "",
    `Código do ingresso: ${d.ticketCode}`,
    `Seu ingresso (QR Code): ${d.url}`,
    `Como chegar: ${urlComoChegar(LOCAL_CORRE)}`,
    `Adicionar à agenda (Google): ${urlGoogleAgenda(d.url)}`,
    `Adicionar à agenda (Apple/Outlook): ${EVENTO_URL}/agenda.ics`,
    "",
    "Apresente o QR Code ou o código no check-in.",
    "",
    `Entre no grupo do evento no WhatsApp (novidades e informações): ${GRUPO_WHATSAPP.url}`,
    "",
    "Somma Club × Dexcomplica · produção Monu",
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n");
}

/** Nunca lança: a inscrição já está gravada quando isto roda. */
export async function enviarIngresso(input: IngressoEmail): Promise<{ ok: boolean }> {
  const resend = getResendClient();
  const from = getEmailFrom();
  if (!resend || !from) {
    console.warn("[love-run-email] Resend não configurado: ingresso não enviado.");
    return { ok: false };
  }
  try {
    const url = urlIngresso(input.ticketToken);
    const { error } = await resend.emails.send({
      from,
      to: input.email,
      subject: assunto(input.reenvio),
      html: renderIngressoEmail({
        nome: input.nome,
        ticketCode: input.ticketCode,
        url,
        pelotao: input.pelotao,
        qrSrc: `cid:${QR_CID}`,
        reenvio: input.reenvio,
      }),
      text: renderIngressoTexto({ nome: input.nome, ticketCode: input.ticketCode, url, pelotao: input.pelotao }),
      attachments: [
        { filename: `ingresso-${input.ticketCode}.png`, content: await qrPng(input.ticketToken), contentId: QR_CID },
      ],
    });
    if (error) {
      console.error("[love-run-email] Falha ao enviar:", error.name, error.message);
      return { ok: false };
    }
    return { ok: true };
  } catch (erro) {
    console.error("[love-run-email] Erro inesperado:", erro instanceof Error ? erro.message : erro);
    return { ok: false };
  }
}
