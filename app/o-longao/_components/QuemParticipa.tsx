"use client";

import { FORMATO } from "@/lib/o-longao/config";
import { EQUIPE, FRASES, QUEM_PARTICIPA } from "@/lib/o-longao/copy";
import { maskReveal, riseIn, useScope } from "../_motion";

/**
 * Quem entra no grid e como a equipe se monta.
 *
 * Duas batidas: os perfis convocados viram lista tipográfica gigante (a seção
 * fala com comunidades, não com corredor solto) e a escala vira 11 slots
 * visuais, com os números oficiais do formato ao lado. Nenhum literal de copy
 * relevante mora aqui: tudo vem de copy.ts e config.ts.
 */

type TipoSlot = "titular" | "reserva" | "capitao";

/** Os 11 lugares da escala saem dos números oficiais do formato. */
const SLOTS: { tipo: TipoSlot; tag: string }[] = [
  ...Array.from({ length: FORMATO.titulares }, (_, i) => ({
    tipo: "titular" as const,
    tag: String(i + 1).padStart(2, "0"),
  })),
  ...Array.from({ length: FORMATO.reservasMax }, () => ({
    tipo: "reserva" as const,
    tag: "RES",
  })),
  { tipo: "capitao" as const, tag: "C" },
];

const COR_SILHUETA: Record<TipoSlot, string> = {
  titular: "text-[color:rgba(242,240,236,0.34)]",
  reserva: "text-[color:rgba(242,240,236,0.16)]",
  capitao: "text-[color:rgba(255,196,0,0.55)]",
};

/** Separa a última frase para o destaque; copy de frase única cai no fluxo normal. */
function separaUltimaFrase(texto: string): { base: string; destaque: string | null } {
  const frases = texto.split(/(?<=\.)\s+/);
  const destaque = frases.pop();
  if (!destaque || frases.length === 0) return { base: texto, destaque: null };
  return { base: frases.join(" "), destaque };
}

/** Silhueta de corredor dos slots: cabeça em círculo, tronco e pernas em traço. */
function Corredor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 38" className={className} aria-hidden="true" focusable="false">
      <circle cx="17.2" cy="5" r="3.6" fill="currentColor" />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* tronco e perna da frente */}
        <path d="M16.4 10.6 13.8 20l5.7 5.6-.9 8.4" />
        {/* perna de trás */}
        <path d="M13.8 20l-5 6-3.6 6.4" />
        {/* braços */}
        <path d="M16 13.2l5.8 3.4" />
        <path d="M15.6 13l-5.6 2.6" />
      </g>
    </svg>
  );
}

