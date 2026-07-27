"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CATEGORIAS,
  CLAUSULA_RESPONSABILIDADE,
  COMPARATIVO,
  CONDICOES_META,
  FINANCE_CTA,
  FORNECEDORES,
  INVESTIMENTO,
  MICHELOB_RESPONSIBILITIES,
  NAO_INCLUSO,
  NAO_INCLUSO_NOTA,
  PAGAMENTO,
  SOMMA_FRASE_FINAL,
  SOMMA_FRENTES,
  SOMMA_RESUMO,
  type CategoriaId,
  type Responsabilidade,
  type SommaFrente,
} from "./_financial-data";
import {
  MENSAGEM_CENTRAL,
  FRASE_IMPACTO,
  MENSAGEM_FINAL,
  CREWS,
  CREW_COMO_FUNCIONA,
  DESAFIO_EXEMPLO,
  DESAFIOS_TIPOS,
  VALIDACAO_METODOS,
  VALIDACAO_NOTA,
  REGRAS,
  SABADOS,
  STAND_ITENS,
  RECOMPENSAS,
  RECOMPENSAS_NOTA,
  PULSEIRA_FLUXO,
  RANKING_CATEGORIAS,
  RANKING_DESTAQUE,
  CLASSIFICADOS,
  TIMELINE_CAMPANHA,
  GRAND_FINALE,
  GRAND_FINALE_NOTA,
  ACESSO,
  ACESSO_CRITERIOS,
  CONTEUDO_PLANO,
  CONTEUDO_NOTA,
  PAPEL_SOMMA,
  PAPEL_MICHELOB,
  EVOLUCAO,
  type Crew,
} from "./_crew-data";

const IMG = "/michelob";

/** Paleta Michelob Ultra, amostrada da própria logo. */
const NAVY = "#283280";
const RED = "#D22030";
const GOLD = "#C6A664";
/** Laranja Somma — só em acentos pontuais, como na paleta do Ultra Balance. */
const ORANGE = "#FF2C03";

const SLIDES = [
  "capa",
  "oportunidade",
  "desafio",
  "grande-ideia",
  "social-pace",
  "como-funciona",
  "aquecimento",
  "challenge",
  // ── Capítulo: a plataforma das Crews ──
  "nova-visao",
  "crews",
  "crews-funciona",
  "desafios-semanais",
  "validacao",
  "regras",
  "ranking",
  "recompensas",
  "pulseira",
  // ── Experiência presencial ──
  "social-run",
  "percurso",
  "after-run",
  "totem",
  "sabados",
  "stand",
  "grand-finale",
  "acesso",
  // ── Conteúdo, dados e fechamento estratégico ──
  "conteudo",
  "conteudo-premium",
  "entrega",
  "timeline",
  "papeis",
  "o-que-mudou",
  "indicadores",
  "formatos",
  "recomendacao",
  "fechamento",
] as const;

/**
 * Sub-slides do capítulo Proposta Financeira. Só entram quando o deck é
 * renderizado com `financial`, na rota /ppt-michelob-proposta. Ficam entre a
 * recomendação e o fechamento, empurrando o índice do fechamento para frente.
 */
const FINANCE_SLIDES = [
  "proposta-financeira",
  "somma-vende",
  "obrigacoes-michelob",
  "condicoes-comerciais",
  "encerramento-financeiro",
] as const;

