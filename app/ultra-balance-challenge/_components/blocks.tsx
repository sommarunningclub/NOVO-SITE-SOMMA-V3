"use client";

import {
  C,
  TIMELINE,
  ENGAJAMENTO,
  RANKING_LINHAS,
  STACK,
  PESOS,
  PONTOS,
  VALIDACAO,
  RECOMPENSAS,
  BADGES,
} from "../data";
import { Icon, Reveal, TableScroll, FakeDataNote, Lockup } from "./base";
import { DashboardMockup } from "./mockups";

/* ── Linha do tempo dos 21 dias ────────────────────────────────────────── */

export function Timeline() {
  const cor = { navy: C.navy, orange: C.orange, red: C.red } as const;
  return (
    <ol className="relative grid gap-8 md:grid-cols-4 md:gap-6">
      <span
        className="absolute left-[11px] top-2 hidden h-[calc(100%-1rem)] w-px bg-black/10 md:left-0 md:top-[11px] md:h-px md:w-full md:bg-gradient-to-r md:from-black/10 md:via-black/15 md:to-black/5 md:block"
        aria-hidden
      />
      {TIMELINE.map((t, i) => (
        <Reveal as="li" key={t.dia} delay={i * 0.07} className="relative pl-9 md:pl-0">
          <span
            className="absolute left-0 top-1 h-6 w-6 rounded-full border-4 border-white ring-1 ring-black/10 md:relative md:mb-5 md:block"
            style={{ backgroundColor: cor[t.accent] }}
            aria-hidden
          />
          <p className="font-title text-sm font-bold uppercase tracking-[0.2em]" style={{ color: cor[t.accent] }}>
            {t.dia}
          </p>
          <p className="mt-1.5 text-[15px] font-medium leading-snug text-[#0E1226]">{t.title}</p>
        </Reveal>
      ))}
    </ol>
  );
}

/* ── Curva de engajamento (ilustrativa) ────────────────────────────────── */

export function EngagementChart() {
  const w = 640;
  const h = 180;
  const pts = ENGAJAMENTO.map((v, i) => {
    const x = (i / (ENGAJAMENTO.length - 1)) * w;
    const y = h - (v / 100) * (h - 16) - 8;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <figure>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full"
        role="img"
        aria-label="Curva conceitual de engajamento crescendo ao longo dos 21 dias do desafio"
      >
        <defs>
          <linearGradient id="ubc-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.navy} stopOpacity="0.28" />
            <stop offset="100%" stopColor={C.navy} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="#0E1226" strokeOpacity="0.07" strokeWidth="1" />
        ))}
        <path d={area} fill="url(#ubc-grad)" />
        <path d={line} fill="none" stroke={C.navy} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="5" fill={C.red} />
      </svg>
      <figcaption className="mt-3 flex items-center justify-between text-xs text-[#5A6178]">
        <span>Dia 1</span>
        <span className="italic">Exemplo conceitual de curva de engajamento</span>
        <span>Dia 21</span>
      </figcaption>
    </figure>
  );
}

/* ── Fluxo horizontal com setas ────────────────────────────────────────── */

