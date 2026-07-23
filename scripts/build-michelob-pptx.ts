/**
 * Gera a apresentação Somma Club x Michelob Ultra — "Michelob Ultra Social Run".
 *
 *   npx tsx scripts/build-michelob-pptx.ts
 *   → output/somma-michelob-ultra-social-run.pptx
 *
 * Formato 16:9 (13,333 × 7,5 pol). Paleta amostrada da própria logo Michelob
 * Ultra (navy #283280 / vermelho #D22030) + dourado de apoio. As imagens vêm de
 * public/michelob (recortes 16:9 do acervo Somma, já com grade azul).
 */
import PptxGenJS from "pptxgenjs";
import fs from "node:fs";
import path from "node:path";

/* ── Design tokens ─────────────────────────────────────────────────────── */

const BG = "060B1C"; // azul profundo (fundo)
const NAVY = "283280"; // navy da logo Michelob Ultra
const RED = "D22030"; // vermelho Michelob Ultra
const GOLD = "C6A664"; // dourado de apoio
const WHITE = "FFFFFF";
const OFF = "F2EFE6"; // off-white
const BODY = "B9C0D6"; // texto corrido sobre fundo escuro
const DIM = "7A83A0"; // texto secundário
const LINE = "273156"; // bordas

const DISPLAY = "Arial Narrow"; // condensada, disponível em Win e Mac
const SANS = "Arial";

const W = 13.333;
const H = 7.5;
const M = 0.9; // margem lateral
const CW = W - M * 2; // largura útil

const IMG = (n: string) => path.join("public", "michelob", n);

/* ── Helpers ───────────────────────────────────────────────────────────── */

type Slide = PptxGenJS.Slide;

let pptx: PptxGenJS;
let slideNo = 0;

/** Novo slide com fundo azul profundo e rodapé padrão. */
function newSlide(notes?: string): Slide {
  const s = pptx.addSlide();
  s.background = { color: BG };
  slideNo += 1;
  if (notes) s.addNotes(notes);
  return s;
}

/** Foto full-bleed + véu azul para manter o texto legível. */
function bgPhoto(s: Slide, file: string, veil: "cover" | "cards" = "cards") {
  s.addImage({ path: IMG(file), x: 0, y: 0, w: W, h: H, sizing: { type: "cover", w: W, h: H } });
  if (veil === "cover") {
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: BG, transparency: 28 } });
    s.addShape(pptx.ShapeType.rect, { x: 0, y: H * 0.55, w: W, h: H * 0.45, fill: { color: BG, transparency: 14 } });
  } else {
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: BG, transparency: 12 } });
  }
}

/** Lockup das duas logos, em branco, com "×" dourado. */
function lockup(s: Slide, x: number, y: number, h: number) {
  const somma = h * 3.73; // proporção real do arquivo
  const mich = h * 4.13;
  const gap = h * 0.9;
  s.addImage({ path: IMG("logo-somma-white.png"), x, y, w: somma, h });
  s.addText("×", {
    x: x + somma + gap * 0.15,
    y: y - h * 0.25,
    w: gap * 0.7,
    h: h * 1.5,
    fontFace: SANS,
    fontSize: h * 26,
    color: GOLD,
    align: "center",
    valign: "middle",
  });
  s.addImage({ path: IMG("logo-michelob-white.png"), x: x + somma + gap, y: y - h * 0.06, w: mich, h: h * 1.12 });
}

function kicker(s: Slide, text: string, y = 0.95, x = M) {
  s.addShape(pptx.ShapeType.rect, { x, y: y + 0.12, w: 0.32, h: 0.015, fill: { color: GOLD } });
  s.addText(text.toUpperCase(), {
    x: x + 0.47,
    y,
    w: CW,
    h: 0.28,
    fontFace: DISPLAY,
    fontSize: 12,
    bold: true,
    color: GOLD,
    charSpacing: 3.2,
    valign: "middle",
  });
}

type Part = { text: string; color?: string };

/** Título condensado, caixa alta, com destaque opcional em vermelho. */
function title(s: Slide, parts: Part[], opts: { y?: number; size?: number; w?: number; x?: number; align?: "left" | "center" } = {}) {
  const { y = 1.42, size = 44, w = CW, x = M, align = "left" } = opts;
  s.addText(
    parts.map((p) => ({ text: p.text.toUpperCase(), options: { color: p.color ?? WHITE } })),
    {
      x,
      y,
      w,
      h: size > 50 ? 1.85 : 1.25,
      fontFace: DISPLAY,
      fontSize: size,
      bold: true,
      color: WHITE,
      align,
      valign: "top",
      lineSpacingMultiple: 0.88,
    },
  );
}

function lead(s: Slide, text: string, opts: { y?: number; w?: number; x?: number; size?: number; align?: "left" | "center" } = {}) {
  const { y = 2.72, w = 8.2, x = M, size = 15, align = "left" } = opts;
  s.addText(text, {
    x,
    y,
    w,
    h: 0.95,
    fontFace: SANS,
    fontSize: size,
    color: BODY,
    align,
    valign: "top",
    lineSpacingMultiple: 1.22,
  });
}

/** Cartão de vidro (retângulo arredondado) usado em toda a apresentação. */
function card(
  s: Slide,
  o: { x: number; y: number; w: number; h: number; highlight?: boolean },
) {
  s.addShape(pptx.ShapeType.roundRect, {
    x: o.x,
    y: o.y,
    w: o.w,
    h: o.h,
    rectRadius: 0.14,
    fill: o.highlight ? { color: RED, transparency: 86 } : { color: BG, transparency: 22 },
    line: { color: o.highlight ? RED : LINE, width: o.highlight ? 1.25 : 1 },
  });
}

/** Cartão com título e texto — o bloco mais repetido do deck. */
function infoCard(
  s: Slide,
  o: {
    x: number; y: number; w: number; h: number;
    eyebrow?: string; title: string; text?: string;
    highlight?: boolean; titleSize?: number;
  },
) {
  card(s, o);
  const px = o.x + 0.36;
  const pw = o.w - 0.72;
  let cy = o.y + 0.34;

  if (o.eyebrow) {
    s.addText(o.eyebrow.toUpperCase(), {
      x: px, y: cy, w: pw, h: 0.24,
      fontFace: DISPLAY, fontSize: 10.5, bold: true,
      color: o.highlight ? RED : GOLD, charSpacing: 2.6, valign: "middle",
    });
    cy += 0.36;
  }
  // altura generosa: os títulos podem ocupar até 3 linhas se a fonte condensada
  // não estiver instalada e o PowerPoint substituir por Arial.
  s.addText(o.title.toUpperCase(), {
    x: px, y: cy, w: pw, h: 0.85,
    fontFace: DISPLAY, fontSize: o.titleSize ?? 19, bold: true, color: WHITE,
    valign: "top", lineSpacingMultiple: 0.9,
  });
  if (o.text) {
    s.addText(o.text, {
      x: px, y: cy + 0.9, w: pw, h: o.h - (cy - o.y) - 1.15,
      fontFace: SANS, fontSize: 11.5, color: BODY, valign: "top", lineSpacingMultiple: 1.2,
    });
  }
}

