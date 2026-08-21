import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Campanha do Sunset Wine Run para a base inteira.
 *
 * Evento de terceiro (Vinícola Brasília, venda pela Sportickets), não um
 * evento SOMMA. Por isso o cabeçalho é um collab: os dois logos lado a lado,
 * não um co-branding disfarçado de "o SOMMA promove".
 *
 * O visual segue a identidade REAL do site (sommaclub.com.br), lida direto do
 * código-fonte, não inventada: `tailwind.config.ts` e `app/globals.css` dão
 * `ink #0a0a0a`, `primary #ff2c03`, `light #f5f5f5`. É outra família visual da
 * usada nos e-mails do Evolve/Desafio das Esteiras (aqueles seguem a
 * identidade da LP do evento, que é mais "pôster de academia"); aqui é a
 * identidade da HOME do SOMMA Club, mais parecida com "somma." em caixa baixa
 * e o ponto vermelho do wordmark real.
 *
 * Os dois logos em PNG (public/sunset-wine-run/email/) são rasterizados a
 * partir dos SVGs de verdade do site: e-mail não renderiza SVG de forma
 * confiável (Outlook principalmente). `logo-somma-dark.svg` é a variante
 * preto+vermelho pensada para fundo claro — é essa que usamos, porque o
 * cabeçalho é claro (ver abaixo por quê).
 *
 * O cupom é `SOMA10`, sem o segundo M — confirmado duas vezes no briefing.
 * Não "corrijo" para `SOMMA10`: errar o código quebra o checkout pra base
 * inteira, e quem decide a grafia certa é quem configurou o cupom, não eu.
 *
 * O prazo (até 19/08) é uma DATA fixa do briefing, não uma janela rolante a
 * partir do envio. `prazoLabel` deriva de `EVENTO.prazoCupomISO`, então se a
 * data mudar é um lugar só para atualizar.
 *
 * Fundo claro do início ao fim (`paper`), não só no cabeçalho: além de bater
 * com o pedido de um layout mais claro, o logo da Sunset Wine Run
 * (public/SWR-LOGO.png) é vinho+marrom sólidos, cores escuras feitas para
 * fundo claro — em cima de um fundo ink ele desapareceria. `C.ink` continua
 * existindo como cor de TEXTO (títulos, números), não mais como fundo.
 *
 * `LINK_VENDAS_PENDENTE` (histórico): o briefing trouxe "[INSERIR LINK DE
 * VENDAS]" como placeholder literal, e `dispararEtapa`/`dispararCampanha`
 * recusavam rodar enquanto `EVENTO.linkIngresso` fosse esse valor. O link real
 * chegou depois e confirmado por quem pediu a campanha: a mesma URL do
 * briefing original, com `cupom=SOMMA` (parâmetro fixo da Sportickets,
 * deliberadamente diferente do `SOMA10` que a pessoa aplica no checkout). A
 * constante continua exportada como rede de segurança para a PRÓXIMA campanha
 * que nascer sem link ainda definido.
 */

const C = {
  ink: "#0a0a0a", // app/globals.css --dark-bg
  card: "#0e0e0e", // --dark-card
  paper: "#f5f5f5", // --bg-light
  primary: "#ff2c03", // --primary, tailwind.config.ts colors.primary
  line: "#e5e5e5",
  mute: "#737373", // --text-secondary
  body: "#18181b", // --text-dark
} as const;

const SANS = "Arial,Helvetica,sans-serif";
const BLACK = "'Arial Black',Arial,Helvetica,sans-serif";

// Tipo `string` explícito, não literal: com `EVENTO` em `as const`,
// `linkIngresso` vira o tipo do valor exato configurado. Se este constante
// ficasse como literal também, comparar os dois (a guarda contra disparar com
// o placeholder) viraria comparação de dois literais sem overlap — sempre
// `false` para o TypeScript, mesmo antes de alguém trocar o link de volta.
export const LINK_VENDAS_PENDENTE: string = "https://LINK-DE-VENDAS-PENDENTE.exemplo";

