"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, RotateCcw } from "lucide-react";

export type VarianteStatus = "enviado" | "ja-respondeu" | "encerrada" | "indisponivel";

const CONTEUDO: Record<VarianteStatus, { eyebrow: string; titulo: string; texto: string }> = {
  enviado: {
    eyebrow: "Pesquisa enviada",
    titulo: "Obrigado por ajudar a construir a próxima fase da Assessoria Somma.",
    texto: "Suas respostas foram registradas.",
  },
  "ja-respondeu": {
    eyebrow: "Tudo certo",
    titulo: "Você já respondeu esta rodada da pesquisa.",
    texto: "Suas respostas já estão com a gente. Obrigado por participar.",
  },
  encerrada: {
    eyebrow: "Pesquisa encerrada",
    titulo: "Esta rodada da pesquisa foi encerrada.",
    texto: "Obrigado pelo interesse. Avisamos no grupo da assessoria quando abrir a próxima.",
  },
  indisponivel: {
    eyebrow: "Instabilidade",
    titulo: "Não conseguimos abrir a pesquisa agora.",
    texto: "Tente de novo em alguns minutos. Se continuar, fale com a equipe da assessoria.",
  },
};

interface StatusScreenProps {
  variante: VarianteStatus;
  nome: string | null;
  focar: boolean;
  onOutraPessoa?: () => void;
}

export function StatusScreen({ variante, nome, focar, onOutraPessoa }: StatusScreenProps) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const c = CONTEUDO[variante];
  const concluida = variante === "enviado" || variante === "ja-respondeu";

  useEffect(() => {
    if (focar) titulo.current?.focus({ preventScroll: true });
  }, [focar]);

  return (
    <section className="flex flex-1 flex-col justify-center py-12 lg:py-16">
      <div className="max-w-[720px]">
        {concluida && <CheckAnimado />}
        <p className="mt-8 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#ff2c04]">
          {variante === "enviado" && nome ? `Tudo certo, ${nome}` : c.eyebrow}
        </p>
        <h1
          ref={titulo}
          tabIndex={-1}
          className="mt-4 text-balance text-[34px] font-semibold leading-[1.06] tracking-[-0.03em] focus:outline-none sm:text-[48px] lg:text-[60px]"
        >
          {c.titulo}
        </h1>
        <p className="mt-5 text-[18px] leading-relaxed text-white/70">{c.texto}</p>

        <div className="mt-10 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
          {variante === "indisponivel" ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex h-14 items-center justify-center gap-2 rounded-full bg-[#f5f5f4] px-8 text-[16px] font-semibold text-[#0b0b0c] transition hover:bg-white"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Tentar novamente
            </button>
          ) : (
            <Link
              href="/assessoria"
              className="flex h-14 items-center justify-center gap-2 rounded-full bg-[#f5f5f4] px-8 text-[16px] font-semibold text-[#0b0b0c] transition hover:bg-white"
            >
              Voltar para a Assessoria
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
          {concluida && onOutraPessoa && (
            <button
              type="button"
              onClick={onOutraPessoa}
              className="h-12 rounded-full px-4 text-[15px] font-medium text-white/70 transition hover:text-white"
            >
              {variante === "enviado" ? "Responder por outra pessoa neste aparelho" : "Não é você? Responder como outra pessoa"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function CheckAnimado() {
  const reduzir = useReducedMotion();
  const desenho = reduzir ? { initial: false as const } : { initial: { pathLength: 0 } };

  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true">
      <motion.circle
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke="#ff2c04"
        strokeWidth="3"
        {...desenho}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M20 33.5 28 41.5 44.5 24"
        fill="none"
        stroke="#ff2c04"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...desenho}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
