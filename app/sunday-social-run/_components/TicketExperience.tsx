"use client";

import { useEffect } from "react";
import {
  BENEFICIOS,
  COPY,
  EVENT,
  EVENT_CAPACITY,
  TICKET_PRICE,
  dataLabel,
  vendaAberta,
  type Ato,
} from "@/lib/sunday-social-run/event.config";
import { observeSection, track } from "@/lib/sunday-social-run/analytics";
import { SOMMA } from "@/lib/somma-data";
import { gsap, useScope } from "../_motion";
import { Fit, Label, TicketCta } from "./base";

const COR_ATO: Record<Ato, string> = {
  run: "var(--somma)",
  connect: "var(--gold)",
  stay: "var(--terra)",
};

/**
 * O ingresso.
 *
 * O que a vaga entrega não vira lista com marcador: vira um mosaico de blocos
 * de tamanhos diferentes, agrupados pelo ato a que pertencem — dá para ler a
 * manhã inteira de relance. Benefícios com `ativo: false` no config (hoje, a
 * camiseta, que depende de patrocínio) simplesmente não aparecem: prometer o
 * que ainda não está fechado é o jeito mais rápido de queimar a experiência.
 *
 * Esta seção também é o destino dos CTAs enquanto o link da Hype não existe.
 */
export function TicketExperience() {
  const root = useScope<HTMLElement>(({ root }) => {
    gsap.fromTo(
      root.querySelectorAll<HTMLElement>(".spot-bloco"),
      { y: 30, opacity: 0, scale: 0.97 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.85,
        ease: "power3.out",
        stagger: { each: 0.06, from: "start" },
        scrollTrigger: { trigger: root.querySelector(".spot-mosaico"), start: "top 82%", once: true },
      }
    );

    gsap.fromTo(
      root.querySelectorAll<HTMLElement>(".spot-mask > *"),
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: root, start: "top 78%", once: true },
      }
    );
  });

  useEffect(() => observeSection(root.current, "ticket_section_view"), [root]);

  const entregas = BENEFICIOS.filter((b) => b.ativo);
  const aberta = vendaAberta();

  return (
    <section ref={root} id="spot" aria-labelledby="spot-titulo" className="ris-section relative">
      <div className="ris-wrap">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <Label className="text-[color:var(--somma)]">11 · Vagas</Label>
            <h2 id="spot-titulo" className="mt-5">
              <Fit linhas={[COPY.ticket.titulo]} col={6} maskClass="spot-mask" max="9rem" min="3rem" />
            </h2>
            <p className="ris-lead mt-3 text-[clamp(1.6rem,5vw,2.6rem)] leading-none">{COPY.ticket.linha}</p>
          </div>

          {/* Cartão de compra */}
          <div className="ris-card p-6 md:col-span-6 md:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="ris-label opacity-50">Ingresso promocional</div>
                <div className="ris-mono mt-2 text-[3rem] font-bold leading-none md:text-[4rem]">
                  R$ {TICKET_PRICE}
                </div>
              </div>
              <div className="text-right">
                <div className="ris-mono text-[1.4rem] font-bold leading-none">{EVENT_CAPACITY}</div>
                <div className="ris-label mt-1.5 opacity-50">vagas</div>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[color:var(--line)] pt-5">
              <div>
                <dt className="ris-label opacity-50">Quando</dt>
                <dd className="ris-mono mt-1.5 text-[0.95rem] font-bold">{dataLabel()}</dd>
              </div>
              <div>
                <dt className="ris-label opacity-50">Onde</dt>
                <dd className="mt-1.5 text-[0.95rem] font-semibold leading-tight">
                  {EVENT.local.nome}
                  <span className="block opacity-50">{EVENT.cidade}</span>
                </dd>
              </div>
            </dl>

            {/*
              Enquanto o link da Hype não existe, o botão não pode apontar para
              a própria seção — seria um clique que não leva a lugar nenhum. Ele
              vira o canal onde a venda vai ser anunciada, que é real e está no
              ar hoje.
            */}
            {aberta ? (
              <TicketCta origem="secao_ingresso" full className="mt-7">
                {COPY.cta.principal}
              </TicketCta>
            ) : (
              <a
                href={SOMMA.links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("ticket_cta_click", { origem: "secao_ingresso_pre_venda" })}
                className="ris-btn mt-7 w-full"
              >
                ME AVISA NO @SOMMA.CLUB
              </a>
            )}

            <p className="ris-label mt-4 leading-relaxed opacity-50">
              {aberta ? COPY.ticket.texto : COPY.ticket.semLink}
            </p>

            <div className="ris-mono mt-5 flex items-center gap-2 rounded-full border border-[color:var(--line)] px-3 py-2 text-[0.62rem] font-bold">
              <span className="ris-pulse text-[color:var(--somma)]" aria-hidden />
              LIMITADO A {EVENT_CAPACITY} VAGAS
            </div>
          </div>
        </div>

        {/* O que o spot entrega */}
        <div className="spot-mosaico mt-12 md:mt-16">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="ris-display text-[clamp(1.4rem,4vw,2.2rem)] leading-none">O QUE VEM COM A VAGA</h3>
            <span className="ris-label opacity-40">{entregas.length} entregas · uma manhã</span>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {entregas.map((b, i) => (
              <div
                key={b.id}
                className={`spot-bloco ris-card flex flex-col justify-between p-4 md:p-5 ${
                  i === 0 || i === 5 ? "col-span-2" : ""
                }`}
                style={{ borderColor: `color-mix(in srgb, ${COR_ATO[b.ato]} 30%, transparent)` }}
              >
                <div className="ris-label" style={{ color: COR_ATO[b.ato] }}>
                  {b.ato}
                </div>
                <div className="mt-8">
                  <div className="ris-display text-[1.15rem] leading-none md:text-[1.5rem]">{b.titulo}</div>
                  <p className="mt-2 text-[0.85rem] leading-snug opacity-65">{b.detalhe}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
