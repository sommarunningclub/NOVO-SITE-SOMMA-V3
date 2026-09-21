/**
 * Régua do Desafio das Esteiras (24/09/2026, Evolve Águas Claras 2).
 *
 * Gera os 9 e-mails da régua como HTML puro, no formato que o E-mail Marketing
 * do admin (template `html_custom`) espera:
 *   - sem preheader no corpo (o admin injeta o do campo `preheader`);
 *   - sem rodapé de descadastro (o admin injeta o dele, por LGPD);
 *   - sem comentário condicional de Outlook (o sanitizador do admin remove).
 *
 * Regra de copy do projeto: sem travessão em nada que a pessoa lê.
 *
 * Uso: node gerar.mjs <pasta-de-saida>
 *   <saida>/emails/NN-*.html      o HTML que vai para o admin, um por etapa
 *   <saida>/APROVAR-EMAILS.html   todos empilhados, com assunto, preheader,
 *                                 horário e público de cada etapa
 *   <saida>/regua.json            a régua em dados (é o que alimenta o admin)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://sommaclub.com.br";
const CHECKIN = `${SITE}/check-in`;
const IMG = `${SITE}/desafio-esteiras-evolve/email`;
const EVOLVE_LOGO = `${IMG}/evolve-logo.png`;
const SOMMA_LOGO = `${IMG}/somma-logo.png`;
const HERO = `${IMG}/hero-banner.jpg`;

const C = {
  ink: "#08080a",
  ink2: "#101014",
  ink3: "#17171c",
  paper: "#f2f0ec",
  evolve: "#e0261b",
  somma: "#ff2c04",
  mute: "#8a8884",
  soft: "rgba(242,240,236,0.78)",
  hair: "rgba(255,255,255,0.14)",
};

const MONO = "'Courier New',Courier,monospace";
const SANS = "Arial,Helvetica,sans-serif";
const BLACK = "'Arial Black',Arial,Helvetica,sans-serif";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Blocos do corpo. A copy aprovada é curta e ritmada, então o template trata
 * cada linha como peça tipográfica em vez de parágrafo corrido:
 *   h   manchete (Arial Black, caixa alta)
 *   p   texto
 *   b   linha de impacto (frase curta em destaque)
 *   ok  lista de fatos com marcador
 */
