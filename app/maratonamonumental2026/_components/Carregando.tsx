"use client";

import { useEffect, useRef } from "react";
import { EASE, gsap, semMovimento } from "../_motion";

/** Tempo da tela de espera entre o envio da inscrição e a página de obrigado. */
export const ESPERA_MS = 5000;

const PASSOS = ["Reservando a sua vaga", "Gerando o seu ingresso", "Preparando o QR Code", "Tudo certo"];

/**
 * Tela cheia de espera, com 5 segundos de duração: a linha de percurso se
 * desenha, o contador sobe de 0 a 100 e as etapas se revezam. Com movimento
 * reduzido, a tela aparece parada, só com a mensagem.
 */
export function Carregando({ espera = false }: { espera?: boolean }) {
  const raiz = useRef<HTMLDivElement>(null);
  const numero = useRef<HTMLSpanElement>(null);
  const passo = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    raiz.current?.focus();
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  useEffect(() => {
    const el = raiz.current;
    if (!el || semMovimento()) return;
    const ctx = gsap.context(() => {
      const rota = el.querySelector<SVGPathElement>("[data-rota]");
      const s = ESPERA_MS / 1000;
      const conta = { v: 0 };
      const tl = gsap.timeline();
      tl.from(el, { autoAlpha: 0, duration: 0.35, ease: EASE.soft })
        .from("[data-l='linha']", { yPercent: 110, duration: 0.8, ease: EASE.out, stagger: 0.08 }, 0.1)
        .to(conta, {
          v: 100,
          duration: s - 0.4,
          ease: "power1.inOut",
          onUpdate: () => {
            if (numero.current) numero.current.textContent = String(Math.round(conta.v)).padStart(2, "0");
            const i = Math.min(PASSOS.length - 1, Math.floor((conta.v / 100) * PASSOS.length));
            if (passo.current && passo.current.dataset.i !== String(i)) {
              passo.current.dataset.i = String(i);
              passo.current.textContent = PASSOS[i];
              gsap.fromTo(passo.current, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: EASE.soft });
            }
          },
        }, 0.2)
        .fromTo("[data-l='barra']", { scaleX: 0 }, { scaleX: 1, duration: s - 0.4, ease: "power1.inOut" }, 0.2);
      // pathLength="1" no SVG: o traço vai de 1 a 0 qualquer que seja a escala da tela.
      if (rota) tl.fromTo(rota, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: s - 0.4, ease: "power1.inOut" }, 0.2);
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={raiz}
      role="status"
      aria-live="polite"
      aria-label={espera ? "Registrando a sua entrada na lista de espera" : "Confirmando a sua inscrição"}
      tabIndex={-1}
      className="fixed inset-0 z-[70] flex flex-col justify-between overflow-hidden bg-[color:var(--mt-preto)] outline-none"
      style={{ padding: "calc(1.5rem + env(safe-area-inset-top)) var(--mt-margem) calc(1.5rem + env(safe-area-inset-bottom))" }}
    >
      <svg aria-hidden viewBox="0 0 1200 800" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
        <path data-rota pathLength={1} strokeDasharray="1" className="mt-rota" d="M-20 690 C 160 690, 210 520, 370 528 S 540 690, 700 600 S 800 300, 940 318 S 1070 450, 1130 250 S 1180 130, 1230 118" />
      </svg>

      <p className="mt-marco relative"><b>Meeting Técnico</b> Maratona Monumental 2026</p>

      <div className="relative">
        <p className="mt-display text-[clamp(3rem,15vw,9rem)]">
          <span className="mt-mascara"><span data-l="linha">{espera ? "Entrando" : "Confirmando"}</span></span>
          <span className="mt-mascara"><span data-l="linha">{espera ? "na lista" : "sua vaga"}<span className="text-[color:var(--mt-laranja)]">.</span></span></span>
        </p>
        <p ref={passo} data-i="0" className="mt-4 min-h-7 text-[1.1rem] font-medium text-[#d4d4d4]">{PASSOS[0]}</p>
      </div>

      <div className="relative">
        <div className="flex items-end justify-between">
          <p className="mt-rotulo">Não feche esta página</p>
          <p className="mt-mono text-[2rem] font-bold leading-none tracking-normal motion-reduce:hidden" aria-hidden>
            <span ref={numero}>00</span><span className="text-[1rem] text-[color:var(--mt-cinza)]">%</span>
          </p>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-[color:var(--mt-linha-forte)]">
          <div data-l="barra" className="h-full origin-left bg-[color:var(--mt-laranja)] motion-reduce:hidden" />
        </div>
      </div>
    </div>
  );
}
