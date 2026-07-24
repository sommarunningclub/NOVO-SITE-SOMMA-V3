"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { C } from "../data";

export { Icon } from "./icons";
import { Icon } from "./icons";

/* ── Animação discreta de entrada ──────────────────────────────────────── */

export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M>
  );
}

/* ── Barra de progresso de leitura ─────────────────────────────────────── */

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX, background: `linear-gradient(90deg, ${C.gold}, ${C.red})` }}
      className="fixed left-0 top-0 z-50 h-[2px] w-full origin-left"
    />
  );
}

/* ── Marcadores gráficos, os mesmos do deck ────────────────────────────── */

/** Fita da Michelob Ultra, usada como marcador. */
export function RibbonMark({ color = C.red, className = "" }: { color?: string; className?: string }) {
  return (
    <svg width="9" height="14" viewBox="0 0 9 14" fill="none" className={`shrink-0 ${className}`} aria-hidden>
      <path d="M0 0h9v14L4.5 10.6 0 14V0Z" fill={color} />
    </svg>
  );
}

/** Cantos em L, moldura discreta dos blocos de destaque. */
export function Corners({ color = C.red }: { color?: string }) {
  const base = "pointer-events-none absolute h-3 w-3 border-current";
  return (
    <span className="pointer-events-none absolute inset-0" style={{ color }} aria-hidden>
      <span className={`${base} left-2.5 top-2.5 border-l border-t`} />
      <span className={`${base} right-2.5 top-2.5 border-r border-t`} />
      <span className={`${base} bottom-2.5 left-2.5 border-b border-l`} />
      <span className={`${base} bottom-2.5 right-2.5 border-b border-r`} />
    </span>
  );
}

/** Rótulo monoespaçado, tipo terminal. */
export function MonoLabel({
  children,
  color = C.gold,
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.28em] ${className}`} style={{ color }}>
      {children}
    </span>
  );
}

/* ── Lockup das duas marcas ────────────────────────────────────────────── */

/**
 * As logos oficiais entram sem alteração. Como a versão da Michelob é azul e
 * vermelha, sobre o fundo escuro ela fica numa placa clara em vez de recolorida.
 */
export function Lockup({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const h = { sm: "h-4 md:h-5", md: "h-6 md:h-8", lg: "h-8 md:h-10" }[size];
  return (
    <div className="inline-flex items-center gap-4 rounded-xl bg-white px-5 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.35)] md:gap-6 md:px-6 md:py-3.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-somma-dark.png" alt="Somma Running Club" className={`${h} w-auto`} />
      <span className="text-base font-light text-[#0E1226]/30 md:text-lg" aria-hidden>
        x
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Michelob_Ultra_(3).png" alt="Michelob Ultra Club" className={`${h} w-auto`} />
    </div>
  );
}

/* ── Seção ─────────────────────────────────────────────────────────────── */

export function Section({
  id,
  tone = "base",
  className = "",
  children,
}: {
  id?: string;
  tone?: "base" | "alt";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-4 px-5 py-16 text-white md:px-8 md:py-24 ${className}`}
      style={{ backgroundColor: tone === "alt" ? C.bgAlt : C.bg }}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

/** Malha técnica de fundo, com máscara radial. */
export function Grid({ opacity = 0.055 }: { opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(72% 60% at 50% 40%, #000 10%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(72% 60% at 50% 40%, #000 10%, transparent 100%)",
      }}
      aria-hidden
    />
  );
}

/* ── Cabeçalho de seção ────────────────────────────────────────────────── */

export function SectionHeader({
  eyebrow,
  title,
  text,
  center = false,
  as = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  text?: React.ReactNode;
  center?: boolean;
  as?: "h2" | "h3";
}) {
  const H = as;
  return (
    <Reveal className={center ? "text-center" : ""}>
      {eyebrow && (
        <p className={`mb-4 flex items-center gap-2.5 ${center ? "justify-center" : ""}`}>
          <RibbonMark color={C.gold} />
          <MonoLabel>{eyebrow}</MonoLabel>
        </p>
      )}
      <H className="font-title text-[2rem] font-bold uppercase leading-[1.03] tracking-tight text-white sm:text-4xl md:text-5xl">
        {title}
      </H>
      {text && (
        <div
          className={`mt-5 max-w-3xl text-[15px] font-light leading-relaxed text-white/65 md:text-lg ${
            center ? "mx-auto" : ""
          }`}
        >
          {text}
        </div>
      )}
    </Reveal>
  );
}

/* ── Cartão de vidro ───────────────────────────────────────────────────── */

export function Panel({
  children,
  highlight = false,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  highlight?: boolean;
  className?: string;
  as?: "div" | "li";
}) {
  const El = as;
  return (
    <El
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm ${className}`}
      style={
        highlight
          ? { borderColor: `${C.red}59`, backgroundColor: `${C.red}12` }
          : { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.035)" }
      }
    >
      {highlight && <Corners />}
      {children}
    </El>
  );
}

/* ── Cartão de métrica ─────────────────────────────────────────────────── */

export function MetricCard({
  icon,
  title,
  text,
  value,
  color,
  index,
}: {
  icon?: string;
  title: string;
  text?: string;
  value?: string;
  color?: string;
  index?: number;
}) {
  const accent = color ?? C.gold;
  return (
    <Panel className="h-full">
      <div className="flex h-full flex-col p-5 md:p-6">
        <div className="flex items-start justify-between">
          {icon && (
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border"
              style={{ borderColor: `${accent}4D`, color: accent, backgroundColor: `${accent}14` }}
            >
              <Icon name={icon} className="h-5 w-5" />
            </span>
          )}
          {index !== undefined && <MonoLabel color="rgba(255,255,255,0.28)">{String(index).padStart(2, "0")}</MonoLabel>}
        </div>
        {value && (
          <p className="mt-4 font-title text-3xl font-bold leading-none md:text-4xl" style={{ color: accent }}>
            {value}
          </p>
        )}
        <h3 className="mt-4 font-title text-lg font-semibold uppercase leading-tight tracking-tight text-white md:text-xl">
          {title}
        </h3>
        {text && <p className="mt-2 text-sm leading-relaxed text-white/55">{text}</p>}
      </div>
    </Panel>
  );
}

/* ── Faixa de destaque ─────────────────────────────────────────────────── */

export function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <Reveal>
      <p
        className="border-l-2 pl-5 font-title text-xl font-medium uppercase leading-snug tracking-tight text-white md:text-2xl"
        style={{ borderColor: C.red }}
      >
        {children}
      </p>
    </Reveal>
  );
}

/** Aviso de que os números mostrados são ilustrativos. */
export function FakeDataNote() {
  return (
    <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">
      dados ilustrativos · demonstração de conceito
    </p>
  );
}

/** Envolve tabelas largas para elas rolarem no celular sem quebrar o layout. */
export function TableScroll({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0" role="region" aria-label={label} tabIndex={0}>
      <div className="min-w-[620px]">{children}</div>
    </div>
  );
}
