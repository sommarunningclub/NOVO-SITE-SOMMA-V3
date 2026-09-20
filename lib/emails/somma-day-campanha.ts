/**
 * Campanha de convocação do SOMMA DAY, Edição Especial SET 2026.
 *
 * Cinco variantes do MESMO e-mail, não cinco arquivos: a mesma pessoa pode
 * receber mais de um na mesma semana, e um corpo reconhecível é uma escolha,
 * não descuido. O que muda entre elas é a abertura, o bloco de destaque e o
 * fechamento; cabeçalho, dados do evento, benefícios e rodapé são os mesmos.
 *
 * Todo dado de evento (data, horário, local, pelotões, benefícios, cronograma)
 * vem de `lib/somma-day/event.config.ts`. Nada é redigitado aqui, porque um
 * horário divergente entre a LP e o e-mail é o tipo de erro que só aparece
 * depois de sair para milhares de pessoas.
 *
 * ┄ Duas regras de conteúdo que não são estéticas ┄
 *
 *  1. `CAPACIDADE_INTERNA` nunca aparece. O teto de vagas é operacional; a
 *     comunicação pública diz "vagas limitadas" e só. Ver o comentário na
 *     própria constante.
 *  2. Sem travessão na copy, por pedido de quem assina as campanhas. Onde o
 *     título oficial do evento usaria um, aqui vira ponto ou vírgula.
 *
 * A identidade é a do próprio SOMMA DAY (creme/vermelho/azul/amarelo da logo),
 * não a da home. É a mesma paleta da LP, então quem clica no e-mail chega numa
 * página que parece o e-mail.
 */

import {
  ABERTURA,
  BEBIDA_HORA,
  BENEFICIOS,
  CIDADE,
  CORES,
  DATA_CURTA,
  DATA_EXTENSO,
  ENCERRAMENTO,
  LARGADA,
  LOCAL,
  MAPS_URL,
  PELOTOES,
  SITE_URL,
} from "@/lib/somma-day/event.config";

/* ─── Paleta do e-mail ────────────────────────────────────────────────────── */

const C = {
  creme: CORES.creme,
  tinta: CORES.tinta,
  vermelho: CORES.vermelho,
  azul: CORES.azul,
  amarelo: CORES.amarelo,
  papel: "#ffffff",
  linha: "#e3ded0",
  mudo: "#6f6a5e",
  corpo: "#1c1a16",
} as const;

const SANS = "Arial,Helvetica,sans-serif";
const BLACK = "'Arial Black',Arial,Helvetica,sans-serif";

/**
 * A logo do evento, servida do próprio site. Fica exportada porque a régua faz
 * um HEAD nela antes de disparar: e-mail de campanha com imagem quebrada é
 * pior do que e-mail sem imagem, e isso só se descobre depois de ter saído.
 */
export const EMAIL_LOGO_URL = `${SITE_URL}/somma-day/email/logo.png`;

/** O CTA da campanha inteira. Check-in é o que garante a pulseira. */
export const LINK_CHECKIN = `${SITE_URL}/check-in`;

const INSTAGRAM = "@sommaclub";
const INSTAGRAM_URL = "https://www.instagram.com/sommaclub/";

/** Sem travessão: o título oficial tem um, a copy não usa. Ver o cabeçalho. */
const EVENTO_LABEL = "SOMMA DAY · EDIÇÃO ESPECIAL SET 2026";
const LOCAL_LINHA = `${LOCAL}, Parque da Cidade`;

/**
 * "5, 6 ou 8 km", para o meio da frase. `PELOTOES_ROTULO` é "5 KM", feito para
 * selo e botão; em prosa, caixa alta repetida três vezes grita.
 */
const PELOTOES_PROSA = (() => {
  const n = PELOTOES.map((p) => p.replace(/km$/i, ""));
  return `${n.slice(0, -1).join(", ")} ou ${n[n.length - 1]} km`;
})();

/* ─── As cinco variantes ──────────────────────────────────────────────────── */