export function MichelobDeck({ financial = false }: { financial?: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Ordem única de todos os slides. O capítulo financeiro (quando `financial`)
  // é inserido logo antes do fechamento. Todos os índices são derivados desta
  // ordem por nome, então inserir slides no meio nunca desalinha a numeração.
  const order = useMemo(() => {
    const base = [...SLIDES] as string[];
    if (financial) base.splice(base.indexOf("fechamento"), 0, ...FINANCE_SLIDES);
    return base;
  }, [financial]);
  const idx = useCallback((name: string) => order.indexOf(name), [order]);
  const total = order.length;

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

  const goTo = useCallback(
    (i: number) => {
      const el = scroller.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(total - 1, i));
      el.querySelector<HTMLElement>(`[data-index="${clamped}"]`)?.scrollIntoView({ behavior: "smooth" });
    },
    [total],
  );

  /** Navega direto para um slide pelo nome, usado pelos botões da seção financeira. */
  const goToName = useCallback((name: string) => {
    scroller.current
      ?.querySelector<HTMLElement>(`[data-slide="${name}"]`)
      ?.scrollIntoView({ behavior: "smooth" });
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
        goTo(total - 1);
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
        {Array.from({ length: total }).map((_, i) => (
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
        <span className="text-white/30">{total}</span>
      </div>

      {/* ═══════════ 01 · CAPA ═══════════ */}
      <Slide index={idx("capa")} name="capa" className="justify-center">
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
      <Slide index={idx("oportunidade")} name="oportunidade">
        <BgPhoto name="comunidade" alt="Corredora do Somma Club no meio do pelotão" />
        <div className="container-somma relative z-10">
          <Kicker>A oportunidade</Kicker>
          <H2>
            A corrida virou <Accent>ponto de encontro</Accent>
          </H2>
          <Lead>Ninguém corre só pelo relógio. Corre pela turma que espera na chegada.</Lead>

          <p className="a-up mt-8 flex items-center gap-2 text-xs text-white/35">
            <span className="inline-block h-1 w-1 rounded-full" style={{ backgroundColor: GOLD }} />
            Toque nos cartões para abrir
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card
              n="01"
              title="Todo sábado, sem convite"
              text="Centenas de pessoas no mesmo lugar, por vontade própria. Isso é hábito, não audiência comprada."
              more="O ponto de encontro é o Estacionamento 10 do Parque da Cidade, às 7h. Gratuito e aberto a todos os níveis, do primeiro quilômetro à maratona."
            />
            <Card
              n="02"
              title="O treino acaba, a galera fica"
              text="É depois da última passada que a conversa começa. Ali está o espaço mais valioso da manhã."
              more="Café, alongamento, foto e conversa. É o intervalo em que a marca consegue existir sem interromper ninguém, porque as pessoas já escolheram ficar."
            />
            <Card
              n="03"
              title="Feito para Michelob Ultra"
              text="Vida ativa de manhã, encontro social depois. A marca não precisa inventar o ritual, ele já existe."
              more="Superior light beer, 2,6 g de carboidrato e 95 calorias. O produto já conversa com quem treina e quer manter o equilíbrio, sem precisar reposicionar nada."
              highlight
            />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 03 · O DESAFIO ═══════════ */}
      <Slide index={idx("desafio")} name="desafio">
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
      <Slide index={idx("grande-ideia")} name="grande-ideia" className="justify-center">
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
      <Slide index={idx("social-pace")} name="social-pace">
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
      <Slide index={idx("como-funciona")} name="como-funciona" className="bg-[#080F26]">
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
      <Slide index={idx("aquecimento")} name="aquecimento">
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
      <Slide index={idx("challenge")} name="challenge">
        <BgPhoto name="desafio" alt="Comunidade Somma Club comemorando" />
        <div className="container-somma relative z-10">
          <Kicker>Ultra Balance Challenge</Kicker>
          <H2 className="max-w-4xl">
            21 dias, <Accent>não um sábado</Accent>
          </H2>
          <Lead>Missões simples de movimento, conexão e diversão para a campanha respirar antes do evento.</Lead>

          <a
            href="https://sommaclub.com.br/ultra-balance-challenge"
            target="_blank"
            rel="noopener noreferrer"
            className="a-up group mt-7 inline-flex items-center gap-3 rounded-full border px-5 py-3 transition-colors hover:bg-white/[0.06] sm:px-6"
            style={{ borderColor: `${GOLD}66` }}
          >
            <RibbonMark gold />
            <span className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-white sm:text-base">
              Ver a plataforma completa
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            >
              <path d="M3 8h9M8.5 4l4 4-4 4" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>

          <div className="mt-9 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
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

      {/* ═══════════ CAPÍTULO · A PLATAFORMA DAS CREWS ═══════════ */}

      {/* ── A nova visão ── */}
      <Slide index={idx("nova-visao")} name="nova-visao" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>A nova visão</Kicker>
          <H2 className="max-w-4xl">
            A campanha virou <Accent>plataforma</Accent>
          </H2>
          <Lead className="max-w-3xl">{MENSAGEM_CENTRAL}</Lead>
          <div className="a-up mt-8 flex flex-wrap gap-3">
            {[
              ["21 dias", "de desafio digital"],
              ["4 Crews", "lideradas por pessoas"],
              ["1 Grand Finale", "de corrida, música e festa"],
            ].map(([v, l]) => (
              <div key={v} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                <p className="font-display text-2xl font-bold uppercase leading-none tracking-tight" style={{ color: GOLD }}>
                  {v}
                </p>
                <p className="mt-1.5 text-xs text-white/50">{l}</p>
              </div>
            ))}
          </div>
          <Destaque>{FRASE_IMPACTO}</Destaque>
        </div>
      </Slide>

      {/* ── A plataforma das Crews ── */}
      <Slide index={idx("crews")} name="crews">
        <BgPhoto name="pelotao" alt="Pelotão do Somma Club" />
        <div className="container-somma relative z-10">
          <Kicker>A plataforma das Crews</Kicker>
          <H2 className="max-w-4xl">
            As Crews são o <Accent>motor</Accent> da campanha
          </H2>
          <Lead className="max-w-3xl">
            Em vez de escolher só um perfil, o participante escolhe quem vai liderar sua jornada pelos próximos 21 dias.
            Cada Crew tem uma dupla de líderes, personalidade própria, vídeo de apresentação e grupo de WhatsApp.
          </Lead>
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {CREWS.map((c) => (
              <CrewSlotCard key={c.id} crew={c} />
            ))}
          </div>
          <Nota>
            Vagas por Crew são configuráveis (ex.: 100, 150 ou 200), conforme a escala aprovada. Contadores ilustrativos.
          </Nota>
        </div>
      </Slide>

      {/* ── Como as Crews funcionam ── */}
      <Slide index={idx("crews-funciona")} name="crews-funciona" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Como as Crews funcionam</Kicker>
          <H2>
            Um time que se <Accent>organiza sozinho</Accent>
          </H2>
          <div className="mt-10">
            <DataTable
              head={["Elemento", "Como funciona", "Por que importa"]}
              colW={["22%", "44%", "34%"]}
              rows={CREW_COMO_FUNCIONA.map((r) => ({ cells: [r.elemento, r.como, r.porque] }))}
            />
          </div>
        </div>
      </Slide>

      {/* ── Desafios semanais ── */}
      <Slide index={idx("desafios-semanais")} name="desafios-semanais">
        <BgPhoto name="treino" alt="Treino do Somma Club" />
        <div className="container-somma relative z-10">
          <Kicker>Desafios semanais das Crews</Kicker>
          <H2 className="max-w-4xl">
            Somma define. A Crew <Accent>cumpre do jeito dela</Accent>
          </H2>
          <Lead className="max-w-3xl">
            Toda semana, Somma e professores definem um desafio oficial. Os líderes recebem o briefing e mobilizam a
            Crew, que decide quando, onde e como cumprir, dentro das regras.
          </Lead>
          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <div className="a-up relative overflow-hidden rounded-2xl border p-5" style={{ borderColor: `${RED}59`, backgroundColor: `${RED}0F` }}>
              <Corners />
              <p className="font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: RED }}>
                Desafio da semana
              </p>
              <h3 className="mt-2 font-display text-2xl font-bold uppercase leading-tight tracking-tight">{DESAFIO_EXEMPLO.titulo}</h3>
              <p className="mt-2 text-sm text-white/60">{DESAFIO_EXEMPLO.meta}</p>
              <ul className="mt-4 space-y-2">
                {DESAFIO_EXEMPLO.regras.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-[13px] text-white/80">
                    <span className="mt-0.5">
                      <RibbonMark />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <DataTable
              head={["Tipo", "Exemplo", "Validação", "Pontuação"]}
              colW={["20%", "30%", "24%", "26%"]}
              rows={DESAFIOS_TIPOS.map((d) => ({ cells: [d.tipo, d.exemplo, d.validacao, d.pontuacao] }))}
            />
          </div>
        </div>
      </Slide>

      {/* ── Validação dos desafios ── */}
      <Slide index={idx("validacao")} name="validacao" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Validação dos desafios</Kicker>
          <H2>
            Comprovação <Accent>flexível e segura</Accent>
          </H2>
          <Lead className="max-w-3xl">A validação não depende de um só formato. O sistema aceita tipos diferentes de comprovação.</Lead>
          <div className="mt-8">
            <DataTable
              head={["Método", "Quando usar", "Como valida"]}
              colW={["26%", "40%", "34%"]}
              rows={VALIDACAO_METODOS.map((v) => ({ cells: [v.metodo, v.quando, v.como] }))}
            />
          </div>
          <div className="a-up mt-6 rounded-2xl border-l-2 bg-white/[0.03] p-4" style={{ borderColor: GOLD }}>
            <p className="text-[13px] leading-relaxed text-white/70">{VALIDACAO_NOTA}</p>
          </div>
        </div>
      </Slide>

      {/* ── Regras de entrada, vagas e transferência ── */}
      <Slide index={idx("regras")} name="regras">
        <BgPhoto name="comunidade" alt="Comunidade do Somma Club" />
        <div className="container-somma relative z-10">
          <Kicker>Regras de entrada, vagas e transferência</Kicker>
          <H2 className="max-w-3xl">
            Simples de <Accent>entender</Accent>
          </H2>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            <DataTable
              head={["Regra", "Como funciona"]}
              colW={["34%", "66%"]}
              rows={REGRAS.map((r) => ({ cells: [r.regra, r.como] }))}
            />
            <div className="flex justify-center lg:justify-end">
              <TransferMock />
            </div>
          </div>
        </div>
      </Slide>

      {/* ── Ranking e classificação ── */}
      <Slide index={idx("ranking")} name="ranking" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Ranking e classificação</Kicker>
          <H2>
            Não vence só quem <Accent>corre mais rápido</Accent>
          </H2>
          <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start">
            <DataTable
              head={["Categoria", "O que mede"]}
              colW={["44%", "56%"]}
              rows={RANKING_CATEGORIAS.map((r) => ({ cells: [r.categoria, r.mede] }))}
            />
            <div>
              <p className="a-up font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Classificados para o Grand Finale</p>
              <div className="mt-3">
                <DataTable
                  head={["Critério", "Uso no Grand Finale"]}
                  colW={["42%", "58%"]}
                  rows={CLASSIFICADOS.map((r) => ({ cells: [r.criterio, r.uso] }))}
                />
              </div>
            </div>
          </div>
          <Destaque>{RANKING_DESTAQUE}</Destaque>
        </div>
      </Slide>

      {/* ── Sistema de recompensas ── */}
      <Slide index={idx("recompensas")} name="recompensas">
        <BgPhoto name="desafio" alt="Comunidade do Somma comemorando" />
        <div className="container-somma relative z-10">
          <Kicker>Sistema de recompensas</Kicker>
          <H2 className="max-w-3xl">
            O brinde prende à <Accent>jornada</Accent>
          </H2>
          <Lead className="max-w-3xl">
            Cada benefício está condicionado à participação real. A recompensa é pelo progresso na campanha, nunca pelo
            consumo.
          </Lead>
          <div className="mt-8">
            <DataTable
              head={["Momento", "Critério", "Recompensa sugerida"]}
              colW={["26%", "34%", "40%"]}
              rows={RECOMPENSAS.map((r) => ({ cells: [r.momento, r.criterio, r.recompensa] }))}
            />
          </div>
          <Nota>{RECOMPENSAS_NOTA}</Nota>
        </div>
      </Slide>

      {/* ── Pulseira com QR Code ── */}
      <Slide index={idx("pulseira")} name="pulseira" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Pulseira com QR Code</Kicker>
          <H2 className="max-w-3xl">
            O símbolo físico da <Accent>jornada</Accent>
          </H2>
          <Lead className="max-w-3xl">
            A pulseira identifica o participante, conecta com o sistema e libera check-in nos desafios e resgate de
            benefícios.
          </Lead>
          <div className="mt-9">
            <FlowSteps steps={PULSEIRA_FLUXO} />
          </div>
        </div>
      </Slide>

      {/* ═══════════ 09 · O TREINO ESPECIAL ═══════════ */}
      <Slide index={idx("social-run")} name="social-run">
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
              [
                "Performance Crew",
                "Quem vai atrás de tempo.",
                "crew-performance",
                "Pace abaixo de 5:00/km, pelotão fechado e professor puxando o ritmo. É onde fica quem está em ciclo de prova.",
              ],
              [
                "Social Crew",
                "Quem corre pela conversa.",
                "crew-social",
                "Pace entre 6:00 e 7:00/km, com o pelotão andando junto e ninguém ficando para trás. É onde corre a maior parte da comunidade.",
              ],
              [
                "Enjoy Crew",
                "Quem vai pelo prazer do trajeto.",
                "crew-enjoy",
                "Sem cronômetro. Tem pausa para foto, para o mirante e para o ipê florido. O caminho importa mais que o tempo.",
              ],
              [
                "First Run Crew",
                "Quem está começando agora.",
                "crew-first",
                "Para quem nunca fechou 5 km. Alterna corrida e caminhada, com professor dedicado e ninguém correndo sozinho.",
              ],
            ].map(([n, d, img, more]) => (
              <CrewCard key={n} name={n} text={d} img={img} more={more} />
            ))}
          </div>
        </div>
      </Slide>

      {/* ═══════════ 10 · PONTOS DE EXPERIÊNCIA ═══════════ */}
      <Slide index={idx("percurso")} name="percurso">
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
                [
                  "KM 2",
                  "Ultra Pace Point",
                  "O ritmo do corredor registrado em foto ou vídeo personalizado.",
                  "Uma câmera fixa no km 2 capta cada corredor com o pace na tela. O material sai no mesmo dia, já com a marca dentro do enquadramento.",
                ],
                [
                  "Último KM",
                  "Enjoyment Kilometer",
                  "Música, torcida e captação de conteúdo no trecho final.",
                  "Caixa de som, torcida da equipe Somma e placas com mensagens escritas pela própria comunidade. É o trecho mais fotografado do percurso.",
                ],
                [
                  "Chegada",
                  "Social Finish Line",
                  "A linha de chegada abre direto no espaço Michelob Ultra.",
                  "Sem funil de saída. Quem cruza a chegada já entra na área de convivência, com o copo na mão e a música tocando.",
                ],
              ].map(([km, t, d, more], i) => (
                <PointCard key={t} km={km} title={t} text={d} more={more} last={i === 2} />
              ))}
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 11 · ULTRA AFTER RUN ═══════════ */}
      <Slide index={idx("after-run")} name="after-run">
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
      <Slide index={idx("totem")} name="totem" className="bg-[#080F26]">
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
                  [
                    "Marca em 360°",
                    "O totem inteiro vestido de Michelob Ultra Club e Somma, do topo à base.",
                    "Laterais, testeira e base adesivadas. De qualquer ângulo da área de convivência o totem lê como peça da marca.",
                  ],
                  [
                    "Foto na hora",
                    "Tela sensível ao toque, câmera com flash e moldura da campanha já aplicada.",
                    "Câmera com dois flashes de LED e entrega em poucos segundos, então a fila anda e ninguém desiste no meio.",
                  ],
                  [
                    "Três formatos de saída",
                    "Stories, polaroid e horizontal, cada um pronto para uma rede.",
                    "9:16 para stories, polaroid para levar impresso e horizontal para feed e WhatsApp.",
                  ],
                  [
                    "Cadastro na fonte",
                    "Para receber a foto a pessoa deixa o contato. Cada clique vira dado.",
                    "Nome, e-mail, telefone e aceite de comunicação, com confirmação de maioridade antes de liberar a foto.",
                  ],
                ].map(([t, d, more]) => (
                  <TotemCard key={t} title={t} text={d} more={more} />
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

      {/* ═══════════ CAPÍTULO · A EXPERIÊNCIA PRESENCIAL ═══════════ */}

      {/* ── Sábados como rituais ── */}
      <Slide index={idx("sabados")} name="sabados">
        <BgPhoto name="treino" alt="Treino de sábado do Somma Club" />
        <div className="container-somma relative z-10">
          <Kicker>Sábados como rituais da campanha</Kicker>
          <H2 className="max-w-4xl">
            O sábado do Somma vira <Accent>temporada</Accent>
          </H2>
          <Lead className="max-w-3xl">
            O encontro de sábado já é um ativo recorrente. A campanha usa esses rituais para dar vida aos 21 dias, com
            ativação, brindes, ranking e conteúdo.
          </Lead>
          <div className="mt-8">
            <DataTable
              head={["Sábado", "Papel na campanha", "O que acontece"]}
              colW={["22%", "26%", "52%"]}
              rows={SABADOS.map((s) => ({ cells: [s.sabado, s.papel, s.acontece], tone: s.tone as Tone }))}
            />
          </div>
          <Destaque>Cada sábado tem uma função clara: abertura, confronto, auge e encerramento.</Destaque>
        </div>
      </Slide>

      {/* ── Stand Michelob ── */}
      <Slide index={idx("stand")} name="stand" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10 grid items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
          <div>
            <Kicker>Stand Michelob nos sábados</Kicker>
            <H2 className="max-w-xl">
              O ponto físico da <Accent>campanha</Accent>
            </H2>
            <Lead className="max-w-lg">Durante os encontros, o stand concentra a operação da campanha.</Lead>
            <ul className="mt-6 grid grid-cols-2 gap-2.5">
              {STAND_ITENS.map((it) => (
                <li key={it} className="a-up flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[13px] text-white/80">
                  <RibbonMark gold />
                  {it}
                </li>
              ))}
            </ul>
          </div>
          <StandMock />
        </div>
      </Slide>

      {/* ── Grand Finale em um sábado ── */}
      <Slide index={idx("grand-finale")} name="grand-finale">
        <BgPhoto name="fechamento" alt="Comunidade do Somma no fim de tarde" />
        <div className="container-somma relative z-10">
          <Kicker>Grand Finale em um sábado</Kicker>
          <H2 className="max-w-4xl">
            O desafio termina na sexta. Sábado é <Accent>celebração</Accent>
          </H2>
          <div className="mt-8">
            <DataTable
              head={["Horário", "Momento", "Experiência"]}
              colW={["18%", "30%", "52%"]}
              rows={GRAND_FINALE.map((g) => ({ cells: [g.horario, g.momento, g.experiencia], tone: g.tone as Tone }))}
            />
          </div>
          <Nota>{GRAND_FINALE_NOTA}</Nota>
        </div>
      </Slide>

      {/* ── Modelo de acesso ── */}
      <Slide index={idx("acesso")} name="acesso" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Modelo de acesso</Kicker>
          <H2 className="max-w-3xl">
            Aberto para a <Accent>cidade</Accent>, com benefício para quem viveu os 21 dias
          </H2>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
            <DataTable
              head={["Público", "Acesso"]}
              colW={["46%", "54%"]}
              rows={ACESSO.map((a) => ({ cells: [a.publico, a.acesso], tone: "destaque" in a && a.destaque ? ("red" as Tone) : undefined }))}
            />
            <div className="a-up rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                Critérios para entrada gratuita
              </p>
              <ul className="mt-4 space-y-2.5">
                {ACESSO_CRITERIOS.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-[13px] text-white/80">
                    <span className="mt-0.5">
                      <RibbonMark gold />
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Slide>

      {/* ═══════════ 13 · CONTEÚDO ═══════════ */}
      <Slide index={idx("conteudo")} name="conteudo">
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

      {/* ── Conteúdo audiovisual ── */}
      <Slide index={idx("conteudo-premium")} name="conteudo-premium" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>Conteúdo audiovisual</Kicker>
          <H2 className="max-w-3xl">
            Momentos que pedem <Accent>captação premium</Accent>
          </H2>
          <Lead className="max-w-3xl">
            Alguns momentos exigem produção premium, porque a Michelob pode usar o material em canais oficiais.
          </Lead>
          <div className="mt-8">
            <DataTable
              head={["Momento", "Tipo de captação", "Objetivo"]}
              colW={["26%", "34%", "40%"]}
              rows={CONTEUDO_PLANO.map((c) => ({ cells: [c.momento, c.tipo, c.objetivo], tone: c.premium ? ("red" as Tone) : undefined }))}
            />
          </div>
          <Nota>{CONTEUDO_NOTA}</Nota>
        </div>
      </Slide>

      {/* ═══════════ 13 · O QUE O SOMMA ENTREGA ═══════════ */}
      <Slide index={idx("entrega")} name="entrega">
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
              [
                "Comunidade",
                "Mais de 6 mil membros e presença toda semana.",
                "Base própria com nome, e-mail, telefone e CPF, ativável para comunicação segmentada dentro da LGPD.",
              ],
              [
                "Experiência",
                "Treino, pelotões, professores, percurso e equipe de apoio.",
                "Professores, staff de percurso, sinalização, hidratação e apoio. A operação de treino já roda toda semana, não precisa ser inventada.",
              ],
              [
                "Conteúdo",
                "Produção e distribuição nos canais do Somma, professores e insiders.",
                "Instagram e TikTok do Somma, mais os canais dos professores e do grupo de insiders, que multiplicam o alcance orgânico.",
              ],
              [
                "Dados",
                "Landing page, inscrições, aceite, perfil, presença e relatório final.",
                "Landing page própria, controle de inscrição e presença, pesquisa pós-evento e relatório consolidado da campanha.",
              ],
              [
                "Continuidade",
                "Pode virar plataforma mensal ou trimestral com a marca.",
                "A Social Run pode virar edição fixa no calendário da comunidade, com a marca presente o ano todo em vez de um sábado.",
              ],
            ].map(([t, d, more]) => (
              <FrenteCard key={t} title={t} text={d} more={more} />
            ))}
          </div>

          <div className="a-up mt-8 flex flex-wrap items-baseline gap-x-8 gap-y-5 sm:gap-x-12">
            <BigStat count={6000} suffix="+" label="membros na comunidade" />
            <BigStat count={300} label="pessoas todo sábado" />
            <BigStat staticValue="#1" label="maior running club de Brasília" />
          </div>
        </div>
      </Slide>

      {/* ── Timeline da campanha ── */}
      <Slide index={idx("timeline")} name="timeline">
        <BgPhoto name="percurso" alt="Pelotão do Somma na via" />
        <div className="container-somma relative z-10">
          <Kicker>Timeline da campanha</Kicker>
          <H2 className="max-w-3xl">
            Da <Accent>Semana 0</Accent> ao Grand Finale
          </H2>
          <div className="mt-8">
            <DataTable
              head={["Período", "Fase", "Objetivo", "Ativações"]}
              colW={["14%", "20%", "24%", "42%"]}
              rows={TIMELINE_CAMPANHA.map((t) => ({
                cells: [t.periodo, t.fase, t.objetivo, t.ativacoes],
                tone: "marco" in t && t.marco ? ("red" as Tone) : undefined,
              }))}
            />
          </div>
          <Nota>Estrutura em semanas para reuso. Se o projeto tiver datas oficiais, elas entram no lugar.</Nota>
        </div>
      </Slide>

      {/* ── O papel de cada parte ── */}
      <Slide index={idx("papeis")} name="papeis" className="bg-[#080F26]">
        <Grid />
        <div className="container-somma relative z-10">
          <Kicker>O papel de cada parte</Kicker>
          <H2 className="max-w-3xl">Quem entrega o quê</H2>
          <Lead className="max-w-3xl">
            Resumo das frentes. A divisão detalhada, com responsáveis por categoria, integra a proposta comercial.
          </Lead>
          <div className="mt-8">
            <RolesColumns somma={PAPEL_SOMMA} michelob={PAPEL_MICHELOB} />
          </div>
        </div>
      </Slide>

      {/* ── O que mudou na proposta ── */}
      <Slide index={idx("o-que-mudou")} name="o-que-mudou">
        <BgPhoto name="recomendacao" alt="Grupo do Somma correndo" />
        <div className="container-somma relative z-10">
          <Kicker>O que mudou na proposta</Kicker>
          <H2 className="max-w-3xl">
            Antes e <Accent>agora</Accent>
          </H2>
          <div className="mt-8">
            <BeforeAfter rows={EVOLUCAO} />
          </div>
          <Lead className="max-w-3xl">{MENSAGEM_FINAL}</Lead>
        </div>
      </Slide>

      {/* ═══════════ 14 · INDICADORES ═══════════ */}
      <Slide index={idx("indicadores")} name="indicadores" className="bg-[#080F26]">
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
      <Slide index={idx("formatos")} name="formatos">
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
      <Slide index={idx("recomendacao")} name="recomendacao">
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
              [
                "Antes",
                "Aquecimento digital",
                "Landing page, perfis, cards e o desafio de 21 dias.",
                "Duas semanas de aquecimento, com meta de inscrição e captação de base antes de qualquer custo de operação no dia.",
              ],
              [
                "Durante",
                "Michelob Ultra Social Run",
                "Treino especial, pelotões e pontos de experiência.",
                "Sábado de manhã, com pelotões por ritmo, os três pontos de experiência no percurso e o totem na área de convivência.",
              ],
              [
                "Depois",
                "Ultra After Run",
                "Convivência, recap da campanha e relatório de resultados.",
                "Recap em vídeo, galeria liberada para os participantes e relatório consolidado em até 15 dias.",
              ],
            ].map(([k, t, d, more], i) => (
              <FaseCard key={k} fase={k} title={t} text={d} more={more} highlight={i === 1} />
            ))}
          </div>
        </div>
      </Slide>

      {/* ═══════════ CAPÍTULO · PROPOSTA FINANCEIRA (só na rota -proposta) ═══════════ */}
      {financial && (
        <>
          <FinanceInvestimento index={idx("proposta-financeira")} />
          <FinanceVende index={idx("somma-vende")} />
          <FinanceObrigacoes index={idx("obrigacoes-michelob")} />
          <FinanceCondicoes index={idx("condicoes-comerciais")} />
          <FinanceCTA index={idx("encerramento-financeiro")} goToName={goToName} />
        </>
      )}

      {/* ═══════════ FECHAMENTO ═══════════ */}
      <Slide index={idx("fechamento")} name="fechamento" className="justify-center">
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

