"use client";

import { cn } from "@/lib/utils";
import { useIntencaoDePonteiro } from "./pointer";
import { opcaoBase, opcaoMarcada, opcaoRepouso } from "./styles";

interface RatingScaleProps {
  name: string;
  labels: readonly string[];
  value: number | null | undefined;
  labelledBy: string;
  describedBy?: string;
  onChange: (valor: number, viaPonteiro: boolean) => void;
}

/**
 * Escala de 1 a 5 com rótulo por ponto. Lista vertical no celular (o rótulo
 * inteiro cabe e o polegar alcança tudo), cinco colunas do `md` em diante.
 */
export function RatingScale({ name, labels, value, labelledBy, describedBy, onChange }: RatingScaleProps) {
  const ponteiro = useIntencaoDePonteiro();

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="grid gap-2 md:grid-cols-5 md:gap-2.5"
    >
      {labels.map((rotulo, i) => {
        const nota = i + 1;
        const marcada = value === nota;
        return (
          <label
            key={nota}
            onPointerDown={ponteiro.marcar}
            className={cn(
              opcaoBase,
              "min-h-[60px] items-center gap-4 px-4 py-3 md:min-h-[136px] md:flex-col md:items-start md:justify-between md:p-5",
              marcada ? opcaoMarcada : opcaoRepouso
            )}
          >
            <input
              type="radio"
              name={name}
              value={nota}
              checked={marcada}
              onChange={() => onChange(nota, ponteiro.consumir())}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={cn(
                "nps-num flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold md:h-auto md:w-auto md:justify-start md:rounded-none md:text-[34px] md:leading-none",
                marcada ? "bg-black/15 md:bg-transparent" : "bg-white/[0.08] md:bg-transparent"
              )}
            >
              {nota}
            </span>
            <span className="text-[16px] font-medium leading-snug md:text-[14px]">{rotulo}</span>
          </label>
        );
      })}
    </div>
  );
}
