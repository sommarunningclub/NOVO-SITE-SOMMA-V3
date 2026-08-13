"use client";

import { useState } from "react";

const FRAMES = [
  { id: "mobile", label: "Celular", hint: "390px · Gmail / Apple Mail", width: 390 },
  { id: "desktop", label: "Inbox", hint: "560px · Gmail web", width: 560 },
] as const;

type FrameId = (typeof FRAMES)[number]["id"];

export function EmailPreviewFrames({ html }: { html: string }) {
  const [ativo, setAtivo] = useState<FrameId | "ambos">("ambos");

  const visiveis = ativo === "ambos" ? FRAMES : FRAMES.filter((f) => f.id === ativo);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAtivo("ambos")}
          className="dst-label px-3 py-2"
          style={{
            background: ativo === "ambos" ? "var(--somma)" : "transparent",
            color: ativo === "ambos" ? "var(--ink)" : "var(--paper)",
            outline: "1px solid var(--line)",
          }}
        >
          Os dois
        </button>
        {FRAMES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setAtivo(f.id)}
            className="dst-label px-3 py-2"
            style={{
              background: ativo === f.id ? "var(--somma)" : "transparent",
              color: ativo === f.id ? "var(--ink)" : "var(--paper)",
              outline: "1px solid var(--line)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div
        className={`mt-8 grid items-start gap-10 ${
          visiveis.length > 1 ? "lg:grid-cols-2" : ""
        }`}
      >
        {visiveis.map((frame) => (
          <figure key={frame.id} className="min-w-0">
            <figcaption className="mb-3 flex items-baseline justify-between gap-3">
              <span className="dst-label" style={{ color: "var(--somma)" }}>
                {frame.label}
              </span>
              <span className="dst-label text-[color:rgba(242,240,236,0.4)]">{frame.hint}</span>
            </figcaption>
            <div
              className="overflow-x-auto bg-[#08080a]"
              style={{
                outline: "1px solid var(--line)",
                margin: visiveis.length === 1 ? "0 auto" : undefined,
                maxWidth: "100%",
              }}
            >
              <iframe
                title={`Preview ${frame.label}`}
                srcDoc={html}
                sandbox=""
                className="block bg-[#08080a]"
                style={{
                  width: frame.width,
                  height: 1320,
                  border: 0,
                }}
              />
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}
