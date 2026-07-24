"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import {
  C,
  ATIVACOES,
  SABADO,
  JORNADA_FINALE,
  WELLNESS,
  SESSIONS,
  FINALE_SCHEDULE,
  ACESSO,
  CRITERIOS_GRATUIDADE,
  INGRESSOS,
  COMPARACAO,
  RESULTADOS_ATIVACAO,
} from "../data";
import { Icon } from "./icons";
import { Reveal, Section, SectionHeader, Panel, MonoLabel, RibbonMark, Corners, TableScroll, FakeDataNote } from "./base";

/* ── 1 · Card de formato de ativação ───────────────────────────────────── */

export function ActivationFormatCard({
  nome,
  selo,
  frase,
  desc,
  indicadores,
  recomendado,
  children,
}: {
  nome: string;
  selo: string;
  frase: string;
  desc: readonly string[];
  indicadores: readonly string[];
  recomendado?: boolean;
  children?: React.ReactNode;
}) {
  const accent = recomendado ? C.red : C.gold;
  return (
    <Panel highlight={recomendado} className="flex h-full flex-col">
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <MonoLabel color={accent}>{selo}</MonoLabel>
          {recomendado && (
            <span
              className="rounded-full px-3 py-1 font-title text-[10px] font-bold uppercase tracking-[0.15em] text-white"
              style={{ backgroundColor: C.red }}
            >
              Recomendado
            </span>
          )}
        </div>

        <h3 className="mt-4 font-title text-2xl font-bold uppercase leading-[1.02] tracking-tight text-white md:text-[1.9rem]">
          {nome}
        </h3>
        <p className="mt-3 text-[15px] font-medium leading-snug" style={{ color: accent }}>
          {frase}
        </p>

        <div className="mt-4 space-y-3">
          {desc.map((d) => (
            <p key={d} className="text-sm leading-relaxed text-white/60">
              {d}
            </p>
          ))}
        </div>

        <ul className="mt-6 grid gap-2.5 border-t border-white/10 pt-6 sm:grid-cols-2">
          {indicadores.map((it) => (
            <li key={it} className="flex items-start gap-2.5 text-[13px] leading-snug text-white/80">
              <span className="mt-0.5">
                <RibbonMark color={accent} />
              </span>
              {it}
            </li>
          ))}
        </ul>

        {children && <div className="mt-6">{children}</div>}
      </div>
    </Panel>
  );
}

/* ── 2 · Linha do tempo da campanha ────────────────────────────────────── */