export const EMAIL_SWR_LOGO_URL = "https://sommaclub.com.br/SWR-LOGO.png";
export const EMAIL_SOMMA_COLLAB_LOGO_URL =
  "https://sommaclub.com.br/sunset-wine-run/email/somma-logo-dark.png";

function emailAsset(caminho: string): Buffer {
  return readFileSync(join(process.cwd(), "public", caminho));
}

/** Data URIs dos logos, para o preview local não depender do deploy nem de rede. */
export function sunsetWineRunLogoDataUris(): { swr: string; somma: string } {
  return {
    swr: `data:image/png;base64,${emailAsset("SWR-LOGO.png").toString("base64")}`,
    somma: `data:image/png;base64,${emailAsset("sunset-wine-run/email/somma-logo-dark.png").toString("base64")}`,
  };
}

export const EVENTO = {
  nome: "Sunset Wine Run",
  dataLabel: "29.08",
  dataExtenso: "29 de agosto de 2026",
  dataCurta: "29 AGO 2026",
  diaSemana: "sábado",
  local: "Vinícola Brasília",
  distancia: "4 KM",
  recepcao: "16h",
  largada: "17h",
  // `cupom=SOMMA` (sem o 10) é parâmetro fixo/de rastreio da Sportickets,
  // confirmado deliberadamente distinto do SOMA10 que a pessoa aplica no
  // checkout — não "corrigir" pra bater com EVENTO.cupom abaixo.
  linkIngresso: "https://www.sportickets.com.br/pt/event/sunset-wine-run?cupom=SOMMA",
  cupom: "SOMA10",
  desconto: "10%",
  /** Fim da janela do cupom: data fixa do briefing, não relativa ao envio. */
  prazoCupomISO: "2026-08-19T23:59:59-03:00",
  instagram: "@sunsetwinerun",
  instagramUrl: "https://www.instagram.com/sunsetwinerun/",
  esquenta: {
    data: "23/08",
    local: "Condomínio Reserva Jardim Botânico",
    itens: ["Aula de yoga", "Café da manhã", "Ativações de bem-estar", "Vista privilegiada"],
  },
} as const;

const INCLUSOS = [
  { emoji: "🎽", texto: "Kit oficial com camiseta, bolsa e medalha" },
  { emoji: "🎁", texto: "Brindes de marcas parceiras" },
  { emoji: "🍷", texto: "Taça de vinho personalizada" },
  { emoji: "🥂", texto: "Welcome wine na chegada" },
  { emoji: "🍽️", texto: "Receptivo gastronômico" },
  { emoji: "🧘", texto: "Ativações de bem-estar e experiências de marcas" },
  { emoji: "🎶", texto: "Música e Sunset Party na Vinícola Brasília" },
] as const;

const VANTAGENS_CUPOM = [
  `${EVENTO.desconto} de desconto no ingresso`,
  "participação no sorteio de uma garrafa de vinho da Vinícola Brasília",
  "uma vaga no esquenta oficial da Sunset Wine Run, no dia 23/08",
] as const;

export interface SunsetWineRunData {
  /** Primeiro nome de quem recebe. Sem ele o e-mail abre com um "Oi!". */
  nome?: string | null;
  swrLogoSrc?: string;
  sommaLogoSrc?: string;
  /** UTMs para separar o tráfego desta campanha no painel. */
  utm?: string;
  /** Link real de vendas. Sem ele, cai no placeholder e o e-mail não deve sair. */
  linkIngresso?: string;
  descadastroUrl?: string | null;
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

/** "até 19/08", como no briefing. Data fixa, não relativa a quando o e-mail sai. */
export function prazoLabel(): string {
  const fim = new Date(EVENTO.prazoCupomISO);
  return fim.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });
}

export function sunsetWineRunSubject(): string {
  return "10% OFF + esquenta oficial + chance de ganhar vinho na Sunset Wine Run";
}