/** Lista com marcadores finos (traço ou ponto colorido). */
function bullets(
  s: Slide,
  items: string[],
  o: { x: number; y: number; w: number; color?: string; gap?: number; size?: number; textColor?: string },
) {
  const gap = o.gap ?? 0.34;
  items.forEach((t, i) => {
    const y = o.y + i * gap;
    s.addShape(pptx.ShapeType.ellipse, {
      x: o.x, y: y + (o.size ?? 12) / 100 + 0.03, w: 0.07, h: 0.07,
      fill: { color: o.color ?? GOLD },
    });
    s.addText(t, {
      x: o.x + 0.22, y, w: o.w - 0.22, h: gap,
      fontFace: SANS, fontSize: o.size ?? 12, color: o.textColor ?? OFF, valign: "top",
    });
  });
}

function footer(s: Slide) {
  s.addShape(pptx.ShapeType.rect, { x: 0, y: H - 0.44, w: W, h: 0.012, fill: { color: LINE } });
  s.addText("SOMMA CLUB × MICHELOB ULTRA · MICHELOB ULTRA SOCIAL RUN", {
    x: M, y: H - 0.4, w: 8, h: 0.28,
    fontFace: DISPLAY, fontSize: 8.5, color: DIM, charSpacing: 1.8, valign: "middle",
  });
  s.addText(String(slideNo).padStart(2, "0"), {
    x: W - M - 1, y: H - 0.4, w: 1, h: 0.28,
    fontFace: DISPLAY, fontSize: 8.5, color: DIM, align: "right", charSpacing: 1.5, valign: "middle",
  });
}

/* ── Slides ────────────────────────────────────────────────────────────── */

function slide01Capa() {
  const s = newSlide(
    "Abertura. Somma Club e Michelob Ultra apresentam uma proposta de campanha em collab: a Michelob Ultra Social Run. " +
      "O mote da campanha é: corra pelo momento, fique pela experiência.",
  );
  bgPhoto(s, "capa.jpg", "cover");

  lockup(s, M, 1.5, 0.46);

  s.addShape(pptx.ShapeType.rect, { x: M, y: 2.62, w: 0.9, h: 0.02, fill: { color: GOLD } });

  s.addText("PROPOSTA DE CAMPANHA · 2026", {
    x: M, y: 2.9, w: 8, h: 0.3,
    fontFace: DISPLAY, fontSize: 12.5, bold: true, color: GOLD, charSpacing: 4.5, valign: "middle",
  });

  s.addText(
    [
      { text: "MICHELOB ULTRA\n", options: { color: WHITE } },
      { text: "SOCIAL RUN", options: { color: RED } },
    ],
    {
      x: M, y: 3.32, w: 10.5, h: 2.1,
      fontFace: DISPLAY, fontSize: 76, bold: true, valign: "top", lineSpacingMultiple: 0.84,
    },
  );

  s.addText("Corra pelo momento. Fique pela experiência.", {
    x: M, y: 5.5, w: 8, h: 0.45,
    fontFace: SANS, fontSize: 18, color: OFF, valign: "middle",
  });

  s.addText("Consumo responsável · Experiência destinada ao público maior de 18 anos", {
    x: M, y: H - 0.75, w: 9, h: 0.28,
    fontFace: SANS, fontSize: 9, color: DIM, valign: "middle",
  });
}

function slide02Oportunidade() {
  const s = newSlide(
    "A corrida deixou de ser só performance. Virou comunidade e ponto de encontro. " +
      "É um comportamento que já existe — a marca não precisa criar o hábito, precisa entrar nele.",
  );
  bgPhoto(s, "comunidade.jpg");
  kicker(s, "A oportunidade");
  title(s, [{ text: "A corrida virou " }, { text: "ponto de encontro", color: RED }]);
  lead(
    s,
    "A corrida hoje é mais do que performance. É comunidade, estilo de vida, pertencimento e conexão social.",
  );

  const cw = (CW - 0.5) / 3;
  const items = [
    {
      t: "Comunidade recorrente",
      d: "Centenas de pessoas no mesmo lugar, toda semana, por vontade própria. Não é audiência comprada — é hábito.",
    },
    {
      t: "Momento social no pós-treino",
      d: "O treino termina e ninguém vai embora. É ali, depois da linha de chegada, que a conversa começa.",
    },
    {
      t: "Território natural para Michelob Ultra",
      d: "Uma marca de estilo de vida ativo entrando em um ritual que já existe — e que já é social por natureza.",
      hl: true,
    },
  ];
  items.forEach((it, i) => {
    infoCard(s, {
      x: M + i * (cw + 0.25), y: 3.95, w: cw, h: 2.6,
      eyebrow: String(i + 1).padStart(2, "0"),
      title: it.t, text: it.d, highlight: it.hl,
    });
  });
  footer(s);
}

function slide03Desafio() {
  const s = newSlide(
    "O risco de qualquer marca em comunidade é virar só um logo no evento. " +
      "A diferença entre patrocínio e experiência proprietária é o que a comunidade leva embora.",
  );
  bgPhoto(s, "marca.jpg");
  kicker(s, "O desafio da marca");
  title(s, [{ text: "Como entrar na comunidade sem parecer " }, { text: "só patrocínio", color: RED }], { size: 38 });
  lead(
    s,
    "O risco é ser apenas uma marca presente no evento. A oportunidade é criar uma experiência que a comunidade queira viver, registrar e compartilhar.",
    { y: 3.05, w: 8.6 },
  );

  const cw = (CW - 0.35) / 2;
  const y = 4.1;

  card(s, { x: M, y, w: cw, h: 2.6 });
  s.addText("PATROCÍNIO COMUM", {
    x: M + 0.36, y: y + 0.32, w: cw - 0.72, h: 0.35,
    fontFace: DISPLAY, fontSize: 19, bold: true, color: DIM, charSpacing: 1.6, valign: "middle",
  });
  bullets(s, ["Logo", "Produto", "Presença pontual"], {
    x: M + 0.36, y: y + 0.85, w: cw - 0.72, color: DIM, textColor: DIM, size: 13,
  });
  s.addText("A marca aparece. E é esquecida na segunda-feira.", {
    x: M + 0.36, y: y + 2.15, w: cw - 0.72, h: 0.3,
    fontFace: SANS, fontSize: 10, color: "5B6480", italic: true, valign: "middle",
  });

  const x2 = M + cw + 0.35;
  card(s, { x: x2, y, w: cw, h: 2.6, highlight: true });
  s.addText("EXPERIÊNCIA PROPRIETÁRIA", {
    x: x2 + 0.36, y: y + 0.32, w: cw - 0.72, h: 0.35,
    fontFace: DISPLAY, fontSize: 19, bold: true, color: RED, charSpacing: 1.6, valign: "middle",
  });
  bullets(s, ["Narrativa", "Participação", "Conteúdo", "Dados", "Continuidade"], {
    x: x2 + 0.36, y: y + 0.82, w: cw - 0.72, color: RED, textColor: WHITE, size: 12.5, gap: 0.26,
  });
  s.addText("A marca é vivida. E vira história que a comunidade conta.", {
    x: x2 + 0.36, y: y + 2.15, w: cw - 0.72, h: 0.3,
    fontFace: SANS, fontSize: 10, color: OFF, italic: true, valign: "middle",
  });
  footer(s);
}