/**
 * A régua, em ordem:
 *
 *  - `convite`        base inteira. Apresenta o evento e o que a pulseira dá.
 *  - `reforco`        só quem recebeu o convite e não abriu. Mesma oferta,
 *                     gancho no que a pessoa perde.
 *  - `dia-inteiro`    só quem engajou. Vende o DEPOIS da corrida, que é o que
 *                     diferencia esta edição: cronograma, pagode, comida.
 *  - `vespera`        base inteira de novo, na sexta de manhã. "É amanhã."
 *  - `ultima-chamada` só quem engajou, sexta à noite. Despertador e checklist.
 */
export type VarianteSommaDay =
  | "convite"
  | "reforco"
  | "dia-inteiro"
  | "vespera"
  | "ultima-chamada";

export const VARIANTES: readonly VarianteSommaDay[] = [
  "convite",
  "reforco",
  "dia-inteiro",
  "vespera",
  "ultima-chamada",
] as const;

const ROTULO: Record<VarianteSommaDay, string> = {
  convite: "Convite",
  reforco: "Reforço",
  "dia-inteiro": "O dia inteiro",
  vespera: "Véspera",
  "ultima-chamada": "Última chamada",
};

export function sommaDayRotulo(variante: VarianteSommaDay): string {
  return ROTULO[variante];
}

export function sommaDaySubject(variante: VarianteSommaDay): string {
  switch (variante) {
    case "reforco":
      return "Você viu? Sábado tem SOMMA DAY no Parque da Cidade";
    case "dia-inteiro":
      return "Do corre ao pagode: como vai ser o SOMMA DAY";
    case "vespera":
      return `É amanhã: SOMMA DAY, ${ABERTURA}, ${LOCAL}`;
    case "ultima-chamada":
      return "Amanhã cedo. Faz o check-in antes de dormir?";
    default:
      return `Sábado tem SOMMA DAY. A corrida é só o começo.`;
  }
}

export function sommaDayPreheader(variante: VarianteSommaDay): string {
  switch (variante) {
    case "reforco":
      return `${DATA_EXTENSO}. Corrida, café da manhã, ativações e pagode. Gratuito, com check-in.`;
    case "dia-inteiro":
      return `Largada às ${LARGADA}, pagode às ${BEBIDA_HORA}, fim às ${ENCERRAMENTO}. O dia inteiro, de uma vez.`;
    case "vespera":
      return `Amanhã, ${ABERTURA}, no ${LOCAL_LINHA}. Faça o check-in e garanta sua pulseira.`;
    case "ultima-chamada":
      return `Despertador para as ${ABERTURA}. Leva o celular carregado: o check-in vale a pulseira.`;
    default:
      return `${DATA_EXTENSO}, no ${LOCAL_LINHA}. Corre cedo, fica até mais tarde. Vagas limitadas.`;
  }
}

/* ─── Utilidades ──────────────────────────────────────────────────────────── */

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] || nome;
}

function rotulo(texto: string, cor: string = C.mudo, margem = "0"): string {
  return `<p style="margin:${margem};font-family:${SANS};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${cor};font-weight:bold;">${escapeHtml(
    texto
  )}</p>`;
}

