"use client";

import { DATA_EXTENSO, EVENTO_NOME, HORARIO, LOCAL_CORRE } from "@/lib/dexcomplica-love-run/event.config";

/**
 * O ingresso como imagem 1080×1920 (tamanho de stories: fica bem na galeria
 * e abre em tela cheia no balcão). Desenhado em canvas no próprio aparelho,
 * com o MESMO SVG do QR da tela, rasterizado em 680 px: sobra resolução para
 * qualquer leitor.
 */
const W = 1080;
const H = 1920;

function carregar(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = erro;
    img.src = src;
  });
}

function familia(variavel: string, reserva: string): string {
  const raiz = document.querySelector(".lr-root") ?? document.documentElement;
  const v = getComputedStyle(raiz).getPropertyValue(variavel).trim();
  return v ? `${v}, ${reserva}` : reserva;
}

function caber(ctx: CanvasRenderingContext2D, texto: string, fonte: (px: number) => string, max: number, inicial: number) {
  let px = inicial;
  ctx.font = fonte(px);
  while (ctx.measureText(texto).width > max && px > 28) {
    px -= 2;
    ctx.font = fonte(px);
  }
  return px;
}

function retangulo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

export async function desenharIngresso(d: {
  nome: string;
  pelotao: string | null;
  codigo: string;
  svgQr: string;
}): Promise<Blob> {
  await document.fonts.ready;
  const display = familia("--lr-display", "Impact, sans-serif");
  const copy = familia("--lr-copy", "Arial, sans-serif");
  const fun = familia("--lr-fun", "Arial Black, sans-serif");

  const svg = d.svgQr.includes("xmlns=") ? d.svgQr : d.svgQr.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  const [logo, qr] = await Promise.all([
    carregar("/dexcomplica-love-run/marca/dex-logo.png"),
    carregar(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/width="100%" height="100%"/, 'width="680" height="680"'))}`),
  ]);

  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");

  ctx.fillStyle = "#0E0E0E";
  ctx.fillRect(0, 0, W, H);

  // Passe
  const px = 70, py = 90, pw = W - 140, ph = H - 180;
  ctx.fillStyle = "#ffffff";
  retangulo(ctx, px, py, pw, ph, 44);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(px, py, pw, 400, [44, 44, 0, 0]);
  ctx.clip();
  ctx.fillStyle = "#E73A28";
  ctx.fillRect(px, py, pw, 400);
  ctx.restore();

  const lw = 560;
  ctx.drawImage(logo, (W - lw) / 2, py + 56, lw, (logo.height / logo.width) * lw);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = `130px ${display}`;
  ctx.fillText("LOVE RUN", W / 2, py + 318);
  ctx.font = `600 30px ${copy}`;
  ctx.fillText("SOMMA CLUB × DEXCOMPLICA · PRODUÇÃO MONU", W / 2, py + 368);

  // Dados
  ctx.textAlign = "left";
  const x = px + 70;
  ctx.fillStyle = "#6F6A64";
  ctx.font = `700 26px ${copy}`;
  ctx.fillText("PARTICIPANTE", x, py + 476);
  ctx.fillStyle = "#0E0E0E";
  const tam = caber(ctx, d.nome.toUpperCase(), (n) => `${n}px ${display}`, pw - 140, 78);
  ctx.font = `${tam}px ${display}`;
  ctx.fillText(d.nome.toUpperCase(), x, py + 476 + tam + 6);

  const linhas: [string, string][] = [
    ["DATA", DATA_EXTENSO + (HORARIO.concentracao ? ` · ${HORARIO.concentracao}` : "")],
    ["LOCAL", LOCAL_CORRE.nome],
    ["PELOTÃO", d.pelotao ?? "—"],
  ];
  let y = py + 640;
  for (const [rot, val] of linhas) {
    ctx.fillStyle = "#6F6A64";
    ctx.font = `700 24px ${copy}`;
    ctx.fillText(rot, x, y);
    ctx.fillStyle = "#0E0E0E";
    ctx.font = `700 38px ${copy}`;
    ctx.fillText(val, x, y + 46);
    y += 100;
  }

  // Picote
  const yp = py + 950;
  ctx.fillStyle = "#0E0E0E";
  ctx.beginPath();
  ctx.arc(px, yp, 34, 0, Math.PI * 2);
  ctx.arc(px + pw, yp, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#CFC8BF";
  ctx.setLineDash([16, 14]);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(px + 50, yp);
  ctx.lineTo(px + pw - 50, yp);
  ctx.stroke();
  ctx.setLineDash([]);

  // QR, sobre branco puro e com zona de silêncio
  const q = 520;
  ctx.drawImage(qr, (W - q) / 2, yp + 52, q, q);
  ctx.textAlign = "center";
  ctx.fillStyle = "#6F6A64";
  ctx.font = `700 24px ${copy}`;
  ctx.fillText("CÓDIGO DE CHECK-IN", W / 2, yp + 622);
  ctx.fillStyle = "#0E0E0E";
  ctx.font = `64px ${fun}`;
  ctx.fillText(d.codigo, W / 2, yp + 694);
  ctx.fillStyle = "#3a3632";
  ctx.font = `500 28px ${copy}`;
  ctx.fillText("Apresente este QR Code no check-in.", W / 2, yp + 744);

  ctx.fillStyle = "#E73A28";
  ctx.font = `30px ${fun}`;
  ctx.fillText("Desapega, desilude... Dexcomplica!", W / 2, H - 32);

  return new Promise((ok, erro) =>
    c.toBlob((b) => (b ? ok(b) : erro(new Error(`${EVENTO_NOME}: falha ao gerar PNG`))), "image/png")
  );
}