/* ── Interação ─────────────────────────────────────────────────────────── */

/** Sinal de "abre": vira × quando aberto. */
function PlusMark({ open, color }: { open: boolean; color: string }) {
  return (
    <span
      className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-300"
      style={{ borderColor: open ? color : "rgba(255,255,255,0.18)" }}
      aria-hidden
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 11 11"
        className="transition-transform duration-300"
        style={{ transform: open ? "rotate(45deg)" : "none" }}
      >
        <path d="M5.5 0v11M0 5.5h11" stroke={open ? color : "rgba(255,255,255,0.55)"} strokeWidth="1.4" />
      </svg>
    </span>
  );
}

/**
 * Casca de cartão que abre no clique.
 *
 * A altura anima com grid-rows 0fr→1fr, então não precisa medir o conteúdo.
 * Ao abrir, o slide cresce, e o ScrollTrigger é recalculado para as animações
 * dos slides seguintes não saírem de posição.
 */
function useExpand() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => {
    setOpen((v) => !v);
    window.setTimeout(() => ScrollTrigger.refresh(), 460);
  }, []);
  return { open, toggle };
}

function Expandable({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-out ${
        open ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">
        <div className="border-t border-white/10 pt-4 text-[13px] leading-relaxed text-white/70">{children}</div>
      </div>
    </div>
  );
}

/* ── Blocos ────────────────────────────────────────────────────────────── */

function Card({
  n,
  title,
  text,
  more,
  highlight,
}: {
  n: string;
  title: string;
  text: string;
  more: string;
  highlight?: boolean;
}) {
  const { open, toggle } = useExpand();
  const accent = highlight ? RED : GOLD;
  return (
    <div
      className="a-up relative flex flex-col overflow-hidden rounded-3xl border p-5 backdrop-blur-sm transition-colors sm:p-7"
      style={
        highlight
          ? { borderColor: `${RED}59`, backgroundColor: `${RED}12` }
          : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }
      }
    >
      {highlight && <Corners />}
      <button type="button" onClick={toggle} aria-expanded={open} className="group relative z-10 text-left">
        <span className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: accent }}>
            {n}
          </span>
          <PlusMark open={open} color={accent} />
        </span>
        <h3 className="mt-4 font-display text-xl font-semibold uppercase leading-tight tracking-tight transition-colors group-hover:text-white/80 sm:mt-5 sm:text-2xl">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-white/60">{text}</p>
      </button>
      <Expandable open={open}>{more}</Expandable>
    </div>
  );
}

