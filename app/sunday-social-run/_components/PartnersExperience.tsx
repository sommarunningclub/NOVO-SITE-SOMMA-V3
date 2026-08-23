"use client";

import Link from "next/link";
import { COMMUNITY_SIZE, EVENT_CAPACITY, PARTNER_SLOTS } from "@/lib/sunday-social-run/event.config";
import { countUp, gsap, useScope } from "../_motion";
import { Label } from "./base";

/**
 * As marcas.
 *
 * Sem grade de logos gigantes e, principalmente, sem marca inventada: cada
 * categoria aparece como uma vaga de experiência, com o estado real dela. Quando
 * um parceiro fechar, basta preencher `marca` no config que o bloco troca de
 * estado sozinho.
 *
 * O convite comercial aponta para a página de parceria que o site já tem.
 */
export function PartnersExperience() {
  const root = useScope<HTMLElement>(({ root }) => {
    gsap.fromTo(
      root.querySelectorAll<HTMLElement>(".marca-slot"),
      { y: 24, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.05,
        scrollTrigger: { trigger: root.querySelector(".marca-grade"), start: "top 84%", once: true },
      }
    );

    const alvo = root.querySelector<HTMLElement>(".marca-comunidade");
    if (alvo) countUp(alvo, COMMUNITY_SIZE, { trigger: root, suffix: "+" });
  });

  return (
    <section ref={root} id="marcas" aria-labelledby="marcas-titulo" className="ris-section pt-0 md:pt-0">
      <div className="ris-wrap">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <Label className="text-[color:var(--somma)]">Parceiros</Label>
            <h2 id="marcas-titulo" className="ris-display mt-5 text-[clamp(2rem,6vw,4rem)] leading-[0.88]">
              MARCAS QUE CORREM COM A GENTE
            </h2>
          </div>
          <p className="max-w-[38ch] text-[0.95rem] leading-relaxed opacity-70 md:col-span-5 md:pb-2">
            As marcas não entram como logo em banner. Entram como experiência dentro da manhã — no check-in, no
            percurso, na chegada e no After Pace.
          </p>
        </div>

        <div className="marca-grade mt-10 grid grid-cols-2 gap-3 md:mt-14 md:grid-cols-4">
          {PARTNER_SLOTS.map((slot) => (
            <div key={slot.id} className="marca-slot ris-card flex min-h-[96px] flex-col justify-between gap-6 p-4 md:min-h-[128px] md:p-5">
              <div className="ris-label opacity-45">{slot.categoria}</div>
              {slot.marca ? (
                <div className="ris-display text-[1.2rem] leading-none">{slot.marca}</div>
              ) : (
                <div className="ris-mono text-[0.62rem] font-bold opacity-35">A CONFIRMAR</div>
              )}
            </div>
          ))}
        </div>

        {/* Convite comercial */}
        <div className="mt-10 grid gap-6 rounded-[22px] border border-[color:var(--line)] p-6 md:grid-cols-12 md:items-center md:p-8">
          <div className="md:col-span-7">
            <h3 className="ris-display text-[clamp(1.3rem,3.6vw,2rem)] leading-tight">
              SUA MARCA NO MEIO DAS 100 PESSOAS CERTAS
            </h3>
            <p className="mt-3 max-w-[46ch] text-[0.92rem] leading-relaxed opacity-70">
              Público reunido por afinidade, cinco horas de convivência e uma comunidade que já corre junto todo fim
              de semana em Brasília.
            </p>
          </div>

          <div className="flex items-end gap-8 md:col-span-5 md:justify-end">
            <div>
              <div className="ris-mono marca-comunidade text-[2rem] font-bold leading-none md:text-[2.6rem]">
                {COMMUNITY_SIZE}+
              </div>
              <div className="ris-label mt-2 opacity-50">Membros SOMMA</div>
            </div>
            <div>
              <div className="ris-mono text-[2rem] font-bold leading-none md:text-[2.6rem]">{EVENT_CAPACITY}</div>
              <div className="ris-label mt-2 opacity-50">Nesta manhã</div>
            </div>
          </div>

          <Link
            href="/seja-parceiro"
            className="ris-btn md:col-span-12 md:w-fit"
            data-variant="ghost"
          >
            QUERO PATROCINAR
          </Link>
        </div>
      </div>
    </section>
  );
}
