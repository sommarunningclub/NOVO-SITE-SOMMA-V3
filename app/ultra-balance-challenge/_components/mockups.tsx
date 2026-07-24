"use client";

import { C, HERO_STATS, PAINEL_KPIS, FUNIL, ENGAJAMENTO_PILAR, CARD_SAIDA_CAMPOS } from "../data";
import { Icon } from "./icons";

/* ── Carcaça de celular ────────────────────────────────────────────────── */

export function PhoneMockup({
  children,
  className = "",
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`relative w-[276px] shrink-0 rounded-[2.4rem] border-[7px] border-[#0A1030] bg-[#0A1030] shadow-2xl ${className}`}
    >
      <div className="relative overflow-hidden rounded-[1.9rem]" style={{ backgroundColor: C.navyDeep }}>
        <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[10px] font-medium text-white/60">
          <span>9:41</span>
          <span className="h-4 w-16 rounded-full bg-black/40" aria-hidden />
          <span className="flex items-center gap-1">
            <Icon name="Wifi" className="h-3 w-3" />
            <Icon name="BatteryFull" className="h-3.5 w-3.5" />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Dashboard do participante ─────────────────────────────────────────── */

export function DashboardMockup() {
  const dias = 15;
  return (
    <PhoneMockup label="Dashboard do participante no Ultra Balance Challenge, com 15 de 21 dias concluídos">
      <div className="px-4 pb-5 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/45">Ultra Balance</p>
            <p className="font-title text-base font-semibold uppercase tracking-tight text-white">Challenge</p>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-white"
            style={{ backgroundColor: C.orange }}
          >
            Social Crew
          </span>
        </div>

        {/* progresso */}
        <div className="mt-4 rounded-2xl bg-white/[0.07] p-4">
          <div className="flex items-end justify-between">
            <p className="font-title text-3xl font-bold leading-none text-white">
              15<span className="text-base text-white/45"> / 21</span>
            </p>
            <p className="font-title text-xl font-bold leading-none" style={{ color: C.orange }}>
              75%
            </p>
          </div>
          <p className="mt-1 text-[10px] text-white/45">dias concluídos</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: "75%", backgroundColor: C.orange }} />
          </div>
          <div className="mt-3 grid grid-cols-[repeat(21,minmax(0,1fr))] gap-[3px]">
            {Array.from({ length: 21 }).map((_, i) => (
              <span
                key={i}
                className="aspect-square rounded-[2px]"
                style={{ backgroundColor: i < dias ? C.orange : "rgba(255,255,255,0.12)" }}
              />
            ))}
          </div>
        </div>

        {/* números */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["750", "pontos"],
            ["6", "sequência"],
            ["12º", "ranking"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-white/[0.05] px-2 py-2.5 text-center">
              <p className="font-title text-lg font-bold leading-none text-white">{v}</p>
              <p className="mt-1 text-[9px] text-white/45">{l}</p>
            </div>
          ))}
        </div>

        {/* missões por pilar */}
        <p className="mt-4 text-[9px] uppercase tracking-[0.18em] text-white/40">Missões disponíveis</p>
        <div className="mt-2 space-y-1.5">
          {HERO_STATS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2.5 rounded-xl bg-white/[0.05] px-3 py-2">
              <span
                className="h-6 w-6 shrink-0 rounded-lg"
                style={{ backgroundColor: [C.navy, C.orange, C.green][i] }}
                aria-hidden
              />
              <span className="text-[11px] font-medium text-white">{s.label}</span>
              <span className="ml-auto text-[10px] text-white/50">{s.value}</span>
            </div>
          ))}
        </div>

        {/* próxima recompensa */}
        <div className="mt-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: `${C.red}26` }}>
          <p className="text-[9px] uppercase tracking-wider" style={{ color: C.red }}>
            Próxima recompensa
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-white">em 100 pontos</p>
        </div>
      </div>
    </PhoneMockup>
  );
}

/* ── Tela de cadastro ──────────────────────────────────────────────────── */

export function SignupMockup({ campos }: { campos: readonly string[] }) {
  return (
    <PhoneMockup label="Tela de cadastro do Ultra Balance Challenge">
      <div className="px-4 pb-5 pt-3">
        <p className="font-title text-lg font-bold uppercase leading-tight text-white">Criar meu passaporte</p>
        <p className="mt-1 text-[10px] text-white/50">Leva menos de um minuto, direto no navegador.</p>
        <div className="mt-4 space-y-2">
          {campos.slice(0, 6).map((c) => (
            <div key={c} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
              <p className="text-[8px] uppercase tracking-wider text-white/40">{c}</p>
              <div className="mt-1 h-1.5 w-2/3 rounded bg-white/15" aria-hidden />
            </div>
          ))}
          {campos.slice(6).map((c) => (
            <label key={c} className="flex items-start gap-2 pt-0.5 text-[9px] leading-snug text-white/60">
              <span
                className="mt-px flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px]"
                style={{ backgroundColor: C.orange }}
                aria-hidden
              >
                <Icon name="Check" className="h-2 w-2" color="#fff" />
              </span>
              {c}
            </label>
          ))}
        </div>
        <div
          className="mt-4 rounded-lg py-2.5 text-center font-title text-[11px] font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: C.red }}
        >
          Começar o desafio
        </div>
        <p className="mt-2 text-center text-[7px] text-white/30">
          Maiores de 18 anos. Consumo responsável.
        </p>
      </div>
    </PhoneMockup>
  );
}

