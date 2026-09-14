"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { campoTexto } from "./styles";

interface OpenTextProps {
  id: string;
  value: string | null | undefined;
  onChange: (valor: string) => void;
  maxLength: number;
  placeholder: string;
  variant: "short" | "long";
  labelledBy?: string;
  describedBy?: string;
  invalido?: boolean;
  autoFocus?: boolean;
}

/** Resposta aberta. O contador só aparece perto do limite: antes disso é ruído. */
export function OpenText({
  id,
  value,
  onChange,
  maxLength,
  placeholder,
  variant,
  labelledBy,
  describedBy,
  invalido,
  autoFocus,
}: OpenTextProps) {
  const texto = value ?? "";
  const area = useRef<HTMLTextAreaElement>(null);
  const contadorId = `${id}-contador`;
  const pertoDoLimite = texto.length >= Math.floor(maxLength * 0.8);
  const descritores = [describedBy, pertoDoLimite ? contadorId : null].filter(Boolean).join(" ") || undefined;

  // Cresce com o texto até metade da tela; dali em diante, rola.
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, Math.round(window.innerHeight * 0.5))}px`;
  }, [texto]);

  const contador = pertoDoLimite ? (
    <span id={contadorId} aria-live="polite" className="nps-num ml-auto">
      {texto.length}/{maxLength}
    </span>
  ) : null;

  if (variant === "short") {
    return (
      <div>
        <input
          id={id}
          type="text"
          value={texto}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-labelledby={labelledBy}
          aria-describedby={descritores}
          aria-invalid={invalido || undefined}
          autoComplete="off"
          autoCapitalize="sentences"
          enterKeyHint="next"
          autoFocus={autoFocus}
          className={cn(campoTexto, "h-14")}
        />
        {contador && <div className="mt-2 flex text-[13px] text-white/55">{contador}</div>}
      </div>
    );
  }

  return (
    <div>
      <textarea
        ref={area}
        id={id}
        value={texto}
        rows={4}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-labelledby={labelledBy}
        aria-describedby={descritores}
        aria-invalid={invalido || undefined}
        autoCapitalize="sentences"
        autoFocus={autoFocus}
        className={cn(campoTexto, "block min-h-[148px] resize-none py-4 leading-relaxed")}
      />
      <div className="mt-2 flex items-center text-[13px] text-white/55">
        <span className="hidden lg:inline">Ctrl ou ⌘ + Enter para continuar</span>
        {contador}
      </div>
    </div>
  );
}
