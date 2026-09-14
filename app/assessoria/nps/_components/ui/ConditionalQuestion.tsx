"use client";

import { useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Pedaço de pergunta que só existe sob condição ("Outro" → campo de texto,
 * "mais de um período" → quais períodos). Abre em altura, sem empurrar a tela
 * aos saltos. Fechado, sai do DOM: leitor de tela não anuncia o que não vale.
 *
 * Costuma abrir no fim de uma lista longa, bem onde fica o rodapé fixo. Ao
 * terminar de abrir, rola até aparecer inteiro; `scroll-mb-36` desconta a
 * altura do rodapé para o campo não ficar escondido atrás do botão.
 */
export function ConditionalQuestion({ show, children }: { show: boolean; children: ReactNode }) {
  const reduzir = useReducedMotion();
  const conteudo = useRef<HTMLDivElement>(null);

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="condicional"
          initial={reduzir ? { opacity: 0 } : { opacity: 0, height: 0 }}
          animate={reduzir ? { opacity: 1 } : { opacity: 1, height: "auto" }}
          exit={reduzir ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={(definicao) => {
            const abriu = typeof definicao === "object" && definicao !== null && "opacity" in definicao && definicao.opacity === 1;
            if (abriu) conteudo.current?.scrollIntoView({ block: "nearest", behavior: reduzir ? "auto" : "smooth" });
          }}
          className="overflow-hidden"
        >
          {/* Folga lateral e inferior para o anel de foco não ser cortado pelo overflow. */}
          <div ref={conteudo} className="-mx-1 scroll-mb-36 px-1 pb-1 pt-6">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
