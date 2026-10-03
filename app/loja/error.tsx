"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ROUTES } from "@/lib/shopify/handles";

/**
 * Erro em qualquer página da loja (Shopify fora do ar, resposta inválida).
 * O visitante não vê mensagem técnica; o detalhe vai para o log.
 */
export default function LojaError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[loja]", error);
  }, [error]);

  return (
    <section className="lj-state">
      <p className="lj-label lj-label--soft">Algo saiu do ritmo</p>
      <h1 className="lj-display lj-display--l">
        A loja tropeçou<span className="lj-dot">.</span>
      </h1>
      <p className="lj-lead">Não foi você. Tente de novo em instantes.</p>
      <div className="lj-hero__actions">
        <button type="button" className="lj-btn" onClick={reset}>
          Tentar de novo
          <span className="lj-btn__arrow" aria-hidden="true">→</span>
        </button>
        <Link className="lj-link" href={ROUTES.home}>
          Voltar para a loja
        </Link>
      </div>
    </section>
  );
}