/** Card de crew, com foto e detalhe que abre. */
function CrewCard({ name, text, img, more }: { name: string; text: string; img: string; more: string }) {
  const { open, toggle } = useExpand();
  return (
    <div className="a-up overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <button type="button" onClick={toggle} aria-expanded={open} className="group block w-full text-left">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={`${IMG}/${img}.jpg`}
            alt={name}
            fill
            sizes="(max-width: 1024px) 45vw, 300px"
            className="a-img object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060B1C] via-[#060B1C]/25 to-transparent" />
        </div>
        <div className="p-5">
          <div className="flex items-start gap-2">
            <h3 className="font-display text-xl font-semibold uppercase leading-tight tracking-tight">{name}</h3>
            <PlusMark open={open} color={GOLD} />
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{text}</p>
        </div>
      </button>
      <div className="px-5 pb-1">
        <Expandable open={open}>{more}</Expandable>
      </div>
      <div className={open ? "pb-4" : ""} />
    </div>
  );
}

/** Ponto de experiência no percurso. */
function PointCard({
  km,
  title,
  text,
  more,
  last,
}: {
  km: string;
  title: string;
  text: string;
  more: string;
  last?: boolean;
}) {
  const { open, toggle } = useExpand();
  const accent = last ? RED : GOLD;
  return (
    <div className="a-up relative">
      <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-[#060B1C]" style={{ borderColor: accent }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <button type="button" onClick={toggle} aria-expanded={open} className="group mt-6 block w-full max-w-xs text-left">
        <div className="flex items-center gap-3">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: accent }}>
            {km}
          </p>
          <PlusMark open={open} color={accent} />
        </div>
        <h3 className="mt-2 font-display text-2xl font-semibold uppercase leading-tight tracking-tight transition-colors group-hover:text-white/80 md:text-3xl">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-white/60">{text}</p>
      </button>
      <div className="max-w-xs">
        <Expandable open={open}>{more}</Expandable>
      </div>
    </div>
  );
}

