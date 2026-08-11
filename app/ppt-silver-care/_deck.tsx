"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Icon } from "./_icons";
import { Lockup, SilverMark } from "./_marca";
import {
  Accent,
  BgPhoto,
  Bloco,
  Card,
  Chip,
  DataTable,
  Destaque,
  Grid,
  H2,
  Kicker,
  Lead,
  Manifesto,
  Marca,
  Nota,
  Numero,
  ORANGE,
  Passo,
  PhotoFrame,
  Selo,
  Slide,
  SunRings,
  SUN,
} from "./_ui";
import {
  Dashboard,
  ItemKit,
  Phone,
  PostCard,
  QRCode,
  Sticker,
  SunStick,
  TelaCheckin,
  TelaCupom,
  TelaPassaporte,
  TelaRanking,
} from "./_mockups";
import {
  AVULSAS,
  CANAIS,
  COMPARATIVO,
  COMUNIDADE,
  CONTEUDO,
  DIA16,
  DIA16_BLOCOS,
  EQUIPAMENTOS,
  FOTOS,
  FRASES,
  HEROI,
  HORIZONTE,
  JORNADA,
  KIT,
  LGPD,
  METRICAS,
  MISSOES,
  MOTES,
  OPORTUNIDADE,
  PLANOS,
  PORQUE,
  PREMIA,
  PROVAS,
  REFERENCIAS,
  ROTINA,
  RUNNING_EDITION,
  SOMMA_DAY,
  TECH,
  TERRITORIO,
} from "./_dados";