function slide04GrandeIdeia() {
  const s = newSlide(
    "A grande ideia: Michelob Ultra Social Run. Uma experiência proprietária que começa na corrida " +
      "e termina como encontro social premium. Três verbos guiam a campanha: run, connect, celebrate.",
  );
  bgPhoto(s, "pelotao.jpg", "cover");
  kicker(s, "A grande ideia", 1.15, M);
  s.addText(
    [
      { text: "MICHELOB ULTRA ", options: { color: WHITE } },
      { text: "SOCIAL RUN", options: { color: RED } },
    ],
    {
      x: M, y: 1.6, w: CW, h: 1.4,
      fontFace: DISPLAY, fontSize: 58, bold: true, valign: "top", lineSpacingMultiple: 0.88,
    },
  );
  lead(s, "Uma experiência que começa na corrida e termina em um encontro social premium.", {
    y: 3.05, w: 9, size: 17,
  });

  const cw = (CW - 0.5) / 3;
  [
    ["Run", "Corrida que inspira movimento"],
    ["Connect", "Comunidade que aproxima pessoas"],
    ["Celebrate", "Experiências que viram memória"],
  ].forEach(([v, d], i) => {
    const x = M + i * (cw + 0.25);
    card(s, { x, y: 4.05, w: cw, h: 2.3 });
    s.addShape(pptx.ShapeType.rect, { x: x + 0.4, y: 4.42, w: 0.42, h: 0.02, fill: { color: GOLD } });
    s.addText(v.toUpperCase(), {
      x: x + 0.4, y: 4.68, w: cw - 0.8, h: 0.75,
      fontFace: DISPLAY, fontSize: 38, bold: true, color: WHITE, valign: "middle",
    });
    s.addText(d, {
      x: x + 0.4, y: 5.5, w: cw - 0.8, h: 0.6,
      fontFace: SANS, fontSize: 12, color: BODY, valign: "top", lineSpacingMultiple: 1.2,
    });
  });
  footer(s);
}

function slide05SocialPace() {
  const s = newSlide(
    "Conceito criativo: The Social Pace. Todo corredor tem dois ritmos — o pace da corrida e o pace da vida. " +
      "Os cards compartilháveis nascem daqui.",
  );
  bgPhoto(s, "social-pace.jpg");
  kicker(s, "O conceito criativo");
  title(s, [{ text: "The " }, { text: "Social Pace", color: RED }], { size: 52 });
  lead(s, "Todo corredor tem dois ritmos: o pace da corrida e o pace da vida.", { y: 3.0, w: 6, size: 17 });

  s.addShape(pptx.ShapeType.rect, { x: M, y: 4.0, w: 0.025, h: 1.35, fill: { color: GOLD } });
  s.addText("“A gente mede o tempo da corrida.\nOs melhores momentos não precisam de relógio.”", {
    x: M + 0.28, y: 4.0, w: 5.2, h: 1.35,
    fontFace: SANS, fontSize: 15, color: OFF, italic: true, valign: "middle", lineSpacingMultiple: 1.25,
  });

  // mockups dos cards compartilháveis
  const cards = [
    { run: "5:20/km", label: "Meu pace com os amigos", life: "sem pressa" },
    { run: "6:40/km", label: "Meu pace para aproveitar", life: "o dia inteiro" },
  ];
  cards.forEach((c, i) => {
    const x = 7.35 + i * 2.85;
    const y = 2.55;
    const cw = 2.55;
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: cw, h: 3.3, rectRadius: 0.12,
      fill: { color: NAVY }, line: { color: "3D49A0", width: 1 },
      shadow: { type: "outer", color: "000000", blur: 14, offset: 4, angle: 90, opacity: 0.45 },
    });
    s.addText("MEU PACE NA CORRIDA", {
      x: x + 0.28, y: y + 0.3, w: cw - 0.56, h: 0.24,
      fontFace: DISPLAY, fontSize: 9, bold: true, color: "AEB6E8", charSpacing: 2, valign: "middle",
    });
    s.addText(c.run, {
      x: x + 0.28, y: y + 0.56, w: cw - 0.56, h: 0.6,
      fontFace: DISPLAY, fontSize: 34, bold: true, color: WHITE, valign: "middle",
    });
    s.addShape(pptx.ShapeType.rect, { x: x + 0.28, y: y + 1.28, w: cw - 0.56, h: 0.012, fill: { color: GOLD } });
    s.addText(c.label.toUpperCase(), {
      x: x + 0.28, y: y + 1.45, w: cw - 0.56, h: 0.24,
      fontFace: DISPLAY, fontSize: 9, bold: true, color: GOLD, charSpacing: 2, valign: "middle",
    });
    s.addText(c.life, {
      x: x + 0.28, y: y + 1.72, w: cw - 0.56, h: 0.6,
      fontFace: DISPLAY, fontSize: 26, bold: true, color: WHITE, valign: "middle",
    });
    s.addShape(pptx.ShapeType.rect, { x, y: y + 2.78, w: cw, h: 0.52, fill: { color: RED } });
    s.addText("SOCIAL RUN", {
      x: x + 0.28, y: y + 2.78, w: cw - 0.56, h: 0.52,
      fontFace: DISPLAY, fontSize: 11, bold: true, color: WHITE, charSpacing: 2.4, valign: "middle",
    });
  });
  s.addText("Exemplos de cards compartilháveis gerados na inscrição.", {
    x: 7.35, y: 6.05, w: 5.4, h: 0.3,
    fontFace: SANS, fontSize: 10, color: DIM, valign: "middle",
  });
  footer(s);
}

function slide06ComoFunciona() {
  const s = newSlide(
    "A campanha acontece em três momentos: aquecimento digital antes, a Social Run no dia " +
      "e o Ultra After Run depois. Desejo antes, experiência durante, memória depois.",
  );
  kicker(s, "Como funciona");
  title(s, [{ text: "A campanha em " }, { text: "três momentos", color: RED }]);

  const steps = [
    ["01", "Aquecimento digital", "Inscrição, escolha do perfil, cards compartilháveis e desafio."],
    ["02", "Michelob Ultra Social Run", "Treino especial de 5 km e 10 km, pelotões, experiências e conteúdo."],
    ["03", "Ultra After Run", "Música, recovery, convivência, experimentação responsável e socialização."],
  ];
  const cw = (CW - 0.5) / 3;
  const y = 3.5;

  // trilho do fluxo
  s.addShape(pptx.ShapeType.rect, { x: M + 0.5, y: y + 0.34, w: CW - 1, h: 0.012, fill: { color: LINE } });

  steps.forEach(([n, t, d], i) => {
    const x = M + i * (cw + 0.25);
    const hl = i === 1;
    s.addShape(pptx.ShapeType.ellipse, {
      x, y, w: 0.7, h: 0.7,
      fill: { color: BG }, line: { color: hl ? RED : GOLD, width: 1.75 },
    });
    s.addText(n, {
      x, y, w: 0.7, h: 0.7,
      fontFace: DISPLAY, fontSize: 17, bold: true, color: hl ? RED : GOLD, align: "center", valign: "middle",
    });
    s.addText(t.toUpperCase(), {
      x, y: y + 1.05, w: cw - 0.3, h: 0.75,
      fontFace: DISPLAY, fontSize: 26, bold: true, color: WHITE, valign: "top", lineSpacingMultiple: 0.9,
    });
    s.addText(d, {
      x, y: y + 1.85, w: cw - 0.5, h: 0.9,
      fontFace: SANS, fontSize: 12.5, color: BODY, valign: "top", lineSpacingMultiple: 1.22,
    });
  });

  s.addText("Desejo antes · experiência durante · memória depois.", {
    x: M, y: 6.35, w: CW, h: 0.3,
    fontFace: SANS, fontSize: 11.5, color: DIM, valign: "middle",
  });
  footer(s);
}

