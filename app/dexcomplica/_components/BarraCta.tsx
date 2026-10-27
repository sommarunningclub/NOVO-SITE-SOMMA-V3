"use client";

import { useEffect, useState } from "react";
import type { EstadoInscricao } from "@/lib/dexcomplica-love-run/event.config";
import { rastrear } from "@/lib/dexcomplica-love-run/analytics";

/**
 * CTA fixo do celular. Aparece depois da capa e some quando a inscrição (ou
 * o rodapé) está na tela, para nunca cobrir o formulário.
 */
export default function BarraCta({ estado }: { estado: EstadoInscricao }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const capa = document.querySelector(".lr-capa");
    const insc = document.getElementById("inscricao");
    const rodape = document.querySelector(".lr-rodape");
    if (!capa || !insc) return;
    const vistos = new Map<Element, boolean>();
    const io = new IntersectionObserver((entradas) => {
      for (const e of entradas) vistos.set(e.target, e.isIntersecting);
      const capaNaTela = vistos.get(capa) ?? true;
      const fim = (vistos.get(insc) ?? false) || (rodape ? vistos.get(rodape) ?? false : false);
      setVisivel(!capaNaTela && !fim);
    });
    io.observe(capa);
    io.observe(insc);
    if (rodape) io.observe(rodape);
    return () => io.disconnect();
  }, []);

  const texto = estado === "abertas" ? "Garanta sua vaga" : estado === "em_breve" ? "Inscrições em breve" : "Ver inscrição";

  return (
    <div className="lr-barra" data-visivel={visivel} aria-hidden={!visivel}>
      <div>
        <strong>Love Run · 07.11</strong>
        <span>Gratuito · vagas limitadas</span>
      </div>
      <a
        href="#inscricao"
        className="lr-btn lr-btn--vermelho lr-btn--p"
        tabIndex={visivel ? 0 : -1}
        onClick={() => rastrear("cta_clicado", { origem: "barra" })}
      >
        {texto}
      </a>
    </div>
  );
}
