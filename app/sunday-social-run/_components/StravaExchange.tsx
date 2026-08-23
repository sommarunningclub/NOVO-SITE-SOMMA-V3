"use client";

import { COPY } from "@/lib/sunday-social-run/event.config";
import { SOMMA } from "@/lib/somma-data";
import { EASE, gsap, scramble, useScope } from "../_motion";
import { Label } from "./base";
import { LogoStrava } from "./Logos";

/**
 * Padrão de código gerado por semente fixa.
 *
 * É um grafismo, não um QR funcional: não existe código real para apontar
 * ainda, e falsificar um levaria a lugar nenhum. Determinístico para o
 * servidor e o cliente desenharem exatamente o mesmo bloco.
 */
function padraoCodigo(seed: number, n = 9): boolean[] {
  return Array.from({ length: n * n }, (_, i) => {
    const x = Math.sin(i * 91.7 + seed * 47.3) * 43758.5453;
    return x - Math.floor(x) > 0.45;
  });
}

/**
 * SCENE 09 — STRAVA EXCHANGE.
 *
 * Dois aparelhos se aproximam, os códigos se encontram, e a página escreve
 * "Connected." O Strava aparece como referência cultural — sem logo, sem API,
 * sem prometer integração que não existe. A piada é a mesma que todo corredor
 * já fez: número depois, Strava primeiro.
 */
export function StravaExchange() {
  const root = useScope<HTMLElement>(({ root }) => {
    const palco = root.querySelector<HTMLElement>(".troca-palco");
    if (!palco) return;

    const tl = gsap.timeline({
      scrollTrigger: { trigger: palco, start: "top 74%", end: "bottom 60%", scrub: 0.7 },
    });

    tl.fromTo(root.querySelector(".troca-a"), { xPercent: -46, rotate: -9 }, { xPercent: -2, rotate: -3, ease: "none" }, 0)
      .fromTo(root.querySelector(".troca-b"), { xPercent: 46, rotate: 9 }, { xPercent: 2, rotate: 3, ease: "none" }, 0)
      .fromTo(root.querySelector(".troca-faisca"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, ease: EASE.snap, duration: 0.3 }, 0.7);

    const selo = root.querySelector<HTMLElement>(".troca-selo");
    if (selo) {
      gsap
        .timeline({ scrollTrigger: { trigger: palco, start: "top 55%", once: true } })
        .fromTo(selo, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: EASE.out })
        .add(scramble(selo, COPY.strava.fecho, { duration: 1 }), "-=0.3");
    }
  });

  return (
    <section ref={root} id="strava-exchange" aria-labelledby="strava-titulo" className="ris-dark ris-section relative">
      <div className="ris-wrap grid gap-12 md:grid-cols-12 md:items-center">
        <div className="md:col-span-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Label className="text-[color:var(--gold)]">09 · 09h30</Label>
            <LogoStrava variante="marca" className="h-[15px] w-auto md:h-[17px]" />
          </div>
          <h2 id="strava-titulo" className="ris-display mt-5 text-[clamp(2.2rem,7vw,4.4rem)] leading-[0.85]">
            {COPY.strava.titulo}
          </h2>
          <p className="ris-lead mt-5 text-[clamp(1.4rem,4vw,2.2rem)] leading-tight text-[color:var(--gold-soft)]">
            {COPY.strava.headline}
          </p>
          <p className="mt-4 max-w-[34ch] text-[0.95rem] leading-relaxed opacity-65">{COPY.strava.texto}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="troca-selo ris-mono inline-flex items-center gap-3 rounded-full border border-[color:var(--gold-40)] px-4 py-2 text-[0.8rem] font-bold tracking-[0.18em] text-[color:var(--gold)]">
              <span className="ris-pulse" aria-hidden />
              {COPY.strava.fecho}
            </div>

            {/* o clube do SOMMA no Strava já existe e é público — o logo aqui
                leva para ele em vez de ser só decoração */}
            <a
              href={SOMMA.links.strava}
              target="_blank"
              rel="noopener noreferrer"
              className="ris-mono inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] px-4 py-2 text-[0.68rem] font-bold tracking-[0.12em] transition-opacity hover:opacity-70"
            >
              <LogoStrava className="h-[15px] w-auto" />
              CLUBE DO SOMMA
            </a>
          </div>
        </div>

        <div className="troca-palco relative md:col-span-7">
          <div className="relative mx-auto flex max-w-[520px] items-center justify-center">
            <Aparelho className="troca-a" nome="CORREDOR A" seed={3} />

            {/* faísca do encontro */}
            <span className="troca-faisca absolute left-1/2 top-1/2 z-10 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--gold-25)] blur-xl" aria-hidden />

            <Aparelho className="troca-b ml-4" nome="CORREDOR B" seed={11} />
          </div>

          <p className="ris-label mt-8 text-center opacity-35">
            Grafismo do evento — a troca acontece no app de cada pessoa
          </p>
        </div>
      </div>
    </section>
  );
}

function Aparelho({ nome, seed, className = "" }: { nome: string; seed: number; className?: string }) {
  const pontos = padraoCodigo(seed);

  return (
    <div className={`ris-glass w-[46%] max-w-[200px] shrink-0 p-3 md:p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="ris-label opacity-50">{nome}</span>
        <LogoStrava className="h-[13px] w-auto opacity-90" />
      </div>

      <div className="mt-3 grid aspect-square w-full grid-cols-9 gap-[2px] rounded-xl bg-white/5 p-2">
        {pontos.map((ativo, i) => (
          <span
            key={i}
            className="block h-full w-full rounded-[1px]"
            style={{ background: ativo ? "var(--gold)" : "transparent", opacity: ativo ? 0.9 : 0 }}
          />
        ))}
      </div>

      <div className="ris-mono mt-3 flex items-center justify-between text-[0.58rem]">
        <span className="opacity-60">PACE</span>
        <span className="font-bold">{seed === 3 ? "5:20" : "5:18"}</span>
      </div>
    </div>
  );
}