function slide07Aquecimento() {
  const s = newSlide(
    "Uma a duas semanas antes, a campanha faz uma única pergunta: qual é o seu motivo para correr? " +
      "O participante escolhe um perfil na landing page e recebe um card compartilhável — inscrição vira conteúdo.",
  );
  bgPhoto(s, "digital.jpg");
  kicker(s, "Momento 01 · Antes do evento");
  title(s, [{ text: "Desejo e " }, { text: "identificação", color: RED }], { size: 42, w: 7.6 });
  lead(s, "Por uma a duas semanas, Somma e Michelob Ultra fazem uma única pergunta: qual é o seu motivo para correr?", {
    y: 2.72, w: 7.2,
  });

  s.addText("NA LANDING PAGE, O PARTICIPANTE ESCOLHE UM PERFIL", {
    x: M, y: 3.85, w: 7.2, h: 0.28,
    fontFace: DISPLAY, fontSize: 10.5, bold: true, color: DIM, charSpacing: 2.4, valign: "middle",
  });

  ["Performance", "Comunidade", "Diversão", "Equilíbrio"].forEach((p, i) => {
    const x = M + i * 1.72;
    s.addShape(pptx.ShapeType.roundRect, {
      x, y: 4.25, w: 1.6, h: 0.5, rectRadius: 0.25,
      fill: { color: BG, transparency: 40 }, line: { color: GOLD, width: 1 },
    });
    s.addText(p.toUpperCase(), {
      x, y: 4.25, w: 1.6, h: 0.5,
      fontFace: DISPLAY, fontSize: 13, bold: true, color: GOLD, align: "center", valign: "middle", charSpacing: 1,
    });
  });

  card(s, { x: M, y: 5.05, w: 7.2, h: 1.25 });
  s.addText("CADA UM RECEBE UM CARD COMPARTILHÁVEL", {
    x: M + 0.35, y: 5.25, w: 6.5, h: 0.26,
    fontFace: DISPLAY, fontSize: 9.5, bold: true, color: DIM, charSpacing: 2.2, valign: "middle",
  });
  s.addText(
    [
      { text: "“Meu pace é 6:10. Meu motivo é ", options: { color: WHITE } },
      { text: "encontrar minha galera", options: { color: RED } },
      { text: ".”", options: { color: WHITE } },
    ],
    {
      x: M + 0.35, y: 5.55, w: 6.5, h: 0.55,
      fontFace: DISPLAY, fontSize: 24, bold: true, valign: "middle",
    },
  );

  mockPhone(s, 9.55, 1.5);
  footer(s);
}

/** Mockup do celular com a landing page da campanha. */
function mockPhone(s: Slide, x: number, y: number) {
  const w = 2.6;
  const h = 5.05;
  s.addShape(pptx.ShapeType.roundRect, {
    x: x - 0.09, y: y - 0.09, w: w + 0.18, h: h + 0.18, rectRadius: 0.3,
    fill: { color: "151A31" }, line: { color: "2A3050", width: 1 },
    shadow: { type: "outer", color: "000000", blur: 18, offset: 5, angle: 90, opacity: 0.5 },
  });
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.24, fill: { color: BG }, line: { color: "1E2540", width: 0.75 } });
  s.addShape(pptx.ShapeType.roundRect, { x: x + w / 2 - 0.28, y: y + 0.12, w: 0.56, h: 0.07, rectRadius: 0.035, fill: { color: "2A3050" } });

  lockup(s, x + 0.62, y + 0.42, 0.14);

  s.addText("QUAL É O SEU MOTIVO\nPARA CORRER?", {
    x: x + 0.2, y: y + 0.78, w: w - 0.4, h: 0.72,
    fontFace: DISPLAY, fontSize: 17, bold: true, color: WHITE, align: "center", valign: "middle", lineSpacingMultiple: 0.92,
  });

  const opts: [string, boolean][] = [
    ["Performance", false],
    ["Comunidade", true],
    ["Diversão", false],
    ["Equilíbrio", false],
  ];
  opts.forEach(([label, on], i) => {
    const oy = y + 1.62 + i * 0.44;
    s.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.22, y: oy, w: w - 0.44, h: 0.36, rectRadius: 0.07,
      fill: on ? { color: RED, transparency: 78 } : { color: "FFFFFF", transparency: 94 },
      line: { color: on ? RED : "2A3050", width: 0.75 },
    });
    s.addText(label, {
      x: x + 0.36, y: oy, w: w - 0.85, h: 0.36,
      fontFace: SANS, fontSize: 9.5, bold: on, color: on ? WHITE : BODY, valign: "middle",
    });
    s.addShape(pptx.ShapeType.ellipse, {
      x: x + w - 0.46, y: oy + 0.11, w: 0.14, h: 0.14,
      fill: on ? { color: RED } : { color: BG },
      line: { color: on ? RED : "3A4166", width: 0.75 },
    });
  });

  s.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.22, y: y + 3.46, w: w - 0.44, h: 0.42, rectRadius: 0.08, fill: { color: RED },
  });
  s.addText("GARANTIR MINHA VAGA", {
    x: x + 0.22, y: y + 3.46, w: w - 0.44, h: 0.42,
    fontFace: DISPLAY, fontSize: 11, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1.4,
  });

  s.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.22, y: y + 3.98, w: w - 0.44, h: 0.62, rectRadius: 0.08, fill: { color: NAVY },
  });
  s.addText(
    [
      { text: "Meu pace é 6:10. Meu motivo é ", options: { color: WHITE } },
      { text: "encontrar minha galera", options: { color: GOLD } },
      { text: ".", options: { color: WHITE } },
    ],
    { x: x + 0.34, y: y + 4.04, w: w - 0.68, h: 0.5, fontFace: SANS, fontSize: 8, bold: true, valign: "middle", lineSpacingMultiple: 1.1 },
  );
  s.addText("+18 · Consumo responsável", {
    x, y: y + 4.68, w, h: 0.24,
    fontFace: SANS, fontSize: 6.5, color: DIM, align: "center", valign: "middle",
  });
}

