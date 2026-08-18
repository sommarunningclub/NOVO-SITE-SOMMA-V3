import { getEmailFrom, getResendClient } from "@/lib/resend";
import {
  COMPETICAO,
  COPY,
  EVENT,
  EVENT_PATH,
  EXPERIENCE,
  MANIFESTO,
  SITE_URL,
  SOMMA_BASE,
  STEPS,
  UNITS,
  VAGAS_POR_CATEGORIA,
  VAGAS_POR_UNIDADE,
  VAGAS_TOTAIS,
} from "@/lib/desafio-esteiras/event.config";
import { EMAIL_EVOLVE_LOGO_URL, EMAIL_SOMMA_LOGO_URL } from "./desafio-esteiras-ticket";

/**
 * Campanha do Desafio das Esteiras para a base.
 *
 * São três e-mails, não três assuntos em cima do mesmo corpo. Cada variante
 * tem headline, texto, foco e TAMANHO próprios, porque o trabalho de cada uma
 * é diferente:
 *
 *   convite         apresenta o evento inteiro para quem nunca viu a LP;
 *   vagas           uma ideia só, a conta das esteiras, e some o resto;
 *   ultima-chamada  curto, uma tela, um botão.
 *
 * Regra de copy do projeto: sem travessão. Vale para tudo que a pessoa lê.
 *
 * Regra de honestidade: todo número vem do event.config ou da contagem real
 * no banco. Nada de prometer o que a organização ainda não confirmou. Em
 * particular, o e-mail nunca diz quem pode ou não competir, porque
 * `EVENT.exigeSerAlunoEvolve` segue pendente, e a catraca aparece sempre com a
 * ressalva das regras operacionais da unidade.
 *
 * As restrições de caixa de entrada mandam no layout: tabela em vez de flex,
 * CSS inline, gradient feito de duas metades sólidas, largura travada em 600px
 * e `light only` (o dark mode do Gmail inverteria o preto do evento).
 */

const C = {
  ink: "#08080a",
  ink2: "#101014",
  paper: "#f2f0ec",
  evolve: "#e0261b",
  somma: "#ff2c04",
  line: "#dedbd5",
  mute: "#8a8884",
  body: "#3a3a3e",
} as const;

const MONO = "'Courier New',Courier,monospace";
const SANS = "Arial,Helvetica,sans-serif";
const BLACK = "'Arial Black',Arial,Helvetica,sans-serif";

/**
 * Banner já recortado em 1200×500 (exibido em 600×250).
 *
 * A foto do hero da LP é retrato: cortá-la por CSS exigiria `object-fit`, que
 * Gmail e Outlook ignoram, e a imagem chegaria esmagada. Aqui o arquivo já vem
 * na proporção final, então `width`/`height` batem com o natural.
 */
export const EMAIL_HERO_URL = `${SITE_URL}/desafio-esteiras-evolve/email/hero-banner.jpg`;

export type VarianteCampanha = "convite" | "vagas" | "ultima-chamada" | "lembrete-final";

export const VARIANTES: readonly VarianteCampanha[] = [
  "convite",
  "vagas",
  "ultima-chamada",
  "lembrete-final",
] as const;

