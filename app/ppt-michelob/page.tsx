"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Activity,
  BarChart3,
  Camera,
  ChevronDown,
  Database,
  Flag,
  Gift,
  Handshake,
  Heart,
  Music,
  Play,
  Repeat,
  Share2,
  Smartphone,
  Sparkles,
  Timer,
  Trophy,
  Users,
} from "lucide-react";

const IMG = "/michelob";

/** Paleta Michelob Ultra — amostrada da própria logo. */
const NAVY = "#283280";
const RED = "#D22030";
const GOLD = "#C6A664";

const SLIDES = [
  "capa",
  "oportunidade",
  "desafio",
  "grande-ideia",
  "social-pace",
  "como-funciona",
  "aquecimento",
  "challenge",
  "social-run",
  "percurso",
  "after-run",
  "conteudo",
  "entrega",
  "indicadores",
  "formatos",
  "recomendacao",
  "fechamento",
] as const;

export default function MichelobDeck() {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-slide]").forEach((section, i) => {
        const targets = section.querySelectorAll<HTMLElement>(".reveal");
        if (targets.length) {
          gsap.from(targets, {
            y: 44,
            opacity: 0,
            duration: 0.85,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: { trigger: section, scroller: el, start: "top 65%", once: true },
          });
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
          yPercent: 12,
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

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((node) => {
        const target = Number(node.dataset.count || "0");
        const obj = { n: 0 };
        gsap.to(obj, {
          n: target,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: node, scroller: el, start: "top 85%", once: true },
          onUpdate: () => {
            node.textContent = Math.round(obj.n).toLocaleString("pt-BR");
          },
        });
      });
    }, scroller);

    return () => ctx.revert();
  }, []);

  const goTo = useCallback((i: number) => {
    const el = scroller.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, i));
    el.querySelector<HTMLElement>(`[data-index="${clamped}"]`)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Navegação por teclado — apresentar sem depender do scroll.
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
        goTo(SLIDES.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, goTo]);

  return (
    <div
      ref={scroller}
      className="h-screen w-full snap-y snap-mandatory overflow-y-auto overflow-x-hidden bg-[#060B1C] text-white antialiased"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Lockup fixo da collab */}
      <div className="pointer-events-none fixed left-5 top-5 z-50 flex items-center gap-3 md:left-8 md:top-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${IMG}/logo-somma-white.png`} alt="Somma Club" className="h-4 w-auto opacity-80 md:h-[18px]" />
        <span className="text-[10px] font-light text-white/35">×</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${IMG}/logo-michelob-white.png`} alt="Michelob Ultra" className="h-4 w-auto opacity-80 md:h-[18px]" />
      </div>

      {/* Progresso lateral */}
      <div className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-2.5 md:flex">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Ir para slide ${i + 1}`}
            className="group flex items-center justify-end"
          >
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                active === i ? "w-6" : "w-1.5 bg-white/25 group-hover:bg-white/50"
              }`}
              style={active === i ? { backgroundColor: RED } : undefined}
            />
          </button>
        ))}
      </div>

      <div className="fixed bottom-5 left-5 z-50 font-mono text-[10px] tracking-[0.2em] text-white/35 md:left-8">
        {String(active + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
      </div>

      {/* ═══════════ 01 · CAPA ═══════════ */}
      <Slide index={0} name="capa" className="items-center justify-center text-center">
        <BgPhoto src={`${IMG}/capa.jpg`} alt="Corredores do Somma Club" priority overlay="cover" />
        <div className="container-somma relative z-10">
          <div className="reveal flex items-center justify-center gap-6 md:gap-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/logo-somma-white.png`} alt="Somma Club" className="h-7 w-auto md:h-11" />
            <span className="text-2xl font-extralight md:text-4xl" style={{ color: GOLD }}>
              ×
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/logo-michelob-white.png`} alt="Michelob Ultra" className="h-8 w-auto md:h-12" />
          </div>

          <div className="reveal mx-auto mt-10 h-px w-16" style={{ backgroundColor: GOLD, opacity: 0.6 }} />

          <p
            className="reveal mt-8 font-display text-xs font-semibold uppercase tracking-[0.45em]"
            style={{ color: GOLD }}
          >
            Proposta de campanha · 2026
          </p>
          <h1 className="reveal mx-auto mt-5 max-w-5xl font-display text-5xl font-bold uppercase leading-[0.9] tracking-tight md:text-8xl">
            Michelob Ultra
            <br />
            <span style={{ color: RED }}>Social Run</span>
          </h1>
          <p className="reveal mx-auto mt-7 max-w-lg text-lg font-light text-white/80 md:text-2xl">
            Corra pelo momento.
            <br />
            Fique pela experiência.
          </p>
        </div>
        <button
          onClick={() => goTo(1)}
          className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 text-white/50 transition-colors hover:text-white"
          aria-label="Avançar"
        >
          <ChevronDown className="h-7 w-7 animate-bounce" />
        </button>
      </Slide>

      {/* ═══════════ 02 · A OPORTUNIDADE ═══════════ */}
      <Slide index={1} name="oportunidade" className="items-center">
        <BgPhoto src={`${IMG}/comunidade.jpg`} alt="Comunidade Somma correndo" overlay="cards" />
        <div className="container-somma relative z-10">
          <Kicker>A oportunidade</Kicker>
          <H2 className="max-w-4xl">
            A corrida virou <Accent>ponto de encontro</Accent>
          </H2>
          <Lead className="max-w-2xl">
            A corrida hoje é mais do que performance. É comunidade, estilo de vida, pertencimento e conexão social.
          </Lead>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card
              icon={Repeat}
              title="Comunidade recorrente"
              text="Centenas de pessoas no mesmo lugar, toda semana, por vontade própria. Não é audiência comprada — é hábito."
            />
            <Card
              icon={Users}
              title="Momento social no pós-treino"
              text="O treino termina e ninguém vai embora. É ali, depois da linha de chegada, que a conversa começa."
            />
            <Card
              icon={Sparkles}
              title="Território natural para Michelob Ultra"
              text="Uma marca de estilo de vida ativo entrando em um ritual que já existe — e que já é social por natureza."
              highlight
            />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 03 · O DESAFIO DA MARCA ═══════════ */}
      <Slide index={2} name="desafio" className="items-center">
        <BgPhoto src={`${IMG}/marca.jpg`} alt="Marca presente em evento de corrida" overlay="cards" />
        <div className="container-somma relative z-10">
          <Kicker>O desafio da marca</Kicker>
          <H2 className="max-w-4xl">
            Como entrar na comunidade sem parecer <Accent>só patrocínio</Accent>
          </H2>
          <Lead className="max-w-2xl">
            O risco é ser apenas uma marca presente no evento. A oportunidade é criar uma experiência que a comunidade
            queira viver, registrar e compartilhar.
          </Lead>

          <div className="mt-11 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="reveal rounded-3xl border border-white/10 bg-white/[0.02] p-7">
              <p className="font-display text-lg font-semibold uppercase tracking-wide text-white/45">
                Patrocínio comum
              </p>
              <ul className="mt-5 space-y-3">
                {["Logo", "Produto", "Presença pontual"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-base text-white/45">
                    <span className="h-px w-4 bg-white/20" />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-white/30">A marca aparece. E é esquecida na segunda-feira.</p>
            </div>

            <div
              className="reveal rounded-3xl border p-7"
              style={{ borderColor: `${RED}66`, backgroundColor: `${RED}0F` }}
            >
              <p className="font-display text-lg font-semibold uppercase tracking-wide" style={{ color: RED }}>
                Experiência proprietária
              </p>
              <ul className="mt-5 space-y-3">
                {["Narrativa", "Participação", "Conteúdo", "Dados", "Continuidade"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-base font-medium text-white">
                    <span className="h-px w-4" style={{ backgroundColor: RED }} />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-white/60">A marca é vivida. E vira história que a comunidade conta.</p>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 04 · A GRANDE IDEIA ═══════════ */}
      <Slide index={3} name="grande-ideia" className="items-center justify-center text-center">
        <BgPhoto src={`${IMG}/pelotao.jpg`} alt="Pelotão do Somma Club" overlay="cover" />
        <div className="container-somma relative z-10">
          <Kicker className="justify-center">A grande ideia</Kicker>
          <h2 className="reveal mx-auto mt-5 max-w-4xl font-display text-5xl font-bold uppercase leading-[0.92] tracking-tight md:text-7xl">
            Michelob Ultra <span style={{ color: RED }}>Social Run</span>
          </h2>
          <p className="reveal mx-auto mt-6 max-w-2xl text-lg font-light text-white/80 md:text-2xl">
            Uma experiência que começa na corrida e termina em um encontro social premium.
          </p>

          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { v: "Run", t: "Corrida que inspira movimento", i: Activity },
              { v: "Connect", t: "Comunidade que aproxima pessoas", i: Handshake },
              { v: "Celebrate", t: "Experiências que viram memória", i: Sparkles },
            ].map(({ v, t, i: Icon }) => (
              <div
                key={v}
                className="reveal rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-8 backdrop-blur-sm"
              >
                <Icon className="mx-auto h-6 w-6" style={{ color: GOLD }} />
                <p className="mt-5 font-display text-3xl font-bold uppercase tracking-tight md:text-4xl">{v}</p>
                <p className="mt-2 text-sm text-white/60">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* ═══════════ 05 · O CONCEITO CRIATIVO ═══════════ */}
      <Slide index={4} name="social-pace" className="items-center">
        <BgPhoto src={`${IMG}/social-pace.jpg`} alt="Amigos no pós-treino" overlay="cards" />
        <div className="container-somma relative z-10 grid items-center gap-12 lg:grid-cols-[1fr_auto]">
          <div>
            <Kicker>O conceito criativo</Kicker>
            <H2 className="max-w-2xl">
              The <Accent>Social Pace</Accent>
            </H2>
            <Lead className="max-w-xl">
              Todo corredor tem dois ritmos: o pace da corrida e o pace da vida.
            </Lead>
            <div
              className="reveal mt-9 max-w-md border-l-2 pl-5 text-lg font-light italic leading-snug text-white/85 md:text-xl"
              style={{ borderColor: GOLD }}
            >
              “A gente mede o tempo da corrida. Os melhores momentos não precisam de relógio.”
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
            <PaceCard run="5:20/km" life="sem pressa" lifeLabel="Meu pace com os amigos" />
            <PaceCard run="6:40/km" life="o dia inteiro" lifeLabel="Meu pace para aproveitar" />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 06 · COMO FUNCIONA ═══════════ */}
      <Slide index={5} name="como-funciona" className="items-center bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Como funciona</Kicker>
          <H2 className="max-w-3xl">
            A campanha em <Accent>três momentos</Accent>
          </H2>

          <div className="relative mt-14">
            {/* trilho do fluxo */}
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-white/5 via-white/25 to-white/5 md:block" />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
              {[
                {
                  n: "01",
                  t: "Aquecimento digital",
                  d: "Inscrição, escolha do perfil, cards compartilháveis e desafio.",
                  i: Smartphone,
                },
                {
                  n: "02",
                  t: "Michelob Ultra Social Run",
                  d: "Treino especial de 5 km e 10 km, pelotões, experiências e conteúdo.",
                  i: Flag,
                },
                {
                  n: "03",
                  t: "Ultra After Run",
                  d: "Música, recovery, convivência, experimentação responsável e socialização.",
                  i: Music,
                },
              ].map(({ n, t, d, i: Icon }, idx) => (
                <div key={n} className="reveal relative">
                  <div
                    className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-[#080F26] font-display text-base font-bold"
                    style={{ borderColor: idx === 1 ? RED : `${GOLD}80`, color: idx === 1 ? RED : GOLD }}
                  >
                    {n}
                  </div>
                  <Icon className="mt-7 h-5 w-5 text-white/35" />
                  <h3 className="mt-4 font-display text-2xl font-semibold uppercase leading-tight tracking-tight md:text-3xl">
                    {t}
                  </h3>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">{d}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="reveal mt-14 text-sm text-white/40">
            Desejo antes · experiência durante · memória depois.
          </p>
        </div>
      </Slide>

      {/* ═══════════ 07 · AQUECIMENTO DIGITAL ═══════════ */}
      <Slide index={6} name="aquecimento" className="items-center">
        <BgPhoto src={`${IMG}/digital.jpg`} alt="Corredoras do Somma Club" overlay="cards" />
        <div className="container-somma relative z-10 grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <Kicker>Momento 01 · Antes do evento</Kicker>
            <H2 className="max-w-xl">
              Antes do evento: <Accent>desejo e identificação</Accent>
            </H2>
            <Lead className="max-w-lg">
              Por uma a duas semanas, Somma e Michelob Ultra fazem uma única pergunta:{" "}
              <strong className="font-medium text-white">qual é o seu motivo para correr?</strong>
            </Lead>

            <p className="reveal mt-8 text-sm uppercase tracking-[0.2em] text-white/40">
              Na landing page, o participante escolhe um perfil
            </p>
            <div className="reveal mt-4 flex flex-wrap gap-2.5">
              {["Performance", "Comunidade", "Diversão", "Equilíbrio"].map((p) => (
                <span
                  key={p}
                  className="rounded-full border px-4 py-2 font-display text-base font-semibold uppercase tracking-wide"
                  style={{ borderColor: `${GOLD}59`, color: GOLD }}
                >
                  {p}
                </span>
              ))}
            </div>

            <div className="reveal mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Cada um recebe um card compartilhável</p>
              <p className="mt-2 font-display text-xl font-semibold leading-snug md:text-2xl">
                “Meu pace é 6:10. Meu motivo é <span style={{ color: RED }}>encontrar minha galera</span>.”
              </p>
            </div>
          </div>

          <div className="reveal flex justify-center lg:justify-end">
            <MockLanding />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 08 · ULTRA BALANCE CHALLENGE ═══════════ */}
      <Slide index={7} name="challenge" className="items-center">
        <BgPhoto src={`${IMG}/desafio.jpg`} alt="Comunidade Somma comemorando" overlay="cards" />
        <div className="container-somma relative z-10">
          <Kicker>Ultra Balance Challenge</Kicker>
          <H2 className="max-w-4xl">
            Um desafio para a campanha durar <Accent>mais que um dia</Accent>
          </H2>
          <Lead className="max-w-2xl">
            Durante 21 dias, a comunidade cumpre missões simples ligadas a movimento, conexão e diversão.
          </Lead>

          <div className="mt-10 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
            <div className="reveal overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              <table className="w-full text-left">
                <tbody>
                  {[
                    { p: "Movimento", m: "Realizar três treinos na semana", i: Activity },
                    { p: "Conexão", m: "Correr com alguém novo", i: Users },
                    { p: "Diversão", m: "Compartilhar seu ritual de equilíbrio", i: Sparkles },
                  ].map(({ p, m, i: Icon }) => (
                    <tr key={p} className="border-b border-white/[0.07] last:border-0">
                      <td className="w-px whitespace-nowrap py-5 pl-6 pr-5">
                        <span className="flex items-center gap-2.5 font-display text-lg font-semibold uppercase tracking-wide">
                          <Icon className="h-4 w-4" style={{ color: GOLD }} />
                          {p}
                        </span>
                      </td>
                      <td className="py-5 pr-6 text-[15px] text-white/65">{m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-white/[0.07] px-6 py-5">
                <MockChallengeGrid />
              </div>
            </div>

            <div
              className="reveal rounded-3xl border p-7"
              style={{ borderColor: `${RED}59`, backgroundColor: `${RED}0F` }}
            >
              <p className="font-display text-lg font-semibold uppercase tracking-wide" style={{ color: RED }}>
                Quem completa, desbloqueia
              </p>
              <ul className="mt-5 space-y-3.5">
                {[
                  { t: "Área exclusiva no evento", i: Trophy },
                  { t: "Produtos personalizados", i: Gift },
                  { t: "Experiências especiais", i: Sparkles },
                  { t: "Acesso ao Ultra After Run", i: Music },
                ].map(({ t, i: Icon }) => (
                  <li key={t} className="flex items-center gap-3 text-[15px] text-white/85">
                    <Icon className="h-4 w-4 shrink-0" style={{ color: RED }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 09 · O TREINO ESPECIAL ═══════════ */}
      <Slide index={8} name="social-run" className="items-center">
        <BgPhoto src={`${IMG}/treino.jpg`} alt="Treino do Somma Club" overlay="cards" />
        <div className="container-somma relative z-10">
          <Kicker>Momento 02 · Michelob Ultra Social Run</Kicker>
          <H2 className="max-w-3xl">
            O <Accent>treino especial</Accent>
          </H2>

          <div className="reveal mt-6 flex flex-wrap gap-x-7 gap-y-2 text-[15px] text-white/65">
            <span>Sábado pela manhã</span>
            <span className="text-white/20">·</span>
            <span>Percursos de 5 km e 10 km</span>
            <span className="text-white/20">·</span>
            <span>Pelotões por ritmo e perfil</span>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { n: "Performance Crew", d: "Quem busca tempo e evolução.", img: "crew-performance" },
              { n: "Social Crew", d: "Quem corre pela conversa.", img: "crew-social" },
              { n: "Enjoy Crew", d: "Quem vai pelo prazer do percurso.", img: "crew-enjoy" },
              { n: "First Run Crew", d: "Quem está começando agora.", img: "crew-first" },
            ].map((c) => (
              <div
                key={c.n}
                className="reveal group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image src={`${IMG}/${c.img}.jpg`} alt={c.n} fill sizes="300px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060B1C] via-[#060B1C]/30 to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl font-semibold uppercase leading-tight tracking-tight">{c.n}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{c.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* ═══════════ 10 · PONTOS DE EXPERIÊNCIA ═══════════ */}
      <Slide index={9} name="percurso" className="items-center">
        <BgPhoto src={`${IMG}/percurso.jpg`} alt="Corredores no percurso" overlay="cards" />
        <div className="container-somma relative z-10">
          <Kicker>Pontos de experiência no percurso</Kicker>
          <H2 className="max-w-3xl">
            A corrida vira <Accent>experiência</Accent>
          </H2>

          <div className="relative mt-14">
            <div
              className="absolute left-0 right-0 top-5 hidden h-0.5 md:block"
              style={{ background: `linear-gradient(90deg, ${GOLD}00, ${GOLD}80, ${RED})` }}
            />
            <div className="grid grid-cols-1 gap-9 md:grid-cols-3 md:gap-6">
              {[
                {
                  km: "KM 2",
                  t: "Ultra Pace Point",
                  d: "Registro do ritmo do corredor com foto ou vídeo personalizado.",
                  i: Timer,
                },
                {
                  km: "Último KM",
                  t: "Enjoyment Kilometer",
                  d: "Música, torcida, mensagens e captação de conteúdo no trecho final.",
                  i: Music,
                },
                {
                  km: "Chegada",
                  t: "Social Finish Line",
                  d: "A linha de chegada leva direto ao espaço de convivência Michelob Ultra.",
                  i: Flag,
                  last: true,
                },
              ].map(({ km, t, d, i: Icon, last }) => (
                <div key={t} className="reveal relative">
                  <div
                    className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-[#060B1C]"
                    style={{ borderColor: last ? RED : GOLD }}
                  >
                    <Icon className="h-4 w-4" style={{ color: last ? RED : GOLD }} />
                  </div>
                  <p
                    className="mt-6 font-display text-xs font-semibold uppercase tracking-[0.25em]"
                    style={{ color: last ? RED : GOLD }}
                  >
                    {km}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold uppercase leading-tight tracking-tight md:text-3xl">
                    {t}
                  </h3>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 11 · ULTRA AFTER RUN ═══════════ */}
      <Slide index={10} name="after-run" className="items-center">
        <BgPhoto src={`${IMG}/afterrun.jpg`} alt="Espaço de convivência pós-treino" overlay="cards" />
        <div className="container-somma relative z-10">
          <Kicker>Momento 03 · Ultra After Run</Kicker>
          <H2 className="max-w-4xl">
            O pós-treino como <Accent>território da marca</Accent>
          </H2>
          <Lead className="max-w-2xl">
            É aqui que a corrida vira encontro — e a marca deixa de ser patrocinadora para virar anfitriã.
          </Lead>

          <div className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {[
              "Bar Michelob Ultra",
              "Espaço recovery",
              "DJ ou música ao vivo",
              "Café da manhã",
              "Hidratação",
              "Área de fotos e vídeos",
              "Personalização de copos",
              "Jogos sociais rápidos",
              "Loja colaborativa",
              "Convidados e influenciadores",
            ].map((t, i) => (
              <div
                key={t}
                className="reveal rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 backdrop-blur-sm"
              >
                <span className="font-mono text-[10px] tracking-widest" style={{ color: GOLD }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 text-sm font-medium leading-snug text-white/85">{t}</p>
              </div>
            ))}
          </div>

          <p className="reveal mt-8 text-xs text-white/35">
            Consumo responsável. Experiência para maiores de 18 anos.
          </p>
        </div>
      </Slide>

      {/* ═══════════ 12 · CONTEÚDO DA CAMPANHA ═══════════ */}
      <Slide index={11} name="conteudo" className="items-center">
        <BgPhoto src={`${IMG}/conteudo.jpg`} alt="Registro de conteúdo no treino" overlay="cards" />
        <div className="container-somma relative z-10 grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <Kicker>Conteúdo da campanha</Kicker>
            <H2 className="max-w-lg">
              Pessoas que sabem <Accent>equilibrar</Accent>
            </H2>
            <Lead className="max-w-lg">
              A campanha deixa de ser uma ativação pontual e vira narrativa humana: quem são as pessoas que treinam,
              trabalham, riem e aproveitam — no ritmo delas.
            </Lead>
            <div className="reveal mt-8 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: RED }}
              >
                <Play className="h-5 w-5 fill-white text-white" />
              </span>
              <div>
                <p className="font-display text-xl font-semibold uppercase tracking-tight">Filme principal · 60s</p>
                <p className="text-sm text-white/55">O manifesto do Social Pace.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { t: "4 vídeos individuais", s: "20 a 30 segundos" },
              { t: "Reels do treino", s: "no calor do momento" },
              { t: "Bastidores", s: "making of da experiência" },
              { t: "Fotos dos participantes", s: "galeria oficial" },
              { t: "Depoimentos rápidos", s: "a voz da comunidade" },
              { t: "Recap oficial", s: "o resumo da campanha" },
              { t: "UGC da comunidade", s: "conteúdo espontâneo" },
              { t: "Distribuição Somma", s: "canais + insiders" },
            ].map((f) => (
              <div key={f.t} className="reveal rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-sm font-semibold leading-snug text-white/90">{f.t}</p>
                <p className="mt-0.5 text-xs text-white/40">{f.s}</p>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* ═══════════ 13 · O QUE O SOMMA ENTREGA ═══════════ */}
      <Slide index={12} name="entrega" className="items-center">
        <BgPhoto src={`${IMG}/entrega.jpg`} alt="Comunidade Somma reunida" overlay="cards" />
        <div className="container-somma relative z-10">
          <Kicker>O que o Somma entrega</Kicker>
          <H2 className="max-w-3xl">
            Cinco frentes, <Accent>uma execução</Accent>
          </H2>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                t: "Comunidade",
                d: "Acesso a mais de 5 mil membros e presença recorrente toda semana.",
                i: Users,
              },
              {
                t: "Experiência",
                d: "Planejamento e execução do treino, pelotões, professores, percurso e equipe de apoio.",
                i: Flag,
              },
              {
                t: "Conteúdo",
                d: "Produção e distribuição nos canais do Somma, professores, insiders e participantes.",
                i: Camera,
              },
              {
                t: "Dados",
                d: "Landing page, inscrições, aceite de comunicação, perfil, presença, pesquisa e relatório final.",
                i: Database,
              },
              {
                t: "Continuidade",
                d: "Possibilidade de virar plataforma mensal ou trimestral com a marca.",
                i: Repeat,
              },
            ].map(({ t, d, i: Icon }) => (
              <div
                key={t}
                className="reveal flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
              >
                <Icon className="h-5 w-5" style={{ color: GOLD }} />
                <h3 className="mt-5 font-display text-2xl font-semibold uppercase tracking-tight">{t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/60">{d}</p>
              </div>
            ))}
          </div>

          <div className="reveal mt-8 flex flex-wrap items-baseline gap-x-10 gap-y-4">
            <BigStat count={5000} suffix="+" label="membros na comunidade" />
            <BigStat count={300} label="pessoas todo sábado" />
            <BigStat staticValue="#1" label="running club do DF" />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 14 · INDICADORES ═══════════ */}
      <Slide index={13} name="indicadores" className="items-center bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Indicadores de sucesso</Kicker>
          <H2 className="max-w-3xl">
            Como vamos <Accent>medir resultado</Accent>
          </H2>

          <div className="mt-10 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
            <div className="reveal overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                      Dimensão
                    </th>
                    <th className="px-6 py-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                      Indicadores
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Alcance", "Inscritos · presentes · maiores de 18 impactados"],
                    ["Base", "Novos cadastros captados com aceite de comunicação"],
                    ["Mídia", "Alcance, visualizações, marcações e menções"],
                    ["Conteúdo", "Peças produzidas pela produção e pelos participantes"],
                    ["Produto", "Produtos experimentados no Ultra After Run"],
                    ["Marca", "Lembrança, intenção de compra e associação com vida ativa"],
                    ["Eficiência", "Custo por participante impactado"],
                  ].map(([dim, ind]) => (
                    <tr key={dim} className="border-b border-white/[0.06] last:border-0">
                      <td className="whitespace-nowrap px-6 py-3.5 font-display text-base font-semibold uppercase tracking-wide">
                        {dim}
                      </td>
                      <td className="px-6 py-3.5 text-white/60">{ind}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="reveal">
              <MockReport />
              <p className="mt-4 text-sm text-white/45">
                Relatório final consolidado entregue pelo Somma até 15 dias após o evento.
              </p>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 15 · FORMATOS COMERCIAIS ═══════════ */}
      <Slide index={14} name="formatos" className="items-center bg-[#060B1C]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Formatos comerciais</Kicker>
          <H2 className="max-w-3xl">
            Três formas de <Accent>executar</Accent>
          </H2>

          <div className="mt-11 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <FormatCard
              name="Essencial"
              summary="Uma ativação forte, em um único dia."
              items={["Um treino especial", "Estrutura de marca", "Conteúdo", "Ultra After Run"]}
            />
            <FormatCard
              name="Campanha"
              summary="Desejo antes, experiência durante, memória depois."
              items={[
                "Aquecimento digital",
                "Ultra Balance Challenge · 21 dias",
                "Treino especial",
                "Experiência social",
                "Produção de conteúdo",
              ]}
              recommended
            />
            <FormatCard
              name="Plataforma"
              summary="A marca vira parte do calendário da comunidade."
              items={[
                "Temporada com 3 ou 4 encontros",
                "Desafio digital",
                "Embaixadores Somma",
                "Conteúdo contínuo",
                "Encerramento especial",
              ]}
            />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 16 · RECOMENDAÇÃO ═══════════ */}
      <Slide index={15} name="recomendacao" className="items-center">
        <BgPhoto src={`${IMG}/recomendacao.jpg`} alt="Grupo do Somma Club" overlay="cards" />
        <div className="container-somma relative z-10">
          <Kicker>Nossa recomendação</Kicker>
          <H2 className="max-w-4xl">
            Formato <Accent>Campanha</Accent>
          </H2>
          <Lead className="max-w-2xl">
            Porque cria desejo antes, experiência durante e memória depois — conectando marca, comunidade, conteúdo e
            dados em uma única jornada.
          </Lead>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { k: "Antes", t: "Aquecimento digital", d: "Landing page, perfis, cards e o desafio de 21 dias." },
              { k: "Durante", t: "Michelob Ultra Social Run", d: "Treino especial, pelotões e pontos de experiência." },
              {
                k: "Depois",
                t: "Ultra After Run + conteúdo",
                d: "Convivência, recap da campanha e relatório de resultados.",
              },
            ].map(({ k, t, d }, i) => (
              <div
                key={k}
                className="reveal rounded-3xl border p-7 backdrop-blur-sm"
                style={
                  i === 1
                    ? { borderColor: `${RED}59`, backgroundColor: `${RED}12` }
                    : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }
                }
              >
                <p
                  className="font-display text-xs font-semibold uppercase tracking-[0.3em]"
                  style={{ color: i === 1 ? RED : GOLD }}
                >
                  {k}
                </p>
                <h3 className="mt-4 font-display text-2xl font-semibold uppercase leading-tight tracking-tight">{t}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/60">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* ═══════════ 17 · FECHAMENTO ═══════════ */}
      <Slide index={16} name="fechamento" className="items-center justify-center text-center">
        <BgPhoto src={`${IMG}/fechamento.jpg`} alt="Comunidade Somma no fim de tarde" overlay="cover" />
        <div className="container-somma relative z-10">
          <Kicker className="justify-center">Fechamento</Kicker>
          <h2 className="reveal mx-auto mt-5 max-w-4xl font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight md:text-6xl">
            Vamos criar o ponto de encontro mais desejado da corrida em <Accent>Brasília</Accent>
          </h2>
          <p className="reveal mx-auto mt-7 max-w-xl text-base font-light leading-relaxed text-white/75 md:text-lg">
            Michelob Ultra Social Run aproxima a marca de uma comunidade real, ativa e influente.
            <br />
            Não é só sobre correr. É sobre viver o momento depois da linha de chegada.
          </p>

          <div className="reveal mx-auto mt-12 flex items-center justify-center gap-6 md:gap-9">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/logo-somma-white.png`} alt="Somma Club" className="h-6 w-auto md:h-8" />
            <span className="text-xl font-extralight md:text-2xl" style={{ color: GOLD }}>
              ×
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/logo-michelob-white.png`} alt="Michelob Ultra" className="h-7 w-auto md:h-9" />
          </div>
          <p className="reveal mt-7 font-display text-lg font-semibold uppercase tracking-[0.2em] md:text-2xl">
            Corra pelo momento. <span style={{ color: RED }}>Fique pela experiência.</span>
          </p>
        </div>

        <p className="absolute bottom-6 left-1/2 z-10 w-full -translate-x-1/2 px-6 text-center text-[11px] text-white/30">
          Consumo responsável. Experiência destinada ao público maior de 18 anos.
        </p>
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
    // justify-center: o conteúdo fica centrado verticalmente no slide.
    // Sem overflow-hidden aqui — o BgPhoto já recorta o próprio parallax, e
    // assim em telas baixas o slide cresce em vez de cortar o conteúdo.
    <section
      data-slide={name}
      data-index={index}
      className={`relative flex min-h-screen w-full snap-start flex-col justify-center px-2 py-16 md:py-20 ${className}`}
    >
      {children}
    </section>
  );
}

function BgPhoto({
  src,
  alt,
  overlay = "cover",
  priority,
}: {
  src: string;
  alt: string;
  overlay?: "cover" | "cards";
  priority?: boolean;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="100vw"
        className="parallax scale-110 object-cover object-center"
      />
      {overlay === "cover" ? (
        <div className="absolute inset-0 bg-gradient-to-b from-[#060B1C]/75 via-[#060B1C]/65 to-[#060B1C]/90" />
      ) : (
        <>
          <div className="absolute inset-0 bg-[#060B1C]/[0.78]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060B1C] via-[#060B1C]/40 to-[#060B1C]/70" />
        </>
      )}
    </div>
  );
}

/** Malha sutil para os slides sem foto — evita fundo chapado. */
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

/* ── Tipografia ────────────────────────────────────────────────────────── */

function Kicker({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`reveal flex items-center gap-3 font-display text-xs font-semibold uppercase tracking-[0.35em] ${className}`}
      style={{ color: GOLD }}
    >
      <span className="h-px w-6" style={{ backgroundColor: GOLD, opacity: 0.6 }} />
      {children}
    </p>
  );
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`reveal mt-5 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight md:text-6xl ${className}`}
    >
      {children}
    </h2>
  );
}

function Lead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`reveal mt-6 text-base font-light leading-relaxed text-white/70 md:text-lg ${className}`}>{children}</p>;
}

function Accent({ children }: { children: React.ReactNode }) {
  return <span style={{ color: RED }}>{children}</span>;
}

/* ── Blocos ────────────────────────────────────────────────────────────── */

function Card({
  icon: Icon,
  title,
  text,
  highlight,
}: {
  icon: typeof Users;
  title: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="reveal flex flex-col rounded-3xl border p-7 backdrop-blur-sm"
      style={
        highlight
          ? { borderColor: `${RED}59`, backgroundColor: `${RED}12` }
          : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }
      }
    >
      <Icon className="h-5 w-5" style={{ color: highlight ? RED : GOLD }} />
      <h3 className="mt-6 font-display text-2xl font-semibold uppercase leading-tight tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/60">{text}</p>
    </div>
  );
}

function BigStat({
  count,
  suffix = "",
  staticValue,
  label,
}: {
  count?: number;
  suffix?: string;
  staticValue?: string;
  label: string;
}) {
  return (
    <div className="reveal">
      <p className="font-display text-5xl font-bold leading-none tracking-tight md:text-6xl">
        {staticValue ? (
          <span style={{ color: RED }}>{staticValue}</span>
        ) : (
          <>
            <span data-count={count}>0</span>
            <span style={{ color: RED }}>{suffix}</span>
          </>
        )}
      </p>
      <p className="mt-2 text-sm text-white/50">{label}</p>
    </div>
  );
}

function FormatCard({
  name,
  summary,
  items,
  recommended,
}: {
  name: string;
  summary: string;
  items: string[];
  recommended?: boolean;
}) {
  return (
    <div
      className={`reveal relative flex flex-col rounded-3xl border p-7 backdrop-blur-sm ${recommended ? "lg:-my-3 lg:p-8" : ""}`}
      style={
        recommended
          ? { borderColor: RED, backgroundColor: `${RED}14` }
          : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }
      }
    >
      {recommended && (
        <span
          className="absolute -top-3 left-8 rounded-full px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white"
          style={{ backgroundColor: RED }}
        >
          Recomendado
        </span>
      )}
      <p className="font-display text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: recommended ? RED : GOLD }}>
        Formato
      </p>
      <h3 className="mt-2 font-display text-4xl font-bold uppercase leading-none tracking-tight">{name}</h3>
      <p className="mt-3 text-sm text-white/55">{summary}</p>
      <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-6">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2.5 text-sm text-white/80">
            <span
              className="mt-[7px] h-1 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: recommended ? RED : GOLD }}
            />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Mockups ───────────────────────────────────────────────────────────── */

/** Card compartilhável do conceito "The Social Pace". */
function PaceCard({ run, life, lifeLabel }: { run: string; life: string; lifeLabel: string }) {
  return (
    <div
      className="reveal w-full max-w-[290px] overflow-hidden rounded-2xl border shadow-2xl"
      style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: NAVY }}
    >
      <div className="px-6 pb-6 pt-7">
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">Meu pace na corrida</p>
        <p className="mt-1 font-display text-4xl font-bold leading-none tracking-tight text-white">{run}</p>

        <div className="my-5 h-px w-full" style={{ backgroundColor: `${GOLD}4D` }} />

        <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: GOLD }}>
          {lifeLabel}
        </p>
        <p className="mt-1 font-display text-4xl font-bold leading-none tracking-tight" style={{ color: "#fff" }}>
          {life}
        </p>
      </div>
      <div className="flex items-center justify-between px-6 py-3" style={{ backgroundColor: RED }}>
        <span className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
          Social Run
        </span>
        <Share2 className="h-3.5 w-3.5 text-white/80" />
      </div>
    </div>
  );
}

/** Mockup da landing page de inscrição. */
function MockLanding() {
  return (
    <div className="w-[248px] rounded-[2rem] border-[6px] border-[#151A31] bg-[#060B1C] p-3.5 shadow-2xl">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15" />
      <div className="flex items-center justify-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${IMG}/logo-somma-white.png`} alt="" className="h-2 w-auto opacity-70" />
        <span className="text-[7px] text-white/30">×</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${IMG}/logo-michelob-white.png`} alt="" className="h-2 w-auto opacity-70" />
      </div>

      <p className="mt-4 text-center font-display text-base font-bold uppercase leading-tight text-white">
        Qual é o seu motivo
        <br />
        para correr?
      </p>

      <div className="mt-3.5 space-y-1.5">
        {[
          ["Performance", false],
          ["Comunidade", true],
          ["Diversão", false],
          ["Equilíbrio", false],
        ].map(([label, on]) => (
          <div
            key={label as string}
            className="flex items-center justify-between rounded-lg border px-2.5 py-2"
            style={
              on
                ? { borderColor: RED, backgroundColor: `${RED}26` }
                : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }
            }
          >
            <span className={`text-[9px] font-semibold ${on ? "text-white" : "text-white/55"}`}>{label as string}</span>
            <span
              className="h-2.5 w-2.5 rounded-full border"
              style={on ? { backgroundColor: RED, borderColor: RED } : { borderColor: "rgba(255,255,255,0.25)" }}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg py-2 text-center" style={{ backgroundColor: RED }}>
        <span className="font-display text-[10px] font-bold uppercase tracking-widest text-white">
          Garantir minha vaga
        </span>
      </div>

      <div className="mt-2.5 rounded-lg p-2.5" style={{ backgroundColor: NAVY }}>
        <p className="text-[6px] uppercase tracking-[0.2em] text-white/45">Seu card</p>
        <p className="mt-0.5 text-[8px] font-semibold leading-tight text-white">
          Meu pace é 6:10. Meu motivo é <span style={{ color: GOLD }}>encontrar minha galera</span>.
        </p>
      </div>
      <p className="mt-2 text-center text-[5px] text-white/25">+18 · Consumo responsável</p>
    </div>
  );
}

/** Grade de 21 dias do Ultra Balance Challenge. */
function MockChallengeGrid() {
  const done = 13;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">21 dias · progresso</p>
        <p className="font-display text-sm font-semibold" style={{ color: GOLD }}>
          {done}/21
        </p>
      </div>
      <div className="mt-3 grid grid-cols-[repeat(21,minmax(0,1fr))] gap-1">
        {Array.from({ length: 21 }).map((_, i) => (
          <span
            key={i}
            className="aspect-square rounded-[3px]"
            style={{
              backgroundColor: i < done ? RED : "rgba(255,255,255,0.08)",
              opacity: i < done ? 0.45 + (i / done) * 0.55 : 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Mockup do relatório de dados entregue ao fim da campanha. */
function MockReport() {
  const bars = [42, 68, 55, 88, 74, 96];
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
        <span className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide">
          <BarChart3 className="h-4 w-4" style={{ color: GOLD }} />
          Relatório da campanha
        </span>
        <span className="text-[10px] text-white/30">Somma Club</span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/10 border-b border-white/10">
        {[
          ["Inscritos", "1.240"],
          ["Presentes", "870"],
          ["Novos leads", "610"],
        ].map(([l, v]) => (
          <div key={l} className="px-4 py-4">
            <p className="font-display text-2xl font-bold leading-none">{v}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">{l}</p>
          </div>
        ))}
      </div>

      <div className="px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Engajamento por etapa</p>
        <div className="mt-3 flex h-20 items-end gap-1.5">
          {bars.map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-t-[3px]"
              style={{
                height: `${h}%`,
                backgroundColor: i === bars.length - 1 ? RED : `${GOLD}`,
                opacity: i === bars.length - 1 ? 1 : 0.28 + i * 0.09,
              }}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-[10px] text-white/35">
          <span className="flex items-center gap-1.5">
            <Heart className="h-3 w-3" style={{ color: RED }} /> Lembrança de marca
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" style={{ color: GOLD }} /> Intenção de compra
          </span>
        </div>
      </div>
    </div>
  );
}
