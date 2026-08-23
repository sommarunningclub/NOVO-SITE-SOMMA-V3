"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { COPY, EVENT_CAPACITY, PERFIS_DEMO } from "@/lib/sunday-social-run/event.config";
import { countUp, gsap, useScope } from "../_motion";
import { Fit, Label } from "./base";

/** Grade 10 × 10 — os cem, à vista, de uma vez só. */
const COLS = 10;
const TOTAL = EVENT_CAPACITY;

/** Índices que viram perfil. Fixos para a composição não mudar a cada render. */
const DESTAQUES = [13, 26, 38, 51, 64, 77] as const;

/**
 * Dispersão determinística.
 *
 * Nada de `Math.random()`: o servidor e o cliente precisam gerar exatamente a
 * mesma posição inicial, ou a hidratação acusa diferença. Um seno embaralhado
 * dá aleatoriedade suficiente e é estável entre os dois lados.
 */
function ruido(i: number, seed: number): number {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  // Arredondado de propósito: o valor entra em `style`, e React serializa
  // float longo de um jeito no servidor e de outro no cliente — duas casas
  // matam o aviso de hidratação sem mudar nada visualmente.
  return Math.round((x - Math.floor(x)) * 100) / 100;
}

/** Centro da célula, em porcentagem da caixa — usado para ligar os perfis. */
function centro(index: number): { x: number; y: number } {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return { x: ((col + 0.5) / COLS) * 100, y: ((row + 0.5) / COLS) * 100 };
}

/**
 * SCENE 02 — ONLY 100 PEOPLE.
 *
 * A cena que vira linguagem gráfica do resto da página: cem pontos soltos que
 * se organizam, seis deles ganham rosto e ritmo, e então as linhas aparecem
 * entre eles. É a tradução visual da promessa —
 * 100 runners → 100 profiles → connections.
 */