export interface DesafioEsteirasCampanhaData {
  /** Qual dos três e-mails renderizar. */
  variante?: VarianteCampanha;
  /** Primeiro nome de quem recebe. Sem ele o e-mail abre sem saudação nominal. */
  nome?: string | null;
  /** Data URI das imagens no preview; em produção entram as URLs públicas. */
  evolveLogoSrc?: string;
  sommaLogoSrc?: string;
  heroSrc?: string;
  /** UTMs para separar o tráfego desta campanha no painel. */
  utm?: string;
  /** Link de descadastro. Sem ele o rodapé não promete o que não existe. */
  descadastroUrl?: string | null;
  /**
   * Vagas de competidor ainda abertas, das {@link VAGAS_TOTAIS}. Vem da contagem
   * real no momento do disparo. Com `null`, o e-mail fala da regra sem cravar um
   * número que pode estar velho quando a pessoa abrir.
   */
  vagasRestantes?: number | null;
  /**
   * Referência de "hoje" para a contagem regressiva. Num agendamento, precisa
   * ser a data do DISPARO: o HTML é congelado quando o broadcast é criado, e um
   * e-mail escrito no sábado para sair na terça chegaria dizendo "faltam 4 dias".
   */
  agora?: Date;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstName(nome: string): string {
  return nome.trim().split(/\s+/)[0] || nome;
}

/**
 * Dias inteiros até o evento, contados por data de calendário em Brasília,
 * que é como a pessoa conta. Faltando horas, devolve 0; passado, negativo.
 */
export function diasParaOEvento(agora: Date = new Date()): number {
  const diaEm = (d: Date) =>
    Date.parse(`${d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })}T00:00:00Z`);
  return Math.round((diaEm(new Date(EVENT.inicioISO)) - diaEm(agora)) / 86_400_000);
}

/** "FALTAM 4 DIAS", "É AMANHÃ", "É HOJE". O mesmo texto do selo e do rodapé. */
export function contagemLabel(agora: Date = new Date()): string {
  const dias = diasParaOEvento(agora);
  if (dias > 1) return `FALTAM ${dias} DIAS`;
  if (dias === 1) return "É AMANHÃ";
  if (dias === 0) return "É HOJE";
  return "EVENTO ENCERRADO";
}

/* ── Copy de cada variante ───────────────────────────────────────────────── */

interface Ctx {
  contagem: string;
  dias: number;
  vagas: number | null;
}

interface CopyVariante {
  /** Nome curto para o painel de revisão. */
  rotulo: string;
  /** Etiqueta em mono no topo, à direita das logos. */
  selo: (c: Ctx) => string;
  assunto: (c: Ctx) => string;
  preheader: (c: Ctx) => string;
  kicker: string;
  headline: (c: Ctx) => string[];
  sub: string;
  /** Parágrafo de abertura. Recebe a saudação já montada. */
  intro: (saudacao: string, c: Ctx) => string;
  cta: string;
  /** Frase curta embaixo do botão. */
  ctaApoio: string;
  /** Chamada do bloco final, antes do último botão. */
  fecho: (c: Ctx) => string[];
  secoes: {
    ticker: boolean;
    manifesto: boolean;
    experiencia: boolean;
    passos: boolean;
    regra: boolean;
    unidades: boolean;
    sommaBase: boolean;
  };
}

/** Frase de vagas sempre derivada do número real, nunca escrita à mão. */
function frasePlacar(c: Ctx): string {
  if (typeof c.vagas !== "number") {
    return `São ${VAGAS_TOTAIS} vagas de competidor no total, por ordem de inscrição.`;
  }
  if (c.vagas <= 0) {
    return `As ${VAGAS_TOTAIS} vagas de competidor já foram preenchidas. Para assistir, a entrada segue liberada.`;
  }
  return `Restam ${c.vagas} das ${VAGAS_TOTAIS} vagas de competidor.`;
}

const COPY_VARIANTES: Record<VarianteCampanha, CopyVariante> = {
  convite: {
    rotulo: "Convite",
    selo: (c) => c.contagem,
    assunto: () => "Quarta-feira, 19h: quatro unidades da Evolve correndo ao mesmo tempo",
    preheader: (c) =>
      `${EVENT.dataExtenso}, ${EVENT.horaExtenso}. Música, ativações e as esteiras lado a lado. Inscrição gratuita, vaga limitada para competir. ${c.contagem.toLowerCase()}.`,
    kicker: EVENT.realizacao,
    headline: () => [...COPY.headline],
    sub: COPY.sub,
    intro: (saudacao) =>
      `${saudacao} Na <strong style="color:${C.paper};">quarta-feira, ${escapeHtml(EVENT.dataExtenso)}</strong>, às <strong style="color:${C.paper};">${escapeHtml(EVENT.horaExtenso)}</strong>, as quatro unidades da Evolve deixam de ser quatro academias e viram um evento só. Música alta, ativações, brindes e gente de todos os níveis correndo lado a lado. Você entra na disputa ou chega para viver a noite.`,
    cta: COPY.ctaPrimario,
    ctaApoio: "Gratuito. Leva menos de um minuto.",
    fecho: (c) => [`${c.contagem}.`, "SUA VAGA AINDA", "NÃO TEM DONO."],
    secoes: {
      ticker: true,
      manifesto: true,
      experiencia: true,
      passos: true,
      regra: true,
      unidades: true,
      sommaBase: true,
    },
  },

  vagas: {
    rotulo: "Vagas",
    selo: (c) => c.contagem,
    assunto: (c) =>
      typeof c.vagas === "number" && c.vagas > 0
        ? `Restam ${c.vagas} das ${VAGAS_TOTAIS} vagas para competir`
        : `${VAGAS_TOTAIS} vagas para competir, e as esteiras são contadas`,
    preheader: (c) =>
      `${COMPETICAO.esteirasPorBateria} esteiras por unidade, ${VAGAS_POR_CATEGORIA} vagas em cada categoria. ${frasePlacar(c)} ${EVENT.dataCurta}, ${EVENT.horaExtenso}.`,
    kicker: "A conta da competição",
    headline: () => ["QUATRO", "ESTEIRAS."],
    sub: `${VAGAS_POR_CATEGORIA} VAGAS EM CADA CATEGORIA.`,
    intro: (saudacao, c) =>
      `${saudacao} A conta do Desafio das Esteiras cabe em uma linha: cada unidade da Evolve tem <strong style="color:${C.paper};">${COMPETICAO.esteirasPorBateria} esteiras</strong>, e não existe a quinta. Cada categoria roda <strong style="color:${C.paper};">${COMPETICAO.bateriasPorCategoria} baterias</strong> de ${COMPETICAO.esteirasPorBateria} pessoas, e é isso que fecha as ${VAGAS_POR_CATEGORIA} vagas do feminino e as ${VAGAS_POR_CATEGORIA} do masculino. <strong style="color:${C.paper};">${escapeHtml(frasePlacar(c))}</strong>`,
    cta: "PEGAR MINHA VAGA",
    ctaApoio: "Gratuito. A vaga é por ordem de inscrição.",
    fecho: () => ["QUANDO A SUA", "CATEGORIA LOTA,", "ACABOU."],
    secoes: {
      ticker: true,
      manifesto: false,
      experiencia: false,
      passos: false,
      regra: true,
      unidades: true,
      sommaBase: false,
    },
  },

  "ultima-chamada": {
    rotulo: "Última chamada",
    selo: (c) => c.contagem,
    assunto: (c) =>
      c.dias === 1
        ? "É amanhã: 19h, quatro unidades, uma noite só"
        : c.dias === 0
          ? "É hoje: 19h nas quatro unidades da Evolve"
          : `${EVENT.dataCurta}: último aviso antes da largada`,
    preheader: (c) =>
      `${c.contagem.toLowerCase()}. ${EVENT.horaExtenso} nas quatro unidades da Evolve. Este é o último e-mail antes da largada.`,
    kicker: "Último aviso",
    headline: (c) =>
      c.dias === 1 ? ["É AMANHÃ.", "19 HORAS."] : c.dias === 0 ? ["É HOJE.", "19 HORAS."] : ["É AGORA", "OU NUNCA."],
    sub: COPY.sub,
    intro: (saudacao, c) =>
      `${saudacao} ${
        c.dias === 1 ? "Amanhã" : c.dias === 0 ? "Hoje" : `Dia ${escapeHtml(EVENT.dataExtenso)}`
      }, às <strong style="color:${C.paper};">${escapeHtml(EVENT.horaExtenso)}</strong>, as esteiras das quatro unidades da Evolve começam a rodar ao mesmo tempo. ${escapeHtml(frasePlacar(c))} Se você ainda não garantiu o seu ticket, este é o último e-mail antes da largada.`,
    cta: "GARANTIR AGORA",
    ctaApoio: "Gratuito. Leva menos de um minuto.",
    fecho: (c) => [`${c.contagem}.`, "A ESTEIRA NÃO", "ESPERA NINGUÉM."],
    secoes: {
      ticker: false,
      manifesto: false,
      experiencia: false,
      passos: false,
      regra: false,
      unidades: true,
      sommaBase: false,
    },
  },

  /**
   * O segundo e-mail do dia do evento. Não repete "última-chamada" para quem já
   * ignorou uma vez hoje: essa manda pela manhã para todo mundo, esta manda à
   * tarde só para quem não abriu a de manhã (a régua decide o "quem", não este
   * arquivo). Assunto e corpo diferentes de propósito, focados em horário —
   * "faltam poucas horas" é uma informação que a manhã não tinha.
   */
  "lembrete-final": {
    rotulo: "Lembrete final",
    selo: (c) => c.contagem,
    assunto: () => `Faltam poucas horas: ${EVENT.horaExtenso} nas quatro unidades`,
    preheader: (c) =>
      `Última mensagem sobre o Desafio das Esteiras hoje. ${EVENT.horaExtenso}, quatro unidades da Evolve. ${frasePlacar(c)}`,
    kicker: "Faltam poucas horas",
    headline: () => ["FALTAM", "POUCAS HORAS."],
    sub: `${escapeHtml(EVENT.horaExtenso).toUpperCase()} NAS QUATRO UNIDADES.`,
    intro: (saudacao, c) =>
      `${saudacao} Esta é a última mensagem sobre o Desafio das Esteiras hoje. As esteiras das quatro unidades da Evolve ligam às <strong style="color:${C.paper};">${escapeHtml(EVENT.horaExtenso)}</strong>. ${escapeHtml(frasePlacar(c))} Se ainda não garantiu o ticket, é agora.`,
    cta: "GARANTIR AGORA",
    ctaApoio: "Gratuito. Leva menos de um minuto.",
    fecho: () => ["A ESTEIRA NÃO", "ESPERA NINGUÉM."],
    secoes: {
      ticker: false,
      manifesto: false,
      experiencia: false,
      passos: false,
      regra: false,
      unidades: true,
      sommaBase: false,
    },
  },
};

function ctxDe(agora: Date, vagas: number | null | undefined): Ctx {
  return {
    contagem: contagemLabel(agora),
    dias: diasParaOEvento(agora),
    vagas: typeof vagas === "number" ? vagas : null,
  };
}

export function campanhaRotulo(variante: VarianteCampanha): string {
  return COPY_VARIANTES[variante].rotulo;
}

export function desafioEsteirasCampanhaSubject(
  variante: VarianteCampanha = "convite",
  opts: { agora?: Date; vagasRestantes?: number | null } = {}
): string {
  return COPY_VARIANTES[variante].assunto(ctxDe(opts.agora ?? new Date(), opts.vagasRestantes));
}

/** Aparece na lista da caixa de entrada, ao lado do assunto. */
export function desafioEsteirasCampanhaPreheader(
  variante: VarianteCampanha = "convite",
  opts: { agora?: Date; vagasRestantes?: number | null } = {}
): string {
  return COPY_VARIANTES[variante].preheader(ctxDe(opts.agora ?? new Date(), opts.vagasRestantes));
}

/* ── Peças reaproveitadas ────────────────────────────────────────────────── */

/** Rótulo técnico em mono, o "painel de instrumento" da identidade. */
function rotulo(texto: string, cor: string = C.mute, margem = "0"): string {
  return `<p style="margin:${margem};font-family:${MONO};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${cor};">${escapeHtml(texto)}</p>`;
}

/** Barra de energia: duas metades sólidas, porque e-mail não carrega gradient. */
function barraEnergia(altura = 3): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td width="50%" height="${altura}" bgcolor="${C.evolve}" style="background:${C.evolve};font-size:0;line-height:0;">&nbsp;</td>
      <td width="50%" height="${altura}" bgcolor="${C.somma}" style="background:${C.somma};font-size:0;line-height:0;">&nbsp;</td>
    </tr>
  </table>`;
}

/** Botão à prova de cliente: célula com bgcolor e âncora ocupando o bloco. */
function botao(href: string, texto: string, fundo: string = C.evolve): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" bgcolor="${fundo}" style="background:${fundo};">
        <a href="${href}" target="_blank" style="display:block;text-decoration:none;">
          <span class="btn-text" style="display:block;padding:19px 16px;font-family:${BLACK};font-size:15px;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;font-weight:900;">${escapeHtml(texto)}</span>
        </a>
      </td>
    </tr>
  </table>`;
}

