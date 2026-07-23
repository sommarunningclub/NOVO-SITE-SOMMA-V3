"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const IMG = "/michelob";

/** Paleta Michelob Ultra, amostrada da própria logo. */
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
  "totem",
  "conteudo",
  "entrega",
  "indicadores",
  "formatos",
  "recomendacao",
  "fechamento",
] as const;

export default function MichelobDeck() {
  const scroller = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

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
          tl.from(
            ups,
            { y: 30, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.07 },
            0.2,
          );
        }
        // Fotos internas abrem com leve zoom-out.
        const imgs = section.querySelectorAll<HTMLElement>(".a-img");
        if (imgs.length) {
          tl.from(
            imgs,
            { scale: 1.18, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.08 },
            0.15,
          );
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

      // Contadores.
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((node) => {
        const target = Number(node.dataset.count || "0");
        const obj = { n: 0 };
        gsap.to(obj, {
          n: target,
          duration: 1.7,
          ease: "power2.out",
          scrollTrigger: { trigger: node, scroller: el, start: "top 85%", once: true },
          onUpdate: () => {
            node.textContent = Math.round(obj.n).toLocaleString("pt-BR");
          },
        });
      });

      // Grade de 21 dias preenche em sequência.
      gsap.utils.toArray<HTMLElement>("[data-grid-day]").forEach((node, i) => {
        gsap.from(node, {
          scale: 0.2,
          opacity: 0,
          duration: 0.5,
          ease: "back.out(2)",
          delay: i * 0.025,
          scrollTrigger: { trigger: node.parentElement!, scroller: el, start: "top 85%", once: true },
        });
      });

      // Barras do relatório sobem da base.
      gsap.utils.toArray<HTMLElement>("[data-bar]").forEach((node, i) => {
        gsap.from(node, {
          scaleY: 0,
          transformOrigin: "bottom",
          duration: 0.8,
          ease: "power3.out",
          delay: i * 0.07,
          scrollTrigger: { trigger: node.parentElement!, scroller: el, start: "top 85%", once: true },
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
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} aria-label={`Ir para slide ${i + 1}`} className="group flex justify-end">
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
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
        <span className="text-white/30">{SLIDES.length}</span>
      </div>

      {/* ═══════════ 01 · CAPA ═══════════ */}
      <Slide index={0} name="capa" className="justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={`${IMG}/m-capa.jpg`}
            alt="Corredor do Somma Club na Ponte JK, em Brasília"
            fill
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
          {/* Véu lateral: o texto respira à esquerda e o corredor continua visível. */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060B1C] via-[#060B1C]/80 to-[#060B1C]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060B1C] via-transparent to-[#060B1C]/45" />
        </div>

        <div className="container-somma relative z-10">
          <div className="max-w-2xl">
            <Lockup className="a-up" />
            <div className="a-rail mt-9 h-px w-24 origin-left" style={{ backgroundColor: GOLD }} />
            <p className="a-up mt-7 font-display text-xs font-semibold uppercase tracking-[0.45em]" style={{ color: GOLD }}>
              Proposta de campanha · 2026
            </p>
            <div className="a-mask mt-5 overflow-hidden py-1">
              <h1 className="font-display text-[2.6rem] font-bold uppercase leading-[0.9] tracking-tight sm:text-5xl md:text-8xl">
                Michelob Ultra
                <br />
                <span style={{ color: RED }}>Social Run</span>
              </h1>
            </div>
            <p className="a-up mt-7 text-lg font-light leading-snug text-white/85 md:text-2xl">
              Corra pelo momento.
              <br />
              Fique pela experiência.
            </p>
          </div>
        </div>

        <p className="absolute bottom-6 right-6 z-10 text-[11px] text-white/30 md:right-9">
          Consumo responsável. Para maiores de 18 anos.
        </p>
      </Slide>

      {/* ═══════════ 02 · A OPORTUNIDADE ═══════════ */}
      <Slide index={1} name="oportunidade">
        <BgPhoto name="comunidade" alt="Corredora do Somma Club no meio do pelotão" />
        <div className="container-somma relative z-10">
          <Kicker>A oportunidade</Kicker>
          <H2>
            A corrida virou <Accent>ponto de encontro</Accent>
          </H2>
          <Lead>Ninguém corre só pelo relógio. Corre pela turma que espera na chegada.</Lead>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card
              n="01"
              title="Todo sábado, sem convite"
              text="Centenas de pessoas no mesmo lugar, por vontade própria. Isso é hábito, não audiência comprada."
            />
            <Card
              n="02"
              title="O treino acaba, a galera fica"
              text="É depois da última passada que a conversa começa. Ali está o espaço mais valioso da manhã."
            />
            <Card
              n="03"
              title="Feito para Michelob Ultra"
              text="Vida ativa de manhã, encontro social depois. A marca não precisa inventar o ritual, ele já existe."
              highlight
            />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 03 · O DESAFIO ═══════════ */}
      <Slide index={2} name="desafio">
        <BgPhoto name="marca" alt="Corredores do Somma Club em ativação de marca" />
        <div className="container-somma relative z-10">
          <Kicker>O desafio da marca</Kicker>
          <H2 className="max-w-4xl">
            Como entrar sem parecer <Accent>só patrocínio</Accent>
          </H2>
          <Lead>Marca que só aparece vira paisagem. Marca que cria experiência vira assunto.</Lead>

          <div className="mt-11 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="a-up rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-7">
              <p className="font-display text-lg font-semibold uppercase tracking-wide text-white/45">
                Patrocínio comum
              </p>
              <ul className="mt-5 space-y-3">
                {["Logo", "Produto", "Presença pontual"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-base text-white/45">
                    <span className="h-px w-5 bg-white/20" />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-7 text-sm italic text-white/30">Aparece no sábado. Some na segunda.</p>
            </div>

            <div className="a-up relative overflow-hidden rounded-3xl border p-5 sm:p-7" style={{ borderColor: `${RED}66`, backgroundColor: `${RED}0F` }}>
              <Corners />
              <p className="font-display text-lg font-semibold uppercase tracking-wide" style={{ color: RED }}>
                Experiência proprietária
              </p>
              <ul className="mt-5 space-y-3">
                {["Narrativa", "Participação", "Conteúdo", "Dados", "Continuidade"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-base font-medium text-white">
                    <RibbonMark />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-7 text-sm italic text-white/60">Vira história que a comunidade conta sozinha.</p>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 04 · A GRANDE IDEIA ═══════════ */}
      <Slide index={3} name="grande-ideia" className="justify-center">
        <BgPhoto name="pelotao" alt="Pelotão do Somma Club" veil="cover" />
        <div className="container-somma relative z-10 text-center">
          <Kicker className="justify-center">A grande ideia</Kicker>
          <div className="a-mask mt-5 overflow-hidden py-1">
            <h2 className="mx-auto max-w-4xl font-display text-[2.2rem] font-bold uppercase leading-[0.92] tracking-tight sm:text-4xl md:text-7xl">
              Michelob Ultra <span style={{ color: RED }}>Social Run</span>
            </h2>
          </div>
          <p className="a-up mx-auto mt-6 max-w-xl text-lg font-light text-white/80 md:text-2xl">
            Começa na corrida. Termina em encontro.
          </p>

          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ["Run", "Movimento que junta gente"],
              ["Connect", "Gente que vira turma"],
              ["Celebrate", "Turma que vira memória"],
            ].map(([v, t], i) => (
              <div key={v} className="a-up relative rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-9 backdrop-blur-sm">
                <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: GOLD }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-4 font-display text-4xl font-bold uppercase tracking-tight md:text-5xl">{v}</p>
                <p className="mt-3 text-sm text-white/60">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* ═══════════ 05 · THE SOCIAL PACE ═══════════ */}
      <Slide index={4} name="social-pace">
        <BgPhoto name="social-pace" alt="Amigos do Somma Club depois do treino" />
        <div className="container-somma relative z-10 grid items-center gap-12 lg:grid-cols-[1fr_auto]">
          <div>
            <Kicker>O conceito criativo</Kicker>
            <H2 className="max-w-xl">
              The <Accent>Social Pace</Accent>
            </H2>
            <Lead className="max-w-lg">Todo corredor tem dois ritmos, e o relógio só marca um deles.</Lead>
            <PaceTicks />
            <blockquote className="a-up mt-8 max-w-md border-l-2 pl-5 text-lg font-light italic leading-snug text-white/85 md:text-xl" style={{ borderColor: GOLD }}>
              “A gente cronometra a corrida. Os melhores momentos ninguém cronometra.”
            </blockquote>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
            <PaceCard run="5:20/km" lifeLabel="Meu pace com os amigos" life="sem pressa" />
            <PaceCard run="6:40/km" lifeLabel="Meu pace para aproveitar" life="o dia inteiro" />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 06 · COMO FUNCIONA ═══════════ */}
      <Slide index={5} name="como-funciona" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Como funciona</Kicker>
          <H2>
            A campanha em <Accent>três momentos</Accent>
          </H2>

          <div className="relative mt-16">
            <div className="a-rail absolute left-0 right-0 top-7 hidden h-px origin-left bg-gradient-to-r from-white/10 via-white/30 to-white/5 md:block" />
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
              {[
                ["01", "Aquecimento digital", "Inscrição, escolha de perfil, card para compartilhar e o desafio no ar."],
                ["02", "Michelob Ultra Social Run", "5 km e 10 km, pelotões por ritmo e experiências no percurso."],
                ["03", "Ultra After Run", "Música, recovery, experimentação responsável e o resto da manhã livre."],
              ].map(([n, t, d], i) => (
                <div key={n} className="a-up relative">
                  <div
                    className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 bg-[#080F26] font-display text-lg font-bold"
                    style={{ borderColor: i === 1 ? RED : `${GOLD}99`, color: i === 1 ? RED : GOLD }}
                  >
                    {n}
                  </div>
                  <h3 className="mt-7 font-display text-2xl font-semibold uppercase leading-tight tracking-tight md:text-3xl">
                    {t}
                  </h3>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 07 · AQUECIMENTO DIGITAL ═══════════ */}
      <Slide index={6} name="aquecimento">
        <BgPhoto name="digital" alt="Corredores do Somma Club em treino" />
        <div className="container-somma relative z-10 grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <Kicker>Momento 01</Kicker>
            <H2 className="max-w-xl">
              Desejo antes da <Accent>largada</Accent>
            </H2>
            <Lead className="max-w-lg">
              Uma pergunta só, duas semanas antes: qual é o seu motivo para correr?
            </Lead>

            <p className="a-up mt-9 text-xs uppercase tracking-[0.25em] text-white/40">
              Na landing page, o participante escolhe um perfil
            </p>
            <div className="a-up mt-4 flex flex-wrap gap-2.5">
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

            <div className="a-up mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-white/40">E sai com um card para postar</p>
              <p className="mt-2 font-display text-xl font-semibold leading-snug md:text-2xl">
                “Meu pace é 6:10. Meu motivo é <span style={{ color: RED }}>encontrar minha galera</span>.”
              </p>
            </div>
          </div>

          <div className="a-up flex justify-center lg:justify-end">
            <MockLanding />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 08 · ULTRA BALANCE CHALLENGE ═══════════ */}
      <Slide index={7} name="challenge">
        <BgPhoto name="desafio" alt="Comunidade Somma Club comemorando" />
        <div className="container-somma relative z-10">
          <Kicker>Ultra Balance Challenge</Kicker>
          <H2 className="max-w-4xl">
            21 dias, <Accent>não um sábado</Accent>
          </H2>
          <Lead>Missões simples de movimento, conexão e diversão para a campanha respirar antes do evento.</Lead>

          <div className="mt-10 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
            <div className="a-up overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              <table className="w-full text-left">
                <tbody>
                  {[
                    ["Movimento", "Três treinos na semana"],
                    ["Conexão", "Correr com alguém novo"],
                    ["Diversão", "Mostrar seu ritual de equilíbrio"],
                  ].map(([p, m]) => (
                    <tr key={p} className="border-b border-white/[0.07] last:border-0">
                      <td className="w-px whitespace-nowrap py-4 pl-4 pr-3 sm:py-5 sm:pl-6 sm:pr-5">
                        <span className="flex items-center gap-2.5 font-display text-base font-semibold uppercase tracking-wide sm:gap-3 sm:text-lg">
                          <RibbonMark gold />
                          {p}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-[13px] text-white/65 sm:py-5 sm:pr-6 sm:text-[15px]">{m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-white/[0.07] px-6 py-5">
                <ChallengeGrid />
              </div>
            </div>

            <div className="a-up relative overflow-hidden rounded-3xl border p-5 sm:p-7" style={{ borderColor: `${RED}59`, backgroundColor: `${RED}0F` }}>
              <Corners />
              <p className="font-display text-lg font-semibold uppercase tracking-wide" style={{ color: RED }}>
                Quem completa, desbloqueia
              </p>
              <ul className="mt-6 space-y-4">
                {["Área exclusiva no evento", "Produtos personalizados", "Experiências especiais", "Acesso ao Ultra After Run"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[15px] text-white/85">
                    <RibbonMark />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 09 · O TREINO ESPECIAL ═══════════ */}
      <Slide index={8} name="social-run">
        <BgPhoto name="treino" alt="Treino do Somma Club no Eixão" />
        <div className="container-somma relative z-10">
          <Kicker>Momento 02</Kicker>
          <H2>
            O <Accent>treino especial</Accent>
          </H2>
          <p className="a-up mt-6 text-base text-white/70 md:text-lg">
            Sábado de manhã. 5 km e 10 km. Pelotão dividido por ritmo e por perfil.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ["Performance Crew", "Quem vai atrás de tempo.", "crew-performance"],
              ["Social Crew", "Quem corre pela conversa.", "crew-social"],
              ["Enjoy Crew", "Quem vai pelo prazer do trajeto.", "crew-enjoy"],
              ["First Run Crew", "Quem está começando agora.", "crew-first"],
            ].map(([n, d, img]) => (
              <div key={n} className="a-up overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image src={`${IMG}/${img}.jpg`} alt={n} fill sizes="(max-width: 1024px) 45vw, 300px" className="a-img object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060B1C] via-[#060B1C]/25 to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl font-semibold uppercase leading-tight tracking-tight">{n}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* ═══════════ 10 · PONTOS DE EXPERIÊNCIA ═══════════ */}
      <Slide index={9} name="percurso">
        <BgPhoto name="percurso" alt="Pelotão do Somma Club na via" />
        <div className="container-somma relative z-10">
          <Kicker>Pontos de experiência</Kicker>
          <H2>
            A corrida vira <Accent>experiência</Accent>
          </H2>

          <div className="relative mt-16">
            <div
              className="a-rail absolute left-0 right-0 top-6 hidden h-0.5 origin-left md:block"
              style={{ background: `linear-gradient(90deg, ${GOLD}00, ${GOLD}, ${RED})` }}
            />
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
              {[
                ["KM 2", "Ultra Pace Point", "O ritmo do corredor registrado em foto ou vídeo personalizado."],
                ["Último KM", "Enjoyment Kilometer", "Música, torcida e captação de conteúdo no trecho final."],
                ["Chegada", "Social Finish Line", "A linha de chegada abre direto no espaço Michelob Ultra."],
              ].map(([km, t, d], i) => {
                const last = i === 2;
                return (
                  <div key={t} className="a-up relative">
                    <div
                      className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-[#060B1C]"
                      style={{ borderColor: last ? RED : GOLD }}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: last ? RED : GOLD }} />
                    </div>
                    <p className="mt-6 font-display text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: last ? RED : GOLD }}>
                      {km}
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold uppercase leading-tight tracking-tight md:text-3xl">
                      {t}
                    </h3>
                    <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">{d}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 11 · ULTRA AFTER RUN ═══════════ */}
      <Slide index={10} name="after-run">
        <BgPhoto name="afterrun" alt="Espaço de convivência depois do treino" />
        <div className="container-somma relative z-10">
          <Kicker>Momento 03</Kicker>
          <H2 className="max-w-4xl">
            O pós-treino é <Accent>da marca</Accent>
          </H2>
          <Lead>Aqui a Michelob Ultra deixa de patrocinar e passa a receber.</Lead>

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
              <div key={t} className="a-up rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 backdrop-blur-sm">
                <span className="font-mono text-[10px] tracking-widest" style={{ color: GOLD }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 text-sm font-medium leading-snug text-white/85">{t}</p>
              </div>
            ))}
          </div>

          <p className="a-up mt-8 text-xs text-white/35">
            Consumo responsável. Experiência para maiores de 18 anos.
          </p>
        </div>
      </Slide>

      {/* ═══════════ 12 · TOTEM DE FOTOS ═══════════ */}
      <Slide index={11} name="totem" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
            {/* Render do totem */}
            <div className="a-up order-1 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${IMG}/totem.png`}
                alt="Totem de fotos Michelob Ultra Club x Somma"
                className="h-[230px] w-auto drop-shadow-[0_35px_60px_rgba(0,0,0,0.55)] sm:h-[330px] lg:h-[470px]"
              />
            </div>

            <div className="order-2">
              <Kicker>Ativação proprietária</Kicker>
              <H2 className="max-w-xl">
                O totem que vira <Accent>conteúdo</Accent>
              </H2>
              <Lead className="max-w-lg">
                Uma cabine de fotos vestida de Michelob Ultra no meio do Ultra After Run. A pessoa entra, posa e sai
                com a arte pronta para postar.
              </Lead>

              <div className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  ["Marca em 360°", "O totem inteiro vestido de Michelob Ultra Club e Somma, do topo à base."],
                  ["Foto na hora", "Tela sensível ao toque, câmera com flash e moldura da campanha já aplicada."],
                  ["Três formatos de saída", "Stories, polaroid e horizontal, cada um pronto para uma rede."],
                  ["Cadastro na fonte", "Para receber a foto a pessoa deixa o contato. Cada clique vira dado."],
                ].map(([t, d]) => (
                  <div key={t} className="a-up rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                    <div className="flex items-center gap-2.5">
                      <RibbonMark />
                      <h3 className="font-display text-base font-semibold uppercase leading-tight tracking-tight sm:text-lg">{t}</h3>
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-white/60 sm:text-[13px]">{d}</p>
                  </div>
                ))}
              </div>

              {/* Saídas de foto */}
              <div className="a-up mt-8">
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">Saídas de foto</p>
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  {[
                    ["totem-saida-1", "Stories", "h-28 sm:h-36"],
                    ["totem-saida-2", "Polaroid", "h-28 sm:h-36"],
                    ["totem-saida-3", "Horizontal", "h-20 sm:h-24"],
                  ].map(([f, label, h]) => (
                    <figure key={f} className="flex flex-col items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${IMG}/${f}.png`}
                        alt={`Saída de foto no formato ${label}`}
                        className={`${h} w-auto rounded-md ring-1 ring-white/15`}
                      />
                      <figcaption className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
                        {label}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 13 · CONTEÚDO ═══════════ */}
      <Slide index={12} name="conteudo">
        <BgPhoto name="conteudo" alt="Registro de conteúdo no treino do Somma Club" />
        <div className="container-somma relative z-10 grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Kicker>Conteúdo</Kicker>
            <H2 className="max-w-lg">
              Pessoas que sabem <Accent>equilibrar</Accent>
            </H2>
            <Lead className="max-w-lg">
              Não é ativação de um dia. É gente real mostrando como equilibra treino, trabalho e amigos.
            </Lead>
            <div className="a-up mt-8 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: RED }}>
                <PlayMark />
              </span>
              <div>
                <p className="font-display text-xl font-semibold uppercase tracking-tight">Filme principal · 60s</p>
                <p className="text-sm text-white/55">O manifesto do Social Pace.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              ["4 vídeos individuais", "20 a 30 segundos"],
              ["Reels do treino", "no calor do momento"],
              ["Bastidores", "making of da experiência"],
              ["Fotos dos participantes", "galeria oficial"],
              ["Depoimentos rápidos", "a voz da comunidade"],
              ["Recap oficial", "o resumo da campanha"],
              ["UGC da comunidade", "conteúdo espontâneo"],
              ["Distribuição Somma", "canais, professores e insiders"],
            ].map(([t, s]) => (
              <div key={t} className="a-up rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <p className="text-sm font-semibold leading-snug text-white/90">{t}</p>
                <p className="mt-0.5 text-xs text-white/40">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* ═══════════ 13 · O QUE O SOMMA ENTREGA ═══════════ */}
      <Slide index={13} name="entrega">
        <BgPhoto name="entrega" alt="Comunidade do Somma Club reunida" />
        <div className="container-somma relative z-10">
          <Kicker>O que o Somma entrega</Kicker>
          <H2>
            Cinco frentes, <Accent>uma execução</Accent>
          </H2>
          <Lead>
            Somos o maior running club de Brasília, com mais de 6 mil membros. É essa estrutura inteira que entra na
            campanha.
          </Lead>

          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              ["Comunidade", "Mais de 6 mil membros e presença toda semana."],
              ["Experiência", "Treino, pelotões, professores, percurso e equipe de apoio."],
              ["Conteúdo", "Produção e distribuição nos canais do Somma, professores e insiders."],
              ["Dados", "Landing page, inscrições, aceite, perfil, presença e relatório final."],
              ["Continuidade", "Pode virar plataforma mensal ou trimestral com a marca."],
            ].map(([t, d]) => (
              <div key={t} className="a-up flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm sm:p-6">
                <div className="a-rail h-0.5 w-8 origin-left" style={{ backgroundColor: GOLD }} />
                <h3 className="mt-4 font-display text-xl font-semibold uppercase tracking-tight sm:mt-5 sm:text-2xl">{t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/60">{d}</p>
              </div>
            ))}
          </div>

          <div className="a-up mt-8 flex flex-wrap items-baseline gap-x-8 gap-y-5 sm:gap-x-12">
            <BigStat count={6000} suffix="+" label="membros na comunidade" />
            <BigStat count={300} label="pessoas todo sábado" />
            <BigStat staticValue="#1" label="maior running club de Brasília" />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 14 · INDICADORES ═══════════ */}
      <Slide index={14} name="indicadores" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Indicadores</Kicker>
          <H2>
            Como vamos <Accent>medir</Accent>
          </H2>

          <div className="mt-10 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
            <div className="a-up overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              <table className="w-full table-fixed text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3.5 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 sm:px-6 sm:py-4 sm:text-xs sm:tracking-[0.25em]">Dimensão</th>
                    <th className="px-4 py-3.5 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 sm:px-6 sm:py-4 sm:text-xs sm:tracking-[0.25em]">Indicadores</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Alcance", "Inscritos, presentes e maiores de 18 impactados"],
                    ["Base", "Novos cadastros com aceite de comunicação"],
                    ["Mídia", "Alcance, visualizações, marcações e menções"],
                    ["Conteúdo", "Peças da produção e dos participantes"],
                    ["Produto", "Produtos experimentados no Ultra After Run"],
                    ["Marca", "Lembrança, intenção de compra e associação com vida ativa"],
                    ["Eficiência", "Custo por participante impactado"],
                  ].map(([dim, ind]) => (
                    <tr key={dim} className="border-b border-white/[0.06] last:border-0">
                      <td className="w-[34%] px-4 py-3 align-top font-display text-sm font-semibold uppercase leading-tight tracking-wide sm:w-[26%] sm:px-6 sm:py-3.5 sm:text-base">
                        {dim}
                      </td>
                      <td className="px-4 py-3 align-top leading-snug text-white/60 sm:px-6 sm:py-3.5">{ind}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="a-up">
              <MockReport />
              <p className="mt-4 text-sm text-white/45">
                Relatório final consolidado entregue pelo Somma em até 15 dias.
              </p>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 15 · FORMATOS ═══════════ */}
      <Slide index={15} name="formatos">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Formatos comerciais</Kicker>
          <H2>
            Três formas de <Accent>executar</Accent>
          </H2>

          <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
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
                "Ultra Balance Challenge de 21 dias",
                "Treino especial",
                "Experiência social",
                "Produção de conteúdo",
              ]}
              recommended
            />
            <FormatCard
              name="Plataforma"
              summary="A marca entra no calendário da comunidade."
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
      <Slide index={16} name="recomendacao">
        <BgPhoto name="recomendacao" alt="Grupo do Somma Club correndo" />
        <div className="container-somma relative z-10">
          <Kicker>Nossa recomendação</Kicker>
          <H2>
            Formato <Accent>Campanha</Accent>
          </H2>
          <Lead>
            Uma jornada só, ligando marca, comunidade, conteúdo e dados do primeiro post ao relatório final.
          </Lead>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ["Antes", "Aquecimento digital", "Landing page, perfis, cards e o desafio de 21 dias."],
              ["Durante", "Michelob Ultra Social Run", "Treino especial, pelotões e pontos de experiência."],
              ["Depois", "Ultra After Run", "Convivência, recap da campanha e relatório de resultados."],
            ].map(([k, t, d], i) => (
              <div
                key={k}
                className="a-up relative overflow-hidden rounded-3xl border p-5 backdrop-blur-sm sm:p-7"
                style={
                  i === 1
                    ? { borderColor: `${RED}59`, backgroundColor: `${RED}12` }
                    : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }
                }
              >
                {i === 1 && <Corners />}
                <p className="font-display text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: i === 1 ? RED : GOLD }}>
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
      <Slide index={17} name="fechamento" className="justify-center">
        <BgPhoto name="fechamento" alt="Comunidade do Somma Club no fim de tarde" veil="cover" />
        <div className="container-somma relative z-10 text-center">
          <Kicker className="justify-center">Fechamento</Kicker>
          <div className="a-mask mt-5 overflow-hidden py-1">
            <h2 className="mx-auto max-w-4xl font-display text-[1.9rem] font-bold uppercase leading-[0.98] tracking-tight sm:text-4xl md:text-6xl">
              Vamos criar o ponto de encontro mais desejado da corrida em <Accent>Brasília</Accent>
            </h2>
          </div>
          <p className="a-up mx-auto mt-8 max-w-xl text-base font-light leading-relaxed text-white/75 md:text-lg">
            A Michelob Ultra entra numa comunidade real, ativa e influente.
            <br />
            Não é sobre correr. É sobre o que acontece depois da linha de chegada.
          </p>

          <div className="a-up mt-12 flex justify-center">
            <Lockup />
          </div>
          <p className="a-up mt-7 font-display text-lg font-semibold uppercase tracking-[0.2em] md:text-2xl">
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
      {/* Recorte 9:16 no celular e 16:9 no desktop. As duas são lazy, então o
          navegador só baixa a que está visível no breakpoint atual. */}
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

/** Fita da Michelob Ultra, usada como marcador de lista. */
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

/** Marcação de ritmo: barras que lembram um gráfico de pace. */
function PaceTicks() {
  const h = [40, 62, 48, 78, 55, 92, 66, 100, 72, 58, 84, 46];
  return (
    <div className="a-up mt-9 flex h-10 items-end gap-1.5" aria-hidden>
      {h.map((v, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full"
          style={{
            height: `${v}%`,
            backgroundColor: i > 7 ? RED : GOLD,
            opacity: i > 7 ? 0.9 : 0.25 + i * 0.06,
          }}
        />
      ))}
    </div>
  );
}

function PlayMark() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden>
      <path d="M0 0.8v14.4L14 8 0 0.8Z" fill="#fff" />
    </svg>
  );
}

/** Lockup Somma × Michelob Ultra. */
function Lockup({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-5 md:gap-7 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${IMG}/logo-somma-white.png`} alt="Somma Club" className="h-6 w-auto md:h-8" />
      <span className="text-xl font-extralight md:text-2xl" style={{ color: GOLD }}>
        ×
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${IMG}/logo-michelob-white.png`} alt="Michelob Ultra" className="h-7 w-auto md:h-9" />
    </div>
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
      <h2 className={`font-display text-[1.9rem] font-bold uppercase leading-[0.95] tracking-tight sm:text-4xl md:text-6xl ${className}`}>
        {children}
      </h2>
    </div>
  );
}

function Lead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`a-up mt-5 max-w-2xl text-[15px] font-light leading-relaxed text-white/70 sm:mt-6 md:text-lg ${className}`}>
      {children}
    </p>
  );
}

function Accent({ children }: { children: React.ReactNode }) {
  return <span style={{ color: RED }}>{children}</span>;
}

/* ── Blocos ────────────────────────────────────────────────────────────── */

function Card({ n, title, text, highlight }: { n: string; title: string; text: string; highlight?: boolean }) {
  return (
    <div
      className="a-up relative flex flex-col overflow-hidden rounded-3xl border p-5 backdrop-blur-sm sm:p-7"
      style={
        highlight
          ? { borderColor: `${RED}59`, backgroundColor: `${RED}12` }
          : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }
      }
    >
      {highlight && <Corners />}
      <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: highlight ? RED : GOLD }}>
        {n}
      </span>
      <h3 className="mt-4 font-display text-xl font-semibold uppercase leading-tight tracking-tight sm:mt-5 sm:text-2xl">{title}</h3>
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
    <div>
      <p className="font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl md:text-6xl">
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
      className={`a-up relative flex flex-col overflow-hidden rounded-3xl border p-5 backdrop-blur-sm sm:p-7 ${recommended ? "lg:-my-3 lg:p-8" : ""}`}
      style={
        recommended
          ? { borderColor: RED, backgroundColor: `${RED}14` }
          : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }
      }
    >
      {recommended && (
        <span
          className="absolute right-0 top-0 flex items-center gap-1.5 rounded-bl-xl px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white"
          style={{ backgroundColor: RED }}
        >
          Recomendado
        </span>
      )}
      <p className="font-display text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: recommended ? RED : GOLD }}>
        Formato
      </p>
      <h3 className="mt-2 font-display text-4xl font-bold uppercase leading-none tracking-tight">{name}</h3>
      <p className="mt-3 text-sm text-white/55">{summary}</p>
      <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-6">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2.5 text-sm text-white/80">
            <span className="mt-1.5">
              <RibbonMark gold={!recommended} />
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Mockups ───────────────────────────────────────────────────────────── */

function PaceCard({ run, life, lifeLabel }: { run: string; life: string; lifeLabel: string }) {
  return (
    <div
      className="a-up w-full max-w-[290px] overflow-hidden rounded-2xl border shadow-2xl"
      style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: NAVY }}
    >
      <div className="px-6 pb-6 pt-7">
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">Meu pace na corrida</p>
        <p className="mt-1 font-display text-4xl font-bold leading-none tracking-tight text-white">{run}</p>
        <div className="my-5 h-px w-full" style={{ backgroundColor: `${GOLD}4D` }} />
        <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: GOLD }}>
          {lifeLabel}
        </p>
        <p className="mt-1 font-display text-4xl font-bold leading-none tracking-tight text-white">{life}</p>
      </div>
      <div className="flex items-center justify-between px-6 py-3" style={{ backgroundColor: RED }}>
        <span className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-white">Social Run</span>
        <RibbonMark gold />
      </div>
    </div>
  );
}

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
        {([
          ["Performance", false],
          ["Comunidade", true],
          ["Diversão", false],
          ["Equilíbrio", false],
        ] as [string, boolean][]).map(([label, on]) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-lg border px-2.5 py-2"
            style={
              on
                ? { borderColor: RED, backgroundColor: `${RED}26` }
                : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }
            }
          >
            <span className={`text-[9px] font-semibold ${on ? "text-white" : "text-white/55"}`}>{label}</span>
            <span
              className="h-2.5 w-2.5 rounded-full border"
              style={on ? { backgroundColor: RED, borderColor: RED } : { borderColor: "rgba(255,255,255,0.25)" }}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg py-2 text-center" style={{ backgroundColor: RED }}>
        <span className="font-display text-[10px] font-bold uppercase tracking-widest text-white">Garantir minha vaga</span>
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

function ChallengeGrid() {
  const done = 13;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-[0.25em] text-white/40">21 dias de desafio</p>
        <p className="font-display text-sm font-semibold" style={{ color: GOLD }}>
          {done}/21
        </p>
      </div>
      <div className="mt-3 grid grid-cols-[repeat(21,minmax(0,1fr))] gap-1">
        {Array.from({ length: 21 }).map((_, i) => (
          <span
            key={i}
            data-grid-day
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

function MockReport() {
  const bars = [42, 68, 55, 88, 74, 96];
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
        <span className="flex items-center gap-2.5 font-display text-sm font-semibold uppercase tracking-wide">
          <RibbonMark gold />
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
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">Engajamento por etapa</p>
        <div className="mt-3 flex h-20 items-end gap-1.5">
          {bars.map((h, i) => (
            <span
              key={i}
              data-bar
              className="flex-1 rounded-t-[3px]"
              style={{
                height: `${h}%`,
                backgroundColor: i === bars.length - 1 ? RED : GOLD,
                opacity: i === bars.length - 1 ? 1 : 0.28 + i * 0.09,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
