"use client";

import { SELETIVA } from "@/lib/o-longao/copy";
import { FitLines } from "./FitLines";
import {
  EASE,
  countUp,
  drawLine,
  gsap,
  maskReveal,
  riseIn,
  slideIn,
  useScope,
} from "../_motion";

/**
 * Fase 01 — A Seletiva.
 *
 * A regra da classificatória contada como pit wall: um trilho âmbar se
 * desenha com o scroll (o tempo passando) e cada passo entra alternando o
 * lado. Os números fecham a conta em cards de painel, com contadores para
 * o que é contável e as exceções ("∞", "4 + 4") entrando paradas.
 */
export function Seletiva() {
  const root = useScope<HTMLElement>(({ root }) => {
    riseIn(root.querySelectorAll(".sel-cab"), { trigger: root, start: "top 78%", stagger: 0.1 });
    maskReveal(root.querySelectorAll(".sel-titulo > *"), { trigger: root, start: "top 76%" });

    // O trilho da timeline acompanha o scroll: âmbar, como tudo que é tempo.
    const lista = root.querySelector<HTMLElement>(".sel-lista");
    const trilho = root.querySelector<SVGLineElement>(".sel-trilho");
    if (lista && trilho) drawLine(trilho, lista, { end: "bottom 58%" });

    root.querySelectorAll<HTMLElement>(".sel-passo").forEach((passo, i) => {
      slideIn(passo, i % 2 === 0 ? "left" : "right", { trigger: passo });
    });

    const ranking = root.querySelector<HTMLElement>(".sel-ranking");
    if (ranking) riseIn(ranking, { trigger: ranking });

    const numeros = root.querySelector<HTMLElement>(".sel-numeros");
    riseIn(root.querySelectorAll(".sel-card"), { trigger: numeros ?? root, stagger: 0.07 });
    root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      const alvo = Number(el.dataset.count);
      if (Number.isFinite(alvo)) countUp(el, alvo, { trigger: numeros ?? el });
    });

    const fechoWrap = root.querySelector<HTMLElement>(".sel-fecho-wrap");
    if (fechoWrap) {
      maskReveal(root.querySelectorAll(".sel-fecho > *"), { trigger: fechoWrap, start: "top 84%" });
      gsap.fromTo(
        root.querySelector(".sel-fecho-linha"),
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.3,
          ease: EASE.drive,
          transformOrigin: "left center",
          scrollTrigger: { trigger: fechoWrap, start: "top 84%", once: true },
        }
      );
    }
  });

  return (
    <section
      ref={root}
      id="seletiva"
      className="lgo-section relative scroll-mt-16 overflow-hidden border-t border-[color:var(--line)]"
      aria-labelledby="seletiva-titulo"
    >
      <div
        className="lgo-glow left-[-12%] top-[6%] h-[42vh] w-[42vh]"
        style={{ background: "var(--sinal)", opacity: 0.14 }}
        aria-hidden
      />

      <div className="lgo-wrap relative">
        {/* ── Cabeçalho da fase ── */}
        <p className="sel-cab">
          <span className="lgo-clip-tag lgo-label inline-flex min-h-[28px] items-center bg-[color:var(--sinal)] py-2 pl-4 pr-6 text-[color:var(--noite)]">
            {SELETIVA.fase}
          </span>
        </p>

        <h2 id="seletiva-titulo" className="mt-6">
          <FitLines linhas={[SELETIVA.titulo]} maskClass="sel-titulo" max="13rem" min="2.8rem" />
        </h2>

        <p className="sel-cab mt-8 max-w-[54ch] text-[clamp(1rem,2.6vw,1.25rem)] leading-relaxed text-[color:rgba(242,240,236,0.72)]">
          {SELETIVA.intro}
        </p>

        {/* ── Timeline vertical dos passos ── */}
        <ol className="sel-lista relative mt-12 md:mt-16">
          <span
            aria-hidden
            className="absolute inset-y-1 left-[5px] w-px bg-[color:var(--line)]"
          />
          <svg
            aria-hidden
            className="absolute inset-y-1 left-[5px] w-[2px]"
            viewBox="0 0 2 100"
            preserveAspectRatio="none"
          >
            <line
              className="sel-trilho"
              x1="1"
              y1="0"
              x2="1"
              y2="100"
              stroke="var(--sinal)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {SELETIVA.passos.map((passo, i) => (
            <li
              key={passo.rotulo}
              className="sel-passo relative border-b border-[color:var(--line)] py-7 pl-8 sm:pl-12 md:py-9"
            >
              <span
                aria-hidden
                className="absolute left-0 top-[2rem] h-[11px] w-[11px] bg-[color:var(--sinal)] md:top-[2.5rem]"
                style={{ boxShadow: "0 0 14px rgba(255,196,0,0.55)" }}
              />

              <p className="lgo-label flex items-baseline gap-3 text-[color:var(--sinal)]">
                <span className="lgo-num text-[color:rgba(242,240,236,0.35)]">0{i + 1}</span>
                {passo.rotulo}
              </p>

              <div className="mt-3 md:grid md:grid-cols-12 md:items-baseline md:gap-6">
                <p className="lgo-display lgo-display-condensed text-[clamp(1.7rem,6vw,3.2rem)] md:col-span-5">
                  {passo.valor}
                </p>
                <p className="mt-3 max-w-[44ch] text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.62)] md:col-span-7 md:mt-0">
                  {passo.texto}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <p className="sel-ranking mt-10 max-w-[56ch] text-[clamp(1.05rem,2.5vw,1.35rem)] leading-relaxed text-[color:rgba(242,240,236,0.82)]">
          {SELETIVA.ranking}
        </p>

        {/* ── A conta da seletiva ── */}
        <div className="sel-numeros mt-14 grid grid-cols-2 gap-3 md:mt-20 md:grid-cols-5">
          {SELETIVA.numeros.map((n, i) => {
            const contavel = /^\d+$/.test(n.valor);
            const ultimoImpar =
              i === SELETIVA.numeros.length - 1 && SELETIVA.numeros.length % 2 === 1;
            return (
              <div
                key={n.rotulo}
                className={`sel-card lgo-panel flex min-h-[132px] flex-col justify-between p-5 ${
                  ultimoImpar ? "col-span-2 md:col-span-1" : ""
                }`}
              >
                <p
                  className="lgo-num text-[clamp(2.3rem,7vw,3.4rem)] font-bold leading-none"
                  /* MINUTOS é tempo: fica no âmbar de cronometragem */
                  style={{ color: n.rotulo === "MINUTOS" ? "var(--sinal)" : "var(--papel)" }}
                  data-count={contavel ? n.valor : undefined}
                >
                  {n.valor}
                </p>
                <p className="lgo-label mt-5 text-[color:rgba(242,240,236,0.5)]">{n.rotulo}</p>
              </div>
            );
          })}
        </div>

        {/* ── Fecho ── */}
        <div className="sel-fecho-wrap mt-16 md:mt-24">
          <FitLines linhas={[SELETIVA.fecho]} maskClass="sel-fecho" max="6rem" min="1.15rem" />
          <span className="sel-fecho-linha lgo-timing-line mt-5 block" aria-hidden />
        </div>
      </div>
    </section>
  );
}