function slide08Challenge() {
  const s = newSlide(
    "O Ultra Balance Challenge faz a campanha durar 21 dias em vez de um sábado. " +
      "Missões simples de movimento, conexão e diversão — quem completa desbloqueia benefícios no evento.",
  );
  bgPhoto(s, "desafio.jpg");
  kicker(s, "Ultra Balance Challenge");
  title(s, [{ text: "Um desafio para a campanha durar\n" }, { text: "mais que um dia", color: RED }], { size: 38 });
  lead(s, "Durante 21 dias, a comunidade cumpre missões simples ligadas a movimento, conexão e diversão.", {
    y: 3.1, w: 8.6,
  });

  s.addTable(
    [
      [
        { text: "PILAR", options: { color: DIM, bold: true, fontFace: DISPLAY, fontSize: 10 } },
        { text: "MISSÃO DA SEMANA", options: { color: DIM, bold: true, fontFace: DISPLAY, fontSize: 10 } },
      ],
      [
        { text: "MOVIMENTO", options: { color: WHITE, bold: true, fontFace: DISPLAY, fontSize: 15 } },
        { text: "Realizar três treinos na semana", options: { color: BODY, fontFace: SANS, fontSize: 12 } },
      ],
      [
        { text: "CONEXÃO", options: { color: WHITE, bold: true, fontFace: DISPLAY, fontSize: 15 } },
        { text: "Correr com alguém novo", options: { color: BODY, fontFace: SANS, fontSize: 12 } },
      ],
      [
        { text: "DIVERSÃO", options: { color: WHITE, bold: true, fontFace: DISPLAY, fontSize: 15 } },
        { text: "Compartilhar seu ritual de equilíbrio", options: { color: BODY, fontFace: SANS, fontSize: 12 } },
      ],
    ],
    {
      x: M, y: 4.05, w: 7.5, colW: [2.3, 5.2],
      rowH: [0.32, 0.46, 0.46, 0.46],
      border: [
        { type: "none" },
        { type: "none" },
        { type: "solid", color: LINE, pt: 1 },
        { type: "none" },
      ],
      fill: { color: BG, transparency: 25 },
      valign: "middle",
      margin: [0, 10, 0, 14],
    },
  );

  // barra de progresso dos 21 dias
  s.addText("21 DIAS · PROGRESSO DA COMUNIDADE", {
    x: M, y: 5.95, w: 5, h: 0.26,
    fontFace: DISPLAY, fontSize: 9.5, bold: true, color: DIM, charSpacing: 2.2, valign: "middle",
  });
  const done = 13;
  for (let i = 0; i < 21; i++) {
    s.addShape(pptx.ShapeType.rect, {
      x: M + i * 0.355, y: 6.28, w: 0.29, h: 0.29,
      fill: i < done ? { color: RED, transparency: Math.max(0, 45 - i * 3.4) } : { color: "FFFFFF", transparency: 90 },
    });
  }

  const x2 = 8.75;
  card(s, { x: x2, y: 4.05, w: CW - (x2 - M), h: 2.52, highlight: true });
  s.addText("QUEM COMPLETA, DESBLOQUEIA", {
    x: x2 + 0.35, y: 4.32, w: 3.4, h: 0.32,
    fontFace: DISPLAY, fontSize: 16, bold: true, color: RED, charSpacing: 1.4, valign: "middle",
  });
  bullets(
    s,
    ["Área exclusiva no evento", "Produtos personalizados", "Experiências especiais", "Acesso ao Ultra After Run"],
    { x: x2 + 0.35, y: 4.88, w: 3.3, color: RED, textColor: WHITE, size: 12.5, gap: 0.4 },
  );
  footer(s);
}

function slide09SocialRun() {
  const s = newSlide(
    "O treino especial: sábado pela manhã, 5 km e 10 km, com pelotões divididos por ritmo e perfil. " +
      "As crews dão a cada participante um lugar — inclusive para quem nunca correu.",
  );
  bgPhoto(s, "treino.jpg");
  kicker(s, "Momento 02 · Michelob Ultra Social Run");
  title(s, [{ text: "O " }, { text: "treino especial", color: RED }]);
  s.addText("Sábado pela manhã   ·   Percursos de 5 km e 10 km   ·   Pelotões por ritmo e perfil", {
    x: M, y: 2.78, w: CW, h: 0.35,
    fontFace: SANS, fontSize: 13.5, color: BODY, valign: "middle",
  });

  const crews = [
    ["Performance Crew", "Quem busca tempo e evolução.", "crew-performance.jpg"],
    ["Social Crew", "Quem corre pela conversa.", "crew-social.jpg"],
    ["Enjoy Crew", "Quem vai pelo prazer do percurso.", "crew-enjoy.jpg"],
    ["First Run Crew", "Quem está começando agora.", "crew-first.jpg"],
  ];
  const cw = (CW - 0.6) / 4;
  crews.forEach(([n, d, img], i) => {
    const x = M + i * (cw + 0.2);
    const y = 3.42;
    s.addImage({ path: IMG(img), x, y, w: cw, h: 1.55, sizing: { type: "cover", w: cw, h: 1.55 } });
    s.addShape(pptx.ShapeType.rect, { x, y: y + 1.05, w: cw, h: 0.5, fill: { color: BG, transparency: 35 } });
    s.addShape(pptx.ShapeType.rect, {
      x, y: y + 1.55, w: cw, h: 1.45,
      fill: { color: BG, transparency: 18 }, line: { color: LINE, width: 1 },
    });
    s.addText(n.toUpperCase(), {
      x: x + 0.22, y: y + 1.68, w: cw - 0.44, h: 0.52,
      fontFace: DISPLAY, fontSize: 17, bold: true, color: WHITE, valign: "top", lineSpacingMultiple: 0.9,
    });
    s.addText(d, {
      x: x + 0.22, y: y + 2.24, w: cw - 0.44, h: 0.6,
      fontFace: SANS, fontSize: 10.5, color: BODY, valign: "top", lineSpacingMultiple: 1.15,
    });
  });
  footer(s);
}

function slide10Percurso() {
  const s = newSlide(
    "Três ativações transformam o percurso em experiência: o Ultra Pace Point registra o ritmo, " +
      "o Enjoyment Kilometer entrega o último km com música e torcida, e a Social Finish Line leva direto ao espaço da marca.",
  );
  bgPhoto(s, "percurso.jpg");
  kicker(s, "Pontos de experiência no percurso");
  title(s, [{ text: "A corrida vira " }, { text: "experiência", color: RED }]);

  const pts = [
    ["KM 2", "Ultra Pace Point", "Registro do ritmo do corredor com foto ou vídeo personalizado."],
    ["ÚLTIMO KM", "Enjoyment Kilometer", "Música, torcida, mensagens e captação de conteúdo no trecho final."],
    ["CHEGADA", "Social Finish Line", "A linha de chegada leva direto ao espaço de convivência Michelob Ultra."],
  ];
  const cw = (CW - 0.5) / 3;
  const y = 3.75;

  s.addShape(pptx.ShapeType.rect, { x: M + 0.28, y: y + 0.27, w: CW - 0.9, h: 0.02, fill: { color: GOLD, transparency: 55 } });

  pts.forEach(([km, t, d], i) => {
    const x = M + i * (cw + 0.25);
    const last = i === 2;
    s.addShape(pptx.ShapeType.ellipse, {
      x, y, w: 0.56, h: 0.56,
      fill: { color: BG }, line: { color: last ? RED : GOLD, width: 1.75 },
    });
    s.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.19, y: y + 0.19, w: 0.18, h: 0.18, fill: { color: last ? RED : GOLD },
    });
    s.addText(km, {
      x, y: y + 0.85, w: cw, h: 0.26,
      fontFace: DISPLAY, fontSize: 10.5, bold: true, color: last ? RED : GOLD, charSpacing: 2.8, valign: "middle",
    });
    s.addText(t.toUpperCase(), {
      x, y: y + 1.15, w: cw - 0.3, h: 0.72,
      fontFace: DISPLAY, fontSize: 27, bold: true, color: WHITE, valign: "top", lineSpacingMultiple: 0.9,
    });
    s.addText(d, {
      x, y: y + 1.92, w: cw - 0.5, h: 0.85,
      fontFace: SANS, fontSize: 12, color: BODY, valign: "top", lineSpacingMultiple: 1.22,
    });
  });
  footer(s);
}

