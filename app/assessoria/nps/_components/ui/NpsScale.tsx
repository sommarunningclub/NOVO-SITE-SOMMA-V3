"use client";

import { cn } from "@/lib/utils";
import { useIntencaoDePonteiro } from "./pointer";
import { opcaoBase, opcaoMarcada, opcaoRepouso } from "./styles";

interface NpsScaleProps {
  name: string;
  value: number | null | undefined;
  minLabel: string;
  maxLabel: string;
  labelledBy: string;
  describedBy?: string;
  onChange: (valor: number, viaPonteiro: boolean) => void;
}

/**
 * Escala de 0 a 10. No celular vira teclado de duas linhas (0 a 5 em cima, 6 a
 * 10 centralizado embaixo): onze botões numa linha só ficariam com menos de
 * 30px de largura, pequenos demais para o polegar. Do `sm` em diante, uma linha.
 */
export function NpsScale({ name, value, minLabel, maxLabel, labelledBy, describedBy, onChange }: NpsScaleProps) {
  const ponteiro = useIntencaoDePonteiro();

  return (
    <div>
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className="grid grid-cols-12 gap-2 sm:grid-cols-11 sm:gap-2.5"
      >
        {Array.from({ length: 11 }, (_, nota) => {
          const marcada = value === nota;
          return (
            <label
              key={nota}
              onPointerDown={ponteiro.marcar}
              className={cn(
                opcaoBase,
                "col-span-2 h-14 items-center justify-center sm:col-span-1 sm:h-[72px]",
                nota === 6 && "col-start-2 sm:col-start-auto",
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
              <span className="nps-num text-lg font-semibold sm:text-xl">{nota}</span>
              {nota === 0 && <span className="sr-only">, {minLabel}</span>}
              {nota === 10 && <span className="sr-only">, {maxLabel}</span>}
            </label>
          );
        })}
      </div>
      <div aria-hidden="true" className="mt-3 flex justify-between gap-4 text-[13px] text-white/55">
        <span>0 · {minLabel}</span>
        <span className="text-right">10 · {maxLabel}</span>
      </div>
    </div>
  );
}
