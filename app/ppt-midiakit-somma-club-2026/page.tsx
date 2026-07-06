"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  ChevronDown,
  MapPin,
  Users,
  Trophy,
  CalendarDays,
  Sparkles,
  Target,
  Mail,
  MessageCircle,
  Heart,
  Globe,
  Zap,
} from "lucide-react";

const WHATSAPP =
  "https://wa.me/5561995372477?text=" +
  encodeURIComponent("Olá! Vi o mídia kit do Somma Club e quero conversar sobre patrocínio/ativação da minha marca.");
const EMAIL =
  "mailto:comercial@sommaclub.com.br?subject=" +
  encodeURIComponent("Patrocínio / Ativação — Somma Club");

const IMG = "/midiakit";

const SLIDES = [
  "capa",
  "somos",
  "numeros",
  "fazemos",
  "special-day",
  "audiencia",
  "instagram",
  "marca",
  "por-que",
  "contato",
] as const;

export default function MidiaKitPage() {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Reveal por seção
      gsap.utils.toArray<HTMLElement>("[data-slide]").forEach((section, i) => {
        const targets = section.querySelectorAll<HTMLElement>(".reveal");
        if (targets.length) {
          gsap.from(targets, {
            y: 48,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: { trigger: section, scroller: el, start: "top 65%", once: true },
          });
        }
        // slide ativo (bolinhas)
        ScrollTrigger.create({
          trigger: section,
          scroller: el,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => self.isActive && setActive(i),
        });
      });

      // Parallax suave nas fotos de fundo
      gsap.utils.toArray<HTMLElement>(".parallax").forEach((img) => {
        gsap.to(img, {
          yPercent: 14,
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

      // Contadores (big numbers)
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((node) => {
        const target = Number(node.dataset.count || "0");
        const obj = { n: 0 };
        gsap.to(obj, {
          n: target,
          duration: 1.8,
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

  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(`[data-index="${i}"]`);
    target?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      ref={scroller}
      className="h-screen w-full snap-y snap-mandatory overflow-y-auto overflow-x-hidden bg-[#0A0A0A] text-white antialiased"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Logo fixa */}
      <div className="pointer-events-none fixed left-5 top-5 z-50 md:left-8 md:top-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-somma.svg" alt="Somma Club" className="h-6 w-auto opacity-90 md:h-7" />
      </div>

      {/* Progresso lateral */}
      <div className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-3 md:flex">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Ir para slide ${i + 1}`}
            className="group flex items-center justify-end gap-2"
          >
            <span
              className={`h-2 rounded-full transition-all duration-300 ${
                active === i ? "w-6 bg-[#FF2C03]" : "w-2 bg-white/25 group-hover:bg-white/50"
              }`}
            />
          </button>
        ))}
      </div>

      {/* contador de slide */}
      <div className="fixed bottom-5 left-5 z-50 font-mono text-xs tracking-widest text-white/40 md:left-8">
        {String(active + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
      </div>

      {/* ───────── SLIDE 1 · CAPA ───────── */}
      <Slide index={0} name="capa" className="relative items-center justify-center overflow-hidden">
        <BgPhoto src={`${IMG}/capa.jpg`} alt="Somma Club correndo" priority overlay="strong" />
        <div className="container-somma relative z-10 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-somma.svg" alt="Somma Club" className="reveal mx-auto h-14 w-auto md:h-20" />
          <p className="reveal mt-8 text-xs font-semibold uppercase tracking-[0.4em] text-[#FF2C03] md:text-sm">
            Mídia Kit · 2026
          </p>
          <h1 className="reveal mx-auto mt-4 max-w-4xl text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">
            O maior running club <span className="text-[#FF2C03]">do DF</span>
          </h1>
          <p className="reveal mx-auto mt-6 max-w-xl text-base text-white/70 md:text-lg">
            Brasília corre com a gente. Uma comunidade que transformou corrida em cultura.
          </p>
        </div>
        <button
          onClick={() => goTo(1)}
          className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 text-white/60 transition-colors hover:text-white"
          aria-label="Avançar"
        >
          <ChevronDown className="h-8 w-8 animate-bounce" />
        </button>
      </Slide>

      {/* ───────── SLIDE 2 · O QUE SOMOS ───────── */}
      <Slide index={1} name="somos" className="relative items-center overflow-hidden">
        <BgPhoto src={`${IMG}/treino.jpg`} alt="Treino no Parque da Cidade" overlay="side" />
        <div className="container-somma relative z-10">
          <p className="reveal text-xs font-semibold uppercase tracking-[0.3em] text-[#FF2C03]">Quem somos</p>
          <h2 className="reveal mt-4 max-w-3xl text-3xl font-bold leading-[1.05] md:text-6xl">
            Não é só corrida.
            <br />É <span className="text-[#FF2C03]">comunidade</span>, cultura e pertencimento.
          </h2>
          <p className="reveal mt-6 max-w-xl text-base text-white/70 md:text-lg">
            Todo sábado, o Somma toma o <strong className="text-white">Estacionamento 10 do Parque da Cidade</strong>.
            Gratuito, aberto a todos os níveis — do primeiro km à maratona.
          </p>
          <div className="reveal mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/60">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#FF2C03]" /> Estacionamento 10 · Parque da Cidade
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#FF2C03]" /> Todo sábado, 7h
            </span>
          </div>
        </div>
      </Slide>

      {/* ───────── SLIDE 3 · BIG NUMBERS ───────── */}
      <Slide index={2} name="numeros" className="relative items-center justify-center overflow-hidden">
        <BgPhoto src={`${IMG}/crowd.jpg`} alt="300 pessoas todo sábado no Somma" overlay="cards" />
        <div className="container-somma relative z-10">
          <p className="reveal text-center text-xs font-semibold uppercase tracking-[0.3em] text-[#FF2C03]">
            Os números falam
          </p>
          <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2">
            <Stat kicker="em média todo sábado" label="pessoas no corre" count={300} suffix="" />
            <Stat kicker="e crescendo" label="membros na comunidade" count={6000} suffix="+" />
            <Stat kicker="posição" label="maior running club do DF" staticValue="#1" />
            <Stat kicker="sempre" label="gratuito e aberto a todos" count={100} suffix="%" />
          </div>
        </div>
      </Slide>

      {/* ───────── SLIDE 4 · O QUE FAZEMOS ───────── */}
      <Slide index={3} name="fazemos" className="items-center bg-[#0E0E0E]">
        <div className="container-somma relative z-10">
          <p className="reveal text-xs font-semibold uppercase tracking-[0.3em] text-[#FF2C03]">O que fazemos</p>
          <h2 className="reveal mt-4 max-w-2xl text-3xl font-bold md:text-5xl">
            Muito além do sábado de manhã.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Pillar
              icon={Users}
              title="Treinos toda semana"
              img={`${IMG}/p1.jpg`}
              text="Encontros no Parque da Cidade que reúnem centenas de corredores — do iniciante ao avançado."
            />
            <Pillar
              icon={Target}
              title="Assessoria de corrida"
              img={`${IMG}/p2.jpg`}
              text="Treinos personalizados, acompanhamento e evolução real com nossos professores. Estrutura profissional."
            />
            <Pillar
              icon={Sparkles}
              title="Eventos & engajamento"
              img={`${IMG}/p3.jpg`}
              text="O ano todo: provas, ativações, ações com marcas e experiências que movem a comunidade."
            />
          </div>
        </div>
      </Slide>

      {/* ───────── SLIDE 5 · SOMMA SPECIAL DAY ───────── */}
      <Slide index={4} name="special-day" className="relative items-center overflow-hidden">
        <BgPhoto src={`${IMG}/specialday.jpg`} alt="Somma Special Day" overlay="strong" />
        <div className="container-somma relative z-10">
          <p className="reveal inline-flex items-center gap-2 rounded-full bg-[#FF2C03] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            <Trophy className="h-3.5 w-3.5" /> Somma Special Day
          </p>
          <h2 className="reveal mt-5 max-w-3xl text-4xl font-black uppercase leading-[0.95] md:text-6xl">
            O palco das marcas.
          </h2>
          <p className="reveal mt-6 max-w-xl text-base text-white/75 md:text-lg">
            Todo <strong className="text-white">último sábado do mês</strong>, o Somma reúne a comunidade num evento
            especial onde <strong className="text-white">as marcas marcam presença e fazem suas ativações</strong> —
            experimentação, brindes, samba, energia e centenas de pessoas engajadas.
          </p>
          <div className="reveal mt-8 grid grid-cols-3 gap-3">
            {[`${IMG}/specialday2.jpg`, `${IMG}/eixao.jpg`, `${IMG}/eixao2.jpg`].map((s) => (
              <div key={s} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image src={s} alt="Ativação Somma Special Day" fill sizes="200px" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* ───────── SLIDE 6 · AUDIÊNCIA / BASE ───────── */}
      <Slide index={5} name="audiencia" className="relative items-center overflow-hidden">
        <BgPhoto src={`${IMG}/comunidade.jpg`} alt="Comunidade Somma" overlay="cards" />
        <div className="container-somma relative z-10 grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="reveal text-xs font-semibold uppercase tracking-[0.3em] text-[#FF2C03]">A audiência</p>
            <h2 className="reveal mt-4 text-3xl font-bold leading-tight md:text-5xl">
              Público local, ativo e com poder de compra.
            </h2>
            <p className="reveal mt-5 text-base text-white/70">
              Corredores de Brasília e do DF que levam saúde, performance e estilo de vida a sério — exatamente quem
              a sua marca quer alcançar.
            </p>
          </div>
          <div className="reveal rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FF2C03]">Base própria ativável</p>
            <p className="mt-3 text-2xl font-bold leading-snug md:text-3xl">
              +6 mil cadastros para campanhas segmentadas
            </p>
            <p className="mt-3 text-sm text-white/60">
              Base first-party com nome, e-mail, telefone, CPF e sexo — pronta para ativações direcionadas, sorteios,
              cupons e comunicação segmentada com a sua marca (uso conforme LGPD).
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Nome", "E-mail", "Telefone", "CPF", "Sexo"].map((t) => (
                <span key={t} className="rounded-full bg-[#FF2C03]/15 px-3 py-1 text-xs font-semibold text-[#FF2C03]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Slide>

      {/* ───────── SLIDE 7 · INSTAGRAM ───────── */}
      <Slide index={6} name="instagram" className="relative items-center overflow-hidden">
        <BgPhoto src={`${IMG}/treino2.jpg`} alt="Conteúdo do Somma no Instagram" overlay="cards" />
        <div className="container-somma relative z-10">
          <p className="reveal text-xs font-semibold uppercase tracking-[0.3em] text-[#FF2C03]">
            Instagram · @somma.club
          </p>
          <h2 className="reveal mt-4 max-w-3xl text-3xl font-bold leading-[1.05] md:text-5xl">
            Sua marca em <span className="text-[#FF2C03]">centenas de milhares</span> de telas.
          </h2>
          <p className="reveal mt-3 text-sm text-white/55">Desempenho dos últimos 90 dias.</p>

          <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-9 md:grid-cols-4">
            <IgStat count={13813} label="seguidores" note="e crescendo" />
            <IgStat count={430946} label="visualizações" note="últimos 90 dias" />
            <IgStat count={42722} label="contas alcançadas" note="últimos 90 dias" />
            <IgStat count={1900} label="cliques em links" note="últimos 90 dias" />
          </div>

          <div className="reveal mt-10 flex flex-wrap items-center gap-2.5 text-sm text-white/75">
            <span className="rounded-full bg-white/10 px-3 py-1.5">
              Stories <strong className="text-white">62,8%</strong>
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">
              Reels <strong className="text-white">37,1%</strong>
            </span>
            <span className="rounded-full bg-[#FF2C03]/15 px-3 py-1.5 font-semibold text-[#FF2C03]">
              Reels que passam de 20 mil views
            </span>
          </div>
        </div>
      </Slide>

      {/* ───────── SLIDE 8 · COMO SUA MARCA APARECE ───────── */}
      <Slide index={7} name="marca" className="relative items-center overflow-hidden">
        <BgPhoto src={`${IMG}/ativacao.jpg`} alt="Ativação de marca no Somma" overlay="cards" />
        <div className="container-somma relative z-10">
          <p className="reveal text-xs font-semibold uppercase tracking-[0.3em] text-[#FF2C03]">Como sua marca entra</p>
          <h2 className="reveal mt-4 max-w-2xl text-3xl font-bold md:text-5xl">
            Vários pontos de contato com a comunidade.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Presença e ativação no ponto de encontro (Parque da Cidade)",
              "Protagonismo no Somma Special Day",
              "Logo em camisas, kits e materiais",
              "Grupo VIP de membros: sorteios e brindes",
              "Conteúdo no Instagram e TikTok (@somma.club)",
              "Comunicação segmentada para a base de membros",
            ].map((t) => (
              <div
                key={t}
                className="reveal flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5"
              >
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF2C03] text-xs font-bold text-white">
                  ✓
                </span>
                <span className="text-sm text-white/80">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* ───────── SLIDE 9 · POR QUE PATROCINAR ───────── */}
      <Slide index={8} name="por-que" className="relative items-center overflow-hidden">
        <BgPhoto src={`${IMG}/wellness.jpg`} alt="Público que vive o bem-estar" overlay="cards" />
        <div className="container-somma relative z-10">
          <p className="reveal text-xs font-semibold uppercase tracking-[0.3em] text-[#FF2C03]">Por que patrocinar</p>
          <h2 className="reveal mt-4 max-w-3xl text-3xl font-bold leading-[1.05] md:text-5xl">
            Sua marca na mente de quem <span className="text-[#FF2C03]">vive o bem-estar</span>.
          </h2>
          <p className="reveal mt-5 max-w-2xl text-base text-white/70 md:text-lg">
            Patrocinar o Somma é ficar no topo da lembrança — e no dia a dia — de um público que respira saúde,
            wellness e estilo de vida ativo. Com membros de <strong className="text-white">todos os cantos do DF e de
            todas as classes</strong>, sua marca ganha alcance amplo, diverso e com conexão real.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Value
              icon={Heart}
              title="Conexão com wellness"
              text="Um público que valoriza saúde, performance e bem-estar todos os dias — e associa isso à sua marca."
            />
            <Value
              icon={Globe}
              title="Todo o DF, todas as classes"
              text="Membros de todas as regiões de Brasília e de todos os perfis sociais. Alcance amplo e diverso."
            />
            <Value
              icon={Users}
              title="Comunidade engajada"
              text="Centenas de pessoas presentes toda semana, com vínculo real, recorrente e espontâneo."
            />
            <Value
              icon={Zap}
              title="Presença física + digital"
              text="Da rua ao feed: ativação no evento, camisas, grupo VIP, redes sociais e base própria ativável."
            />
          </div>
        </div>
      </Slide>

      {/* ───────── SLIDE 10 · CONTATO / CTA ───────── */}
      <Slide index={9} name="contato" className="relative items-center justify-center overflow-hidden text-center">
        <BgPhoto src={`${IMG}/eixao3.jpg`} alt="Somma Club" overlay="strong" />
        <div className="container-somma relative z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-somma.svg" alt="Somma Club" className="reveal mx-auto h-10 w-auto opacity-90 md:h-12" />
          <h2 className="reveal mx-auto mt-8 max-w-3xl text-4xl font-black uppercase leading-[0.95] md:text-6xl">
            Isso é o Somma.
            <br />
            <span className="text-[#FF2C03]">Bora conversar?</span>
          </h2>
          <p className="reveal mx-auto mt-5 max-w-lg text-base text-white/70 md:text-lg">
            Apresentamos quem somos. Agora queremos entender a sua marca e desenhar a ação ideal juntos.
          </p>
          <div className="reveal mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#FF2C03] px-8 py-4 text-base font-bold text-white transition-transform hover:scale-[1.03]"
            >
              <MessageCircle className="h-5 w-5" /> Falar no WhatsApp
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href={EMAIL}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              <Mail className="h-5 w-5" /> Enviar e-mail
            </a>
          </div>
          <p className="reveal mt-6 text-xs text-white/40">
            sommaclub.com.br · @somma.club · comercial@sommaclub.com.br
          </p>
        </div>
      </Slide>
    </div>
  );
}

/* ── Blocos auxiliares ────────────────────────────────────────────────── */

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
      className={`relative flex min-h-screen w-full snap-start flex-col px-2 py-20 md:py-24 ${className}`}
    >
      {children}
    </section>
  );
}

function BgPhoto({
  src,
  alt,
  overlay = "strong",
  priority,
}: {
  src: string;
  alt: string;
  overlay?: "strong" | "side" | "cards";
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
      {overlay === "strong" && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/85" />
      )}
      {overlay === "side" && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30" />
      )}
      {/* para slides com muitos cards: escurece mais para manter tudo legível, mas a foto respira nas bordas */}
      {overlay === "cards" && (
        <>
          <div className="absolute inset-0 bg-black/82" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </>
      )}
    </div>
  );
}

function Stat({
  count,
  suffix = "",
  staticValue,
  kicker,
  label,
}: {
  count?: number;
  suffix?: string;
  staticValue?: string;
  kicker: string;
  label: string;
}) {
  return (
    <div className="reveal text-center md:text-left">
      <p className="text-xs uppercase tracking-widest text-white/40">{kicker}</p>
      <div className="mt-1 flex items-baseline justify-center gap-1 md:justify-start">
        <span className="text-6xl font-black leading-none tracking-tight text-white md:text-8xl">
          {staticValue ? (
            <span className="text-[#FF2C03]">{staticValue}</span>
          ) : (
            <>
              <span data-count={count}>0</span>
              <span className="text-[#FF2C03]">{suffix}</span>
            </>
          )}
        </span>
      </div>
      <p className="mt-2 text-base font-medium text-white/70 md:text-lg">{label}</p>
    </div>
  );
}

function IgStat({ count, label, note }: { count: number; label: string; note: string }) {
  return (
    <div className="reveal">
      <div className="text-4xl font-black leading-none tracking-tight text-white md:text-5xl">
        <span data-count={count}>0</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-white/85">{label}</p>
      <p className="text-xs text-white/40">{note}</p>
    </div>
  );
}

function Pillar({
  icon: Icon,
  title,
  text,
  img,
}: {
  icon: typeof Users;
  title: string;
  text: string;
  img?: string;
}) {
  return (
    <div className="reveal overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      {img && (
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image src={img} alt={title} fill sizes="380px" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0E] via-transparent to-transparent" />
        </div>
      )}
      <div className="p-7">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF2C03]/15 text-[#FF2C03]">
          <Icon className="h-6 w-6" />
        </span>
        <h3 className="mt-5 text-xl font-bold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p>
      </div>
    </div>
  );
}

function Value({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Users;
  title: string;
  text: string;
}) {
  return (
    <div className="reveal flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF2C03]/15 text-[#FF2C03]">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-base font-bold leading-snug">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">{text}</p>
    </div>
  );
}
