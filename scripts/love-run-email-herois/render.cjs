/**
 * Gera as aberturas dos e-mails do Love Run (1200 px, exibidas a 600).
 *   NODE_PATH=$HOME/.npm/_npx/e41f203b7505f1fb/node_modules node scripts/love-run-email-herois/render.cjs
 * Saída: public/dexcomplica-love-run/email/<id>.jpg (precisa de rede: Google Fonts).
 */
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const path = require("path");
const HEROIS = [
  { id: "confirmacao", foto: "corre-megafone.jpg", t: "Você está|dentro.", s: "Sáb · 07.11|Inscrição confirmada" },
  { id: "reenvio", foto: "corre-aquecimento.jpg", t: "Seu|ingresso.", s: "Sáb · 07.11|Guarda bem" },
  { id: "informacoes", foto: "corre-trio.jpg", t: "Tá tudo|confirmado.", s: "Sáb · 07.11|Salva aí", tam: 170 },
  { id: "vespera", foto: "corre-pelotao.jpg", t: "É|amanhã!", s: "Sáb · 07.11|Separa o tênis" },
  { id: "pos-corre", foto: "dex-mascote-abraco.jpg", t: "Obrigado|por correr.", s: "Só pra quem foi|Festa Dexcomplica", tam: 168 },
];
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage({ viewport: { width: 1200, height: 1100 } });
  const raiz = path.join(__dirname, "../..");
  for (const h of HEROIS) {
    const q = new URLSearchParams({ foto: h.foto, t: h.t, s: h.s, ...(h.tam ? { tam: String(h.tam) } : {}) });
    await p.goto(`file://${__dirname}/heroi.html?${q}`, { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    const png = path.join(raiz, `public/dexcomplica-love-run/email/${h.id}.png`);
    await p.screenshot({ path: png });
    execFileSync("python3", ["-c", `from PIL import Image;import os;i=Image.open('${png}').convert('RGB');i.save('${png.replace(".png", ".jpg")}',quality=80,optimize=True,progressive=True);os.remove('${png}')`]);
    console.log(h.id);
  }
  await b.close();
})();
