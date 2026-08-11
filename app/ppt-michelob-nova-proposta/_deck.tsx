"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Icon, type IconName } from "./_icons";
import { Lockup } from "./_marca";
import { ParqueMap } from "./_parque-map";
import {
  COMPARATIVO,
  CONTEXTO_CARDS,
  CONVIVENCIA,
  DESAFIOS,
  ESCOPO_FEE,
  INVESTIMENTOS,
  INVESTIMENTO_OBS,
  MICHELOB_ESCOPO,
  MES_BLOCOS,
  MES_CONDICOES,
  MES_JORNADA,
  TAKEOVER_BLOCOS,
  TAKEOVER_JORNADA,
  TAKEOVER_PONTE,
  TAKEOVER_MICHELOB,
  TAKEOVER_SOMMA,
  TOOLKIT,
  ULTRA_PASS,
  ULTRA_PASS_JORNADA,
  ULTRA_PASS_NOTA,
} from "./_dados";

const IMG = "/michelob";

/** Paleta Michelob Ultra, a mesma do deck de campanha. */
const NAVY = "#283280";
const RED = "#D22030";
const GOLD = "#C6A664";
/**
 * Azul Michelob clareado. O navy da marca não tem contraste sobre o fundo
 * escuro do deck, então tudo que é recomendado usa este tom — e o vermelho
 * fica só nos detalhes (cantos, marcadores, marcos de tabela).
 */
const BLUE = "#7A88F0";
/** Laranja Somma — só em acentos pontuais. */
const ORANGE = "#FF2C03";

const SLIDES = [
  "capa",
  "oportunidade",
  "toolkit",
  "takeover",
  "takeover-jornada",
  "takeover-somma",
  "takeover-michelob",
  "mes",
  "mes-jornada",
  "ultra-pass",
  "ultra-pass-regua",
  "desafios",
  "convivencia",
  "comparativo",
  "investimentos",
  "fee",
  "michelob-escopo",
  "recomendacao",
  "fechamento",
] as const;

