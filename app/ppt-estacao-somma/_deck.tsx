"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Opcionais } from "./_assets";
import { Dupla, EvolveLogo, EvolvePlusLogo, Lockup, SommaLogo } from "./_marca";
import { ESPACO_CERRADO, MapaEspacoCerrado } from "./_mapa";
import { AppEstacao } from "./_app";
import { TelaAgenda, TelaCarteira, TelaCheckin } from "./_telas";
import { VideoLoop } from "./_video";
import {
  Accent,
  BgPhoto,
  EVOLVE,
  Foto,
  FotoOuPrancha,
  H2,
  Indice,
  Kicker,
  Lead,
  Linhas,
  Manifesto,
  Miolo,
  Nota,
  ORANGE,
  Palavras,
  Rodape,
  Slide,
  Topico,
} from "./_ui";
import {
  ACADEMIA_EVOLVE,
  ASSESSORIA_CONDICOES,
  AULAS,
  BENEFICIOS,
  BUGU,
  CAFE_MOMENTOS,
  CASOS,
  CICLO,
  CREDITOS,
  COM_A_ESTACAO,
  DADOS,
  DIGITAL,
  DIGITAL_JORNADA,
  EVOLVE_PLUS,
  EVOLVE_POSSIBILIDADES,
  FORCAS_ESTACAO,
  FORCAS_EVOLVE,
  FORCAS_SOMMA,
  FOTOS,
  FRENTES,
  HOJE,
  LOCKERS_NIVEIS,
  MARCAS,
  MARCAS_FORMATOS,
  OPERACAO,
  OPORTUNIDADE,
  PASSOS,
  PORQUE,
  RECEITA_DIRETA,
  RECOVERY,
  RECOVERY_MODELO,
  RECOVERY_REFERENCIA,
  SATELITES,
  SISTEMA_VANTAGENS,
  SOMMA_QUER,
  VALOR_INDIRETO,
} from "./_dados";

export const SLIDES = [
  "capa",
  "oportunidade",
  "movimento",
  "dados",
  "espaco",
  "localizacao",
  "premissa",
  "conceito",
  "nova-casa",
  "somma-quer",
  "papel-evolve",
  "performance",
  "recovery",
  "lockers",
  "creditos",
  "aulas",
  "digital",
  "sistema",
  "cafe",
  "bugu",
  "marcas",
  "beneficios",
  "evolve-plus",
  "somma-evolve",
  "ciclo",
  "receitas",
  "porque",
  "visao",
  "quatro-maos",
  "proximos-passos",
  "encerramento",
] as const;

