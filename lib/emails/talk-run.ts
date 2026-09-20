import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Campanha da Talk Run 2026 para a base inteira do SOMMA.
 *
 * Evento de terceiro (Grupo Talk, venda pela Central da Corrida), não um evento
 * SOMMA. O cabeçalho é um collab, igual ao do Sunset Wine Run: os dois nomes
 * lado a lado, sem fingir que "o SOMMA promove".
 *
 * O que o SOMMA tem aqui é UM ativo: o cupom `SOMMA15`, o único cupom de 15% da
 * prova. A régua inteira gira em torno disso mais a virada de lote, que é a
 * única urgência real e verificável que o briefing trouxe.
 *
 * ┄ Sobre a data da virada de lote ┄
 * O briefing diz "o lote vai virar" sem dizer quando, e a Central da Corrida não
 * publica a data. Por isso a copy fala em "o lote atual está acabando" e nunca
 * inventa um prazo: prometer "vira sexta" e não virar queima a próxima campanha
 * inteira. A ÚNICA contagem com data aqui é a da largada, que é pública.
 *
 * ┄ Sobre o visual ┄
 * Mesma família do e-mail do Sunset Wine Run, que é a identidade da home do
 * SOMMA (`tailwind.config.ts` + `app/globals.css`): fundo claro, `ink #0a0a0a`,
 * `primary #ff2c03`. O turquesa da Talk Run entra como cor de ACENTO (chips,
 * detalhes), nunca como cor de botão: quem está pedindo o clique é o SOMMA.
 *
 * O logo da Talk Run não existe como arquivo solto em lugar nenhum a que eu
 * tenha acesso, só cravado no criativo. Em vez de recortar um PNG com fundo
 * borrado que ficaria sujo sobre fundo claro, o lockup "TALK RUN 2026" é
 * TIPOGRÁFICO. Renderiza igual em Outlook, Gmail e Apple Mail, não depende de
 * imagem carregada e não vai desalinhar quando alguém trocar o criativo.
 *
 * O criativo oficial entra como hero de imagem em duas etapas (`convite` e
 * `pos-prova`), não nas sete: ele carrega uma mensagem específica ("o pós-prova
 * também é motivo para comemorar") e repeti-la sete dias seguidos transforma a
 * régua em spam visual. Nas outras cinco o hero é tipográfico.
 */

const C = {
  ink: "#0a0a0a", // app/globals.css --dark-bg
  paper: "#f5f5f5", // --bg-light
  primary: "#ff2c03", // --primary, tailwind.config.ts colors.primary
  line: "#e5e5e5",
  mute: "#737373", // --text-secondary
  body: "#18181b", // --text-dark
  /** Turquesa da Talk Run, amostrado do criativo oficial. Acento, não botão. */
  talk: "#12b6a6",
  talkEscuro: "#0b7f74",
} as const;

const SANS = "Arial,Helvetica,sans-serif";
const BLACK = "'Arial Black',Arial,Helvetica,sans-serif";

export const EMAIL_SOMMA_LOGO_URL = "https://sommaclub.com.br/talk-run/email/somma-logo-dark.png";
export const EMAIL_HERO_URL = "https://sommaclub.com.br/talk-run/email/hero-pos-prova.jpg";

function emailAsset(caminho: string): Buffer {
  return readFileSync(join(process.cwd(), "public", caminho));
}

/** Data URIs dos assets, para o preview local não depender de deploy nem de rede. */
export function talkRunAssetDataUris(): { somma: string; hero: string } {
  return {
    somma: `data:image/png;base64,${emailAsset("talk-run/email/somma-logo-dark.png").toString("base64")}`,
    hero: `data:image/jpeg;base64,${emailAsset("talk-run/email/hero-pos-prova.jpg").toString("base64")}`,
  };
}

export const EVENTO = {
  nome: "Talk Run 2026",
  dataLabel: "27.09",
  dataExtenso: "27 de setembro de 2026",
  dataCurta: "27 SET 2026",
  diaSemana: "domingo",
  /** A largada em ISO, base da contagem regressiva. Confirmada na página da
   *  Central da Corrida e na cobertura do evento: 27/09/2026, 10h. */
  dataISO: "2026-09-27T10:00:00-03:00",
  local: "Brasília Shopping",
  localDetalhe: "Largada e chegada no Brasília Shopping",
  cidade: "Brasília",
  distancias: "2K, 5K e 10K",
  distanciasCurta: "2K · 5K · 10K",
  largada: "10h",
  linkInscricao: "https://centraldacorrida.com.br/evento/talk-run-2026",
  cupom: "SOMMA15",
  desconto: "15%",
  instagram: "@talkrunbrasilia",
  instagramUrl: "https://www.instagram.com/talkrunbrasilia/",
} as const;

/**
 * O que a inscrição inclui, na ordem do briefing.
 *
 * Frutas e isotônico não estavam na lista do texto mas estão no criativo
 * oficial, então entram: quem viu o post e não encontra no e-mail acha que são
 * duas ofertas diferentes.
 */
const INCLUSOS = [
  { emoji: "📸", texto: "Fotos grátis, by Foco Radical" },
  { emoji: "📱", texto: "Película para o celular" },
  { emoji: "🎽", texto: "Cinto porta-número" },
  { emoji: "🏅", texto: "Medalha personalizada" },
  { emoji: "🥩", texto: "Churrasquinho na chegada" },
  { emoji: "🍺", texto: "Corona na chegada" },
  { emoji: "🍉", texto: "Frutas e isotônico no pós-prova" },
] as const;

export interface TalkRunData {
  /** Primeiro nome de quem recebe. Sem ele o e-mail abre com um "Oi!". */
  nome?: string | null;
  sommaLogoSrc?: string;
  heroSrc?: string;
  /** UTMs para separar o tráfego desta campanha. */
  utm?: string;
  linkInscricao?: string;
  descadastroUrl?: string | null;
  variante?: VarianteTalkRun;
  /** Momento do envio, para a contagem regressiva. Injetável para teste. */
  agora?: Date;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** "domingo" vira "Domingo", para quando a palavra abre o assunto. */
function maiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function firstName(nome: string): string {
  return nome.trim().split(/\s+/)[0] || nome;
}

/**
 * As sete versões do mesmo e-mail, uma por dia de 20/09 a 26/09.
 *
 * A ordem vai do argumento mais amplo para o mais concreto, e cada etapa tem um
 * gancho PRÓPRIO porque elas saem em dias seguidos para a mesma base inteira:
 *
 *   convite      existe a prova, e você tem 15% off
 *   lote         o preço vai subir, e é por isso que hoje importa
 *   experiencia  o que vem junto com a inscrição
 *   pos-prova    a festa da chegada, com o criativo oficial
 *   distancias   2K, 5K ou 10K: tem uma que serve para você
 *   logistica    domingo, 10h, Brasília Shopping
 *   vespera      é amanhã, e é a última chance
 *
 * Tudo é variante do MESMO template, não sete arquivos: sete cópias divergiriam
 * no primeiro ajuste de cupom, link ou horário, e aí metade da régua sai com o
 * dado velho.
 */
export type VarianteTalkRun =
  | "convite"
  | "lote"
  | "experiencia"
  | "pos-prova"
  | "distancias"
  | "logistica"
  | "vespera";

export const VARIANTES: readonly VarianteTalkRun[] = [
  "convite",
  "lote",
  "experiencia",
  "pos-prova",
  "distancias",
  "logistica",
  "vespera",
] as const;

/** As variantes que abrem com o criativo oficial. Ver o cabeçalho do arquivo. */
const COM_HERO_DE_IMAGEM: readonly VarianteTalkRun[] = ["convite", "pos-prova"] as const;

/**
 * Dias que faltam para a largada, contados em DIA DE CALENDÁRIO no fuso de
 * Brasília, não em horas corridas: "faltam 2 dias" tem que significar a mesma
 * coisa num e-mail das 9h e num das 21h, e dividir diferença de timestamps por
 * 24h daria 2 num caso e 1 no outro.
 */
export function diasParaOEvento(agora: Date = new Date()): number {
  const dia = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const umDia = 24 * 60 * 60 * 1000;
  const hoje = Date.parse(`${dia(agora)}T00:00:00Z`);
  const largada = Date.parse(`${dia(new Date(EVENTO.dataISO))}T00:00:00Z`);
  return Math.round((largada - hoje) / umDia);
}

/** "É hoje", "É amanhã" ou "Faltam 5 dias". Nunca conta para trás. */
export function contagemLabel(agora: Date = new Date()): string {
  const dias = diasParaOEvento(agora);
  if (dias <= 0) return "É hoje";
  if (dias === 1) return "É amanhã";
  return `Faltam ${dias} dias`;
}

/**
 * A mesma contagem em frase, para o corpo. Sem ponto final: quem chama decide
 * se emenda ou encerra. Separada de `contagemLabel` porque "É amanhã para a
 * largada" não é português, e um disparo atrasado cairia exatamente nisso.
 */
export function contagemFrase(agora: Date = new Date()): string {
  const dias = diasParaOEvento(agora);
  if (dias <= 0) return "A largada é hoje";
  if (dias === 1) return "A largada é amanhã";
  return `Faltam ${dias} dias para a largada`;
}

/**
 * Um assunto por variante, todos diferentes entre si de propósito: o Gmail
 * agrupa mensagens de mesmo assunto e mesmo remetente numa conversa só, e uma
 * régua de sete dias com assunto repetido chegaria empilhada e fechada.
 */
export function talkRunSubject(variante: VarianteTalkRun = "convite", agora: Date = new Date()): string {
  switch (variante) {
    case "lote":
      return `O lote da ${EVENTO.nome} vai virar (seu cupom é ${EVENTO.desconto} off)`;
    case "experiencia":
      return "Fotos grátis, película e cinto porta-número na sua inscrição";
    case "pos-prova":
      return "Churrasquinho e Corona esperando por você na chegada";
    case "distancias":
      return `2K, 5K ou 10K: escolha a sua na ${EVENTO.nome}`;
    case "logistica":
      return `${maiuscula(EVENTO.diaSemana)}, ${EVENTO.largada}, ${EVENTO.local}: como vai ser o seu dia`;
    case "vespera":
      return `${contagemLabel(agora)}: última chance de usar o ${EVENTO.cupom}`;
    default:
      return `${EVENTO.desconto} OFF na ${EVENTO.nome}, só para quem é do SOMMA`;
  }
}

export function talkRunPreheader(variante: VarianteTalkRun = "convite", agora: Date = new Date()): string {
  switch (variante) {
    case "lote":
      return `Quem deixar para depois paga mais caro. O cupom ${EVENTO.cupom} garante ${EVENTO.desconto} off enquanto o lote atual durar.`;
    case "experiencia":
      return `Fotos grátis, película, cinto porta-número e medalha personalizada. ${EVENTO.dataCurta}, ${EVENTO.local}.`;
    case "pos-prova":
      return `Frutas, isotônico, churrasquinho e Corona. Na ${EVENTO.nome}, o pós-prova também é motivo para comemorar.`;
    case "distancias":
      return `${EVENTO.distancias} com largada e chegada no ${EVENTO.local}. Cupom ${EVENTO.cupom}, ${EVENTO.desconto} off.`;
    case "logistica":
      return `Largada às ${EVENTO.largada} de ${EVENTO.diaSemana}, ${EVENTO.dataExtenso}, no ${EVENTO.local}.`;
    case "vespera":
      return `${contagemFrase(agora)}. Depois de hoje, o cupom ${EVENTO.cupom} não serve para mais nada.`;
    default:
      return `Cupom ${EVENTO.cupom}: o único com ${EVENTO.desconto} de desconto na ${EVENTO.nome}. ${EVENTO.dataCurta}, ${EVENTO.local}.`;
  }
}

/* ── Peças reaproveitadas do sistema visual ─────────────────────────────── */

function rotulo(texto: string, cor: string = C.mute, margem = "0"): string {
  return `<p style="margin:${margem};font-family:${SANS};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${cor};font-weight:bold;">${escapeHtml(texto)}</p>`;
}

/**
 * Botão pílula, como os do site (`rounded-full bg-primary`). Outlook desktop
 * ignora `border-radius` em td/a e cai para quina reta: degrada, não quebra.
 */
function botao(href: string, texto: string, fundo: string = C.primary, cor: string = "#ffffff"): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" bgcolor="${fundo}" style="background:${fundo};border-radius:999px;">
        <a href="${href}" target="_blank" style="display:block;text-decoration:none;border-radius:999px;">
          <span class="btn-text" style="display:block;padding:17px 28px;font-family:${SANS};font-size:15px;letter-spacing:0.01em;color:${cor};font-weight:bold;">${escapeHtml(texto)}</span>
        </a>
      </td>
    </tr>
  </table>`;
}

/**
 * O lockup "TALK RUN 2026" em tipografia, não em imagem. Ver o cabeçalho.
 * O "2026" fica numa caixa turquesa, como no criativo oficial.
 */
function lockupTalkRun(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td valign="middle" style="font-family:${BLACK};font-size:19px;line-height:1;letter-spacing:-0.02em;color:${C.ink};font-weight:900;white-space:nowrap;">
        TALK<span style="color:${C.talkEscuro};">RUN</span>
      </td>
      <td valign="middle" style="padding-left:6px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td bgcolor="${C.talk}" style="background:${C.talk};padding:3px 6px;font-family:${SANS};font-size:11px;line-height:1;color:#ffffff;font-weight:bold;letter-spacing:0.04em;">2026</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

export function renderTalkRunEmail(data: TalkRunData = {}): string {
  const sommaLogo = data.sommaLogoSrc ?? EMAIL_SOMMA_LOGO_URL;
  const hero = data.heroSrc ?? EMAIL_HERO_URL;
  const variante = data.variante ?? "convite";
  const agora = data.agora ?? new Date();
  /* `utm_content` carrega a variante: com sete e-mails apontando para a mesma
     página de inscrição, sem isso não dá para saber qual dia da régua trouxe a
     venda, e a resposta muda o que a próxima campanha faz. */
  const utm =
    data.utm ??
    `utm_source=email&utm_medium=campanha&utm_campaign=talk-run-set2026&utm_content=${variante}`;
  const base = data.linkInscricao ?? EVENTO.linkInscricao;
  const link = `${base}${base.includes("?") ? "&" : "?"}${utm}`;

  const saudacao = data.nome
    ? `Oi, <strong style="color:${C.ink};">${escapeHtml(firstName(data.nome))}</strong>.`
    : "Oi!";

  /* ── Copy que muda entre as variantes ──────────────────────────────────
     Só texto muda daqui pra baixo: estrutura, cores e blocos são os mesmos,
     porque o sexto e-mail da régua precisa ser reconhecível como o mesmo
     e-mail para quem já viu os cinco anteriores passarem na caixa de entrada.

     A contagem entra por função, não escrita à mão: um disparo que saia com um
     dia de atraso continua dizendo a verdade, em vez de anunciar "faltam 4
     dias" na véspera. */
  const contagem = contagemLabel(agora);
  const legendaPadrao = `${EVENTO.dataCurta}, ${EVENTO.diaSemana} &#183; Cupom ${EVENTO.cupom}`;

  const copies: Record<VarianteTalkRun, {
    chip: string;
    titulo: string;
    subtitulo: string;
    abertura: string;
    botao: string;
    rotuloCupom: string;
    fechamento: string;
    legendaBotao: string;
  }> = {
    convite: {
      chip: `${EVENTO.desconto} off`,
      titulo: "Seu cupom do SOMMA na Talk Run.",
      subtitulo: `${EVENTO.desconto} OFF na inscrição.`,
      abertura:
        `${saudacao} A ${escapeHtml(EVENTO.nome)} é ${escapeHtml(EVENTO.diaSemana)}, ${escapeHtml(EVENTO.dataExtenso)}, com largada e ` +
        `chegada no ${escapeHtml(EVENTO.local)}. Quem é do SOMMA tem um benefício exclusivo: o cupom ` +
        `<strong style="color:${C.ink};">${escapeHtml(EVENTO.cupom)}</strong>, com ${escapeHtml(EVENTO.desconto)} de desconto. ` +
        `É o único cupom de ${escapeHtml(EVENTO.desconto)} da prova.`,
      botao: `Garantir com ${EVENTO.desconto} off`,
      rotuloCupom: "Benefício exclusivo SOMMA",
      fechamento: "Garante agora. Corre depois.",
      legendaBotao: legendaPadrao,
    },
    /* Etapa 2: a única urgência real que o briefing trouxe. Sem data inventada:
       ver o cabeçalho do arquivo sobre a virada de lote. */
    lote: {
      chip: "O lote vai virar",
      titulo: "O lote atual está acabando.",
      subtitulo: "Quem deixa para depois paga mais caro.",
      abertura:
        `${saudacao} O lote da ${escapeHtml(EVENTO.nome)} vai virar, e virada de lote significa uma coisa só: ` +
        `o mesmo percurso, o mesmo kit e a mesma festa custando mais caro. O cupom ` +
        `<strong style="color:${C.ink};">${escapeHtml(EVENTO.cupom)}</strong> dá ${escapeHtml(EVENTO.desconto)} de desconto ` +
        `sobre o valor de hoje, não sobre o de depois.`,
      botao: "Garantir no lote atual",
      rotuloCupom: `Use antes da virada de lote`,
      fechamento: "Não espera virar para decidir.",
      legendaBotao: legendaPadrao,
    },
    experiencia: {
      chip: contagem,
      titulo: "Não é só a camiseta e a medalha.",
      subtitulo: "O que vem junto com a sua inscrição.",
      abertura:
        `${saudacao} A ${escapeHtml(EVENTO.nome)} é conhecida por entregar mais do que a corrida. ` +
        `Fotos profissionais de graça, película para o celular, cinto porta-número e medalha personalizada ` +
        `entram na inscrição, sem custo extra e sem sorteio. É ${escapeHtml(EVENTO.diaSemana)}, ${escapeHtml(EVENTO.dataLabel)}, ` +
        `no ${escapeHtml(EVENTO.local)}.`,
      botao: "Quero minha inscrição",
      rotuloCupom: `Seus ${EVENTO.desconto} off`,
      fechamento: "A experiência mais completa de Brasília.",
      legendaBotao: legendaPadrao,
    },
    /* Etapa 4: o criativo oficial. A copy aqui é a do post, porque é a peça que
       a pessoa provavelmente já viu no Instagram. */
    "pos-prova": {
      chip: contagem,
      titulo: "O pós-prova também é motivo para comemorar.",
      subtitulo: "Frutas, churrasquinho e Corona.",
      abertura:
        `${saudacao} Na ${escapeHtml(EVENTO.nome)}, cruzar a linha de chegada é o começo da parte boa. ` +
        `Frutas, isotônico, churrasquinho e Corona esperando por você, com a festa montada ali mesmo, ` +
        `no ${escapeHtml(EVENTO.local)}. Você corre de manhã e fica.`,
      botao: "Garantir meu lugar na festa",
      rotuloCupom: `Seus ${EVENTO.desconto} off`,
      fechamento: "Corre de manhã, comemora depois.",
      legendaBotao: legendaPadrao,
    },
    /* Etapa 5: quem ainda não comprou muitas vezes travou em "10K é muito para
       mim". A resposta é que existem 2K e 5K, e isso nunca foi dito ainda. */
    distancias: {
      chip: contagem,
      titulo: "Tem uma distância para o seu domingo.",
      subtitulo: EVENTO.distanciasCurta,
      abertura:
        `${saudacao} A ${escapeHtml(EVENTO.nome)} tem ${escapeHtml(EVENTO.distancias)}, e as três largam e chegam no mesmo lugar, ` +
        `com a mesma estrutura e a mesma festa no fim. Não precisa estar treinando para maratona: ` +
        `o 2K existe justamente para quem vai caminhar com a família e ainda assim quer a medalha e o churrasquinho.`,
      botao: "Escolher minha distância",
      rotuloCupom: `Vale para qualquer distância`,
      fechamento: "2K, 5K ou 10K. A festa no fim é a mesma.",
      legendaBotao: legendaPadrao,
    },
    /* Etapa 6: logística. Quem está em cima do muro a esta altura costuma travar
       em pergunta prática, e este e-mail responde todas antes de pedir a compra. */
    logistica: {
      chip: contagem,
      titulo: `Como vai ser o seu ${EVENTO.diaSemana}.`,
      subtitulo: `Largada ${EVENTO.largada}, ${EVENTO.local}.`,
      abertura:
        `${saudacao} No dia ${escapeHtml(EVENTO.dataLabel)}, a largada é às ${escapeHtml(EVENTO.largada)} e ` +
        `sai do ${escapeHtml(EVENTO.local)}, que também é a chegada: você termina a prova no mesmo lugar de onde saiu, ` +
        `e a festa com churrasquinho e Corona acontece ali mesmo. ${escapeHtml(EVENTO.distancias)} para escolher.`,
      botao: "Garantir minha vaga",
      rotuloCupom: `Seus ${EVENTO.desconto} off`,
      fechamento: `${contagemFrase(agora)}.`,
      legendaBotao: legendaPadrao,
    },
    /* Etapa 7: véspera. A urgência aqui é a mais simples e a mais verdadeira de
       todas: depois de amanhã não existe mais inscrição para comprar. */
    vespera: {
      chip: contagem,
      titulo: `${contagem}.`,
      subtitulo: `Última chance de usar o ${EVENTO.cupom}.`,
      abertura:
        `${saudacao} ${escapeHtml(contagemFrase(agora))}: ${escapeHtml(EVENTO.dataExtenso)}, às ` +
        `${escapeHtml(EVENTO.largada)} no ${escapeHtml(EVENTO.local)}. Se você ficou de decidir depois, depois é agora: ` +
        `o cupom <strong style="color:${C.ink};">${escapeHtml(EVENTO.cupom)}</strong> vale enquanto houver inscrição aberta, ` +
        `e amanhã ele não serve para mais nada.`,
      botao: "Me inscrever agora",
      rotuloCupom: "Última chamada",
      fechamento: "Depois da largada não tem cupom que resolva.",
      legendaBotao: `${EVENTO.dataCurta}, ${EVENTO.diaSemana} &#183; Inscrições encerrando`,
    },
  };

  const copy = copies[variante] ?? copies.convite;

  const celulaDado = (rot: string, valor: string, ultima = false) => `
    <td width="33.33%" align="center" style="padding:15px 6px;${ultima ? "" : `border-right:1px solid rgba(10,10,10,0.1);`}">
      <p style="margin:0;font-family:${SANS};font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${C.mute};font-weight:bold;">${escapeHtml(rot)}</p>
      <p class="dado-n" style="margin:7px 0 0;font-family:${BLACK};font-size:20px;line-height:1;color:${C.ink};font-weight:900;">${escapeHtml(valor)}</p>
    </td>`;

  const listaInclusos = INCLUSOS.map(
    (i) => `<tr>
      <td style="padding:9px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:15px;line-height:1.4;color:${C.body};">
        <span style="font-size:17px;vertical-align:middle;">${i.emoji}</span>
        <span style="padding-left:8px;vertical-align:middle;">${escapeHtml(i.texto)}</span>
      </td>
    </tr>`
  ).join("");

  /* Hero de imagem só nas duas variantes que pedem. `max-width:100%` com altura
     automática porque a proporção do criativo (4:5) não pode ser travada em
     pixels: cliente que ignora o atributo `width` esticaria a foto. */
  const heroImagem = !COM_HERO_DE_IMAGEM.includes(variante)
    ? ""
    : `<tr>
            <td style="line-height:0;font-size:0;">
              <a href="${link}" target="_blank" style="text-decoration:none;">
                <img src="${hero}" alt="${escapeHtml(EVENTO.nome)}: frutas, isotônico, churrasquinho e Corona esperando na chegada" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;" />
              </a>
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
  <title>${escapeHtml(EVENTO.nome)}</title>
  <style>
    @media only screen and (max-width:620px) {
      .outer-pad { padding: 14px 8px !important; }
      .pad { padding-left: 20px !important; padding-right: 20px !important; }
      .title { font-size: 30px !important; }
      .btn-text { padding: 16px 20px !important; font-size: 14px !important; }
      .dado-n { font-size: 17px !important; }
      .logo-somma { width: 116px !important; height: 31px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.paper};width:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.paper};opacity:0;">
    ${escapeHtml(talkRunPreheader(variante, agora))}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};width:100%;">
    <tr>
      <td class="outer-pad" align="center" style="padding:24px 16px;">

        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td>
        <![endif]-->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:600px;table-layout:fixed;background:${C.paper};">

          <!-- ══ Cabeçalho: collab SOMMA × Talk Run ══ -->
          <tr>
            <td class="pad" bgcolor="${C.paper}" style="background:${C.paper};padding:22px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="line-height:0;">
                          <img class="logo-somma" src="${sommaLogo}" alt="SOMMA Club" width="140" height="38" style="display:block;width:140px;height:38px;border:0;outline:none;" />
                        </td>
                        <td valign="middle" style="padding:0 12px;font-family:${SANS};font-size:14px;line-height:1;color:${C.mute};font-weight:bold;">&#215;</td>
                        <td valign="middle">${lockupTalkRun()}</td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle" style="font-family:${SANS};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${C.primary};white-space:nowrap;padding-left:10px;font-weight:bold;">
                    ${escapeHtml(copy.chip)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td height="3" bgcolor="${C.primary}" style="background:${C.primary};font-size:0;line-height:0;">&nbsp;</td></tr>

          ${heroImagem}

          <!-- ══ Hero ══ -->
          <tr>
            <td class="pad" style="padding:36px 28px 28px;">
              <h1 class="title" style="margin:0;font-family:${SANS};font-size:36px;line-height:1.05;letter-spacing:-0.02em;color:${C.ink};font-weight:bold;">
                ${escapeHtml(copy.titulo)}
              </h1>
              <p style="margin:10px 0 0;font-family:${SANS};font-size:20px;line-height:1.3;color:${C.primary};font-weight:bold;">
                ${escapeHtml(copy.subtitulo)}
              </p>
              <p style="margin:18px 0 0;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.body};">
                ${copy.abertura}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;border-top:1px solid rgba(10,10,10,0.1);border-bottom:1px solid rgba(10,10,10,0.1);">
                <tr>
                  ${celulaDado("Data", EVENTO.dataLabel)}
                  ${celulaDado("Largada", EVENTO.largada)}
                  ${celulaDado("Percursos", EVENTO.distanciasCurta, true)}
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
                <tr><td>${botao(link, copy.botao)}</td></tr>
              </table>
              <p style="margin:12px 0 0;font-family:${SANS};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${C.mute};">
                ${copy.legendaBotao}
              </p>
            </td>
          </tr>

          <!-- ══ Bloco do cupom ══ -->
          <tr>
            <td class="pad" style="padding:24px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.primary};">
                <tr>
                  <td style="padding:22px;">
                    ${rotulo(copy.rotuloCupom, "rgba(255,255,255,0.8)")}
                    <p style="margin:9px 0 0;font-family:${BLACK};font-size:26px;line-height:1;text-transform:uppercase;color:#ffffff;font-weight:900;letter-spacing:-0.01em;">
                      CUPOM ${escapeHtml(EVENTO.cupom)}
                    </p>
                    <p style="margin:12px 0 0;font-family:${SANS};font-size:14px;line-height:1.5;color:rgba(255,255,255,0.92);">
                      <strong style="color:#ffffff;">${escapeHtml(EVENTO.desconto)} de desconto</strong> na inscrição.
                      É o único cupom com ${escapeHtml(EVENTO.desconto)} de desconto da ${escapeHtml(EVENTO.nome)}.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══ O que está incluído ══ -->
          <tr>
            <td class="pad" style="padding:30px 28px 0;">
              ${rotulo("O que vem na inscrição", C.mute, "0 0 12px")}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${listaInclusos}
              </table>
            </td>
          </tr>

          <!-- ══ Onde ══ -->
          <tr>
            <td class="pad" style="padding:26px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-left:3px solid ${C.talk};">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.3;color:${C.ink};font-weight:bold;">
                      &#128205; ${escapeHtml(EVENTO.localDetalhe)}
                    </p>
                    <p style="margin:7px 0 0;font-family:${SANS};font-size:14px;line-height:1.55;color:${C.body};">
                      ${escapeHtml(EVENTO.dataExtenso)}, ${escapeHtml(EVENTO.diaSemana)}, com largada às ${escapeHtml(EVENTO.largada)}.
                      ${escapeHtml(EVENTO.distancias)} para escolher.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══ CTA final ══ -->
          <tr>
            <td class="pad" style="padding:32px 28px 0;">
              <p style="margin:0 0 18px;font-family:${SANS};font-size:24px;line-height:1.2;letter-spacing:-0.01em;color:${C.ink};font-weight:bold;">
                ${escapeHtml(copy.fechamento)}
              </p>
              ${botao(link, copy.botao)}
              <p style="margin:12px 0 0;font-family:${SANS};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${C.mute};">
                Cupom ${escapeHtml(EVENTO.cupom)} &#183; ${escapeHtml(EVENTO.desconto)} off
              </p>
            </td>
          </tr>

          <tr><td height="32" style="height:32px;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td height="3" bgcolor="${C.primary}" style="background:${C.primary};font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- ══ Rodapé ══ -->
          <tr>
            <td class="pad" style="padding:26px 28px;">
              <p style="margin:0;font-family:${SANS};font-size:20px;line-height:1;color:${C.ink};font-weight:bold;">
                somma<span style="color:${C.primary};">.</span>
              </p>
              <p style="margin:12px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${C.mute};">
                ${escapeHtml(EVENTO.dataLabel)} &#183; ${escapeHtml(EVENTO.local)} &#183; Largada ${escapeHtml(EVENTO.largada)} &#183; ${escapeHtml(EVENTO.distanciasCurta)}
              </p>
              <p style="margin:12px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.mute};">
                Acompanhe a programação no Instagram oficial:
                <a href="${escapeHtml(EVENTO.instagramUrl)}" target="_blank" style="color:${C.primary};text-decoration:underline;">${escapeHtml(EVENTO.instagram)}</a>
              </p>
              <p style="margin:12px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.mute};">
                Se o botão não abrir, use este endereço:<br />
                <a href="${link}" target="_blank" style="color:${C.primary};text-decoration:underline;word-break:break-all;">${escapeHtml(base)}</a>
              </p>
              ${
                data.descadastroUrl
                  ? `<p style="margin:16px 0 0;font-family:${SANS};font-size:12px;line-height:1.5;color:rgba(10,10,10,0.45);">
                Você recebe este e-mail porque se cadastrou no site do SOMMA Club.
                <a href="${escapeHtml(data.descadastroUrl)}" target="_blank" style="color:${C.mute};text-decoration:underline;">Descadastrar</a>.
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