export function HundredPeopleScene() {
  const numero = useRef<HTMLSpanElement>(null);

  const root = useScope<HTMLElement>(({ root }) => {
    const pontos = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".cem-ponto"));
    const grade = root.querySelector<HTMLElement>(".cem-grade");
    if (!grade) return;

    // 1. Os cem chegam: cada ponto parte de onde estava disperso e assenta na
    //    grade. O stagger sai do centro, como quem se agrupa em volta do ponto
    //    de encontro.
    gsap.fromTo(
      pontos,
      {
        x: (i) => (ruido(i, 1) - 0.5) * 260,
        y: (i) => (ruido(i, 2) - 0.5) * 220,
        scale: (i) => 0.2 + ruido(i, 3) * 0.5,
        opacity: 0,
      },
      {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 1.5,
        ease: "power3.out",
        stagger: { each: 0.012, from: "center", grid: [COLS, Math.ceil(TOTAL / COLS)] },
        scrollTrigger: { trigger: grade, start: "top 78%", once: true },
      }
    );

    // 2. Os perfis emergem da grade.
    gsap.fromTo(
      root.querySelectorAll<HTMLElement>(".cem-perfil"),
      { scale: 0.3, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.9,
        ease: "back.out(1.8)",
        stagger: 0.09,
        scrollTrigger: { trigger: grade, start: "top 52%", once: true },
      }
    );

    // 3. As conexões se desenham entre eles.
    const linhas = gsap.utils.toArray<SVGPathElement>(root.querySelectorAll(".cem-conexao"));
    for (const linha of linhas) {
      const len = linha.getTotalLength();
      gsap.set(linha, { strokeDasharray: len, strokeDashoffset: len });
    }
    gsap.to(linhas, {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: "power2.inOut",
      stagger: 0.12,
      scrollTrigger: { trigger: grade, start: "top 42%", once: true },
    });

    // Respiração: depois de assentados, os pontos comuns oscilam de leve. É o
    // que impede a grade de parecer um gráfico morto.
    gsap.to(pontos, {
      y: (i) => (ruido(i, 4) - 0.5) * 6,
      duration: 3,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      stagger: { each: 0.02, from: "random" },
      delay: 1.6,
    });

    if (numero.current) countUp(numero.current, TOTAL, { trigger: grade });
  });

  // Fallback do contador para quem pediu menos movimento: o número já está lá.
  useEffect(() => {
    if (!numero.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      numero.current.textContent = String(TOTAL);
    }
  }, []);

  const perfilPorIndice = new Map<number, (typeof PERFIS_DEMO)[number]>(
    DESTAQUES.map((idx, i) => [idx, PERFIS_DEMO[i]])
  );

  return (
    <section
      ref={root}
      id="cem"
      aria-labelledby="cem-titulo"
      className="ris-dark ris-section relative overflow-hidden"
    >
      <div className="ris-wrap grid items-center gap-10 md:grid-cols-12 md:gap-12">
        {/* Texto */}
        <div className="md:col-span-5">
          <Label className="text-[color:var(--somma)]">02 · Vagas</Label>

          <h2 id="cem-titulo" className="mt-5">
            <Fit linhas={COPY.cem.titulo} col={5} max="7rem" min="2.4rem" />
          </h2>

          <p className="ris-lead mt-5 text-[clamp(1.4rem,4vw,2.1rem)] leading-tight">{COPY.cem.linha}</p>
          <p className="mt-4 max-w-[34ch] text-[0.95rem] leading-relaxed opacity-70">{COPY.cem.texto}</p>

          <div className="mt-8 flex items-end gap-8 border-t border-[color:var(--line)] pt-6">
            <div>
              <div className="ris-mono text-[3rem] font-bold leading-none md:text-[4rem]">
                <span ref={numero}>{TOTAL}</span>
              </div>
              <div className="ris-label mt-2 opacity-55">Vagas · limite absoluto</div>
            </div>
            <p className="ris-lead pb-2 text-[1.2rem] leading-tight opacity-80">
              Não tem
              <br />
              segunda leva.
            </p>
          </div>
        </div>

        {/* A grade dos cem */}
        <div className="md:col-span-7">
          <div className="cem-grade relative mx-auto aspect-square w-full max-w-[520px]">
            {/* conexões entre os perfis */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              {DESTAQUES.map((idx, i) => {
                const proximo = DESTAQUES[(i + 1) % DESTAQUES.length];
                const a = centro(idx);
                const b = centro(proximo);
                // curva leve, para a ligação parecer trajeto e não teia
                const cx = (a.x + b.x) / 2 + (a.y - b.y) * 0.12;
                const cy = (a.y + b.y) / 2 + (b.x - a.x) * 0.12;
                return (
                  <path
                    key={`${idx}-${proximo}`}
                    className="cem-conexao"
                    d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
                    fill="none"
                    stroke="var(--somma)"
                    strokeWidth={0.35}
                    vectorEffect="non-scaling-stroke"
                    opacity={0.75}
                  />
                );
              })}
            </svg>

            <div
              className="grid h-full w-full"
              style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` } as CSSProperties}
            >
              {Array.from({ length: TOTAL }, (_, i) => {
                const perfil = perfilPorIndice.get(i);

                return (
                  <div key={i} className="relative flex items-center justify-center">
                    {perfil ? (
                      <div className="cem-perfil absolute z-10 flex flex-col items-center">
                        <div className="flex h-[clamp(26px,5.6vw,38px)] w-[clamp(26px,5.6vw,38px)] items-center justify-center rounded-full border border-[color:var(--somma)] bg-[color:var(--somma-15)] backdrop-blur-sm">
                          <span className="ris-mono text-[0.58rem] font-bold">{perfil.nome[0]}</span>
                        </div>
                        <span className="ris-mono mt-1 whitespace-nowrap text-[0.5rem] opacity-70">
                          {perfil.pace}
                        </span>
                      </div>
                    ) : (
                      <span
                        className="cem-ponto block h-[clamp(4px,1vw,7px)] w-[clamp(4px,1vw,7px)] rounded-full bg-current"
                        style={{ opacity: 0.28 + ruido(i, 5) * 0.4 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="ris-label mt-6 text-center opacity-35">
            Perfis ilustrativos — a grade representa a lotação, não inscrições confirmadas
          </p>
        </div>
      </div>
    </section>
  );
}
