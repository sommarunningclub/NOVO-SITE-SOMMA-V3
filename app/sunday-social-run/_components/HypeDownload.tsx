"use client";

import { HYPE_APP, HYPE_FEATURES, TICKET_PRICE, EVENT_CAPACITY } from "@/lib/sunday-social-run/event.config";
import { track } from "@/lib/sunday-social-run/analytics";
import { gsap, useScope } from "../_motion";
import { Label } from "./base";
import { LogoHypeOn } from "./Logos";

/** Ícone genérico de download — sem reproduzir as marcas das lojas. */
function Baixar({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const LOJAS = [
  { id: "ios", rotulo: "Baixar para iPhone", sub: "App Store", href: HYPE_APP.ios },
  { id: "android", rotulo: "Baixar para Android", sub: "Google Play", href: HYPE_APP.android },
] as const;

/**
 * BAIXE O APP — o passo prático da Hype On.
 *
 * A seção anterior conta a ideia; esta resolve a ação. Os dois links são os
 * oficiais das lojas, cada clique é medido separadamente (`outbound_hype_click`
 * com a plataforma), e o texto deixa claro o que a pessoa faz depois de
 * instalar — porque baixar app sem saber para quê é onde a maioria desiste.
 */
export function HypeDownload() {
  const root = useScope<HTMLElement>(({ root }) => {
    gsap.fromTo(
      root.querySelectorAll<HTMLElement>(".baixar-item"),
      { y: 24, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.09,
        scrollTrigger: { trigger: root, start: "top 80%", once: true },
      }
    );
  });

  return (
    <section ref={root} id="baixar-app" aria-labelledby="baixar-titulo" className="ris-dark ris-section pt-0 md:pt-0">
      <div className="ris-wrap">
        <div className="ris-glass overflow-hidden p-6 md:p-10">
          <div className="grid gap-10 md:grid-cols-12 md:items-center md:gap-12">
            <div className="md:col-span-7">
              <div className="baixar-item flex flex-wrap items-center gap-x-4 gap-y-2">
                <Label className="text-[color:var(--gold)]">Passo 1</Label>
                <LogoHypeOn className="h-[18px] w-auto text-[color:var(--gold)] md:h-5" />
              </div>

              <h2 id="baixar-titulo" className="baixar-item ris-display mt-5 text-[clamp(1.9rem,5.4vw,3.2rem)] leading-[0.92]">
                BAIXE O APP E GARANTA SUA VAGA
              </h2>

              <p className="baixar-item ris-lead mt-4 max-w-[38ch] text-[clamp(1.05rem,2.6vw,1.35rem)] text-[color:var(--gold-soft)]">
                A Hype On é onde a vaga é vendida — e onde você descobre quem mais vai estar lá.
              </p>

              <p className="baixar-item mt-4 max-w-[46ch] text-[0.95rem] leading-relaxed opacity-70">
                São {EVENT_CAPACITY} vagas a R$ {TICKET_PRICE}. Depois de instalar, é só criar seu perfil, comprar o
                ingresso e ver a lista de confirmados crescer até domingo.
              </p>

              <div className="baixar-item mt-8 flex flex-col gap-3 sm:flex-row">
                {LOJAS.map((loja) => (
                  <a
                    key={loja.id}
                    href={loja.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("outbound_hype_click", { origem: "download_app", plataforma: loja.id })}
                    className="ris-btn flex-1 !justify-start gap-3 !px-6"
                    data-variant={loja.id === "ios" ? undefined : "cream"}
                  >
                    <Baixar />
                    <span className="flex flex-col items-start leading-none">
                      <span className="text-[0.72rem]">{loja.rotulo}</span>
                      <span className="mt-1 text-[0.58rem] font-normal tracking-[0.14em] opacity-70">{loja.sub}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* O que o app faz por você, em lista curta */}
            <ul className="md:col-span-5">
              {HYPE_FEATURES.slice(0, 4).map((f) => (
                <li key={f.id} className="baixar-item flex gap-3 border-b border-white/10 py-3.5 last:border-0">
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--gold)]" aria-hidden />
                  <span>
                    <span className="block text-[0.98rem] font-semibold">{f.titulo}</span>
                    <span className="mt-0.5 block text-[0.88rem] leading-snug opacity-65">{f.detalhe}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
