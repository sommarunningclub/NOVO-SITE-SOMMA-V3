"use client";

import type { CSSProperties } from "react";
import {
  LINE_VIEWBOX,
  drawLine,
  lineShape,
  morphLine,
  pathFromPoints,
  useScope,
  type LineVariant,
} from "../_motion";

/**
 * A LINHA — o elemento gráfico do evento.
 *
 * É sempre o mesmo traço, e ele muda de significado conforme a página avança:
 * traçado de rua na corrida, gráfico de pace na comparação, encontro de duas
 * pontas na conexão, waveform no set do DJ. Um sistema visual único no lugar de
 * quatro ilustrações diferentes — RUN → CONNECT → STAY em um só desenho.
 *
 * Dois modos:
 * — `desenhar`: o traço se escreve conforme o scroll (usado nas entradas);
 * — `de`/`para`: a forma se transforma na outra, dirigida por scroll.
 */
export function SignatureLine({
  de,
  para,
  cor = "var(--somma)",
  espessura = 2,
  altura = "clamp(80px, 18vw, 200px)",
  desenhar = false,
  opacidade = 1,
  className = "",
  scrub = 0.6,
  start = "top 85%",
  end = "bottom 30%",
}: {
  de: LineVariant;
  para?: LineVariant;
  cor?: string;
  espessura?: number;
  altura?: string;
  desenhar?: boolean;
  opacidade?: number;
  className?: string;
  scrub?: number;
  start?: string;
  end?: string;
}) {
  const root = useScope<HTMLDivElement>(({ root }) => {
    const path = root.querySelector<SVGPathElement>("path");
    if (!path) return;

    if (desenhar) {
      drawLine(path, root, { start, end, scrub });
      return;
    }

    if (para && para !== de) {
      morphLine(path, de, para, { trigger: root, start, end, scrub });
    }
  });

  return (
    <div
      ref={root}
      className={`w-full ${className}`}
      style={{ height: altura, opacity: opacidade } as CSSProperties}
      aria-hidden
    >
      <svg
        viewBox={LINE_VIEWBOX}
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
      >
        <path
          className="ris-line-path"
          d={pathFromPoints(lineShape(de))}
          stroke={cor}
          strokeWidth={espessura}
        />
      </svg>
    </div>
  );
}
