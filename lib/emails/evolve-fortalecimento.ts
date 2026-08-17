import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import { SITE_URL } from "@/lib/desafio-esteiras/event.config";
import { EMAIL_EVOLVE_LOGO_URL, EMAIL_SOMMA_LOGO_URL } from "./desafio-esteiras-ticket";

/**
 * Campanha "E o fortalecimento durante a semana?" para a base do SOMMA Club.
 *
 * A peça é da Evolve e o disparo é do SOMMA: quem abre a caixa de entrada se
 * cadastrou no SOMMA, não na academia. Por isso o cabeçalho traz as duas marcas
 * e o rodapé explica de onde veio o e-mail. Sem isso o disparo lê como lista
 * vendida.
 *
 * A oferta não foi reconstruída como imagem única. O criativo chegou como um JPG
 * do e-mail inteiro, mas mandar isso como um `<img>` só custaria: caixa de
 * entrada que bloqueia imagem por padrão (Outlook, Gmail com remetente novo)
 * mostraria um retângulo vazio, o filtro de spam pontua mal proporção de imagem
 * sobre texto, e não sobraria texto para leitor de tela nem para o preheader.
 * Aqui a foto do topo entra como imagem e o resto, incluindo o preço, é texto.
 *
 * Regra de copy do projeto: sem travessão. Vale para tudo que a pessoa lê.
 *
 * Regra de honestidade: as condições do plano são da Evolve, não nossas. O
 * e-mail diz o que o criativo aprovou (primeira mensalidade a R$ 9,90 no Plano
 * Fit, em agosto) e manda para a página da Evolve para o resto. Nada de inventar
 * fidelidade, unidade participante ou prazo que a academia não confirmou.
 *
 * As restrições de caixa de entrada mandam no layout: tabela em vez de flex, CSS
 * inline, gradient feito de duas metades sólidas, largura travada em 600px e
 * `light only` (o dark mode do Gmail inverteria o preto do cabeçalho).
 */

/** Vermelho e branco amostrados do criativo, não escolhidos de novo. */
const C = {
  ink: "#08080a",
  paper: "#ffffff",
  evolve: "#e2211c",
  somma: "#ff2c04",
  line: "#e4e1dc",
  mute: "#8a8884",
  body: "#3a3a3e",
} as const;

const MONO = "'Courier New',Courier,monospace";
const SANS = "Arial,Helvetica,sans-serif";
const BLACK = "'Arial Black',Arial,Helvetica,sans-serif";

/**
 * Banner recortado do criativo em 1200x606 (exibido em 600x303).
 *
 * O arquivo já vem na proporção final porque `object-fit` não existe em caixa de
 * entrada: cortar por CSS chegaria esmagado. O recorte entra por dentro do raio
 * dos cantos arredondados da peça, senão sobram lascas brancas nos vértices.
 */
export const EMAIL_HERO_URL = `${SITE_URL}/evolve-fortalecimento/email/hero-banner.jpg`;

/** A chamada está gravada na foto, então ela é o alt. Imagem bloqueada, gancho preservado. */
const HERO_ALT = "Você já corre todo sábado. E o fortalecimento durante a semana?";

/**
 * Data URI do banner, para o preview local não depender do deploy.
 *
 * O `iframe` do preview roda com `sandbox=""`, o que bloqueia requisição a
 * origem externa: com a URL de produção o banner apareceria quebrado ali mesmo
 * depois de publicado. Embutido, o preview mostra o que a pessoa vai ver.
 */
export function emailHeroDataUri(): string {
  const bytes = readFileSync(
    join(process.cwd(), "public/evolve-fortalecimento/email/hero-banner.jpg")
  );
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}

/* ── Oferta e destino ────────────────────────────────────────────────────── */