function slide11AfterRun() {
  const s = newSlide(
    "O Ultra After Run é o território da marca: é aqui que a Michelob Ultra deixa de ser patrocinadora e vira anfitriã. " +
      "Sempre com consumo responsável e público maior de 18 anos.",
  );
  bgPhoto(s, "afterrun.jpg");
  kicker(s, "Momento 03 · Ultra After Run");
  title(s, [{ text: "O pós-treino como " }, { text: "território da marca", color: RED }], { size: 40 });
  lead(s, "É aqui que a corrida vira encontro — e a marca deixa de ser patrocinadora para virar anfitriã.", {
    y: 2.78, w: 8.6,
  });

  const items = [
    "Bar Michelob Ultra",
    "Espaço recovery",
    "DJ ou música ao vivo",
    "Café da manhã",
    "Hidratação",
    "Área de fotos e vídeos",
    "Personalização de copos",
    "Jogos sociais rápidos",
    "Loja colaborativa",
    "Convidados e influenciadores",
  ];
  const cols = 5;
  const cw = (CW - 0.2 * (cols - 1)) / cols;
  items.forEach((t, i) => {
    const x = M + (i % cols) * (cw + 0.2);
    const y = 3.85 + Math.floor(i / cols) * 1.15;
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: cw, h: 1.0, rectRadius: 0.1,
      fill: { color: BG, transparency: 22 }, line: { color: LINE, width: 1 },
    });
    s.addText(String(i + 1).padStart(2, "0"), {
      x: x + 0.22, y: y + 0.12, w: cw - 0.44, h: 0.22,
      fontFace: DISPLAY, fontSize: 9, bold: true, color: GOLD, charSpacing: 1.6, valign: "middle",
    });
    s.addText(t, {
      x: x + 0.22, y: y + 0.36, w: cw - 0.44, h: 0.5,
      fontFace: SANS, fontSize: 11.5, bold: true, color: OFF, valign: "top", lineSpacingMultiple: 1.12,
    });
  });

  s.addText("Consumo responsável. Experiência destinada ao público maior de 18 anos.", {
    x: M, y: 6.25, w: CW, h: 0.28,
    fontFace: SANS, fontSize: 9.5, color: DIM, valign: "middle",
  });
  footer(s);
}

function slide12Conteudo() {
  const s = newSlide(
    "O conteúdo transforma a ativação em narrativa: pessoas reais que sabem equilibrar movimento, trabalho e diversão. " +
      "Um filme principal sustenta a campanha, e o resto alimenta os canais durante todo o período.",
  );
  bgPhoto(s, "conteudo.jpg");
  kicker(s, "Conteúdo da campanha");
  title(s, [{ text: "Pessoas que sabem " }, { text: "equilibrar", color: RED }], { size: 42, w: 7 });
  lead(
    s,
    "A campanha deixa de ser uma ativação pontual e vira narrativa humana: quem são as pessoas que treinam, trabalham, riem e aproveitam — no ritmo delas.",
    { y: 2.9, w: 6.1 },
  );

  card(s, { x: M, y: 4.35, w: 6.1, h: 1.15, highlight: true });
  s.addShape(pptx.ShapeType.ellipse, { x: M + 0.32, y: 4.62, w: 0.6, h: 0.6, fill: { color: RED } });
  s.addShape(pptx.ShapeType.triangle, {
    x: M + 0.5, y: 4.75, w: 0.26, h: 0.34, fill: { color: WHITE }, rotate: 90,
  });
  s.addText("FILME PRINCIPAL · 60S", {
    x: M + 1.1, y: 4.6, w: 4.6, h: 0.35,
    fontFace: DISPLAY, fontSize: 21, bold: true, color: WHITE, valign: "middle",
  });
  s.addText("O manifesto do Social Pace.", {
    x: M + 1.1, y: 4.95, w: 4.6, h: 0.3,
    fontFace: SANS, fontSize: 11.5, color: OFF, valign: "middle",
  });

  const formats: [string, string][] = [
    ["4 vídeos individuais", "20 a 30 segundos"],
    ["Reels do treino", "no calor do momento"],
    ["Bastidores", "making of da experiência"],
    ["Fotos dos participantes", "galeria oficial"],
    ["Depoimentos rápidos", "a voz da comunidade"],
    ["Recap oficial", "o resumo da campanha"],
    ["UGC da comunidade", "conteúdo espontâneo"],
    ["Distribuição Somma", "canais, professores e insiders"],
  ];
  const gx = 7.5;
  const gw = (CW - (gx - M) - 0.2) / 2;
  formats.forEach(([t, sub], i) => {
    const x = gx + (i % 2) * (gw + 0.2);
    const y = 1.72 + Math.floor(i / 2) * 1.22;
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: gw, h: 1.02, rectRadius: 0.1,
      fill: { color: BG, transparency: 22 }, line: { color: LINE, width: 1 },
    });
    s.addText(t, {
      x: x + 0.24, y: y + 0.2, w: gw - 0.48, h: 0.4,
      fontFace: SANS, fontSize: 12, bold: true, color: WHITE, valign: "top", lineSpacingMultiple: 1.1,
    });
    s.addText(sub, {
      x: x + 0.24, y: y + 0.62, w: gw - 0.48, h: 0.28,
      fontFace: SANS, fontSize: 10, color: DIM, valign: "middle",
    });
  });
  footer(s);
}

function slide13Entrega() {
  const s = newSlide(
    "O que o Somma coloca na mesa: comunidade, execução da experiência, conteúdo, dados e a possibilidade de continuidade. " +
      "Mais de 5 mil membros e presença recorrente todo sábado.",
  );
  bgPhoto(s, "entrega.jpg");
  kicker(s, "O que o Somma entrega");
  title(s, [{ text: "Cinco frentes, " }, { text: "uma execução", color: RED }]);

  const fronts = [
    ["Comunidade", "Acesso a mais de 5 mil membros e presença recorrente toda semana."],
    ["Experiência", "Planejamento e execução do treino, pelotões, professores, percurso e equipe de apoio."],
    ["Conteúdo", "Produção e distribuição nos canais do Somma, professores, insiders e participantes."],
    ["Dados", "Landing page, inscrições, aceite de comunicação, perfil, presença, pesquisa e relatório final."],
    ["Continuidade", "Possibilidade de virar plataforma mensal ou trimestral com a marca."],
  ];
  const cw = (CW - 0.6) / 5;
  fronts.forEach(([t, d], i) => {
    const x = M + i * (cw + 0.15);
    card(s, { x, y: 3.05, w: cw, h: 2.25 });
    s.addShape(pptx.ShapeType.rect, { x: x + 0.2, y: 3.35, w: 0.34, h: 0.02, fill: { color: GOLD } });
    s.addText(t.toUpperCase(), {
      x: x + 0.2, y: 3.55, w: cw - 0.4, h: 0.42,
      fontFace: DISPLAY, fontSize: 17, bold: true, color: WHITE, valign: "top",
    });
    s.addText(d, {
      x: x + 0.2, y: 4.0, w: cw - 0.4, h: 1.15,
      fontFace: SANS, fontSize: 10.5, color: BODY, valign: "top", lineSpacingMultiple: 1.18,
    });
  });

  const stats: [string, string][] = [
    ["5.000+", "membros na comunidade"],
    ["300", "pessoas todo sábado"],
    ["#1", "running club do DF"],
  ];
  stats.forEach(([v, l], i) => {
    const x = M + i * 3.5;
    s.addText(v, {
      x, y: 5.5, w: 3.3, h: 0.62,
      fontFace: DISPLAY, fontSize: 44, bold: true, color: i === 2 ? RED : WHITE, valign: "middle",
    });
    s.addText(l, {
      x, y: 6.1, w: 3.3, h: 0.3,
      fontFace: SANS, fontSize: 11, color: DIM, valign: "middle",
    });
  });
  footer(s);
}