/** Uma das cinco frentes de entrega do Somma. */
function FrenteCard({ title, text, more }: { title: string; text: string; more: string }) {
  const { open, toggle } = useExpand();
  return (
    <div className="a-up flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm sm:p-6">
      <button type="button" onClick={toggle} aria-expanded={open} className="group text-left">
        <div className="flex items-center justify-between gap-2">
          <div className="a-rail h-0.5 w-8 origin-left" style={{ backgroundColor: GOLD }} />
          <PlusMark open={open} color={GOLD} />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold uppercase tracking-tight transition-colors group-hover:text-white/80 sm:mt-5 sm:text-2xl">
          {title}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-white/60">{text}</p>
      </button>
      <Expandable open={open}>{more}</Expandable>
    </div>
  );
}

/** Item do totem. */
function TotemCard({ title, text, more }: { title: string; text: string; more: string }) {
  const { open, toggle } = useExpand();
  return (
    <div className="a-up rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <button type="button" onClick={toggle} aria-expanded={open} className="group w-full text-left">
        <div className="flex items-center gap-2.5">
          <RibbonMark />
          <h3 className="font-display text-base font-semibold uppercase leading-tight tracking-tight transition-colors group-hover:text-white/80 sm:text-lg">
            {title}
          </h3>
          <PlusMark open={open} color={RED} />
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-white/60 sm:text-[13px]">{text}</p>
      </button>
      <Expandable open={open}>{more}</Expandable>
    </div>
  );
}

/** Fase da campanha: antes, durante, depois. */
function FaseCard({
  fase,
  title,
  text,
  more,
  highlight,
}: {
  fase: string;
  title: string;
  text: string;
  more: string;
  highlight?: boolean;
}) {
  const { open, toggle } = useExpand();
  const accent = highlight ? RED : GOLD;
  return (
    <div
      className="a-up relative overflow-hidden rounded-3xl border p-5 backdrop-blur-sm sm:p-7"
      style={
        highlight
          ? { borderColor: `${RED}59`, backgroundColor: `${RED}12` }
          : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }
      }
    >
      {highlight && <Corners />}
      <button type="button" onClick={toggle} aria-expanded={open} className="group relative z-10 w-full text-left">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: accent }}>
            {fase}
          </p>
          <PlusMark open={open} color={accent} />
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold uppercase leading-tight tracking-tight transition-colors group-hover:text-white/80">
          {title}
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed text-white/60">{text}</p>
      </button>
      <Expandable open={open}>{more}</Expandable>
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

/* ══════════════════════════════════════════════════════════════════════════
   CAPÍTULO · A PLATAFORMA DAS CREWS
   Helpers do capítulo novo. Reutilizam a linguagem do deck (fita, cantos,
   dourado/vermelho, animação a-up).
   ══════════════════════════════════════════════════════════════════════════ */

type Tone = "gold" | "red" | "day" | "night" | "navy" | "green";

/** Cor de acento a partir de um tom nomeado. */
function toneColor(t?: Tone): string {
  switch (t) {
    case "red":
    case "night":
      return RED;
    case "green":
      return "#2E9E7B";
    case "navy":
      return NAVY;
    default:
      return GOLD;
  }
}

/**
 * Tabela responsiva. No desktop vira `<table>`; no celular, cada linha vira um
 * card com rótulo:valor. Uma única fonte de dados alimenta os dois — nada é
 * duplicado à mão.
 */