export const OFERTA = {
  /** Página de venda da Evolve. Todo link do e-mail sai daqui. */
  destino: "https://venda.academiaevolve.com.br/",
  plano: "Plano Fit",
  precoLabel: "R$ 9,90",
  chamadaPreco: "1ª mensalidade por apenas",
  complemento: "no Plano Fit",
  /** Janela declarada no criativo. Não inventar prazo além disto. */
  janela: "agosto",
  instagram: "@academiaevolve",
  site: "academiaevolve.com.br",
} as const;

/**
 * De onde veio o contato. Vira `utm_content`, e é como a Evolve separa quem
 * chegou da base de cadastro do site e quem chegou da base de check-in.
 */
export type SegmentoBase = "cadastro-site" | "checkins" | "teste";

export const SEGMENTOS: readonly SegmentoBase[] = ["cadastro-site", "checkins"] as const;

export const UTM_CAMPAIGN = "somma-evolve-fortalecimento-ago2026";

/**
 * Link rastreável para a Evolve.
 *
 * Dois carimbos, porque servem a públicos diferentes: os `utm_*` para o
 * analytics da Evolve separar a origem SOMMA das outras mídias, e `origem` como
 * parâmetro legível, que aparece na URL e sobrevive a quem só olha o endereço ou
 * usa formulário com campo oculto. O SOMMA conta o clique pelo próprio painel do
 * Resend, então nenhuma das duas pontas depende da outra.
 */
export function linkOferta(
  segmento: SegmentoBase = "cadastro-site",
  overrides: { medium?: string; campaign?: string; etapa?: number } = {}
): string {
  const url = new URL(OFERTA.destino);
  url.searchParams.set("utm_source", "sommaclub");
  url.searchParams.set("utm_medium", overrides.medium ?? "email");
  url.searchParams.set("utm_campaign", overrides.campaign ?? UTM_CAMPAIGN);
  /* Um campo só carrega as duas perguntas que a Evolve vai fazer: qual e-mail da
     régua converteu, e de qual base a pessoa veio. Separar em `utm_content` e
     `utm_term` espalharia isso em duas colunas do relatório sem ganho nenhum. */
  url.searchParams.set(
    "utm_content",
    overrides.etapa ? `etapa-${overrides.etapa}-${segmento}` : segmento
  );
  url.searchParams.set("origem", "somma-club");
  return url.toString();
}

