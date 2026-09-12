"use client";

import { useEffect, useRef, useState } from "react";
import { DATA_CURTA, ESCASSEZ_PUBLICA } from "@/lib/somma-day/event.config";

/**
 * Barra de inscrição do celular.
 *
 * A página é longa e o formulário fica no fim dela. Quem decide na terceira
 * seção não deveria precisar rolar até a última para agir — esta barra é a
 * ação sempre à mão, como a barra inferior de um aplicativo.
 *
 * Duas regras de aparição, as duas por IntersectionObserver, nunca por evento
 * de scroll: escutar o scroll no iOS custa um handler por quadro durante toda
 * a inércia, e o observador entrega a mesma informação de graça.
 *
 *  1. Enquanto a capa está na tela, a barra fica escondida: a capa já tem o
 *     seu próprio botão e dois convites iguais competindo é ruído.
 *  2. Quando o formulário aparece, a barra sai de cena: mandar o usuário para
 *     onde ele já está é o tipo de detalhe que denuncia página automática.
 */
export default function BarraInscricao() {
  const [visivel, setVisivel] = useState(false);
  const capaFora = useRef(false);
  const formDentro = useRef(false);

  useEffect(() => {
    const capa = document.querySelector(".sd-capa");
    const form = document.querySelector("#inscricao");
    if (!capa || !form) return;

    const decide = () => setVisivel(capaFora.current && !formDentro.current);

    const oCapa = new IntersectionObserver(
      ([e]) => {
        capaFora.current = !e.isIntersecting;
        decide();
      },
      // A capa precisa ter saído de vez, não estar só com uma nesga na tela.
      { threshold: 0.12 }
    );
    const oForm = new IntersectionObserver(
      ([e]) => {
        formDentro.current = e.isIntersecting;
        decide();
      },
      // Antecipa um pouco: a barra sai antes de o formulário encostar na borda.
      { rootMargin: "0px 0px -18% 0px" }
    );

    oCapa.observe(capa);
    oForm.observe(form);
    return () => {
      oCapa.disconnect();
      oForm.disconnect();
    };
  }, []);

  return (
    <div
      className="sd-barra md:hidden"
      data-visivel={visivel}
      // Fora de cena a barra não deve receber toque nem foco de teclado.
      aria-hidden={!visivel}
      {...(!visivel ? { inert: "" as unknown as boolean } : {})}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="sd-display text-[1.35rem] leading-none">{DATA_CURTA}</p>
          <p className="mt-1 text-[10px] font-extrabold uppercase leading-tight tracking-[0.12em] opacity-70">
            {ESCASSEZ_PUBLICA}
          </p>
        </div>
        <a
          href="#inscricao"
          className="sd-botao sd-toque shrink-0 bg-[var(--sd-vermelho)] px-5 py-4 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[var(--sd-creme)]"
        >
          Garantir pulseira
        </a>
      </div>
    </div>
  );
}