export function QuemParticipa() {
  const comunidade = separaUltimaFrase(QUEM_PARTICIPA.texto);
  const assinatura = separaUltimaFrase(FRASES.vcNaoPrecisa);

  const root = useScope<HTMLElement>(({ root }) => {
    riseIn(root.querySelectorAll(".qp-head"), { trigger: root, start: "top 82%" });
    maskReveal(root.querySelectorAll(".qp-linha > *"), {
      trigger: root.querySelector(".qp-lista") ?? undefined,
      start: "top 80%",
      stagger: 0.09,
    });
    riseIn(root.querySelectorAll(".qp-texto"), {
      trigger: root.querySelector(".qp-texto") ?? undefined,
      start: "top 86%",
    });
    riseIn(root.querySelectorAll(".qp-sub"), {
      trigger: root.querySelector(".qp-equipe") ?? undefined,
      start: "top 80%",
    });
    riseIn(root.querySelectorAll(".qp-slot"), {
      trigger: root.querySelector(".qp-escala") ?? undefined,
      start: "top 80%",
      stagger: 0.05,
      y: 22,
    });
    riseIn(root.querySelectorAll(".qp-card"), {
      trigger: root.querySelector(".qp-escala") ?? undefined,
      start: "top 80%",
      stagger: 0.1,
      delay: 0.25,
    });
    maskReveal(root.querySelectorAll(".qp-assinatura > *"), {
      trigger: root.querySelector(".qp-assinatura") ?? undefined,
      start: "top 88%",
    });
  });

  return (
    <section
      ref={root}
      id="crews"
      className="lgo-section relative scroll-mt-16 overflow-hidden border-t border-[color:var(--line)]"
      aria-labelledby="crews-titulo"
    >
      <div
        aria-hidden
        className="lgo-glow right-[-14%] top-[4%] h-[42vh] w-[42vh]"
        style={{ background: "var(--sinal)", opacity: 0.12 }}
      />

      <div className="lgo-wrap relative">
        {/* ── Quem pode participar ── */}
        <h2
          id="crews-titulo"
          className="qp-head lgo-label flex items-center gap-3 text-[color:var(--somma)]"
        >
          <span aria-hidden className="block h-2 w-2 bg-current" />
          {QUEM_PARTICIPA.kicker}
        </h2>

        <ul className="qp-lista mt-8 border-t border-[color:var(--line)] md:mt-12">
          {QUEM_PARTICIPA.perfis.map((perfil) => (
            <li key={perfil} className="border-b border-[color:var(--line)]">
              <span className="lgo-mask qp-linha">
                <span>
                  <span className="flex items-center gap-4 py-4 md:gap-7 md:py-5">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 bg-[color:var(--sinal)] md:h-3.5 md:w-3.5"
                    />
                    <span className="lgo-display lgo-display-condensed text-[clamp(1.8rem,6.5vw,4.8rem)]">
                      {perfil}
                    </span>
                  </span>
                </span>
              </span>
            </li>
          ))}
        </ul>

        <p className="qp-texto mt-10 max-w-[32ch] text-[clamp(1.3rem,3.8vw,2.2rem)] font-medium leading-snug md:mt-14">
          {comunidade.destaque ? (
            <>
              {comunidade.base}{" "}
              <strong className="font-medium text-[color:var(--sinal)]">
                {comunidade.destaque}
              </strong>
            </>
          ) : (
            comunidade.base
          )}
        </p>

        {/* ── Monte sua equipe ── */}
        <div className="qp-equipe mt-20 md:mt-28">
          <h3 className="qp-sub lgo-display text-[clamp(1.7rem,5.4vw,3.4rem)]">
            {EQUIPE.kicker}
          </h3>

          <div className="qp-escala mt-8 grid gap-10 md:mt-12 md:grid-cols-12 md:gap-8 lg:gap-12">
            {/* A escala em slots: figura decorativa, os números falam nos cards */}
            <ul className="grid grid-cols-4 gap-2 sm:gap-3 md:col-span-7" aria-hidden="true">
              {SLOTS.map((slot, i) => (
                <li
                  key={`${slot.tag}-${i}`}
                  className="qp-slot lgo-slot aspect-[3/4]"
                  style={
                    slot.tipo === "reserva"
                      ? { borderStyle: "dashed", borderColor: "rgba(242,240,236,0.3)" }
                      : slot.tipo === "capitao"
                        ? { borderColor: "rgba(255,196,0,0.55)" }
                        : undefined
                  }
                >
                  <span
                    className={`absolute inset-2 grid place-items-center ${COR_SILHUETA[slot.tipo]}`}
                  >
                    <Corredor className="h-auto w-6 sm:w-8 md:w-9" />
                  </span>
                  <span
                    className={`lgo-num absolute bottom-1.5 left-2 text-[0.62rem] font-bold sm:bottom-2 sm:left-2.5 sm:text-[0.7rem] ${
                      slot.tipo === "capitao"
                        ? "text-[color:var(--sinal)]"
                        : "text-[color:rgba(242,240,236,0.45)]"
                    }`}
                  >
                    {slot.tag}
                  </span>
                </li>
              ))}
            </ul>

            {/* Os números da equipe */}
            <ul className="grid grid-cols-2 gap-3 md:col-span-5 md:content-start">
              {EQUIPE.itens.map((item) => (
                <li key={item.rotulo} className="qp-card lgo-panel p-4 sm:p-5">
                  <p className="lgo-num text-[clamp(2.2rem,6vw,3.4rem)] font-bold leading-none text-[color:var(--papel)]">
                    {item.valor}
                  </p>
                  <p className="lgo-label mt-3 text-[color:rgba(242,240,236,0.45)]">
                    {item.rotulo}
                  </p>
                  <p className="mt-2 text-[0.82rem] leading-relaxed text-[color:rgba(242,240,236,0.62)]">
                    {item.texto}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Assinatura da seção */}
        <div className="mt-16 border-t border-[color:var(--line)] pt-10 md:mt-24 md:pt-14">
          <p className="lgo-mask qp-assinatura">
            <span>
              <span className="lgo-display block max-w-[26ch] text-[clamp(1.45rem,4.4vw,3rem)]">
                {assinatura.destaque ? (
                  <>
                    <span className="text-[color:rgba(242,240,236,0.5)]">{assinatura.base}</span>{" "}
                    {assinatura.destaque}
                  </>
                ) : (
                  assinatura.base
                )}
              </span>
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