/* ── Card de missão do dia ─────────────────────────────────────────────── */

export function MissionOfDayMockup() {
  return (
    <div className="relative border-l-2 pl-5" style={{ borderColor: C.red }}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em]" style={{ color: C.red }}>
          missão do dia
        </span>
        <span className="font-mono text-[10px] tabular-nums text-white/35">CON.01</span>
      </div>
      <h3 className="mt-4 font-title text-3xl font-bold uppercase leading-[1.02] tracking-tight text-white md:text-4xl">
        Corra com alguém novo
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-white/55">
        Convide alguém para compartilhar seu treino de hoje.
      </p>

      <dl className="mt-6 flex items-baseline gap-8 border-t border-white/10 pt-5">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">recompensa</dt>
          <dd className="mt-1 font-title text-2xl font-bold leading-none" style={{ color: C.red }}>
            15 <span className="text-sm font-normal text-white/40">pontos</span>
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">comprovação</dt>
          <dd className="mt-1 font-title text-lg font-semibold uppercase leading-none tracking-tight text-white">
            Foto ou vídeo
          </dd>
        </div>
      </dl>

      <button
        type="button"
        className="group mt-6 inline-flex items-center gap-3 border-b pb-1 font-title text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:text-white/70"
        style={{ borderColor: `${C.red}80` }}
      >
        <Icon name="Upload" className="h-4 w-4" color={C.red} />
        Enviar comprovação
      </button>
    </div>
  );
}

/* ── Card compartilhável ───────────────────────────────────────────────── */