function slide14Indicadores() {
  const s = newSlide(
    "Como o resultado é medido: alcance, base captada, mídia, conteúdo, produto experimentado, " +
      "percepção de marca e eficiência. Relatório consolidado entregue pelo Somma até 15 dias depois.",
  );
  kicker(s, "Indicadores de sucesso");
  title(s, [{ text: "Como vamos " }, { text: "medir resultado", color: RED }]);

  const rows: [string, string][] = [
    ["Alcance", "Inscritos · participantes presentes · maiores de 18 impactados"],
    ["Base", "Novos cadastros captados com aceite de comunicação"],
    ["Mídia", "Alcance, visualizações, marcações e menções"],
    ["Conteúdo", "Peças da produção + conteúdo produzido pelos participantes"],
    ["Produto", "Produtos experimentados no Ultra After Run"],
    ["Marca", "Lembrança, intenção de compra e associação com vida ativa"],
    ["Eficiência", "Custo por participante impactado"],
  ];

  s.addTable(
    [
      [
        { text: "DIMENSÃO", options: { color: DIM, bold: true, fontFace: DISPLAY, fontSize: 10 } },
        { text: "INDICADORES", options: { color: DIM, bold: true, fontFace: DISPLAY, fontSize: 10 } },
      ],
      ...rows.map(([d, i]) => [
        { text: d.toUpperCase(), options: { color: WHITE, bold: true, fontFace: DISPLAY, fontSize: 14 } },
        { text: i, options: { color: BODY, fontFace: SANS, fontSize: 11 } },
      ]),
    ],
    {
      x: M, y: 3.05, w: 7.55, colW: [1.95, 5.6],
      rowH: 0.42,
      border: [{ type: "none" }, { type: "none" }, { type: "solid", color: LINE, pt: 1 }, { type: "none" }],
      fill: { color: BG, transparency: 25 },
      valign: "middle",
      margin: [0, 10, 0, 14],
    },
  );

  mockReport(s, 9.05, 3.05);
  s.addText("Relatório final consolidado entregue pelo Somma até 15 dias após o evento.", {
    x: 9.05, y: 6.25, w: 3.4, h: 0.45,
    fontFace: SANS, fontSize: 10, color: DIM, valign: "top", lineSpacingMultiple: 1.15,
  });
  footer(s);
}

/** Mockup do relatório de dados entregue ao fim da campanha. */
function mockReport(s: Slide, x: number, y: number) {
  const w = 3.4;
  const h = 3.05;
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.12,
    fill: { color: BG, transparency: 15 }, line: { color: LINE, width: 1 },
    shadow: { type: "outer", color: "000000", blur: 14, offset: 4, angle: 90, opacity: 0.4 },
  });
  s.addText("RELATÓRIO DA CAMPANHA", {
    x: x + 0.25, y: y + 0.16, w: w - 0.5, h: 0.3,
    fontFace: DISPLAY, fontSize: 12, bold: true, color: WHITE, charSpacing: 1.4, valign: "middle",
  });
  s.addShape(pptx.ShapeType.rect, { x: x + 0.25, y: y + 0.5, w: w - 0.5, h: 0.01, fill: { color: LINE } });

  const kpis: [string, string][] = [["1.240", "Inscritos"], ["870", "Presentes"], ["610", "Novos leads"]];
  kpis.forEach(([v, l], i) => {
    const kx = x + 0.25 + i * ((w - 0.5) / 3);
    s.addText(v, {
      x: kx, y: y + 0.62, w: (w - 0.5) / 3, h: 0.38,
      fontFace: DISPLAY, fontSize: 21, bold: true, color: WHITE, valign: "middle",
    });
    s.addText(l.toUpperCase(), {
      x: kx, y: y + 0.98, w: (w - 0.5) / 3, h: 0.22,
      fontFace: DISPLAY, fontSize: 8, color: DIM, charSpacing: 1.2, valign: "middle",
    });
  });
  s.addShape(pptx.ShapeType.rect, { x: x + 0.25, y: y + 1.28, w: w - 0.5, h: 0.01, fill: { color: LINE } });

  s.addText("ENGAJAMENTO POR ETAPA", {
    x: x + 0.25, y: y + 1.38, w: w - 0.5, h: 0.24,
    fontFace: DISPLAY, fontSize: 8.5, bold: true, color: DIM, charSpacing: 1.8, valign: "middle",
  });
  const bars = [42, 68, 55, 88, 74, 96];
  const bw = (w - 0.5 - 0.1 * (bars.length - 1)) / bars.length;
  const base = y + 2.72;
  bars.forEach((v, i) => {
    const bh = (v / 100) * 0.95;
    s.addShape(pptx.ShapeType.rect, {
      x: x + 0.25 + i * (bw + 0.1), y: base - bh, w: bw, h: bh,
      fill: i === bars.length - 1 ? { color: RED } : { color: GOLD, transparency: 65 - i * 8 },
    });
  });
  s.addText("Lembrança de marca · Intenção de compra", {
    x: x + 0.25, y: y + 2.76, w: w - 0.5, h: 0.24,
    fontFace: SANS, fontSize: 8, color: DIM, valign: "middle",
  });
}