export function FlowDiagram({
  steps,
  onDark = false,
  numbered = false,
}: {
  steps: readonly { icon?: string; title: string; text?: string }[];
  onDark?: boolean;
  numbered?: boolean;
}) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((s, i) => (
        <Reveal as="li" key={s.title} delay={i * 0.06}>
          <div
            className={`flex h-full items-start gap-4 rounded-2xl border p-5 ${
              onDark ? "border-white/12 bg-white/[0.06]" : "border-black/[0.07] bg-white"
            }`}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-title text-sm font-bold"
              style={{
                backgroundColor: onDark ? "rgba(255,255,255,0.1)" : `${C.navy}12`,
                color: onDark ? "#fff" : C.navy,
              }}
            >
              {numbered ? String(i + 1).padStart(2, "0") : s.icon ? <Icon name={s.icon} className="h-5 w-5" /> : null}
            </span>
            <div>
              <h3
                className={`font-title text-base font-semibold uppercase leading-tight tracking-tight md:text-lg ${
                  onDark ? "text-white" : "text-[#0E1226]"
                }`}
              >
                {s.title}
              </h3>
              {s.text && (
                <p className={`mt-1.5 text-sm leading-relaxed ${onDark ? "text-white/65" : "text-[#5A6178]"}`}>
                  {s.text}
                </p>
              )}
            </div>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

/** Fluxo compacto em linha, para cadeias curtas como a de validação. */
export function ChainFlow({ items, onDark = false }: { items: readonly string[]; onDark?: boolean }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {items.map((it, i) => (
        <li key={it} className="flex items-center gap-2">
          <span
            className={`rounded-full px-4 py-2 font-title text-xs font-semibold uppercase tracking-wider md:text-sm ${
              onDark ? "bg-white/10 text-white" : "bg-white text-[#0E1226] ring-1 ring-black/[0.07]"
            }`}
          >
            {it}
          </span>
          {i < items.length - 1 && (
            <Icon
              name="ChevronRight"
              className={`h-4 w-4 ${onDark ? "text-white/35" : "text-[#5A6178]/50"}`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

/* ── Cartão de missão por pilar ────────────────────────────────────────── */

export function MissionCard({
  title,
  icon,
  color,
  missoes,
}: {
  title: string;
  icon: string;
  color: string;
  missoes: readonly string[];
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
      <div className="flex items-center gap-3 px-5 py-4" style={{ backgroundColor: `${color}12` }}>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: color, color: "#fff" }}
        >
          <Icon name={icon} className="h-4.5 w-4.5" />
        </span>
        <h3 className="font-title text-xl font-bold uppercase tracking-tight" style={{ color }}>
          {title}
        </h3>
      </div>
      <ul className="flex-1 divide-y divide-black/[0.06]">
        {missoes.map((m) => (
          <li key={m} className="flex items-start gap-2.5 px-5 py-3 text-sm text-[#0E1226]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Tabela de validação ───────────────────────────────────────────────── */

export function ValidationTable() {
  return (
    <TableScroll label="Métodos de validação de atividades">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b-2" style={{ borderColor: C.navy }}>
            {["Método", "Como funciona", "Melhor aplicação"].map((h) => (
              <th key={h} className="px-4 py-3 font-title text-xs font-semibold uppercase tracking-[0.15em] text-[#5A6178]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VALIDACAO.map((v) => (
            <tr key={v.metodo} className="border-b border-black/[0.06]">
              <td className="px-4 py-3.5">
                <span className="font-title text-base font-semibold uppercase tracking-tight text-[#0E1226]">
                  {v.metodo}
                </span>
                <span
                  className="ml-2 rounded-full px-2 py-0.5 align-middle text-[9px] font-semibold uppercase tracking-wider"
                  style={
                    v.mvp
                      ? { backgroundColor: `${C.navy}14`, color: C.navy }
                      : { backgroundColor: "#F4F5F8", color: "#5A6178" }
                  }
                >
                  {v.mvp ? "no MVP" : "futuro"}
                </span>
              </td>
              <td className="px-4 py-3.5 text-[#5A6178]">{v.como}</td>
              <td className="px-4 py-3.5 text-[#5A6178]">{v.aplicacao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

/* ── Pontuação ─────────────────────────────────────────────────────────── */

export function ScoreWeights() {
  let acc = 0;
  const R = 52;
  const CIRC = 2 * Math.PI * R;
  return (
    <div className="flex flex-col items-center gap-7 sm:flex-row sm:gap-9">
      <svg viewBox="0 0 140 140" className="h-40 w-40 shrink-0 -rotate-90" role="img" aria-label="Distribuição dos pesos da pontuação">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#0E1226" strokeOpacity="0.07" strokeWidth="18" />
        {PESOS.map((p) => {
          const dash = (p.value / 100) * CIRC;
          const el = (
            <circle
              key={p.label}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={p.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${CIRC - dash}`}
              strokeDashoffset={-acc}
            />
          );
          acc += dash;
          return el;
        })}
      </svg>
      <ul className="w-full space-y-3">
        {PESOS.map((p) => (
          <li key={p.label} className="flex items-center gap-3">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: p.color }} aria-hidden />
            <span className="text-sm text-[#0E1226]">{p.label}</span>
            <span className="ml-auto font-title text-lg font-bold" style={{ color: p.color }}>
              {p.value}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PointsTable() {
  return (
    <TableScroll label="Tabela de pontos por atividade">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b-2" style={{ borderColor: C.navy }}>
            <th className="px-4 py-3 font-title text-xs font-semibold uppercase tracking-[0.15em] text-[#5A6178]">
              Atividade
            </th>
            <th className="px-4 py-3 text-right font-title text-xs font-semibold uppercase tracking-[0.15em] text-[#5A6178]">
              Pontos
            </th>
          </tr>
        </thead>
        <tbody>
          {PONTOS.map((p) => (
            <tr key={p.atividade} className="border-b border-black/[0.06]">
              <td className="px-4 py-3 text-[#0E1226]">{p.atividade}</td>
              <td className="px-4 py-3 text-right font-title text-lg font-bold" style={{ color: C.red }}>
                {p.pontos}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

/* ── Ranking ───────────────────────────────────────────────────────────── */

export function RankingTable() {
  return (
    <div>
      <TableScroll label="Exemplo de ranking do desafio">
        <table className="w-full border-collapse overflow-hidden rounded-2xl text-left text-sm">
          <caption className="sr-only">Ranking ilustrativo dos participantes</caption>
          <thead>
            <tr style={{ backgroundColor: C.navy }}>
              {["Posição", "Participante", "Crew", "Pontos"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 font-title text-xs font-semibold uppercase tracking-[0.15em] text-white ${
                    i === 3 ? "text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {RANKING_LINHAS.map((r) => (
              <tr key={r.pos} className="border-b border-black/[0.06] last:border-0">
                <td className="px-4 py-3.5">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full font-title text-sm font-bold"
                    style={
                      r.pos <= 3
                        ? { backgroundColor: `${C.red}14`, color: C.red }
                        : { backgroundColor: "#F4F5F8", color: "#5A6178" }
                    }
                  >
                    {r.pos}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-medium text-[#0E1226]">{r.nome}</td>
                <td className="px-4 py-3.5 text-[#5A6178]">{r.crew}</td>
                <td className="px-4 py-3.5 text-right font-title text-lg font-bold text-[#0E1226]">{r.pontos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
      <FakeDataNote />
    </div>
  );
}

/* ── Progressão de recompensas ─────────────────────────────────────────── */

export function RewardProgress() {
  return (
    <ol className="grid gap-4 md:grid-cols-4">
      {RECOMPENSAS.map((r, i) => (
        <Reveal as="li" key={r.marco} delay={i * 0.07} className="h-full">
          <div className="flex h-full flex-col rounded-2xl border border-white/12 bg-white/[0.06] p-5">
            <span
              className="inline-flex w-fit rounded-full px-3 py-1 font-title text-xs font-bold uppercase tracking-[0.15em] text-white"
              style={{ backgroundColor: r.color }}
            >
              {r.marco}
            </span>
            <h3 className="mt-4 font-title text-lg font-semibold uppercase leading-tight tracking-tight text-white">
              {r.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{r.text}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

export function BadgeRow() {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {BADGES.map((b, i) => (
        <Reveal as="li" key={b.name} delay={i * 0.06}>
          <div className="flex h-full flex-col items-center rounded-2xl border border-white/12 bg-white/[0.06] p-5 text-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full border-2"
              style={{ borderColor: b.color, backgroundColor: `${b.color}26` }}
              aria-hidden
            >
              <Icon name="Award" className="h-7 w-7" color={b.color} />
            </span>
            <p className="mt-3 font-title text-sm font-bold uppercase tracking-wider text-white">{b.name}</p>
            <p className="mt-1 text-[11px] leading-snug text-white/55">{b.desc}</p>
          </div>
        </Reveal>
      ))}
    </ul>
  );
}

/* ── Arquitetura ───────────────────────────────────────────────────────── */

export function TechnologyTable() {
  return (
    <TableScroll label="Camadas da arquitetura tecnológica">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b-2" style={{ borderColor: C.navy }}>
            {["Camada", "Tecnologia", "Função"].map((h) => (
              <th key={h} className="px-4 py-3 font-title text-xs font-semibold uppercase tracking-[0.15em] text-[#5A6178]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STACK.map((s) => (
            <tr key={s.camada} className="border-b border-black/[0.06]">
              <td className="px-4 py-3.5 font-title text-base font-semibold uppercase tracking-tight text-[#0E1226]">
                {s.camada}
              </td>
              <td className="px-4 py-3.5">
                <span
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                  style={{ backgroundColor: `${C.navy}12`, color: C.navy }}
                >
                  {s.tech}
                </span>
              </td>
              <td className="px-4 py-3.5 text-[#5A6178]">{s.funcao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────────── */

export function Hero() {
  return (
    <header
      className="relative overflow-hidden px-5 pb-16 pt-10 md:px-8 md:pb-24 md:pt-14"
      style={{ backgroundColor: C.navyDeep }}
    >
      {/* malha sutil de fundo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(75% 60% at 30% 40%, #000 10%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(75% 60% at 30% 40%, #000 10%, transparent 100%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-6xl">
        <Reveal>
          <Lockup onDark size="md" />
        </Reveal>

        <div className="mt-12 grid items-center gap-12 lg:mt-16 lg:grid-cols-[1.05fr_auto] lg:gap-16">
          <div>
            <Reveal delay={0.05}>
              <p
                className="font-title text-xs font-semibold uppercase tracking-[0.3em]"
                style={{ color: C.orange }}
              >
                Plataforma digital de engajamento
              </p>
              <h1 className="mt-4 font-title text-[2.6rem] font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Ultra Balance
                <br />
                <span style={{ color: C.red }}>Challenge</span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-6 max-w-xl text-lg font-light leading-snug text-white/85 md:text-2xl">
                21 dias para transformar movimento, conexão e diversão em uma experiência mensurável de marca.
              </p>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/60">
                Uma plataforma digital que engaja a comunidade antes do Michelob Ultra Social Run por meio de missões,
                pontuação, rankings, recompensas e experiências personalizadas.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 font-title text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: C.red }}
                >
                  Entenda como funciona
                  <Icon name="ArrowRight" className="h-4 w-4" />
                </a>
                <a
                  href="#jornada"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-7 py-4 font-title text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
                >
                  Ver jornada do participante
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.22} className="flex justify-center lg:justify-end">
            <DashboardMockup />
          </Reveal>
        </div>

        <Reveal delay={0.3}>
          <p className="mt-14 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-white/40 md:mt-20">
            <Icon name="ChevronDown" className="h-4 w-4 animate-bounce" />
            role para ver a plataforma
          </p>
        </Reveal>
      </div>
    </header>
  );
}

/* ── CTA final ─────────────────────────────────────────────────────────── */

export function FinalCTA() {
  return (
    <section className="px-5 py-20 text-center md:px-8 md:py-28" style={{ backgroundColor: C.navyDeep }}>
      <div className="mx-auto w-full max-w-4xl">
        <Reveal className="flex justify-center">
          <Lockup onDark size="lg" />
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="mt-12 font-title text-[2rem] font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl">
            A campanha começa antes da <span style={{ color: C.red }}>linha de largada</span>.
          </h2>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-white/70 md:text-lg">
            Com o Ultra Balance Challenge, Somma e Michelob Ultra transformam três semanas de participação em dados,
            conteúdo, relacionamento e uma experiência presencial inesquecível.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-10 font-title text-xl font-semibold uppercase tracking-[0.15em] text-white md:text-2xl">
            Corra pelo momento. <span style={{ color: C.red }}>Fique pela experiência.</span>
          </p>
        </Reveal>
        <p className="mx-auto mt-14 max-w-2xl text-[11px] leading-relaxed text-white/35">
          Consumo responsável. Ações relacionadas à experimentação de bebidas alcoólicas destinadas exclusivamente ao
          público maior de 18 anos.
        </p>
      </div>
    </section>
  );
}