export function sunsetWineRunPreheader(): string {
  return `Cupom ${EVENTO.cupom}: ${EVENTO.desconto} off, sorteio de vinho e vaga no esquenta oficial. Só até ${prazoLabel()}.`;
}

/* ── Peças reaproveitadas do sistema visual ─────────────────────────────── */

function rotulo(texto: string, cor: string = C.mute, margem = "0"): string {
  return `<p style="margin:${margem};font-family:${SANS};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${cor};font-weight:bold;">${escapeHtml(texto)}</p>`;
}

/**
 * Botão pílula, como os do site (`rounded-full bg-primary`). Outlook desktop
 * ignora `border-radius` em td/a e cai para quina reta: degrada, não quebra,
 * mesmo risco que o resto dos botões deste projeto já assume.
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

export function renderSunsetWineRunEmail(data: SunsetWineRunData = {}): string {
  const swrLogo = data.swrLogoSrc ?? EMAIL_SWR_LOGO_URL;
  const sommaLogo = data.sommaLogoSrc ?? EMAIL_SOMMA_COLLAB_LOGO_URL;
  const utm = data.utm ?? "utm_source=email&utm_medium=campanha&utm_campaign=sunset-wine-run-ago2026";
  const base = data.linkIngresso ?? EVENTO.linkIngresso;
  const link = `${base}${base.includes("?") ? "&" : "?"}${utm}`;

  const saudacao = data.nome
    ? `Oi, <strong style="color:${C.ink};">${escapeHtml(firstName(data.nome))}</strong>.`
    : "Oi!";

  const celulaDado = (rot: string, valor: string, ultima = false) => `
    <td width="33.33%" align="center" style="padding:15px 6px;${ultima ? "" : `border-right:1px solid rgba(10,10,10,0.1);`}">
      <p style="margin:0;font-family:${SANS};font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${C.mute};font-weight:bold;">${escapeHtml(rot)}</p>
      <p class="dado-n" style="margin:7px 0 0;font-family:${BLACK};font-size:22px;line-height:1;color:${C.ink};font-weight:900;">${escapeHtml(valor)}</p>
    </td>`;

  const listaInclusos = INCLUSOS.map(
    (i) => `<tr>
      <td style="padding:9px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:15px;line-height:1.4;color:${C.body};">
        <span style="font-size:17px;vertical-align:middle;">${i.emoji}</span>
        <span style="padding-left:8px;vertical-align:middle;">${escapeHtml(i.texto)}</span>
      </td>
    </tr>`
  ).join("");

  const listaVantagens = VANTAGENS_CUPOM.map(
    (v, i) => `<tr>
      <td style="padding:${i === 0 ? "0" : "7px"} 0 0;font-family:${SANS};font-size:14px;line-height:1.5;color:rgba(255,255,255,0.9);">
        <strong style="color:#ffffff;">${i + 1}.</strong> ${escapeHtml(v)}
      </td>
    </tr>`
  ).join("");

  const listaEsquenta = EVENTO.esquenta.itens
    .map(
      (i) =>
        `<span style="font-family:${SANS};font-size:14px;color:${C.body};white-space:nowrap;">${escapeHtml(i)}</span>`
    )
    .join(`<span style="color:${C.primary};padding:0 7px;">&#183;</span> `);

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
      .title { font-size: 32px !important; }
      .btn-text { padding: 16px 20px !important; font-size: 14px !important; }
      .dado-n { font-size: 18px !important; }
      .logo-swr { width: 88px !important; height: 39px !important; }
      .logo-somma { width: 116px !important; height: 31px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.paper};width:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.paper};opacity:0;">
    ${escapeHtml(sunsetWineRunPreheader())}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};width:100%;">
    <tr>
      <td class="outer-pad" align="center" style="padding:24px 16px;">

        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td>
        <![endif]-->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:600px;table-layout:fixed;background:${C.paper};">

          <!-- ══ Cabeçalho: collab dos dois logos ══ -->
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
                        <td valign="middle" style="line-height:0;">
                          <img class="logo-swr" src="${swrLogo}" alt="${escapeHtml(EVENTO.nome)}" width="99" height="44" style="display:block;width:99px;height:44px;border:0;outline:none;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle" style="font-family:${SANS};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${C.primary};white-space:nowrap;padding-left:10px;font-weight:bold;">
                    Até ${escapeHtml(prazoLabel())}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td height="3" bgcolor="${C.primary}" style="background:${C.primary};font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- ══ Hero ══ -->
          <tr>
            <td class="pad" style="padding:36px 28px 28px;">
              <h1 class="title" style="margin:0;font-family:${SANS};font-size:38px;line-height:1.05;letter-spacing:-0.02em;color:${C.ink};font-weight:bold;">
                Uma linha de chegada diferente.
              </h1>
              <p style="margin:10px 0 0;font-family:${SANS};font-size:20px;line-height:1.3;color:${C.primary};font-weight:bold;">
                Pôr do sol e vinho.
              </p>
              <p style="margin:18px 0 0;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.body};">
                ${saudacao} O SOMMA Club tem uma condição especial para quem quer viver a primeira edição da Sunset Wine Run, dia ${escapeHtml(EVENTO.dataExtenso)}, na ${escapeHtml(EVENTO.local)}.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;border-top:1px solid rgba(10,10,10,0.1);border-bottom:1px solid rgba(10,10,10,0.1);">
                <tr>
                  ${celulaDado("Distância", EVENTO.distancia)}
                  ${celulaDado("Recepção", EVENTO.recepcao)}
                  ${celulaDado("Largada", EVENTO.largada, true)}
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
                <tr><td>${botao(link, "Garanta sua experiência")}</td></tr>
              </table>
              <p style="margin:12px 0 0;font-family:${SANS};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${C.mute};">
                ${escapeHtml(EVENTO.dataCurta)}, ${escapeHtml(EVENTO.diaSemana)} &#183; Vagas limitadas
              </p>
            </td>
          </tr>

          <!-- ══ Bloco do cupom ══ -->
          <tr>
            <td class="pad" style="padding:24px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.primary};">
                <tr>
                  <td style="padding:22px;">
                    ${rotulo(`Use até ${escapeHtml(prazoLabel())}`, "rgba(255,255,255,0.8)")}
                    <p style="margin:9px 0 0;font-family:${BLACK};font-size:26px;line-height:1;text-transform:uppercase;color:#ffffff;font-weight:900;letter-spacing:-0.01em;">
                      CUPOM ${escapeHtml(EVENTO.cupom)}
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
                      ${listaVantagens}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══ O que está incluído ══ -->
          <tr>
            <td class="pad" style="padding:30px 28px 0;">
              ${rotulo("O que está incluído", C.mute, "0 0 12px")}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${listaInclusos}
              </table>
            </td>
          </tr>

          <!-- ══ Esquenta oficial ══ -->
          <tr>
            <td class="pad" style="padding:26px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-left:3px solid ${C.primary};">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.3;color:${C.ink};font-weight:bold;">
                      Esquenta oficial &#183; ${escapeHtml(EVENTO.esquenta.data)}
                    </p>
                    <p style="margin:7px 0 0;font-family:${SANS};font-size:14px;line-height:1.55;color:${C.body};">
                      Quem usar o cupom concorre a uma manhã especial na ${escapeHtml(EVENTO.esquenta.local)}: ${listaEsquenta}.
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
                10% off, sorteio de vinho e vaga no esquenta.
              </p>
              ${botao(link, "Garanta sua experiência")}
              <p style="margin:12px 0 0;font-family:${SANS};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${C.mute};">
                Cupom ${escapeHtml(EVENTO.cupom)} &#183; Até ${escapeHtml(prazoLabel())}
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
                ${escapeHtml(EVENTO.dataLabel)} &#183; ${escapeHtml(EVENTO.local)} &#183; Recepção ${escapeHtml(EVENTO.recepcao)} &#183; Largada ${escapeHtml(EVENTO.largada)}
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