type DTRow = { cells: readonly React.ReactNode[]; tone?: Tone; strongLast?: boolean };
function DataTable({
  head,
  rows,
  colW,
}: {
  head: readonly string[];
  rows: readonly DTRow[];
  colW?: readonly string[];
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
                className="px-4 py-3.5 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 sm:px-6 sm:py-4 sm:text-xs sm:tracking-[0.25em]"
                style={colW ? { width: colW[i] } : undefined}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => {
            const c = toneColor(r.tone);
            return (
              <tr key={ri} className="border-b border-white/[0.06] last:border-0">
                {r.cells.map((cell, ci) => (
                  <td
                    key={ci}
                    className={
                      ci === 0
                        ? "px-4 py-3 align-top font-display text-sm font-semibold uppercase leading-tight tracking-wide sm:px-6 sm:py-3.5 sm:text-base"
                        : "px-4 py-3 align-top leading-snug text-white/60 sm:px-6 sm:py-3.5"
                    }
                    style={ci === 0 ? { color: c } : undefined}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* mobile: cada linha vira card */}
      <ul className="divide-y divide-white/[0.07] md:hidden">
        {rows.map((r, ri) => {
          const c = toneColor(r.tone);
          return (
            <li key={ri} className="p-4">
              <p className="font-display text-base font-semibold uppercase leading-tight tracking-wide" style={{ color: c }}>
                {r.cells[0]}
              </p>
              <dl className="mt-2 space-y-1.5">
                {r.cells.slice(1).map((cell, ci) => (
                  <div key={ci} className="grid grid-cols-[auto_1fr] gap-x-3">
                    <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">{head[ci + 1]}</dt>
                    <dd className="text-[13px] leading-snug text-white/70">{cell}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Faixa de destaque no estilo do deck. */
function Destaque({ children }: { children: React.ReactNode }) {
  return (
    <p className="a-up mt-8 border-l-2 pl-5 font-display text-lg font-medium uppercase leading-snug tracking-tight md:text-2xl" style={{ borderColor: RED }}>
      {children}
    </p>
  );
}

/** Nota discreta (dados ilustrativos, ressalvas). */
function Nota({ children }: { children: React.ReactNode }) {
  return <p className="a-up mt-4 text-xs leading-relaxed text-white/35">{children}</p>;
}

/** Medidor de vagas de uma Crew, com estado "lotada". */
function Meter({ preenchidas, total, cor }: { preenchidas: number; total: number; cor: string }) {
  const pct = Math.round((preenchidas / total) * 100);
  const lotada = preenchidas >= total;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-display text-sm font-bold tabular-nums" style={{ color: lotada ? RED : cor }}>
          {preenchidas} <span className="text-white/40">de {total}</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: lotada ? RED : "rgba(255,255,255,0.4)" }}>
          {lotada ? "lotada" : `${pct}%`}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: lotada ? RED : cor }} />
      </div>
      <p className="mt-1.5 text-[11px] text-white/40">vagas preenchidas</p>
    </div>
  );
}

/** Card de Crew: dupla de líderes, vídeo, vagas e CTA. */
function CrewSlotCard({ crew }: { crew: Crew }) {
  const lotada = crew.preenchidas >= crew.total;
  return (
    <div className="a-up flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      {/* faixa de vídeo */}
      <div className="relative flex h-28 items-center justify-center overflow-hidden" style={{ backgroundColor: `${crew.cor}1F` }}>
        <span className="absolute left-3 top-3 font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: crew.cor }}>
          {crew.nome}
        </span>
        <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: crew.cor }}>
          <PlayMark />
        </span>
        <span className="absolute bottom-2.5 right-3 font-mono text-[8px] uppercase tracking-widest text-white/45">
          vídeo de apresentação
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-display text-lg font-semibold uppercase leading-none tracking-tight text-white">Líder A + Líder B</p>
        <p className="mt-1.5 text-[13px] leading-snug text-white/55">{crew.estilo}</p>
        <div className="mt-4">
          <Meter preenchidas={crew.preenchidas} total={crew.total} cor={crew.cor} />
        </div>
        <div
          className="mt-4 rounded-lg py-2.5 text-center font-display text-[11px] font-bold uppercase tracking-wider"
          style={
            lotada
              ? { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }
              : { backgroundColor: crew.cor, color: "#fff" }
          }
        >
          {lotada ? "Crew lotada" : "Entrar nessa Crew"}
        </div>
      </div>
    </div>
  );
}

/** Passos numerados de um fluxo (pulseira, transferência). */
function FlowSteps({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((st, i) => (
        <li key={st} className="a-up flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-display text-sm font-bold"
            style={{ borderColor: `${GOLD}40`, backgroundColor: `${GOLD}14`, color: GOLD }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="pt-1 text-[13px] leading-snug text-white/80">{st}</span>
        </li>
      ))}
    </ol>
  );
}

/** Duas colunas de chips: o que o Somma entrega × o que a Michelob financia. */
function RolesColumns({ somma, michelob }: { somma: readonly string[]; michelob: readonly string[] }) {
  const Col = ({ titulo, itens, cor, sub }: { titulo: string; itens: readonly string[]; cor: string; sub: string }) => (
    <div className="a-up rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="flex items-center gap-2.5">
        <RibbonMark gold={cor === GOLD} />
        <h3 className="font-display text-xl font-bold uppercase tracking-tight" style={{ color: cor }}>
          {titulo}
        </h3>
      </div>
      <p className="mt-1 text-xs text-white/40">{sub}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {itens.map((it) => (
          <li key={it} className="rounded-full border border-white/12 px-3 py-1.5 text-[13px] text-white/80">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Col titulo="Somma entrega" itens={somma} cor={GOLD} sub="Estratégia, plataforma, comunidade e operação esportiva." />
      <Col titulo="Michelob ou agência" itens={michelob} cor={RED} sub="Espaço, estrutura, produção física e experiência da marca." />
    </div>
  );
}

/** Antes → agora, para a evolução da proposta. */
function BeforeAfter({ rows }: { rows: readonly { antes: string; agora: string }[] }) {
  return (
    <div className="a-up overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      <ul className="divide-y divide-white/[0.07]">
        {rows.map((r) => (
          <li key={r.antes} className="grid items-center gap-3 p-4 sm:grid-cols-[1fr_auto_1.1fr] sm:px-6">
            <span className="text-sm text-white/45 line-through decoration-white/25">{r.antes}</span>
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none" className="hidden shrink-0 sm:block" aria-hidden>
              <path d="M1 6h14M11 1l5 5-5 5" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display text-base font-semibold uppercase leading-tight tracking-tight text-white sm:text-lg">
              {r.agora}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Mockup do stand Michelob — sem pessoas, com as duas logos. */
function StandMock() {
  return (
    <div
      role="img"
      aria-label="Mockup do stand Somma x Michelob Ultra"
      className="a-up mx-auto w-full max-w-[340px] overflow-hidden rounded-t-2xl border border-white/10 shadow-2xl"
      style={{ backgroundColor: NAVY }}
    >
      {/* testeira */}
      <div className="flex items-center justify-center gap-3 border-b border-white/15 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${IMG}/logo-somma-white.png`} alt="Somma Club" className="h-4 w-auto" />
        <span className="text-[10px] text-white/40">×</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${IMG}/logo-michelob-white.png`} alt="Michelob Ultra" className="h-5 w-auto" />
      </div>
      {/* balcão */}
      <div className="px-5 py-6">
        <div className="grid grid-cols-3 gap-2">
          {["QR", "Fotos", "Brindes", "Ranking", "Recovery", "Pulseiras"].map((t) => (
            <div key={t} className="flex h-12 items-center justify-center rounded-lg bg-white/[0.06] text-center font-mono text-[9px] uppercase tracking-wider text-white/55">
              {t}
            </div>
          ))}
        </div>
        <div className="mt-4 h-px w-full bg-white/10" />
        <p className="mt-3 text-center font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
          Stand Michelob Ultra
        </p>
      </div>
      <div className="h-2 w-full" style={{ backgroundColor: RED }} aria-hidden />
      <div className="h-4 w-full bg-[#060A1C]" aria-hidden />
    </div>
  );
}

/** Mockup da tela de transferência de participação. */
function TransferMock() {
  const campo = (label: string, val?: string) => (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="text-[8px] uppercase tracking-wider text-white/40">{label}</p>
      {val ? (
        <p className="mt-0.5 text-[12px] font-semibold text-white">{val}</p>
      ) : (
        <div className="mt-1 h-1.5 w-2/3 rounded bg-white/15" aria-hidden />
      )}
    </div>
  );
  return (
    <div className="a-up w-full max-w-[300px] rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="font-display text-base font-bold uppercase tracking-tight text-white">Transferir participação</p>
      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: GOLD }}>
        Participante atual
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {campo("CPF atual", "•••.•••.•••-••")}
        {campo("Crew atual", "Crew 02")}
        {campo("Pontos", "740")}
        {campo("Histórico", "21 dias")}
      </div>
      <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: RED }}>
        Novo participante
      </p>
      <div className="mt-2 space-y-2">
        {campo("Novo CPF")}
        {campo("Novo telefone")}
        {campo("Novo e-mail")}
      </div>
      <div className="mt-4 rounded-lg py-2.5 text-center font-display text-[11px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: RED }}>
        Solicitar transferência
      </div>
      <p className="mt-2 text-center text-[9px] leading-snug text-white/35">
        Sujeita à validação do Somma. Venda de vaga não permitida.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CAPÍTULO · PROPOSTA FINANCEIRA
   Sub-slides comerciais, exibidos só quando o deck roda com `financial`
   (rota /ppt-michelob-proposta). Reutilizam Slide, Kicker, H2, Lead e a
   mesma linguagem visual dos demais slides.
   ══════════════════════════════════════════════════════════════════════════ */

/** Valor monetário com destaque tipográfico forte, sem cara de planilha. */
function Valor({ value, className = "" }: { value: string; className?: string }) {
  return (
    <p className={`font-display font-bold leading-[0.95] tracking-tight text-white ${className}`}>{value}</p>
  );
}

/** Selo pequeno, como "Impostos inclusos". */
function Selo({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-[11px] font-semibold uppercase tracking-[0.15em]"
      style={{ borderColor: `${GOLD}66`, color: GOLD }}
    >
      <RibbonMark gold />
      {children}
    </span>
  );
}

function SearchMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/* ── Tela 1 · Investimento ─────────────────────────────────────────────── */

function FinanceInvestimento({ index }: { index: number }) {
  return (
    <Slide index={index} name="proposta-financeira" className="bg-[#080F26]">
      <Grid />
      <div className="container-somma relative z-10">
        <Kicker>Proposta financeira</Kicker>
        <H2>
          Proposta <Accent>financeira</Accent>
        </H2>
        <Lead>
          Estratégia, tecnologia, comunidade e operação esportiva para uma campanha de 21 dias e um grande
          evento de encerramento.
        </Lead>

        <div className="mt-9 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          {/* Card principal de investimento */}
          <div
            className="a-up relative overflow-hidden rounded-3xl border p-6 sm:p-9"
            style={{ borderColor: `${RED}59`, backgroundColor: `${RED}0F` }}
          >
            <Corners />
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
              {INVESTIMENTO.totalLabel}
            </p>
            <Valor value={INVESTIMENTO.total} className="mt-3 text-[2.9rem] sm:text-6xl md:text-7xl" />
            <div className="mt-5">
              <Selo>{INVESTIMENTO.selo}</Selo>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/65">{INVESTIMENTO.totalNota}</p>
          </div>

          {/* Cartões comparativos */}
          <div className="flex flex-col gap-4">
            {COMPARATIVO.map((c) => (
              <div
                key={c.titulo}
                className="a-up relative overflow-hidden rounded-3xl border p-5 sm:p-6"
                style={
                  c.destaque
                    ? { borderColor: `${RED}59`, backgroundColor: `${RED}12` }
                    : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }
                }
              >
                <p
                  className="font-display text-sm font-semibold uppercase tracking-[0.2em]"
                  style={{ color: c.destaque ? RED : GOLD }}
                >
                  {c.titulo}
                </p>
                {c.valor && <Valor value={c.valor} className="mt-2 text-3xl sm:text-4xl" />}
                <p className="mt-2 text-[13px] leading-relaxed text-white/60">{c.texto}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Observação sobre produção física */}
        <div
          className="a-up mt-5 flex items-start gap-3 rounded-2xl border p-4 sm:p-5"
          style={{ borderColor: `${GOLD}33`, backgroundColor: "rgba(255,255,255,0.02)" }}
        >
          <span className="mt-0.5 shrink-0">
            <RibbonMark gold />
          </span>
          <p className="text-[13px] leading-relaxed text-white/60">{INVESTIMENTO.observacao}</p>
        </div>

        {/* Frase de destaque, com acento laranja Somma */}
        <p
          className="a-up mt-6 max-w-3xl border-l-2 pl-5 text-lg font-light italic leading-snug text-white/85 md:text-xl"
          style={{ borderColor: ORANGE }}
        >
          {INVESTIMENTO.frase}
        </p>
      </div>
    </Slide>
  );
}

/* ── Tela 2 · O que o Somma está vendendo ──────────────────────────────── */

function SommaFrenteCard({ frente }: { frente: SommaFrente }) {
  const { open, toggle } = useExpand();
  return (
    <div className="a-up flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
      <button type="button" onClick={toggle} aria-expanded={open} className="group text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: GOLD }}>
            {frente.n}
          </span>
          <PlusMark open={open} color={GOLD} />
        </div>
        <h3 className="mt-4 font-display text-lg font-semibold uppercase leading-tight tracking-tight transition-colors group-hover:text-white/80 sm:text-xl">
          {frente.title}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-white/60">{frente.short}</p>
      </button>
      <Expandable open={open}>{frente.detail}</Expandable>
    </div>
  );
}

function FinanceVende({ index }: { index: number }) {
  return (
    <Slide index={index} name="somma-vende">
      <Grid />
      <div className="container-somma relative z-10">
        <Kicker>O que o Somma está vendendo</Kicker>
        <H2 className="max-w-4xl">
          O que o Somma está <Accent>vendendo</Accent>
        </H2>
        <Lead>
          O investimento remunera ativos, conhecimento, tecnologia, comunidade e capacidade de execução.
        </Lead>

        <p className="a-up mt-8 flex items-center gap-2 text-xs text-white/35">
          <span className="inline-block h-1 w-1 rounded-full" style={{ backgroundColor: GOLD }} />
          Toque nos cartões para abrir
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SOMMA_FRENTES.map((f) => (
            <SommaFrenteCard key={f.n} frente={f} />
          ))}
        </div>

        {/* Tabela-resumo */}
        <div className="a-up mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3.5 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 sm:px-6 sm:text-xs sm:tracking-[0.25em]">
                  Frente
                </th>
                <th className="px-4 py-3.5 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 sm:px-6 sm:text-xs sm:tracking-[0.25em]">
                  Entrega principal
                </th>
              </tr>
            </thead>
            <tbody>
              {SOMMA_RESUMO.map((r) => (
                <tr key={r.frente} className="border-b border-white/[0.06] last:border-0">
                  <th
                    scope="row"
                    className="w-[38%] px-4 py-3 text-left align-top font-display text-sm font-semibold uppercase leading-tight tracking-wide text-white sm:w-[30%] sm:px-6 sm:text-base"
                  >
                    {r.frente}
                  </th>
                  <td className="px-4 py-3 align-top leading-snug text-white/60 sm:px-6">{r.entrega}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p
          className="a-up mt-6 max-w-3xl border-l-2 pl-5 text-lg font-light italic leading-snug text-white/85 md:text-xl"
          style={{ borderColor: RED }}
        >
          {SOMMA_FRASE_FINAL}
        </p>
      </div>
    </Slide>
  );
}

/* ── Tela 3 · Obrigações da Michelob ───────────────────────────────────── */

function ResponsabilidadeBadge({ value }: { value: Responsabilidade }) {
  const parceiros = value !== "Michelob";
  const color = parceiros ? GOLD : RED;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-tight text-white"
      style={{ borderColor: `${color}66`, backgroundColor: `${color}1A` }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {value}
    </span>
  );
}

/** Tabela filtrável e responsiva: mesmo array vira tabela no desktop e cards no mobile. */
function MichelobResponsibilitiesTable() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<CategoriaId | "todas">("todas");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MICHELOB_RESPONSIBILITIES.filter((r) => {
      const okCat = cat === "todas" || r.categoria === cat;
      const okQuery = !q || r.frente.toLowerCase().includes(q) || r.obrigacao.toLowerCase().includes(q);
      return okCat && okQuery;
    });
  }, [query, cat]);

  const chips: { id: CategoriaId | "todas"; label: string }[] = [
    { id: "todas", label: "Ver todas" },
    ...CATEGORIAS.map((c) => ({ id: c.id as CategoriaId | "todas", label: c.chip })),
  ];

  return (
    <div className="a-up">
      {/* Busca + contador */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <label htmlFor="busca-resp" className="sr-only">
            Buscar responsabilidade
          </label>
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" aria-hidden>
            <SearchMark />
          </span>
          <input
            id="busca-resp"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar responsabilidade"
            className="w-full rounded-full border border-white/15 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/35 focus:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          />
        </div>
        <p className="text-xs text-white/40" role="status" aria-live="polite">
          {filtered.length} de {MICHELOB_RESPONSIBILITIES.length} responsabilidades
        </p>
      </div>

      {/* Filtros por categoria */}
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
        {chips.map((c) => {
          const on = cat === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              aria-pressed={on}
              className="rounded-full border px-3.5 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.1em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              style={
                on
                  ? { borderColor: RED, backgroundColor: `${RED}26`, color: "#fff" }
                  : { borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Desktop: tabela com cabeçalho fixo */}
      <div className="mt-6 hidden overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] md:block">
        <div className="max-h-[52vh] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#0B1230]">
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Frente
                </th>
                <th className="px-6 py-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Obrigação da Michelob ou agência
                </th>
                <th className="px-6 py-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Responsabilidade
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.frente} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                  <th
                    scope="row"
                    className="w-[22%] px-6 py-4 text-left align-top font-display text-base font-semibold uppercase leading-tight tracking-wide text-white"
                  >
                    {r.frente}
                  </th>
                  <td className="px-6 py-4 align-top leading-snug text-white/65">{r.obrigacao}</td>
                  <td className="w-[1%] whitespace-nowrap px-6 py-4 align-top">
                    <ResponsabilidadeBadge value={r.responsabilidade} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-sm text-white/40">
                    Nenhuma responsabilidade encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: cada linha vira card */}
      <div className="mt-6 space-y-3 md:hidden">
        {filtered.map((r) => (
          <div key={r.frente} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="font-display text-base font-semibold uppercase leading-tight tracking-wide text-white">
              {r.frente}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/60">{r.obrigacao}</p>
            <div className="mt-3">
              <ResponsabilidadeBadge value={r.responsabilidade} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/40">
            Nenhuma responsabilidade encontrada.
          </p>
        )}
      </div>
    </div>
  );
}

function FinanceObrigacoes({ index }: { index: number }) {
  return (
    <Slide index={index} name="obrigacoes-michelob" className="bg-[#080F26]">
      <Grid />
      <div className="container-somma relative z-10">
        <Kicker>Obrigações da Michelob ou agência</Kicker>
        <H2 className="max-w-4xl">
          Obrigações da <Accent>Michelob Ultra</Accent> ou agência
        </H2>
        <Lead>
          A produção física e os custos de terceiros serão contratados e financiados diretamente pela Michelob
          Ultra ou por sua agência responsável.
        </Lead>
        <div className="mt-8">
          <MichelobResponsibilitiesTable />
        </div>
      </div>
    </Slide>
  );
}

/* ── Tela 4 · Condições comerciais ─────────────────────────────────────── */

function FinanceCondicoes({ index }: { index: number }) {
  return (
    <Slide index={index} name="condicoes-comerciais">
      <Grid />
      <div className="container-somma relative z-10">
        <Kicker>Condições comerciais</Kicker>
        <H2>
          Condições <Accent>comerciais</Accent>
        </H2>

        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          {/* Investimento + forma de pagamento */}
          <div className="flex flex-col gap-5">
            <div className="a-up rounded-3xl border p-6" style={{ borderColor: `${RED}59`, backgroundColor: `${RED}0F` }}>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-white/55">Investimento</p>
              <Valor value="R$ 240.000,00" className="mt-2 text-4xl sm:text-5xl" />
              <p className="mt-3 text-sm text-white/60">
                Valor referente exclusivamente aos serviços e ativos entregues pelo Somma.
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.15em]" style={{ color: GOLD }}>
                Impostos de 6% inclusos
              </p>
            </div>

            <div className="a-up rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
                Forma de pagamento
              </p>
              <div className="relative mt-5">
                {PAGAMENTO.map((p, i) => (
                  <div key={p.quando} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < PAGAMENTO.length - 1 && (
                      <span className="absolute left-[1.35rem] top-11 h-[calc(100%-2.25rem)] w-px bg-white/10" aria-hidden />
                    )}
                    <div
                      className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 bg-[#060B1C] font-display text-sm font-bold"
                      style={{ borderColor: i === 0 ? RED : `${GOLD}99`, color: i === 0 ? RED : GOLD }}
                    >
                      {p.pct}
                    </div>
                    <div className="pt-1">
                      <p className="text-sm text-white/70">{p.quando}</p>
                      <Valor value={p.valor} className="mt-1 text-2xl" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Não incluso + gestão de fornecedores */}
          <div className="flex flex-col gap-5">
            <div className="a-up rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
                Não incluso no fee
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {NAO_INCLUSO.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white/55"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-white/55">{NAO_INCLUSO_NOTA}</p>
            </div>

            <div
              className="a-up rounded-3xl border p-6"
              style={{ borderColor: `${GOLD}40`, backgroundColor: "rgba(255,255,255,0.02)" }}
            >
              <p className="font-display text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
                Gestão de fornecedores
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-white/65">{FORNECEDORES.intro}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/65">{FORNECEDORES.condicao}</p>
              <ul className="mt-4 space-y-2">
                {FORNECEDORES.opcoes.map((o) => (
                  <li key={o} className="flex items-start gap-2.5 text-sm text-white/80">
                    <span className="mt-0.5">
                      <RibbonMark gold />
                    </span>
                    {o}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs italic text-white/40">{FORNECEDORES.nota}</p>
            </div>
          </div>
        </div>

        {/* Cláusula de responsabilidade */}
        <div
          className="a-up relative mt-5 overflow-hidden rounded-3xl border p-6 sm:p-7"
          style={{ borderColor: `${RED}59`, backgroundColor: `${RED}0F` }}
        >
          <Corners />
          <p className="font-display text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: RED }}>
            Cláusula de responsabilidade
          </p>
          <div className="mt-4 space-y-3">
            {CLAUSULA_RESPONSABILIDADE.map((p, i) => (
              <p key={i} className="text-[13px] leading-relaxed text-white/70 sm:text-sm">
                {p}
              </p>
            ))}
          </div>
        </div>

        {/* Validade, cronograma e observação jurídica */}
        <div className="a-up mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">{CONDICOES_META.validadeLabel}</p>
            <p className="mt-1 font-display text-xl font-semibold text-white">{CONDICOES_META.validade}</p>
            <p className="mt-3 text-[13px] leading-relaxed text-white/55">{CONDICOES_META.cronograma}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Observação jurídica</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/55">{CONDICOES_META.juridica}</p>
          </div>
        </div>
        <p className="a-up mt-5 text-xs text-white/35">{CONDICOES_META.consumo}</p>
      </div>
    </Slide>
  );
}

/* ── Tela 5 · CTA final da seção financeira ────────────────────────────── */

function FinanceCTA({ index, goToName }: { index: number; goToName: (name: string) => void }) {
  return (
    <Slide index={index} name="encerramento-financeiro" className="bg-[#080F26]">
      <Grid />
      <div className="container-somma relative z-10 text-center">
        <Kicker className="justify-center">Proposta financeira</Kicker>
        <div className="a-mask mt-5 overflow-hidden py-1">
          <h2 className="mx-auto max-w-4xl font-display text-[1.9rem] font-bold uppercase leading-[0.98] tracking-tight sm:text-4xl md:text-5xl">
            Prontos para transformar 21 dias de movimento em uma <Accent>grande experiência de marca</Accent>.
          </h2>
        </div>

        <div className="a-up mt-10 flex justify-center">
          <Lockup />
        </div>

        <div
          className="a-up mx-auto mt-8 inline-flex flex-col items-center rounded-3xl border px-8 py-6"
          style={{ borderColor: `${RED}59`, backgroundColor: `${RED}0F` }}
        >
          <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
            {FINANCE_CTA.valorLabel}
          </p>
          <Valor value={FINANCE_CTA.valor} className="mt-2 text-5xl sm:text-6xl" />
          <div className="mt-4">
            <Selo>{FINANCE_CTA.selo}</Selo>
          </div>
        </div>

        <div className="a-up mx-auto mt-9 flex w-full max-w-md flex-col gap-3 sm:max-w-xl sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => goToName("fechamento")}
            className="w-full rounded-full py-4 font-display text-sm font-semibold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:w-auto sm:px-8"
            style={{ backgroundColor: RED }}
          >
            {FINANCE_CTA.primario}
          </button>
          <button
            type="button"
            onClick={() => goToName("obrigacoes-michelob")}
            className="w-full rounded-full border py-4 font-display text-sm font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:w-auto sm:px-8"
            style={{ borderColor: `${GOLD}66` }}
          >
            {FINANCE_CTA.secundario}
          </button>
        </div>

        <p className="a-up mt-10 text-[11px] text-white/25">
          Consumo responsável. Material destinado ao público maior de 18 anos.
        </p>
      </div>
    </Slide>
  );
}
