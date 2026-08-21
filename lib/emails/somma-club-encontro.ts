/**
 * Encontro do SOMMA Club no Eixão, com check-in obrigatório para concorrer.
 *
 * A mecânica é essa e só essa: a pessoa aparece, faz o check-in em
 * sommaclub.com.br/check-in e, com isso, entra no sorteio. O prêmio é
 * inscrição paga (com tudo incluso) numa corrida que só será anunciada em
 * setembro, e o briefing pede SPOILER: dá para dizer que é uma corrida grande
 * em Brasília, com estrutura de festa e brindes, sem nomear o evento nem citar
 * marca, cupom ou parceiro. Por isso nenhuma constante aqui carrega o nome da
 * corrida: se o texto não sabe, ninguém vaza por engano.
 *
 * Identidade visual da HOME do sommaclub.com.br (ink/primary/light), a mesma
 * família do e-mail do Sunset Wine Run, não a dos e-mails do Evolve.
 *
 * Sem travessão na copy, por pedido de quem assina as campanhas.
 */

const C = {
  ink: "#0a0a0a",
  paper: "#f5f5f5",
  primary: "#ff2c03",
  line: "#e5e5e5",
  mute: "#737373",
  body: "#18181b",
} as const;

const SANS = "Arial,Helvetica,sans-serif";
const BLACK = "'Arial Black',Arial,Helvetica,sans-serif";

export const EMAIL_SOMMA_LOGO_URL =
  "https://sommaclub.com.br/sunset-wine-run/email/somma-logo-dark.png";

export const ENCONTRO = {
  /** Ajustar antes do disparo: data e horário reais do encontro. */
  dataLabel: "DOMINGO, 23.08",
  dataExtenso: "domingo, 23 de agosto",
  /** Os três disparos saem na sexta e o encontro é no DOMINGO, então o dia é
   *  dito pelo nome em todo lugar: "amanhã" seria errado e "neste fim de
   *  semana" deixaria dúvida entre sábado e domingo. */
  quandoRelativo: "domingo",
  horario: "06h30",
  local: "Eixão",
  localDetalhe: "na altura da 110",
  localMapsUrl: "https://maps.google.com/?q=Eix%C3%A3o+Sul+quadra+110+Bras%C3%ADlia",
  linkCheckin: "https://sommaclub.com.br/check-in",
  instagram: "@sommaclub",
  instagramUrl: "https://www.instagram.com/sommaclub/",
} as const;

/** O spoiler. Nada aqui identifica a corrida, de propósito. */
const SPOILER = [
  "Uma corrida em Brasília que a gente anuncia em setembro",
  "Inscrição 100% paga pelo SOMMA para quem for sorteado",
  "Estrutura de festa na chegada, brindes e experiência completa",
] as const;

/**
 * As três versões do mesmo e-mail, todas disparadas na véspera (sexta):
 *
 * - `convite`   09h30, base inteira. Apresenta o encontro e a mecânica.
 * - `reforco`   16h00, só quem recebeu a 1 e não abriu. Mesma oferta, gancho
 *               no que a pessoa perde se não aparecer.
 * - `vespera`   19h30, base inteira de novo. Fecha o dia lembrando que é de
 *               manhã cedo, com foco em despertador e ponto de encontro.
 *
 * Variantes do mesmo template, não três arquivos: link, horário e local mudam
 * num lugar só. O corpo é reconhecível como o mesmo e-mail de propósito, já
 * que a mesma pessoa pode receber os três no mesmo dia.
 */
export type VarianteEncontro = "convite" | "reforco" | "vespera";

const PASSOS = [
  { n: "1", texto: `Apareça ${ENCONTRO.dataExtenso}, às ${ENCONTRO.horario}, no ${ENCONTRO.local} ${ENCONTRO.localDetalhe}.` },
  { n: "2", texto: "Faça o check-in pelo celular, leva menos de um minuto." },
  { n: "3", texto: "Pronto, você já está concorrendo aos ingressos." },
] as const;

