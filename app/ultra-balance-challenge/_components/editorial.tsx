"use client";

import { C, INDICADORES, RANKING_TIPOS, PILARES, PERFIS } from "../data";
import { Reveal } from "./base";

/**
 * Blocos editoriais.
 *
 * Substituem o padrão de "card arredondado com ícone em quadradinho colorido e
 * lista de bolinhas", que se repetia em quatro seções e deixava tudo com o
 * mesmo peso. Aqui a hierarquia vem de numeração monoespaçada, fios finos e
 * tipografia grande, sem moldura.
 */

const TONS = [C.gold, C.orange, C.red, C.green, "#6E86D6"] as const;

/* ── Indicadores: índice em linhas, não grade de cards ─────────────────── */

export function IndicatorIndex() {
  return (
    <div className="border-t border-white/10">
      {INDICADORES.map((cat, i) => (
        <Reveal key={cat.categoria} delay={i * 0.05}>
          <div className="grid gap-x-8 gap-y-4 border-b border-white/10 py-7 md:grid-cols-[minmax(0,260px)_1fr] md:py-8">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[11px] tabular-nums" style={{ color: TONS[i % TONS.length] }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-title text-2xl font-bold uppercase leading-none tracking-tight text-white md:text-3xl">
                {cat.categoria}
              </h3>
            </div>
            <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {cat.itens.map((it) => (
                <li key={it} className="flex items-baseline gap-3 text-[15px] text-white/65">
                  <span
                    className="h-px w-4 shrink-0 translate-y-[-0.3em]"
                    style={{ backgroundColor: `${TONS[i % TONS.length]}80` }}
                    aria-hidden
                  />
                  {it}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* ── Rankings: faixa de modos, sem ícone e sem caixa ───────────────────── */

export function RankingModes() {
  const tons = [C.gold, C.orange, C.green, C.red];
  return (
    <div className="grid gap-px overflow-hidden bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
      {RANKING_TIPOS.map((r, i) => (
        <Reveal key={r.title} delay={i * 0.06} className="h-full">
          <div className="flex h-full flex-col p-6 md:p-7" style={{ backgroundColor: C.bg }}>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] tabular-nums" style={{ color: tons[i] }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="h-px flex-1" style={{ backgroundColor: `${tons[i]}59` }} aria-hidden />
            </div>
            <h3 className="mt-6 font-title text-2xl font-bold uppercase leading-[1.05] tracking-tight text-white md:text-[1.7rem]">
              {r.title.replace("Ranking ", "")}
            </h3>
            <p className="mt-auto pt-5 text-sm leading-snug text-white/55">{r.text}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* ── Missões: três colunas com código por pilar ────────────────────────── */

const SIGLAS: Record<string, string> = { movimento: "MOV", conexao: "CON", diversao: "DIV" };

export function PillarColumns() {
  return (
    <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
      {PILARES.map((p, i) => (
        <Reveal key={p.key} delay={i * 0.07}>
          <div>
            <div className="h-[3px] w-full" style={{ backgroundColor: p.color }} aria-hidden />
            <div className="mt-5 flex items-baseline justify-between">
              <h3
                className="font-title text-3xl font-bold uppercase leading-none tracking-tight md:text-4xl"
                style={{ color: p.color }}
              >
                {p.title}
              </h3>
              <span className="font-mono text-[11px] tabular-nums text-white/30">
                {String(p.missoes.length).padStart(2, "0")} missões
              </span>
            </div>
            <ol className="mt-6">
              {p.missoes.map((m, j) => (
                <li key={m} className="flex items-baseline gap-4 border-t border-white/[0.09] py-3.5">
                  <span className="font-mono text-[10px] tabular-nums" style={{ color: `${p.color}CC` }}>
                    {SIGLAS[p.key]}.{String(j + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] leading-snug text-white/80">{m}</span>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* ── Perfis: linhas, não cartões ───────────────────────────────────────── */

export function ProfileRows() {
  return (
    <div className="border-t border-white/10">
      {PERFIS.map((p, i) => (
        <Reveal key={p.title} delay={i * 0.05}>
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-white/10 py-5">
            <span className="font-mono text-[10px] tabular-nums" style={{ color: p.color }}>
              P.{String(i + 1).padStart(2, "0")}
            </span>
            <h4
              className="font-title text-xl font-bold uppercase leading-none tracking-tight md:text-2xl"
              style={{ color: p.color }}
            >
              {p.title}
            </h4>
            <p className="w-full text-sm text-white/55 sm:ml-auto sm:w-auto sm:max-w-sm sm:text-right">{p.text}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
