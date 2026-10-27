"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { garantirGsap, movimentoReduzido } from "@/lib/dexcomplica-love-run/motion";

/**
 * Os 6 segundos entre "inscrição gravada" e o ingresso.
 *
 * Só começa DEPOIS que o banco confirmou: é celebração, não espera. A
 * narrativa é a de um corre: o coração acelera (BPM sobe na tela, a linha de
 * batimento corre), o bordão bate no ritmo (Desapega. Desilude.
 * Dexcomplica!), o mascote entra, pulsa e engole a tela em vermelho, que
 * escurece no mesmo tom de abertura da página do ingresso.
 *
 * - O ingresso é pré-carregado durante a animação: no fim, a troca é imediata.
 * - "Pular" leva direto ao ingresso (e Esc também).
 * - Com movimento reduzido: nada se mexe; uma composição parada por 2,5 s.
 * - No Android, uma vibração curta a cada batida.
 */
const DURACAO = 6;

export default function Transicao({ aoTerminar }: { aoTerminar: () => void }) {
  const raiz = useRef<HTMLDivElement>(null);
  const pular = useRef<HTMLButtonElement>(null);
  const terminou = useRef(false);
  const [montado, setMontado] = useState(false);

  const fim = () => {
    if (terminou.current) return;
    terminou.current = true;
    aoTerminar();
  };

  useEffect(() => setMontado(true), []);

  useLayoutEffect(() => {
    if (!montado || !raiz.current) return;
    const root = raiz.current;
    pular.current?.focus({ preventScroll: true });
    const html = document.documentElement;
    const overflowAntes = html.style.overflow;
    html.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fim();
    window.addEventListener("keydown", esc);

    if (movimentoReduzido()) {
      const t = window.setTimeout(fim, 2500);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("keydown", esc);
        html.style.overflow = overflowAntes;
      };
    }

    const { gsap } = garantirGsap();
    const q = (s: string) => root.querySelector(s);
    const qa = (s: string) => root.querySelectorAll(s);
    const bater = () => navigator.vibrate?.(28);

    const ctx = gsap.context(() => {
      const linha = q("[data-t-linha]") as SVGPathElement | null;
      const total = linha?.getTotalLength() ?? 1000;
      const bpm = { v: 72 };
      const visor = q("[data-t-bpm]");

      const tl = gsap.timeline({ onComplete: fim });
      tl.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power1.out" })
        .fromTo(q("[data-t-confirmada]"), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.15)
        // 0,3 → 3,2 s: o batimento corre a tela e o BPM sobe como num tiro de corrida
        .fromTo(linha, { strokeDasharray: total, strokeDashoffset: total }, { strokeDashoffset: 0, duration: 2.9, ease: "power1.inOut" }, 0.3)
        .to(bpm, {
          v: 168,
          duration: 2.9,
          ease: "power2.in",
          onUpdate: () => { if (visor) visor.textContent = String(Math.round(bpm.v)); },
        }, 0.3);

      // As três palavras batem no ritmo, cada uma uma batida mais forte
      const palavras = qa("[data-t-palavra]");
      [1.0, 1.75, 2.45].forEach((em, i) => {
        tl.call(bater, [], em)
          .fromTo(palavras[i], { scale: 1.6, opacity: 0, filter: "blur(10px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.32, ease: "expo.out", immediateRender: false }, em);
        // Cada palavra ocupa o mesmo lugar: a anterior sai quando a próxima bate.
        if (i < 2) tl.to(palavras[i], { opacity: 0, scale: 0.9, duration: 0.2 }, [1.75, 2.45][i] - 0.05);
        tl.fromTo(q("[data-t-flash]"), { opacity: 0.25 + i * 0.12 }, { opacity: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, em);
      });

      // 3,2 s: limpa o palco, entra o mascote
      tl.to(qa("[data-t-palavra], [data-t-confirmada], [data-t-visor], [data-t-linha-svg]"), { opacity: 0, y: -14, duration: 0.35, stagger: 0.03 }, 3.2)
        .fromTo(q("[data-t-coracao]"), { scale: 0, rotate: -35 }, { scale: 1, rotate: 0, duration: 0.7, ease: "back.out(2.4)" }, 3.3)
        .fromTo(q("[data-t-garantida]"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 3.55);

      // Três batidas do mascote, com anéis saindo
      [3.95, 4.35, 4.75].forEach((em, i) => {
        tl.call(bater, [], em)
          .to(q("[data-t-coracao]"), { scale: 1.16 + i * 0.04, duration: 0.11, ease: "power2.out" }, em)
          .to(q("[data-t-coracao]"), { scale: 1, duration: 0.25, ease: "power2.in" }, em + 0.11)
          .fromTo(qa("[data-t-anel]")[i], { scale: 0.6, opacity: 0.9 }, { scale: 3.2, opacity: 0, duration: 0.9, ease: "power2.out", immediateRender: false }, em);
      });

      // 5,15 s: o vermelho toma a tela e escurece no tom do ingresso
      tl.to(q("[data-t-garantida]"), { opacity: 0, duration: 0.25 }, 5.1)
        .to(q("[data-t-coracao]"), { scale: 4, opacity: 0, duration: 0.45, ease: "power3.in" }, 5.05)
        .fromTo(q("[data-t-onda]"), { scale: 0 }, { scale: 1, duration: 0.5, ease: "power2.in", immediateRender: false }, 5.15)
        .to(q("[data-t-escuro]"), { opacity: 1, duration: 0.3, ease: "power1.in" }, DURACAO - 0.3);
    }, root);

    return () => {
      ctx.revert();
      window.removeEventListener("keydown", esc);
      html.style.overflow = overflowAntes;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montado]);

  if (!montado) return null;

  // Sem portal: a camada precisa ficar dentro de .lr-root, onde moram as
  // variáveis das fontes (next/font) e as cores. `position: fixed` resolve.
  return (
    <div ref={raiz} className="lr-trans" data-reduzido={movimentoReduzido() || undefined} role="dialog" aria-modal="true" aria-labelledby="lr-trans-titulo">
      <p id="lr-trans-titulo" className="sr-only" role="status" aria-live="assertive">
        Inscrição confirmada. Abrindo seu ingresso.
      </p>
      <div className="lr-trans__flash" data-t-flash aria-hidden="true" />

      <p className="lr-trans__confirmada" data-t-confirmada aria-hidden="true">
        <span className="lr-trans__ponto" /> Inscrição confirmada
      </p>

      <div className="lr-trans__visor" data-t-visor aria-hidden="true">
        <span data-t-bpm>72</span>
        <small>bpm</small>
      </div>

      <svg className="lr-trans__linha" data-t-linha-svg viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
        <path
          data-t-linha
          d="M0 110 H210 l16 -40 l22 90 l26 -130 l22 120 l16 -40 H470 l14 -30 l20 70 l22 -110 l20 100 l14 -30 H730 l12 -24 l18 54 l20 -90 l18 80 l12 -20 H1200"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="lr-trans__palavras" aria-hidden="true">
        <span data-t-palavra>Desapega.</span>
        <span data-t-palavra>Desilude.</span>
        <span data-t-palavra className="lr-trans__dex">Dexcomplica!</span>
      </div>

      <div className="lr-trans__centro" aria-hidden="true">
        <span className="lr-trans__anel" data-t-anel />
        <span className="lr-trans__anel" data-t-anel />
        <span className="lr-trans__anel" data-t-anel />
        <Image data-t-coracao className="lr-trans__coracao" src="/dexcomplica-love-run/marca/dex-coracao.png" alt="" width={525} height={502} priority />
      </div>
      <p className="lr-trans__garantida" data-t-garantida aria-hidden="true">Sua vaga está garantida.</p>

      <div className="lr-trans__onda" data-t-onda aria-hidden="true" />
      <div className="lr-trans__escuro" data-t-escuro aria-hidden="true" />

      <button ref={pular} type="button" className="lr-trans__pular" onClick={fim}>
        Pular para o ingresso
      </button>
    </div>
  );
}
