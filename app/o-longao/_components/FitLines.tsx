import type { CSSProperties } from "react";

/**
 * Linhas de headline que se dimensionam pelo próprio comprimento.
 *
 * Cada linha vira uma janela `.lgo-mask` (para o reveal do GSAP) e informa ao
 * CSS quantos caracteres tem, via `--len`. O tamanho da fonte sai daí — uma
 * linha curta cresce, uma longa encolhe, e nenhuma transborda. Ver `.lgo-fit`
 * em evento.css.
 */
export interface FitLinesProps {
  linhas: readonly (string | { texto: string; style?: CSSProperties; className?: string })[];
  /** Classe extra em cada janela — é o gancho que o GSAP usa para animar. */
  maskClass?: string;
  className?: string;
  /** Teto do tamanho em telas largas (padrão 9.5rem). */
  max?: string;
  /** Piso do tamanho em telas estreitas (padrão 1.05rem). */
  min?: string;
  /**
   * Largura disponível, quando a headline não ocupa o wrap inteiro.
   * Ex.: numa coluna de 7/12 → "calc((min(1440px, 100vw) - 2 * var(--gutter)) * 0.58)".
   */
  avail?: string;
}

export function FitLines({ linhas, maskClass = "", className = "", max, min, avail }: FitLinesProps) {
  const vars = {
    ...(max ? { "--fit-max": max } : {}),
    ...(min ? { "--fit-min": min } : {}),
    ...(avail ? { "--avail": avail } : {}),
  } as CSSProperties;

  return (
    <span className={`lgo-display block ${className}`} style={vars}>
      {linhas.map((linha, i) => {
        const texto = typeof linha === "string" ? linha : linha.texto;
        const extra = typeof linha === "string" ? undefined : linha;
        return (
          <span
            key={`${texto}-${i}`}
            className={`lgo-mask lgo-fit ${maskClass} ${extra?.className ?? ""}`}
            style={{ ["--len" as string]: texto.length, ...extra?.style }}
          >
            <span>{texto}</span>
          </span>
        );
      })}
    </span>
  );
}
