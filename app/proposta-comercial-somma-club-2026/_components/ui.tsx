"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Check } from "lucide-react";

/* ── Cores da marca (via CSS vars escopadas em .pcs-root) ──────────────── */
export const C = {
  primary: "var(--somma-primary)",
  secondary: "var(--somma-secondary)",
  surface: "var(--somma-surface)",
  border: "var(--somma-border)",
  muted: "var(--somma-muted)",
  highlight: "var(--somma-highlight)",
};

/* ── Reveal: entrada suave respeitando prefers-reduced-motion ──────────── */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "span";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </MotionTag>
  );
}

/** Container de conteúdo com respiro generoso. */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

/** Seção semântica âncora do deck. */
export function Section({
  id,
  children,
  className = "",
  dark,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      data-section={id}
      className={`relative w-full scroll-mt-20 py-20 sm:py-24 md:py-28 ${
        dark ? "bg-[var(--somma-background)]" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--somma-primary)] sm:text-xs">
      {children}
    </p>
  );
}

export function SectionTitle({
  kicker,
  title,
  lead,
  center,
}: {
  kicker?: string;
  title: ReactNode;
  lead?: ReactNode;
  center?: boolean;
}) {
  return (
    <header className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {kicker && (
        <Reveal>
          <Kicker>{kicker}</Kicker>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className="mt-4 text-balance text-3xl font-black leading-[1.03] tracking-tight sm:text-4xl md:text-5xl">
          {title}
        </h2>
      </Reveal>
      {lead && (
        <Reveal delay={0.1}>
          <p className="mt-5 text-pretty text-base leading-relaxed text-[var(--somma-muted)] sm:text-lg">
            {lead}
          </p>
        </Reveal>
      )}
    </header>
  );
}

/** Realce em vermelho da marca. */
export function Hi({ children }: { children: ReactNode }) {
  return <span className="text-[var(--somma-primary)]">{children}</span>;
}

/** Cartão de superfície padrão. */
export function Card({
  children,
  className = "",
  highlight,
}: {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-6 sm:p-7 ${
        highlight
          ? "border-[var(--somma-primary)]/40 bg-[var(--somma-highlight)]"
          : "border-white/10 bg-white/[0.03]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "primary";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        tone === "primary"
          ? "bg-[var(--somma-highlight)] text-[var(--somma-primary)]"
          : "bg-white/[0.06] text-white/70"
      }`}
    >
      {children}
    </span>
  );
}

/** Item de lista com marcador de "check". */
export function CheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed text-white/75">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--somma-primary)]" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

/* ── Botões (renderiza <a> quando há href, senão <button>) ─────────────── */
type BtnProps = {
  children: ReactNode;
  className?: string;
  href?: string;
} & Omit<ComponentPropsWithoutRef<"a">, "href"> &
  Pick<ComponentPropsWithoutRef<"button">, "onClick" | "type" | "disabled">;

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none disabled:opacity-50 disabled:hover:translate-y-0";

function Btn({ children, className, href, variant, ...rest }: BtnProps & { variant: "primary" | "ghost" }) {
  const cls = `${btnBase} ${
    variant === "primary"
      ? "bg-[var(--somma-primary)] text-white shadow-lg shadow-[var(--somma-primary)]/20"
      : "border border-white/25 text-white hover:bg-white/10"
  } ${className ?? ""}`;
  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} {...(rest as ComponentPropsWithoutRef<"button">)}>
      {children}
    </button>
  );
}

export function PrimaryButton(props: BtnProps) {
  return <Btn variant="primary" {...props} />;
}
export function GhostButton(props: BtnProps) {
  return <Btn variant="ghost" {...props} />;
}

/** Stagger container para listas animadas. */
export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
