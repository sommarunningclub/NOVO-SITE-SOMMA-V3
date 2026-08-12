"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Icon, type IconName } from "./_icons";
import { Lockup } from "./_marca";
import { ParqueMap } from "./_parque-map";
import {
  CAPITULOS,
  CAPITULO_1,
  CAPITULO_2,
  CONDICAO,
  CONDICAO_INCLUSO,
  CONDICAO_MICHELOB,
  CONTEXTO_CARDS,
  CONVIVENCIA,
  ENTREGAS_SOMMA,
  ESCOPO_FEE,
  MES_BLOCOS,
  MES_CONDICOES,
  MES_JORNADA,
  MES_PONTE,
  MICHELOB_ESCOPO,
  PAGAMENTO,
  POCKET_JORNADA,
  POCKET_NOTA,
  POCKET_REGUA,
  PRAZOS,
  PROPOSTA_BLOCOS,
  PROPOSTA_NOTA,
  RECOMENDACAO,
  RECOMENDACAO_PROVAS,
  TOOLKIT,
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
  "proposta",
  "capitulo-1",
  "capitulo-2",
  "pass-pocket",
  "convivencia",
  "entregas-somma",
  "entregas-michelob",
  "condicao",
  "prazos",
  "escopo",
  "evolucao",
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
              Proposta de ativação · 2026
            </p>
            <div className="a-mask mt-4 overflow-hidden py-1">
              <h1 className="font-display text-[2.4rem] font-bold uppercase leading-[0.9] tracking-tight sm:text-5xl md:text-7xl">
                Somma Club <span className="font-light text-white/40">×</span>
                <br />
                <span style={{ color: RED }}>Michelob Ultra</span>
              </h1>
            </div>
            <p className="a-up mt-6 text-lg font-light leading-snug text-white/85 md:text-2xl">
              Dois Somma Days. 29 de agosto e 26 de setembro.
            </p>
            <p className="a-up mt-3 max-w-xl text-sm leading-relaxed text-white/55 md:text-base">
              A entrada da marca na comunidade, com prova de valor em duas datas.
            </p>

            <div className="mt-9 flex flex-wrap gap-2.5">
              {(
                [
                  ["corrida", "Sábado de corrida"],
                  ["tenda", "Toolkit Michelob"],
                  ["musica", "DJ"],
                  ["trial", "Trial"],
                  ["checkin", "Ultra Pass Pocket"],
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

      {/* ═══════════ 04 · A PROPOSTA ═══════════ */}
      <Slide index={idx("proposta")} name="proposta">
        <BgPhoto name="pelotao" alt="Pelotão do Somma Club largando em grupo" />
        <div className="container-somma relative z-10">
          <Kicker>A proposta</Kicker>
          <H2>
            Dois <Accent>Somma Days</Accent>
          </H2>
          <p className="a-up mt-4 font-display text-lg font-medium uppercase tracking-wide text-white/70 md:text-xl">
            29 de agosto e 26 de setembro. Um único investimento.
          </p>
          <Lead>
            Em vez de uma ativação isolada, a marca entra em duas datas seguidas. É o que permite medir o
            que uma corrida sozinha nunca mostra: quantas pessoas voltaram.
          </Lead>

          <div className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {PROPOSTA_BLOCOS.map((b) => (
              <Bloco
                key={b.rotulo}
                rotulo={b.rotulo}
                valor={b.valor}
                apoio={"apoio" in b ? b.apoio : undefined}
                destaque={"destaque" in b ? b.destaque : false}
              />
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {CAPITULOS.map((c) => (
              <CapituloCard key={c.n} {...c} marco={"marco" in c ? c.marco : false} />
            ))}
          </div>

          <Nota>{PROPOSTA_NOTA}</Nota>
        </div>
      </Slide>

      {/* ═══════════ 05 · CAPÍTULO 1 ═══════════ */}
      <Slide index={idx("capitulo-1")} name="capitulo-1" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <div className="flex items-center gap-3">
            <OpcaoTag n="01" />
            <Kicker className="!mt-0">Sábado, 29 de agosto</Kicker>
          </div>
          <H2>
            Ultra <Accent>Opening Run</Accent>
          </H2>
          <Lead>
            A estreia da marca no sábado do Somma. Toolkit montado, corrida temática, trial no pós-treino
            e o primeiro selo do pass carimbado.
          </Lead>

          <div className="mt-12 grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {CAPITULO_1.map((p, i) => (
              <Passo
                key={p.n}
                n={p.n}
                icon={p.icon}
                titulo={p.titulo}
                detalhe={p.detalhe}
                ultimo={i === CAPITULO_1.length - 1}
              />
            ))}
          </div>

          <Nota>Trial apenas após a atividade esportiva e exclusivo para maiores de 18 anos.</Nota>
        </div>
      </Slide>

      {/* ═══════════ 06 · CAPÍTULO 2 ═══════════ */}
      <Slide index={idx("capitulo-2")} name="capitulo-2" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <div className="flex items-center gap-3">
            <OpcaoTag n="02" destaque />
            <Kicker className="!mt-0">Sábado, 26 de setembro</Kicker>
          </div>
          <H2>
            Ultra <Accent>Return</Accent>
          </H2>
          <Lead>
            O capítulo que dá sentido ao primeiro. Aqui a marca vê quem voltou, fecha o pass, premia e sai
            com o relatório das duas datas.
          </Lead>

          <div className="mt-12 grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {CAPITULO_2.map((p, i) => (
              <Passo
                key={p.n}
                n={p.n}
                icon={p.icon}
                titulo={p.titulo}
                detalhe={p.detalhe}
                ultimo={i === CAPITULO_2.length - 1}
              />
            ))}
          </div>

          <Destaque>Uma ativação mostra público. Duas mostram retenção.</Destaque>
        </div>
      </Slide>

      {/* ═══════════ 07 · ULTRA PASS POCKET ═══════════ */}
      <Slide index={idx("pass-pocket")} name="pass-pocket">
        <BgPhoto name="digital" alt="Corredora usando o celular depois do treino" />
        <div className="container-somma relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <Kicker>Ultra Pass Pocket</Kicker>
            {/* Simulação clicável: é o que abre na reunião, então o botão pulsa
                para ninguém passar do slide sem ver que dá para clicar. */}
            <a
              href="/ppt-michelob-nova-proposta/ultra-pass"
              target="_blank"
              rel="noopener noreferrer"
              className="ppt-cta ppt-cta-glow group inline-flex items-center gap-3 rounded-full px-6 py-3.5 font-display text-sm font-bold uppercase tracking-[0.18em] text-white hover:opacity-95 sm:px-8 sm:py-4 sm:text-base"
              style={{ backgroundColor: RED }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20"
                aria-hidden
              >
                <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
                  <path d="M0 0v12l10-6z" />
                </svg>
              </span>
              Abrir simulação
              <span
                className="transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              >
                →
              </span>
            </a>
          </div>
          <H2 className="max-w-3xl">
            Dois selos, <Accent>uma temporada</Accent>
          </H2>
          <Lead>
            A versão reduzida do Ultra Pass, feita para duas datas. Sem app, sem cadastro extra: o QR Code
            abre no navegador e a equipe carimba na chegada.
          </Lead>

          <div className="mt-8 grid items-start gap-x-8 gap-y-7 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <ol className="relative grid gap-5 sm:grid-cols-2">
                {POCKET_JORNADA.map((p) => (
                  <li key={p.n} className="flex gap-4">
                    <span
                      data-node
                      className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-[#060B1C]"
                      style={{
                        borderColor: p.n === "4" ? RED : GOLD,
                        color: p.n === "4" ? RED : GOLD,
                      }}
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
                ))}
              </ol>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {POCKET_REGUA.map((d) => (
                  <DegrauPass key={d.selos} {...d} marco={"marco" in d ? d.marco : false} />
                ))}
              </div>
            </div>

            <PassMockup />
          </div>

          <Nota>{POCKET_NOTA}</Nota>
        </div>
      </Slide>

      {/* ═══════════ 08 · TRIAL E CONVIVÊNCIA ═══════════ */}
      <Slide index={idx("convivencia")} name="convivencia">
        <BgPhoto name="afterrun" alt="Grupo do Somma Club no pós-treino" />
        <div className="container-somma relative z-10">
          <Kicker>Trial e convivência</Kicker>
          <H2 className="max-w-4xl">
            O pós-treino como território da <Accent>Michelob Ultra</Accent>
          </H2>
          <Lead>
            A experimentação acontece depois da atividade esportiva, dentro de um ambiente de convivência,
            música e relacionamento. Nas duas datas.
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

      {/* ═══════════ 09 · ENTREGAS DO SOMMA ═══════════ */}
      <Slide index={idx("entregas-somma")} name="entregas-somma">
        <BgPhoto name="entrega" alt="Equipe do Somma Club em operação de evento" />
        <div className="container-somma relative z-10">
          <Kicker>Entregas do Somma nas duas datas</Kicker>
          <H2>
            O que o <Accent>Somma</Accent> entrega
          </H2>

          <div className="mt-9">
            <DataTable
              head={["Frente", "Entrega Somma"]}
              colW={["30%", "70%"]}
              rows={ENTREGAS_SOMMA.map((r) => ({ cells: [r.frente, r.entrega] }))}
            />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 10 · O QUE FICA COM A MICHELOB ═══════════ */}
      <Slide index={idx("entregas-michelob")} name="entregas-michelob" className="bg-[#080F26]">
        <Grid />
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

      {/* ═══════════ 11 · CONDIÇÃO COMERCIAL ═══════════ */}
      <Slide index={idx("condicao")} name="condicao">
        <BgPhoto name="marca" alt="Ativação de marca em um sábado do Somma Club" />
        <div className="container-somma relative z-10">
          <Kicker>Condição comercial</Kicker>
          <H2>
            Paga por uma. <Accent>Leva duas.</Accent>
          </H2>

          <div className="mt-9 grid gap-4 lg:grid-cols-[1fr_1fr]">
            {/* Âncora de preço: o valor de tabela fica visível, para a condição
                de agora não virar o preço de referência da renovação. */}
            <div
              className="a-up relative overflow-hidden rounded-3xl border p-6 sm:p-8"
              style={{ borderColor: `${BLUE}59`, backgroundColor: `${BLUE}0F` }}
            >
              <Corners />
              <div className="relative z-10">
                <Selo>{CONDICAO.selo}</Selo>

                <div className="mt-7 flex flex-wrap items-end gap-x-6 gap-y-3">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">
                      Valor de tabela
                    </p>
                    <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-white/40 line-through decoration-[1.5px] sm:text-3xl">
                      {CONDICAO.tabela}
                    </p>
                    <p className="mt-1 text-[11px] text-white/35">{CONDICAO.tabelaNota}</p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em]" style={{ color: BLUE }}>
                      Nesta proposta
                    </p>
                    <p className="mt-1.5 font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl">
                      {CONDICAO.proposta}
                    </p>
                    <p className="mt-1.5 text-[11px] text-white/50">{CONDICAO.propostaNota}</p>
                  </div>
                </div>

                <p className="mt-7 border-t border-white/10 pt-5 text-[13.5px] leading-relaxed text-white/65">
                  {CONDICAO.texto}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="a-up rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em]" style={{ color: GOLD }}>
                  Incluso no investimento
                </p>
                <ul className="mt-3.5 grid gap-2 sm:grid-cols-2">
                  {CONDICAO_INCLUSO.map((i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] leading-snug text-white/65">
                      <span
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: GOLD }}
                      />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>

              {CONDICAO_MICHELOB.map((c) => (
                <div
                  key={c.titulo}
                  className="a-up flex flex-1 gap-3.5 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
                >
                  <span
                    data-node
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-[#060B1C]"
                    style={{ borderColor: RED, color: RED }}
                  >
                    <Icon name={c.icon} className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em]" style={{ color: RED }}>
                      Fica com a marca
                    </p>
                    <h3 className="mt-1.5 font-display text-base font-semibold uppercase leading-tight tracking-wide">
                      {c.titulo}
                    </h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">{c.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 12 · PRAZOS ═══════════ */}
      <Slide index={idx("prazos")} name="prazos" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>O que trava a operação</Kicker>
          <H2>
            O calendário <Accent>manda</Accent>
          </H2>
          <Lead>
            O dia 29 é daqui a pouco mais de duas semanas. Divulgação, inscrição, produção e liberação em
            espaço público correm em paralelo, e o processo no despachante é o mais lento deles.
          </Lead>

          <div className="mt-12 grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {PRAZOS.map((p, i) => (
              <PrazoCard
                key={p.n}
                {...p}
                marco={"marco" in p ? p.marco : false}
                ultimo={i === PRAZOS.length - 1}
              />
            ))}
          </div>

          <div
            className="a-up mt-9 flex items-start gap-3 rounded-2xl border p-4 sm:p-5"
            style={{ borderColor: `${GOLD}33`, backgroundColor: "rgba(255,255,255,0.02)" }}
          >
            <span className="mt-0.5 shrink-0">
              <RibbonMark gold />
            </span>
            <p className="text-[13px] leading-relaxed text-white/60">{PAGAMENTO}</p>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 13 · ESCOPO DO FEE ═══════════ */}
      <Slide index={idx("escopo")} name="escopo">
        <BgPhoto name="conteudo" alt="Cobertura de conteúdo em evento do Somma Club" />
        <div className="container-somma relative z-10">
          <Kicker>O que está incluído no fee do Somma</Kicker>
          <H2>
            Escopo por <Accent>formato</Accent>
          </H2>

          {/* A lista inteira não cabe em uma coluna sem estourar a tela, então
              ela é partida ao meio e as duas metades correm lado a lado. */}
          <div className="mt-9 grid gap-3 lg:grid-cols-2">
            {[
              ESCOPO_FEE.slice(0, Math.ceil(ESCOPO_FEE.length / 2)),
              ESCOPO_FEE.slice(Math.ceil(ESCOPO_FEE.length / 2)),
            ].map((metade, i) => (
              <DataTable
                key={i}
                head={["Entregável", "Dois capítulos", "Mês"]}
                colW={["46%", "27%", "27%"]}
                destaqueCol={1}
                rows={metade.map((r) => ({
                  cells: [
                    r.frente,
                    <Marca key="c" value={r.capitulos} />,
                    <Marca key="m" value={r.mes} />,
                  ],
                }))}
              />
            ))}
          </div>
        </div>
      </Slide>

      {/* ═══════════ 14 · EVOLUÇÃO: O MÊS ═══════════ */}
      <Slide index={idx("evolucao")} name="evolucao">
        <BgPhoto name="social-pace" alt="Comunidade do Somma Club reunida depois do treino" />
        <div className="container-somma relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <SeloNeutro>Próximo passo</SeloNeutro>
            <Kicker className="!mt-0">Depois dos dois capítulos</Kicker>
          </div>
          <H2>
            O mês de <Accent>ativação</Accent>
          </H2>
          <Lead>{MES_PONTE}</Lead>

          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {MES_BLOCOS.map((b) => (
              <Bloco
                key={b.rotulo}
                rotulo={b.rotulo}
                valor={b.valor}
                apoio={"apoio" in b ? b.apoio : undefined}
              />
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <DataTable
              head={["Semana", "Ativação", "Experiência"]}
              colW={["18%", "30%", "52%"]}
              rows={MES_JORNADA.map((r) => ({
                cells: [
                  r.sabado,
                  <span
                    key="a"
                    className="font-display text-sm font-semibold uppercase tracking-wide text-white sm:text-base"
                  >
                    {r.ativacao}
                  </span>,
                  r.experiencia,
                ],
                marco: "marco" in r ? r.marco : false,
              }))}
            />

            <ParqueMap />
          </div>

          <Nota>
            {MES_CONDICOES.map((c) => c.texto).join(" ")}
          </Nota>
        </div>
      </Slide>

      {/* ═══════════ 15 · RECOMENDAÇÃO ═══════════ */}
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
                {RECOMENDACAO.titulo}
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: BLUE }}>
                29 de agosto e 26 de setembro · R$ 15.000
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {RECOMENDACAO_PROVAS.map((p) => (
                  <div key={p.titulo} className="flex gap-3">
                    <span className="mt-0.5 shrink-0" style={{ color: GOLD }}>
                      <Icon name={p.icon} className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-display text-sm font-semibold uppercase tracking-wide">
                        {p.titulo}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-snug text-white/50">{p.texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="a-up rounded-3xl border border-white/10 bg-[#060B1C]/70 p-6 backdrop-blur-sm sm:p-8">
              <p className="text-[15px] leading-relaxed text-white/70">{RECOMENDACAO.texto}</p>
              <p
                className="mt-7 border-l-2 pl-5 font-display text-xl font-medium uppercase leading-snug tracking-tight md:text-2xl"
                style={{ borderColor: ORANGE }}
              >
                {RECOMENDACAO.frase}
              </p>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 16 · FECHAMENTO ═══════════ */}
      <Slide index={idx("fechamento")} name="fechamento" className="justify-center">
        <BgPhoto name="fechamento" alt="Pelotão do Somma Club ao amanhecer" veil="cover" />
        <div className="container-somma relative z-10 text-center">
          <Kicker className="justify-center">Fechamento</Kicker>
          <div className="a-mask mt-5 overflow-hidden py-1">
            <h2 className="mx-auto max-w-4xl font-display text-[2rem] font-bold uppercase leading-[0.95] tracking-tight sm:text-4xl md:text-6xl">
              Duas datas para <span style={{ color: RED }}>entrar, medir e decidir</span>.
            </h2>
          </div>
          <p className="a-up mx-auto mt-7 max-w-2xl text-[15px] leading-relaxed text-white/70 md:text-lg">
            Nos dias 29 de agosto e 26 de setembro a marca ativa o toolkit que já tem, testa a resposta
            da comunidade e sai com número de presença, de retorno e de experimentação. Se a leitura for
            boa, o mês de ativação já está desenhado.
          </p>

          <div className="a-up mx-auto mt-11 flex max-w-2xl flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#060B1C]/75 px-6 py-9 backdrop-blur-sm sm:px-10">
            <Lockup size="md" />
            <p className="font-display text-xl font-semibold uppercase tracking-tight text-white md:text-2xl">
              Dois sábados para começar.
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

/**
 * Cartão de cada capítulo na tela da proposta. A data vem antes do nome, que é
 * a informação que a marca precisa levar para a aprovação interna.
 */
function CapituloCard({
  rotulo,
  data,
  diaSemana,
  titulo,
  resumo,
  marco,
}: {
  rotulo: string;
  data: string;
  diaSemana: string;
  titulo: string;
  resumo: string;
  marco?: boolean;
}) {
  const cor = marco ? BLUE : GOLD;
  return (
    <div
      className="a-up rounded-2xl border p-5 backdrop-blur-sm sm:p-6"
      style={{
        borderColor: marco ? `${BLUE}59` : "rgba(255,255,255,0.1)",
        backgroundColor: marco ? `${BLUE}0F` : "rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: cor }}>
          {rotulo}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">{diaSemana}</p>
      </div>
      <p className="mt-3 font-display text-2xl font-bold uppercase leading-none tracking-tight sm:text-3xl">
        {data}
      </p>
      <p className="mt-2 font-display text-base font-semibold uppercase tracking-wide" style={{ color: cor }}>
        {titulo}
      </p>
      <p className="mt-2.5 text-[13px] leading-relaxed text-white/55">{resumo}</p>
    </div>
  );
}

/** Marco do calendário. O primeiro é o que trava tudo, então vem em vermelho. */
function PrazoCard({
  n,
  data,
  titulo,
  texto,
  marco,
  ultimo,
}: {
  n: string;
  data: string;
  titulo: string;
  texto: string;
  marco?: boolean;
  ultimo?: boolean;
}) {
  const cor = marco ? RED : GOLD;
  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <span
          data-node
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 bg-[#060B1C] font-mono text-[11px] font-bold"
          style={{ borderColor: cor, color: cor }}
        >
          {n}
        </span>
        {!ultimo ? <span className="a-rail h-px flex-1 origin-left bg-white/10" aria-hidden /> : null}
      </div>
      <p
        className="a-up mt-4 font-display text-xl font-bold uppercase leading-none tracking-tight sm:text-2xl"
        style={{ color: marco ? RED : "#fff" }}
      >
        {data}
      </p>
      <h3 className="a-up mt-2 font-display text-sm font-semibold uppercase tracking-wide text-white/80">
        {titulo}
      </h3>
      <p className="a-up mt-1.5 text-[13px] leading-relaxed text-white/55">{texto}</p>
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
  total = POCKET_REGUA.length,
}: {
  selos: number;
  frequencia: string;
  rotulo: string;
  beneficio: string;
  marco?: boolean;
  total?: number;
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
        minHeight: `${118 + selos * 24}px`,
      }}
    >
      {/* Selos carimbados até aqui */}
      <div className="flex gap-1.5" aria-label={`${selos} de ${total} selos`}>
        {Array.from({ length: total }, (_, k) => k + 1).map((i) => (
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
            style={{ width: `${(selos / total) * 100}%`, backgroundColor: cor }}
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
            Ultra Pass Pocket
          </p>
          <p className="mt-1.5 font-display text-lg font-bold uppercase leading-tight tracking-tight">
            29/08 e 26/09
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

          {/* Selos de presença: um por data */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {POCKET_REGUA.map((d, i) => {
              const feito = i === 0;
              return (
                <span
                  key={d.selos}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border py-3 text-[11px] font-bold"
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
                    d.selos
                  )}
                  <span className="text-[9px] font-normal opacity-70">{d.curto}</span>
                </span>
              );
            })}
          </div>

          {/* Progresso */}
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">Progresso</p>
              <p className="font-display text-sm font-bold" style={{ color: ORANGE }}>
                1/2
              </p>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <span className="block h-full w-1/2 rounded-full" style={{ backgroundColor: ORANGE }} />
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-white/45">
              Falta o selo de 26 de setembro para o prêmio da temporada.
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
