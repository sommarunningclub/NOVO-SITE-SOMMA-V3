"use client";

import { CATEGORIAS } from "@/lib/o-longao/copy";
import { EASE, gsap, maskReveal, riseIn, useScope } from "../_motion";
import { FitLines } from "./FitLines";

/**
 * Categorias: dois painéis de pit wall, um por grid.
 *
 * Sem enfeite de propósito: MASCULINO e FEMININO preenchem cada painel,
 * o número de finalistas fica em âmbar de cronometragem e a rampa de
 * energia fecha o painel como uma linha de largada.
 */
export function Categorias() {
  const root = useScope<HTMLElement>(({ root }) => {
    riseIn(root.querySelectorAll(".cat-head"), { trigger: root, start: "top 80%" });

    const grid = root.querySelector(".cat-grid") ?? root;
    riseIn(root.querySelectorAll(".cat-painel"), { trigger: grid, start: "top 78%", stagger: 0.14 });
    maskReveal(root.querySelectorAll(".cat-titulo > *"), { trigger: grid, start: "top 74%" });
    riseIn(root.querySelectorAll(".cat-vagas"), { trigger: grid, start: "top 74%", stagger: 0.14 });

    // A barra de energia varre da esquerda, como bandeirada de largada.
    gsap.fromTo(
      root.querySelectorAll(".cat-bar"),
      { scaleX: 0, transformOrigin: "left center" },
      {
        scaleX: 1,
        duration: 1.1,
        ease: EASE.drive,
        stagger: 0.16,
        scrollTrigger: { trigger: grid, start: "top 70%", once: true },
      }
    );

    riseIn(root.querySelectorAll(".cat-nota"), { trigger: grid, start: "top 60%" });
  });

  return (
    <section
      ref={root}
      id="categorias"
      className="lgo-section relative scroll-mt-16 overflow-hidden"
      aria-labelledby="categorias-titulo"
    >
      <div className="lgo-wrap">
        <h2 id="categorias-titulo" className="cat-head lgo-label text-[color:var(--somma)]">
          {CATEGORIAS.kicker}
        </h2>

        <div className="cat-grid mt-8 grid gap-4 md:mt-12 md:grid-cols-2 md:gap-6">
          {CATEGORIAS.itens.map((item, i) => {
            // "4 finalistas" vem inteiro do copy: número gigante, palavra em rótulo.
            const [numero, ...resto] = item.vagas.split(" ");
            return (
              <article key={item.titulo} className="cat-painel lgo-panel flex flex-col p-6 sm:p-8 md:p-10">
                <span className="lgo-label text-[color:rgba(242,240,236,0.4)]" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>

                <h3 className="mt-6">
                  <FitLines
                    linhas={[item.titulo]}
                    maskClass="cat-titulo"
                    // --avail desconta o padding do painel; no desktop, também a metade do grid.
                    className="[--avail:calc(100vw_-_2*var(--gutter)_-_3rem)] md:[--avail:calc((min(1440px,100vw)_-_2*var(--gutter))*0.5_-_5.75rem)]"
                    max="8rem"
                    min="2rem"
                  />
                </h3>

                <p className="cat-vagas mt-8 flex items-baseline gap-3 text-[color:var(--sinal)] md:mt-10">
                  <span className="lgo-num text-[clamp(3.2rem,10vw,5.5rem)] font-bold leading-none">
                    {numero}
                  </span>
                  <span className="lgo-label">{resto.join(" ")}</span>
                </p>

                <span className="cat-bar lgo-energia-line mt-8 block w-full md:mt-10" aria-hidden />
              </article>
            );
          })}
        </div>

        <p className="cat-nota mt-8 max-w-[52ch] text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.6)] md:mt-10">
          {CATEGORIAS.nota}
        </p>
      </div>
    </section>
  );
}
