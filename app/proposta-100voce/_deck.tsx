"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import {
  DECK,
  ENTREGAS,
  EQUACAO,
  ETAPAS,
  MANTRA,
  NOTA_EXTRAS,
  PLANOS,
  POSICIONAMENTO,
  RESPONSABILIDADES,
  type Plano,
} from "./_data";
import { DECK_CSS } from "./_styles";

const SLIDES = [
  { id: "capa", n: "01", label: "SOMMA ENERGY RUN" },
  { id: "oportunidade", n: "02", label: "A OPORTUNIDADE" },
  { id: "experiencia", n: "03", label: "A EXPERIÊNCIA" },
  { id: "por-que", n: "04", label: "POR QUE SOMMA" },
  { id: "formatos", n: "05", label: "FORMATOS" },
  { id: "responsabilidades", n: "06", label: "RESPONSABILIDADES" },
  { id: "fechamento", n: "07", label: "VAMOS CORRER JUNTOS?" },
] as const;

const BRL = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/* ═══════════════════════════════════════════════════════════════════════════
   DECK
   ═══════════════════════════════════════════════════════════════════════════ */

export function EnergyRunDeck() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  /* Entrada de cada slide: IntersectionObserver dispara a timeline uma vez. */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const slides = Array.from(scroller.querySelectorAll<HTMLElement>("[data-slide]"));

    /* `y: 0` junto com `yPercent: 0` é obrigatório: o GSAP lê o
       `translateY(108%)` do CSS como pixels absolutos, então zerar só o
       yPercent deixaria o texto parado fora da máscara. */
    const settle = (el: HTMLElement) => {
      gsap.set(el.querySelectorAll('[data-a="mask"]'), { yPercent: 0, y: 0 });
      gsap.set(el.querySelectorAll('[data-a="up"],[data-a="fade"]'), { opacity: 1, y: 0 });
      gsap.set(el.querySelectorAll('[data-a="grow"]'), { scaleX: 1 });
      gsap.set(el.querySelectorAll('[data-a="img"]'), { opacity: 1, scale: 1 });
      el.querySelectorAll<HTMLElement>("[data-count]").forEach((n) => {
        n.textContent = BRL.format(Number(n.dataset.count));
      });
    };

    const play = (el: HTMLElement) => {
      if (el.dataset.played === "1") return;
      el.dataset.played = "1";
      if (reduce) return settle(el);

      const q = gsap.utils.selector(el);
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(q('[data-a="mask"]'), { yPercent: 0, y: 0, duration: 0.9, stagger: 0.055 }, 0)
        .to(q('[data-a="img"]'), { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" }, 0)
        .to(q('[data-a="up"]'), { opacity: 1, y: 0, duration: 0.75, stagger: 0.06 }, 0.22)
        .to(q('[data-a="fade"]'), { opacity: 1, duration: 0.9, stagger: 0.05 }, 0.3)
        .to(q('[data-a="grow"]'), { scaleX: 1, duration: 1, ease: "expo.out", stagger: 0.08 }, 0.25);

      q("[data-count]").forEach((node) => {
        const el2 = node as HTMLElement;
        const target = Number(el2.dataset.count);
        const proxy = { v: 0 };
        tl.to(
          proxy,
          {
            v: target,
            duration: 1.25,
            ease: "power2.out",
            onUpdate: () => {
              el2.textContent = BRL.format(Math.round(proxy.v));
            },
            onComplete: () => {
              el2.textContent = BRL.format(target);
            },
          },
          0.35,
        );
      });
    };

    /* O slide ativo é sempre o de maior área visível — evita flicker no meio
       da transição, quando dois slides cruzam o mesmo threshold. */
    const ratios = new Map<number, number>();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const el = e.target as HTMLElement;
          ratios.set(Number(el.dataset.index), e.intersectionRatio);
          if (e.intersectionRatio > 0.05) play(el);
        });

        let bestIndex = 0;
        let bestRatio = 0;
        ratios.forEach((ratio, i) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = i;
          }
        });
        if (bestRatio > 0) setActive(bestIndex);
      },
      { root: scroller, threshold: [0, 0.06, 0.25, 0.5, 0.75, 1] },
    );

    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const goTo = useCallback((index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const i = Math.max(0, Math.min(SLIDES.length - 1, index));
    const target = scroller.querySelector<HTMLElement>(`[data-index="${i}"]`);
    if (!target) return;
    scroller.scrollTo({ top: target.offsetTop, behavior: "smooth" });
  }, []);

  /* Teclado no desktop. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        goTo(active + 1);
      } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        goTo(active - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(SLIDES.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, goTo]);

  const last = active === SLIDES.length - 1;

  return (
    <div className="erx">
      <style dangerouslySetInnerHTML={{ __html: DECK_CSS }} />
      <div className="erx-grain" aria-hidden />

      {/* ── barra superior · mobile (padrão iOS: segmentos de progresso) ── */}
      <header className="erx-safe-t fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0A0A0A]/85 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3 px-4 pb-2.5 pt-2.5">
          <Image
            src="/100vc/logo-somma.svg"
            alt="Somma Club"
            width={72}
            height={19}
            className="h-[15px] w-auto"
            priority
          />
          <span className="text-[10px] font-light text-white/30">×</span>
          <Image
            src="/100vc/100vc_logoBranca.png"
            alt="100% Você"
            width={64}
            height={22}
            className="h-[17px] w-auto"
            priority
          />
          <span className="erx-display ml-auto text-[11px] font-semibold tracking-[.18em] text-white/45">
            {SLIDES[active].n}<span className="text-white/20">/07</span>
          </span>
        </div>
        <div className="flex gap-1 px-4">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Ir para ${s.label}`}
              onClick={() => goTo(i)}
              className="flex-1 py-2.5"
            >
              <span className="erx-seg block">
                <i style={{ transform: `scaleX(${i <= active ? 1 : 0})` }} />
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* ── rail lateral · desktop ─────────────────────────────────────── */}
      <nav className="fixed right-8 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goTo(i)}
            className="group flex items-center justify-end gap-3"
            aria-label={s.label}
            aria-current={i === active}
          >
            <span
              className={`erx-display text-[10px] font-semibold tracking-[.2em] transition-all duration-300 ${
                i === active ? "text-[#FF2C04] opacity-100" : "text-white/45 opacity-0 group-hover:opacity-100"
              }`}
            >
              {s.label}
            </span>
            <span
              className={`block h-px transition-all duration-500 ${
                i === active ? "w-9 bg-[#FF2C04]" : "w-4 bg-white/25 group-hover:w-6 group-hover:bg-white/60"
              }`}
            />
          </button>
        ))}
      </nav>

      {/* ── rodapé fixo · desktop ──────────────────────────────────────────
          Some na capa e no fechamento: esses slides já trazem o lockup no
          próprio conteúdo, e as duas versões colidiriam. */}
      <div
        className={`pointer-events-none fixed bottom-6 left-[clamp(1.25rem,5vw,5.5rem)] z-50 hidden items-center gap-4 transition-opacity duration-500 md:flex ${
          active === 0 || active === SLIDES.length - 1 ? "opacity-0" : "opacity-100"
        }`}
      >
        <Image
          src="/100vc/logo-somma.svg"
          alt="Somma Club"
          width={92}
          height={25}
          className="h-[17px] w-auto opacity-70"
        />
        <span className="text-[11px] font-light text-white/25">×</span>
        <Image
          src="/100vc/100vc_logoBranca.png"
          alt="100% Você"
          width={78}
          height={26}
          className="h-[19px] w-auto opacity-70"
        />
        <span className="ml-4 hidden text-[10px] uppercase tracking-[.26em] text-white/25 xl:block">
          ↑ ↓ para navegar
        </span>
      </div>

      {/* ── barra inferior · mobile ────────────────────────────────────── */}
      <footer className="erx-safe-b fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0A0A0A]/85 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase tracking-[.24em] text-white/35">
              {last ? "Proposta" : `Próximo · ${SLIDES[Math.min(active + 1, 6)].n}`}
            </p>
            <p className="erx-display truncate text-[15px] font-semibold uppercase tracking-[.06em] text-white">
              {last ? "Vamos correr juntos?" : SLIDES[Math.min(active + 1, 6)].label}
            </p>
          </div>
          <button
            type="button"
            onClick={() => goTo(last ? 0 : active + 1)}
            className="erx-btn grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FF2C04] text-black"
            aria-label={last ? "Voltar ao início" : "Próximo slide"}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
              {last ? (
                <path d="M12 19V5m0 0l-7 7m7-7l7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
              ) : (
                <path d="M12 5v14m0 0l7-7m-7 7l-7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
              )}
            </svg>
          </button>
        </div>
      </footer>

      {/* ── slides ─────────────────────────────────────────────────────── */}
      <main ref={scrollerRef} className="erx-scroller">
        <SlideCapa index={0} />
        <SlideOportunidade index={1} />
        <SlideExperiencia index={2} />
        <SlidePorQue index={3} />
        <SlideFormatos index={4} />
        <SlideResponsabilidades index={5} />
        <SlideFechamento index={6} onRestart={() => goTo(0)} />
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SLIDE 01 · CAPA
   ═══════════════════════════════════════════════════════════════════════════ */

function SlideCapa({ index }: { index: number }) {
  return (
    <Slide index={index} id="capa">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/somma/hero-background.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_35%]"
          data-a="img"
        />
        <div className="absolute inset-0 bg-[#0A0A0A]/74" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/45 to-[#0A0A0A]/85" />
        <div className="absolute inset-0 bg-[radial-gradient(75%_55%_at_18%_78%,rgba(255,44,4,.30),transparent_68%)]" />
      </div>

      <div className="erx-pad flex flex-1 flex-col justify-between gap-8">
        {/* topo */}
        <div className="flex items-start justify-between gap-6" data-a="fade">
          <div className="hidden items-center gap-4 md:flex">
            <Image src="/100vc/logo-somma.svg" alt="Somma Club" width={110} height={30} className="h-5 w-auto" />
            <span className="text-sm font-light text-white/30">×</span>
            <Image
              src="/100vc/100vc_logoBranca.png"
              alt="100% Você"
              width={92}
              height={31}
              className="h-[22px] w-auto"
            />
          </div>
          <p className="erx-display text-right text-[10px] font-medium uppercase leading-[1.6] tracking-[.26em] text-white/50 sm:text-[11px]">
            Proposta de parceria
            <br />
            {DECK.periodo} · {DECK.local}
          </p>
        </div>

        {/* título */}
        <div>
          <div className="mb-6 flex items-center gap-3" data-a="fade">
            <span className="h-2 w-2 shrink-0 bg-[#FF2C04]" />
            <div className="h-2.5 w-16 overflow-hidden opacity-80 sm:w-24">
              <div className="erx-pace" />
            </div>
            <span className="erx-display text-[10px] font-semibold uppercase tracking-[.3em] text-white/60 sm:text-[11px]">
              Edição especial
            </span>
          </div>

          <h1 className="erx-display font-bold uppercase leading-[.83] tracking-[-.025em]">
            <Mask>
              <span className="block text-[clamp(3.4rem,15.5vw,11.5rem)]">Somma</span>
            </Mask>
            <Mask>
              <span className="block text-[clamp(3.4rem,15.5vw,11.5rem)] text-[#FF2C04]">Energy Run</span>
            </Mask>
          </h1>

          <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-2 sm:mt-8" data-a="up">
            <span className="text-[10px] uppercase tracking-[.3em] text-white/45 sm:text-xs">powered by</span>
            <span className="erx-display text-[clamp(1.5rem,5vw,2.75rem)] font-semibold uppercase leading-none tracking-[.01em] text-white">
              Choco Energy
            </span>
          </div>
        </div>

        {/* mantra */}
        <div>
          <div className="h-px w-full origin-left bg-white/15" data-a="grow" />
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:mt-8 sm:grid-cols-3">
            {MANTRA.map((m) => (
              <div key={m.when} className="flex items-baseline gap-4 sm:block" data-a="up">
                <span className="erx-display block w-[4.6rem] shrink-0 text-[10px] font-semibold uppercase tracking-[.28em] text-[#FF2C04] sm:mb-2 sm:w-auto">
                  {m.when}
                </span>
                <span className="erx-display text-[clamp(1.4rem,4.6vw,2.4rem)] font-semibold uppercase leading-none tracking-[-.01em]">
                  {m.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4 md:hidden" data-a="fade">
            <Image src="/100vc/logo-somma.svg" alt="Somma Club" width={96} height={26} className="h-[17px] w-auto" />
            <span className="text-xs font-light text-white/30">×</span>
            <Image
              src="/100vc/100vc_logoBranca.png"
              alt="100% Você"
              width={80}
              height={27}
              className="h-[19px] w-auto"
            />
          </div>
        </div>
      </div>
    </Slide>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SLIDE 02 · A OPORTUNIDADE
   ═══════════════════════════════════════════════════════════════════════════ */

function SlideOportunidade({ index }: { index: number }) {
  return (
    <Slide index={index} id="oportunidade">
      <div className="erx-hair absolute inset-0 -z-10 opacity-70" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_45%_at_88%_12%,rgba(255,44,4,.14),transparent_70%)]" />

      <div className="erx-pad">
        <Kicker n="02" label="A oportunidade" />

        <div className="mt-7 grid gap-x-16 gap-y-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <h2 className="erx-display font-bold uppercase leading-[.88] tracking-[-.02em] text-[clamp(2.3rem,7.2vw,5.2rem)]">
            <Mask>
              <span className="block">Choco Energy</span>
            </Mask>
            <Mask>
              <span className="block">
                no momento <span className="text-[#FF2C04]">certo</span>.
              </span>
            </Mask>
          </h2>

          <div className="max-w-lg space-y-4 text-[clamp(.9rem,1.35vw,1.05rem)] leading-[1.65] text-white/60">
            <p data-a="up">
              Existe um momento em que energia, performance e comunidade se encontram.
            </p>
            <p data-a="up">
              Todos os sábados, o Somma reúne corredores que acordam cedo para correr, se desafiar e se
              conectar.
            </p>
            <p className="font-medium text-white" data-a="up">
              É exatamente nesse contexto que Choco Energy pode entrar.
            </p>
          </div>
        </div>

        {/* equação */}
        <div className="mt-10 sm:mt-14">
          <div className="h-px w-full origin-left bg-white/12" data-a="grow" />

          <div className="mt-8 grid gap-5 sm:gap-6 md:grid-cols-3">
            {EQUACAO.map((item, i) => (
              <div key={item.titulo} className="relative" data-a="up">
                {i > 0 && (
                  <span
                    className="erx-display absolute -left-4 top-1 hidden text-2xl font-medium text-[#FF2C04] md:block"
                    aria-hidden
                  >
                    +
                  </span>
                )}
                <div className="flex items-baseline gap-3">
                  <span className="erx-display text-[10px] font-semibold tracking-[.24em] text-white/25">
                    {item.n}
                  </span>
                  <h3 className="erx-display text-[clamp(1.3rem,3.2vw,1.9rem)] font-semibold uppercase leading-none tracking-[-.005em]">
                    {item.titulo}
                  </h3>
                </div>
                <p className="mt-2.5 max-w-xs text-[13px] leading-[1.6] text-white/45 md:text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-col gap-5 border-t border-white/12 pt-7 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="flex items-baseline gap-4" data-a="up">
              <span className="erx-display text-[clamp(1.8rem,5vw,2.6rem)] font-medium leading-none text-[#FF2C04]">
                =
              </span>
              <span className="erx-display text-[clamp(1.6rem,5.4vw,3.1rem)] font-bold uppercase leading-none tracking-[-.02em]">
                Somma Energy Run
              </span>
            </div>
            <p
              className="max-w-md border-l-2 border-[#FF2C04] pl-4 text-[13px] leading-[1.55] text-white/55 md:text-sm"
              data-a="up"
            >
              Não é apenas exposição. É <strong className="font-semibold text-white">contexto de consumo</strong>,{" "}
              <strong className="font-semibold text-white">experiência</strong> e{" "}
              <strong className="font-semibold text-white">comunidade</strong> no mesmo sábado.
            </p>
          </div>
        </div>
      </div>
    </Slide>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SLIDE 03 · A EXPERIÊNCIA
   ═══════════════════════════════════════════════════════════════════════════ */

function SlideExperiencia({ index }: { index: number }) {
  return (
    <Slide index={index} id="experiencia">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/somma/PDCSK21FEV-1794.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-30"
          data-a="img"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/88 to-[#0A0A0A]" />
      </div>

      <div className="erx-pad">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker n="03" label="A experiência" />
            <h2 className="erx-display mt-6 font-bold uppercase leading-[.88] tracking-[-.02em] text-[clamp(2.1rem,6.6vw,4.6rem)]">
              <Mask>
                <span className="block">Um sábado.</span>
              </Mask>
              <Mask>
                <span className="block">
                  Uma experiência <span className="text-[#FF2C04]">completa</span>.
                </span>
              </Mask>
            </h2>
          </div>
          <div className="hidden items-center gap-2 lg:flex" data-a="fade">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF2C04] erx-pulse" />
            <span className="erx-display text-[10px] uppercase tracking-[.26em] text-white/40">
              Parque da Cidade · 7h
            </span>
          </div>
        </div>

        {/* trilha */}
        <div className="relative mt-9 sm:mt-12">
          <div
            className="absolute left-0 top-0 hidden h-px w-full origin-left bg-white/22 md:block"
            data-a="grow"
            aria-hidden
          />
          <div className="grid gap-8 md:grid-cols-3 md:gap-7">
            {ETAPAS.map((etapa) => (
              <article key={etapa.id} className="relative md:pt-8" data-a="up">
                <span
                  className="absolute -top-1 left-0 hidden h-2 w-2 bg-[#FF2C04] md:block"
                  aria-hidden
                />
                <div className="flex items-center gap-3">
                  <span className="erx-display text-[clamp(2.2rem,6vw,3.4rem)] font-bold leading-none text-white/12">
                    {etapa.n}
                  </span>
                  <div className="flex flex-col">
                    <span className="erx-display text-[9px] font-semibold uppercase tracking-[.28em] text-[#FF2C04]">
                      {etapa.fase}
                    </span>
                    <span className="erx-display text-[10px] font-medium uppercase tracking-[.24em] text-white/50">
                      {etapa.eixo}
                    </span>
                  </div>
                </div>

                <h3 className="erx-display mt-3 text-[clamp(1.35rem,3.4vw,1.85rem)] font-semibold uppercase leading-none tracking-[-.005em]">
                  {etapa.titulo}
                </h3>

                <ul className="mt-4 space-y-2">
                  {etapa.itens.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[13px] leading-[1.55] text-white/55 md:text-sm">
                      <span className="mt-[7px] h-px w-2.5 shrink-0 bg-[#FF2C04]/70" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {etapa.modos && (
                  <div className="mt-4 grid gap-px overflow-hidden border border-white/12 bg-white/[.07]">
                    {etapa.modos.map((m) => (
                      <div key={m.nome} className="bg-[#0E0D0C] px-3.5 py-2.5">
                        <p className="erx-display text-[13px] font-semibold uppercase tracking-[.06em] text-white">
                          {m.nome}
                        </p>
                        <p className="text-[11.5px] leading-tight text-white/45">{m.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </Slide>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SLIDE 04 · POR QUE SOMMA
   ═══════════════════════════════════════════════════════════════════════════ */

function SlidePorQue({ index }: { index: number }) {
  return (
    <Slide index={index} id="por-que">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(65%_50%_at_12%_18%,rgba(255,44,4,.16),transparent_66%)]" />
      <span className="erx-ghost bottom-[-2vw] right-[-1vw] hidden text-[19vw] lg:block" aria-hidden>
        SOMMA
      </span>

      <div className="erx-pad">
        <Kicker n="04" label="Por que Somma" />

        <h2 className="erx-display mt-6 max-w-[19ch] font-bold uppercase leading-[.88] tracking-[-.02em] text-[clamp(2.05rem,6.4vw,4.6rem)]">
          <Mask>
            <span className="block">Não é sobre</span>
          </Mask>
          <Mask>
            <span className="block text-white/35">distribuir produto.</span>
          </Mask>
          <Mask>
            <span className="block">
              É sobre fazer parte <span className="text-[#FF2C04]">do momento</span>.
            </span>
          </Mask>
        </h2>

        <div className="mt-9 grid gap-x-14 gap-y-8 lg:grid-cols-[1fr_.9fr] lg:items-start">
          <div>
            <p className="erx-display text-[10px] font-semibold uppercase tracking-[.26em] text-white/35" data-a="fade">
              O que o Somma entrega
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-px border border-white/10 bg-white/10 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {ENTREGAS.map((e) => (
                <li
                  key={e}
                  className="erx-display bg-[#0C0B0B] px-3 py-4 text-[11.5px] font-semibold uppercase leading-none tracking-[.1em] text-white/75 sm:text-[12.5px]"
                  data-a="fade"
                >
                  {e}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative border-l-2 border-[#FF2C04] pl-5 sm:pl-7" data-a="up">
            <p className="text-[clamp(1rem,1.85vw,1.35rem)] font-light leading-[1.5] text-white/85">
              {POSICIONAMENTO}
            </p>
            <p className="erx-display mt-5 text-[11px] font-semibold uppercase tracking-[.22em] text-[#FF2C04]">
              Comunidade · Contexto · Relevância
            </p>
          </div>
        </div>
      </div>
    </Slide>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SLIDE 05 · FORMATOS DE PARCERIA
   ═══════════════════════════════════════════════════════════════════════════ */

function SlideFormatos({ index }: { index: number }) {
  return (
    <Slide index={index} id="formatos">
      <div className="erx-hair absolute inset-0 -z-10 opacity-50" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(58%_46%_at_50%_4%,rgba(255,44,4,.15),transparent_66%)]" />

      <div className="erx-pad">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <Kicker n="05" label="Formatos de parceria" />
            <h2 className="erx-display mt-5 font-bold uppercase leading-[.9] tracking-[-.02em] text-[clamp(1.9rem,5.4vw,3.6rem)]">
              <Mask>
                <span className="block">
                  Três formas de <span className="text-[#FF2C04]">entrar</span>.
                </span>
              </Mask>
            </h2>
          </div>
          <p className="max-w-xs text-[13px] leading-[1.55] text-white/45" data-a="fade">
            Todos os formatos acontecem dentro de um treino Somma real, com a comunidade presente.
          </p>
        </div>

        <div className="mt-7 grid items-stretch gap-4 sm:mt-8 md:grid-cols-3 md:gap-3 lg:gap-5 xl:mt-10">
          {PLANOS.map((p) => (
            <PlanoCard key={p.id} plano={p} />
          ))}
        </div>
      </div>
    </Slide>
  );
}

function PlanoCard({ plano }: { plano: Plano }) {
  const hero = !!plano.destaque;

  return (
    <article
      className={`erx-card flex flex-col ${hero ? "erx-card--hero lg:-my-3 lg:z-10" : ""}`}
      data-a="up"
    >
      {hero && (
        <div className="flex items-center justify-between gap-3 bg-[#FF2C04] px-5 py-2">
          <span className="erx-display text-[10px] font-bold uppercase tracking-[.26em] text-black">
            {plano.selo}
          </span>
          <span className="erx-display hidden whitespace-nowrap text-[10px] font-semibold uppercase tracking-[.16em] text-black/65 sm:inline md:hidden lg:inline">
            Melhor custo-benefício
          </span>
        </div>
      )}

      <div className={`flex flex-1 flex-col p-5 md:p-4 lg:p-5 xl:p-6 ${hero ? "" : "lg:pt-9"}`}>
        <header>
          <h3
            className={`erx-display text-[clamp(1.35rem,3.4vw,1.95rem)] font-bold uppercase leading-none tracking-[-.01em] ${
              hero ? "text-white" : "text-white/85"
            }`}
          >
            {plano.nome}
          </h3>
          <p className="mt-2 max-w-[34ch] text-[12.5px] leading-[1.5] text-white/45 md:min-h-[2.6rem]">
            {plano.resumo}
          </p>
        </header>

        <div className="mt-4 flex items-baseline gap-1.5 border-t border-white/10 pt-4">
          <span className={`erx-display text-base font-medium ${hero ? "text-[#FF2C04]" : "text-white/40"}`}>
            R$
          </span>
          <span
            className={`erx-display font-bold leading-none tracking-[-.03em] ${
              hero
                ? "text-[clamp(2.9rem,8.5vw,4.4rem)] text-[#FF2C04]"
                : "text-[clamp(2.2rem,6.5vw,3.1rem)] text-white"
            }`}
            data-count={plano.valor}
          >
            0
          </span>
        </div>

        {plano.heranca && (
          <p className="erx-display mt-4 text-[10.5px] font-semibold uppercase tracking-[.2em] text-[#FF2C04]">
            {plano.heranca}
          </p>
        )}

        <ul className={`space-y-2 md:flex-1 ${plano.heranca ? "mt-3" : "mt-4"}`}>
          {plano.itens.map((item) => (
            <li key={item} className="flex gap-2.5 text-[12.5px] leading-[1.5] text-white/65 sm:text-[13px]">
              <svg
                width="11"
                height="11"
                viewBox="0 0 12 12"
                fill="none"
                className={`mt-[5px] shrink-0 ${hero ? "text-[#FF2C04]" : "text-white/30"}`}
                aria-hidden
              >
                <path d="M1 6.4l3.2 3.2L11 2.4" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {plano.nota && (
          <p className="mt-5 border-t border-white/10 pt-3.5 text-[11px] leading-[1.5] text-white/35">
            {plano.nota}
          </p>
        )}
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SLIDE 06 · RESPONSABILIDADES
   ═══════════════════════════════════════════════════════════════════════════ */

function SlideResponsabilidades({ index }: { index: number }) {
  return (
    <Slide index={index} id="responsabilidades">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/somma/SMSPD-372.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-[.14]"
          data-a="img"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/90 to-[#0A0A0A]" />
      </div>

      <div className="erx-pad">
        <Kicker n="06" label="Responsabilidades" />

        <h2 className="erx-display mt-6 font-bold uppercase leading-[.88] tracking-[-.02em] text-[clamp(1.95rem,6vw,4.2rem)]">
          <Mask>
            <span className="block">Nós criamos a experiência.</span>
          </Mask>
          <Mask>
            <span className="block text-[#FF2C04]">Vocês potencializam a marca.</span>
          </Mask>
        </h2>

        <div className="mt-9 grid gap-px border border-white/12 bg-white/12 md:grid-cols-2">
          <ColunaResp titulo="SOMMA" sub="Experiência e comunidade" itens={RESPONSABILIDADES.somma} accent />
          <ColunaResp titulo="100% VOCÊ" sub="Produto e marca" itens={RESPONSABILIDADES.marca} />
        </div>

        <p
          className="mt-5 flex items-start gap-3 text-[12px] leading-[1.55] text-white/40 sm:text-[13px]"
          data-a="fade"
        >
          <span className="erx-display mt-px shrink-0 text-[#FF2C04]">*</span>
          {NOTA_EXTRAS}
        </p>
      </div>
    </Slide>
  );
}

function ColunaResp({
  titulo,
  sub,
  itens,
  accent,
}: {
  titulo: string;
  sub: string;
  itens: readonly string[];
  accent?: boolean;
}) {
  return (
    <div className="bg-[#0B0A0A] p-5 sm:p-7" data-a="up">
      <div className="flex items-baseline gap-3">
        <span className={`h-2 w-2 shrink-0 ${accent ? "bg-[#FF2C04]" : "bg-white/30"}`} aria-hidden />
        <h3 className="erx-display text-[clamp(1.4rem,3.6vw,2.1rem)] font-bold uppercase leading-none tracking-[-.01em]">
          {titulo}
        </h3>
      </div>
      <p className="erx-display mt-2 pl-5 text-[10px] font-semibold uppercase tracking-[.24em] text-white/35">
        {sub}
      </p>
      <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
        {itens.map((item) => (
          <li
            key={item}
            className="flex gap-2.5 border-b border-white/[.07] pb-2 text-[12.5px] leading-[1.45] text-white/65 sm:text-[13px]"
          >
            <span
              className={`mt-[8px] h-px w-2.5 shrink-0 ${accent ? "bg-[#FF2C04]/70" : "bg-white/25"}`}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SLIDE 07 · FECHAMENTO
   ═══════════════════════════════════════════════════════════════════════════ */

function SlideFechamento({ index, onRestart }: { index: number; onRestart: () => void }) {
  return (
    <Slide index={index} id="fechamento">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/somma/IMG_1479_JPG.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[50%_40%] opacity-30"
          data-a="img"
        />
        <div className="absolute inset-0 bg-[#0A0A0A]/78" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/35 to-[#0A0A0A]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_100%,rgba(255,44,4,.26),transparent_70%)]" />
      </div>

      <div className="erx-pad flex flex-1 flex-col justify-between gap-10">
        <div className="flex items-center gap-3" data-a="fade">
          <span className="erx-display text-[10px] font-semibold uppercase tracking-[.3em] text-white/45">
            07 — Fechamento
          </span>
          <span className="h-px flex-1 bg-white/12" />
        </div>

        <div>
          <h2 className="erx-display font-bold uppercase leading-[.85] tracking-[-.025em] text-[clamp(2.6rem,10.5vw,8rem)]">
            <Mask>
              <span className="block">Transformar energia</span>
            </Mask>
            <Mask>
              <span className="block">
                em <span className="text-[#FF2C04]">experiência</span>.
              </span>
            </Mask>
          </h2>

          <div className="mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-1" data-a="up">
            <span className="erx-display text-[clamp(1.15rem,3.4vw,1.85rem)] font-semibold uppercase tracking-[.02em]">
              Somma Energy Run
            </span>
            <span className="text-[11px] uppercase tracking-[.26em] text-white/65 sm:text-xs">
              powered by Choco Energy
            </span>
          </div>

          <p className="erx-display mt-3 text-[11px] font-medium uppercase tracking-[.28em] text-white/60 sm:text-xs" data-a="up">
            {DECK.periodo} · {DECK.local}
          </p>
        </div>

        <div>
          <div className="h-px w-full origin-left bg-white/15" data-a="grow" />
          <div className="mt-7 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <div data-a="up">
              <div className="flex items-center gap-4">
                <Image
                  src="/100vc/logo-somma.svg"
                  alt="Somma Club"
                  width={128}
                  height={34}
                  className="h-[22px] w-auto sm:h-7"
                />
                <span className="text-base font-light text-white/25">×</span>
                <Image
                  src="/100vc/100vc_logoBranca.png"
                  alt="100% Você"
                  width={104}
                  height={35}
                  className="h-6 w-auto sm:h-8"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onRestart}
              className="erx-btn erx-display group inline-flex items-center gap-3 self-start bg-[#FF2C04] px-6 py-4 text-[13px] font-bold uppercase tracking-[.16em] text-black hover:bg-white sm:self-auto sm:text-[15px]"
              data-a="up"
            >
              Vamos correr juntos?
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 12h14m0 0l-6-6m6 6l-6 6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="square"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Slide>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRIMITIVOS
   ═══════════════════════════════════════════════════════════════════════════ */

function Slide({
  index,
  id,
  children,
}: {
  index: number;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} data-slide data-index={index} className="erx-slide">
      {children}
    </section>
  );
}

function Mask({ children }: { children: React.ReactNode }) {
  return (
    <span className="block overflow-hidden pb-[.08em]">
      <span className="block" data-a="mask">
        {children}
      </span>
    </span>
  );
}

function Kicker({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-3" data-a="fade">
      <span className="erx-display text-[11px] font-bold tracking-[.2em] text-[#FF2C04]">{n}</span>
      <span className="h-px w-8 bg-[#FF2C04]/50 sm:w-12" />
      <span className="erx-display text-[10px] font-semibold uppercase tracking-[.3em] text-white/50 sm:text-[11px]">
        {label}
      </span>
    </div>
  );
}
