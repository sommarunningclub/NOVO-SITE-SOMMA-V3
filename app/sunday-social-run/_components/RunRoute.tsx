"use client";

import { EVENT, PELOTOES, distanciasLabel } from "@/lib/sunday-social-run/event.config";
import { gsap, useScope } from "../_motion";
import { Label } from "./base";
import { RunRouteMap } from "./RunRouteMap";

const MARCOS = [
  { id: "start", rotulo: "LARGADA", nome: EVENT.percurso.largada, hora: "07:45" as string | null },
  { id: "meio", rotulo: "EIXÃO", nome: EVENT.percurso.meio, hora: null },
  { id: "finish", rotulo: "CHEGADA", nome: EVENT.percurso.chegada, hora: "08:40" },
] as const;

/**
 * O percurso.
 *
 * O traçado exato ainda não foi homologado, então a seção assume o estado
 * "rota oficial em breve" e mostra só o que é certo: sai do Santa Monica, passa
 * pelo Eixão, volta ao Santa Monica — em três pelotões, de 5, 6 e 8 km.
 *
 * O componente já nasce preparado para o mapa: quando o traçado existir, basta
 * trocar este bloco por um mapa (o projeto já tem `@googlemaps/js-api-loader`
 * instalado). As distâncias, essas sim, já estão fechadas: 5, 6 e 8 km.
 */
export function RunRoute() {
  const root = useScope<HTMLElement>(({ root }) => {
    gsap.fromTo(
      root.querySelectorAll<HTMLElement>(".rota-marco"),
      { y: 24, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.14,
        scrollTrigger: { trigger: root, start: "top 78%", once: true },
      }
    );
  });

  return (
    <section ref={root} id="percurso" aria-labelledby="percurso-titulo" className="ris-section pt-0 md:pt-0">
      <div className="ris-wrap">
        <div className="ris-card overflow-hidden p-6 md:p-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <Label className="text-[color:var(--somma)]">Percurso</Label>
              <h2 id="percurso-titulo" className="ris-display mt-3 text-[clamp(1.8rem,5vw,3rem)] leading-none">
                SANTA MONICA → EIXÃO → SANTA MONICA
              </h2>
            </div>

            <div className="ris-mono flex items-center gap-3 rounded-full border border-[color:var(--line-strong)] py-1.5 pl-4 pr-4 text-[0.62rem] font-bold">
              <span className="ris-pulse text-[color:var(--somma)]" aria-hidden />
              ROTA OFICIAL EM BREVE
            </div>
          </div>

          {/* O traçado de verdade, com o pelotão andando por cima dele */}
          <RunRouteMap className="mt-8" />

          <div className="relative mt-8">
            <div className="grid grid-cols-3 gap-3">
              {MARCOS.map((m) => (
                <div key={m.id} className="rota-marco">
                  <div className="ris-label text-[color:var(--somma)]">{m.rotulo}</div>
                  <div className="mt-2 text-[0.95rem] font-semibold leading-tight md:text-[1.1rem]">{m.nome}</div>
                  {m.hora && <div className="ris-mono mt-1 text-[0.75rem] opacity-50">{m.hora}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Os três pelotões */}
          <div className="mt-8 grid gap-3 border-t border-[color:var(--line)] pt-6 md:grid-cols-3">
            {PELOTOES.map((p) => (
              <div key={p.km} className="rota-marco flex items-baseline gap-4 md:block">
                <div className="ris-mono text-[2rem] font-bold leading-none md:text-[2.6rem]">
                  {p.km}
                  <span className="ml-1 text-[0.9rem] font-medium opacity-50">km</span>
                </div>
                <div className="min-w-0 md:mt-3">
                  <div className="ris-label text-[color:var(--somma)]">{p.rotulo}</div>
                  <p className="mt-1.5 text-[0.86rem] leading-snug opacity-65">{p.texto}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[color:var(--line)] pt-5">
            <div>
              <div className="ris-mono text-[1.15rem] font-bold leading-none">{distanciasLabel}</div>
              <div className="ris-label mt-2 opacity-50">Distâncias</div>
            </div>
            <div>
              <div className="ris-mono text-[1.15rem] font-bold leading-none">55 min</div>
              <div className="ris-label mt-2 opacity-50">Janela da corrida</div>
            </div>
            <p className="max-w-[40ch] text-[0.88rem] leading-relaxed opacity-60">
              Os três pelotões largam juntos e voltam para o mesmo brunch. Ninguém fica para trás no meio do Eixão.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