export interface EvolveFortalecimentoData {
  /** Primeiro nome de quem recebe. Sem ele o e-mail abre com um "Oi!". */
  nome?: string | null;
  segmento?: SegmentoBase;
  /** Qual e-mail da régua. Muda assunto, preheader, kicker e abertura. */
  etapa?: EtapaRegua;
  /** Data URI das imagens no preview; em produção entram as URLs públicas. */
  evolveLogoSrc?: string;
  sommaLogoSrc?: string;
  heroSrc?: string;
  /** Link já montado. Sem ele, {@link linkOferta} monta a partir do segmento. */
  href?: string;
  /** Link de descadastro. Sem ele o rodapé não promete o que não existe. */
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

/* ── Copy por etapa da régua ─────────────────────────────────────────────── */

/**
 * A régua tem três etapas, e as etapas 2 e 3 só vão para quem NÃO abriu a
 * anterior. Isso decide a copy: se a pessoa não abriu, o que falhou com ela foi
 * o assunto, não o corpo. Então o que muda de verdade entre as etapas é o
 * assunto, o preheader e a linha de abertura; a oferta, o card e o CTA são os
 * mesmos, porque a proposta não mudou.
 *
 * Reenviar o assunto idêntico três vezes para quem já ignorou duas é o caminho
 * mais curto para a aba de promoções e para o botão de spam.
 */
export type EtapaRegua = 1 | 2 | 3;

export const ETAPAS: readonly EtapaRegua[] = [1, 2, 3] as const;

interface CopyEtapa {
  rotulo: string;
  assunto: string;
  preheader: string;
  /** Etiqueta em mono acima do título. */
  kicker: string;
  /** Etiqueta em mono no topo, à direita das logos. */
  selo: string;
  /** Primeira frase depois da saudação. */
  abertura: string;
}

const COPY_ETAPAS: Record<EtapaRegua, CopyEtapa> = {
  1: {
    rotulo: "Convite",
    assunto: "Sua 1ª mensalidade na Evolve por R$ 9,90",
    preheader:
      "Você já corre todo sábado com o SOMMA. Em agosto, a Evolve cuida do seu preparo durante a semana.",
    kicker: `Condição especial de ${OFERTA.janela}`,
    selo: `Só em ${OFERTA.janela}`,
    abertura: "Todo sábado você já tem compromisso marcado: correr com o SOMMA. 🏃",
  },

  2: {
    rotulo: "Reforço",
    // Outro ângulo, não o mesmo assunto de novo: aqui o gancho é o treino da
    // semana, e o preço fica para o preheader.
    assunto: "O que você faz de segunda a sexta?",
    preheader:
      "A corrida do sábado é só metade. Em agosto a Evolve abre a 1ª mensalidade do Plano Fit por R$ 9,90.",
    kicker: "Ainda dá tempo",
    selo: `Só em ${OFERTA.janela}`,
    abertura:
      "A corrida do sábado é a parte fácil: você já aparece. O que decide o seu ritmo é o que acontece de segunda a sexta.",
  },

  3: {
    rotulo: "Última chamada",
    assunto: "Último aviso: R$ 9,90 acaba com agosto",
    preheader:
      "A condição da Evolve vale até o fim de agosto. Depois disso, a 1ª mensalidade volta ao valor cheio.",
    kicker: "Último aviso",
    selo: "Acaba em agosto",
    abertura:
      "Este é o último e-mail sobre isso. A condição de agosto fecha com o mês, e a 1ª mensalidade volta ao valor cheio.",
  },
};

export function etapaRotulo(etapa: EtapaRegua): string {
  return COPY_ETAPAS[etapa].rotulo;
}

export function evolveFortalecimentoSubject(etapa: EtapaRegua = 1): string {
  return COPY_ETAPAS[etapa].assunto;
}

/** Aparece na lista da caixa de entrada, ao lado do assunto. */
export function evolveFortalecimentoPreheader(etapa: EtapaRegua = 1): string {
  return COPY_ETAPAS[etapa].preheader;
}

/* ── Peças ───────────────────────────────────────────────────────────────── */

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

export function renderEvolveFortalecimentoEmail(data: EvolveFortalecimentoData = {}): string {
  const segmento = data.segmento ?? "cadastro-site";
  const etapa = data.etapa ?? 1;
  const copy = COPY_ETAPAS[etapa];
  const evolveLogo = data.evolveLogoSrc ?? EMAIL_EVOLVE_LOGO_URL;
  const sommaLogo = data.sommaLogoSrc ?? EMAIL_SOMMA_LOGO_URL;
  const hero = data.heroSrc ?? EMAIL_HERO_URL;
  const href = data.href ?? linkOferta(segmento, { etapa });

  /**
   * A saudação é o título, como no criativo, e não uma linha perdida no meio do
   * texto. Com o nome da base ela vira "OI, MARINA!"; sem nome, o "OLÁ!" da peça.
   *
   * O gancho ("e o fortalecimento durante a semana?") NÃO se repete aqui: ele já
   * está gravado na foto e no `alt` dela, então repetir em HTML só rende um
   * título duplicado para quem carrega imagem, que é a maioria.
   *
   * Quem faz o caixa-alta é o CSS do `<h1>`, não `toUpperCase()` aqui. No
   * broadcast este campo chega como a variável do Resend, e mexer na string
   * mexeria no placeholder junto.
   */
  const saudacao = data.nome ? `OI, ${escapeHtml(firstName(data.nome))}!` : "OLÁ!";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(`${OFERTA.chamadaPreco} ${OFERTA.precoLabel}`)}</title>
  <style>
    @media only screen and (max-width:620px) {
      .outer-pad { padding: 14px 8px !important; }
      .pad { padding-left: 20px !important; padding-right: 20px !important; }
      .title { font-size: 34px !important; }
      .preco { font-size: 58px !important; }
      .btn-text { padding: 17px 12px !important; font-size: 13px !important; }
      .fecho { font-size: 24px !important; }
      .logo-ev { width: 68px !important; height: 18px !important; }
      .logo-so { width: 67px !important; height: 18px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.ink};width:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.ink};opacity:0;">
    ${escapeHtml(copy.preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ink};width:100%;">
    <tr>
      <td class="outer-pad" align="center" style="padding:24px 16px;">

        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td>
        <![endif]-->
        <!--
          table-layout:fixed não é enfeite. Em layout automático a largura mínima
          da tabela é a do conteúdo mais largo, e o banner de 600px é exatamente
          isso: num celular de 390px a tabela inteira ficava travada em 600 e o
          e-mail sangrava para fora da tela (max-width não encolhe conteúdo
          abaixo do min-content). Com layout fixo, a coluna segue a largura da
          tabela e a imagem, em width:100%, acompanha.
        -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:600px;table-layout:fixed;background:${C.paper};">

          <!-- ══ Cabeçalho: as duas marcas e a janela da oferta ══ -->
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
                    ${escapeHtml(copy.selo)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="padding:0;font-size:0;line-height:0;">${barraEnergia()}</td></tr>

          <!-- ══ Hero ══ -->
          <tr>
            <td style="padding:0;font-size:0;line-height:0;background:${C.ink};">
              <img src="${hero}" alt="${escapeHtml(HERO_ALT)}" width="600" height="303" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;" />
            </td>
          </tr>

          <!-- ══ Abertura ══ -->
          <tr>
            <td class="pad" style="padding:30px 28px 0;">
              ${rotulo(copy.kicker, C.evolve)}
              <h1 class="title" style="margin:12px 0 0;font-family:${BLACK};font-size:42px;line-height:0.88;letter-spacing:-0.04em;text-transform:uppercase;color:${C.ink};font-weight:900;">
                ${saudacao}
              </h1>

              <p style="margin:20px 0 0;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.body};">
                ${copy.abertura}
              </p>
              <p style="margin:16px 0 0;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.ink};font-weight:bold;">
                E durante a semana, quem cuida do seu preparo?
              </p>
              <p style="margin:16px 0 0;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.body};">
                Em ${escapeHtml(OFERTA.janela)}, a Evolve tem uma <strong style="color:${C.ink};">condição especial</strong> pra você começar a treinar:
              </p>
            </td>
          </tr>

          <!-- ══ Oferta ══ -->
          <!-- O preço é texto, não imagem: é a única informação que não pode
               sumir quando a caixa de entrada bloqueia imagem por padrão. -->
          <tr>
            <td class="pad" style="padding:24px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.evolve}" style="background:${C.evolve};">
                <tr>
                  <td align="center" style="padding:26px 20px 30px;">
                    <p style="margin:0;font-family:${BLACK};font-size:17px;line-height:1.2;letter-spacing:-0.01em;text-transform:uppercase;color:#ffffff;font-weight:900;">
                      ${escapeHtml(OFERTA.chamadaPreco)}
                    </p>
                    <p class="preco" style="margin:8px 0 0;font-family:${BLACK};font-size:72px;line-height:1;letter-spacing:-0.04em;color:#ffffff;font-weight:900;">
                      ${escapeHtml(OFERTA.precoLabel)}
                    </p>
                    <p style="margin:10px 0 0;font-family:${BLACK};font-size:20px;line-height:1.2;text-transform:uppercase;color:#ffffff;font-weight:900;letter-spacing:-0.01em;">
                      ${escapeHtml(OFERTA.complemento)} 🤩
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══ CTA ══ -->
          <tr>
            <td class="pad" style="padding:24px 28px 0;">
              <!-- Preto, não vermelho: encostado no card da oferta, um botão
                   vermelho vira um segundo bloco da mesma cor e a pessoa deixa de
                   ver onde clicar. O último CTA, isolado no branco, volta ao
                   vermelho da Evolve. -->
              ${botao(href, "Quero treinar por R$ 9,90", C.ink)}
              <p style="margin:11px 0 0;font-family:${MONO};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${C.mute};">
                Leva menos de um minuto.
              </p>
            </td>
          </tr>

          <!-- ══ Fecho ══ -->
          <tr>
            <td class="pad" style="padding:30px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:3px solid ${C.somma};">
                <tr>
                  <td style="padding:2px 0 2px 16px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.body};">
                    Continue correndo aos sábados e, durante a semana,
                    <strong style="color:${C.ink};">fortaleça o corpo para chegar ainda mais forte na próxima corrida.</strong>
                  </td>
                </tr>
              </table>

              <p class="fecho" style="margin:26px 0 16px;font-family:${BLACK};font-size:30px;line-height:0.95;letter-spacing:-0.03em;text-transform:uppercase;color:${C.ink};font-weight:900;">
                BORA TREINAR? 💪
              </p>
              ${botao(href, "Garantir minha condição")}

              <!-- As regras são da Evolve. O e-mail não as reescreve. -->
              <p style="margin:14px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.mute};">
                Condição válida em ${escapeHtml(OFERTA.janela)} de 2026, para novos alunos, na adesão ao ${escapeHtml(OFERTA.plano)}.
                Unidades participantes, regras e demais valores do plano estão na página da Evolve.
              </p>
            </td>
          </tr>

          <!-- Respiro antes do rodapé: margin em td não vale em e-mail -->
          <tr><td height="32" style="height:32px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr><td style="padding:0;font-size:0;line-height:0;">${barraEnergia()}</td></tr>

          <!-- ══ Rodapé ══ -->
          <tr>
            <td class="pad" bgcolor="${C.ink}" style="background:${C.ink};padding:26px 28px;">
              <img class="logo-ev" src="${evolveLogo}" alt="Evolve" width="84" height="22" style="display:block;width:84px;height:22px;border:0;outline:none;" />
              <p style="margin:14px 0 0;font-family:${MONO};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${C.mute};">
                ${escapeHtml(OFERTA.instagram)} &#183; ${escapeHtml(OFERTA.site)}
              </p>
              <p style="margin:16px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.mute};">
                Se o botão não abrir, use este endereço:<br />
                <a href="${href}" target="_blank" style="color:${C.somma};text-decoration:underline;word-break:break-all;">venda.academiaevolve.com.br</a>
              </p>
              ${
                data.descadastroUrl
                  ? `<p style="margin:16px 0 0;font-family:${SANS};font-size:12px;line-height:1.5;color:#5c5a57;">
                Você recebe este e-mail porque se cadastrou no SOMMA Club. A Evolve é parceira do clube, e esta condição é dela.
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
 * Envio individual.
 *
 * Deixada pronta mas não ligada a nenhuma rota: disparar para a base é decisão
 * de quem opera, não efeito colateral de um deploy. Para os milhares de
 * endereços da base o caminho é o broadcast do Resend, que põe o
 * `List-Unsubscribe` e respeita a taxa sozinho, e não um laço chamando isto.
 */
export async function sendEvolveFortalecimento(params: {
  email: string;
  nome?: string | null;
  segmento?: SegmentoBase;
  etapa?: EtapaRegua;
  descadastroUrl?: string | null;
}): Promise<{ ok: boolean; erro?: string }> {
  const resend = getResendClient();
  const from = getEmailFrom();
  if (!resend || !from) return { ok: false, erro: "Resend não configurado." };

  const etapa = params.etapa ?? 1;
  try {
    await resend.emails.send({
      from,
      to: params.email,
      subject: evolveFortalecimentoSubject(etapa),
      html: renderEvolveFortalecimentoEmail({
        nome: params.nome ?? undefined,
        segmento: params.segmento ?? "cadastro-site",
        etapa,
        descadastroUrl: params.descadastroUrl ?? null,
      }),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : "Falha no envio." };
  }
}
