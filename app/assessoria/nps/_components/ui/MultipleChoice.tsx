"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Option } from "@/lib/assessoria-nps/survey";
import { opcaoBase, opcaoRepouso } from "./styles";

interface MultipleChoiceProps {
  name: string;
  options: readonly Option[];
  values: readonly string[];
  labelledBy: string;
  describedBy?: string;
  onChange: (valores: string[]) => void;
  colunas?: 1 | 2 | 3;
  children?: ReactNode;
}

/**
 * Várias respostas. Marcado aqui é laranja translúcido, não sólido: com três
 * ou quatro opções marcadas, o laranja cheio viraria uma parede de cor.
 */
export function MultipleChoice({
  name,
  options,
  values,
  labelledBy,
  describedBy,
  onChange,
  colunas = 2,
  children,
}: MultipleChoiceProps) {
  const marcados = new Set(values);

  function alternar(valor: string) {
    const proximo = new Set(marcados);
    if (proximo.has(valor)) proximo.delete(valor);
    else proximo.add(valor);
    // Ordem da tela, sempre: o mesmo conjunto grava igual.
    onChange(options.map((o) => o.value).filter((v) => proximo.has(v)));
  }

  return (
    <div>
      <div
        role="group"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={cn("grid gap-2", colunas === 2 && "md:grid-cols-2", colunas === 3 && "sm:grid-cols-3")}
      >
        {options.map((o) => {
          const marcado = marcados.has(o.value);
          return (
            <label
              key={o.value}
              className={cn(
                opcaoBase,
                "min-h-[60px] items-center gap-4 px-5 py-3.5",
                marcado ? "bg-[#ff2c04]/[0.16] text-[#f5f5f4] hover:bg-[#ff2c04]/[0.22]" : opcaoRepouso
              )}
            >
              <input
                type="checkbox"
                name={name}
                value={o.value}
                checked={marcado}
                onChange={() => alternar(o.value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors",
                  marcado ? "bg-[#ff2c04] text-[#0b0b0c]" : "bg-white/[0.1]"
                )}
              >
                {marcado && <Check className="h-4 w-4" strokeWidth={3} />}
              </span>
              <span className="text-[16px] font-medium leading-snug">{o.label}</span>
            </label>
          );
        })}
      </div>
      {children}
    </div>
  );
}
