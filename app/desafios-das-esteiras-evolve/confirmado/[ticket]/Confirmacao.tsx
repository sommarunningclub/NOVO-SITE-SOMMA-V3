"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../../_motion";

/**
 * Animação de confirmação.
 *
 * O traço de energia risca a tela, a headline sobe e o ticket entra girando de
 * leve, como se tivesse acabado de ser impresso. Recebe o ticket já renderizado
 * no servidor como `children` — o QR não passa pelo cliente.
 */
export function Confirmacao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = raiz.current;
    if (!root) return;

    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.fromTo(
        ".conf-risco",
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, duration: 0.7, ease: "power4.inOut" }
      )
        .fromTo(
          ".conf-mask > *",
          { yPercent: 105 },
          { yPercent: 0, duration: 1.1, stagger: 0.08 },
          "-=0.35"
        )
        .fromTo(".conf-sub", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, "-=0.6")
        .fromTo(
          ".conf-ticket",
          { y: 70, opacity: 0, rotateX: -14, transformPerspective: 900 },
          { y: 0, opacity: 1, rotateX: 0, duration: 1.15 },
          "-=0.45"
        );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={raiz}>
      <span
        aria-hidden
        className="conf-risco mb-7 block h-[3px] w-full"
        style={{ background: "var(--energia)" }}
      />

      <h1 className="dst-display text-[clamp(2.6rem,12vw,6.5rem)]">
        <span className="dst-mask conf-mask">
          <span>VOCÊ ESTÁ</span>
        </span>
        <span className="dst-mask conf-mask">
          <span style={{ color: "var(--somma)" }}>DENTRO.</span>
        </span>
      </h1>

      <p className="conf-sub mt-5 max-w-[48ch] text-[clamp(1rem,2.6vw,1.15rem)] leading-relaxed text-[color:rgba(242,240,236,0.7)]">
        {titulo}
      </p>

      <div className="conf-ticket mt-10">{children}</div>
    </div>
  );
}
