"use client";

import { AlertCircle, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MensagemDaTelaProps {
  id: string;
  texto: string | null;
  tipo: "erro" | "incentivo";
}

/**
 * Erro diz o que falta (vermelho, `role=alert`). Incentivo é um pedido gentil
 * (neutro, `role=status`): não é erro, e não pode parecer.
 */
export function MensagemDaTela({ id, texto, tipo }: MensagemDaTelaProps) {
  if (!texto) return null;
  const Icone = tipo === "erro" ? AlertCircle : MessageCircle;

  return (
    <p
      id={id}
      role={tipo === "erro" ? "alert" : "status"}
      className={cn(
        "mt-5 flex items-start gap-2.5 text-[15px] leading-snug",
        tipo === "erro" ? "text-[#ff6a4d]" : "text-white/80"
      )}
    >
      <Icone className="mt-[3px] h-4 w-4 shrink-0" aria-hidden="true" />
      {texto}
    </p>
  );
}
