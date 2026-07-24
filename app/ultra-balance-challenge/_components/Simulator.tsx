"use client";

import { useCallback, useMemo, useReducer } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { C, PERFIS } from "../data";
import { Icon } from "./icons";
import { MonoLabel, Panel, RibbonMark, Corners, Grid, SectionHeader, Reveal } from "./base";

// A cena só existe no cliente e nunca bloqueia o resto da página.
const JourneyScene = dynamic(() => import("./JourneyScene").then((m) => m.JourneyScene), { ssr: false });

/* ── Estado ────────────────────────────────────────────────────────────── */

const CREWS = [
  { id: "performance", name: "Performance Crew", cor: C.navy, desc: "Quem vai atrás de tempo." },
  { id: "social", name: "Social Crew", cor: C.orange, desc: "Quem corre pela conversa." },
  { id: "enjoy", name: "Enjoy Crew", cor: C.green, desc: "Quem vai pelo prazer do trajeto." },
  { id: "first", name: "First Run Crew", cor: C.red, desc: "Quem está começando agora." },
] as const;

const MISSOES = [
  { id: "m1", pilar: "Movimento", label: "Treino concluído", pts: 10, dias: 1, cor: C.navy, icon: "Activity" },
  { id: "m2", pilar: "Movimento", label: "Treino Somma com QR Code", pts: 20, dias: 1, cor: C.navy, icon: "QrCode" },
  { id: "m3", pilar: "Conexão", label: "Correr com alguém novo", pts: 15, dias: 1, cor: C.orange, icon: "Users" },
  { id: "m4", pilar: "Conexão", label: "Convidar novo participante", pts: 20, dias: 1, cor: C.orange, icon: "UserPlus" },
  { id: "m5", pilar: "Diversão", label: "Ritual de equilíbrio", pts: 10, dias: 1, cor: C.green, icon: "PartyPopper" },
  { id: "m6", pilar: "Diversão", label: "Semana completa", pts: 30, dias: 3, cor: C.green, icon: "ListChecks" },
] as const;

type Estado = {
  etapa: number;
  perfil: string | null;
  crew: (typeof CREWS)[number] | null;
  feitas: string[];
  pontos: number;
  dias: number;
};

type Acao =
  | { t: "perfil"; v: string }
  | { t: "crew"; v: (typeof CREWS)[number] }
  | { t: "missao"; v: (typeof MISSOES)[number] }
  | { t: "avancar" }
  | { t: "voltar" }
  | { t: "reset" };

const INICIAL: Estado = { etapa: 0, perfil: null, crew: null, feitas: [], pontos: 0, dias: 0 };

function reducer(s: Estado, a: Acao): Estado {
  switch (a.t) {
    case "perfil":
      return { ...s, perfil: a.v, etapa: 1 };
    case "crew":
      return { ...s, crew: a.v, etapa: 2 };
    case "missao": {
      if (s.feitas.includes(a.v.id)) return s;
      return {
        ...s,
        feitas: [...s.feitas, a.v.id],
        pontos: s.pontos + a.v.pts,
        dias: Math.min(21, s.dias + a.v.dias),
      };
    }
    case "avancar":
      return { ...s, etapa: Math.min(3, s.etapa + 1) };
    case "voltar":
      return { ...s, etapa: Math.max(0, s.etapa - 1) };
    case "reset":
      return INICIAL;
  }
}

const ETAPAS = ["Perfil", "Crew", "Missões", "Resultado"] as const;

/* ── Componente ────────────────────────────────────────────────────────── */

