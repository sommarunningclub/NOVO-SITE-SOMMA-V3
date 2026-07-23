"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  BatteryFull,
  CalendarCheck,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  Database,
  Flag,
  Flame,
  Gift,
  HeartHandshake,
  LineChart,
  ListChecks,
  PartyPopper,
  QrCode,
  Repeat,
  ScanLine,
  Share2,
  Sparkles,
  Target,
  Trophy,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Wifi,
} from "lucide-react";
import { C } from "../data";

/* ── Ícone por nome, para os dados poderem ser arrays simples ──────────── */

/**
 * Registro explícito em vez de `import * as Icons`. O import estrela levava a
 * biblioteca inteira para o bundle e a rota passava de 180 kB.
 */
const ICONS = {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  BatteryFull,
  CalendarCheck,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  Database,
  Flag,
  Flame,
  Gift,
  HeartHandshake,
  LineChart,
  ListChecks,
  PartyPopper,
  QrCode,
  Repeat,
  ScanLine,
  Share2,
  Sparkles,
  Target,
  Trophy,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Wifi,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, className, color }: { name: string; className?: string; color?: string }) {
  const Cmp = ICONS[name as IconName];
  if (!Cmp) return null;
  return <Cmp className={className} color={color} aria-hidden />;
}

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
      style={{ scaleX, background: `linear-gradient(90deg, ${C.navy}, ${C.red})` }}
      className="fixed left-0 top-0 z-50 h-[3px] w-full origin-left"
    />
  );
}

/* ── Lockup das duas marcas ────────────────────────────────────────────── */

/**
 * As logos oficiais são usadas sem alteração. Como a versão da Michelob é azul
 * e vermelha, sobre fundo escuro elas ficam numa placa clara em vez de serem
 * recoloridas.
 */
export function Lockup({ onDark = false, size = "md" }: { onDark?: boolean; size?: "sm" | "md" | "lg" }) {
  const h = { sm: "h-5 md:h-6", md: "h-7 md:h-9", lg: "h-9 md:h-12" }[size];
  const inner = (
    <div className="flex items-center gap-4 md:gap-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-somma-dark.png" alt="Somma Running Club" className={`${h} w-auto`} />
      <span className="text-lg font-light text-[#0E1226]/35 md:text-xl" aria-hidden>
        x
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Michelob_Ultra_(3).png" alt="Michelob Ultra Club" className={`${h} w-auto`} />
    </div>
  );
  if (!onDark) return inner;
  return <div className="inline-flex rounded-2xl bg-white px-5 py-3.5 shadow-lg md:px-7 md:py-4">{inner}</div>;
}

/* ── Seção ─────────────────────────────────────────────────────────────── */

export function Section({
  id,
  tone = "light",
  className = "",
  children,
}: {
  id?: string;
  tone?: "light" | "white" | "navy";
  className?: string;
  children: React.ReactNode;
}) {
  const bg =
    tone === "navy"
      ? "text-white"
      : tone === "light"
        ? "bg-[#F4F5F8] text-[#0E1226]"
        : "bg-white text-[#0E1226]";
  return (
    <section
      id={id}
      className={`scroll-mt-4 px-5 py-16 md:px-8 md:py-24 ${bg} ${className}`}
      style={tone === "navy" ? { backgroundColor: C.navyDeep } : undefined}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

/* ── Cabeçalho de seção ────────────────────────────────────────────────── */

export function SectionHeader({
  eyebrow,
  title,
  text,
  onDark = false,
  center = false,
  as = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  text?: React.ReactNode;
  onDark?: boolean;
  center?: boolean;
  as?: "h2" | "h3";
}) {
  const H = as;
  return (
    <Reveal className={center ? "text-center" : ""}>
      {eyebrow && (
        <p
          className="mb-3 font-title text-xs font-semibold uppercase tracking-[0.28em]"
          style={{ color: onDark ? C.orange : C.red }}
        >
          {eyebrow}
        </p>
      )}
      <H
        className={`font-title text-[2rem] font-bold uppercase leading-[1.05] tracking-tight sm:text-4xl md:text-5xl ${
          onDark ? "text-white" : "text-[#0E1226]"
        }`}
      >
        {title}
      </H>
      {text && (
        <div
          className={`mt-5 max-w-3xl text-[15px] leading-relaxed md:text-lg ${
            center ? "mx-auto" : ""
          } ${onDark ? "text-white/75" : "text-[#5A6178]"}`}
        >
          {text}
        </div>
      )}
    </Reveal>
  );
}

/* ── Cartão de métrica ─────────────────────────────────────────────────── */

export function MetricCard({
  icon,
  title,
  text,
  value,
  color,
  onDark = false,
}: {
  icon?: string;
  title: string;
  text?: string;
  value?: string;
  color?: string;
  onDark?: boolean;
}) {
  const accent = color ?? C.navy;
  return (
    <div
      className={`flex h-full flex-col rounded-2xl border p-5 md:p-6 ${
        onDark ? "border-white/12 bg-white/[0.06]" : "border-black/[0.07] bg-white"
      }`}
    >
      {icon && (
        <span
          className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          <Icon name={icon} className="h-5 w-5" />
        </span>
      )}
      {value && (
        <p className="font-title text-3xl font-bold leading-none md:text-4xl" style={{ color: accent }}>
          {value}
        </p>
      )}
      <h3
        className={`font-title text-lg font-semibold uppercase leading-tight tracking-tight md:text-xl ${
          value ? "mt-2" : ""
        } ${onDark ? "text-white" : "text-[#0E1226]"}`}
      >
        {title}
      </h3>
      {text && (
        <p className={`mt-2 text-sm leading-relaxed ${onDark ? "text-white/65" : "text-[#5A6178]"}`}>{text}</p>
      )}
    </div>
  );
}

/* ── Faixa de destaque ─────────────────────────────────────────────────── */

export function Highlight({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <Reveal>
      <p
        className={`border-l-4 pl-5 font-title text-xl font-medium uppercase leading-snug tracking-tight md:text-2xl ${
          onDark ? "text-white" : "text-[#0E1226]"
        }`}
        style={{ borderColor: C.red }}
      >
        {children}
      </p>
    </Reveal>
  );
}

/** Aviso de que os números mostrados são ilustrativos. */
export function FakeDataNote({ onDark = false }: { onDark?: boolean }) {
  return (
    <p className={`mt-4 text-xs ${onDark ? "text-white/40" : "text-[#5A6178]/70"}`}>
      Dados ilustrativos, para demonstração do conceito.
    </p>
  );
}

/** Envolve tabelas largas para elas rolarem no celular sem quebrar o layout. */
export function TableScroll({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0" role="region" aria-label={label} tabIndex={0}>
      <div className="min-w-[640px]">{children}</div>
    </div>
  );
}