const ETAPAS = [
  {
    n: 1,
    quando: "2026-09-21T14:00:00-03:00",
    rotulo: "21/09 às 14h",
    selo: "FALTAM 3 DIAS",
    assunto: "Desafio das Esteiras: você encara 15 minutos?",
    assuntoAbriu: null,
    preheader: "Evolve + SOMMA Club. Dia 24/09, às 19h.",
    kicker: "Evolve + SOMMA Club",
    headline: ["QUANTO VOCÊ", "CONSEGUE CORRER", "EM 15 MINUTOS?"],
    corpo: [
      ["p", "No dia 24/09, a Evolve e o SOMMA Club se encontram para o <strong>Desafio das Esteiras</strong>."],
      ["p", "O objetivo é simples: percorrer a maior distância possível em 15 minutos."],
      ["p", "Teremos disputa feminina e masculina, com premiação para o primeiro lugar de cada categoria."],
      ["b", "Faça seu check in e participe."],
    ],
    cta: "QUERO PARTICIPAR",
  },
  {
    n: 2,
    quando: "2026-09-21T19:00:00-03:00",
    rotulo: "21/09 às 19h",
    selo: "FALTAM 3 DIAS",
    assunto: "15 minutos. Até onde você consegue chegar?",
    assuntoAbriu: "Você viu o desafio. Falta o seu check in",
    preheader: "O desafio está lançado.",
    kicker: "O desafio está lançado",
    headline: ["UMA ESTEIRA.", "15 MINUTOS."],
    corpo: [
      ["b", "E um objetivo: correr a maior distância possível."],
      ["p", "O Desafio das Esteiras Evolve + SOMMA Club acontece dia 24/09, às 19h."],
      ["p", "Primeiro lugar feminino e masculino levam a premiação."],
      ["b", "Você vem?"],
    ],
    cta: "FAZER CHECK IN",
  },
  {
    n: 3,
    quando: "2026-09-22T09:00:00-03:00",
    rotulo: "22/09 às 09h",
    selo: "FALTAM 2 DIAS",
    assunto: "Seu próximo desafio está marcado",
    assuntoAbriu: "Seu nome ainda não está na lista do desafio",
    preheader: "Quinta, às 19h, na Evolve Águas Claras 2.",
    kicker: "Quinta, às 19h",
    headline: ["NÃO É UMA", "CORRIDA LONGA."],
    corpo: [
      ["b", "São apenas 15 minutos."],
      ["p", "Mas a pergunta é: quanto você consegue entregar nesse tempo?"],
      ["p", "Dia 24/09 acontece o Desafio das Esteiras Evolve + SOMMA Club."],
      ["p", "Maior distância masculina e feminina vencem."],
    ],
    cta: "GARANTIR MEU CHECK IN",
  },
  {
    n: 4,
    quando: "2026-09-22T18:00:00-03:00",
    rotulo: "22/09 às 18h",
    selo: "FALTAM 2 DIAS",
    assunto: "Você vai ficar de fora desse desafio?",
    assuntoAbriu: "Faltam 2 dias e falta você",
    preheader: "Faltam 2 dias para o Desafio das Esteiras.",
    kicker: "Contagem regressiva",
    headline: ["FALTAM", "2 DIAS."],
    corpo: [
      ["p", "No Desafio das Esteiras, cada participante terá 15 minutos para buscar sua maior distância."],
      ["p", "Sem complicação."],
      ["b", "Subiu na esteira. Correu. Deu tudo."],
      ["p", "Dia 24/09, às 19h, na Evolve Águas Claras 2."],
    ],
    cta: "EU VOU",
  },
  {
    n: 5,
    quando: "2026-09-23T08:00:00-03:00",
    rotulo: "23/09 às 08h",
    selo: "É AMANHÃ",
    assunto: "É amanhã: Desafio das Esteiras",
    assuntoAbriu: "É amanhã. Falta só o seu check in",
    preheader: "Últimas horas para fazer seu check in.",
    kicker: "Evolve + SOMMA Club",
    headline: ["É AMANHÃ."],
    corpo: [
      ["b", "15 minutos para correr o máximo que conseguir."],
      ["p", "Premiação para o primeiro lugar feminino e masculino."],
      ["b", "Faça seu check in."],
    ],
    cta: "PARTICIPAR",
  },
  {
    n: 6,
    quando: "2026-09-23T14:00:00-03:00",
    rotulo: "23/09 às 14h",
    selo: "É AMANHÃ",
    assunto: "Amanhã você tem 15 minutos",
    assuntoAbriu: "Você já conhece o desafio. Só falta confirmar",
    preheader: "O relógio começa a contar às 19h.",
    kicker: "Contra o relógio",
    headline: ["AMANHÃ O DESAFIO", "É CONTRA", "O RELÓGIO."],
    corpo: [
      ["p", "Você terá 15 minutos para percorrer a maior distância possível na esteira."],
      ["b", "Simples assim."],
      ["p", "E o primeiro lugar masculino e feminino levam a premiação."],
      ["p", "Nos encontramos às 19h na Evolve Águas Claras 2."],
    ],
    cta: "FAZER CHECK IN",
  },
  {
    n: 7,
    quando: "2026-09-23T20:00:00-03:00",
    rotulo: "23/09 às 20h",
    selo: "É AMANHÃ",
    assunto: "Amanhã. 19h. Esteira ligada.",
    assuntoAbriu: "Última chamada de hoje: confirme sua presença",
    preheader: "Essa é sua última chamada antes do desafio.",
    kicker: "Última chamada",
    headline: ["15 MINUTOS.", "UMA ESTEIRA.", "SEU MÁXIMO."],
    corpo: [
      ["p", "Amanhã é dia de descobrir até onde você consegue chegar."],
      ["p", "Desafio das Esteiras Evolve + SOMMA Club."],
      ["b", "Amanhã, 24/09, às 19h."],
      ["p", "Ainda dá tempo."],
    ],
    cta: "QUERO PARTICIPAR",
  },
  {
    n: 8,
    quando: "2026-09-24T08:00:00-03:00",
    rotulo: "24/09 às 08h",
    selo: "É HOJE",
    assunto: "É hoje.",
    assuntoAbriu: "É hoje. Ainda falta o seu check in",
    preheader: "Desafio das Esteiras, hoje às 19h.",
    kicker: "Chegou o dia",
    headline: ["É HOJE."],
    corpo: [
      ["p", "Hoje, às 19h, acontece o Desafio das Esteiras Evolve + SOMMA Club."],
      ["p", "Você terá 15 minutos para buscar a maior distância possível."],
      ["p", "Primeiro lugar feminino e masculino levam a premiação."],
      ["b", "Nos vemos na Evolve Águas Claras 2."],
    ],
    cta: "FAZER CHECK IN AGORA",
  },
  {
    n: 9,
    quando: "2026-09-24T16:00:00-03:00",
    rotulo: "24/09 às 16h",
    selo: "É HOJE",
    assunto: "Daqui a pouco começa",
    assuntoAbriu: "Começa às 19h. Seu check in ainda não chegou",
    preheader: "Hoje, às 19h. Ainda dá tempo de participar.",
    kicker: "Hoje, às 19h",
    headline: ["FALTAM", "POUCAS HORAS."],
    corpo: [
      ["p", "Hoje, às 19h, começa o Desafio das Esteiras."],
      ["p", "Se você ainda não fez seu check in, essa é a hora."],
      ["ok", ["Evolve Águas Claras 2", "15 minutos de desafio", "Premiação feminino e masculino"]],
      ["b", "Até daqui a pouco."],
    ],
    cta: "FAZER CHECK IN",
  },
];