export function Simulator() {
  const [s, dispatch] = useReducer(reducer, INICIAL);

  // O dia mostrado na cena 3D combina as missões feitas com um piso por etapa,
  // então a trilha nunca fica totalmente apagada depois que a jornada começa.
  const diaCena = useMemo(() => Math.max(s.dias, s.etapa > 0 ? 1 : 0), [s.dias, s.etapa]);
  const progresso = Math.round((s.dias / 21) * 100);
  const badge = s.dias >= 21 ? "21 Days Finisher" : s.dias >= 14 ? "Balanced" : s.dias >= 7 ? "Connected" : "Starter";
  const podeAvancar = s.etapa === 2 && s.feitas.length > 0;

  const escolherMissao = useCallback((m: (typeof MISSOES)[number]) => dispatch({ t: "missao", v: m }), []);

  return (
    <section id="simulador" className="relative overflow-hidden px-5 py-16 text-white md:px-8 md:py-24" style={{ backgroundColor: C.bgAlt }}>
      <Grid opacity={0.05} />
      <div className="relative mx-auto w-full max-w-6xl">
        <SectionHeader
          eyebrow="Simulador"
          title={
            <>
              Percorra a jornada <span style={{ color: C.red }}>agora</span>
            </>
          }
          text="Escolha um perfil, entre numa crew e cumpra missões. A trilha ao lado é a mesma dos 21 dias, e acende conforme você avança."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-10">
          {/* ── Painel de interação ───────────────────────────────────── */}
          <Panel className="min-h-[560px]">
            {/* trilho de etapas */}
            <div className="flex items-center gap-1 border-b border-white/10 px-4 py-3 sm:px-6">
              {ETAPAS.map((e, i) => {
                const ativo = i === s.etapa;
                const feito = i < s.etapa;
                return (
                  <div key={e} className="flex flex-1 items-center gap-1.5">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] transition-colors"
                      style={
                        ativo
                          ? { backgroundColor: C.red, color: "#fff" }
                          : feito
                            ? { backgroundColor: `${C.gold}33`, color: C.gold }
                            : { backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }
                      }
                    >
                      {feito ? <Icon name="Check" className="h-3 w-3" /> : i + 1}
                    </span>
                    <span
                      className={`hidden font-title text-xs uppercase tracking-wider sm:inline ${ativo ? "text-white" : "text-white/40"}`}
                    >
                      {e}
                    </span>
                    {i < ETAPAS.length - 1 && <span className="ml-auto h-px flex-1 bg-white/10" />}
                  </div>
                );
              })}
            </div>

            <div className="p-5 sm:p-7">
              <AnimatePresence mode="wait">
                {/* ── Etapa 1: perfil ───────────────────────────────── */}
                {s.etapa === 0 && (
                  <motion.div
                    key="perfil"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <MonoLabel>passo 01</MonoLabel>
                    <h3 className="mt-2 font-title text-2xl font-bold uppercase tracking-tight md:text-3xl">
                      Qual é o seu motivo para correr?
                    </h3>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {PERFIS.map((p) => (
                        <button
                          key={p.title}
                          type="button"
                          onClick={() => dispatch({ t: "perfil", v: p.title })}
                          className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-white/25 hover:bg-white/[0.07]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-title text-lg font-bold uppercase tracking-tight" style={{ color: p.color }}>
                              {p.title}
                            </span>
                            <Icon
                              name="ArrowRight"
                              className="h-4 w-4 text-white/25 transition-transform group-hover:translate-x-1 group-hover:text-white/70"
                            />
                          </div>
                          <p className="mt-1.5 text-sm text-white/55">{p.text}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── Etapa 2: crew ─────────────────────────────────── */}
                {s.etapa === 1 && (
                  <motion.div
                    key="crew"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <MonoLabel>passo 02</MonoLabel>
                    <h3 className="mt-2 font-title text-2xl font-bold uppercase tracking-tight md:text-3xl">
                      Escolha sua crew
                    </h3>
                    <p className="mt-2 text-sm text-white/55">
                      A crew define com quem você compete e some pontos no ranking coletivo.
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {CREWS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => dispatch({ t: "crew", v: c })}
                          className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-white/25 hover:bg-white/[0.07]"
                        >
                          <span className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: c.cor }} aria-hidden />
                          <span>
                            <span className="block font-title text-base font-semibold uppercase tracking-tight text-white">
                              {c.name}
                            </span>
                            <span className="mt-0.5 block text-[13px] text-white/50">{c.desc}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatch({ t: "voltar" })}
                      className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-white/35 transition-colors hover:text-white/70"
                    >
                      ← voltar
                    </button>
                  </motion.div>
                )}

                {/* ── Etapa 3: missões ──────────────────────────────── */}
                {s.etapa === 2 && (
                  <motion.div
                    key="missoes"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <MonoLabel>passo 03</MonoLabel>
                    <h3 className="mt-2 font-title text-2xl font-bold uppercase tracking-tight md:text-3xl">
                      Cumpra missões
                    </h3>
                    <p className="mt-2 text-sm text-white/55">
                      Toque para concluir. Cada missão soma pontos e avança dias na trilha.
                    </p>
                    <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                      {MISSOES.map((m) => {
                        const feita = s.feitas.includes(m.id);
                        return (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => escolherMissao(m)}
                              disabled={feita}
                              aria-pressed={feita}
                              className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                                feita ? "cursor-default" : "hover:border-white/25 hover:bg-white/[0.07]"
                              }`}
                              style={
                                feita
                                  ? { borderColor: `${m.cor}66`, backgroundColor: `${m.cor}1F` }
                                  : { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)" }
                              }
                            >
                              <span
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                style={{ backgroundColor: `${m.cor}26`, color: m.cor }}
                              >
                                <Icon name={feita ? "Check" : m.icon} className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: m.cor }}>
                                  {m.pilar}
                                </span>
                                <span className="mt-0.5 block truncate text-[13px] font-medium text-white">{m.label}</span>
                              </span>
                              <span className="shrink-0 font-title text-base font-bold" style={{ color: feita ? m.cor : "rgba(255,255,255,0.45)" }}>
                                +{m.pts}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => dispatch({ t: "avancar" })}
                        disabled={!podeAvancar}
                        className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-title text-sm font-semibold uppercase tracking-wider text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
                        style={{ backgroundColor: C.red }}
                      >
                        Ver meu resultado
                        <Icon name="ArrowRight" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => dispatch({ t: "voltar" })}
                        className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/35 transition-colors hover:text-white/70"
                      >
                        ← voltar
                      </button>
                      {!podeAvancar && (
                        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
                          conclua ao menos uma missão
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── Etapa 4: resultado ────────────────────────────── */}
                {s.etapa === 3 && (
                  <motion.div
                    key="resultado"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MonoLabel>passo 04</MonoLabel>
                    <h3 className="mt-2 font-title text-2xl font-bold uppercase tracking-tight md:text-3xl">
                      Seu card no fim do desafio
                    </h3>
                    <p className="mt-2 text-sm text-white/55">
                      É essa arte que a máquina de fotos gera quando o QR Code é escaneado no evento.
                    </p>

                    <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row">
                      {/* card gerado */}
                      <div
                        className="relative w-full max-w-[264px] shrink-0 overflow-hidden rounded-2xl shadow-2xl"
                        style={{ backgroundColor: C.navy }}
                      >
                        <Corners color={`${C.gold}99`} />
                        <div className="px-5 pb-5 pt-6 text-center">
                          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/55">
                            Ultra Balance Challenge
                          </p>
                          <p className="mt-3 font-title text-5xl font-bold leading-none text-white">{s.dias}</p>
                          <p className="font-title text-xs uppercase tracking-[0.2em] text-white/60">de 21 dias</p>
                          <div className="my-4 h-px w-full bg-white/20" />
                          <dl className="space-y-2 text-left">
                            {[
                              ["Perfil", s.perfil ?? "—"],
                              ["Crew", s.crew?.name ?? "—"],
                              ["Pontos", String(s.pontos)],
                              ["Conquista", badge],
                            ].map(([k, v]) => (
                              <div key={k} className="flex items-baseline justify-between gap-3">
                                <dt className="font-mono text-[9px] uppercase tracking-wider text-white/45">{k}</dt>
                                <dd className="truncate font-title text-[13px] font-semibold text-white">{v}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                        <div className="flex items-center justify-center py-2.5" style={{ backgroundColor: C.red }}>
                          <span className="font-title text-[10px] font-semibold uppercase tracking-[0.25em] text-white">
                            Social Run
                          </span>
                        </div>
                      </div>

                      {/* leitura do resultado */}
                      <div className="flex-1">
                        <ul className="space-y-3">
                          {[
                            ["Pontuação", `${s.pontos} pontos`, C.red],
                            ["Progresso", `${progresso}% dos 21 dias`, C.gold],
                            ["Missões", `${s.feitas.length} de ${MISSOES.length} concluídas`, C.orange],
                            ["Badge", badge, C.green],
                          ].map(([k, v, cor]) => (
                            <li key={k} className="flex items-center gap-3">
                              <RibbonMark color={cor as string} />
                              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</span>
                              <span className="ml-auto font-title text-base font-semibold text-white">{v}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-6 text-[13px] leading-relaxed text-white/50">
                          Cada escolha aqui vira um dado: perfil, crew, missões cumpridas, ritmo de progresso e presença.
                          É esse conjunto que alimenta o painel da marca.
                        </p>
                        <button
                          type="button"
                          onClick={() => dispatch({ t: "reset" })}
                          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 font-title text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
                        >
                          <Icon name="RotateCcw" className="h-3.5 w-3.5" />
                          Simular de novo
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Panel>

          {/* ── Trilha 3D + leitura ao vivo ───────────────────────────── */}
          <div className="flex flex-col gap-4">
            <Panel className="relative h-[320px] lg:h-[420px]">
              <JourneyScene day={diaCena} />
              <div className="pointer-events-none absolute left-4 top-4">
                <MonoLabel>trilha dos 21 dias</MonoLabel>
              </div>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
                style={{ background: `linear-gradient(to top, ${C.bgAlt}, transparent)` }}
                aria-hidden
              />
              <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <p className="font-title text-4xl font-bold leading-none text-white">
                    {s.dias}
                    <span className="text-lg text-white/40"> / 21</span>
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">dias na trilha</p>
                </div>
                <p className="font-title text-3xl font-bold leading-none" style={{ color: C.red }}>
                  {s.pontos}
                  <span className="ml-1 text-xs font-normal text-white/40">pts</span>
                </p>
              </div>
            </Panel>

            {/* barra de progresso */}
            <Panel>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <MonoLabel color="rgba(255,255,255,0.4)">progresso</MonoLabel>
                  <span className="font-title text-sm font-bold" style={{ color: C.gold }}>
                    {progresso}%
                  </span>
                </div>
                <div className="mt-2.5 grid grid-cols-[repeat(21,minmax(0,1fr))] gap-[3px]">
                  {Array.from({ length: 21 }).map((_, i) => (
                    <span
                      key={i}
                      className="aspect-square rounded-[2px] transition-colors duration-500"
                      style={{ backgroundColor: i < s.dias ? C.red : "rgba(255,255,255,0.08)" }}
                    />
                  ))}
                </div>
                <p className="mt-3 text-[11px] leading-snug text-white/35">
                  Números do simulador são ilustrativos e servem para demonstrar a mecânica.
                </p>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Bloco de chamada para o simulador, usado logo depois do hero. */
export function SimulatorTeaser() {
  return (
    <Reveal>
      <a
        href="#simulador"
        className="group mt-10 inline-flex items-center gap-3 rounded-full border px-5 py-3 transition-colors hover:bg-white/[0.06]"
        style={{ borderColor: `${C.gold}59` }}
      >
        <RibbonMark color={C.gold} />
        <span className="font-title text-sm font-semibold uppercase tracking-[0.12em] text-white">
          Testar a experiência
        </span>
        <Icon name="ArrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-1" color={C.gold} />
      </a>
    </Reveal>
  );
}