export interface SommaClubEncontroData {
  nome?: string | null;
  variante?: VarianteEncontro;
  sommaLogoSrc?: string;
  utm?: string;
  linkCheckin?: string;
  descadastroUrl?: string | null;
}

function escapeHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function firstName(nome: string): string {
  return nome.trim().split(/\s+/)[0] || nome;
}

export function sommaClubEncontroSubject(variante: VarianteEncontro = "convite"): string {
  if (variante === "reforco") return "Você viu? Domingo tem sorteio de inscrição no Eixão";
  if (variante === "vespera") return `Domingo no Eixão, ${ENCONTRO.horario}, na altura da 110. Bora?`;
  return "Domingo no Eixão: faça o check-in e concorra a uma inscrição paga";
}

export function sommaClubEncontroPreheader(variante: VarianteEncontro = "convite"): string {
  if (variante === "reforco")
    return "Domingo, no Eixão. Quem faz check-in concorre a uma inscrição paga numa corrida que anunciamos em setembro.";
  if (variante === "vespera")
    return `Domingo, ${ENCONTRO.horario}, no ${ENCONTRO.local} ${ENCONTRO.localDetalhe}. O check-in é o que vale sorteio.`;
  return "Domingo, no Eixão. Tem sorteio e uma surpresa para quem quer correr de graça em setembro. Só vale com check-in.";
}

function rotulo(texto: string, cor: string = C.mute, margem = "0"): string {
  return `<p style="margin:${margem};font-family:${SANS};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${cor};font-weight:bold;">${escapeHtml(texto)}</p>`;
}

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

