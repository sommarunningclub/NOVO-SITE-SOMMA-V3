"use client";

import { useEffect, useRef, useState } from "react";
import { FOTO_MAX_BYTES } from "@/lib/vem-correr-comigo/regras";

const LADO = 260;
const SAIDA = 640;

/**
 * Escolher, enquadrar e recortar quadrado, tudo no aparelho. O recorte sai por
 * canvas em 640 px: fica leve para os cartões e não leva localização nem outros
 * metadados da foto original.
 */
export default function FotoPerfil({ atual, onPronta }: { atual: string | null; onPronta: (b: Blob | null) => void }) {
  const [origem, setOrigem] = useState<string | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [erro, setErro] = useState("");
  const img = useRef<HTMLImageElement | null>(null);
  const arraste = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => () => { if (origem) URL.revokeObjectURL(origem); }, [origem]);

  function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return setErro("Use uma foto em JPEG, PNG ou WebP.");
    if (f.size > 15 * 1024 * 1024) return setErro("Essa foto é grande demais. Escolha outra.");
    setErro("");
    setZoom(1);
    setPos({ x: 0, y: 0 });
    setOrigem(URL.createObjectURL(f));
  }

  const base = () => {
    const i = img.current;
    if (!i) return { w: LADO, h: LADO };
    const k = LADO / Math.min(i.naturalWidth, i.naturalHeight);
    return { w: i.naturalWidth * k, h: i.naturalHeight * k };
  };
  const limitar = (x: number, y: number, z = zoom) => {
    const { w, h } = base();
    const mx = Math.max(0, (w * z - LADO) / 2);
    const my = Math.max(0, (h * z - LADO) / 2);
    return { x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) };
  };

  async function confirmar() {
    const i = img.current;
    if (!i) return;
    const { w, h } = base();
    const c = document.createElement("canvas");
    c.width = c.height = SAIDA;
    const ctx = c.getContext("2d");
    if (!ctx) return setErro("Não conseguimos ajustar essa foto.");
    const k = SAIDA / LADO;
    const dw = w * zoom * k;
    const dh = h * zoom * k;
    ctx.fillStyle = "#0e0e0e";
    ctx.fillRect(0, 0, SAIDA, SAIDA);
    ctx.drawImage(i, (SAIDA - dw) / 2 + pos.x * k, (SAIDA - dh) / 2 + pos.y * k, dw, dh);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85));
    if (!blob || blob.size > FOTO_MAX_BYTES) return setErro("Não conseguimos ajustar essa foto.");
    setPrevia(URL.createObjectURL(blob));
    onPronta(blob);
    setOrigem(null);
  }

  const { w, h } = base();
  const mostrar = previa ?? atual;

  return (
    <div className="cr-foto">
      {origem ? (
        <div className="cr-foto__editor" key="editor">
          <div
            className="cr-foto__janela"
            style={{ width: LADO, height: LADO }}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              arraste.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
            }}
            onPointerMove={(e) => {
              const a = arraste.current;
              if (a) setPos(limitar(a.px + e.clientX - a.x, a.py + e.clientY - a.y));
            }}
            onPointerUp={() => { arraste.current = null; }}
            onPointerCancel={() => { arraste.current = null; }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={img}
              src={origem}
              alt="Foto escolhida"
              draggable={false}
              onLoad={() => setPos({ x: 0, y: 0 })}
              style={{ width: w * zoom, height: h * zoom, transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }}
            />
          </div>
          <label className="cr-foto__zoom">
            <span>Zoom</span>
            <input
              type="range" min={1} max={3} step={0.01} value={zoom}
              onChange={(e) => { const z = Number(e.target.value); setZoom(z); setPos((p) => limitar(p.x, p.y, z)); }}
            />
          </label>
          <div className="cr-linha">
            <button type="button" className="lr-btn lr-btn--amarelo lr-btn--p" onClick={confirmar}>Usar esta foto</button>
            <button type="button" className="cr-link" onClick={() => setOrigem(null)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="cr-foto__atual" key="atual">
          <span className="cr-avatar cr-avatar--g">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {mostrar ? <img src={mostrar} alt="Sua foto" /> : <span aria-hidden="true">♥</span>}
          </span>
          <label className="lr-btn lr-btn--branco lr-btn--p cr-foto__botao">
            {mostrar ? "Trocar foto" : "Escolher foto"}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={escolher} />
          </label>
        </div>
      )}
      {erro ? <p className="cr-erro" role="alert">{erro}</p> : null}
    </div>
  );
}