export function CampaignTimeline() {
  return (
    <div>
      <MonoLabel color="rgba(255,255,255,0.4)">Jornada até o evento</MonoLabel>
      <ol className="mt-4 space-y-0">
        {JORNADA_FINALE.map((e, i) => {
          const last = i === JORNADA_FINALE.length - 1;
          return (
            <li key={e.dia} className="relative flex gap-4 pb-5 last:pb-0">
              {!last && <span className="absolute left-[7px] top-4 h-full w-px bg-white/12" aria-hidden />}
              <span
                className="relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-[#060B1C]"
                style={{ backgroundColor: "destaque" in e && e.destaque ? C.red : `${C.gold}CC` }}
                aria-hidden
              />
              <div>
                <p className="font-title text-sm font-bold uppercase tracking-wider" style={{ color: "destaque" in e && e.destaque ? C.red : C.gold }}>
                  {e.dia}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-white/70">{e.txt}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ── 3 · Agenda de evento ──────────────────────────────────────────────── */

/** Blocos de programação, com faixa de horário/dia, título e itens. */
type SchedBlock = { label: string; title?: string; tone?: string; items: readonly string[] };
type FinaleBlock = { faixa: string; nome?: string; tone?: string; itens: readonly string[] };

/** Normaliza os dois formatos de bloco (roteiro e finale) num só. */
function normalize(b: SchedBlock | FinaleBlock): SchedBlock {
  if ("faixa" in b) return { label: b.faixa, title: b.nome, tone: b.tone, items: b.itens };
  return b;
}

export function EventSchedule({
  blocos,
  variant = "band",
}: {
  blocos: readonly (SchedBlock | FinaleBlock)[];
  variant?: "band" | "column";
}) {
  const norm = blocos.map(normalize);
  const dayColor = C.gold;
  const nightColor = C.red;
  return (
    <div className={variant === "column" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4" : "grid gap-3 md:grid-cols-2"}>
      {norm.map((b, i) => {
        const night = b.tone === "night";
        const accent = night ? nightColor : dayColor;
        return (
          <Reveal key={b.label + i} delay={i * 0.05} className="h-full">
            <div
              className="flex h-full flex-col rounded-2xl border p-5"
              style={{
                borderColor: `${accent}40`,
                backgroundColor: night ? `${nightColor}12` : "rgba(255,255,255,0.035)",
              }}
            >
              <div className="flex items-center gap-2">
                <Icon name={night ? "Moon" : "Sun"} className="h-4 w-4" color={accent} />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: accent }}>
                  {b.label}
                </span>
              </div>
              {b.title && (
                <h4 className="mt-3 font-title text-lg font-semibold uppercase leading-tight tracking-tight text-white">
                  {b.title}
                </h4>
              )}
              <ul className="mt-3 space-y-1.5">
                {b.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-[13px] leading-snug text-white/70">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

/* ── 4 · Experiência diurna e noturna ──────────────────────────────────── */

/**
 * Split dia/noite. Lado claro, esportivo e wellness; lado escuro, azul profundo
 * com iluminação vermelha e estética de palco. No meio, uma transição visual do
 * sol para a noite.
 */
/** Estrelas do céu noturno, em posições fixas para não quebrar a hidratação. */
const STARS = [
  { left: "8%", top: "22%", s: 2, d: 2.4, delay: 0 },
  { left: "18%", top: "55%", s: 1.5, d: 3.1, delay: 0.4 },
  { left: "27%", top: "30%", s: 2.5, d: 2.7, delay: 0.9 },
  { left: "36%", top: "68%", s: 1.5, d: 3.4, delay: 0.2 },
  { left: "44%", top: "18%", s: 2, d: 2.9, delay: 1.1 },
  { left: "55%", top: "48%", s: 1.5, d: 3.2, delay: 0.6 },
  { left: "63%", top: "26%", s: 2.5, d: 2.5, delay: 0.3 },
  { left: "72%", top: "60%", s: 1.5, d: 3.0, delay: 1.3 },
  { left: "80%", top: "34%", s: 2, d: 2.8, delay: 0.8 },
  { left: "90%", top: "52%", s: 1.5, d: 3.3, delay: 0.5 },
] as const;

const CLOUDS = [
  { top: "24%", scale: 1, dur: 26, delay: 0, from: "-20%" },
  { top: "58%", scale: 0.7, dur: 34, delay: 6, from: "-40%" },
  { top: "40%", scale: 0.85, dur: 30, delay: 12, from: "-10%" },
] as const;

/** Toggle sol ↔ lua. O sol desliza e vira lua crescente (via sombra interna). */
function DayNightToggle({ night, onToggle }: { night: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={night}
      aria-label="Alternar a experiência entre dia e noite"
      onClick={onToggle}
      className="group relative h-11 w-[84px] shrink-0 rounded-full border transition-colors duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      style={{
        borderColor: night ? "#2A3566" : `${C.gold}80`,
        background: night
          ? "linear-gradient(180deg, #0A1030, #1A2350)"
          : "linear-gradient(180deg, #3E5488, #7C93C8)",
        boxShadow: night ? "inset 0 1px 6px rgba(0,0,0,0.5)" : "inset 0 1px 6px rgba(255,255,255,0.25)",
      }}
    >
      {/* estrelinhas dentro do trilho (noite) */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-500"
        style={{ opacity: night ? 1 : 0 }}
        aria-hidden
      >
        <span className="absolute left-3 top-3 h-0.5 w-0.5 rounded-full bg-white/80" />
        <span className="absolute left-5 top-6 h-[3px] w-[3px] rounded-full bg-white/70" />
        <span className="absolute left-8 top-3.5 h-0.5 w-0.5 rounded-full bg-white/60" />
      </span>
      {/* sol / lua */}
      <span
        className="absolute top-1.5 h-8 w-8 rounded-full transition-all duration-500 ease-out"
        style={{
          left: night ? "calc(100% - 38px)" : "6px",
          background: night ? "#D7DCEA" : "radial-gradient(circle at 34% 32%, #FFE79A, #E3A63C)",
          boxShadow: night
            ? "inset -7px -3px 0 0 #AEB6D8, 0 0 10px 1px rgba(174,182,216,0.45)"
            : "0 0 14px 3px rgba(227,166,60,0.6)",
        }}
        aria-hidden
      />
    </button>
  );
}

/**
 * A experiência dia/noite, agora interativa.
 *
 * Um toggle sol/lua no alto comanda o "horário" da seção: o céu transiciona de
 * dia (nuvens) para noite (estrelas e aurora vermelha de palco), e o painel
 * ativo ganha destaque. Os dois painéis continuam sempre visíveis e legíveis —
 * o toggle muda a ênfase, não esconde conteúdo.
 */
export function DayNightExperience() {
  const [night, setNight] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      {/* ── faixa de céu com o toggle ─────────────────────────────────── */}
      <div className="relative h-36 overflow-hidden md:h-40">
        {/* gradiente do céu */}
        <div
          className="absolute inset-0 transition-[background] duration-700"
          style={{
            background: night
              ? "linear-gradient(165deg, #070C22 0%, #111C4E 60%, #1B2A6B 100%)"
              : "linear-gradient(165deg, #2A3A63 0%, #5E77B4 55%, #C9A96A 120%)",
          }}
        />
        {/* aurora vermelha de palco (noite) */}
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: night ? 1 : 0,
            background: `radial-gradient(60% 90% at 85% 10%, ${C.red}45, transparent 60%)`,
          }}
          aria-hidden
        />
        {/* estrelas (noite) */}
        <motion.div className="absolute inset-0" animate={{ opacity: night ? 1 : 0 }} transition={{ duration: 0.6 }} aria-hidden>
          {STARS.map((st, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-white"
              style={{ left: st.left, top: st.top, width: st.s, height: st.s }}
              animate={reduce ? undefined : { opacity: [0.25, 1, 0.25] }}
              transition={{ duration: st.d, delay: st.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </motion.div>
        {/* nuvens (dia) */}
        <motion.div className="absolute inset-0" animate={{ opacity: night ? 0 : 1 }} transition={{ duration: 0.6 }} aria-hidden>
          {CLOUDS.map((cl, i) => (
            <motion.span
              key={i}
              className="absolute"
              style={{ top: cl.top }}
              initial={{ x: cl.from }}
              animate={reduce ? { x: "40%" } : { x: ["-20%", "120%"] }}
              transition={reduce ? undefined : { duration: cl.dur, delay: cl.delay, repeat: Infinity, ease: "linear" }}
            >
              <svg width={64 * cl.scale} height={26 * cl.scale} viewBox="0 0 64 26" fill="rgba(255,255,255,0.55)" aria-hidden>
                <path d="M16 24c-7 0-13-4-13-10S9 6 15 6c2-4 6-6 11-6 6 0 11 4 12 9 6 0 12 3 12 9s-6 6-12 6H16Z" />
              </svg>
            </motion.span>
          ))}
        </motion.div>
        {/* escurecimento na base para o texto ler bem */}
        <div className="absolute inset-x-0 bottom-0 h-20" style={{ background: `linear-gradient(transparent, ${C.bg})` }} aria-hidden />

        {/* rótulo + toggle */}
        <div className="absolute inset-0 flex items-end justify-between p-5 md:p-6">
          <div>
            <MonoLabel color={night ? "#AEB6E8" : C.gold}>{night ? "modo noite" : "modo dia"}</MonoLabel>
            <p className="mt-1.5 font-title text-xl font-bold uppercase leading-none tracking-tight text-white md:text-2xl">
              {night ? "A festa toma o espaço" : "O corre e o wellness"}
            </p>
          </div>
          <DayNightToggle night={night} onToggle={() => setNight((v) => !v)} />
        </div>
      </div>

      {/* ── os dois painéis, sempre visíveis ──────────────────────────── */}
      <div className="grid md:grid-cols-2">
        {/* DIA — claro */}
        <div
          className="relative bg-[#F4F5F8] p-6 text-[#0E1226] transition-all duration-500 md:p-8"
          style={{ opacity: night ? 0.62 : 1 }}
        >
          <span
            className="absolute inset-x-0 top-0 h-1 transition-opacity duration-500"
            style={{ backgroundColor: C.gold, opacity: night ? 0 : 1 }}
            aria-hidden
          />
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${C.gold}26`, color: "#9A7B2E" }}>
              <Icon name="Sun" className="h-5 w-5" />
            </span>
            <MonoLabel color="#9A7B2E">Ambiente diurno</MonoLabel>
          </div>
          <h4 className="mt-4 font-title text-2xl font-bold uppercase leading-none tracking-tight md:text-3xl">
            Ultra Wellness Experience
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-[#5A6178]">
            Claro, esportivo e voltado ao bem-estar. É o hub de corrida e recovery durante o dia.
          </p>
          <ul className="mt-5 grid gap-x-5 gap-y-2 sm:grid-cols-2">
            {WELLNESS.map((w) => (
              <li key={w} className="flex items-start gap-2 text-[13px] leading-snug text-[#0E1226]">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: C.orange }} aria-hidden />
                {w}
              </li>
            ))}
          </ul>
        </div>

        {/* NOITE — escuro, palco */}
        <div
          className="relative p-6 text-white transition-all duration-500 md:p-8"
          style={{
            backgroundColor: C.navyDeep,
            backgroundImage: `radial-gradient(70% 60% at 80% 0%, ${C.red}${night ? "4D" : "26"}, transparent 60%), radial-gradient(60% 50% at 10% 100%, ${C.navy}66, transparent 60%)`,
            opacity: night ? 1 : 0.72,
          }}
        >
          <span
            className="absolute inset-x-0 top-0 h-1 transition-opacity duration-500"
            style={{ backgroundColor: C.red, opacity: night ? 1 : 0 }}
            aria-hidden
          />
          <div className="relative">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${C.red}26`, color: C.red }}>
                <Icon name="Moon" className="h-5 w-5" />
              </span>
              <MonoLabel color={C.red}>Ambiente noturno</MonoLabel>
            </div>
            <h4 className="mt-4 font-title text-2xl font-bold uppercase leading-none tracking-tight md:text-3xl">
              Ultra Sessions
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              O espaço vira palco: iluminação, som e três linguagens musicais.
            </p>
            <ul className="mt-5 space-y-3">
              {SESSIONS.map((sx) => (
                <li key={sx.nome} className="border-l-2 pl-4" style={{ borderColor: C.red }}>
                  <div className="flex items-center gap-2">
                    <Icon name="Music" className="h-3.5 w-3.5" color={C.red} />
                    <span className="font-title text-base font-semibold uppercase tracking-tight text-white">{sx.nome}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-snug text-white/55">{sx.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 5 · Card de ingresso ──────────────────────────────────────────────── */

export function TicketAccessCard({
  nome,
  desc,
  gratuito,
}: {
  nome: string;
  desc: string;
  gratuito?: boolean;
}) {
  const accent = gratuito ? C.red : C.gold;
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border p-5"
      style={
        gratuito
          ? { borderColor: `${C.red}59`, backgroundColor: `${C.red}0F` }
          : { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.035)" }
      }
    >
      {gratuito && <Corners />}
      <div className="flex items-center justify-between">
        <Icon name={gratuito ? "QrCode" : "Ticket"} className="h-5 w-5" color={accent} />
        {gratuito && <MonoLabel color={C.red}>desbloqueado</MonoLabel>}
      </div>
      <h4 className="mt-4 font-title text-xl font-bold uppercase leading-none tracking-tight text-white">{nome}</h4>
      <p className="mt-2 text-[13px] leading-relaxed text-white/55">{desc}</p>
    </div>
  );
}

/* ── 6 · Tabela comparativa ────────────────────────────────────────────── */

export function ActivationComparisonTable() {
  return (
    <TableScroll label="Comparação entre os dois formatos de ativação">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: `${C.gold}59` }}>
            <th className="px-4 py-3.5 font-title text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
              Critério
            </th>
            <th
              className="px-4 py-3.5 font-title text-xs font-semibold uppercase tracking-[0.15em]"
              style={{ color: C.red, backgroundColor: `${C.red}12` }}
            >
              Ativação A · Social Club
            </th>
            <th className="px-4 py-3.5 font-title text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: C.gold }}>
              Ativação B · Grand Finale
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARACAO.map((row) => (
            <tr key={row.criterio} className="border-b border-white/[0.08]">
              <td className="px-4 py-3 font-medium text-white/85">{row.criterio}</td>
              <td className="px-4 py-3 text-white/85" style={{ backgroundColor: `${C.red}0A` }}>
                {row.a}
              </td>
              <td className="px-4 py-3 text-white/60">{row.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

/* ── 7 · Banner de recomendação ────────────────────────────────────────── */

export function RecommendationBanner() {
  return (
    <Panel highlight className="overflow-hidden">
      <div className="p-6 md:p-9">
        <MonoLabel color={C.red}>Nossa recomendação</MonoLabel>
        <h3 className="mt-4 max-w-3xl font-title text-2xl font-bold uppercase leading-[1.05] tracking-tight text-white md:text-4xl">
          Michelob Ultra <span style={{ color: C.red }}>Social Club Experience</span>.
        </h3>
        <div className="mt-5 grid max-w-3xl gap-4 md:grid-cols-2">
          <p className="text-sm leading-relaxed text-white/70">
            A Ativação A entrega a ocupação mais completa da Michelob Ultra em Brasília: dois dias ou dois finais de
            semana de corrida, wellness, música e lifestyle, com o maior volume de conteúdo e a presença de marca mais
            prolongada.
          </p>
          <p className="text-sm leading-relaxed text-white/70">
            A Ativação B, o Grand Finale, permanece como alternativa mais enxuta: concentra os 21 dias em um único grande
            evento, com menor complexidade operacional, quando o objetivo for uma estreia direta.
          </p>
        </div>

        {/* recomendado × alternativa */}
        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-stretch">
          <div className="flex-1 rounded-2xl border p-5" style={{ borderColor: `${C.red}66`, backgroundColor: `${C.red}14` }}>
            <div className="flex items-center gap-2">
              <RibbonMark color={C.red} />
              <MonoLabel color={C.red}>Recomendado</MonoLabel>
            </div>
            <p className="mt-2 font-title text-lg font-bold uppercase leading-tight tracking-tight text-white">
              Michelob Ultra Social Club Experience
            </p>
          </div>
          <div className="flex-1 rounded-2xl border border-white/12 bg-white/[0.04] p-5">
            <MonoLabel color={C.gold}>Alternativa concentrada</MonoLabel>
            <p className="mt-2 font-title text-lg font-bold uppercase leading-tight tracking-tight text-white">
              Ultra Balance Challenge Grand Finale
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ── 8 · Métricas esperadas ────────────────────────────────────────────── */

export function ExpectedMetrics() {
  return (
    <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3 lg:grid-cols-4">
      {RESULTADOS_ATIVACAO.map((m, i) => (
        <Reveal as="li" key={m} delay={i * 0.03}>
          <div className="flex h-full items-center gap-3 p-4" style={{ backgroundColor: C.bg }}>
            <span className="font-mono text-[10px] tabular-nums text-white/30">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-[13px] font-medium leading-snug text-white/85">{m}</span>
          </div>
        </Reveal>
      ))}
    </ul>
  );
}

/* ── Sub-título de bloco interno ───────────────────────────────────────── */

function BlockTitle({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mb-6">
      <h3 className="font-title text-xl font-bold uppercase tracking-tight text-white md:text-2xl">{children}</h3>
      {note && <p className="mt-1.5 text-sm text-white/45">{note}</p>}
    </div>
  );
}

/* ── Social Club: um sábado em duas janelas ────────────────────────────── */

/** Painel de uma janela (dia ou noite) com os itens do sábado. */
function WindowPanel({
  tone,
  faixa,
  titulo,
  itens,
}: {
  tone: "day" | "night";
  faixa: string;
  titulo: string;
  itens: readonly string[];
}) {
  const night = tone === "night";
  const accent = night ? C.red : C.gold;
  return (
    <div
      className="flex h-full flex-col rounded-2xl border p-5 md:p-6"
      style={{
        borderColor: `${accent}40`,
        backgroundColor: night ? `${C.red}12` : "rgba(255,255,255,0.035)",
      }}
    >
      <div className="flex items-center gap-2">
        <Icon name={night ? "Moon" : "Sun"} className="h-4 w-4" color={accent} />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: accent }}>
          {faixa}
        </span>
      </div>
      <h4 className="mt-3 font-title text-xl font-bold uppercase leading-tight tracking-tight text-white">{titulo}</h4>
      <ul className="mt-4 space-y-2">
        {itens.map((it) => (
          <li key={it} className="flex items-start gap-2.5 text-[13px] leading-snug text-white/80">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * O sábado do Social Club: uma barra de tempo com duas janelas abertas (dia e
 * noite) e o intervalo fechado entre elas, e os dois painéis de programação.
 */
export function SocialClubSaturday() {
  const closedHatch = `repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 6px, transparent 6px 12px)`;
  return (
    <div>
      <p className="mb-6 flex items-start gap-2.5 text-sm text-white/55">
        <span className="mt-0.5">
          <RibbonMark color={C.gold} />
        </span>
        {SABADO.motivo}
      </p>

      {/* barra de tempo: aberto · fechado · aberto (proporcional às horas). A cor
          conta a história (dourado = dia aberto, hachura = fechado, vermelho =
          noite); o rótulo fica só com o intervalo de horas. */}
      <div className="flex items-stretch gap-1.5" role="img" aria-label="Linha do tempo do sábado: aberto de manhã até 12h, fechado das 12h às 18h, aberto das 18h à madrugada">
        <div className="flex h-11 min-w-0 flex-[5] items-center justify-center rounded-lg px-1.5" style={{ backgroundColor: `${C.gold}26`, border: `1px solid ${C.gold}59` }}>
          <span className="truncate font-mono text-[9px] uppercase tracking-wider sm:text-[10px]" style={{ color: C.gold }}>
            7h–12h
          </span>
        </div>
        <div className="flex h-11 min-w-0 flex-[6] items-center justify-center rounded-lg border border-white/10 px-1.5" style={{ backgroundImage: closedHatch }}>
          <span className="truncate font-mono text-[9px] uppercase tracking-wider text-white/45 sm:text-[10px]">12h–18h · fechado</span>
        </div>
        <div className="flex h-11 min-w-0 flex-[6] items-center justify-center rounded-lg px-1.5" style={{ backgroundColor: `${C.red}26`, border: `1px solid ${C.red}59` }}>
          <span className="truncate font-mono text-[9px] uppercase tracking-wider sm:text-[10px]" style={{ color: C.red }}>
            18h–0h
          </span>
        </div>
      </div>

      {/* as duas janelas, com o intervalo entre elas */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
        <WindowPanel tone="day" faixa={SABADO.dia.faixa} titulo={SABADO.dia.titulo} itens={SABADO.dia.itens} />

        <div className="flex items-center justify-center lg:w-32">
          <div className="flex w-full flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 lg:h-full lg:flex-col lg:justify-center lg:text-center">
            <Icon name="Clock" className="h-5 w-5 shrink-0 text-white/40" />
            <div>
              <p className="font-title text-sm font-bold uppercase leading-tight tracking-tight text-white">
                {SABADO.intervalo.fecha} fecha
                <br className="hidden lg:block" /> · {SABADO.intervalo.reabre} reabre
              </p>
              <p className="mt-1 text-[11px] leading-snug text-white/45">{SABADO.intervalo.nota}</p>
            </div>
          </div>
        </div>

        <WindowPanel tone="night" faixa={SABADO.noite.faixa} titulo={SABADO.noite.titulo} itens={SABADO.noite.itens} />
      </div>
    </div>
  );
}

/* ══ Seção completa ════════════════════════════════════════════════════════ */

export function ActivationSection() {
  const A = ATIVACOES[0];
  const B = ATIVACOES[1];
  return (
    <Section id="formatos-ativacao" tone="base">
      <SectionHeader
        eyebrow="Formatos de ativação"
        title="Do desafio digital à experiência presencial"
        text={
          <>
            <p className="font-title text-lg uppercase tracking-tight text-white/85 md:text-xl">
              Dois formatos de ativação. A mesma plataforma de comunidade, dados e conteúdo.
            </p>
            <p className="mt-4">
              O Ultra Balance Challenge prepara a comunidade durante 21 dias. A experiência presencial pode acontecer em
              dois níveis diferentes, dependendo da dimensão, do investimento e do objetivo da campanha.
            </p>
          </>
        }
      />

      {/* dois formatos lado a lado no desktop, empilhados no celular */}
      <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-2">
        <ActivationFormatCard
          nome={A.nome}
          selo={A.selo}
          frase={A.frase}
          desc={A.desc}
          indicadores={A.indicadores}
          recomendado={A.recomendado}
        >
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[13px] leading-snug text-white/60">
              Um sábado só, aproveitando o corre do Somma: dia até as 12h, festa a partir das 18h. O roteiro completo
              está logo abaixo.
            </p>
          </div>
        </ActivationFormatCard>

        <ActivationFormatCard
          nome={B.nome}
          selo={B.selo}
          frase={B.frase}
          desc={B.desc}
          indicadores={B.indicadores}
          recomendado={B.recomendado}
        >
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <CampaignTimeline />
          </div>
        </ActivationFormatCard>
      </div>

      {/* O sábado do Social Club */}
      <div className="mt-16">
        <BlockTitle note="Um único sábado, dividido em duas janelas: o dia da corrida e a noite da festa.">
          Social Club · um sábado, do corre à festa
        </BlockTitle>
        <Reveal>
          <SocialClubSaturday />
        </Reveal>
      </div>

      {/* Experiência dia/noite */}
      <div className="mt-16">
        <BlockTitle note="O dia é de corrida e wellness; a música vai do pagode, ainda de dia, à virada eletrônica e ao funk na noite.">
          A experiência, do dia à noite
        </BlockTitle>
        <Reveal>
          <DayNightExperience />
        </Reveal>
      </div>

      {/* Programação do Grand Finale */}
      <div className="mt-16">
        <BlockTitle note="Horários são exemplos conceituais e podem ser adaptados.">
          Grand Finale · programação de um dia
        </BlockTitle>
        <EventSchedule blocos={FINALE_SCHEDULE} variant="column" />
      </div>

      {/* Modelo de acesso */}
      <div className="mt-16">
        <BlockTitle>Um evento aberto para a cidade, com benefícios para quem viveu os 21 dias</BlockTitle>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <TableScroll label="Modelo de acesso ao evento">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: `${C.gold}59` }}>
                  <th className="px-4 py-3.5 font-title text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
                    Público
                  </th>
                  <th className="px-4 py-3.5 font-title text-xs font-semibold uppercase tracking-[0.15em] text-white/55">
                    Como acessa
                  </th>
                </tr>
              </thead>
              <tbody>
                {ACESSO.map((r) => (
                  <tr key={r.publico} className="border-b border-white/[0.08]">
                    <td className="px-4 py-3.5 font-medium text-white/85">{r.publico}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-2 text-white/70"
                        style={"destaque" in r && r.destaque ? { color: C.red } : undefined}
                      >
                        {"destaque" in r && r.destaque && <Icon name="QrCode" className="h-4 w-4" />}
                        {r.forma}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>

          <Panel>
            <div className="p-5 md:p-6">
              <MonoLabel color={C.gold}>Critério para a gratuidade</MonoLabel>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                A entrada gratuita deve ser liberada apenas para participantes que atinjam um critério mínimo. Exemplos:
              </p>
              <ul className="mt-4 space-y-2.5">
                {CRITERIOS_GRATUIDADE.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-[13px] leading-snug text-white/80">
                    <span className="mt-0.5">
                      <RibbonMark color={C.gold} />
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </div>
      </div>

      {/* Modelo de ingressos */}
      <div className="mt-16">
        <BlockTitle note="Nomes, preços e horários são conceituais.">Modelo de ingressos</BlockTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {INGRESSOS.map((t, i) => (
            <Reveal key={t.nome} delay={i * 0.05} className="h-full">
              <TicketAccessCard nome={t.nome} desc={t.desc} gratuito={"gratuito" in t ? t.gratuito : undefined} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* Tabela comparativa */}
      <div className="mt-16">
        <BlockTitle>Os dois formatos, lado a lado</BlockTitle>
        <ActivationComparisonTable />
      </div>

      {/* Recomendação */}
      <div className="mt-16">
        <RecommendationBanner />
      </div>

      {/* Resultados esperados */}
      <div className="mt-16">
        <BlockTitle note="Indicadores acompanhados nos dois formatos.">O que a marca acompanha</BlockTitle>
        <ExpectedMetrics />
        <FakeDataNote />
      </div>

      <p className="mt-12 text-[11px] leading-relaxed text-white/30">
        Consumo responsável. Experimentação e acesso às áreas de bebidas alcoólicas destinados exclusivamente ao público
        maior de 18 anos.
      </p>
    </Section>
  );
}