export function renderSommaClubEncontroEmail(data: SommaClubEncontroData = {}): string {
  const sommaLogo = data.sommaLogoSrc ?? EMAIL_SOMMA_LOGO_URL;
  const utm = data.utm ?? "utm_source=email&utm_medium=campanha&utm_campaign=encontro-eixao-sorteio";
  const base = data.linkCheckin ?? ENCONTRO.linkCheckin;
  const link = `${base}${base.includes("?") ? "&" : "?"}${utm}`;

  const saudacao = data.nome
    ? `Oi, <strong style="color:${C.ink};">${escapeHtml(firstName(data.nome))}</strong>.`
    : "Oi!";

  const variante = data.variante ?? "convite";
  const copy =
    variante === "reforco"
      ? {
          chip: `${ENCONTRO.dataLabel} · ${ENCONTRO.horario}`,
          titulo: "Domingo no Eixão.",
          subtitulo: "Na altura da 110, e tem sorteio.",
          abertura:
            `${saudacao} Mandamos isso mais cedo e talvez tenha passado batido, então vai o resumo: ` +
            `${escapeHtml(ENCONTRO.quandoRelativo)} a tropa corre no ${escapeHtml(ENCONTRO.local)}, ${escapeHtml(ENCONTRO.localDetalhe)}, às ${escapeHtml(ENCONTRO.horario)}. ` +
            `Quem aparecer e fizer o check-in concorre a uma inscrição paga pelo SOMMA.`,
          botao: "Quero concorrer",
          legendaBotao: "O check-in é o que vale sorteio",
          rotuloBloco: "Você não vai querer ficar de fora",
          fechamento: "Dá para acordar cedo por isso.",
        }
      : variante === "vespera"
        ? {
            chip: `${ENCONTRO.dataLabel} · ${ENCONTRO.horario}`,
            titulo: "Domingo no Eixão.",
            subtitulo: `Despertador para as ${ENCONTRO.horario}, na 110.`,
            abertura:
              `${saudacao} Fechando o dia com o lembrete que importa: ` +
              `<strong style="color:${C.ink};">${escapeHtml(ENCONTRO.dataExtenso)}</strong>, às ${escapeHtml(ENCONTRO.horario)}, ` +
              `tem encontro no ${escapeHtml(ENCONTRO.local)}, ${escapeHtml(ENCONTRO.localDetalhe)}. ` +
              `Leva o celular carregado: o check-in no local é o que coloca você no sorteio.`,
            botao: "Fazer meu check-in",
            legendaBotao: "Sem check-in, sem sorteio",
            rotuloBloco: "Lembrando o que está em jogo",
            fechamento: "Domingo, cedo, no Eixão. Te espero.",
          }
        : {
            chip: ENCONTRO.dataLabel,
            titulo: "Domingo no Eixão.",
            subtitulo: "Na altura da 110.",
            abertura:
              `${saudacao} <strong style="color:${C.ink};">${escapeHtml(ENCONTRO.dataExtenso)}</strong>, às ${escapeHtml(ENCONTRO.horario)}, ` +
              `a tropa se encontra no ${escapeHtml(ENCONTRO.local)}, ${escapeHtml(ENCONTRO.localDetalhe)}. ` +
              `E dessa vez tem um motivo a mais para você aparecer: quem fizer o check-in entra no sorteio.`,
            botao: "Fazer meu check-in",
            legendaBotao: "Sem check-in, sem sorteio",
            rotuloBloco: "Surpresa para quem quer correr de graça",
            fechamento: "Aparece, corre com a gente e faz o check-in.",
          };

  const celulaDado = (rot: string, valor: string, ultima = false) => `
    <td width="33.33%" align="center" style="padding:15px 6px;${ultima ? "" : "border-right:1px solid rgba(10,10,10,0.1);"}">
      <p style="margin:0;font-family:${SANS};font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${C.mute};font-weight:bold;">${escapeHtml(rot)}</p>
      <p class="dado-n" style="margin:7px 0 0;font-family:${BLACK};font-size:22px;line-height:1;color:${C.ink};font-weight:900;">${escapeHtml(valor)}</p>
    </td>`;

  const listaSpoiler = SPOILER.map(
    (s, i) => `<tr>
      <td style="padding:${i === 0 ? "0" : "9px"} 0 0;font-family:${SANS};font-size:15px;line-height:1.5;color:rgba(255,255,255,0.92);">
        <span style="color:#ffffff;font-weight:bold;">&#183;</span> ${escapeHtml(s)}
      </td>
    </tr>`
  ).join("");

  const listaPassos = PASSOS.map(
    (p) => `<tr>
      <td width="34" valign="top" style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:${BLACK};font-size:18px;line-height:1.2;color:${C.primary};font-weight:900;">${p.n}</td>
      <td valign="top" style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:15px;line-height:1.5;color:${C.body};">${escapeHtml(p.texto)}</td>
    </tr>`
  ).join("");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>Encontro SOMMA Club no Eix&#227;o</title>
  <style>
    @media only screen and (max-width:620px) {
      .outer-pad { padding: 14px 8px !important; }
      .pad { padding-left: 20px !important; padding-right: 20px !important; }
      .title { font-size: 32px !important; }
      .btn-text { padding: 16px 20px !important; font-size: 14px !important; }
      .dado-n { font-size: 18px !important; }
      .logo-somma { width: 116px !important; height: 31px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.paper};width:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.paper};opacity:0;">
    ${escapeHtml(sommaClubEncontroPreheader(variante))}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};width:100%;">
    <tr>
      <td class="outer-pad" align="center" style="padding:24px 16px;">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td>
        <![endif]-->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:600px;table-layout:fixed;background:${C.paper};">

          <tr>
            <td class="pad" bgcolor="${C.paper}" style="background:${C.paper};padding:22px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle" style="line-height:0;">
                    <img class="logo-somma" src="${sommaLogo}" alt="SOMMA Club" width="140" height="38" style="display:block;width:140px;height:38px;border:0;outline:none;" />
                  </td>
                  <td align="right" valign="middle" style="font-family:${SANS};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${C.primary};white-space:nowrap;padding-left:10px;font-weight:bold;">
                    ${escapeHtml(copy.chip)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td height="3" bgcolor="${C.primary}" style="background:${C.primary};font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr>
            <td class="pad" style="padding:36px 28px 28px;">
              <h1 class="title" style="margin:0;font-family:${SANS};font-size:38px;line-height:1.05;letter-spacing:-0.02em;color:${C.ink};font-weight:bold;">
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
                  ${celulaDado("Quando", ENCONTRO.dataLabel.split(",")[1]?.trim() || ENCONTRO.dataLabel)}
                  ${celulaDado("Horário", ENCONTRO.horario)}
                  ${celulaDado("Onde", "110", true)}
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
                <tr><td>${botao(link, copy.botao)}</td></tr>
              </table>
              <p style="margin:12px 0 0;font-family:${SANS};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${C.mute};">
                ${escapeHtml(copy.legendaBotao)}
              </p>
            </td>
          </tr>

          <tr>
            <td class="pad" style="padding:24px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.primary};">
                <tr>
                  <td style="padding:22px;">
                    ${rotulo(copy.rotuloBloco, "rgba(255,255,255,0.8)")}
                    <p style="margin:9px 0 0;font-family:${BLACK};font-size:26px;line-height:1.1;text-transform:uppercase;color:#ffffff;font-weight:900;letter-spacing:-0.01em;">
                      VAMOS SORTEAR INGRESSOS
                    </p>
                    <p style="margin:10px 0 0;font-family:${SANS};font-size:15px;line-height:1.55;color:rgba(255,255,255,0.92);">
                      Ainda n&#227;o podemos contar qual &#233;. S&#243; que vale muito a pena estar no sorteio:
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
                      ${listaSpoiler}
                    </table>
                    <p style="margin:14px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:rgba(255,255,255,0.8);">
                      O nome da corrida a gente revela em setembro. Quem estiver no encontro descobre antes.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="pad" style="padding:30px 28px 0;">
              ${rotulo("Como participar", C.mute, "0 0 4px")}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${listaPassos}
              </table>
            </td>
          </tr>

          <tr>
            <td class="pad" style="padding:26px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-left:3px solid ${C.primary};">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.3;color:${C.ink};font-weight:bold;">
                      Ponto de encontro
                    </p>
                    <p style="margin:7px 0 0;font-family:${SANS};font-size:14px;line-height:1.55;color:${C.body};">
                      ${escapeHtml(ENCONTRO.local)} ${escapeHtml(ENCONTRO.localDetalhe)}.
                      <a href="${escapeHtml(ENCONTRO.localMapsUrl)}" target="_blank" style="color:${C.primary};text-decoration:underline;">Ver no mapa</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="pad" style="padding:32px 28px 0;">
              <p style="margin:0 0 18px;font-family:${SANS};font-size:24px;line-height:1.2;letter-spacing:-0.01em;color:${C.ink};font-weight:bold;">
                ${escapeHtml(copy.fechamento)}
              </p>
              ${botao(link, copy.botao)}
              <p style="margin:12px 0 0;font-family:${SANS};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${C.mute};">
                ${escapeHtml(ENCONTRO.dataLabel)} &#183; ${escapeHtml(ENCONTRO.horario)} &#183; Eix&#227;o, altura da 110
              </p>
            </td>
          </tr>

          <tr><td height="32" style="height:32px;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td height="3" bgcolor="${C.primary}" style="background:${C.primary};font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr>
            <td class="pad" style="padding:26px 28px;">
              <p style="margin:0;font-family:${SANS};font-size:20px;line-height:1;color:${C.ink};font-weight:bold;">
                somma<span style="color:${C.primary};">.</span>
              </p>
              <p style="margin:12px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.mute};">
                Acompanhe tudo no Instagram:
                <a href="${escapeHtml(ENCONTRO.instagramUrl)}" target="_blank" style="color:${C.primary};text-decoration:underline;">${escapeHtml(ENCONTRO.instagram)}</a>
              </p>
              <p style="margin:12px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.mute};">
                Se o bot&#227;o n&#227;o abrir, use este endere&#231;o:<br />
                <a href="${link}" target="_blank" style="color:${C.primary};text-decoration:underline;word-break:break-all;">${escapeHtml(base)}</a>
              </p>
              ${
                data.descadastroUrl
                  ? `<p style="margin:16px 0 0;font-family:${SANS};font-size:12px;line-height:1.5;color:rgba(10,10,10,0.45);">
                Voc&#234; recebe este e-mail porque j&#225; fez check-in em um evento do SOMMA Club.
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