function botao(href: string, texto: string, fundo: string = C.vermelho): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" bgcolor="${fundo}" style="background:${fundo};border-radius:999px;">
        <a href="${href}" target="_blank" style="display:block;text-decoration:none;border-radius:999px;">
          <span class="btn-text" style="display:block;padding:17px 28px;font-family:${SANS};font-size:15px;letter-spacing:0.01em;color:#ffffff;font-weight:bold;">${escapeHtml(
            texto
          )}</span>
        </a>
      </td>
    </tr>
  </table>`;
}

/* ─── Copy por variante ───────────────────────────────────────────────────── */

interface Copy {
  chip: string;
  titulo: string;
  subtitulo: string;
  abertura: string;
  botao: string;
  legendaBotao: string;
  rotuloBloco: string;
  tituloBloco: string;
  textoBloco: string;
  /** Substitui a lista de benefícios pelo cronograma, na variante que o pede. */
  mostrarCronograma: boolean;
  fechamento: string;
}

function montarCopy(variante: VarianteSommaDay, saudacao: string): Copy {
  const comum = {
    chip: `${DATA_CURTA} · ${ABERTURA}`,
    botao: "Fazer meu check-in",
    legendaBotao: "Gratuito · vagas limitadas",
    mostrarCronograma: false,
  };

  switch (variante) {
    case "reforco":
      return {
        ...comum,
        titulo: "Sábado é SOMMA DAY.",
        subtitulo: "E não é só a corrida.",
        abertura:
          `${saudacao} Mandamos isso dias atrás e talvez tenha passado batido, então vai o resumo: ` +
          `<strong style="color:${C.tinta};">${escapeHtml(DATA_EXTENSO.toLowerCase())}</strong>, ` +
          `no ${escapeHtml(LOCAL_LINHA)}, tem SOMMA DAY. ` +
          `Você corre ${PELOTOES_PROSA}, e depois fica: café da manhã, ativações, sorteios e pagode. ` +
          `É gratuito e a pulseira sai no check-in.`,
        rotuloBloco: "O que você perde se não aparecer",
        tituloBloco: "UM SÁBADO INTEIRO",
        textoBloco:
          `A largada é às ${LARGADA}. O evento vai até ${ENCERRAMENTO}. Essa diferença é o ponto.`,
        fechamento: "Ainda dá tempo de garantir a sua.",
      };

    case "dia-inteiro":
      return {
        ...comum,
        titulo: "Do corre ao pagode.",
        subtitulo: "O SOMMA DAY, hora a hora.",
        abertura:
          `${saudacao} Você já demonstrou interesse, então vamos ao que interessa: ` +
          `como o sábado vai funcionar de verdade, das ${ABERTURA} às ${ENCERRAMENTO}.`,
        rotuloBloco: "A virada do dia",
        tituloBloco: `PAGODE ÀS ${BEBIDA_HORA.toUpperCase()}`,
        textoBloco:
          "Mesa, cadeira, chopp e conversa. O evento não acaba quando você cruza a chegada, " +
          "acaba quando a última pessoa vai embora.",
        mostrarCronograma: true,
        botao: "Garantir minha pulseira",
        fechamento: "Corre cedo. Fica até mais tarde.",
      };

    case "vespera":
      return {
        ...comum,
        titulo: "É amanhã.",
        subtitulo: `${ABERTURA} no ${LOCAL}.`,
        abertura:
          `${saudacao} Amanhã, <strong style="color:${C.tinta};">${escapeHtml(
            DATA_EXTENSO.toLowerCase()
          )}</strong>, tem SOMMA DAY no ${escapeHtml(LOCAL_LINHA)}. ` +
          `Abertura às ${ABERTURA}, largada às ${LARGADA}, e o dia segue até ${ENCERRAMENTO}. ` +
          `Se você ainda não fez o check-in, faz agora: é ele que garante a pulseira.`,
        rotuloBloco: `Chegue às ${ABERTURA}`,
        tituloBloco: `CREDENCIAMENTO ABRE ÀS ${ABERTURA.toUpperCase()}`,
        textoBloco:
          `A largada é às ${LARGADA}, mas a fila da pulseira é antes. Quem chega às ${ABERTURA} pega DJ, ` +
          "café e nenhuma correria.",
        botao: "Fazer meu check-in agora",
        legendaBotao: "Sem check-in, sem pulseira",
        fechamento: "Amanhã cedo, no Parque da Cidade.",
      };

    case "ultima-chamada":
      return {
        ...comum,
        titulo: "Despertador.",
        subtitulo: `Amanhã, ${ABERTURA}, ${LOCAL}.`,
        abertura:
          `${saudacao} Último lembrete, e é curto: amanhã cedo tem SOMMA DAY no ${escapeHtml(LOCAL_LINHA)}, ` +
          `${escapeHtml(CIDADE)}. Abertura ${ABERTURA}, largada ${LARGADA}. ` +
          `Leva o celular carregado, que o check-in é no celular.`,
        rotuloBloco: "Antes de dormir",
        tituloBloco: "TRÊS COISAS",
        textoBloco:
          `Despertador para acordar e chegar às ${ABERTURA}. Check-in feito. ` +
          "Garrafa de água na mochila. O resto está com a gente.",
        botao: "Fazer meu check-in",
        legendaBotao: "Leva menos de um minuto",
        fechamento: "Te vejo amanhã cedo.",
      };

    default:
      return {
        ...comum,
        titulo: "A corrida é só o começo.",
        subtitulo: `SOMMA DAY, ${DATA_CURTA}.`,
        abertura:
          `${saudacao} <strong style="color:${C.tinta};">${escapeHtml(DATA_EXTENSO)}</strong>, ` +
          `a tropa toma o ${escapeHtml(LOCAL_LINHA)}, ${escapeHtml(CIDADE)}. ` +
          `Mas dessa vez não é só correr e ir embora: você escolhe o pelotão de ${PELOTOES_PROSA}, ` +
          `cruza a chegada, e aí o dia começa de verdade.`,
        rotuloBloco: "Edição especial",
        tituloBloco: "TODO MUNDO CORRE, DEPOIS TODO MUNDO FICA",
        textoBloco:
          `Largada às ${LARGADA}, ativações a partir das 09h, pagode às ${BEBIDA_HORA} e encerramento às ` +
          `${ENCERRAMENTO}. Gratuito, com pulseira garantida no check-in.`,
        fechamento: "Corre cedo. Fica até mais tarde.",
      };
  }
}

/* ─── Render ──────────────────────────────────────────────────────────────── */

export interface SommaDayCampanhaData {
  nome?: string | null;
  variante?: VarianteSommaDay;
  logoSrc?: string;
  utm?: string;
  linkCheckin?: string;
  descadastroUrl?: string | null;
}

/** Só os marcos que interessam ao leitor, não o cronograma operacional inteiro. */
const CRONOGRAMA_EMAIL = [
  { hora: ABERTURA, texto: "Abertura, credenciamento e pulseira. DJ desde a primeira pessoa.", cor: C.vermelho },
  { hora: "07h30", texto: "Concentração e aquecimento, todo mundo junto.", cor: C.vermelho },
  { hora: LARGADA, texto: `Largada dos pelotões de ${PELOTOES_PROSA}.`, cor: C.azul },
  { hora: "09h00", texto: "Ativações, sorteios, recovery, Fit Dance Evolve e café da manhã.", cor: C.azul },
  { hora: BEBIDA_HORA, texto: "Pagode, chopp e comunidade.", cor: C.amarelo },
  { hora: ENCERRAMENTO, texto: "Fim. Até a próxima edição.", cor: CORES.petroleo },
] as const;

export function renderSommaDayCampanhaEmail(data: SommaDayCampanhaData = {}): string {
  const variante = data.variante ?? "convite";
  const logo = data.logoSrc ?? EMAIL_LOGO_URL;
  const utm = data.utm ?? `utm_source=email&utm_medium=campanha&utm_campaign=somma-day-set2026&utm_content=${variante}`;
  const base = data.linkCheckin ?? LINK_CHECKIN;
  const link = `${base}${base.includes("?") ? "&" : "?"}${utm}`;

  const saudacao = data.nome
    ? `Oi, <strong style="color:${C.tinta};">${escapeHtml(primeiroNome(data.nome))}</strong>.`
    : "Oi!";
  const copy = montarCopy(variante, saudacao);

  const celulaDado = (rot: string, valor: string, ultima = false) => `
    <td width="33.33%" align="center" style="padding:15px 6px;${
      ultima ? "" : `border-right:1px solid ${C.linha};`
    }">
      <p style="margin:0;font-family:${SANS};font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${C.mudo};font-weight:bold;">${escapeHtml(
        rot
      )}</p>
      <p class="dado-n" style="margin:7px 0 0;font-family:${BLACK};font-size:22px;line-height:1;color:${C.tinta};font-weight:900;">${escapeHtml(
        valor
      )}</p>
    </td>`;

  const listaBeneficios = BENEFICIOS.map(
    (b, i) => `<tr>
      <td width="26" valign="top" style="padding:${i === 0 ? "0" : "8px"} 0 0;font-family:${SANS};font-size:15px;line-height:1.5;color:${C.vermelho};font-weight:bold;">&#183;</td>
      <td valign="top" style="padding:${i === 0 ? "0" : "8px"} 0 0;font-family:${SANS};font-size:15px;line-height:1.5;color:${C.corpo};">${escapeHtml(
        b
      )}</td>
    </tr>`
  ).join("");

  const listaCronograma = CRONOGRAMA_EMAIL.map(
    (m, i) => `<tr>
      <td width="74" valign="top" style="padding:${i === 0 ? "0" : "11px"} 0 11px;border-bottom:1px solid ${C.linha};font-family:${BLACK};font-size:15px;line-height:1.2;color:${m.cor};font-weight:900;">${escapeHtml(
        m.hora
      )}</td>
      <td valign="top" style="padding:${i === 0 ? "0" : "11px"} 0 11px;border-bottom:1px solid ${C.linha};font-family:${SANS};font-size:15px;line-height:1.5;color:${C.corpo};">${escapeHtml(
        m.texto
      )}</td>
    </tr>`
  ).join("");

  const blocoLista = copy.mostrarCronograma
    ? `<tr>
        <td class="pad" style="padding:30px 28px 0;">
          ${rotulo("O dia, hora a hora", C.mudo, "0 0 10px")}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${listaCronograma}
          </table>
        </td>
      </tr>`
    : `<tr>
        <td class="pad" style="padding:30px 28px 0;">
          ${rotulo("O que a pulseira libera", C.mudo, "0 0 10px")}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${listaBeneficios}
          </table>
          <p style="margin:14px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${C.mudo};">
            Bebida alco&#243;lica a partir das ${escapeHtml(BEBIDA_HORA)}, com confer&#234;ncia de maioridade.
          </p>
        </td>
      </tr>`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>SOMMA DAY, edi&#231;&#227;o especial de setembro</title>
  <style>
    @media only screen and (max-width:620px) {
      .outer-pad { padding: 14px 8px !important; }
      .pad { padding-left: 20px !important; padding-right: 20px !important; }
      .title { font-size: 32px !important; }
      .btn-text { padding: 16px 20px !important; font-size: 14px !important; }
      .dado-n { font-size: 17px !important; }
      .logo-evento { width: 64px !important; height: 64px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.creme};width:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.creme};opacity:0;">
    ${escapeHtml(sommaDayPreheader(variante))}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.creme};width:100%;">
    <tr>
      <td class="outer-pad" align="center" style="padding:24px 16px;">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td>
        <![endif]-->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:600px;table-layout:fixed;background:${C.creme};">

          <tr>
            <td class="pad" bgcolor="${C.creme}" style="background:${C.creme};padding:22px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle" style="line-height:0;">
                    <img class="logo-evento" src="${logo}" alt="SOMMA DAY" width="78" height="78" style="display:block;width:78px;height:78px;border:0;outline:none;" />
                  </td>
                  <td align="right" valign="middle" style="font-family:${SANS};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${C.vermelho};white-space:nowrap;padding-left:10px;font-weight:bold;">
                    ${escapeHtml(copy.chip)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td height="3" bgcolor="${C.vermelho}" style="background:${C.vermelho};font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr>
            <td class="pad" style="padding:34px 28px 26px;">
              ${rotulo(EVENTO_LABEL, C.mudo, "0 0 14px")}
              <h1 class="title" style="margin:0;font-family:${SANS};font-size:38px;line-height:1.05;letter-spacing:-0.02em;color:${C.tinta};font-weight:bold;">
                ${escapeHtml(copy.titulo)}
              </h1>
              <p style="margin:10px 0 0;font-family:${SANS};font-size:20px;line-height:1.3;color:${C.vermelho};font-weight:bold;">
                ${escapeHtml(copy.subtitulo)}
              </p>
              <p style="margin:18px 0 0;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.corpo};">
                ${copy.abertura}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;border-top:1px solid ${C.linha};border-bottom:1px solid ${C.linha};">
                <tr>
                  ${celulaDado("Quando", DATA_CURTA)}
                  ${celulaDado("Abertura", ABERTURA)}
                  ${celulaDado("Largada", LARGADA, true)}
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
                <tr><td>${botao(link, copy.botao)}</td></tr>
              </table>
              <p style="margin:12px 0 0;font-family:${SANS};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${C.mudo};">
                ${escapeHtml(copy.legendaBotao)}
              </p>
            </td>
          </tr>

          <tr>
            <td class="pad" style="padding:8px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.vermelho};">
                <tr>
                  <td style="padding:22px;">
                    ${rotulo(copy.rotuloBloco, "rgba(255,255,255,0.82)")}
                    <p style="margin:9px 0 0;font-family:${BLACK};font-size:24px;line-height:1.1;text-transform:uppercase;color:#ffffff;font-weight:900;letter-spacing:-0.01em;">
                      ${escapeHtml(copy.tituloBloco)}
                    </p>
                    <p style="margin:10px 0 0;font-family:${SANS};font-size:15px;line-height:1.55;color:rgba(255,255,255,0.92);">
                      ${escapeHtml(copy.textoBloco)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${blocoLista}

          <tr>
            <td class="pad" style="padding:26px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.papel};border-left:3px solid ${C.azul};">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.3;color:${C.tinta};font-weight:bold;">
                      Onde
                    </p>
                    <p style="margin:7px 0 0;font-family:${SANS};font-size:14px;line-height:1.55;color:${C.corpo};">
                      ${escapeHtml(LOCAL_LINHA)}, ${escapeHtml(CIDADE)}.
                      <a href="${escapeHtml(MAPS_URL)}" target="_blank" style="color:${C.vermelho};text-decoration:underline;">Ver no mapa</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="pad" style="padding:32px 28px 0;">
              <p style="margin:0 0 18px;font-family:${SANS};font-size:24px;line-height:1.2;letter-spacing:-0.01em;color:${C.tinta};font-weight:bold;">
                ${escapeHtml(copy.fechamento)}
              </p>
              ${botao(link, copy.botao)}
              <p style="margin:12px 0 0;font-family:${SANS};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${C.mudo};">
                ${escapeHtml(DATA_CURTA)} &#183; ${escapeHtml(ABERTURA)} &#183; ${escapeHtml(LOCAL_LINHA)}
              </p>
            </td>
          </tr>

          <tr><td height="32" style="height:32px;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td height="3" bgcolor="${C.vermelho}" style="background:${C.vermelho};font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr>
            <td class="pad" style="padding:26px 28px;">
              <p style="margin:0;font-family:${SANS};font-size:20px;line-height:1;color:${C.tinta};font-weight:bold;">
                somma<span style="color:${C.vermelho};">.</span>
              </p>
              <p style="margin:12px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.mudo};">
                Acompanhe tudo no Instagram:
                <a href="${escapeHtml(INSTAGRAM_URL)}" target="_blank" style="color:${C.vermelho};text-decoration:underline;">${escapeHtml(
                  INSTAGRAM
                )}</a>
              </p>
              <p style="margin:12px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.mudo};">
                Se o bot&#227;o n&#227;o abrir, use este endere&#231;o:<br />
                <a href="${link}" target="_blank" style="color:${C.vermelho};text-decoration:underline;word-break:break-all;">${escapeHtml(
                  base
                )}</a>
              </p>
              ${
                data.descadastroUrl
                  ? `<p style="margin:16px 0 0;font-family:${SANS};font-size:12px;line-height:1.5;color:rgba(28,26,22,0.45);">
                Voc&#234; recebe este e-mail porque se cadastrou no site do SOMMA Club ou j&#225; fez check-in em um evento nosso.
                <a href="${escapeHtml(
                  data.descadastroUrl
                )}" target="_blank" style="color:${C.mudo};text-decoration:underline;">Descadastrar</a>.
              </p>`
                  : ""
              }
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}