function slide15Formatos() {
  const s = newSlide(
    "Três formas de executar. O formato Campanha é a recomendação: entrega desejo antes, experiência durante " +
      "e memória depois, sem o compromisso de temporada inteira.",
  );
  kicker(s, "Formatos comerciais");
  title(s, [{ text: "Três formas de " }, { text: "executar", color: RED }]);

  const formats = [
    {
      n: "Essencial",
      s: "Uma ativação forte, em um único dia.",
      items: ["Um treino especial", "Estrutura de marca", "Conteúdo", "Ultra After Run"],
    },
    {
      n: "Campanha",
      s: "Desejo antes, experiência durante, memória depois.",
      items: [
        "Aquecimento digital",
        "Ultra Balance Challenge · 21 dias",
        "Treino especial",
        "Experiência social",
        "Produção de conteúdo",
      ],
      rec: true,
    },
    {
      n: "Plataforma",
      s: "A marca vira parte do calendário da comunidade.",
      items: [
        "Temporada com 3 ou 4 encontros",
        "Desafio digital",
        "Embaixadores Somma",
        "Conteúdo contínuo",
        "Encerramento especial",
      ],
    },
  ];
  const cw = (CW - 0.5) / 3;
  formats.forEach((f, i) => {
    const x = M + i * (cw + 0.25);
    // mesma altura nos três: o destaque vem da cor, não do tamanho — assim
    // nenhuma lista de itens escapa do cartão.
    const y = 3.0;
    const h = 3.5;
    card(s, { x, y, w: cw, h, highlight: f.rec });

    if (f.rec) {
      s.addShape(pptx.ShapeType.roundRect, {
        x: x + 0.32, y: y - 0.16, w: 1.55, h: 0.32, rectRadius: 0.16, fill: { color: RED },
      });
      s.addText("RECOMENDADO", {
        x: x + 0.32, y: y - 0.16, w: 1.55, h: 0.32,
        fontFace: DISPLAY, fontSize: 9, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1.6,
      });
    }

    s.addText("FORMATO", {
      x: x + 0.34, y: y + 0.34, w: cw - 0.68, h: 0.24,
      fontFace: DISPLAY, fontSize: 9.5, bold: true, color: f.rec ? RED : GOLD, charSpacing: 2.6, valign: "middle",
    });
    s.addText(f.n.toUpperCase(), {
      x: x + 0.34, y: y + 0.58, w: cw - 0.68, h: 0.6,
      fontFace: DISPLAY, fontSize: 30, bold: true, color: WHITE, valign: "middle",
    });
    s.addText(f.s, {
      x: x + 0.34, y: y + 1.2, w: cw - 0.68, h: 0.45,
      fontFace: SANS, fontSize: 11, color: BODY, valign: "top", lineSpacingMultiple: 1.15,
    });
    s.addShape(pptx.ShapeType.rect, { x: x + 0.34, y: y + 1.75, w: cw - 0.68, h: 0.01, fill: { color: f.rec ? RED : LINE } });
    bullets(s, f.items, {
      x: x + 0.34, y: y + 1.92, w: cw - 0.68,
      color: f.rec ? RED : GOLD, textColor: f.rec ? WHITE : OFF, size: 11.5, gap: 0.3,
    });
  });
  footer(s);
}

function slide16Recomendacao() {
  const s = newSlide(
    "Nossa recomendação é o formato Campanha: ele conecta marca, comunidade, conteúdo e dados " +
      "em uma única jornada de antes, durante e depois.",
  );
  bgPhoto(s, "recomendacao.jpg");
  kicker(s, "Nossa recomendação");
  title(s, [{ text: "Formato " }, { text: "Campanha", color: RED }], { size: 50 });
  lead(
    s,
    "Porque cria desejo antes, experiência durante e memória depois — conectando marca, comunidade, conteúdo e dados em uma única jornada.",
    { y: 3.0, w: 8.8 },
  );

  const steps = [
    ["Antes", "Aquecimento digital", "Landing page, perfis, cards e o desafio de 21 dias."],
    ["Durante", "Michelob Ultra Social Run", "Treino especial, pelotões e pontos de experiência."],
    ["Depois", "Ultra After Run + conteúdo", "Convivência, recap da campanha e relatório de resultados."],
  ];
  const cw = (CW - 0.5) / 3;
  steps.forEach(([k, t, d], i) => {
    const x = M + i * (cw + 0.25);
    const hl = i === 1;
    card(s, { x, y: 4.1, w: cw, h: 2.25, highlight: hl });
    s.addText(k.toUpperCase(), {
      x: x + 0.34, y: 4.4, w: cw - 0.68, h: 0.26,
      fontFace: DISPLAY, fontSize: 10.5, bold: true, color: hl ? RED : GOLD, charSpacing: 3, valign: "middle",
    });
    s.addText(t.toUpperCase(), {
      x: x + 0.34, y: 4.72, w: cw - 0.68, h: 0.62,
      fontFace: DISPLAY, fontSize: 23, bold: true, color: WHITE, valign: "top", lineSpacingMultiple: 0.9,
    });
    s.addText(d, {
      x: x + 0.34, y: 5.42, w: cw - 0.68, h: 0.7,
      fontFace: SANS, fontSize: 11.5, color: BODY, valign: "top", lineSpacingMultiple: 1.2,
    });
  });
  footer(s);
}

function slide17Fechamento() {
  const s = newSlide(
    "Fechamento. Michelob Ultra Social Run aproxima a marca de uma comunidade real, ativa e influente. " +
      "Não é só sobre correr — é sobre viver o momento depois da linha de chegada.",
  );
  bgPhoto(s, "fechamento.jpg", "cover");

  s.addText(
    [
      { text: "VAMOS CRIAR O PONTO DE ENCONTRO\nMAIS DESEJADO DA CORRIDA EM ", options: { color: WHITE } },
      { text: "BRASÍLIA", options: { color: RED } },
    ],
    {
      x: M, y: 1.28, w: 11.3, h: 2.35,
      fontFace: DISPLAY, fontSize: 44, bold: true, valign: "top", lineSpacingMultiple: 0.9,
    },
  );

  s.addText(
    "Michelob Ultra Social Run aproxima a marca de uma comunidade real, ativa e influente.\n" +
      "Não é só sobre correr. É sobre viver o momento depois da linha de chegada.",
    {
      x: M, y: 3.75, w: 8.6, h: 0.9,
      fontFace: SANS, fontSize: 15, color: OFF, valign: "top", lineSpacingMultiple: 1.3,
    },
  );

  s.addShape(pptx.ShapeType.rect, { x: M, y: 4.85, w: 0.9, h: 0.02, fill: { color: GOLD } });

  lockup(s, M, 5.25, 0.42);

  s.addText(
    [
      { text: "Corra pelo momento. ", options: { color: WHITE } },
      { text: "Fique pela experiência.", options: { color: RED } },
    ],
    {
      x: M, y: 6.15, w: 9, h: 0.45,
      fontFace: DISPLAY, fontSize: 24, bold: true, valign: "middle", charSpacing: 1.2,
    },
  );

  s.addText("Consumo responsável. Experiência destinada ao público maior de 18 anos.", {
    x: M, y: H - 0.62, w: 9, h: 0.28,
    fontFace: SANS, fontSize: 9, color: DIM, valign: "middle",
  });
}

/* ── Build ─────────────────────────────────────────────────────────────── */

async function main() {
  pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE_16x9", width: W, height: H });
  pptx.layout = "WIDE_16x9";
  pptx.author = "Somma Club";
  pptx.company = "Somma Club";
  pptx.title = "Somma Club x Michelob Ultra · Michelob Ultra Social Run";
  pptx.subject = "Proposta de campanha — Michelob Ultra Social Run";

  slide01Capa();
  slide02Oportunidade();
  slide03Desafio();
  slide04GrandeIdeia();
  slide05SocialPace();
  slide06ComoFunciona();
  slide07Aquecimento();
  slide08Challenge();
  slide09SocialRun();
  slide10Percurso();
  slide11AfterRun();
  slide12Conteudo();
  slide13Entrega();
  slide14Indicadores();
  slide15Formatos();
  slide16Recomendacao();
  slide17Fechamento();

  const out = path.join("output", "somma-michelob-ultra-social-run.pptx");
  fs.mkdirSync("output", { recursive: true });
  await pptx.writeFile({ fileName: out });
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`✓ ${out} — ${slideNo} slides, ${kb} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