export function Deck({ opcionais, app }: { opcionais: Opcionais; app: { url: string; qr: string } }) {
  const scroller = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const idx = useCallback((name: string) => SLIDES.indexOf(name as (typeof SLIDES)[number]), []);
  const total = SLIDES.length;

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      if (bar.current) {
        gsap.fromTo(
          bar.current,
          { scaleX: 0 },
          { scaleX: 1, ease: "none", scrollTrigger: { scroller: el, start: 0, end: "max", scrub: 0.3 } },
        );
      }

      gsap.utils.toArray<HTMLElement>("[data-slide]").forEach((section, i) => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: section, scroller: el, start: "top 70%", once: true },
        });

        const masked = section.querySelectorAll<HTMLElement>(".a-mask > *");
        if (masked.length) {
          tl.from(masked, { yPercent: 115, duration: 1.05, ease: "power4.out", stagger: 0.08 }, 0);
        }
        const rails = section.querySelectorAll<HTMLElement>(".a-rail");
        if (rails.length) {
          tl.from(rails, { scaleX: 0, duration: 1.1, ease: "power3.inOut", stagger: 0.06 }, 0.15);
        }
        const ups = section.querySelectorAll<HTMLElement>(".a-up");
        if (ups.length) {
          tl.from(ups, { y: 24, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.045 }, 0.2);
        }

        ScrollTrigger.create({
          trigger: section,
          scroller: el,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => self.isActive && setActive(i),
        });
      });

      // Slide da premissa: os satélites nascem do centro (o café) e depois
      // ficam respirando devagar ao redor dele.
      const premissa = el.querySelector<HTMLElement>('[data-slide="premissa"]');
      if (premissa) {
        const centro = premissa.querySelector<HTMLElement>("[data-centro]");
        const sats = Array.from(premissa.querySelectorAll<HTMLElement>("[data-sat]"));
        if (centro && sats.length) {
          const c = centro.getBoundingClientRect();
          const cx = c.left + c.width / 2;
          const cy = c.top + c.height / 2;
          const tl = gsap.timeline({
            scrollTrigger: { trigger: premissa, scroller: el, start: "top 60%", once: true },
          });
          tl.from(centro, { scale: 0.7, opacity: 0, duration: 1.1, ease: "power3.out" }, 0);
          sats.forEach((sat, i) => {
            const r = sat.getBoundingClientRect();
            tl.from(
              sat,
              {
                x: cx - (r.left + r.width / 2),
                y: cy - (r.top + r.height / 2),
                opacity: 0,
                scale: 0.6,
                duration: 1.3,
                ease: "power3.out",
              },
              0.35 + i * 0.07,
            );
          });
          tl.add(() => {
            sats.forEach((sat, i) => {
              gsap.to(sat, {
                y: i % 2 === 0 ? "+=7" : "-=7",
                duration: 2.6 + (i % 3) * 0.5,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut",
              });
            });
          });
        }
      }

      gsap.utils.toArray<HTMLElement>(".parallax").forEach((img) => {
        gsap.to(img, {
          yPercent: 8,
          ease: "none",
          scrollTrigger: { trigger: img, scroller: el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    }, scroller);

    return () => ctx.revert();
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const el = scroller.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(total - 1, i));
      el.querySelector<HTMLElement>(`[data-index="${clamped}"]`)?.scrollIntoView({ behavior: "smooth" });
    },
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        goTo(active + 1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        goTo(active - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(total - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, goTo, total]);

  const capaSrc = opcionais.renderCapa ?? FOTOS.evolveNoroeste;
  const fimSrc = opcionais.renderEncerramento ?? FOTOS.parqueGrupo;

  return (
    <div
      ref={scroller}
      className="h-[100svh] w-full snap-y snap-proximity overflow-y-auto overflow-x-hidden bg-[#0A0A0A] text-[#F5F3EF] antialiased md:snap-mandatory"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Progresso */}
      <div className="fixed left-0 top-0 z-50 h-[2px] w-full bg-neutral-500/25">
        <div ref={bar} className="h-full w-full origin-left" style={{ backgroundColor: ORANGE }} />
      </div>

      {/* Navegação lateral */}
      <div className="fixed right-5 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-2 md:flex">
        {SLIDES.map((name, i) => (
          <button key={name} onClick={() => goTo(i)} aria-label={`Ir para slide ${i + 1}`} className="group flex justify-end py-0.5">
            <span
              className={`h-px transition-[width,background-color] duration-300 ${
                active === i ? "w-7" : "w-2.5 bg-neutral-500/60 group-hover:bg-neutral-400"
              }`}
              style={active === i ? { backgroundColor: ORANGE } : undefined}
            />
          </button>
        ))}
      </div>

      <div className="fixed bottom-6 left-6 z-50 flex items-baseline gap-1.5 font-mono text-[11px] tracking-[0.2em] text-neutral-500 md:left-10">
        <span className="font-semibold">{String(active + 1).padStart(2, "0")}</span>
        <span className="opacity-50">/</span>
        <span className="opacity-70">{total}</span>
      </div>

      {/* ═══════════ 01 · CAPA ═══════════ */}
      <Slide index={idx("capa")} name="capa">
        <BgPhoto
          src={capaSrc}
          alt="Estação SOMMA no Parque da Cidade"
          veil="lateral"
          priority
          position="62% 50%"
        />
        <Miolo className="flex min-h-[calc(100svh-10rem)] flex-col justify-between">
          <Lockup className="a-up" size="lg" />

          <div className="mt-16 max-w-4xl">
            <div className="a-mask overflow-hidden py-1">
              <h1 className="font-display text-[3.6rem] font-bold uppercase leading-[0.84] tracking-tight sm:text-7xl md:text-[7.2rem] lg:text-[8.4rem]">
                Estação
                <br />
                SOMMA
              </h1>
            </div>
            <Manifesto className="mt-5 text-white/90">Café, Cultura e Movimento</Manifesto>
            <p className="a-up mt-4 font-display text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
              powered by Evolve
            </p>
            <div className="a-rail mt-8 h-px w-20 origin-left" style={{ backgroundColor: ORANGE }} />
            <p className="a-up mt-6 max-w-xl text-[15px] font-light leading-relaxed text-white/70 md:text-lg">
              Uma nova plataforma de alimentação, comunidade e movimento no Parque da Cidade.
            </p>
          </div>
        </Miolo>
        <Rodape texto="Brasília · 2026" />
      </Slide>

      {/* ═══════════ 02 · A OPORTUNIDADE ═══════════ */}
      <Slide index={idx("oportunidade")} name="oportunidade" tema="claro">
        <Miolo>
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <Kicker>A oportunidade</Kicker>
              <H2>
                O Parque já tem movimento.
                <br />
                Falta uma <Accent>casa</Accent> para essa comunidade
              </H2>
              <div className="mt-10 max-w-xl">
                {OPORTUNIDADE.map((t, i) => (
                  <div key={t} className="a-up flex gap-5 border-t border-[color:var(--line)] py-4">
                    <Indice n={`0${i + 1}`} cor={ORANGE} />
                    <p className="text-[15px] font-light leading-relaxed text-[color:var(--fg-soft)] md:text-[17px]">{t}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 items-start gap-4">
              <Foto
                src={opcionais.parque1 ?? FOTOS.parqueAereo}
                alt="Encontro do SOMMA Club no Parque da Cidade"
                legenda="Encontro do SOMMA Club · Parque da Cidade"
                ratio="aspect-[3/4]"
                position="45% 50%"
              />
              <Foto
                src={opcionais.parque2 ?? FOTOS.corrida2}
                alt="Corredores do SOMMA Club"
                legenda="Corrida no Parque"
                ratio="aspect-[3/4]"
                className="mt-10"
              />
            </div>
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 02b · O MOVIMENTO JÁ EXISTE ═══════════ */}
      <Slide index={idx("movimento")} name="movimento">
        <Miolo>
          <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <Kicker>O movimento já existe</Kicker>
              <H2>
                Marcas já constroem
                <br />
                <Accent>casas para quem corre</Accent>
              </H2>
            </div>
            <Lead className="!mt-0 lg:mb-2 lg:max-w-md lg:justify-self-end">
              Três casos brasileiros recentes, todos no Rio: um quiosque de marca na orla, o QG de um clube de corrida
              e a casa de uma marca esportiva dentro da Maratona.
            </Lead>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {CASOS.flatMap((c) =>
              c.videos.map((v, i) => (
                <VideoLoop key={v.src} src={v.src} poster={v.poster} ratio="aspect-[9/11.5]" className="a-up" />
              )),
            )}
          </div>

          <div className="mt-3 grid gap-x-4 gap-y-6 md:grid-cols-4">
            {CASOS.map((c) => (
              <div key={c.id} className={`a-up border-t border-[color:var(--line)] pt-3 ${c.videos.length > 1 ? "md:col-span-2" : ""}`}>
                <div className="flex h-10 items-center gap-5">
                  {c.logos.map((l) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={l.src} src={l.src} alt={l.alt} className={`${l.h} w-auto`} />
                  ))}
                </div>
                <p className="mt-2 font-display text-lg font-semibold uppercase leading-none tracking-tight sm:text-xl">{c.nome}</p>
                <p className="mt-1 font-display text-[10px] font-medium uppercase tracking-[0.25em] text-[color:var(--fg-faint)]">{c.onde}</p>
                <p className="mt-2 max-w-md text-[12px] font-light leading-relaxed text-[color:var(--fg-soft)]">{c.texto}</p>
                <p className="mt-1.5 font-mono text-[9px] tracking-[0.12em] text-[color:var(--fg-faint)]">Fonte: {c.fonte}</p>
              </div>
            ))}
          </div>
        </Miolo>
        <Rodape texto="Vídeos: registros públicos dos espaços · sem áudio" />
      </Slide>

      {/* ═══════════ 02c · O QUE OS DADOS DIZEM ═══════════ */}
      <Slide index={idx("dados")} name="dados" tema="claro">
        <Miolo>
          <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <Kicker>O que os dados dizem</Kicker>
              <H2>
                A comunidade cresce.
                <br />
                As marcas vão <Accent>atrás</Accent>
              </H2>
            </div>
            <Lead className="!mt-0 lg:mb-2 lg:max-w-md lg:justify-self-end">
              Correr em grupo deixou de ser nicho. Os números abaixo são públicos e cada um diz de onde veio.
            </Lead>
          </div>

          <div className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {DADOS.map((x) => (
              <div key={x.titulo} className="a-up border-t border-[color:var(--line)] pt-4">
                <p className="font-display text-5xl font-bold leading-none tracking-tight sm:text-6xl md:text-[3.8rem]" style={{ color: ORANGE }}>
                  {x.numero}
                </p>
                <p className="mt-3 font-display text-lg font-semibold uppercase leading-tight tracking-tight sm:text-xl">{x.titulo}</p>
                <p className="mt-2 text-[13px] font-light leading-relaxed text-[color:var(--fg-soft)]">{x.texto}</p>
                <p className="mt-2.5 font-mono text-[9.5px] tracking-[0.1em] text-[color:var(--fg-faint)]">Fonte: {x.fonte}</p>
              </div>
            ))}
          </div>

          <Nota className="mt-6">
            Os dados mostram o crescimento da corrida em grupo e a entrada de marcas nesse território. Não há, aqui,
            projeção de alcance para a Estação: isso será medido com a operação.
          </Nota>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 03 · O ESPAÇO ═══════════ */}
      <Slide index={idx("espaco")} name="espaco" tema="grafite">
        <Miolo>
          <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <Kicker>O espaço</Kicker>
              <H2>
                Do Espaço Cerrado
                <br />
                para a <Accent>Estação SOMMA</Accent>
              </H2>
            </div>
            <Lead className="lg:mb-2 lg:max-w-xl lg:justify-self-end">
              Um quiosque já construído, com cobertura, sombra de árvores maduras e um gramado aberto ao redor.
              A oportunidade é física: transformar essa estrutura em uma operação contemporânea, desejável e
              economicamente ativa.
            </Lead>
          </div>

          <div className="mt-9 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
            <Foto
              src={FOTOS.espacoQuiosque}
              alt="Espaço Cerrado, quiosque atual no Parque da Cidade"
              legenda="Espaço Cerrado · quiosque atual"
              ratio="aspect-[16/9.2]"
              sizes="60vw"
            />
            <div className="grid grid-rows-2 gap-4">
              <Foto
                src={FOTOS.espacoEstrutura}
                alt="Estrutura coberta do Espaço Cerrado"
                legenda="Estrutura coberta existente"
                ratio="aspect-[16/7.4]"
                position="50% 60%"
                sizes="36vw"
              />
              <Foto
                src={FOTOS.entornoGramado}
                alt="Gramado e árvores no entorno do Espaço Cerrado"
                legenda="Gramado e sombra no entorno"
                ratio="aspect-[16/7.4]"
                position="50% 55%"
                sizes="36vw"
              />
            </div>
          </div>

          <Nota className="mt-6">
            Fotografias da situação atual. A situação jurídica e regulatória do espaço será validada como etapa do
            projeto.
          </Nota>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 03b · LOCALIZAÇÃO ═══════════ */}
      <Slide index={idx("localizacao")} name="localizacao" className="!py-0">
        <MapaEspacoCerrado />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/20 to-[#0A0A0A]/30" aria-hidden />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[#0A0A0A]/80 via-[#0A0A0A]/25 to-transparent" aria-hidden />
        <Miolo className="flex min-h-[100svh] flex-col justify-end pb-16 pt-20 md:pb-20">
          <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div className="max-w-2xl">
              <Kicker cor="rgba(255,255,255,0.7)">Localização</Kicker>
              <H2>
                No coração do
                <br />
                <Accent>Parque da Cidade</Accent>
              </H2>
              <Lead className="text-white/75">
                Entre o gramado, a pista e o fluxo de quem corre e caminha todos os dias. Vista de satélite do ponto
                exato do {ESPACO_CERRADO.nome}.
              </Lead>
            </div>
            <div className="border-l border-white/25 pl-6 lg:justify-self-end">
              <p className="a-up font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">
                Endereço
              </p>
              <p className="a-up mt-2 font-display text-xl font-semibold uppercase leading-tight tracking-tight sm:text-2xl">
                {ESPACO_CERRADO.nome}
              </p>
              <p className="a-up mt-1.5 text-[13.5px] text-white/65">{ESPACO_CERRADO.endereco}</p>
              <p className="a-up mt-1 font-mono text-[11px] tracking-[0.15em] text-white/45">
                {ESPACO_CERRADO.lat}, {ESPACO_CERRADO.lng} · {ESPACO_CERRADO.plusCode}
              </p>
            </div>
          </div>
        </Miolo>
        <Rodape texto="Imagens de satélite · Google" />
      </Slide>

      {/* ═══════════ 04 · A PREMISSA DO NEGÓCIO ═══════════ */}
      <Slide index={idx("premissa")} name="premissa" tema="claro">
        <Miolo>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div>
              <Kicker>A premissa do negócio</Kicker>
              <H2>
                Tudo começa por
                <br />
                <Accent>alimentos e bebidas</Accent>
              </H2>
              <Lead>
                A operação principal é A&amp;B. Café e alimentação sustentam o espaço. Esporte e wellness funcionam
                como geradores de fluxo, recorrência e permanência.
              </Lead>
              <p className="a-up mt-8 max-w-md border-l-2 pl-5 font-display text-lg font-medium uppercase leading-snug tracking-tight md:text-xl" style={{ borderColor: ORANGE }}>
                A concessão do espaço determina essa vocação.
              </p>
            </div>

            {/* Composição tipográfica: o centro é o café; ao redor, em voz baixa, o que aumenta fluxo. */}
            <div className="grid grid-cols-[1fr_1.7fr_1fr] items-center gap-y-6 text-center font-display uppercase">
              {[SATELITES[0], SATELITES[1], SATELITES[2]].map((s) => (
                <span key={s} data-sat className="text-base font-medium tracking-[0.2em] text-[color:var(--fg-faint)] sm:text-lg md:text-xl">
                  {s}
                </span>
              ))}

              <span data-sat className="text-base font-medium tracking-[0.2em] text-[color:var(--fg-faint)] sm:text-lg md:text-xl">
                {SATELITES[3]}
              </span>
              <div data-centro className="py-6 sm:py-10">
                <p className="whitespace-nowrap font-display text-[3rem] font-bold leading-[0.85] tracking-tight sm:text-7xl md:text-[6.4rem]">
                  Café
                  <br />
                  <span style={{ color: ORANGE }}>e A&amp;B</span>
                </p>
                <p className="mx-auto mt-4 h-px w-12 bg-[color:var(--fg)]" aria-hidden />
                <p className="mt-3 text-[10px] font-semibold tracking-[0.35em] text-[color:var(--fg-soft)]">
                  Centro econômico e operacional
                </p>
              </div>
              <span data-sat className="text-base font-medium tracking-[0.2em] text-[color:var(--fg-faint)] sm:text-lg md:text-xl">
                {SATELITES[4]}
              </span>

              <span data-sat className="text-base font-medium tracking-[0.2em] text-[color:var(--fg-faint)] sm:text-lg md:text-xl">
                {SATELITES[5]}
              </span>
              <span data-sat className="text-[10px] font-semibold tracking-[0.3em] text-[color:var(--fg-faint)]">
                Complementares
              </span>
              <span data-sat className="text-base font-medium tracking-[0.2em] text-[color:var(--fg-faint)] sm:text-lg md:text-xl">
                {SATELITES[6]}
              </span>
            </div>
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 05 · O CONCEITO ═══════════ */}
      <Slide index={idx("conceito")} name="conceito">
        <Miolo>
          <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Kicker>O conceito</Kicker>
              <H2>
                Café, Cultura
                <br />e <Accent>Movimento</Accent>
              </H2>
            </div>
            <div className="space-y-2.5 border-l border-[color:var(--line)] pl-6 lg:mb-2">
              {[
                ["A SOMMA", "gera comunidade."],
                ["A Evolve", "adiciona performance e wellness."],
                ["A operação de A&B", "transforma fluxo em receita."],
              ].map(([a, b]) => (
                <p key={a} className="a-up font-display text-lg font-medium uppercase leading-tight tracking-tight sm:text-xl md:text-2xl">
                  <span>{a}</span> <span className="text-[color:var(--fg-soft)]">{b}</span>
                </p>
              ))}
            </div>
          </div>

          <Foto
            src={opcionais.renderConceito ?? FOTOS.estudoA}
            alt="Estudo conceitual da Estação SOMMA: revitalização da estrutura existente com café, lockers e Espaço Evolve"
            legenda="Estudo conceitual · revitalização da estrutura existente · imagem de referência, não projeto executivo"
            ratio="aspect-[1448/540]"
            className="mt-8"
            sizes="100vw"
          />

          <Lead className="mt-6 max-w-3xl">
            Um café contemporâneo dentro do Parque da Cidade que funciona como ponto de encontro para quem corre,
            treina, trabalha, passeia e vive o parque. O balcão no centro, o Espaço Evolve ao lado, a sombra do
            Parque em volta.
          </Lead>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 06 · A NOVA CASA DO SOMMA ═══════════ */}
      <Slide index={idx("nova-casa")} name="nova-casa" tema="claro">
        <Miolo>
          <Kicker>A nova casa do SOMMA</Kicker>
          <H2>
            O point oficial do SOMMA
            <br />
            muda de <Accent>endereço</Accent>
          </H2>

          <div className="mt-10 grid gap-10 lg:grid-cols-[0.8fr_1.4fr]">
            <div>
              <p className="a-up font-display text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--fg-faint)]">
                Hoje
              </p>
              <p className="a-up mt-3 font-display text-2xl font-semibold uppercase tracking-tight">
                Estacionamento 10
              </p>
              <div className="mt-5">
                {HOJE.map((h, i) => (
                  <p key={h} className="a-up border-t border-[color:var(--line)] py-3 font-display text-lg font-medium uppercase tracking-tight text-[color:var(--fg-soft)] sm:text-xl">
                    <span className="mr-4 font-mono text-[10px] tracking-[0.25em] text-[color:var(--fg-faint)]">0{i + 1}</span>
                    {h}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <p className="a-up font-display text-[10px] font-semibold uppercase tracking-[0.32em]" style={{ color: ORANGE }}>
                Com a Estação
              </p>
              <p className="a-up mt-3 font-display text-2xl font-semibold uppercase tracking-tight">Estação SOMMA</p>
              <div className="mt-5 grid gap-x-10 sm:grid-cols-3">
                {COM_A_ESTACAO.map((c, i) => (
                  <p key={c} className="a-up border-t border-[color:var(--line)] py-3 font-display text-lg font-semibold uppercase tracking-tight sm:text-xl">
                    <span className="mr-4 font-mono text-[10px] tracking-[0.25em]" style={{ color: ORANGE }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {c}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <Manifesto className="mt-12">
            O treino termina. <span style={{ color: ORANGE }}>A experiência continua.</span>
          </Manifesto>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 06b · O QUE O SOMMA QUER ═══════════ */}
      <Slide index={idx("somma-quer")} name="somma-quer" tema="grafite">
        <Miolo>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.4fr]">
            <div>
              <SommaLogo className="a-up h-6 md:h-7" />
              <Kicker className="mt-8">O que o SOMMA quer</Kicker>
              <H2>
                Dois objetivos,
                <br />
                <Accent>sem rodeio</Accent>
              </H2>
              <Lead>
                A Estação não é um desejo abstrato. O clube precisa de duas coisas no Parque, e o Espaço Cerrado
                resolve as duas.
              </Lead>
            </div>

            <div className="lg:mt-4">
              {SOMMA_QUER.map((q, i) => (
                <div key={q.titulo} className="a-up grid gap-x-8 border-t border-[color:var(--line)] py-7 sm:grid-cols-[auto_1fr]">
                  <span className="font-display text-5xl font-bold leading-none tracking-tight sm:text-6xl" style={{ color: ORANGE }}>
                    0{i + 1}
                  </span>
                  <div className="mt-3 sm:mt-1">
                    <p className="font-display text-2xl font-bold uppercase leading-[0.95] tracking-tight sm:text-3xl md:text-[2.4rem]">
                      {q.titulo}
                    </p>
                    <p className="mt-3 max-w-xl text-[15px] font-light leading-relaxed text-[color:var(--fg-soft)] md:text-[17px]">
                      {q.texto}
                    </p>
                    {q.itens.length ? (
                      <div className="mt-5 grid gap-x-8 sm:grid-cols-2">
                        {q.itens.map((it, j) => (
                          <p key={it} className="a-up flex items-baseline gap-3 border-t border-[color:var(--line)] py-2.5 font-display text-base font-semibold uppercase leading-tight tracking-tight sm:text-lg">
                            <span className="font-mono text-[10px] tracking-[0.25em] text-[color:var(--fg-faint)]">0{j + 1}</span>
                            {it}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 font-display uppercase tracking-tight">
                        <span className="text-[color:var(--fg-faint)]">
                          <span className="block text-[10px] font-semibold tracking-[0.3em]">Hoje</span>
                          <span className="mt-1 block text-xl font-semibold sm:text-2xl">Estacionamento 10</span>
                        </span>
                        <span className="h-8 w-px self-end bg-[color:var(--fg-faint)]" aria-hidden />
                        <span>
                          <span className="block text-[10px] font-semibold tracking-[0.3em]" style={{ color: ORANGE }}>
                            Com a Estação
                          </span>
                          <span className="mt-1 block text-xl font-semibold sm:text-2xl">Espaço Cerrado</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="border-t border-[color:var(--line)]" />
            </div>
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 07 · O PAPEL DA EVOLVE ═══════════ */}
      <Slide index={idx("papel-evolve")} name="papel-evolve">
        <BgPhoto src={FOTOS.evolveAsaNorte} alt="Unidade Evolve Asa Norte" veil="lateral" position="70% 50%" />
        <Miolo>
          <div className="max-w-3xl">
            <EvolveLogo className="a-up h-5 md:h-6" />
            <Kicker className="mt-8" cor="rgba(255,255,255,0.7)">O papel da Evolve</Kicker>
            <H2>
              A Evolve sai da academia
              <br />e passa a <Accent cor={EVOLVE}>viver o Parque</Accent>
            </H2>
            <Lead className="text-white/75">
              A Evolve não precisa reproduzir uma academia convencional dentro da Estação. Ela precisa criar uma
              extensão outdoor da sua marca.
            </Lead>

            <div className="mt-10 grid gap-x-8 sm:grid-cols-3">
              {EVOLVE_POSSIBILIDADES.map((p, i) => (
                <p key={p} className="a-up border-t border-white/20 py-3 font-display text-lg font-medium uppercase tracking-tight sm:text-xl">
                  <span className="mr-3 font-mono text-[10px] tracking-[0.25em]" style={{ color: EVOLVE }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 08 · ACADEMIA EVOLVE ═══════════ */}
      <Slide index={idx("performance")} name="performance" tema="claro">
        <Miolo>
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.2fr]">
            <FotoOuPrancha
              src={opcionais.renderPerformance ?? FOTOS.evolveBootcampLogo}
              alt="Área funcional Evolve"
              rotulo="Academia Evolve"
              detalhe="Render da academia outdoor"
              legenda={opcionais.renderPerformance ? "Academia Evolve · outdoor" : "Bootcamp Evolve · referência de área funcional"}
              arquivo="render-performance.jpg"
              ratio="aspect-[4/5]"
              position="25% 50%"
            />

            <div>
              <EvolveLogo tema="claro" className="a-up h-5 md:h-6" />
              <Kicker className="mt-6" cor={EVOLVE}>Academia Evolve</Kicker>
              <H2>
                Uma academia outdoor
                <br />
                com <Accent cor={EVOLVE}>outra lógica</Accent>
              </H2>
              <Lead>
                Não é uma unidade dentro do Parque. É a parte da Evolve que faz sentido ao ar livre, prática de
                operar, e que também vende: quem se interessa fecha o plano ali.
              </Lead>

              <div className="mt-7 grid gap-x-8 sm:grid-cols-2">
                {ACADEMIA_EVOLVE.map((a, i) => (
                  <div key={a.titulo} className="a-up border-t border-[color:var(--line)] py-3">
                    <p className="font-display text-lg font-semibold uppercase leading-none tracking-tight sm:text-xl">
                      <span className="mr-3 font-mono text-[10px] tracking-[0.25em]" style={{ color: EVOLVE }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {a.titulo}
                    </p>
                    <p className="mt-1.5 text-[12.5px] font-light leading-relaxed text-[color:var(--fg-soft)]">{a.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 09 · RECOVERY BY EVOLVE+ ═══════════ */}
      <Slide index={idx("recovery")} name="recovery">
        {opcionais.renderRecovery ? (
          <BgPhoto src={opcionais.renderRecovery} alt="Recovery by Evolve+" veil="lateral" />
        ) : null}
        <Miolo>
          <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <EvolvePlusLogo className="a-up h-6 md:h-7" />
              <Kicker className="mt-6" cor={EVOLVE}>Recovery by Evolve+</Kicker>
              <H2>
                O Evolve+ banca o recovery
                <br />e ganha <Accent cor={EVOLVE}>exclusividade</Accent>
              </H2>
              <Lead>
                O produto mais premium da Evolve assina toda a área de recovery e o espaço premium da Estação. O
                aluno Evolve+ chega, usa o voucher do mês e sente que aquilo é dele. Quando os vouchers acabam, ele
                compra o crédito com desconto. Todo mundo mais paga para usar.
              </Lead>
              <Palavras itens={RECOVERY} className="mt-7 max-w-xl" tamanho="sm" />
            </div>

            <div className="lg:mt-14">
              <p className="a-up font-display text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--fg-faint)]">
                Modelo proposto
              </p>
              <div className="mt-3">
                {RECOVERY_MODELO.map((m) => (
                  <div key={m.quem} className="a-up grid grid-cols-[0.8fr_1.4fr] items-baseline gap-6 border-t border-[color:var(--line)] py-3.5">
                    <p className="font-display text-lg font-semibold uppercase tracking-tight sm:text-xl" style={m.quem === "Evolve+" ? { color: EVOLVE } : undefined}>
                      {m.quem}
                    </p>
                    <p className="text-[13.5px] font-light leading-relaxed text-[color:var(--fg-soft)]">{m.regra}</p>
                  </div>
                ))}
                <div className="border-t border-[color:var(--line)]" />
              </div>

              <div className="a-up mt-6 border-l-2 pl-5" style={{ borderColor: EVOLVE }}>
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--fg-faint)]">
                  Referência de mercado · {RECOVERY_REFERENCIA.quem}
                </p>
                <p className="mt-1.5 text-[13px] font-light leading-relaxed text-[color:var(--fg-soft)]">{RECOVERY_REFERENCIA.texto}</p>
                <p className="mt-1 font-mono text-[9px] tracking-[0.12em] text-[color:var(--fg-faint)]">Fonte: {RECOVERY_REFERENCIA.fonte}</p>
              </div>
              <Nota className="mt-5">
                Quantidade de vouchers, valores e descontos são propostas. A modelagem final depende da estrutura
                jurídica e operacional permitida no espaço.
              </Nota>
            </div>
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 10 · LOCKERS BY EVOLVE ═══════════ */}
      <Slide index={idx("lockers")} name="lockers" tema="claro">
        <Miolo>
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
            <div>
              <Kicker cor={EVOLVE}>Lockers by Evolve</Kicker>
              <H2>
                Conveniência também
                <br />
                constrói <Accent cor={EVOLVE}>marca</Accent>
              </H2>
              <Lead>
                Lockers ajudam corredores e frequentadores do Parque a permanecerem mais tempo no espaço. Podem
                existir diferentes níveis de acesso.
              </Lead>
              <Nota>Oportunidade de produto. Preços e regras não estão definidos nesta etapa.</Nota>
            </div>

            <div>
              <p className="a-up font-display text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--fg-faint)]">
                Níveis de acesso
              </p>
              <div className="mt-4">
                {LOCKERS_NIVEIS.map((n, i) => (
                  <div key={n} className="a-up flex items-baseline gap-6 border-t border-[color:var(--line)] py-4" style={{ paddingLeft: `calc(${i} * clamp(0.5rem, 1.8vw, 1.75rem))` }}>
                    <Indice n={`0${i + 1}`} cor={i === LOCKERS_NIVEIS.length - 1 ? EVOLVE : undefined} />
                    <p
                      className="font-display text-3xl font-bold uppercase leading-none tracking-tight sm:text-4xl md:text-5xl"
                      style={i === LOCKERS_NIVEIS.length - 1 ? { color: EVOLVE } : undefined}
                    >
                      {n}
                    </p>
                  </div>
                ))}
                <div className="border-t border-[color:var(--line)]" />
              </div>
            </div>
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 10b · CRÉDITOS AVULSOS ═══════════ */}
      <Slide index={idx("creditos")} name="creditos" tema="grafite">
        <Miolo>
          <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <Kicker>Créditos avulsos</Kicker>
              <H2>
                Espaços que
                <br />
                <Accent>geram receita</Accent>
              </H2>
            </div>
            <Lead className="!mt-0 lg:mb-2 lg:max-w-md lg:justify-self-end">
              Além do café, algumas áreas da Estação são monetizadas por uso, pelo app, com condição melhor para quem
              é aluno Evolve. As três primeiras já estão desenhadas; as demais são sugestões para decidir juntos.
            </Lead>
          </div>

          <div className="mt-9 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
            {CREDITOS.map((c, i) => (
              <div key={c.titulo} className="a-up border-t border-[color:var(--line)] py-4">
                <div className="flex items-baseline justify-between">
                  <Indice n={String(i + 1).padStart(2, "0")} cor={ORANGE} />
                  {c.sugestao ? (
                    <span className="font-display text-[9px] font-semibold uppercase tracking-[0.3em] text-[color:var(--fg-faint)]">Sugestão</span>
                  ) : null}
                </div>
                <p className="mt-2 font-display text-xl font-bold uppercase leading-none tracking-tight sm:text-2xl">{c.titulo}</p>
                <p className="mt-2 text-[12.5px] font-light leading-relaxed text-[color:var(--fg-soft)]">{c.texto}</p>
              </div>
            ))}
            <div className="a-up hidden border-t border-[color:var(--line)] py-4 lg:block">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: ORANGE }}>
                Regra geral
              </p>
              <p className="mt-2 text-[12.5px] font-light leading-relaxed text-[color:var(--fg-soft)]">
                Evolve+ tem o melhor acesso, aluno Evolve tem condição, SOMMA tem condição nos dias de treino, público
                paga integral. Tudo reservado e pago no app.
              </p>
            </div>
          </div>
          <Nota>Valores não definidos nesta etapa. O que está aqui é a lógica de acesso, não a tabela.</Nota>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 11 · AULAS E EXPERIÊNCIAS ═══════════ */}
      <Slide index={idx("aulas")} name="aulas">
        <BgPhoto src={FOTOS.energia} alt="Treino outdoor do SOMMA Club" veil="medio" position="50% 30%" />
        <Miolo>
          <div className="max-w-3xl">
            <Kicker cor="rgba(255,255,255,0.7)">Aulas e experiências</Kicker>
            <H2>
              O Parque vira uma extensão
              <br />
              da <Accent cor={EVOLVE}>grade Evolve</Accent>
            </H2>
            <Lead className="text-white/75">
              Aulas outdoor previamente agendadas. A aula pode acontecer externamente. A Estação funciona como ponto
              de encontro, check in, alimentação e convivência.
            </Lead>
          </div>
          <Palavras itens={AULAS} className="mt-12 max-w-5xl" tamanho="lg" />
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 12 · CAMADA DIGITAL ═══════════ */}
      <Slide index={idx("digital")} name="digital" tema="claro">
        <Miolo>
          <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <Kicker cor={EVOLVE}>App Estação SOMMA powered by Evolve</Kicker>
              <H2>
                A experiência começa
                <br />
                antes de chegar <Accent cor={EVOLVE}>ao Parque</Accent>
              </H2>
              <Lead>
                Um app que reúne as experiências da Estação: o check in do corre do SOMMA todo sábado, a agenda de
                aulas e recovery, os eventos da Estação, as novidades das unidades Evolve e o consumo no café. Na
                linha do que o Na Praia fez junto com o Mané Mercado em Brasília: programação, consumo e comunidade
                num lugar só.
              </Lead>

              <div className="mt-9 grid gap-x-8 sm:grid-cols-3">
                {DIGITAL_JORNADA.map((j, i) => (
                  <div key={j.titulo} className="a-up border-t border-[color:var(--line)] pt-4">
                    <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: EVOLVE }}>
                      0{i + 1}
                    </p>
                    <p className="mt-2 font-display text-2xl font-bold uppercase leading-none tracking-tight">{j.titulo}</p>
                    <p className="mt-2.5 text-[13.5px] font-light leading-relaxed text-[color:var(--fg-soft)]">{j.texto}</p>
                  </div>
                ))}
              </div>

              <p className="a-up mt-9 font-display text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--fg-faint)]">
                Roadmap de experiência
              </p>
              <Palavras itens={DIGITAL} className="mt-3 max-w-4xl text-[color:var(--fg-soft)]" tamanho="sm" />

              <div className="mt-8 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
                <Nota className="!mt-0">Nem tudo precisa existir no primeiro dia. As funcionalidades entram por etapas, definidas em conjunto.</Nota>
                {/* QR só no desktop: quem está na sala aponta o telefone e abre a experiência. */}
                <div className="a-up hidden items-center gap-5 lg:flex">
                  <div
                    className="h-28 w-28 shrink-0 border border-[color:var(--line)] bg-white p-2 [&>svg]:h-full [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: app.qr }}
                    aria-label="QR code para abrir a experiência no telefone"
                    role="img"
                  />
                  <div>
                    <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: EVOLVE }}>
                      Teste no seu telefone
                    </p>
                    <p className="mt-1.5 font-display text-lg font-semibold uppercase leading-tight tracking-tight">
                      Aponte a câmera
                      <br />e navegue no app
                    </p>
                    <p className="mt-1.5 font-mono text-[10px] tracking-[0.12em] text-[color:var(--fg-faint)]">{app.url.replace(/^https?:\/\//, "")}</p>
                  </div>
                </div>
              </div>
            </div>

            <AppEstacao className="mx-auto max-w-[340px]" />
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 12b · UM SISTEMA, DUAS MARCAS ═══════════ */}
      <Slide index={idx("sistema")} name="sistema">
        <Miolo>
          <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div className="a-up flex items-center gap-5">
                <EvolveLogo className="h-5 md:h-6" />
                <span className="h-6 w-px bg-white/25" aria-hidden />
                <SommaLogo className="h-5 md:h-6" />
              </div>
              <Kicker className="mt-8" cor={EVOLVE}>Um sistema, duas marcas</Kicker>
              <H2>
                Uma operação
                <br />
                <Accent cor={EVOLVE}>unificada</Accent>
              </H2>
              <Lead className="text-white/75">
                Academia, Estação e comunidade SOMMA no mesmo sistema. O aluno não percebe fronteira entre a unidade e
                o Parque, e a operação enxerga uma pessoa só, do treino ao café.
              </Lead>

              <div className="mt-8 grid gap-x-8 sm:grid-cols-2">
                {SISTEMA_VANTAGENS.map((v, i) => (
                  <div key={v.titulo} className="a-up border-t border-white/15 py-3">
                    <p className="font-display text-lg font-semibold uppercase leading-none tracking-tight sm:text-xl">
                      <span className="mr-3 font-mono text-[10px] tracking-[0.25em]" style={{ color: EVOLVE }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {v.titulo}
                    </p>
                    <p className="mt-1.5 text-[12.5px] font-light leading-relaxed text-white/55">{v.texto}</p>
                  </div>
                ))}
              </div>
              <Nota>
                Simulação de interface. A integração com o sistema atual da Evolve e o formato do login único são
                definidos na frente de tecnologia.
              </Nota>
            </div>

            <div className="flex snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:items-start sm:overflow-visible sm:pb-0">
              <TelaAgenda className="min-w-[230px] snap-start sm:min-w-0" />
              <TelaCheckin className="min-w-[230px] snap-start sm:mt-10 sm:min-w-0" />
              <TelaCarteira className="min-w-[230px] snap-start sm:min-w-0" />
            </div>
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 13 · O CAFÉ ═══════════ */}
      <Slide index={idx("cafe")} name="cafe">
        {opcionais.renderCafe ? <BgPhoto src={opcionais.renderCafe} alt="O café da Estação SOMMA" veil="lateral" /> : null}
        <Miolo>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:items-start">
            <div>
              <Kicker cor="rgba(245,243,239,0.7)">O café</Kicker>
              <H2 tamanho="lg">
                O coração
                <br />
                da <Accent>Estação</Accent>
              </H2>
              <Lead>
                Hoje, aquela região do Parque não tem um lugar com uma experiência confortável: sombra, assento,
                café de qualidade e comida boa para ficar. A Estação resolve isso no ponto onde as pessoas já estão.
              </Lead>
              <Manifesto className="mt-8 max-w-lg">Um café que você escolheria mesmo sem treinar.</Manifesto>

              <div className="mt-9">
                <p className="a-up font-display text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--fg-faint)]">
                  Modelos de operação
                </p>
                <div className="mt-2 grid gap-x-6 sm:grid-cols-3">
                  {OPERACAO.map((o, i) => (
                    <div key={o.titulo} className="a-up border-t border-[color:var(--line)] py-3">
                      <p className="font-display text-base font-semibold uppercase leading-none tracking-tight sm:text-lg">
                        <span className="mr-2 font-mono text-[10px] tracking-[0.25em]" style={{ color: ORANGE }}>
                          0{i + 1}
                        </span>
                        {o.titulo}
                      </p>
                      <p className="mt-1.5 text-[12px] font-light leading-relaxed text-[color:var(--fg-soft)]">{o.texto}</p>
                    </div>
                  ))}
                </div>
                <Nota className="mt-4">O modelo definitivo de operação será definido em conjunto.</Nota>
              </div>
            </div>

            {/* Cardápio por momento: a parede do café, em tipografia. */}
            <div className="grid gap-x-8 sm:grid-cols-3 lg:mt-16">
              {CAFE_MOMENTOS.map((m, i) => (
                <div key={m.momento}>
                  <p className="a-up font-display text-[10px] font-semibold uppercase tracking-[0.32em]" style={{ color: ORANGE }}>
                    0{i + 1} · {m.momento}
                  </p>
                  <div className="mt-3">
                    {m.itens.map((it) => (
                      <p key={it} className="a-up border-t border-[color:var(--line)] py-3.5 font-display text-xl font-semibold uppercase leading-none tracking-tight sm:text-2xl md:text-[2rem]">
                        {it}
                      </p>
                    ))}
                    <div className="border-t border-[color:var(--line)]" />
                  </div>
                </div>
              ))}
              <div className="mt-5 grid items-start gap-6 sm:col-span-3 sm:grid-cols-[1fr_1fr]">
                <p className="a-up text-[13px] font-light leading-relaxed text-[color:var(--fg-soft)]">
                  Café especial de manhã, bowls e smoothies na volta do treino, breakfast e brunch para quem fica.
                  Ambiente com sombra, mesas, tomadas e banheiro: o conforto que o Parque ainda não oferece ali.
                </p>
                <Foto
                  src={FOTOS.evolveTorneiras}
                  alt="Torneiras com a marca Evolve em uma unidade"
                  legenda="Torneiras Evolve · a marca já vive no balcão"
                  ratio="aspect-[16/8]"
                  position="30% 50%"
                  sizes="30vw"
                />
              </div>
            </div>
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 13a · PARCEIRO DE A&B: BUGU ═══════════ */}
      <Slide index={idx("bugu")} name="bugu">
        <Miolo>
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={BUGU.logoEscuro} alt={BUGU.nome} className="a-up h-12 w-auto md:h-14" />
              <Kicker className="mt-7">Parceiro proposto para o café</Kicker>
              <H2>
                O café com quem já
                <br />
                correu com a <Accent>gente</Accent>
              </H2>
              <Lead>
                Para a operação de A&amp;B, a proposta é o {BUGU.nome}: café colonial e confeitaria caseira de
                Brasília, parceiro do SOMMA desde o começo do clube. O estilo de comida e o modo de operar casam com
                a Estação.
              </Lead>

              <div className="mt-7">
                {BUGU.porque.map((p, i) => (
                  <p key={p} className="a-up flex items-baseline gap-4 border-t border-[color:var(--line)] py-2.5 font-display text-base font-semibold uppercase leading-tight tracking-tight sm:text-lg">
                    <span className="font-mono text-[10px] tracking-[0.25em]" style={{ color: ORANGE }}>0{i + 1}</span>
                    {p}
                  </p>
                ))}
                <div className="border-t border-[color:var(--line)]" />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-6">
                {BUGU.fatos.map((f) => (
                  <div key={f.rotulo} className="a-up">
                    <p className="font-display text-2xl font-bold uppercase leading-none tracking-tight sm:text-3xl">{f.valor}</p>
                    <p className="mt-1.5 text-[11.5px] font-light leading-snug text-[color:var(--fg-soft)]">{f.rotulo}</p>
                  </div>
                ))}
              </div>
              <Nota className="mt-5">
                {BUGU.slogan}, {BUGU.onde}. Dados do site, do cardápio e do Instagram @bugu_delicias, ago. 2026.
                Parceria a formalizar.
              </Nota>
            </div>

            <div className="grid grid-cols-[1.15fr_1fr] gap-3">
              <Foto src={BUGU.fotos.salao} alt="Salão do Bugu Delícias Caseiras" ratio="aspect-[3/4]" legenda="Salão do Bugu" sizes="30vw" />
              <div className="grid gap-3">
                <Foto src={BUGU.fotos.pao} alt="Salgado caseiro do Bugu" ratio="aspect-[4/3]" position="50% 40%" sizes="25vw" />
                <Foto src={BUGU.fotos.mesa} alt="Mesa posta no Bugu" ratio="aspect-[4/3]" legenda="Fotos: bugudelicias.com.br" sizes="25vw" />
              </div>
            </div>
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 13b · MARCAS NO COMPLEXO ═══════════ */}
      <Slide index={idx("marcas")} name="marcas" tema="claro">
        <Miolo>
          <div className="grid items-end gap-8 lg:grid-cols-[1.25fr_1fr]">
            <div>
              <Kicker>Marcas no complexo</Kicker>
              <H2 className="md:!text-[3.3rem] lg:!text-[3.7rem]">
                Marcas do DF e do Brasil
                <br />
                dentro do <Accent>complexo</Accent>
              </H2>
            </div>
            <Lead className="!mt-0 lg:mb-2 lg:max-w-md lg:justify-self-end">
              O café pode ser operado com marcas que já atuam no Distrito Federal: SOMMA e Evolve podem convidá-las a
              fazer parte do complexo da Estação SOMMA. E o espaço também pode vender naming rights.
            </Lead>
          </div>

          <div className="mt-8 grid gap-x-8 sm:grid-cols-3">
            {MARCAS_FORMATOS.map((f, i) => (
              <div key={f.titulo} className="a-up border-t border-[color:var(--line)] pt-4">
                <Indice n={`0${i + 1}`} cor={ORANGE} />
                <p className="mt-2 font-display text-xl font-bold uppercase leading-none tracking-tight sm:text-2xl">{f.titulo}</p>
                <p className="mt-2 max-w-sm text-[13px] font-light leading-relaxed text-[color:var(--fg-soft)]">{f.texto}</p>
              </div>
            ))}
          </div>

          <p className="a-up mt-10 font-display text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--fg-faint)]">
            Marcas com conversa possível
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MARCAS.map((m) => (
              <div key={m.nome} className="a-up border border-[color:var(--line)] bg-white p-5">
                <div className="flex h-14 min-w-0 items-center gap-3">
                  {m.logos.map((l, i) => (
                    <span key={l.src} className="flex min-w-0 items-center gap-3">
                      {i > 0 ? (
                        <span className="shrink-0 font-display text-[9px] font-semibold uppercase tracking-[0.25em] text-[color:var(--fg-faint)]">ou</span>
                      ) : null}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={l.src} alt={l.alt} className={`${l.h} w-auto max-w-full object-contain`} />
                    </span>
                  ))}
                </div>
                <p className="mt-5 font-display text-lg font-semibold uppercase leading-none tracking-tight sm:text-xl">{m.nome}</p>
                <p className="mt-1.5 text-[13px] font-light text-[color:var(--fg-soft)]">{m.papel}</p>
              </div>
            ))}
          </div>

          <Nota>
            Marcas indicadas como possibilidade, a partir de relacionamentos já existentes do SOMMA. Nenhuma negociação
            está fechada; formatos e contrapartidas entram na frente de modelo comercial.
          </Nota>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 14 · BENEFÍCIOS PARA ALUNOS EVOLVE ═══════════ */}
      <Slide index={idx("beneficios")} name="beneficios" tema="claro">
        <Miolo>
          <Kicker cor={EVOLVE}>Benefícios para alunos Evolve</Kicker>
          <H2>
            A matrícula passa a valer
            <br />
            também <Accent cor={EVOLVE}>fora da academia</Accent>
          </H2>
          <div className="mt-10 grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Manifesto className="max-w-md lg:mt-4">
                A Estação aumenta a percepção de valor da assinatura Evolve.
              </Manifesto>
              <Foto
                src={FOTOS.evolveVicentePires}
                alt="Unidade Evolve Vicente Pires"
                legenda="Unidade Evolve · o benefício nasce na academia e segue para o Parque"
                ratio="aspect-[16/9]"
                className="mt-8 max-w-md"
                sizes="40vw"
              />
            </div>
            <Linhas itens={BENEFICIOS} colunas={2} tamanho="md" cor={EVOLVE} />
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 15 · EVOLVE+ ═══════════ */}
      <Slide index={idx("evolve-plus")} name="evolve-plus">
        <BgPhoto src={FOTOS.evolvePlus} alt="Unidade Evolve+" veil="lateral" position="80% 40%" />
        <Miolo>
          <div className="max-w-4xl">
            <EvolvePlusLogo className="a-up h-6 md:h-7" />
            <Kicker className="mt-6" cor={EVOLVE}>Evolve+</Kicker>
            <H2>
              A Estação pode dar uma
              <br />
              nova dimensão ao <Accent cor={EVOLVE}>Evolve+</Accent>
            </H2>
            <Lead className="text-white/75">
              A rede Evolve+ vai crescer, e esse público já frequenta o Parque da Cidade. A Estação vira o diferencial
              do plano: recovery e espaço premium assinados pelo Evolve+, e uma ponte direta para a assessoria SOMMA.
            </Lead>

            <div className="mt-8 grid gap-x-8 sm:grid-cols-3">
              {EVOLVE_PLUS.map((p, i) => (
                <p key={p} className="a-up border-t border-white/20 py-2.5 font-display text-base font-medium uppercase tracking-tight sm:text-lg">
                  <span className="mr-3 font-mono text-[10px] tracking-[0.25em]" style={{ color: EVOLVE }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {p}
                </p>
              ))}
            </div>

            <p className="a-up mt-8 font-display text-[10px] font-semibold uppercase tracking-[0.32em] text-white/50">
              Ponte com a assessoria SOMMA
            </p>
            <div className="mt-2 grid gap-x-8 sm:grid-cols-3">
              {ASSESSORIA_CONDICOES.map((c) => (
                <div key={c.quem} className="a-up border-t border-white/20 py-3">
                  <p className="font-display text-base font-semibold uppercase leading-none tracking-tight sm:text-lg" style={c.quem === "Evolve+" ? { color: EVOLVE } : c.quem === "SOMMA" ? { color: ORANGE } : undefined}>
                    {c.quem}
                  </p>
                  <p className="mt-1.5 text-[12.5px] font-light leading-relaxed text-white/60">{c.regra}</p>
                </div>
              ))}
            </div>
            <Nota className="mt-4 text-white/40">Percentuais de desconto a definir em conjunto. A Evolve vende o plano, o SOMMA converte o aluno.</Nota>
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 16 · SOMMA + EVOLVE ═══════════ */}
      <Slide index={idx("somma-evolve")} name="somma-evolve" tema="claro">
        <Miolo>
          <Dupla tema="claro" size="sm" className="a-up" />
          <H2>
            Duas forças <Accent>complementares</Accent>
          </H2>

          <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <div className="a-up flex h-8 items-center"><SommaLogo tema="claro" className="h-6 md:h-7" /></div>
              <div className="mt-6">
                {FORCAS_SOMMA.map((f) => (
                  <p key={f} className="a-up border-t border-[color:var(--line)] py-2.5 font-display text-xl font-semibold uppercase tracking-tight sm:text-2xl">
                    {f}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <div className="a-up flex h-8 items-center"><EvolveLogo tema="claro" className="h-[1.15rem] md:h-[1.4rem]" /></div>
              <div className="mt-6">
                {FORCAS_EVOLVE.map((f) => (
                  <p key={f} className="a-up border-t border-[color:var(--line)] py-2.5 font-display text-xl font-semibold uppercase tracking-tight sm:text-2xl">
                    {f}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 border-t-2 border-[color:var(--fg)] pt-6">
            <p className="a-up font-display text-3xl font-bold uppercase leading-none tracking-tight sm:text-4xl md:text-5xl">
              Estação <span style={{ color: ORANGE }}>SOMMA</span>
            </p>
            <Palavras itens={FORCAS_ESTACAO} className="mt-5 text-[color:var(--fg-soft)]" tamanho="sm" />
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 17 · O CICLO DE VALOR ═══════════ */}
      <Slide index={idx("ciclo")} name="ciclo" tema="grafite">
        <Miolo>
          <Kicker>O ciclo de valor</Kicker>
          <H2>
            Mais fluxo. Mais permanência.
            <br />
            Mais <Accent>relacionamento</Accent>
          </H2>

          <div className="mt-12">
            {CICLO.map((c, i) => (
              <p
                key={c.a}
                className="a-up border-t border-[color:var(--line)] py-5 font-display text-2xl font-light uppercase leading-none tracking-tight sm:text-4xl md:whitespace-nowrap md:text-[3.5rem]"
                style={{ paddingLeft: `calc(${i} * clamp(0.5rem, 2vw, 2rem))` }}
              >
                <span className="font-bold">{c.a}</span> <span className="text-[color:var(--fg-soft)]">{c.b}.</span>
              </p>
            ))}
            <div className="border-t border-[color:var(--line)]" />
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 18 · RECEITAS E VALOR GERADO ═══════════ */}
      <Slide index={idx("receitas")} name="receitas" tema="claro">
        <Miolo>
          <Kicker>Receitas e valor gerado</Kicker>
          <H2>
            Um espaço.
            <br />
            Diversas fontes de <Accent>valor</Accent>
          </H2>

          <div className="mt-10 grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="a-up font-display text-[10px] font-semibold uppercase tracking-[0.32em]" style={{ color: ORANGE }}>
                Receita direta
              </p>
              <div className="mt-4">
                {RECEITA_DIRETA.map((r) => (
                  <p key={r} className="a-up border-t border-[color:var(--line)] py-3 font-display text-2xl font-semibold uppercase leading-none tracking-tight sm:text-3xl">
                    {r}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <p className="a-up font-display text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--fg-faint)]">
                Valor indireto
              </p>
              <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
                {VALOR_INDIRETO.map((v) => (
                  <p key={v} className="a-up border-t border-[color:var(--line)] py-3 font-display text-xl font-medium uppercase leading-none tracking-tight text-[color:var(--fg-soft)] sm:text-2xl">
                    {v}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <Nota>
            Sem projeção financeira nesta etapa. O modelo econômico será construído com dados reais de operação,
            concessão e parceria.
          </Nota>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 19 · POR QUE ISSO IMPORTA PARA A EVOLVE ═══════════ */}
      <Slide index={idx("porque")} name="porque">
        <BgPhoto src={FOTOS.corrida} alt="Corredores do SOMMA Club" veil="forte" position="50% 35%" />
        <Miolo>
          <Kicker cor="rgba(255,255,255,0.7)">Por que isso importa para a Evolve</Kicker>
          <H2>
            A disputa não é apenas por academia.
            <br />É por <Accent cor={EVOLVE}>estilo de vida</Accent>
          </H2>

          <div className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {PORQUE.map((p, i) => (
              <div key={p.titulo} className="border-t border-white/25 pt-5">
                <Topico rotulo={`0${i + 1}`} titulo={p.titulo} texto={p.texto} cor={EVOLVE} />
              </div>
            ))}
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 20 · VISÃO ═══════════ */}
      <Slide index={idx("visao")} name="visao">
        <Miolo>
          <Foto
            src={opcionais.renderVisao ?? FOTOS.estudoB}
            alt="Estudo conceitual da Estação SOMMA em módulos: café com deck, terraço verde e Espaço Evolve"
            legenda="Estudo conceitual · módulos com deck, terraço e Espaço Evolve · imagem de referência, não projeto executivo"
            ratio="aspect-[1448/540]"
            sizes="100vw"
          />
          <div className="mt-8 grid items-end gap-8 lg:grid-cols-[1.3fr_1fr]">
            <H2 className="!mt-0">
              A nova casa de quem
              <br />
              se movimenta em <Accent>Brasília</Accent>
            </H2>
            <div className="lg:mb-2">
              <div className="a-rail h-px w-20 origin-left" style={{ backgroundColor: ORANGE }} />
              <p className="a-up mt-5 font-display text-lg font-medium uppercase tracking-[0.08em] md:text-xl">
                Estação SOMMA.
                <br />
                <span className="text-[color:var(--fg-soft)]">Café, Cultura e Movimento.</span>
                <br />
                <span className="text-[color:var(--fg-faint)]">powered by Evolve.</span>
              </p>
            </div>
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 21 · PROPOSTA DE CONSTRUÇÃO A QUATRO MÃOS ═══════════ */}
      <Slide index={idx("quatro-maos")} name="quatro-maos" tema="claro">
        <Miolo>
          <Kicker>Proposta de construção a quatro mãos</Kicker>
          <div className="a-up mt-5">
            <Dupla tema="claro" size="xl" />
          </div>
          <H2 className="!mt-4">
            construindo o projeto <Accent>juntos</Accent>
          </H2>
          <Lead>
            Não é uma parceria fechada. É uma proposta. Cada frente abaixo é desenhada em conjunto, com decisão
            compartilhada.
          </Lead>

          <div className="mt-10 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
            {FRENTES.map((f, i) => (
              <p key={f} className="a-up border-t border-[color:var(--line)] py-3.5 font-display text-xl font-semibold uppercase leading-none tracking-tight sm:text-2xl">
                <span className="mr-3 font-mono text-[10px] tracking-[0.25em]" style={{ color: ORANGE }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {f}
              </p>
            ))}
            <p className="a-up border-t border-[color:var(--line)] py-3.5 font-display text-xl font-light uppercase leading-none tracking-tight text-[color:var(--fg-faint)] sm:text-2xl">
              Decisão conjunta
            </p>
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 22 · PRÓXIMOS PASSOS ═══════════ */}
      <Slide index={idx("proximos-passos")} name="proximos-passos" tema="grafite">
        <Miolo>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.3fr]">
            <div>
              <Kicker>Próximos passos</Kicker>
              <H2>
                Do conceito
                <br />
                para a <Accent>operação</Accent>
              </H2>
              <Lead>Etapas objetivas, em sequência, até a Estação abrir as portas.</Lead>
            </div>
            <div className="grid gap-x-10 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-5">
              {PASSOS.map((p, i) => (
                <div key={p} className="a-up flex items-baseline gap-5 border-t border-[color:var(--line)] py-3.5">
                  <span className="font-display text-2xl font-bold tabular-nums leading-none tracking-tight" style={{ color: ORANGE }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="font-display text-lg font-medium uppercase leading-tight tracking-tight sm:text-xl">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </Miolo>
        <Rodape />
      </Slide>

      {/* ═══════════ 23 · ENCERRAMENTO ═══════════ */}
      <Slide index={idx("encerramento")} name="encerramento">
        <BgPhoto src={fimSrc} alt="Estação SOMMA pela manhã" veil="medio" position="50% 45%" />
        <Miolo className="flex min-h-[calc(100svh-10rem)] flex-col items-center justify-center text-center">
          <Lockup className="a-up justify-center" size="md" />
          <div className="a-mask mt-12 overflow-hidden py-1">
            <h2 className="font-display text-[3.2rem] font-bold uppercase leading-[0.86] tracking-tight sm:text-7xl md:text-[6.6rem]">
              Estação SOMMA
            </h2>
          </div>
          <Manifesto className="mt-4 text-white/90">Café, Cultura e Movimento</Manifesto>
          <p className="a-up mt-4 font-display text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
            powered by Evolve
          </p>
          <div className="a-rail mt-9 h-px w-20 origin-center" style={{ backgroundColor: ORANGE }} />
          <p className="a-up mt-8 max-w-2xl text-[15px] font-light leading-relaxed text-white/75 md:text-lg">
            Uma operação de A&amp;B que transforma comunidade em experiência, experiência em relacionamento e
            relacionamento em valor de marca.
          </p>
        </Miolo>
        <Rodape texto="SOMMA Club · Brasília · sommaclub.com.br" />
      </Slide>
    </div>
  );
}
