"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Option } from "@/lib/assessoria-nps/survey";
import { useIntencaoDePonteiro } from "./pointer";
import { opcaoBase, opcaoMarcada, opcaoRepouso } from "./styles";

interface SingleChoiceProps {
  name: string;
  options: readonly Option[];
  value: string | null | undefined;
  labelledBy: string;
  describedBy?: string;
  onChange: (valor: string, viaPonteiro: boolean) => void;
  /** Follow-up (ex.: campo "Outro"), desenhado logo abaixo das alternativas. */
  children?: ReactNode;
}

export function SingleChoice({ name, options, value, labelledBy, describedBy, onChange, children }: SingleChoiceProps) {
  const ponteiro = useIntencaoDePonteiro();

  return (
    <div>
      <div role="radiogroup" aria-labelledby={labelledBy} aria-describedby={describedBy} className="grid gap-2">
        {options.map((o) => {
          const marcada = value === o.value;
          return (
            <label
              key={o.value}
              onPointerDown={ponteiro.marcar}
              className={cn(
                opcaoBase,
                "min-h-[60px] items-center justify-between gap-4 px-5 py-3.5",
                marcada ? opcaoMarcada : opcaoRepouso
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={marcada}
                onChange={() => onChange(o.value, ponteiro.consumir())}
                className="sr-only"
              />
              <span className="text-[16px] font-medium leading-snug">{o.label}</span>
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full transition-colors",
                  marcada ? "bg-[#0b0b0c]" : "ring-2 ring-inset ring-white/25"
                )}
              >
                {marcada && <span className="h-2 w-2 rounded-full bg-[#ff2c04]" />}
              </span>
            </label>
          );
        })}
      </div>
      {children}
    </div>
  );
}
