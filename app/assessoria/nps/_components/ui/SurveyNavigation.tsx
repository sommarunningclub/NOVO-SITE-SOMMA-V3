"use client";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SurveyNavigationProps {
  onVoltar: () => void;
  rotulo: string;
  form: string;
  carregando?: boolean;
  /** Última pergunta: o botão ganha a cor da marca. */
  destaque?: boolean;
}

/**
 * Rodapé fixo, ao alcance do polegar. "Continuar" nunca fica desabilitado por
 * pergunta sem resposta: botão morto não explica nada, então ele valida e diz
 * o que falta. Desabilita só durante o envio, contra clique duplo.
 */
export function SurveyNavigation({ onVoltar, rotulo, form, carregando, destaque }: SurveyNavigationProps) {
  return (
    // A faixa em degradê não captura toque: a última alternativa, meio coberta
    // por ela, continua clicável. Só a linha dos botões recebe ponteiro.
    <div className="pointer-events-none sticky bottom-0 z-20 bg-gradient-to-t from-[#0b0b0c] from-60% to-transparent px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-6 sm:px-8 lg:px-16 lg:pb-10 xl:px-24">
      <div className="pointer-events-auto flex max-w-[760px] items-center gap-3">
        <button
          type="button"
          onClick={onVoltar}
          disabled={carregando}
          aria-label="Voltar para a etapa anterior"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[#f5f5f4] transition hover:bg-white/[0.12] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:active:scale-100"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <button
          type="submit"
          form={form}
          disabled={carregando}
          aria-busy={carregando || undefined}
          className={cn(
            "flex h-14 flex-1 items-center justify-center gap-2 rounded-full px-7 text-[16px] font-semibold transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 motion-reduce:active:scale-100 sm:flex-none sm:min-w-[240px]",
            destaque ? "bg-[#ff2c04] text-[#0b0b0c] hover:bg-[#ff4a26]" : "bg-[#f5f5f4] text-[#0b0b0c] hover:bg-white"
          )}
        >
          {carregando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Enviando…
            </>
          ) : (
            <>
              {rotulo}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>

        <span className="hidden text-[13px] text-white/55 lg:inline">
          ou <kbd className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-sans text-[12px] text-white/80">Enter ↵</kbd>
        </span>
      </div>
    </div>
  );
}