/* ── Peças ───────────────────────────────────────────────────────────────── */

/** Barra de energia: duas metades sólidas, porque e-mail não carrega gradient. */
const barra = (h = 4) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td width="50%" height="${h}" bgcolor="${C.evolve}" style="background:${C.evolve};height:${h}px;font-size:0;line-height:0;">&nbsp;</td>
    <td width="50%" height="${h}" bgcolor="${C.somma}" style="background:${C.somma};height:${h}px;font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`;

/** Botão à prova de cliente: célula com bgcolor e âncora ocupando o bloco. */
const botao = (href, texto) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" bgcolor="${C.somma}" style="background:${C.somma};">
      <a href="${href}" target="_blank" style="display:block;text-decoration:none;">
        <span class="btn-text" style="display:block;padding:20px 16px;font-family:${BLACK};font-size:16px;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;font-weight:900;">${esc(texto)} &#8594;</span>
      </a>
    </td>
  </tr>
</table>`;

const dado = (rot, valor, ultima = false) => `
  <td class="dado" width="33.33%" align="center" valign="top" style="padding:16px 6px;${ultima ? "" : `border-right:1px solid ${C.hair};`}">
    <p style="margin:0;font-family:${MONO};font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(242,240,236,0.45);">${esc(rot)}</p>
    <p class="dado-n" style="margin:7px 0 0;font-family:${BLACK};font-size:22px;line-height:1.05;color:${C.paper};font-weight:900;text-transform:uppercase;">${valor}</p>
  </td>`;

function bloco([tipo, conteudo]) {
  if (tipo === "p") {
    return `<p style="margin:0 0 16px;font-family:${SANS};font-size:17px;line-height:1.6;color:${C.soft};">${conteudo.replace(/<strong>/g, `<strong style="color:${C.paper};">`)}</p>`;
  }
  if (tipo === "b") {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 18px;">
      <tr>
        <td width="3" bgcolor="${C.somma}" style="background:${C.somma};width:3px;font-size:0;line-height:0;">&nbsp;</td>
        <td style="padding:4px 0 4px 16px;font-family:${BLACK};font-size:21px;line-height:1.2;letter-spacing:-0.01em;text-transform:uppercase;color:${C.paper};font-weight:900;">${esc(conteudo)}</td>
      </tr>
    </table>`;
  }
  if (tipo === "ok") {
    const linhas = conteudo
      .map(
        (t) => `<tr>
        <td width="22" valign="top" style="padding:9px 0;font-family:${SANS};font-size:12px;line-height:1.5;color:${C.somma};border-bottom:1px solid ${C.hair};">&#9670;</td>
        <td style="padding:9px 0;font-family:${BLACK};font-size:16px;line-height:1.3;text-transform:uppercase;color:${C.paper};font-weight:900;border-bottom:1px solid ${C.hair};">${esc(t)}</td>
      </tr>`
      )
      .join("");
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:2px 0 20px;border-top:1px solid ${C.hair};">${linhas}</table>`;
  }
  throw new Error(`bloco desconhecido: ${tipo}`);
}

