"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { DEMO_DASHBOARD, DIGITAL, FRASES } from "@/lib/o-longao/copy";
import { track } from "@/lib/o-longao/analytics";
import { EASE, ScrollTrigger, gsap, maskReveal, riseIn, useScope } from "../_motion";
import { FitLines } from "./FitLines";

/** O copy é a fonte única; aqui só quebramos o título em linhas para o FitLines. */
// "EXPERIÊNCIA DIGITAL BY SOMMA" menos o "BY SOMMA": o resto vira logo.
const KICKER_PREFIXO = DIGITAL.kicker.split(" BY ")[0];

const PALAVRAS = DIGITAL.titulo.split(" ");
const TITULO_LINHAS = [PALAVRAS.slice(0, 3).join(" "), PALAVRAS.slice(3).join(" ")];

/** "312,8 KM" → 312.8 — as barras do leaderboard são proporcionais ao líder. */
const kmNumero = (s: string) => parseFloat(s.replace(",", "."));
const KM_MAX = Math.max(...DEMO_DASHBOARD.leaderboard.map((l) => kmNumero(l.km)));

/** "PACE ATUAL 4:05" → "PACE ATUAL": o loop reescreve só o número. */
const PACE_PREFIXO = DEMO_DASHBOARD.lider.pace.replace(/\s*\d+:\d+\s*$/, "");

/**
 * A camada digital do Longão, demonstrada.
 *
 * O centro é um dashboard SIMULADO: km subindo, pace oscilando, leaderboard
 * fictício. O selo DEMONSTRAÇÃO fica visível o tempo todo e a nota embaixo
 * repete o aviso — números plausíveis, nunca vendidos como reais.
 */