export function renderDesafioEsteirasCampanhaEmail(
  data: DesafioEsteirasCampanhaData = {}
): string {
  const variante = data.variante ?? "convite";
  const v = COPY_VARIANTES[variante];
  const evolveLogo = data.evolveLogoSrc ?? EMAIL_EVOLVE_LOGO_URL;
  const sommaLogo = data.sommaLogoSrc ?? EMAIL_SOMMA_LOGO_URL;
  const hero = data.heroSrc ?? EMAIL_HERO_URL;
  const agora = data.agora ?? new Date();
  const ctx = ctxDe(agora, data.vagasRestantes);

  const utm =
    data.utm ??
    `utm_source=email&utm_medium=campanha&utm_campaign=desafio-esteiras&utm_content=${variante}`;
  const link = `${SITE_URL}${EVENT_PATH}?${utm}`;
  const linkInscricao = `${SITE_URL}${EVENT_PATH}/inscricao?${utm}`;

  // A chamada fica sobre o preto do evento: o nome precisa ser claro, não `ink`.
  const saudacao = data.nome
    ? `Oi, <strong style="color:${C.paper};">${escapeHtml(firstName(data.nome))}</strong>.`
    : "Oi!";

  const celulaDado = (rot: string, valor: string, ultima = false) => `
    <td width="33.33%" align="center" style="padding:15px 6px;${ultima ? "" : `border-right:1px solid rgba(255,255,255,0.14);`}">
      <p style="margin:0;font-family:${MONO};font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(242,240,236,0.45);">${escapeHtml(rot)}</p>
      <p class="dado-n" style="margin:7px 0 0;font-family:${BLACK};font-size:24px;line-height:1;color:${C.paper};font-weight:900;">${escapeHtml(valor)}</p>
    </td>`;

  /* Ticker: na LP ele corre em loop. Aqui é uma faixa estática e que PODE
     quebrar linha. Com nowrap na linha inteira, a fila de itens empurra a
     largura da tabela e estoura os 600px (overflow:hidden de um td não corta em
     caixa de entrada). O espaço depois do losango é o ponto de quebra. */
  const tickerItens = ["4 UNIDADES", "1 DESAFIO", EVENT.dataLabel, EVENT.horaLabel]
    .map(
      (t) =>
        `<span style="font-family:${BLACK};font-size:15px;letter-spacing:-0.01em;text-transform:uppercase;color:#ffffff;white-space:nowrap;">${escapeHtml(t)}</span>`
    )
    .join(`<span style="color:rgba(255,255,255,0.55);padding:0 9px;font-size:11px;">&#9670;</span> `);

  const manifesto = MANIFESTO.map(
    (linha) =>
      `<p class="manifesto" style="margin:0;font-family:${BLACK};font-size:34px;line-height:0.94;letter-spacing:-0.03em;text-transform:uppercase;color:${C.paper};font-weight:900;">${escapeHtml(linha)}</p>`
  ).join("");

  const destaques = EXPERIENCE.filter((e) => e.destaque);
  const demais = EXPERIENCE.filter((e) => !e.destaque);

  const cartoesDestaque = destaques
    .map(
      (e) => `<tr>
        <td style="padding:0 0 10px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-left:3px solid ${C.somma};">
            <tr>
              <td style="padding:15px 18px;">
                <p style="margin:0;font-family:${BLACK};font-size:16px;line-height:1.15;text-transform:uppercase;color:${C.ink};font-weight:900;letter-spacing:-0.01em;">${escapeHtml(e.titulo)}</p>
                <p style="margin:7px 0 0;font-family:${SANS};font-size:14px;line-height:1.55;color:${C.body};">${escapeHtml(e.texto)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  // nowrap por item mantém "Brindes SOMMA Club" inteiro. O espaço depois do
  // separador é o que permite a quebra entre itens.
  const listaDemais = demais
    .map(
      (e) =>
        `<span style="font-family:${SANS};font-size:14px;color:${C.body};white-space:nowrap;">${escapeHtml(e.titulo)}</span>`
    )
    .join(`<span style="color:${C.somma};padding:0 7px;">&#183;</span> `);

  const passos = STEPS.map(
    (s) => `<td class="stack" width="50%" valign="top" style="padding:0 10px 16px 0;">
      <p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:0.16em;color:${C.evolve};">${escapeHtml(s.n)}</p>
      <p style="margin:5px 0 0;font-family:${SANS};font-size:15px;line-height:1.3;color:${C.ink};font-weight:bold;">${escapeHtml(s.titulo)}</p>
      <p style="margin:3px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${C.mute};">${escapeHtml(s.texto)}</p>
    </td>`
  )
    .reduce<string[][]>((linhas, celula, i) => {
      if (i % 2 === 0) linhas.push([celula]);
      else linhas[linhas.length - 1].push(celula);
      return linhas;
    }, [])
    .map((par) => `<tr>${par.join("")}${par.length === 1 ? '<td width="50%"></td>' : ""}</tr>`)
    .join("");

  const unidades = UNITS.map((u) => {
    const selo = u.sommaBase
      ? `<span style="display:inline-block;background:${C.somma};color:${C.ink};font-family:${MONO};font-size:9px;font-weight:bold;letter-spacing:0.14em;padding:3px 6px;margin-left:8px;vertical-align:middle;">${escapeHtml(SOMMA_BASE.selo)}</span>`
      : "";
    return `<tr>
      <td style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:15px;color:${C.ink};">
        <strong>${escapeHtml(u.curto)}</strong>${selo}
        <span style="display:block;font-size:13px;color:${C.mute};padding-top:3px;">${escapeHtml(u.endereco)}</span>
      </td>
    </tr>`;
  }).join("");

  const secao = (ligada: boolean, html: string) => (ligada ? html : "");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(EVENT.nome)}</title>
  <style>
    @media only screen and (max-width:620px) {
      .outer-pad { padding: 14px 8px !important; }
      .pad { padding-left: 20px !important; padding-right: 20px !important; }
      .title { font-size: 36px !important; }
      .manifesto { font-size: 28px !important; }
      .btn-text { padding: 17px 12px !important; font-size: 13px !important; }
      .dado-n { font-size: 20px !important; }
      .logo-ev { width: 68px !important; height: 18px !important; }
      .logo-so { width: 67px !important; height: 18px !important; }
      /* Passos em duas colunas viram uma só: 15px é estreito demais para dividir. */
      .stack { display: block !important; width: 100% !important; padding-right: 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.ink};width:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.ink};opacity:0;">
    ${escapeHtml(v.preheader(ctx))}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ink};width:100%;">
    <tr>
      <td class="outer-pad" align="center" style="padding:24px 16px;">

        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td>
        <![endif]-->
        <!--
          table-layout:fixed não é enfeite. Em layout automático a largura
          mínima da tabela é a do conteúdo mais largo, e o banner de 600px é
          exatamente isso: num celular de 390px a tabela inteira ficava travada
          em 600 e o e-mail sangrava para fora da tela (max-width não encolhe
          conteúdo abaixo do min-content). Com layout fixo, a coluna segue a
          largura da tabela e a imagem, em width:100%, acompanha.
        -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:600px;table-layout:fixed;background:${C.paper};">

          <!-- ══ Cabeçalho: as duas marcas e o estado do evento ══ -->
          <tr>
            <td class="pad" bgcolor="${C.ink}" style="background:${C.ink};padding:20px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="line-height:0;">
                          <img class="logo-ev" src="${evolveLogo}" alt="Evolve" width="84" height="22" style="display:block;width:84px;height:22px;border:0;outline:none;" />
                        </td>
                        <td valign="middle" style="padding:0 10px;font-family:${SANS};font-size:11px;line-height:1;color:${C.somma};font-weight:bold;">&#215;</td>
                        <td valign="middle" style="line-height:0;">
                          <img class="logo-so" src="${sommaLogo}" alt="SOMMA Club" width="82" height="22" style="display:block;width:82px;height:22px;border:0;outline:none;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle" style="font-family:${MONO};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${C.somma};white-space:nowrap;padding-left:12px;">
                    ${escapeHtml(v.selo(ctx))}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="padding:0;font-size:0;line-height:0;">${barraEnergia()}</td></tr>

          <!-- ══ Hero ══ -->
          <tr>
            <td style="padding:0;font-size:0;line-height:0;background:${C.ink};">
              <img src="${hero}" alt="" width="600" height="250" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;" />
            </td>
          </tr>

          <!-- ══ Chamada ══ -->
          <tr>
            <td class="pad" bgcolor="${C.ink}" style="background:${C.ink};padding:26px 28px 28px;">
              ${rotulo(v.kicker, C.somma)}
              <h1 class="title" style="margin:12px 0 0;font-family:${BLACK};font-size:44px;line-height:0.86;letter-spacing:-0.04em;text-transform:uppercase;color:${C.paper};font-weight:900;">
                ${v.headline(ctx).map(escapeHtml).join("<br />")}
              </h1>
              <p style="margin:14px 0 0;font-family:${BLACK};font-size:18px;line-height:1.15;text-transform:uppercase;color:${C.somma};font-weight:900;letter-spacing:-0.01em;">
                ${escapeHtml(v.sub)}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;border-top:1px solid rgba(255,255,255,0.14);border-bottom:1px solid rgba(255,255,255,0.14);">
                <tr>
                  ${celulaDado("Data", EVENT.dataLabel)}
                  ${celulaDado("Início", EVENT.horaLabel)}
                  ${celulaDado("Unidades", String(UNITS.length).padStart(2, "0"), true)}
                </tr>
              </table>

              <p style="margin:22px 0 0;font-family:${SANS};font-size:16px;line-height:1.6;color:rgba(242,240,236,0.82);">
                ${v.intro(saudacao, ctx)}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
                <tr><td>${botao(linkInscricao, v.cta)}</td></tr>
              </table>
              <p style="margin:11px 0 0;font-family:${MONO};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(242,240,236,0.5);">
                ${escapeHtml(v.ctaApoio)}
              </p>
            </td>
          </tr>

          ${secao(
            v.secoes.ticker,
            `<tr>
            <td align="center" bgcolor="${C.evolve}" style="background:${C.evolve};padding:12px 20px;line-height:1.7;">
              ${tickerItens}
            </td>
          </tr>`
          )}

          ${secao(
            v.secoes.manifesto,
            `<tr>
            <td class="pad" bgcolor="${C.ink2}" style="background:${C.ink2};padding:32px 28px;">
              ${manifesto}
              <p style="margin:18px 0 0;font-family:${MONO};font-size:13px;line-height:1.7;letter-spacing:0.08em;color:${C.somma};">
                ${escapeHtml(COPY.kicker)}
              </p>
            </td>
          </tr>`
          )}

          ${secao(
            v.secoes.experiencia,
            `<tr>
            <td class="pad" style="padding:30px 28px 0;">
              ${rotulo("A experiência", C.mute, "0 0 12px")}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${cartoesDestaque}
              </table>
              <p style="margin:12px 0 0;line-height:2;">${listaDemais}</p>
            </td>
          </tr>`
          )}

          ${secao(
            v.secoes.passos,
            `<tr>
            <td class="pad" style="padding:30px 28px 0;">
              ${rotulo("Como funciona", C.mute, "0 0 14px")}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${passos}
              </table>
            </td>
          </tr>`
          )}

          ${secao(
            v.secoes.regra,
            `<tr>
            <td class="pad" style="padding:22px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-left:3px solid ${C.evolve};">
                <tr>
                  <td style="padding:16px 18px;font-family:${SANS};font-size:15px;line-height:1.55;color:${C.body};">
                    Cada unidade tem <strong style="color:${C.ink};">${COMPETICAO.esteirasPorBateria} esteiras</strong>.
                    Cada categoria roda <strong style="color:${C.ink};">${COMPETICAO.bateriasPorCategoria} baterias</strong>, o que fecha
                    <strong style="color:${C.ink};">${VAGAS_POR_CATEGORIA} vagas no feminino e ${VAGAS_POR_CATEGORIA} no masculino</strong>
                    por unidade, ${VAGAS_POR_UNIDADE} competidores em cada uma e ${VAGAS_TOTAIS} no total.
                    <br /><br />
                    <strong style="color:${C.ink};">${escapeHtml(frasePlacar(ctx))}</strong> Quando a sua categoria lota, acabou.
                    <br /><br />
                    Não precisa ser atleta. Dá para competir ou só chegar, assistir e curtir a noite.
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
          )}

          ${secao(
            v.secoes.unidades,
            `<tr>
            <td class="pad" style="padding:30px 28px 0;">
              ${rotulo("Onde vai rolar", C.mute, "0 0 6px")}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${unidades}
              </table>
            </td>
          </tr>`
          )}

          ${secao(
            v.secoes.sommaBase,
            `<tr>
            <td class="pad" style="padding:18px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ink};">
                <tr>
                  <td style="padding:18px;">
                    <!-- Selo em tabela própria: <p> com inline-block vira faixa cheia no Outlook. -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="${C.somma}" style="background:${C.somma};padding:4px 7px;font-family:${MONO};font-size:9px;font-weight:bold;letter-spacing:0.14em;color:${C.ink};">${escapeHtml(SOMMA_BASE.selo)}</td>
                      </tr>
                    </table>
                    <p style="margin:11px 0 0;font-family:${BLACK};font-size:17px;line-height:1.15;text-transform:uppercase;color:${C.paper};font-weight:900;letter-spacing:-0.01em;">${escapeHtml(SOMMA_BASE.titulo)}</p>
                    <p style="margin:7px 0 0;font-family:${SANS};font-size:14px;line-height:1.55;color:rgba(242,240,236,0.65);">${escapeHtml(SOMMA_BASE.explicacao)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
          )}

          <!-- ══ CTA final ══ -->
          <tr>
            <td class="pad" style="padding:30px 28px 0;">
              <p style="margin:0 0 16px;font-family:${BLACK};font-size:26px;line-height:0.95;letter-spacing:-0.03em;text-transform:uppercase;color:${C.ink};font-weight:900;">
                ${v.fecho(ctx).map(escapeHtml).join("<br />")}
              </p>
              ${botao(linkInscricao, v.cta)}
              <p style="margin:11px 0 0;font-family:${MONO};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${C.mute};">
                ${escapeHtml(EVENT.dataCurta)} &#183; ${escapeHtml(EVENT.horaLabel)} &#183; Gratuito
              </p>
            </td>
          </tr>

          <!-- Respiro antes do rodapé: margin em td não vale em e-mail -->
          <tr><td height="32" style="height:32px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr><td style="padding:0;font-size:0;line-height:0;">${barraEnergia()}</td></tr>

          <!-- ══ Rodapé ══ -->
          <tr>
            <td class="pad" bgcolor="${C.ink}" style="background:${C.ink};padding:26px 28px;">
              <p style="margin:0;font-family:${BLACK};font-size:22px;line-height:1;text-transform:uppercase;color:${C.paper};font-weight:900;letter-spacing:-0.02em;">
                ${escapeHtml(EVENT.dataLabel)} &#183; ${escapeHtml(EVENT.horaLabel)}
              </p>
              <p style="margin:12px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.mute};">
                Se o botão não abrir, use este endereço:<br />
                <a href="${link}" target="_blank" style="color:${C.somma};text-decoration:underline;word-break:break-all;">${SITE_URL}${EVENT_PATH}</a>
              </p>
              ${
                data.descadastroUrl
                  ? `<p style="margin:16px 0 0;font-family:${SANS};font-size:12px;line-height:1.5;color:#5c5a57;">
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

/**
 * Envio individual da campanha.
 *
 * Deixada pronta mas não ligada a nenhuma rota: disparar para a base é decisão
 * de quem opera, não efeito colateral de um deploy. Para os milhares de
 * endereços da base, o caminho é o broadcast do Resend (com descadastro nativo
 * e controle de taxa) em vez de um laço chamando isto aqui.
 */
export async function sendDesafioEsteirasCampanha(params: {
  email: string;
  nome?: string | null;
  variante?: VarianteCampanha;
  descadastroUrl?: string | null;
  vagasRestantes?: number | null;
}): Promise<{ ok: boolean; erro?: string }> {
  const resend = getResendClient();
  const from = getEmailFrom();
  if (!resend || !from) return { ok: false, erro: "Resend não configurado." };

  const variante = params.variante ?? "convite";

  try {
    await resend.emails.send({
      from,
      to: params.email,
      subject: desafioEsteirasCampanhaSubject(variante, {
        vagasRestantes: params.vagasRestantes ?? null,
      }),
      html: renderDesafioEsteirasCampanhaEmail({
        variante,
        nome: params.nome ?? undefined,
        descadastroUrl: params.descadastroUrl ?? null,
        vagasRestantes: params.vagasRestantes ?? null,
      }),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : "Falha no envio." };
  }
}