export function ShareCardMockup() {
  return (
    <div
      className="w-full max-w-[280px] overflow-hidden rounded-2xl shadow-xl"
      style={{ backgroundColor: C.navy }}
      role="img"
      aria-label="Card compartilhável do Ultra Balance Challenge"
    >
      <div className="px-5 pb-5 pt-6 text-center">
        <p className="font-title text-[10px] uppercase tracking-[0.25em] text-white/60">Ultra Balance Challenge</p>
        <p className="mt-3 font-title text-4xl font-bold leading-none text-white">21</p>
        <p className="font-title text-sm uppercase tracking-[0.2em] text-white/70">dias concluídos</p>
        <div className="my-5 h-px w-full bg-white/20" />
        <dl className="space-y-2 text-left">
          {[
            ["Perfil", "Comunidade"],
            ["Crew", "Social Crew"],
            ["Pontos", "750"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between">
              <dt className="text-[10px] uppercase tracking-wider text-white/50">{k}</dt>
              <dd className="font-title text-sm font-semibold text-white">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex items-center justify-center gap-3 px-5 py-3" style={{ backgroundColor: C.red }}>
        <span className="font-title text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
          Social Run
        </span>
      </div>
    </div>
  );
}

/* ── Máquina de fotos ──────────────────────────────────────────────────── */

/**
 * Mockup construído em CSS, com as logos oficiais aplicadas sem alteração.
 * Sem imagens de pessoas, conforme a direção da seção.
 */
export function PhotoMachineMockup() {
  return (
    <div
      role="img"
      aria-label="Mockup da máquina de fotos Somma x Michelob Ultra, com câmera, iluminação frontal, tela vertical e leitor de QR Code"
      className="mx-auto w-[240px] shrink-0 rounded-t-2xl px-4 pb-0 pt-5 shadow-2xl sm:w-[268px]"
      style={{ backgroundColor: C.navy }}
    >
      {/* topo: logo + câmera + luzes */}
      <div className="flex items-center justify-center pb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Michelob_Ultra_(3).png" alt="" aria-hidden className="h-4 w-auto brightness-0 invert" />
      </div>
      <div className="flex items-center justify-center gap-3 pb-4">
        <span className="h-7 w-7 rounded-md bg-white/85" aria-hidden />
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#080C24] ring-2 ring-white/20" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#2A3570]" />
        </span>
        <span className="h-7 w-7 rounded-md bg-white/85" aria-hidden />
      </div>

      {/* tela vertical */}
      <div className="rounded-lg bg-[#080C24] p-2.5">
        <div className="rounded border border-white/15 p-2.5">
          <div className="flex items-center justify-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-somma-dark.png" alt="" aria-hidden className="h-2.5 w-auto brightness-0 invert" />
            <span className="text-[7px] text-white/40">x</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Michelob_Ultra_(3).png" alt="" aria-hidden className="h-2.5 w-auto brightness-0 invert" />
          </div>
          {/* área reservada para a foto */}
          <div className="mt-2.5 flex aspect-[3/4] items-center justify-center rounded border-2 border-dashed border-white/20">
            <span className="text-[8px] uppercase tracking-widest text-white/30">área da foto</span>
          </div>
          <p className="mt-2 text-center font-title text-[9px] font-semibold uppercase tracking-[0.15em] text-white">
            Ultra Social Run
          </p>
        </div>
        <div className="mt-2.5 flex items-center justify-center gap-1.5 rounded bg-white/[0.06] py-1.5">
          <Icon name="QrCode" className="h-3 w-3" color="#fff" />
          <span className="text-[8px] uppercase tracking-wider text-white/70">Escaneie seu QR Code</span>
        </div>
      </div>

      {/* base com a marca Somma */}
      <div className="flex items-center justify-center py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-somma-dark.png" alt="" aria-hidden className="h-4 w-auto brightness-0 invert" />
      </div>
      <div className="h-1.5 w-full" style={{ backgroundColor: C.red }} aria-hidden />
      <div className="h-3 w-full rounded-b-sm bg-[#060A1C]" aria-hidden />
    </div>
  );
}

/** Card de saída, ainda sem foto, mostrando os campos que ele carrega. */
export function OutputCardMockup() {
  return (
    <div className="w-full max-w-[300px] rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-lg">
      <div className="flex aspect-[4/5] items-center justify-center rounded-xl border-2 border-dashed border-white/15 bg-white/[0.05]">
        <span className="text-[10px] uppercase tracking-widest text-white/35">espaço da foto</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2">
        {CARD_SAIDA_CAMPOS.map((c) => (
          <div key={c}>
            <dt className="text-[9px] uppercase tracking-wider text-white/35">{c}</dt>
            <dd className="mt-0.5 h-1.5 w-4/5 rounded bg-white/15" aria-hidden />
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-somma-dark.png" alt="Somma Running Club" className="h-3 w-auto" />
        <span className="text-[8px] text-white/30">x</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Michelob_Ultra_(3).png" alt="Michelob Ultra Club" className="h-3 w-auto" />
      </div>
    </div>
  );
}

/* ── Painel da marca ───────────────────────────────────────────────────── */

export function BrandDashboardMockup() {
  const max = FUNIL[0].value;
  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-lg"
      role="img"
      aria-label="Painel da marca com indicadores do Ultra Balance Challenge"
    >
      {/* barra do navegador */}
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.05] px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-[#FF5F56]" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-[#FFBD2E]" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-[#27C93F]" aria-hidden />
        <span className="ml-3 rounded bg-white px-2.5 py-0.5 text-[10px] text-white/55">
          painel.ultrabalancechallenge
        </span>
      </div>

      <div className="p-4 md:p-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {PAINEL_KPIS.map((k) => (
            <div key={k.label} className="rounded-xl bg-white/[0.05] px-3 py-3">
              <p className="font-title text-xl font-bold leading-none text-white md:text-2xl">{k.value}</p>
              <p className="mt-1 text-[10px] leading-tight text-white/55">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {/* funil */}
          <div>
            <p className="font-title text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
              Funil de participação
            </p>
            <ul className="mt-3 space-y-2">
              {FUNIL.map((f, i) => (
                <li key={f.label}>
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-white">{f.label}</span>
                    <span className="font-semibold text-white">{f.value.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(f.value / max) * 100}%`,
                        backgroundColor: i === FUNIL.length - 1 ? C.red : C.navy,
                        opacity: i === FUNIL.length - 1 ? 1 : 0.35 + i * 0.13,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* engajamento por pilar + cadastros por dia */}
          <div>
            <p className="font-title text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
              Cadastros por dia
            </p>
            <div className="mt-3 flex h-24 items-end gap-1">
              {[32, 48, 41, 66, 58, 74, 61, 83, 70, 92, 78, 96].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-t"
                  style={{ height: `${h}%`, backgroundColor: C.navy, opacity: 0.35 + i * 0.05 }}
                />
              ))}
            </div>

            <p className="mt-5 font-title text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
              Engajamento por pilar
            </p>
            <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full">
              {ENGAJAMENTO_PILAR.map((p) => (
                <span key={p.label} style={{ width: `${p.value}%`, backgroundColor: p.color }} />
              ))}
            </div>
            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
              {ENGAJAMENTO_PILAR.map((p) => (
                <li key={p.label} className="flex items-center gap-1.5 text-[11px] text-white/55">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                  {p.label} {p.value}%
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
