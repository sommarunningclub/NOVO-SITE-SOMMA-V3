"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { Celebrar, Cartao } from "@/lib/vem-correr-comigo/tipos";
import { Avatar } from "./Cartoes";

const TEXTOS: Record<Celebrar, { titulo: string; sub: string; ver: string; compartilhar: string }> = {
  dupla: { titulo: "Vocês descomplicaram juntos!", sub: "Agora seu próximo corre já tem companhia.", ver: "Ver nossa dupla", compartilhar: "Compartilhar" },
  trio: { titulo: "Agora somos três!", sub: "Mais uma conexão para descomplicar esse corre.", ver: "Ver nosso grupo", compartilhar: "Compartilhar" },
  quarteto: { titulo: "Quarteto formado!", sub: "Agora é só descomplicar.", ver: "Ver nosso grupo", compartilhar: "Compartilhar nosso quarteto" },
};

type Props = {
  tipo: Celebrar;
  membros: Cartao[];
  onVer: () => void;
  onCompartilhar: () => void;
  onFechar: () => void;
};

/** Só abre depois da resposta do banco. Fecha sem esperar a animação terminar. */
export default function Celebracao({ tipo, membros, onVer, onCompartilhar, onFechar }: Props) {
  const raiz = useRef<HTMLDivElement>(null);
  const t = TEXTOS[tipo];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".cr-cel__fundo", { opacity: 0, duration: 0.25 })
        .from(".cr-cel__foto", {
          x: (i: number, _el: Element, lista: Element[]) => (i < lista.length / 2 ? -150 : 150),
          scale: 0.6, opacity: 0, duration: 0.7, stagger: 0.08, ease: "back.out(1.5)",
        }, 0.1)
        .from(".cr-cel__coracao", { scale: 0, rotate: -30, duration: 0.5, ease: "back.out(2.6)" }, 0.65)
        .from(".cr-cel__titulo", { y: 26, opacity: 0, duration: 0.5 }, 0.8)
        .from(".cr-cel__sub", { y: 16, opacity: 0, duration: 0.4 }, 1)
        .from(".cr-cel__acoes", { opacity: 0, duration: 0.35 }, 1.15);
      if (tipo === "quarteto") {
        tl.fromTo(".cr-cel__faisca", { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.9, stagger: 0.05, ease: "power2.out" }, 0.75);
      }
    }, raiz);
    return () => ctx.revert();
  }, [tipo]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onFechar(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  return (
    <div ref={raiz} className="cr-cel" role="dialog" aria-modal="true" aria-label={t.titulo}>
      <div className="cr-cel__fundo" />
      <button className="cr-cel__fechar" onClick={onFechar} aria-label="Fechar">×</button>
      <div className="cr-cel__palco">
        <div className={`cr-cel__fotos cr-cel__fotos--${Math.min(membros.length, 4)}`}>
          {membros.slice(0, 4).map((m) => <span key={m.codigo} className="cr-cel__foto"><Avatar p={m} tamanho="g" /></span>)}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cr-cel__coracao" src="/dexcomplica-love-run/marca/dex-coracao.png" alt="" />
          {tipo === "quarteto" ? [0, 1, 2, 3, 4, 5].map((i) => <i key={i} className={`cr-cel__faisca cr-cel__faisca--${i}`} />) : null}
        </div>
        <h2 className="cr-cel__titulo">{t.titulo}</h2>
        <p className="cr-cel__sub">{t.sub}</p>
        <div className="cr-cel__acoes">
          <button className="lr-btn lr-btn--amarelo" onClick={onVer}>{t.ver}</button>
          <button className="lr-btn lr-btn--contorno" onClick={onCompartilhar}>{t.compartilhar}</button>
        </div>
      </div>
    </div>
  );
}
