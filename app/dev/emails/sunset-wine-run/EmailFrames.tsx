"use client";

import { useState } from "react";

/**
 * As larguras não são redondas por gosto: 390px é o viewport de um iPhone 14/15,
 * e 600px é a largura da tabela do e-mail, que é o máximo que o Gmail web mostra.
 * É nessas duas que a media query do template (max-width:620px) muda de lado, e
 * portanto as duas únicas que precisam ser revisadas.
 */
const FRAMES = [
  { id: "mobile", label: "Celular", hint: "390px · media query ativa", width: 390 },
  { id: "desktop", label: "Desktop", hint: "600px · layout cheio", width: 600 },
] as const;

type FrameId = (typeof FRAMES)[number]["id"];

export function EmailFrames({ html, altura = 1500 }: { html: string; altura?: number }) {
  const [ativo, setAtivo] = useState<FrameId | "ambos">("ambos");
  const visiveis = ativo === "ambos" ? FRAMES : FRAMES.filter((f) => f.id === ativo);

  const botao = (id: FrameId | "ambos", texto: string) => {
    const on = ativo === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setAtivo(id)}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          on
            ? "bg-[#ff2c03] text-white"
            : "border border-zinc-300 bg-white text-zinc-700 hover:border-[#ff2c03]"
        }`}
      >
        {texto}
      </button>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {botao("ambos", "Os dois")}
        {FRAMES.map((f) => botao(f.id, f.label))}
      </div>

      <div className={`mt-6 grid items-start gap-8 ${visiveis.length > 1 ? "xl:grid-cols-2" : ""}`}>
        {visiveis.map((frame) => (
          <figure key={frame.id} className="min-w-0">
            <figcaption className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#ff2c03]">
                {frame.label}
              </span>
              <span className="text-xs text-zinc-500">{frame.hint}</span>
            </figcaption>
            {/*
              overflow-x-auto no lugar de encolher o iframe: o ponto do preview é
              ver o e-mail na largura real. Um iframe reduzido por CSS mentiria
              sobre onde o texto quebra.
            */}
            <div
              className="overflow-x-auto border border-zinc-300 bg-[#08080a]"
              style={{ margin: visiveis.length === 1 ? "0 auto" : undefined, maxWidth: "100%" }}
            >
              <iframe
                title={`Preview ${frame.label}`}
                srcDoc={html}
                sandbox=""
                className="block bg-[#08080a]"
                style={{ width: frame.width, height: altura, border: 0 }}
              />
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}
