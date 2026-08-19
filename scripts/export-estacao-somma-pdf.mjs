/**
 * Captura o deck Estação SOMMA (SOMMA Club + Evolve) e gera um PDF 16:9.
 *
 *   node scripts/export-estacao-somma-pdf.mjs
 *   → output/estacao-somma-apresentacao-evolve-2026.pdf
 *
 * Variáveis opcionais: ESTACAO_SOMMA_URL (padrão: produção) e
 * PPT_ESTACAO_SOMMA_CODE (código de acesso do deck).
 */
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";

const SITE = (process.env.ESTACAO_SOMMA_URL || "https://sommaclub.com.br/ppt-estacao-somma") + "?qr=prod";
const CODE = process.env.PPT_ESTACAO_SOMMA_CODE || "101010";
const OUT_DIR = path.join(process.cwd(), "output");
const OUT_FILE = path.join(OUT_DIR, "estacao-somma-apresentacao-evolve-2026.pdf");

const VIEWPORT = { width: 1920, height: 1080 };
const PAGE_W = 13.333 * 72;
const PAGE_H = 7.5 * 72;

const SLIDES = [
  "capa",
  "oportunidade",
  "movimento",
  "dados",
  "espaco",
  "localizacao",
  "premissa",
  "conceito",
  "nova-casa",
  "somma-quer",
  "papel-evolve",
  "performance",
  "recovery",
  "lockers",
  "aulas",
  "digital",
  "sistema",
  "cafe",
  "marcas",
  "beneficios",
  "evolve-plus",
  "somma-evolve",
  "ciclo",
  "receitas",
  "porque",
  "visao",
  "quatro-maos",
  "proximos-passos",
  "encerramento",
];

async function waitImages(page, root) {
  await page.evaluate(async (sel) => {
    const scope = sel ? document.querySelector(sel) : document;
    if (!scope) return;
    const imgs = [...scope.querySelectorAll("img")];
    await Promise.race([
      Promise.all(
        imgs.map((img) => {
          if (img.complete) return;
          img.loading = "eager";
          return new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          });
        }),
      ),
      new Promise((resolve) => setTimeout(resolve, 4000)),
    ]);
  }, root);
}

async function prepareDeck(page) {
  await page.addStyleTag({
    content: `
      .fixed, nextjs-portal { display: none !important; }
      .a-mask > *, .a-up, .a-rail, [data-sat], [data-centro] {
        transform: none !important;
        opacity: 1 !important;
        visibility: visible !important;
        animation: none !important;
      }
      [data-slide] {
        min-height: 100vh !important;
        height: 100vh !important;
        max-height: 100vh !important;
        overflow: hidden !important;
      }
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });

  await page.evaluate(() => {
    const gsap = window.gsap;
    if (gsap?.globalTimeline) gsap.globalTimeline.clear();
    const ST = window.ScrollTrigger;
    if (ST?.getAll) ST.getAll().forEach((t) => t.kill());
  });

  await page.evaluate(() => document.fonts.ready);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-web-security", "--font-render-hinting=none"],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1.5,
    colorScheme: "dark",
  });

  const page = await context.newPage();
  page.setDefaultTimeout(45_000);

  console.log("Abrindo", SITE);
  await page.goto(SITE, { waitUntil: "load" });

  if (await page.locator("#codigo").count()) {
    console.log("Autenticando…");
    const status = await page.evaluate(async (code) => {
      const r = await fetch("/api/ppt-estacao-somma/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: code }),
      });
      return r.status;
    }, CODE);
    if (status !== 200) throw new Error(`Falha no código de acesso (${status}).`);
    await page.reload({ waitUntil: "load" });
  }

  await page.waitForSelector('[data-slide="capa"]', { timeout: 60_000 });
  console.log("Deck carregado.");
  await prepareDeck(page);
  console.log(`Capturando ${SLIDES.length} slides…`);

  const pdf = await PDFDocument.create();
  pdf.setTitle("Estação SOMMA · Café, Cultura e Movimento · powered by Evolve");
  pdf.setAuthor("SOMMA Club");
  pdf.setSubject("Apresentação executiva para a diretoria da Evolve");
  pdf.setCreator("SOMMA Club");
  pdf.setLanguage("pt-BR");

  for (let i = 0; i < SLIDES.length; i++) {
    const name = SLIDES[i];
    const n = String(i + 1).padStart(2, "0");
    process.stdout.write(`  Slide ${n}/${SLIDES.length} · ${name}… `);

    const slide = page.locator(`[data-slide="${name}"]`);
    await slide.evaluate((el) => {
      el.scrollIntoView({ block: "start", inline: "nearest" });
    });
    // A localização precisa de tempo para os tiles de satélite chegarem.
    await page.waitForTimeout(name === "localizacao" ? 12000 : 250);
    await waitImages(page, `[data-slide="${name}"]`);
    await page.waitForTimeout(150);

    const jpeg = await page.screenshot({
      type: "jpeg",
      quality: 86,
      clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
    });

    // O mapa 3D continua renderizando depois de capturado e pesa nas capturas
    // seguintes: some com ele assim que o slide da localização está no PDF.
    if (name === "localizacao") {
      await page.evaluate(() => document.querySelector("gmp-map-3d")?.remove());
    }

    const image = await pdf.embedJpg(jpeg);
    const p = pdf.addPage([PAGE_W, PAGE_H]);
    p.drawImage(image, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
    console.log("ok");
  }

  const bytes = await pdf.save({ useObjectStreams: true });
  fs.writeFileSync(OUT_FILE, bytes);
  await browser.close();

  const mb = (bytes.length / (1024 * 1024)).toFixed(1);
  console.log(`\nPDF gerado: ${OUT_FILE} (${mb} MB, ${SLIDES.length} slides)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
