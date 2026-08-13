"use client";

import Image from "next/image";
import Link from "next/link";
import {
  COPY,
  EVENT_PATH,
  SOMMA_BASE,
  UNITS,
  inscricoesAbertas,
} from "@/lib/desafio-esteiras/event.config";
import { track } from "@/lib/desafio-esteiras/analytics";
import { imageMask, isLowPower, maskReveal, parallax, riseIn, useScope } from "../_motion";
import { FitLines } from "./FitLines";

const VP = UNITS.find((u) => u.sommaBase)!;

/**
 * SOMMA em Vicente Pires.
 *
 * É o único bloco da página em que o laranja SOMMA domina — a troca de
 * temperatura marca, sozinha, que ali a operação é outra. O selo "SOMMA BASE"
 * é o mesmo usado no card e no mapa, para o reconhecimento ser imediato.
 */
export function SommaBase() {
  const root = useScope<HTMLElement>(({ root }) => {
    maskReveal(root.querySelectorAll(".sb-titulo > *"), { trigger: root, start: "top 74%" });
    riseIn(root.querySelectorAll(".sb-anim"), { trigger: root, start: "top 70%", stagger: 0.09 });
    imageMask(root.querySelector(".sb-foto"), root.querySelector(".sb-foto-wrap") ?? undefined);
    if (!isLowPower()) parallax(root.querySelector(".sb-foto"), 8, root);
  });

  const abertas = inscricoesAbertas();

  return (
    <section
      ref={root}
      className="dst-section dst-grain relative overflow-hidden"
      style={{ background: "var(--somma)", color: "var(--ink)" }}
      aria-labelledby="somma-titulo"
    >
      {/* diagonais que sugerem velocidade, no tom mais escuro do próprio laranja */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(72deg, #08080a 0 2px, transparent 2px 26px)",
        }}
      />

      <div className="dst-wrap relative grid items-center gap-10 md:grid-cols-12 md:gap-14">
        <div className="md:col-span-7">
          <p className="dst-label sb-anim mb-6 flex items-center gap-2">
            <span className="block h-2 w-2 rounded-full bg-[color:var(--ink)]" />
            {SOMMA_BASE.titulo}
          </p>

          <h2 id="somma-titulo" className="dst-col-7">
            <FitLines
              linhas={[
                "O SOMMA VAI",
                "ESTAR EM",
                {
                  texto: "VICENTE PIRES.",
                  style: { WebkitTextStroke: "2px #08080a", color: "transparent" },
                },
              ]}
              maskClass="sb-titulo"
              max="5.5rem"
              min="2rem"
            />
          </h2>

          <p className="sb-anim mt-7 max-w-[48ch] text-[clamp(1rem,2.6vw,1.22rem)] font-medium leading-relaxed">
            {SOMMA_BASE.explicacao} É lá que a comunidade se concentra: quem corre com o clube,
            quem quer conhecer, e quem só quer estar perto de gente que treina junto.
          </p>

          <ul className="sb-anim mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { k: "Ponto oficial", v: "Vicente Pires" },
              { k: "Equipe presente", v: "SOMMA Club" },
              { k: "Operação", v: "Evolve" },
            ].map((item) => (
              <li key={item.k} className="border-t-2 border-[color:var(--ink)] pt-3">
                <span className="dst-label block opacity-60">{item.k}</span>
                <span className="dst-display mt-1.5 block text-[1.15rem]">{item.v}</span>
              </li>
            ))}
          </ul>

          <p className="sb-anim mt-7 text-[0.9rem] leading-relaxed opacity-75">{VP.endereco}</p>

          {abertas && (
            <div className="sb-anim mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`${EVENT_PATH}/inscricao?unidade=${VP.slug}`}
                onClick={() => {
                  track("select_unit", { unidade: VP.id, origem: "secao_somma" });
                  track("begin_registration", { origem: "secao_somma", unidade: VP.id });
                }}
                className="dst-btn dst-btn--paper sm:min-w-[280px]"
              >
                {COPY.ctaSomma}
              </Link>
              <a
                href={VP.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("open_directions", { unidade: VP.id, origem: "secao_somma" })}
                className="dst-btn border-[color:var(--ink)] !bg-transparent !text-[color:var(--ink)]"
              >
                Como chegar
              </a>
            </div>
          )}
        </div>

        <div className="sb-foto-wrap relative order-first aspect-[4/5] overflow-hidden md:order-none md:col-span-5">
          <Image
            src="/desafio-esteiras-evolve/img/somma-costas.jpg"
            alt="Corredores do SOMMA Running Club na Evolve"
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            loading="lazy"
            className="sb-foto object-cover"
          />
          <span className="dst-label absolute bottom-4 left-4 max-w-[calc(100%-2rem)] bg-[color:var(--ink)] px-3 py-2 leading-relaxed text-[color:var(--somma)]">
            {SOMMA_BASE.seloLongo} · VICENTE PIRES
          </span>
        </div>
      </div>
    </section>
  );
}