function render(etapa, variante = "a") {
  const utm = `utm_source=email&utm_medium=campanha&utm_campaign=desafio-esteiras-2409&utm_content=etapa-${etapa.n}${variante}`;
  const link = `${CHECKIN}?${utm}`;
  // Manchete de uma linha só aguenta corpo maior; de três linhas, menor.
  const corpoTitulo = etapa.headline.length === 1 ? 62 : etapa.headline.length === 2 ? 50 : 42;
  const corpoTituloMobile = etapa.headline.length === 1 ? 50 : etapa.headline.length === 2 ? 38 : 31;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>Desafio das Esteiras · Evolve + SOMMA Club</title>
  <style>
    @media only screen and (max-width:620px) {
      .outer-pad { padding: 0 !important; }
      .pad { padding-left: 22px !important; padding-right: 22px !important; }
      .title { font-size: ${corpoTituloMobile}px !important; }
      .quinze { font-size: 120px !important; }
      .btn-text { padding: 18px 12px !important; font-size: 14px !important; }
      .dado-n { font-size: 16px !important; }
      .logo-ev { width: 92px !important; height: 24px !important; }
      .logo-so { width: 90px !important; height: 24px !important; }
      .selo { font-size: 9px !important; letter-spacing: 0.14em !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.ink};width:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.ink}" style="background:${C.ink};width:100%;">
    <tr>
      <td class="outer-pad" align="center" style="padding:24px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="${C.ink2}" style="width:100%;max-width:600px;table-layout:fixed;background:${C.ink2};">

          <tr>
            <td class="pad" bgcolor="${C.ink}" style="background:${C.ink};padding:22px 30px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="line-height:0;">
                          <img class="logo-ev" src="${EVOLVE_LOGO}" alt="Evolve" width="107" height="28" border="0" style="display:block;width:107px;height:28px;border:0;outline:none;" />
                        </td>
                        <td valign="middle" style="padding:0 12px;font-family:${SANS};font-size:14px;line-height:1;color:${C.somma};font-weight:bold;">+</td>
                        <td valign="middle" style="line-height:0;">
                          <img class="logo-so" src="${SOMMA_LOGO}" alt="SOMMA Club" width="104" height="28" border="0" style="display:block;width:104px;height:28px;border:0;outline:none;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="selo" align="right" valign="middle" style="font-family:${MONO};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${C.somma};white-space:nowrap;padding-left:10px;">
                    ${esc(etapa.selo)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="padding:0;font-size:0;line-height:0;">${barra()}</td></tr>

          <tr>
            <td bgcolor="${C.ink}" style="padding:0;font-size:0;line-height:0;background:${C.ink};">
              <a href="${link}" target="_blank" style="display:block;text-decoration:none;">
                <img src="${HERO}" alt="Desafio das Esteiras, Evolve + SOMMA Club" width="600" height="250" border="0" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;" />
              </a>
            </td>
          </tr>

          <tr>
            <td class="pad" bgcolor="${C.ink2}" style="background:${C.ink2};padding:34px 30px 8px;">
              <p style="margin:0;font-family:${MONO};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${C.somma};">${esc(etapa.kicker)}</p>
              <h1 class="title" style="margin:14px 0 0;font-family:${BLACK};font-size:${corpoTitulo}px;line-height:0.9;letter-spacing:-0.04em;text-transform:uppercase;color:${C.paper};font-weight:900;">
                ${etapa.headline.map(esc).join("<br />")}
              </h1>
            </td>
          </tr>

          <tr>
            <td class="pad" bgcolor="${C.ink2}" style="background:${C.ink2};padding:26px 30px 6px;">
              ${etapa.corpo.map(bloco).join("\n              ")}
            </td>
          </tr>

          <tr>
            <td class="pad" bgcolor="${C.ink2}" style="background:${C.ink2};padding:0 30px 30px;">
              ${botao(link, etapa.cta)}
            </td>
          </tr>

          <tr>
            <td bgcolor="${C.ink}" style="background:${C.ink};padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="pad" valign="middle" style="padding:26px 0 26px 30px;">
                    <p style="margin:0;font-family:${MONO};font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${C.mute};">O desafio</p>
                    <p style="margin:10px 0 0;font-family:${BLACK};font-size:20px;line-height:1.1;letter-spacing:-0.01em;text-transform:uppercase;color:${C.paper};font-weight:900;">Maior distância<br />em 15 minutos.</p>
                    <p style="margin:10px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${C.mute};">Feminino e masculino.<br />Premiação para o 1º lugar de cada categoria.</p>
                  </td>
                  <td align="right" valign="middle" style="padding:14px 30px 14px 10px;">
                    <p class="quinze" style="margin:0;font-family:${BLACK};font-size:150px;line-height:0.82;letter-spacing:-0.07em;color:${C.somma};font-weight:900;">15</p>
                    <p style="margin:6px 0 0;font-family:${MONO};font-size:11px;letter-spacing:0.34em;text-transform:uppercase;color:${C.paper};">minutos</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td bgcolor="${C.ink}" style="background:${C.ink};padding:0 0 4px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.hair};border-bottom:1px solid ${C.hair};">
                <tr>
                  ${dado("Data", "24/09<br />quinta")}
                  ${dado("Horário", "19h")}
                  ${dado("Local", "Evolve<br />Águas Claras 2", true)}
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="pad" bgcolor="${C.ink}" style="background:${C.ink};padding:26px 30px 30px;">
              ${botao(link, etapa.cta)}
              <p style="margin:16px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.mute};">
                Se o botão não abrir, use este endereço:<br />
                <a href="${link}" target="_blank" style="color:${C.somma};text-decoration:underline;">sommaclub.com.br/check-in</a>
              </p>
            </td>
          </tr>

          <tr><td style="padding:0;font-size:0;line-height:0;">${barra(3)}</td></tr>

          <tr>
            <td class="pad" align="center" bgcolor="${C.ink}" style="background:${C.ink};padding:22px 30px 26px;">
              <p style="margin:0;font-family:${MONO};font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${C.mute};">Desafio das Esteiras &#183; Evolve + SOMMA Club</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ── Saída ───────────────────────────────────────────────────────────────── */

const saida = process.argv[2];
if (!saida) throw new Error("uso: node gerar.mjs <pasta-de-saida>");
const pastaEmails = join(saida, "emails");
mkdirSync(pastaEmails, { recursive: true });

const slug = (e) =>
  `${String(e.n).padStart(2, "0")}-${e.rotulo.replace("/", "-").replace(" às ", "-")}`;

const regua = ETAPAS.map((e) => {
  const arquivo = `${slug(e)}.html`;
  writeFileSync(join(pastaEmails, arquivo), render(e, "a"));
  return {
    n: e.n,
    quando: e.quando,
    rotulo: e.rotulo,
    assunto: e.assunto,
    assuntoAbriu: e.assuntoAbriu,
    preheader: e.preheader,
    cta: e.cta,
    arquivo,
    html: { a: render(e, "a"), b: e.assuntoAbriu ? render(e, "b") : null },
  };
});

writeFileSync(join(saida, "regua.json"), JSON.stringify(regua, null, 2));

const travessao = regua.filter((r) => /[—–]/.test(r.html.a + r.assunto + (r.assuntoAbriu ?? "") + r.preheader));
if (travessao.length) throw new Error(`travessão na copy das etapas: ${travessao.map((r) => r.n).join(", ")}`);

const cartao = (r) => `
<section>
  <div class="meta">
    <div class="n">${String(r.n).padStart(2, "0")}</div>
    <div class="info">
      <p class="quando">${esc(r.rotulo)}</p>
      <dl>
        <dt>Assunto${r.assuntoAbriu ? " · quem ainda não abriu nenhum" : " · base inteira"}</dt><dd>${esc(r.assunto)}</dd>
        ${r.assuntoAbriu ? `<dt>Assunto · quem já abriu algum e não fez check in</dt><dd>${esc(r.assuntoAbriu)}</dd>` : ""}
        <dt>Preheader</dt><dd>${esc(r.preheader)}</dd>
        <dt>Botão</dt><dd>${esc(r.cta)} &#8594; sommaclub.com.br/check-in</dd>
        <dt>Arquivo</dt><dd><a href="emails/${r.arquivo}" target="_blank">emails/${esc(r.arquivo)}</a></dd>
      </dl>
    </div>
  </div>
  <div class="frames">
    <figure><figcaption>Computador · 600px</figcaption><iframe loading="lazy" src="emails/${r.arquivo}" width="640" height="1180"></iframe></figure>
    <figure><figcaption>Celular · 390px</figcaption><iframe loading="lazy" src="emails/${r.arquivo}" width="390" height="1180"></iframe></figure>
  </div>
</section>`;

writeFileSync(
  join(saida, "APROVAR-EMAILS.html"),
  `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Aprovação · Régua Desafio das Esteiras 24/09</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; background:#0d0d10; color:#f2f0ec; font:15px/1.5 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif; }
  header { padding:40px 32px 28px; border-bottom:1px solid #26262c; max-width:1120px; margin:0 auto; }
  header h1 { margin:0 0 6px; font-size:28px; letter-spacing:-0.02em; }
  header p { margin:6px 0 0; color:#a3a09b; max-width:78ch; }
  header strong { color:#f2f0ec; }
  section { max-width:1120px; margin:0 auto; padding:36px 32px 44px; border-bottom:1px solid #26262c; }
  .meta { display:flex; gap:22px; align-items:flex-start; margin-bottom:22px; }
  .n { font:900 54px/0.9 "Arial Black",Arial,sans-serif; color:#ff2c04; letter-spacing:-0.05em; min-width:74px; }
  .quando { margin:0 0 10px; font:700 20px/1.2 -apple-system,Arial,sans-serif; }
  dl { margin:0; display:grid; grid-template-columns:max-content 1fr; gap:6px 18px; }
  dt { color:#8a8884; font:11px/1.9 "SF Mono",Menlo,monospace; text-transform:uppercase; letter-spacing:0.08em; }
  dd { margin:0; }
  a { color:#ff2c04; }
  .frames { display:flex; gap:24px; flex-wrap:wrap; align-items:flex-start; }
  figure { margin:0; }
  figcaption { color:#8a8884; font:11px/2.2 "SF Mono",Menlo,monospace; text-transform:uppercase; letter-spacing:0.1em; }
  iframe { border:1px solid #26262c; background:#08080a; display:block; max-width:100%; }
</style></head>
<body>
<header>
  <h1>Régua · Desafio das Esteiras 24/09</h1>
  <p><strong>9 e-mails, de 21/09 a 24/09.</strong> Todos saem para a base geral (cadastro do site + check ins, sem descadastrados), e <strong>quem já fez check in no evento sai sozinho</strong> de todos os envios seguintes.</p>
  <p>Da etapa 2 em diante cada envio se divide em dois, com o mesmo corpo e assuntos diferentes: um para <strong>quem ainda não abriu nenhum e-mail da régua</strong> e outro para <strong>quem já abriu algum e ainda não fez check in</strong>.</p>
  <p>O admin acrescenta sozinho o preheader invisível e o rodapé de descadastro, por isso eles não aparecem nestas prévias.</p>
</header>
${regua.map(cartao).join("\n")}
</body></html>`
);

console.log(`ok: ${regua.length} etapas em ${saida}`);