export function ExperienciaDigital() {
  const jaTrackeou = useRef(false);

  const root = useScope<HTMLElement>(({ root }) => {
    const painel = root.querySelector<HTMLElement>(".exd-painel");

    maskReveal(root.querySelectorAll(".exd-titulo > *"), { trigger: root, start: "top 78%" });
    riseIn(root.querySelectorAll(".exd-anim"), { trigger: root, start: "top 76%" });

    if (painel) {
      riseIn(root.querySelectorAll(".exd-painel-anim"), {
        trigger: painel,
        start: "top 74%",
        stagger: 0.09,
      });

      // Barras relativas ao líder: o estado final já está inline (anti-FOUC),
      // o GSAP só percorre o caminho de zero até lá.
      gsap.fromTo(
        root.querySelectorAll<HTMLElement>(".exd-bar"),
        { scaleX: 0 },
        {
          scaleX: (_i: number, el: Element) =>
            parseFloat((el as HTMLElement).dataset.escala ?? "1"),
          duration: 1.3,
          ease: EASE.out,
          stagger: 0.12,
          scrollTrigger: { trigger: painel, start: "top 66%", once: true },
        }
      );
    }

    riseIn(root.querySelectorAll(".exd-meta-anim"), {
      trigger: root.querySelector(".exd-meta") ?? root,
      start: "top 84%",
      stagger: 0.05,
    });

    // Loop do demo (não roda com prefers-reduced-motion: o useScope nem monta).
    // Km sobe décimo a décimo e o pace respira entre 4:03 e 4:07 — telemetria
    // viva o bastante para parecer prova, contida o bastante para ser crível.
    const kmEl = root.querySelector<HTMLElement>(".exd-km");
    if (kmEl) {
      const km = { v: kmNumero(DEMO_DASHBOARD.lider.km) };
      gsap.to(km, {
        v: "+=0.1",
        duration: 8,
        ease: "none",
        repeat: -1,
        repeatRefresh: true, // relê o "+=" a cada volta: o número só sobe
        onUpdate: () => {
          kmEl.textContent = `${km.v.toFixed(1)} KM`;
        },
      });
    }

    const paceEl = root.querySelector<HTMLElement>(".exd-pace");
    if (paceEl) {
      const pace = { s: 245 }; // 4:05, o valor do copy
      const render = () => {
        const s = Math.round(pace.s);
        paceEl.textContent = `${PACE_PREFIXO} ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
      };
      gsap
        .timeline({ repeat: -1, onUpdate: render })
        .to(pace, { s: 247, duration: 5.5, ease: "sine.inOut" })
        .to(pace, { s: 243, duration: 7, ease: "sine.inOut" })
        .to(pace, { s: 245, duration: 5.5, ease: "sine.inOut" });
    }
  });

  // O tracking não depende de preferência de motion: ScrollTrigger direto,
  // `once` + ref garantem um único disparo por montagem.
  useEffect(() => {
    const painel = root.current?.querySelector<HTMLElement>(".exd-painel");
    if (!painel) return;
    const st = ScrollTrigger.create({
      trigger: painel,
      start: "top 75%",
      once: true,
      onEnter: () => {
        if (jaTrackeou.current) return;
        jaTrackeou.current = true;
        track("view_leaderboard_demo");
      },
    });
    return () => st.kill();
    // roda só na montagem: o painel é estático
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      ref={root}
      id="ao-vivo"
      className="lgo-section relative scroll-mt-16 overflow-hidden"
      aria-labelledby="ao-vivo-titulo"
    >
      <div aria-hidden className="lgo-lanes" />
      <div
        aria-hidden
        className="lgo-glow left-1/2 top-[28%] h-[46vh] w-[46vh] -translate-x-1/2"
        style={{ background: "var(--somma)", opacity: 0.12 }}
      />

      <div className="lgo-wrap relative">
        {/* O "BY SOMMA" do kicker vira a logo de verdade: esta é a seção que a
            marca assina, e assinatura se faz com a marca, não com o nome dela
            escrito. O texto continua no `alt`, então nada se perde na leitura. */}
        <p className="exd-anim mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="lgo-label text-[color:var(--somma)]">{KICKER_PREFIXO}</span>
          <span className="lgo-label text-[color:rgba(242,240,236,0.4)]">BY</span>
          <Image
            src="/logo-somma.svg"
            alt="SOMMA Club"
            width={192}
            height={51}
            style={{ height: 22 }}
            className="w-auto"
          />
        </p>

        <h2 id="ao-vivo-titulo">
          <FitLines linhas={TITULO_LINHAS} maskClass="exd-titulo" max="8rem" min="1.9rem" />
        </h2>

        <p className="exd-anim mt-7 max-w-[58ch] text-[clamp(1rem,2.4vw,1.2rem)] leading-relaxed text-[color:rgba(242,240,236,0.75)]">
          {DIGITAL.texto}
        </p>

        {/* ── Dashboard simulado ─────────────────────────────────────────── */}
        <div className="exd-painel lgo-panel relative mt-12 md:mt-16">
          {/* O selo NUNCA sai de cena: todo número aqui é ilustrativo. */}
          <span
            className="lgo-label lgo-clip-tag absolute right-0 top-0 z-10 bg-[color:var(--sinal)] px-4 py-2 text-[color:var(--noite)]"
            style={{ clipPath: "polygon(10px 0, 100% 0, 100% 100%, 0 100%)" }}
          >
            {DIGITAL.demoAviso}
          </span>

          <div className="p-5 sm:p-7 md:p-9">
            {/* Linha do líder */}
            <div className="exd-painel-anim flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="lgo-num text-[clamp(1.3rem,4vw,1.9rem)] font-bold text-[color:var(--sinal)]">
                {DEMO_DASHBOARD.lider.posicao}
              </span>
              <span className="lgo-display lgo-display-condensed text-[clamp(1.5rem,5vw,2.6rem)]">
                {DEMO_DASHBOARD.lider.crew}
              </span>
            </div>

            <p
              className="exd-km exd-painel-anim lgo-num mt-3 text-[clamp(3.2rem,13vw,7.5rem)] font-bold leading-none text-[color:var(--sinal)]"
              style={{ textShadow: "0 0 42px rgba(255, 196, 0, 0.25)" }}
            >
              {DEMO_DASHBOARD.lider.km}
            </p>

            <ul className="exd-painel-anim mt-6 flex flex-wrap gap-2">
              <li className="lgo-mono border border-[color:var(--line)] bg-[color:var(--noite-3)] px-3 py-2 text-[0.78rem] text-[color:var(--sinal)]">
                {DEMO_DASHBOARD.lider.gap}
              </li>
              <li className="lgo-mono border border-[color:var(--line)] bg-[color:var(--noite-3)] px-3 py-2 text-[0.78rem]">
                <span className="exd-pace">{DEMO_DASHBOARD.lider.pace}</span>
              </li>
              <li className="lgo-mono border border-[color:var(--line)] bg-[color:var(--noite-3)] px-3 py-2 text-[0.78rem]">
                {DEMO_DASHBOARD.lider.atleta}
              </li>
              <li className="lgo-mono border border-[color:var(--line)] bg-[color:var(--noite-3)] px-3 py-2 text-[0.78rem]">
                {DEMO_DASHBOARD.lider.trocas}
              </li>
            </ul>

            {/* Leaderboard demo */}
            <ol className="mt-8 border-t border-[color:var(--line)]">
              {DEMO_DASHBOARD.leaderboard.map((linha, i) => {
                const escala = kmNumero(linha.km) / KM_MAX;
                return (
                  <li
                    key={linha.crew}
                    className={`lgo-row exd-painel-anim gap-2 ${i === 0 ? "lgo-row--lider" : ""}`}
                  >
                    <div className="flex items-baseline gap-3 sm:gap-4">
                      <span className="lgo-num w-8 shrink-0 text-[0.85rem] opacity-70">
                        {String(linha.pos).padStart(2, "0")}
                      </span>
                      <span className="lgo-display lgo-display-condensed min-w-0 flex-1 text-[clamp(1.1rem,3.6vw,1.7rem)]">
                        {linha.crew}
                      </span>
                      <span className="lgo-num shrink-0 text-[clamp(0.95rem,3vw,1.35rem)] font-bold">
                        {linha.km}
                      </span>
                    </div>
                    <div aria-hidden className="h-[3px] w-full bg-[color:var(--noite-3)]">
                      <div
                        className="exd-bar h-full origin-left"
                        data-escala={escala}
                        style={{ background: "var(--timing)", transform: `scaleX(${escala})` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <div className="exd-meta">
          <p className="exd-meta-anim lgo-mono mt-3 text-[0.75rem] leading-relaxed text-[color:rgba(242,240,236,0.45)]">
            {DIGITAL.demoNota}
          </p>

          {/* Tudo que o placar real vai mostrar durante as 24 horas. */}
          <ul className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DIGITAL.metricas.map((metrica) => (
              <li
                key={metrica}
                className="exd-meta-anim lgo-label flex min-h-[52px] items-center border border-[color:var(--line)] bg-[color:var(--noite-2)] px-4 text-[color:rgba(242,240,236,0.7)]"
              >
                {metrica}
              </li>
            ))}
          </ul>

          <div className="exd-meta-anim mt-12 flex items-center gap-5 md:mt-16">
            <span aria-hidden className="lgo-timing-line w-14 shrink-0 sm:w-20" />
            <p className="lgo-display lgo-display-condensed text-[clamp(1.35rem,4.5vw,2.6rem)]">
              {FRASES.trocaDecide}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