export function Deck() {
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
      // Barra de progresso do deck inteiro.
      if (bar.current) {
        gsap.fromTo(
          bar.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { scroller: el, start: 0, end: "max", scrub: 0.3 },
          },
        );
      }

      gsap.utils.toArray<HTMLElement>("[data-slide]").forEach((section, i) => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: section, scroller: el, start: "top 70%", once: true },
        });

        // Títulos sobem por trás de uma máscara.
        const masked = section.querySelectorAll<HTMLElement>(".a-mask > *");
        if (masked.length) {
          tl.from(masked, { yPercent: 115, duration: 1.05, ease: "power4.out", stagger: 0.08 }, 0);
        }
        // Fios e trilhos crescem da esquerda.
        const rails = section.querySelectorAll<HTMLElement>(".a-rail");
        if (rails.length) {
          tl.from(rails, { scaleX: 0, duration: 1.1, ease: "power3.inOut", stagger: 0.06 }, 0.15);
        }
        // Blocos de conteúdo.
        const ups = section.querySelectorAll<HTMLElement>(".a-up");
        if (ups.length) {
          tl.from(ups, { y: 30, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.06 }, 0.2);
        }
        // Nós das jornadas pipocam.
        const nodes = section.querySelectorAll<HTMLElement>("[data-node]");
        if (nodes.length) {
          tl.from(nodes, { scale: 0, opacity: 0, duration: 0.5, ease: "back.out(2.2)", stagger: 0.07 }, 0.25);
        }

        ScrollTrigger.create({
          trigger: section,
          scroller: el,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => self.isActive && setActive(i),
        });
      });

      // Parallax das fotos de fundo.
      gsap.utils.toArray<HTMLElement>(".parallax").forEach((img) => {
        gsap.to(img, {
          yPercent: 10,
          ease: "none",
          scrollTrigger: {
            trigger: img.parentElement!,
            scroller: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
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

  return (
    <div
      ref={scroller}
      className="h-screen w-full snap-y snap-proximity overflow-y-auto md:snap-mandatory overflow-x-hidden bg-[#060B1C] text-white antialiased"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Progresso do deck */}
      <div className="fixed left-0 top-0 z-50 h-[2px] w-full bg-white/[0.07]">
        <div
          ref={bar}
          className="h-full w-full origin-left"
          style={{ background: `linear-gradient(90deg, ${GOLD}, ${RED})` }}
        />
      </div>

      {/* Navegação lateral */}
      <div className="fixed right-5 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-2.5 md:flex">
        {SLIDES.map((name, i) => (
          <button key={name} onClick={() => goTo(i)} aria-label={`Ir para slide ${i + 1}`} className="group flex justify-end">
            <span
              className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                active === i ? "w-7" : "w-1.5 bg-white/25 group-hover:bg-white/60"
              }`}
              style={active === i ? { backgroundColor: RED } : undefined}
            />
          </button>
        ))}
      </div>

      <div className="fixed bottom-6 left-6 z-50 flex items-baseline gap-1.5 font-mono text-[11px] tracking-[0.2em] md:left-9">
        <span className="text-white/70">{String(active + 1).padStart(2, "0")}</span>
        <span className="text-white/20">/</span>
        <span className="text-white/30">{total}</span>
      </div>

      {/* ═══════════ 01 · CAPA ═══════════ */}
      <Slide index={idx("capa")} name="capa" className="justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={`${IMG}/m-capa.jpg`}
            alt="Corredores do Somma Club em um sábado de treino"
            fill
            priority
            quality={90}
            sizes="100vw"
            className="parallax scale-105 object-cover object-center md:hidden"
          />
          <Image
            src={`${IMG}/capa.jpg`}
            alt=""
            aria-hidden
            fill
            priority
            quality={90}
            sizes="100vw"
            className="parallax hidden scale-105 object-cover object-center md:block"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060B1C] via-[#060B1C]/85 to-[#060B1C]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060B1C] via-transparent to-[#060B1C]/45" />
        </div>

        <div className="container-somma relative z-10">
          <div className="max-w-3xl">
            <Lockup className="a-up" size="lg" />
            <div className="a-rail mt-8 h-px w-24 origin-left" style={{ backgroundColor: GOLD }} />
            <p
              className="a-up mt-6 font-display text-[10px] font-semibold uppercase tracking-[0.4em] sm:text-xs sm:tracking-[0.45em]"
              style={{ color: GOLD }}
            >
              Formatos de ativação · 2026
            </p>
            <div className="a-mask mt-4 overflow-hidden py-1">
              <h1 className="font-display text-[2.4rem] font-bold uppercase leading-[0.9] tracking-tight sm:text-5xl md:text-7xl">
                Somma Club <span className="font-light text-white/40">×</span>
                <br />
                <span style={{ color: RED }}>Michelob Ultra</span>
              </h1>
            </div>
            <p className="a-up mt-6 text-lg font-light leading-snug text-white/85 md:text-2xl">
              Formatos de ativação nos sábados do Somma.
            </p>
            <p className="a-up mt-3 max-w-xl text-sm leading-relaxed text-white/55 md:text-base">
              Uma entrada mais simples, recorrente e conectada à comunidade.
            </p>

            <div className="mt-9 flex flex-wrap gap-2.5">
              {(
                [
                  ["corrida", "Sábado de corrida"],
                  ["tenda", "Toolkit Michelob"],
                  ["musica", "DJ"],
                  ["trial", "Trial"],
                  ["comunidade", "Comunidade"],
                ] as const
              ).map(([icon, label]) => (
                <Chip key={label} icon={icon} label={label} />
              ))}
            </div>
          </div>
        </div>

        <p className="absolute bottom-6 right-6 z-10 text-[11px] text-white/30 md:right-9">
          Consumo responsável. Para maiores de 18 anos.
        </p>
      </Slide>

      {/* ═══════════ 02 · A OPORTUNIDADE ═══════════ */}
      <Slide index={idx("oportunidade")} name="oportunidade">
        <BgPhoto name="comunidade" alt="Pelotão do Somma Club em um sábado de treino" />
        <div className="container-somma relative z-10">
          <Kicker>Contexto</Kicker>
          <H2>
            A <Accent>oportunidade</Accent>
          </H2>
          <Lead>
            A Michelob Ultra pode começar com ativações mais simples, usando o toolkit já existente da marca,
            sem perder recorrência, conteúdo e presença real na comunidade.
          </Lead>

          <Destaque>
            Em vez de uma corrida temática isolada, propomos formatos que ocupam o ritual semanal do Somma.
          </Destaque>

          <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-3">
            {CONTEXTO_CARDS.map((c) => (
              <div
                key={c.n}
                className="a-up rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: GOLD }}>
                    <Icon name={c.icon} className="h-7 w-7" />
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.3em] text-white/25">{c.n}</span>
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold uppercase leading-tight tracking-tight sm:text-2xl">
                  {c.titulo}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/55">{c.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* ═══════════ 03 · TOOLKIT ═══════════ */}
      <Slide index={idx("toolkit")} name="toolkit" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>O que já podemos usar</Kicker>
          <H2>
            Toolkit <Accent>Michelob Ultra</Accent>
          </H2>
          <Lead>
            A ideia é otimizar o que a marca já possui e transformar esses materiais em uma experiência
            organizada dentro dos encontros do Somma.
          </Lead>

          {/* Fotos de ativações reais da marca: o material já existe, não é render. */}
          <div className="mt-9 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {TOOLKIT.map((item) => (
              <ToolkitCard
                key={item.nome}
                icon={item.icon}
                nome={item.nome}
                foto={"foto" in item ? item.foto : undefined}
              />
            ))}
          </div>

          <Nota>Registros de ativações da Michelob Ultra em Brasília.</Nota>
        </div>
      </Slide>

      {/* ═══════════ 04 · OPÇÃO 1 ═══════════ */}
      <Slide index={idx("takeover")} name="takeover">
        <BgPhoto name="pelotao" alt="Corredores do Somma Club largando em grupo" />
        <div className="container-somma relative z-10">
          <div className="flex items-center gap-3">
            <OpcaoTag n="01" />
            <Kicker className="!mt-0">Opção 1</Kicker>
          </div>
          <H2>
            Somma Day <Accent>Takeover</Accent>
          </H2>
          <p className="a-up mt-4 font-display text-lg font-medium uppercase tracking-wide text-white/70 md:text-xl">
            Um sábado do mês. Um Somma Day inteiro da marca.
          </p>
          <Lead>
            A Michelob Ultra ocupa um Somma Day com landing page e check-in próprios, chamada do evento,
            corrida temática, presença visual da marca, DJ, trial, brindes, desafios simples, conteúdo e
            relacionamento com a comunidade.
          </Lead>

          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {TAKEOVER_BLOCOS.map((b) => (
              <Bloco key={b.rotulo} rotulo={b.rotulo} valor={b.valor} />
            ))}
          </div>

          {/* Aviso curto de que existe um formato de mês. O conteúdo dele fica
              na Opção 2, para esta tela falar de uma ativação só. */}
          <PonteOpcao />
        </div>
      </Slide>

      {/* ═══════════ 05 · JORNADA DO TAKEOVER ═══════════ */}
      <Slide index={idx("takeover-jornada")} name="takeover-jornada" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Como funciona</Kicker>
          <H2 className="max-w-4xl">
            O sábado do <Accent>Takeover</Accent>
          </H2>

          <div className="mt-12 grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {TAKEOVER_JORNADA.map((p, i) => (
              <Passo
                key={p.n}
                n={p.n}
                icon={p.icon}
                titulo={p.titulo}
                detalhe={p.detalhe}
                ultimo={i === TAKEOVER_JORNADA.length - 1}
              />
            ))}
          </div>

          <Nota>
            Trial apenas após a atividade esportiva e exclusivo para maiores de 18 anos.
          </Nota>
        </div>
      </Slide>

      {/* ═══════════ 06 · ENTREGAS DO SOMMA ═══════════ */}
      <Slide index={idx("takeover-somma")} name="takeover-somma">
        <BgPhoto name="entrega" alt="Equipe do Somma Club em operação de evento" />
        <div className="container-somma relative z-10">
          <Kicker>Entregas do Somma no Takeover</Kicker>
          <H2>
            O que o <Accent>Somma</Accent> entrega
          </H2>

          <div className="mt-9">
            <DataTable
              head={["Frente", "Entrega Somma"]}
              colW={["32%", "68%"]}
              rows={TAKEOVER_SOMMA.map((r) => ({ cells: [r.frente, r.entrega] }))}
            />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 07 · RESPONSABILIDADES DA MICHELOB ═══════════ */}
      <Slide index={idx("takeover-michelob")} name="takeover-michelob" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Responsabilidades da Michelob no Takeover</Kicker>
          <H2>
            O que fica com a <Accent>marca</Accent>
          </H2>

          <div className="mt-9">
            <DataTable
              head={["Frente", "Responsabilidade Michelob"]}
              colW={["32%", "68%"]}
              accent={RED}
              rows={TAKEOVER_MICHELOB.map((r) => ({ cells: [r.frente, r.responsabilidade] }))}
            />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 08 · OPÇÃO 2 ═══════════ */}
      <Slide index={idx("mes")} name="mes">
        <BgPhoto name="social-pace" alt="Comunidade do Somma Club reunida depois do treino" />
        <div className="container-somma relative z-10">
          <div className="flex items-center gap-3">
            <OpcaoTag n="02" destaque />
            <Kicker className="!mt-0">Opção 2</Kicker>
          </div>
          <H2>
            Somma Day Takeover <Accent>· Mês</Accent>
          </H2>
          <p className="a-up mt-4 font-display text-lg font-medium uppercase tracking-wide text-white/70 md:text-xl">
            Quatro semanas. Quatro experiências. Um evento final aberto.
          </p>
          <Lead>
            O mesmo Takeover esticado para um mês inteiro: quatro ativações seguidas, criando
            recorrência, conteúdo e relacionamento, com fechamento em um evento de domingo no Parque da
            Cidade.
          </Lead>

          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-6">
            {MES_BLOCOS.map((b) => (
              <Bloco
                key={b.rotulo}
                rotulo={b.rotulo}
                valor={b.valor}
                destaque={"destaque" in b ? b.destaque : false}
              />
            ))}
          </div>
        </div>
      </Slide>

      {/* ═══════════ 09 · JORNADA DO MÊS ═══════════ */}
      <Slide index={idx("mes-jornada")} name="mes-jornada" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Jornada do mês de ativação</Kicker>
          <H2>
            Quatro <Accent>semanas</Accent>
          </H2>

          <div className="mt-9">
            <DataTable
              head={["Semana", "Ativação", "Experiência"]}
              colW={["16%", "26%", "58%"]}
              accent={GOLD}
              rows={MES_JORNADA.map((r) => ({
                cells: [
                  r.sabado,
                  <span key="a" className="font-display text-sm font-semibold uppercase tracking-wide text-white sm:text-base">
                    {r.ativacao}
                  </span>,
                  r.experiencia,
                ],
                marco: "marco" in r ? r.marco : false,
              }))}
            />
          </div>

          {/* Prazo de setup e desenho do evento final, que mudam o planejamento
              da marca. O mapa 3D fica ao lado, mostrando onde o mês termina. */}
          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <div className="flex flex-col gap-3">
              {MES_CONDICOES.map((c) => (
                <div
                  key={c.titulo}
                  className="a-up flex flex-1 gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
                >
                  <span
                    data-node
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-[#060B1C]"
                    style={{ borderColor: GOLD, color: GOLD }}
                  >
                    <Icon name={c.icon} className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold uppercase leading-tight tracking-wide">
                      {c.titulo}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{c.texto}</p>
                  </div>
                </div>
              ))}
            </div>

            <ParqueMap />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 10 · ULTRA PASS ═══════════ */}
      <Slide index={idx("ultra-pass")} name="ultra-pass">
        <BgPhoto name="digital" alt="Corredora usando o celular depois do treino" />
        <div className="container-somma relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Kicker>Ultra Pass · como funciona</Kicker>
            {/* Simulação clicável, para abrir na reunião. */}
            <a
              href="/ppt-michelob-nova-proposta/ultra-pass"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white"
              style={{ borderColor: `${RED}59` }}
            >
              Abrir simulação →
            </a>
          </div>
          <H2 className="max-w-3xl">
            Do cadastro ao <Accent>prêmio</Accent>, semana a semana
          </H2>

          {/* Duas trilhas de três passos, para a jornada caber na tela ao lado
              do mockup do pass. A leitura segue coluna a coluna. */}
          <div className="mt-7 grid items-start gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            {[ULTRA_PASS_JORNADA.slice(0, 3), ULTRA_PASS_JORNADA.slice(3)].map((grupo, coluna) => (
              <ol key={coluna} className="relative">
                <span
                  className="a-rail absolute bottom-7 left-[19px] top-7 w-px origin-top"
                  style={{
                    background: coluna === 0
                      ? `linear-gradient(180deg, ${GOLD}, ${GOLD}88)`
                      : `linear-gradient(180deg, ${GOLD}88, ${RED})`,
                  }}
                  aria-hidden
                />
                {grupo.map((p) => {
                  const ultimo = p.n === String(ULTRA_PASS_JORNADA.length);
                  return (
                    <li key={p.n} className="relative flex gap-4 pb-6 last:pb-0">
                      <span
                        data-node
                        className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-[#060B1C]"
                        style={{ borderColor: ultimo ? RED : GOLD, color: ultimo ? RED : GOLD }}
                      >
                        <Icon name={p.icon} className="h-4 w-4" />
                      </span>
                      <div className="a-up pt-1">
                        <div className="flex items-baseline gap-2.5">
                          <span className="font-mono text-[10px] tracking-[0.3em] text-white/30">
                            {p.n.padStart(2, "0")}
                          </span>
                          <h3 className="font-display text-base font-semibold uppercase leading-tight tracking-wide">
                            {p.titulo}
                          </h3>
                        </div>
                        <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">{p.detalhe}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ))}

            <PassMockup />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 11 · RÉGUA DO ULTRA PASS ═══════════ */}
      <Slide index={idx("ultra-pass-regua")} name="ultra-pass-regua" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Ultra Pass · régua de benefícios</Kicker>
          <H2 className="max-w-3xl">
            Cada selo <Accent>abre</Accent> o degrau seguinte
          </H2>

          {/* Escada: a altura e a barra crescem junto com o número de selos. */}
          <div className="mt-10 grid grid-cols-2 items-end gap-3 lg:grid-cols-4">
            {ULTRA_PASS.map((d) => (
              <DegrauPass key={d.selos} {...d} marco={"marco" in d ? d.marco : false} />
            ))}
          </div>

          <Nota>{ULTRA_PASS_NOTA}</Nota>
        </div>
      </Slide>

      {/* ═══════════ 11 · DESAFIOS ═══════════ */}
      <Slide index={idx("desafios")} name="desafios" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Desafios esportivos simples</Kicker>
          <H2 className="max-w-4xl">
            Ativações que geram <Accent>participação</Accent> e conteúdo
          </H2>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {DESAFIOS.map((d) => (
              <div
                key={d.n}
                className="a-up relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: RED }}>
                    <Icon name={d.icon} className="h-8 w-8" />
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.3em] text-white/25">{d.n}</span>
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold uppercase leading-tight tracking-tight sm:text-2xl">
                  {d.nome}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/55">{d.texto}</p>
              </div>
            ))}
          </div>

          <Destaque>
            A competição não precisa ser complexa. Precisa ser fácil de entender, fácil de executar e boa para
            conteúdo.
          </Destaque>
        </div>
      </Slide>

      {/* ═══════════ 12 · TRIAL E CONVIVÊNCIA ═══════════ */}
      <Slide index={idx("convivencia")} name="convivencia">
        <BgPhoto name="afterrun" alt="Grupo do Somma Club no pós-treino" />
        <div className="container-somma relative z-10">
          <Kicker>Trial e convivência</Kicker>
          <H2 className="max-w-4xl">
            O pós-treino como território da <Accent>Michelob Ultra</Accent>
          </H2>
          <Lead>
            A experimentação acontece depois da atividade esportiva, dentro de um ambiente de convivência,
            música e relacionamento.
          </Lead>

          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CONVIVENCIA.map((c) => (
              <div
                key={c.nome}
                className="a-up flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm"
              >
                <span style={{ color: GOLD }}>
                  <Icon name={c.icon} className="h-5 w-5" />
                </span>
                <p className="text-[13px] font-medium leading-tight text-white/80">{c.nome}</p>
              </div>
            ))}
          </div>

          <Nota>Experimentação exclusiva para maiores de 18 anos. Consumo responsável.</Nota>
        </div>
      </Slide>

      {/* ═══════════ 13 · COMPARATIVO ═══════════ */}
      <Slide index={idx("comparativo")} name="comparativo" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Comparativo dos formatos e investimento</Kicker>
          <H2>
            Lado a <Accent>lado</Accent>
          </H2>

          <div className="mt-9">
            <DataTable
              head={["Critério", "Somma Day Takeover", "Somma Day Takeover · Mês"]}
              colW={["22%", "33%", "45%"]}
              accent={GOLD}
              destaqueCol={2}
              rows={COMPARATIVO.map((r) =>
                "valor" in r
                  ? {
                      cells: [
                        r.criterio,
                        <ValorCell key="t">{r.takeover}</ValorCell>,
                        <ValorCell key="m">{r.mes}</ValorCell>,
                      ],
                      marco: true,
                    }
                  : { cells: [r.criterio, r.takeover, r.mes] },
              )}
            />
          </div>

          <Nota>
            Esta é a única tela com valores. Os dois formatos já incluem impostos; a liberação da marca
            em espaço público é cobrada à parte apenas no Somma Day Takeover.
          </Nota>
        </div>
      </Slide>

      {/* ═══════════ 14 · INVESTIMENTOS ═══════════ */}
      <Slide index={idx("investimentos")} name="investimentos">
        <BgPhoto name="marca" alt="Ativação de marca em um sábado do Somma Club" />
        <div className="container-somma relative z-10">
          <Kicker>Formatos comerciais</Kicker>
          <H2>
            Dois caminhos de <Accent>entrada</Accent>
          </H2>

          <div className="mt-9 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {INVESTIMENTOS.map((i) => (
              <PrecoCard key={i.nome} {...i} />
            ))}
          </div>

          <div
            className="a-up mt-6 flex items-start gap-3 rounded-2xl border p-4 sm:p-5"
            style={{ borderColor: `${GOLD}33`, backgroundColor: "rgba(255,255,255,0.02)" }}
          >
            <span className="mt-0.5 shrink-0">
              <RibbonMark gold />
            </span>
            <p className="text-[13px] leading-relaxed text-white/60">{INVESTIMENTO_OBS}</p>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 15 · O QUE ESTÁ INCLUÍDO NO FEE ═══════════ */}
      <Slide index={idx("fee")} name="fee" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>O que está incluído no fee do Somma</Kicker>
          <H2>
            Escopo por <Accent>formato</Accent>
          </H2>

          <div className="mt-9">
            <DataTable
              head={["Entregável", "Somma Day Takeover", "Takeover · Mês"]}
              colW={["40%", "30%", "30%"]}
              destaqueCol={2}
              rows={ESCOPO_FEE.map((r) => ({
                cells: [
                  r.frente,
                  <Marca key="t" value={r.takeover} />,
                  <Marca key="m" value={r.mes} />,
                ],
              }))}
            />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 16 · O QUE FICA COM A MICHELOB ═══════════ */}
      <Slide index={idx("michelob-escopo")} name="michelob-escopo">
        <BgPhoto name="desafio" alt="Estrutura de ativação montada em evento do Somma Club" />
        <div className="container-somma relative z-10">
          <Kicker>O que fica com a Michelob</Kicker>
          <H2>
            Responsabilidades da <Accent>marca</Accent>
          </H2>

          <div className="mt-9">
            <DataTable
              head={["Michelob / Agência", "Responsabilidade"]}
              colW={["28%", "72%"]}
              accent={RED}
              rows={MICHELOB_ESCOPO.map((r) => ({ cells: [r.frente, r.responsabilidade] }))}
            />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 17 · RECOMENDAÇÃO ═══════════ */}
      <Slide index={idx("recomendacao")} name="recomendacao">
        <BgPhoto name="recomendacao" alt="Corredores do Somma Club celebrando a chegada" veil="cover" />
        <div className="container-somma relative z-10">
          <Kicker>Recomendação</Kicker>
          <H2 className="max-w-4xl">
            Nossa <Accent>recomendação</Accent>
          </H2>

          <div className="mt-9 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
            <div
              className="a-up relative overflow-hidden rounded-3xl border p-6 sm:p-9"
              style={{ borderColor: `${BLUE}59`, backgroundColor: `${BLUE}0F` }}
            >
              <Corners />
              <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
                Começar por
              </p>
              <p className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight sm:text-4xl md:text-5xl">
                Somma Day Takeover
                <br />
                <span style={{ color: BLUE }}>Mês de ativação</span>
              </p>
              <div className="mt-6">
                <Selo>Recomendado</Selo>
              </div>
            </div>

            <div className="a-up rounded-3xl border border-white/10 bg-[#060B1C]/70 p-6 backdrop-blur-sm sm:p-8">
              <p className="text-[15px] leading-relaxed text-white/70">
                Ele é mais acessível que a proposta original, mas mantém o que realmente cria valor:
                recorrência, comunidade, conteúdo, dados e presença real da marca nos sábados do Somma —
                com landing page, check-in, chamada do evento, mídia e influenciadores da nossa base em
                todas as semanas.
              </p>
              <p
                className="mt-7 border-l-2 pl-5 font-display text-xl font-medium uppercase leading-snug tracking-tight md:text-2xl"
                style={{ borderColor: ORANGE }}
              >
                Não é apenas aparecer em um treino. É ocupar quatro semanas da comunidade e fechar com
                um evento aberto.
              </p>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 18 · FECHAMENTO ═══════════ */}
      <Slide index={idx("fechamento")} name="fechamento" className="justify-center">
        <BgPhoto name="fechamento" alt="Pelotão do Somma Club ao amanhecer" veil="cover" />
        <div className="container-somma relative z-10 text-center">
          <Kicker className="justify-center">Fechamento</Kicker>
          <div className="a-mask mt-5 overflow-hidden py-1">
            <h2 className="mx-auto max-w-4xl font-display text-[2rem] font-bold uppercase leading-[0.95] tracking-tight sm:text-4xl md:text-6xl">
              Vamos começar simples, mas com <span style={{ color: RED }}>visão de plataforma</span>.
            </h2>
          </div>
          <p className="a-up mx-auto mt-7 max-w-2xl text-[15px] leading-relaxed text-white/70 md:text-lg">
            Dá para entrar por um sábado ou esticar para um mês inteiro de ativação. Nas duas portas de
            entrada a marca ativa o toolkit Michelob, testa a resposta da comunidade e gera aprendizado
            para a próxima campanha.
          </p>

          <div className="a-up mx-auto mt-11 flex max-w-2xl flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#060B1C]/75 px-6 py-9 backdrop-blur-sm sm:px-10">
            <Lockup size="md" />
            <p className="font-display text-xl font-semibold uppercase tracking-tight text-white md:text-2xl">
              Um sábado ou um mês inteiro.
              <br />
              <span style={{ color: GOLD }}>Uma comunidade em movimento.</span>
            </p>
          </div>

          <p className="a-up mt-10 text-[11px] leading-relaxed text-white/30">
            Consumo responsável. Experimentação destinada exclusivamente ao público maior de 18 anos.
          </p>
        </div>
      </Slide>
    </div>
  );
}

/* ── Estrutura ─────────────────────────────────────────────────────────── */

function Slide({
  index,
  name,
  className = "",
  children,
}: {
  index: number;
  name: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-slide={name}
      data-index={index}
      className={`relative flex min-h-screen w-full snap-start flex-col justify-center px-2 py-14 md:py-20 ${className}`}
    >
      {children}
    </section>
  );
}

function BgPhoto({
  name,
  alt,
  veil = "cards",
}: {
  name: string;
  alt: string;
  veil?: "cover" | "cards";
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Recorte 9:16 no celular e 16:9 no desktop; as duas são lazy, então só
          a do breakpoint atual é baixada. */}
      <Image
        src={`${IMG}/m-${name}.jpg`}
        alt={alt}
        fill
        sizes="100vw"
        className="parallax scale-105 object-cover object-center md:hidden"
      />
      <Image
        src={`${IMG}/${name}.jpg`}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="parallax hidden scale-105 object-cover object-center md:block"
      />
      {veil === "cover" ? (
        <>
          <div className="absolute inset-0 bg-[#060B1C]/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060B1C]/75 via-[#060B1C]/55 to-[#060B1C]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[#060B1C]/[0.82]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060B1C] via-[#060B1C]/45 to-[#060B1C]/70" />
        </>
      )}
    </div>
  );
}

/** Malha sutil para os slides sem foto. */
function Grid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
        maskImage: "radial-gradient(70% 60% at 50% 40%, #000 20%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(70% 60% at 50% 40%, #000 20%, transparent 100%)",
      }}
    />
  );
}

/* ── Elementos gráficos ────────────────────────────────────────────────── */

/** Fita da Michelob Ultra, usada como marcador. */
function RibbonMark({ gold }: { gold?: boolean }) {
  return (
    <svg width="9" height="14" viewBox="0 0 9 14" fill="none" className="shrink-0" aria-hidden>
      <path d="M0 0h9v14L4.5 10.6 0 14V0Z" fill={gold ? GOLD : RED} />
    </svg>
  );
}

/** Cantos em L, moldura discreta dos cartões de destaque. */
function Corners() {
  const base = "pointer-events-none absolute h-3.5 w-3.5 border-current";
  return (
    <span className="pointer-events-none absolute inset-0" style={{ color: `${RED}80` }} aria-hidden>
      <span className={`${base} left-3 top-3 border-l border-t`} />
      <span className={`${base} right-3 top-3 border-r border-t`} />
      <span className={`${base} bottom-3 left-3 border-b border-l`} />
      <span className={`${base} bottom-3 right-3 border-b border-r`} />
    </span>
  );
}

/** Numeral grande das opções 01 e 02. */
function OpcaoTag({ n, destaque }: { n: string; destaque?: boolean }) {
  const cor = destaque ? BLUE : GOLD;
  return (
    <span
      className="a-up flex h-9 items-center rounded-lg border px-3 font-display text-sm font-bold tracking-[0.2em]"
      style={{ borderColor: `${cor}66`, backgroundColor: `${cor}14`, color: cor }}
    >
      {n}
    </span>
  );
}

/** Selo do formato recomendado: azul Michelob, com o ponto vermelho de detalhe. */
function Selo({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.2em]"
      style={{ backgroundColor: `${BLUE}1F`, color: BLUE }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RED }} aria-hidden />
      {children}
    </span>
  );
}

function SeloNeutro({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.2em]"
      style={{ backgroundColor: `${GOLD}1A`, color: GOLD }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: GOLD }} aria-hidden />
      {children}
    </span>
  );
}

function Chip({ icon, label }: { icon: IconName; label: string }) {
  return (
    <span className="a-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 backdrop-blur-sm">
      <span style={{ color: GOLD }}>
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <span className="text-[12px] font-medium text-white/80">{label}</span>
    </span>
  );
}

/* ── Tipografia ────────────────────────────────────────────────────────── */

function Kicker({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`a-up flex items-center gap-2.5 font-display text-[10px] font-semibold uppercase tracking-[0.22em] sm:gap-3 sm:text-xs sm:tracking-[0.35em] ${className}`}
      style={{ color: GOLD }}
    >
      <RibbonMark gold />
      {children}
    </p>
  );
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="a-mask mt-5 overflow-hidden py-1">
      <h2
        className={`font-display text-[1.9rem] font-bold uppercase leading-[0.95] tracking-tight sm:text-4xl md:text-6xl ${className}`}
      >
        {children}
      </h2>
    </div>
  );
}

function Lead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`a-up mt-5 max-w-3xl text-[15px] font-light leading-relaxed text-white/70 sm:mt-6 md:text-lg ${className}`}
    >
      {children}
    </p>
  );
}

function Accent({ children }: { children: React.ReactNode }) {
  return <span style={{ color: RED }}>{children}</span>;
}

/** Faixa de destaque. */
function Destaque({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="a-up mt-8 max-w-3xl border-l-2 pl-5 font-display text-lg font-medium uppercase leading-snug tracking-tight md:text-2xl"
      style={{ borderColor: RED }}
    >
      {children}
    </p>
  );
}

/** Nota discreta (ressalvas). */
function Nota({ children }: { children: React.ReactNode }) {
  return <p className="a-up mt-6 text-xs leading-relaxed text-white/35">{children}</p>;
}

/* ── Blocos ────────────────────────────────────────────────────────────── */

/** Bloco rótulo/valor usado nas fichas das duas opções. */
function Bloco({
  rotulo,
  valor,
  apoio,
  destaque,
}: {
  rotulo: string;
  valor: string;
  apoio?: string;
  destaque?: boolean;
}) {
  // O bloco de investimento é o único que carrega uma linha de apoio, e ganha
  // moldura dourada para o número saltar sem competir com o bloco recomendado.
  const realce = Boolean(apoio);
  return (
    <div
      className="a-up rounded-2xl border p-4 backdrop-blur-sm sm:p-5"
      style={
        destaque
          ? { borderColor: `${BLUE}59`, backgroundColor: `${BLUE}12` }
          : realce
            ? { borderColor: `${GOLD}59`, backgroundColor: `${GOLD}0F` }
            : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }
      }
    >
      <p
        className="font-mono text-[9px] uppercase tracking-[0.22em]"
        style={{ color: destaque ? BLUE : realce ? GOLD : "rgba(255,255,255,0.35)" }}
      >
        {rotulo}
      </p>
      <p className="mt-2.5 font-display text-base font-semibold uppercase leading-tight tracking-wide sm:text-lg">
        {valor}
      </p>
      {apoio && <p className="mt-1.5 text-[11px] leading-tight text-white/45">{apoio}</p>}
    </div>
  );
}

/** Etapa numerada da jornada do Takeover. */
function Passo({
  n,
  icon,
  titulo,
  detalhe,
  ultimo,
}: {
  n: string;
  icon: IconName;
  titulo: string;
  detalhe: string;
  ultimo?: boolean;
}) {
  const cor = ultimo ? RED : GOLD;
  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <span
          data-node
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 bg-[#060B1C]"
          style={{ borderColor: cor, color: cor }}
        >
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <span className="h-px flex-1 bg-white/10" aria-hidden />
        <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: cor }}>
          {n}
        </span>
      </div>
      <h3 className="a-up mt-4 font-display text-lg font-semibold uppercase leading-tight tracking-tight">
        {titulo}
      </h3>
      <p className="a-up mt-1.5 text-[13px] leading-relaxed text-white/55">{detalhe}</p>
    </div>
  );
}

/**
 * Degrau da régua do Ultra Pass. Os quatro cartões ficam alinhados pela base e
 * crescem em altura conforme os selos, então a escada se lê antes do texto.
 */
function DegrauPass({
  selos,
  frequencia,
  rotulo,
  beneficio,
  marco,
}: {
  selos: number;
  frequencia: string;
  rotulo: string;
  beneficio: string;
  marco?: boolean;
}) {
  const cor = marco ? RED : GOLD;
  return (
    <div
      // A altura mínima é o que desenha a escada: o texto varia de tamanho e
      // sozinho não daria degraus regulares.
      className="a-up flex flex-col rounded-2xl border p-4 sm:p-5"
      style={{
        borderColor: marco ? `${RED}59` : "rgba(255,255,255,0.1)",
        backgroundColor: marco ? `${RED}12` : "rgba(255,255,255,0.03)",
        minHeight: `${170 + selos * 26}px`,
      }}
    >
      {/* Selos carimbados até aqui */}
      <div className="flex gap-1.5" aria-label={`${selos} de 4 selos`}>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full border"
            style={
              i <= selos
                ? { backgroundColor: cor, borderColor: cor }
                : { borderColor: "rgba(255,255,255,0.22)" }
            }
          />
        ))}
      </div>

      <div className="mt-auto pt-5">
        <p className="font-display text-2xl font-bold leading-none tracking-tight sm:text-3xl">
          {frequencia}
        </p>
        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.22em]" style={{ color: cor }}>
          {rotulo}
        </p>

        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <span
            className="block h-full rounded-full"
            style={{ width: `${(selos / 4) * 100}%`, backgroundColor: cor }}
          />
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-white/60">{beneficio}</p>
      </div>
    </div>
  );
}

/**
 * Item do toolkit. Com foto, o card vira a própria imagem da ativação, com o
 * nome sobreposto; sem foto, cai no cartão de ícone, mantendo a mesma altura.
 */
function ToolkitCard({ icon, nome, foto }: { icon: IconName; nome: string; foto?: string }) {
  return (
    <div className="a-up group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-white/25">
      {foto && (
        <>
          <Image
            src={`${IMG}/toolkit/${foto}.jpg`}
            alt={`${nome} em ativação da Michelob Ultra`}
            fill
            quality={75}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060B1C] via-[#060B1C]/25 to-transparent" />
        </>
      )}

      <span
        className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-sm"
        style={{ backgroundColor: `${NAVY}A6`, color: "#fff" }}
      >
        <Icon name={icon} className="h-4 w-4" />
      </span>

      <p className="absolute inset-x-3 bottom-3 font-display text-sm font-semibold uppercase leading-tight tracking-wide sm:text-base">
        {nome}
      </p>
    </div>
  );
}

/**
 * Faixa fina no rodapé da Opção 1: avisa que o formato de mês existe sem
 * abrir conteúdo dele, para a tela continuar falando de uma ativação só.
 */
function PonteOpcao() {
  return (
    <div className="a-up mt-5 flex flex-col gap-1.5 border-l-2 py-1 pl-4 sm:flex-row sm:items-center sm:gap-4" style={{ borderColor: `${BLUE}66` }}>
      <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: BLUE }}>
        {TAKEOVER_PONTE.rotulo}
      </p>
      <p className="text-[13px] leading-relaxed text-white/55">{TAKEOVER_PONTE.texto}</p>
    </div>
  );
}

/** Cartão de investimento. */
function PrecoCard({
  nome,
  duracao,
  escopo,
  selo,
  destaque,
}: {
  nome: string;
  duracao: string;
  escopo: string;
  selo?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className="a-up relative flex flex-col overflow-hidden rounded-3xl border p-6 backdrop-blur-sm sm:p-7"
      style={
        destaque
          ? { borderColor: `${BLUE}59`, backgroundColor: `${BLUE}12` }
          : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }
      }
    >
      {destaque && <Corners />}
      {/* O selo fica no topo para que os títulos dos cartões alinhem na mesma linha. */}
      <div className="relative z-10 flex min-h-[26px] items-start justify-end">
        {selo && (destaque ? <Selo>{selo}</Selo> : <SeloNeutro>{selo}</SeloNeutro>)}
      </div>

      <h3 className="relative z-10 mt-4 font-display text-xl font-semibold uppercase leading-tight tracking-tight sm:text-2xl">
        {nome}
      </h3>
      <p
        className="relative z-10 mt-1.5 font-mono text-[10px] uppercase tracking-[0.25em]"
        style={{ color: destaque ? BLUE : GOLD }}
      >
        {duracao}
      </p>

      <p className="relative z-10 mt-5 text-[13px] leading-relaxed text-white/55">{escopo}</p>

      {/* Os valores ficam só na tabela comparativa, para a conversa aqui ser de escopo. */}
      <div className="relative z-10 mt-auto pt-7">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">
          Investimento na tabela comparativa
        </p>
      </div>
    </div>
  );
}

/** Valor monetário dentro de uma tabela: peso maior que o texto corrido. */
function ValorCell({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display text-base font-bold tracking-tight text-white sm:text-lg">
      {children}
    </span>
  );
}

/** Marcação Sim / Não / texto curto das tabelas de escopo. */
function Marca({ value }: { value: string }) {
  if (value === "Não") {
    return <span className="text-white/30">Não</span>;
  }
  return (
    <span className="inline-flex items-center gap-2 text-white/80">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: GOLD }} aria-hidden />
      {value}
    </span>
  );
}

/**
 * Mockup do Ultra Pass: celular desenhado em CSS, com os quatro check-ins da
 * série e o progresso em 3 de 4 sábados.
 */
function PassMockup() {
  return (
    <div className="a-up mx-auto w-[248px] shrink-0 sm:w-[268px]">
      <div className="rounded-[2.4rem] border border-white/15 bg-[#0B1230] p-2.5 shadow-2xl">
        <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#060B1C] px-5 pb-6 pt-5">
          <span className="absolute left-1/2 top-2.5 h-1 w-14 -translate-x-1/2 rounded-full bg-white/15" aria-hidden />

          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            Ultra Pass
          </p>
          <p className="mt-1.5 font-display text-lg font-bold uppercase leading-tight tracking-tight">
            Mês de ativação
          </p>

          {/* QR estilizado */}
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <span className="grid h-12 w-12 shrink-0 grid-cols-4 gap-[2px] rounded-lg bg-white p-1.5" aria-hidden>
              {[1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0].map((on, i) => (
                <span key={i} className={`rounded-[1px] ${on ? "bg-[#060B1C]" : "bg-transparent"}`} />
              ))}
            </span>
            <div>
              <p className="text-[11px] font-medium text-white/80">Check-in do sábado</p>
              <p className="mt-0.5 text-[10px] text-white/40">Apresente na chegada</p>
            </div>
          </div>

          {/* Selos de presença */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[true, true, true, false].map((feito, i) => (
              <span
                key={i}
                className="flex aspect-square items-center justify-center rounded-xl border text-[11px] font-bold"
                style={
                  feito
                    ? { borderColor: `${RED}66`, backgroundColor: `${RED}1F`, color: "#fff" }
                    : { borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.28)" }
                }
              >
                {feito ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="m2.6 7.4 2.8 2.8 6-6.4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
            ))}
          </div>

          {/* Progresso */}
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">Progresso</p>
              <p className="font-display text-sm font-bold" style={{ color: ORANGE }}>
                3/4
              </p>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <span className="block h-full w-3/4 rounded-full" style={{ backgroundColor: ORANGE }} />
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-white/45">
              Falta 1 sábado para o benefício premium no Somma Day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Tabela responsiva ─────────────────────────────────────────────────── */

type DTRow = { cells: readonly React.ReactNode[]; marco?: boolean };

/**
 * No desktop vira `<table>`; no celular, cada linha vira um card com
 * rótulo:valor. Uma única fonte de dados alimenta os dois.
 */
function DataTable({
  head,
  rows,
  colW,
  accent = GOLD,
  destaqueCol,
}: {
  head: readonly string[];
  rows: readonly DTRow[];
  colW?: readonly string[];
  accent?: string;
  /** Índice da coluna que recebe fundo de destaque (a opção recomendada). */
  destaqueCol?: number;
}) {
  return (
    <div className="a-up overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      {/* desktop */}
      <table className="hidden w-full table-fixed text-left text-xs md:table sm:text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {head.map((h, i) => (
              <th
                key={h}
                className="px-4 py-3.5 font-display text-[10px] font-semibold uppercase tracking-[0.2em] sm:px-6 sm:py-4 sm:text-xs sm:tracking-[0.25em]"
                style={{
                  width: colW ? colW[i] : undefined,
                  color: i === destaqueCol ? BLUE : "rgba(255,255,255,0.4)",
                  backgroundColor: i === destaqueCol ? `${BLUE}12` : undefined,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-white/[0.06] last:border-0">
              {r.cells.map((cell, ci) => (
                <td
                  key={ci}
                  className={
                    ci === 0
                      ? "px-4 py-3 align-top font-display text-sm font-semibold uppercase leading-tight tracking-wide sm:px-6 sm:py-3.5 sm:text-base"
                      : "px-4 py-3 align-top leading-snug text-white/60 sm:px-6 sm:py-3.5"
                  }
                  style={{
                    color: ci === 0 ? (r.marco ? RED : accent) : undefined,
                    backgroundColor: ci === destaqueCol ? `${BLUE}0D` : undefined,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* mobile: cada linha vira card. Com duas ou mais colunas de valor, os
          rótulos têm larguras diferentes e, lado a lado, desalinhavam o texto —
          então cada valor vira um bloco com o rótulo em cima. */}
      <ul className="divide-y divide-white/[0.07] md:hidden">
        {rows.map((r, ri) => {
          const valores = r.cells.slice(1);
          const empilhado = valores.length > 1;
          return (
            <li key={ri} className="p-4">
              <p
                className="font-display text-base font-semibold uppercase leading-tight tracking-wide"
                style={{ color: r.marco ? RED : accent }}
              >
                {r.cells[0]}
              </p>
              <dl className={empilhado ? "mt-3 space-y-2" : "mt-2 space-y-1.5"}>
                {valores.map((cell, ci) => {
                  const alvo = ci + 1 === destaqueCol;
                  return empilhado ? (
                    <div
                      key={ci}
                      className="rounded-xl border px-3 py-2.5"
                      style={
                        alvo
                          ? { borderColor: `${BLUE}45`, backgroundColor: `${BLUE}12` }
                          : { borderColor: "rgba(255,255,255,0.08)" }
                      }
                    >
                      <dt
                        className="font-mono text-[9px] uppercase tracking-[0.16em]"
                        style={{ color: alvo ? BLUE : "rgba(255,255,255,0.35)" }}
                      >
                        {head[ci + 1]}
                      </dt>
                      <dd className="mt-1.5 text-[13px] leading-snug text-white/75">{cell}</dd>
                    </div>
                  ) : (
                    <div key={ci} className="grid grid-cols-[auto_1fr] gap-x-3">
                      <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
                        {head[ci + 1]}
                      </dt>
                      <dd className="text-[13px] leading-snug text-white/70">{cell}</dd>
                    </div>
                  );
                })}
              </dl>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