const SLIDES = [
  "capa",
  "insight",
  "territorio",
  "porque",
  "oportunidade",
  "rotina",
  "heroi",
  "running-edition",
  "marco-zero",
  "dia16",
  "jornada",
  "somma-protegido",
  "pontos",
  "tecnologia",
  "comunidade",
  "somma-day",
  "kit",
  "stickers",
  "conteudo",
  "midia",
  "planos",
  "comparativo",
  "avulsas",
  "mensuracao",
  "horizonte",
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
          tl.from(ups, { y: 28, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.055 }, 0.2);
        }
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

      gsap.utils.toArray<HTMLElement>(".parallax").forEach((img) => {
        gsap.to(img, {
          yPercent: 9,
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

  return (
    <div
      ref={scroller}
      className="h-[100svh] w-full snap-y snap-proximity overflow-y-auto overflow-x-hidden bg-[#0A0A0A] text-[#F5F1EA] antialiased md:snap-mandatory"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Progresso */}
      <div className="fixed left-0 top-0 z-50 h-[2px] w-full bg-neutral-500/25">
        <div
          ref={bar}
          className="h-full w-full origin-left"
          style={{ background: `linear-gradient(90deg, ${SUN}, ${ORANGE})` }}
        />
      </div>

      {/* Navegação lateral */}
      <div className="fixed right-5 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-2.5 md:flex">
        {SLIDES.map((name, i) => (
          <button key={name} onClick={() => goTo(i)} aria-label={`Ir para slide ${i + 1}`} className="group flex justify-end">
            <span
              className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                active === i ? "w-7" : "w-1.5 bg-neutral-500/50 group-hover:bg-neutral-400"
              }`}
              style={active === i ? { backgroundColor: ORANGE } : undefined}
            />
          </button>
        ))}
      </div>

      <div className="fixed bottom-6 left-6 z-50 flex items-baseline gap-1.5 font-mono text-[11px] tracking-[0.2em] text-neutral-500 md:left-9">
        <span className="font-semibold">{String(active + 1).padStart(2, "0")}</span>
        <span className="opacity-50">/</span>
        <span className="opacity-70">{total}</span>
      </div>

      {/* ═══════════ 01 · CAPA ═══════════ */}
      <Slide index={idx("capa")} name="capa">
        <BgPhoto src={FOTOS.capa} alt="Corredores do Somma Club em treino sob o sol de Brasília" veil="lateral" priority position="50% 35%" />
        <SunRings className="right-[-6rem] top-[-4rem] h-[26rem] w-[26rem] opacity-60 md:right-[-2rem]" />

        <div className="container-somma relative z-10">
          <div className="max-w-3xl">
            <Lockup className="a-up" size="lg" />
            <div className="a-rail mt-8 h-px w-24 origin-left" style={{ backgroundColor: SUN }} />
            <p
              className="a-up mt-6 font-display text-[10px] font-semibold uppercase tracking-[0.4em] sm:text-xs sm:tracking-[0.45em]"
              style={{ color: SUN }}
            >
              Proposta de parceria · 2026
            </p>

            <div className="a-mask mt-4 overflow-hidden py-1">
              <h1 className="font-display text-[2.6rem] font-bold uppercase leading-[0.86] tracking-tight sm:text-6xl md:text-[5.4rem]">
                Viver lá fora
                <br />
                faz bem.
                <br />
                <Accent>Se proteger também.</Accent>
              </h1>
            </div>

            <p className="a-up mt-7 max-w-xl text-lg font-light leading-snug text-white/85 md:text-2xl">
              Uma parceria para quem escolheu viver em movimento.
            </p>

            <div className="mt-9 flex flex-wrap gap-2.5">
              <Chip icon="corrida" label="Corrida" />
              <Chip icon="sol" label="Sol" />
              <Chip icon="pele" label="Autocuidado" />
              <Chip icon="comunidade" label="Comunidade" />
            </div>
          </div>
        </div>

        <p className="absolute bottom-6 right-6 z-10 font-display text-[10px] uppercase tracking-[0.3em] text-white/30 md:right-9">
          Somma Club · Brasília
        </p>
      </Slide>

      {/* ═══════════ 02 · INSIGHT ═══════════ */}
      <Slide index={idx("insight")} name="insight">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>O insight</Kicker>

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
            {EQUIPAMENTOS.map((e) => (
              <span
                key={e}
                className="a-up font-display text-2xl font-medium uppercase tracking-tight text-white/25 sm:text-4xl md:text-5xl"
              >
                {e}
              </span>
            ))}
          </div>

          <p className="a-up mt-10 max-w-2xl text-base font-light leading-relaxed text-white/60 md:text-xl">
            O corredor pensa em tudo antes de sair. Mas existe um equipamento que ninguém chama de
            equipamento.
          </p>

          <div className="a-mask mt-8 overflow-hidden py-2">
            <p className="font-display text-[3.4rem] font-bold uppercase leading-[0.82] tracking-tighter sm:text-8xl md:text-[9rem]">
              <Accent>Proteção.</Accent>
            </p>
          </div>

          <div className="mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            {OPORTUNIDADE.map((o) => (
              <Card key={o.titulo}>
                <h3 className="font-display text-lg font-semibold uppercase leading-tight tracking-tight">
                  {o.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--fg-soft)]">{o.texto}</p>
              </Card>
            ))}
          </div>
        </div>
      </Slide>

      {/* ═══════════ 03 · TERRITÓRIO ═══════════ */}
      <Slide index={idx("territorio")} name="territorio" tema="claro">
        <div className="container-somma relative z-10">
          <Kicker>O território</Kicker>
          <H2>
            Onde a Silver Care <Accent>já pertence</Accent>
          </H2>
          <Lead>
            Não é um espaço novo para a marca. É o espaço onde ela deveria estar todo sábado de manhã.
          </Lead>

          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {TERRITORIO.map((t) => (
              <div key={t.palavra} className="a-up">
                <PhotoFrame src={t.foto} alt={`${t.palavra} na comunidade Somma Club`} ratio="aspect-[3/4]" />
                <p className="mt-3.5 font-display text-xl font-bold uppercase leading-none tracking-tight sm:text-2xl">
                  {t.palavra}
                </p>
                <p className="mt-1.5 text-[13px] leading-snug text-[color:var(--fg-soft)]">{t.texto}</p>
              </div>
            ))}
          </div>

          <Destaque>Corrida, sol, wellness e autocuidado já são a mesma cena.</Destaque>
        </div>
      </Slide>

      {/* ═══════════ 04 · POR QUE SOMMA ═══════════ */}
      <Slide index={idx("porque")} name="porque">
        <BgPhoto src={FOTOS.grupo} alt="Comunidade do Somma Club reunida depois do treino" veil="medio" />
        <div className="container-somma relative z-10">
          <Kicker>Por que Somma × Silver Care</Kicker>
          <H2>
            A rotina <Accent>já existe</Accent>
          </H2>
          <Lead>
            O Somma é o maior running club do Distrito Federal. Não é um evento: é um encontro que se
            repete toda semana, com a mesma gente, no mesmo horário, no mesmo sol.
          </Lead>

          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
            {PROVAS.map((p) => (
              <Numero key={p.label} valor={p.valor} label={p.label} nota={p.nota} cor={SUN} />
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PORQUE.map((c) => (
              <Card key={c.n}>
                <div className="flex items-center justify-between">
                  <span style={{ color: ORANGE }}>
                    <Icon name={c.icon} className="h-7 w-7" />
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.3em] text-[color:var(--fg-faint)]">{c.n}</span>
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold uppercase leading-tight tracking-tight sm:text-2xl">
                  {c.titulo}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--fg-soft)]">{c.texto}</p>
              </Card>
            ))}
          </div>

          <Nota>Números do mídia kit Somma Club 2026.</Nota>
        </div>
      </Slide>

      {/* ═══════════ 05 · A OPORTUNIDADE ═══════════ */}
      <Slide index={idx("oportunidade")} name="oportunidade" tema="claro">
        <div className="container-somma relative z-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <Kicker>A oportunidade</Kicker>
              <H2>
                Skincare como <Accent>parte do treino</Accent>
              </H2>
              <Lead>
                Não queremos colocar a Silver Care ao lado da corrida. Queremos colocar a Silver Care
                dentro da rotina de quem corre.
              </Lead>

              <Manifesto className="mt-9 max-w-xl">
                “Passar protetor deixou de ser vaidade. Virou parte do{" "}
                <span style={{ color: ORANGE }}>equipamento</span>.”
              </Manifesto>

              <div className="mt-9 flex flex-wrap gap-2.5">
                <Chip label="Antes do treino" />
                <Chip label="No meio do percurso" />
                <Chip label="Depois, no after" />
              </div>
            </div>

            <PhotoFrame
              src={FOTOS.wellness}
              alt="Corredores do Somma Club depois do treino"
              ratio="aspect-[4/5]"
              className="a-up"
            />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 06 · ANTES, DURANTE E DEPOIS ═══════════ */}
      <Slide index={idx("rotina")} name="rotina">
        <BgPhoto src={FOTOS.estrada} alt="Pelotão do Somma Club na estrada" veil="forte" position="50% 30%" />
        <div className="container-somma relative z-10">
          <Kicker>A jornada do corredor</Kicker>
          <H2>
            Antes, durante <Accent>e depois</Accent>
          </H2>
          <Lead>
            Três momentos, três funções de produto. É assim que uma marca de cuidado entra num hábito
            sem parecer patrocínio.
          </Lead>

          <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-9 lg:grid-cols-3">
            {ROTINA.map((r, i) => (
              <div key={r.n}>
                <p className="a-up font-display text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: SUN }}>
                  {r.fase}
                </p>
                <Passo
                  n={r.n}
                  icon={r.icon}
                  titulo={r.titulo}
                  detalhe={r.detalhe}
                  itens={r.itens}
                  ultimo={i === ROTINA.length - 1}
                />
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* ═══════════ 07 · PRODUTO HERÓI ═══════════ */}
      <Slide index={idx("heroi")} name="heroi" tema="claro">
        <div className="container-somma relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div className="a-up relative flex justify-center">
              <div
                className="absolute inset-x-6 top-8 bottom-8 rounded-[40px]"
                style={{ background: `radial-gradient(60% 60% at 50% 40%, ${SUN}33, transparent 70%)` }}
                aria-hidden
              />
              <SunStick className="relative" />
            </div>

            <div>
              <Kicker>Produto herói</Kicker>
              <H2>
                Silver <Accent>Sun Stick</Accent>
              </H2>
              <Lead>
                De toda a linha, é o produto com mais aderência ao corredor. Ele resolve o problema no
                formato em que o problema acontece: em movimento.
              </Lead>

              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                {HEROI.map((h) => (
                  <Card key={h.titulo} className="!p-5">
                    <span style={{ color: ORANGE }}>
                      <Icon name={h.icon} className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-semibold uppercase leading-none tracking-tight">
                      {h.titulo}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--fg-soft)]">{h.texto}</p>
                  </Card>
                ))}
              </div>

              <Nota>Mockup conceitual para leitura da proposta. A arte final segue a embalagem oficial.</Nota>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 08 · RUNNING EDITION ═══════════ */}
      <Slide index={idx("running-edition")} name="running-edition">
        <Grid />
        <SunRings
          className="left-[-10rem] top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 opacity-25"
          cor={ORANGE}
          disco={false}
        />
        <div className="container-somma relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Selo>Oportunidade futura</Selo>
              <H2 className="mt-4">
                Silver Care <br />
                <Accent>Running Edition</Accent>
              </H2>
              <Lead>
                Uma edição especial do stick pensada para o universo running, assinada Somma × Silver
                Care. Não existe ainda, e é exatamente por isso que vale construir junto.
              </Lead>

              <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
                {RUNNING_EDITION.map((r) => (
                  <li key={r} className="a-up flex items-start gap-2.5 text-sm text-[color:var(--fg-soft)]">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: SUN }} />
                    {r}
                  </li>
                ))}
              </ul>

              <Nota>
                Conceito de exploração. Qualquer desenvolvimento de produto depende de validação técnica e
                regulatória da Silver Care.
              </Nota>
            </div>

            <div className="a-up flex items-end justify-center gap-8">
              <SunStick edition="running" />
              <div className="hidden flex-col gap-3 sm:flex">
                <Sticker variante="sol" rotate={-6}>
                  Corre no sol
                </Sticker>
                <Sticker variante="laranja" rotate={4}>
                  No corre, vai de stick
                </Sticker>
              </div>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 09 · MARCO ZERO ═══════════ */}
      <Slide index={idx("marco-zero")} name="marco-zero">
        <BgPhoto src={FOTOS.bandeira} alt="Corredores do Somma Club com a bandeira do clube" veil="lateral" />
        <div className="container-somma relative z-10">
          <div className="max-w-3xl">
            <Kicker cor={SUN}>Primeira ativação</Kicker>
            <H2>
              Marco zero <Accent>da parceria</Accent>
            </H2>
            <p className="a-up mt-5 font-display text-lg font-medium uppercase tracking-wide text-white/75 md:text-2xl">
              Dia 16 · Corre do Somma no Morro da Asa Delta
            </p>
            <Lead>
              A oportunidade já está na agenda. A Silver Care pode entrar agora, no primeiro capítulo,
              e não depois que a história começou.
            </Lead>

            <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {DIA16_BLOCOS.map((b) => (
                <Bloco key={b.rotulo} rotulo={b.rotulo} valor={b.valor} />
              ))}
            </div>

            <Destaque cor={SUN}>O dia 16 não é uma ação isolada. É o começo de uma jornada.</Destaque>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 10 · A EXPERIÊNCIA DO DIA 16 ═══════════ */}
      <Slide index={idx("dia16")} name="dia16" tema="claro">
        <div className="container-somma relative z-10">
          <Kicker>A experiência do dia 16</Kicker>
          <H2>
            Ponto de <Accent>Proteção</Accent>
          </H2>
          <Lead>
            Uma estação da marca no ponto de encontro. Antes de correr, todo mundo passa por ali e
            sai protegido.
          </Lead>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr_1fr_0.8fr]">
            {DIA16.map((d, i) => (
              <div key={d.n}>
                <p className="a-up font-display text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: ORANGE }}>
                  {d.fase}
                </p>
                <Passo n={d.n} icon={d.icon} titulo={d.titulo} itens={d.itens} ultimo={i === DIA16.length - 1} />
              </div>
            ))}

            <div className="a-up">
              <PhotoFrame
                src={FOTOS.totem}
                alt="Totem inflável da Silver Care na área de concentração de uma corrida"
                ratio="aspect-[3/4]"
                className="!rounded-2xl"
              />
              <p className="mt-2.5 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-faint)]">
                Totem Silver Care na ativação
              </p>

              {/* Referências de formato: estruturas produzidas para outras
                  marcas, só para mostrar o que dá para levantar no local. */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {REFERENCIAS.map((r) => (
                  <div key={r.foto}>
                    <PhotoFrame
                      src={r.foto}
                      alt={r.legenda}
                      ratio="aspect-[4/3]"
                      className="!rounded-lg"
                    />
                    <p className="mt-1.5 text-[9px] leading-tight text-[color:var(--fg-faint)]">
                      {r.legenda}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 11 · A JORNADA ═══════════ */}
      <Slide index={idx("jornada")} name="jornada">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>A jornada da campanha</Kicker>
          <H2>
            Quatro <Accent>etapas</Accent>
          </H2>
          <Lead>
            Do conteúdo digital ao fechamento mensal. Cada etapa alimenta a seguinte, e a marca aparece
            em todas.
          </Lead>

          <div className="mt-12 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
            {JORNADA.map((j, i) => (
              <div key={j.n}>
                <p className="a-up font-display text-[10px] font-semibold uppercase tracking-[0.28em]" style={{ color: SUN }}>
                  {j.quando}
                </p>
                <Passo
                  n={j.n}
                  icon={j.icon}
                  titulo={j.etapa}
                  detalhe={j.texto}
                  itens={j.itens}
                  ultimo={i === JORNADA.length - 1}
                />
              </div>
            ))}
          </div>

          <Nota>
            A ativação presencial oficial da Silver Care acontece no Somma Day. O restante do mês é
            presença digital, conteúdo e relacionamento com a comunidade.
          </Nota>
        </div>
      </Slide>

      {/* ═══════════ 12 · SOMMA PROTEGIDO ═══════════ */}
      <Slide index={idx("somma-protegido")} name="somma-protegido">
        <BgPhoto src={FOTOS.crowd} alt="Ativação do Somma Club no ponto de encontro" veil="forte" />
        <div className="container-somma relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Kicker>Programa digital</Kicker>
              <H2>
                Somma <Accent>Protegido</Accent>
              </H2>
              <Lead>
                Um passaporte digital que transforma a parceria em participação. A marca deixa de ser
                logo no banner e vira mecânica dentro do clube.
              </Lead>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {PREMIA.map((p) => (
                  <Card key={p.titulo} className="!p-5">
                    <h3 className="font-display text-lg font-semibold uppercase leading-none tracking-tight">
                      {p.titulo}
                    </h3>
                    <p className="mt-2 text-[13px] text-[color:var(--fg-soft)]">{p.texto}</p>
                  </Card>
                ))}
              </div>

              <Destaque>A campanha premia quem participa. Não quem corre mais rápido.</Destaque>
            </div>

            <div className="a-up flex justify-center gap-5">
              <Phone legenda="Passaporte">
                <TelaPassaporte />
              </Phone>
              <Phone legenda="Ranking" className="hidden sm:block">
                <TelaRanking />
              </Phone>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 13 · MECÂNICA DE PONTOS ═══════════ */}
      <Slide index={idx("pontos")} name="pontos" tema="claro">
        <div className="container-somma relative z-10">
          <Kicker>Mecânica</Kicker>
          <H2>
            Como se <Accent>ganha ponto</Accent>
          </H2>
          <Lead>
            Missões simples, verificáveis e conectadas ao que a comunidade já faz. Sem burocracia, sem
            formulário longo.
          </Lead>

          <div className="mt-9 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <DataTable
              head={["Missão", "Tipo", "Pontos"]}
              colW={["52%", "26%", "22%"]}
              rows={MISSOES.map((m) => ({
                cells: [
                  m.nome,
                  m.tipo,
                  <span key="p" className="font-display text-base font-bold" style={{ color: ORANGE }}>
                    {m.pontos}
                  </span>,
                ],
              }))}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Card destaque>
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--fg-faint)]">
                  Recompensas
                </p>
                <ul className="mt-4 space-y-2 text-sm text-[color:var(--fg-soft)]">
                  {["Kit Runner Somma × Silver Care", "Cupons exclusivos", "Produto em edição limitada", "Experiência no Somma Day"].map(
                    (r) => (
                      <li key={r} className="flex gap-2.5">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: ORANGE }} />
                        {r}
                      </li>
                    ),
                  )}
                </ul>
              </Card>
              <Card>
                <div className="flex items-center gap-4">
                  <QRCode size={72} />
                  <p className="text-sm leading-relaxed text-[color:var(--fg-soft)]">
                    Cada QR, no totem, no sample ou no kit, leva direto para a missão da semana.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 14 · TECNOLOGIA ═══════════ */}
      <Slide index={idx("tecnologia")} name="tecnologia">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Tecnologia</Kicker>
          <H2>
            A parceria vira <Accent>produto digital</Accent>
          </H2>
          <Lead>
            O Somma já opera check-in, eventos e comunidade com sistema próprio. A Silver Care entra
            dentro dessas telas, não ao lado delas.
          </Lead>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.15fr]">
            <div className="a-up flex justify-center gap-4 sm:gap-6">
              <Phone legenda="Check-in">
                <TelaCheckin />
              </Phone>
              <Phone legenda="Cupom" className="hidden sm:block">
                <TelaCupom />
              </Phone>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {TECH.map((t) => (
                <div
                  key={t.nome}
                  className="a-up rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4"
                >
                  <span style={{ color: ORANGE }}>
                    <Icon name={t.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-display text-sm font-semibold uppercase tracking-wide">{t.nome}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[color:var(--fg-soft)]">{t.texto}</p>
                </div>
              ))}
            </div>
          </div>

          <Nota>Interfaces em mockup para leitura da proposta. O escopo técnico é definido no plano contratado.</Nota>
        </div>
      </Slide>

      {/* ═══════════ 15 · COMUNIDADE ═══════════ */}
      <Slide index={idx("comunidade")} name="comunidade">
        <BgPhoto src={FOTOS.comunidade} alt="Corredora do Somma Club comemorando durante o treino" veil="medio" position="50% 25%" />
        <div className="container-somma relative z-10">
          <Kicker>Comunidade</Kicker>
          <H2>
            Como as pessoas <Accent>entram nisso</Accent>
          </H2>
          <Lead>
            Campanha em comunidade não se anuncia: se combina. O Somma já tem os canais onde o sábado é
            marcado. É por ali que a missão chega.
          </Lead>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {COMUNIDADE.map((c) => (
              <Card key={c.titulo}>
                <span style={{ color: SUN }}>
                  <Icon name={c.icon} className="h-7 w-7" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold uppercase leading-tight tracking-tight">
                  {c.titulo}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--fg-soft)]">{c.texto}</p>
              </Card>
            ))}
          </div>

          <Manifesto className="mt-11 max-w-3xl">
            “Quem vive lá fora, <span style={{ color: ORANGE }}>se cuida</span>.”
          </Manifesto>
        </div>
      </Slide>

      {/* ═══════════ 16 · SOMMA DAY ═══════════ */}
      <Slide index={idx("somma-day")} name="somma-day" tema="claro">
        <div className="container-somma relative z-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <Kicker>Fechamento mensal</Kicker>
              <H2>
                Somma <Accent>Day</Accent>
              </H2>
              <p className="a-up mt-5 font-display text-lg font-medium uppercase tracking-wide text-[color:var(--fg-soft)] md:text-2xl">
                Último sábado de cada mês
              </p>
              <Lead>
                É o encontro grande do clube, e o palco da ativação presencial da Silver Care. Uma vez
                por mês, com peso de evento, não de estande.
              </Lead>

              <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
                {SOMMA_DAY.map((s) => (
                  <li key={s} className="a-up flex items-start gap-2.5 text-sm text-[color:var(--fg-soft)]">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: ORANGE }} />
                    {s}
                  </li>
                ))}
              </ul>

              <Destaque>
                Presencial uma vez por mês. Presente o mês inteiro no digital.
              </Destaque>
            </div>

            <PhotoFrame
              src={FOTOS.grupo2}
              alt="Somma Day: comunidade reunida no Parque da Cidade"
              ratio="aspect-[4/3]"
              className="a-up"
            />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 17 · KIT RUNNER ═══════════ */}
      <Slide index={idx("kit")} name="kit">
        <Grid />
        <div className="container-somma relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div className="a-up flex justify-center">
              <div className="relative w-full max-w-[420px]">
                <PhotoFrame
                  src={FOTOS.necessaire}
                  alt="Necessaire vermelha Silver Care × Somma Club"
                  ratio="aspect-[4/5]"
                />
                <Sticker variante="sol" rotate={-8} className="absolute -left-3 -top-4 z-10">
                  Bota a cara no sol
                </Sticker>
              </div>
            </div>

            <div>
              <Kicker>Kit Runner</Kicker>
              <H2>
                Necessaire
                <br />
                <Accent>Somma × Silver Care</Accent>
              </H2>
              <Lead>
                Não é brinde. É um objeto que a pessoa quer ter, e que carrega a marca para dentro da
                mochila, do carro e da rotina.
              </Lead>

              <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
                {KIT.map((k) => (
                  <ItemKit key={k.nome} icon={k.icon} nome={k.nome} nota={k.nota} />
                ))}
              </div>

              <Nota>
                Mockup da necessaire Somma × Silver Care. Materiais e acabamento definidos na produção.
              </Nota>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 18 · STICKERS E CULTURA ═══════════ */}
      <Slide index={idx("stickers")} name="stickers" tema="claro">
        <div className="container-somma relative z-10">
          <Kicker>Cultura</Kicker>
          <H2>
            Frase boa <Accent>vira sticker</Accent>
          </H2>
          <Lead>
            Sticker é a mídia mais barata e mais duradoura de uma comunidade. Ele vai parar na garrafa,
            no celular, no capacete e no carro. E continua falando depois do sábado.
          </Lead>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            {FRASES.map((f, i) => (
              <Sticker
                key={f}
                variante={(["laranja", "preto", "sol", "bone", "laranja", "preto"] as const)[i % 6]}
                rotate={[-5, 3, -2, 6, -4, 2][i % 6]}
              >
                {f}
              </Sticker>
            ))}
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="a-up font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--fg-faint)]">
                Direção recomendada
              </p>
              <div className="mt-4 grid gap-2.5">
                {MOTES.map((m) => (
                  <div
                    key={m.frase}
                    className="a-up flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3.5"
                    style={
                      m.destaque
                        ? { borderColor: `${ORANGE}59`, backgroundColor: `${ORANGE}0F` }
                        : { borderColor: "var(--line)", backgroundColor: "var(--surface)" }
                    }
                  >
                    <span
                      className="font-display text-base font-bold uppercase tracking-tight sm:text-lg"
                      style={m.destaque ? { color: ORANGE } : undefined}
                    >
                      {m.frase}
                    </span>
                    <span className="font-display text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-faint)]">
                      {m.uso}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="a-up flex items-center justify-center gap-5 rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)] p-6">
              <QRCode size={90} />
              <div>
                <p className="font-display text-sm font-semibold uppercase tracking-wide">Sticker com QR</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--fg-soft)]">
                  Aplicado em garrafa, necessaire, celular, embalagem e placas da ativação. Cada
                  leitura entra no relatório.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 19 · CONTEÚDO ═══════════ */}
      <Slide index={idx("conteudo")} name="conteudo">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Conteúdo</Kicker>
          <H2>
            O que <Accent>vai ao ar</Accent>
          </H2>
          <Lead>
            Conteúdo feito com quem corre, no dia em que se corre. Sem estúdio, sem ator, sem cenário
            montado.
          </Lead>

          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {CONTEUDO.map((c) => (
              <PostCard key={c.legenda} foto={c.foto} legenda={c.legenda} selo={c.selo} />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-2.5">
            <Chip icon="camera" label="Captação nos sábados" />
            <Chip icon="raio" label="Edição no ritmo do social" />
            <Chip icon="comunidade" label="Rostos da comunidade" />
            <Chip icon="pele" label="Educação sobre proteção" />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 20 · ECOSSISTEMA DE MÍDIA ═══════════ */}
      <Slide index={idx("midia")} name="midia" tema="claro">
        <div className="container-somma relative z-10">
          <Kicker>Onde a marca aparece</Kicker>
          <H2>
            Os canais do <Accent>Somma</Accent>
          </H2>
          <Lead>
            Seis pontos de contato que funcionam juntos: o que acontece no sábado vira conteúdo, o
            conteúdo vira missão, a missão volta para o sábado.
          </Lead>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CANAIS.map((c) => (
              <Card key={c.nome} className="!p-5">
                <div className="flex items-center gap-3">
                  <span style={{ color: ORANGE }}>
                    <Icon name={c.icon} className="h-6 w-6" />
                  </span>
                  <h3 className="font-display text-lg font-semibold uppercase tracking-wide">{c.nome}</h3>
                </div>
                <p className="mt-2.5 text-[13px] leading-relaxed text-[color:var(--fg-soft)]">{c.detalhe}</p>
              </Card>
            ))}
          </div>

          <div
            className="a-up mt-8 rounded-2xl border-l-2 bg-[color:var(--surface)] p-5"
            style={{ borderColor: ORANGE }}
          >
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--fg-faint)]">
              Privacidade
            </p>
            <p className="mt-2 max-w-4xl text-[13px] leading-relaxed text-[color:var(--fg-soft)]">{LGPD}</p>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 21 · PLANOS ═══════════ */}
      <Slide index={idx("planos")} name="planos">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Investimento</Kicker>
          <H2>
            Três formas de <Accent>entrar</Accent>
          </H2>
          <Lead>Parceria mensal e recorrente. Cada plano inclui tudo do anterior.</Lead>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {PLANOS.map((p) => (
              <div
                key={p.n}
                className="a-up flex flex-col rounded-3xl border p-6"
                style={
                  p.recomendado
                    ? { borderColor: `${ORANGE}80`, backgroundColor: `${ORANGE}12` }
                    : { borderColor: "var(--line)", backgroundColor: "var(--surface)" }
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-[color:var(--fg-faint)]">
                    PLANO {p.n}
                  </span>
                  {p.recomendado ? <Selo>Recomendado</Selo> : null}
                </div>

                <h3
                  className="mt-5 font-display text-xl font-bold uppercase leading-none tracking-tight sm:text-2xl"
                  style={p.recomendado ? { color: ORANGE } : undefined}
                >
                  {p.nome}
                </h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-[color:var(--fg-soft)]">{p.resumo}</p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl">
                    {p.preco}
                  </span>
                  <span className="font-display text-[11px] uppercase tracking-[0.18em] text-[color:var(--fg-faint)]">
                    {p.periodo}
                  </span>
                </div>

                <ul className="mt-6 space-y-2 border-t border-[color:var(--line)] pt-5">
                  {p.itens.map((i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] leading-snug text-[color:var(--fg-soft)]">
                      <span
                        className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: p.recomendado ? ORANGE : "var(--fg-faint)" }}
                      />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Nota>
            Valores mensais. Produção de kits, samples e produtos para distribuição são fornecidos pela
            Silver Care.
          </Nota>
        </div>
      </Slide>

      {/* ═══════════ 22 · COMPARATIVO ═══════════ */}
      <Slide index={idx("comparativo")} name="comparativo" tema="claro">
        <div className="container-somma relative z-10">
          <Kicker>Comparativo</Kicker>
          <H2 className="md:!text-[3.4rem]">
            O que muda <Accent>em cada plano</Accent>
          </H2>
          <p className="a-up mt-4 text-[12px] text-[color:var(--fg-faint)] lg:hidden">
            Arraste a tabela para o lado para ver os três planos.
          </p>

          <div className="mt-6">
            <DataTable
              compacto
              head={["Entrega", "R$ 5.000", "R$ 10.000", "R$ 15.000"]}
              colW={["40%", "20%", "20%", "20%"]}
              rows={COMPARATIVO.map((c) => ({
                cells: [
                  c.item,
                  <Marca key="1" value={c.p1} />,
                  <Marca key="2" value={c.p2} />,
                  <Marca key="3" value={c.p3} />,
                ],
              }))}
            />
          </div>

          <div className="a-up mt-4 flex flex-wrap items-center gap-3">
            <Selo>Plano 03 recomendado</Selo>
            <p className="text-[13px] text-[color:var(--fg-soft)]">
              É o único que entrega exclusividade de categoria e propriedade de campanha.
            </p>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 23 · ATIVAÇÕES ESPECIAIS ═══════════ */}
      <Slide index={idx("avulsas")} name="avulsas">
        <BgPhoto src={FOTOS.ativacao} alt="Equipe do Somma Club em ativação de marca" veil="forte" />
        <div className="container-somma relative z-10">
          <Kicker>Fora da mensalidade</Kicker>
          <H2>
            Projetos <Accent>sob medida</Accent>
          </H2>
          <Lead>
            Além da parceria mensal, podemos construir projetos pontuais, orçados por escopo, conforme
            a necessidade da marca.
          </Lead>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AVULSAS.map((a) => (
              <div
                key={a.nome}
                className="a-up rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <span style={{ color: SUN }}>
                    <Icon name={a.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wide">{a.nome}</h3>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[color:var(--fg-soft)]">{a.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* ═══════════ 24 · MENSURAÇÃO ═══════════ */}
      <Slide index={idx("mensuracao")} name="mensuracao" tema="claro">
        <div className="container-somma relative z-10">
          <Kicker>Resultado</Kicker>
          <H2>
            O que a gente <Accent>mede</Accent>
          </H2>
          <Lead>
            O Somma também é plataforma de experimentação: cada ativação devolve leitura de produto, de
            hábito e de consumo.
          </Lead>

          <div className="mt-9 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              {METRICAS.map((m) => (
                <Card key={m.grupo} className="!p-5">
                  <p className="font-display text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: ORANGE }}>
                    {m.grupo}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {m.itens.map((i) => (
                      <li key={i} className="flex gap-2 text-[13px] text-[color:var(--fg-soft)]">
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[color:var(--fg-faint)]" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>

            <Dashboard />
          </div>

          <Nota>Exemplo de painel. As metas de cada indicador são definidas junto com a marca no início da parceria.</Nota>
        </div>
      </Slide>

      {/* ═══════════ 25 · VISÃO DE LONGO PRAZO ═══════════ */}
      <Slide index={idx("horizonte")} name="horizonte">
        <BgPhoto src={FOTOS.eixao2} alt="Pelotão do Somma Club no Eixão" veil="medio" position="50% 35%" />
        <div className="container-somma relative z-10">
          <Kicker cor={SUN}>Visão de longo prazo</Kicker>
          <H2>
            De apoiadora a <Accent>marca própria</Accent>
          </H2>
          <Lead>
            O objetivo não é aparecer num sábado. É construir uma propriedade de marca que nenhum banner
            ou patrocínio tradicional conseguiria criar.
          </Lead>

          <div className="mt-12 grid gap-x-6 gap-y-9 lg:grid-cols-3">
            {HORIZONTE.map((h, i) => (
              <div key={h.n}>
                <p className="a-up font-display text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: SUN }}>
                  {h.fase}
                </p>
                <Passo n={h.n} titulo={h.titulo} detalhe={h.texto} ultimo={i === HORIZONTE.length - 1} />
              </div>
            ))}
          </div>

          <Destaque cor={SUN}>
            A categoria de cuidado e proteção do running brasileiro ainda não tem dono.
          </Destaque>
        </div>
      </Slide>

      {/* ═══════════ 26 · FECHAMENTO ═══════════ */}
      <Slide index={idx("fechamento")} name="fechamento">
        <BgPhoto src={FOTOS.hero} alt="Comunidade do Somma Club reunida" veil="medio" />
        <SunRings className="left-[-8rem] top-[-6rem] h-[30rem] w-[30rem] opacity-50" />

        <div className="container-somma relative z-10">
          <Lockup className="a-up" size="lg" />
          <div className="a-rail mt-8 h-px w-24 origin-left" style={{ backgroundColor: SUN }} />

          <div className="a-mask mt-7 overflow-hidden py-1">
            <h2 className="font-display text-[2.6rem] font-bold uppercase leading-[0.86] tracking-tight sm:text-6xl md:text-[5rem]">
              Viver lá fora faz bem.
              <br />
              <Accent>Se proteger também.</Accent>
            </h2>
          </div>

          <div className="mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              "Colocar a marca dentro da rotina real do corredor.",
              "Gerar comunidade, conteúdo, produto, dados e venda.",
              "Construir uma propriedade de marca que é da Silver Care.",
            ].map((t, i) => (
              <div key={t} className="a-up flex gap-3">
                <span className="font-mono text-[11px] tracking-[0.2em]" style={{ color: ORANGE }}>
                  0{i + 1}
                </span>
                <p className="text-sm leading-relaxed text-white/70">{t}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-6">
            <SilverMark altura="h-7" />
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                Somma Club
              </p>
              <p className="mt-1 text-[13px] text-white/45">
                Brasília · DF · sommaclub.com.br · @somma.club
              </p>
            </div>
          </div>
        </div>
      </Slide>
    </div>
  );
}
