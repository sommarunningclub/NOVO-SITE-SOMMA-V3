"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ULTRA_PASS } from "./_dados";

/**
 * Simulação do Ultra Pass.
 *
 * Roda inteira no navegador, sem back-end: serve para mostrar na reunião como
 * o participante vê o pass e o que a marca ganha em cada etapa. À esquerda o
 * celular do participante; à direita, o que acontece do lado do Somma.
 */

const NAVY = "#283280";
const RED = "#D22030";
const GOLD = "#C6A664";
const ORANGE = "#FF2C03";

const TOTAL_SELOS = ULTRA_PASS.length;

/** O que a marca leva em cada etapa, na mesma ordem dos selos. */
const LADO_DA_MARCA = [
  {
    titulo: "Cadastro na base",
    texto:
      "Nome, telefone e e-mail entram no CRM do Somma com a origem da campanha. É o começo da base própria da Michelob para o mês.",
  },
  {
    titulo: "Presença medida no dia",
    texto:
      "O check-in da semana 1 vira número: quantos apareceram, quantos são da base Somma e quantos vieram de fora.",
  },
  {
    titulo: "Recorrência começa a aparecer",
    texto:
      "Com dois selos dá para ler quem voltou. É o primeiro sinal de frequência, que nenhuma ativação de um dia entrega.",
  },
  {
    titulo: "Base engajada identificada",
    texto:
      "Três semanas seguidas separam o público fiel do eventual. Esse grupo vira o alvo do conteúdo e dos embaixadores.",
  },
  {
    titulo: "Ciclo completo e relatório",
    texto:
      "Quem fechou as quatro semanas retira o prêmio no evento final. O relatório sai com presença, recorrência e perfil da base.",
  },
];

export function UltraPassSim() {
  const [nome, setNome] = useState("");
  const [emitido, setEmitido] = useState(false);
  const [selos, setSelos] = useState(0);

  const primeiroNome = nome.trim().split(/\s+/)[0] || "Participante";
  const completo = selos >= TOTAL_SELOS;
  const proximo = ULTRA_PASS[Math.min(selos, TOTAL_SELOS - 1)];
  const conquistado = selos > 0 ? ULTRA_PASS[selos - 1] : null;
  // Índice 0 é o cadastro; de 1 a 4, cada check-in. Antes de emitir o pass, e
  // logo depois de emitir sem nenhum check-in, a leitura é a do cadastro.
  const marca = LADO_DA_MARCA[emitido ? selos : 0];

  // QR fake, mas estável: mesmo nome, mesmo desenho, no servidor e no cliente.
  const qr = useMemo(() => desenhaQr(nome || "somma"), [nome]);

  function reiniciar() {
    setNome("");
    setEmitido(false);
    setSelos(0);
  }

  return (
    <main className="min-h-screen bg-[#060B1C] px-5 py-10 text-white antialiased sm:px-8 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: GOLD }}>
              Simulação · Ultra Pass
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight sm:text-4xl">
              Como o participante <span style={{ color: RED }}>vê</span> o pass
            </h1>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-white/55">
              Clique como se fosse o participante. Nada aqui é real: é uma demonstração da mecânica
              proposta para o mês de ativação.
            </p>
          </div>
          <Link
            href="/ppt-michelob-nova-proposta"
            className="rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white"
            style={{ borderColor: `${GOLD}59` }}
          >
            ← Voltar à proposta
          </Link>
        </header>

        {/* A coluna do celular vem primeiro em minmax: o Tailwind não gera a
            forma que começa com `auto` antes de uma função. */}
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          {/* ── Celular do participante ── */}
          <div className="mx-auto w-[300px] shrink-0 sm:w-[330px]">
            <div className="rounded-[2.6rem] border border-white/15 bg-[#0B1230] p-3 shadow-2xl">
              <div className="relative min-h-[520px] overflow-hidden rounded-[2.1rem] border border-white/10 bg-[#060B1C] px-6 pb-7 pt-6">
                <span
                  className="absolute left-1/2 top-3 h-1 w-16 -translate-x-1/2 rounded-full bg-white/15"
                  aria-hidden
                />

                {!emitido ? (
                  /* Tela 1 · inscrição */
                  <div className="mt-6">
                    <p
                      className="font-mono text-[9px] uppercase tracking-[0.28em]"
                      style={{ color: GOLD }}
                    >
                      Somma × Michelob Ultra
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-bold uppercase leading-[0.95] tracking-tight">
                      Garanta seu
                      <br />
                      <span style={{ color: RED }}>Ultra Pass</span>
                    </h2>
                    <p className="mt-3 text-[13px] leading-relaxed text-white/55">
                      Quatro sábados, quatro selos. Complete o pass e retire seu prêmio no evento final.
                    </p>

                    <label className="mt-7 block">
                      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
                        Seu nome
                      </span>
                      <input
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Como quer ser chamado"
                        className="mt-2 w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-3 text-[14px] text-white outline-none placeholder:text-white/25 focus:border-white/30"
                      />
                    </label>

                    <button
                      onClick={() => setEmitido(true)}
                      className="mt-5 w-full rounded-xl px-4 py-3.5 font-display text-sm font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: RED }}
                    >
                      Gerar meu Ultra Pass
                    </button>
                    <p className="mt-3 text-center text-[10px] leading-relaxed text-white/30">
                      Sem app e sem senha. O pass abre no navegador.
                    </p>
                  </div>
                ) : (
                  /* Tela 2 · o pass */
                  <div className="mt-6">
                    <div className="flex items-baseline justify-between">
                      <p
                        className="font-mono text-[9px] uppercase tracking-[0.28em]"
                        style={{ color: GOLD }}
                      >
                        Ultra Pass
                      </p>
                      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">
                        Mês de ativação
                      </p>
                    </div>
                    <p className="mt-1.5 font-display text-xl font-bold uppercase leading-tight tracking-tight">
                      {primeiroNome}
                    </p>

                    {/* QR do check-in */}
                    <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                      <span
                        className="grid h-14 w-14 shrink-0 grid-cols-7 gap-[1px] rounded-lg bg-white p-1.5"
                        aria-hidden
                      >
                        {qr.map((ligado, i) => (
                          <span
                            key={i}
                            className={`rounded-[1px] ${ligado ? "bg-[#060B1C]" : "bg-transparent"}`}
                          />
                        ))}
                      </span>
                      <div>
                        <p className="text-[12px] font-medium text-white/85">
                          {completo ? "Pass completo" : `Check-in da semana ${selos + 1}`}
                        </p>
                        <p className="mt-0.5 text-[10px] text-white/40">
                          {completo ? "Apresente no evento final" : "Apresente na chegada"}
                        </p>
                      </div>
                    </div>

                    {/* Selos */}
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {ULTRA_PASS.map((d) => {
                        const feito = d.selos <= selos;
                        return (
                          <span
                            key={d.selos}
                            className="flex aspect-square flex-col items-center justify-center rounded-xl border text-[10px] font-bold transition-colors duration-300"
                            style={
                              feito
                                ? { borderColor: `${RED}66`, backgroundColor: `${RED}1F`, color: "#fff" }
                                : { borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.28)" }
                            }
                          >
                            {feito ? <Check /> : d.selos}
                            <span className="mt-0.5 text-[8px] font-normal opacity-60">S{d.selos}</span>
                          </span>
                        );
                      })}
                    </div>

                    {/* Progresso */}
                    <div className="mt-4">
                      <div className="flex items-baseline justify-between">
                        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
                          Progresso
                        </p>
                        <p className="font-display text-sm font-bold" style={{ color: ORANGE }}>
                          {selos}/{TOTAL_SELOS}
                        </p>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <span
                          className="block h-full rounded-full transition-[width] duration-500"
                          style={{
                            width: `${(selos / TOTAL_SELOS) * 100}%`,
                            backgroundColor: ORANGE,
                          }}
                        />
                      </div>
                    </div>

                    {/* Benefício da vez */}
                    <div
                      className="mt-4 rounded-2xl border p-3.5"
                      style={{
                        borderColor: completo ? `${RED}59` : "rgba(255,255,255,0.1)",
                        backgroundColor: completo ? `${RED}12` : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <p
                        className="font-mono text-[9px] uppercase tracking-[0.22em]"
                        style={{ color: completo ? RED : GOLD }}
                      >
                        {completo ? "Prêmio liberado" : conquistado ? "Já desbloqueado" : "Próximo benefício"}
                      </p>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/75">
                        {completo
                          ? ULTRA_PASS[TOTAL_SELOS - 1].beneficio
                          : (conquistado ?? proximo).beneficio}
                      </p>
                      {!completo && (
                        <p className="mt-2 text-[11px] text-white/40">
                          Falta{TOTAL_SELOS - selos > 1 ? "m" : ""} {TOTAL_SELOS - selos} semana
                          {TOTAL_SELOS - selos > 1 ? "s" : ""} para o prêmio do evento final.
                        </p>
                      )}
                    </div>

                    {completo ? (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-center">
                        <p className="font-display text-sm font-bold uppercase tracking-wide">
                          Domingo · Parque da Cidade
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-white/50">
                          Estacionamento 9. Apresente o pass completo para retirar o prêmio.
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelos((s) => Math.min(TOTAL_SELOS, s + 1))}
                        className="mt-5 w-full rounded-xl px-4 py-3.5 font-display text-sm font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: RED }}
                      >
                        Simular check-in · semana {selos + 1}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={reiniciar}
              className="mt-4 w-full rounded-full border border-white/12 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-white/80"
            >
              Recomeçar simulação
            </button>
          </div>

          {/* ── Leitura do lado do Somma e da marca ── */}
          <div className="space-y-4">
            <div
              className="rounded-3xl border p-6 sm:p-7"
              style={{ borderColor: `${NAVY}80`, backgroundColor: "rgba(255,255,255,0.03)" }}
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.25em]" style={{ color: GOLD }}>
                Nesta etapa, do lado da marca
              </p>
              <h2 className="mt-2.5 font-display text-xl font-semibold uppercase leading-tight tracking-tight sm:text-2xl">
                {marca.titulo}
              </h2>
              <p className="mt-2.5 text-[14px] leading-relaxed text-white/60">{marca.texto}</p>
            </div>

            {/* Régua completa, para acompanhar enquanto clica */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-7">
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">
                Régua de benefícios
              </p>
              <ul className="mt-4 space-y-2.5">
                {ULTRA_PASS.map((d) => {
                  const feito = d.selos <= selos;
                  return (
                    <li
                      key={d.selos}
                      className="flex items-start gap-3 rounded-2xl border p-3.5 transition-colors duration-300"
                      style={{
                        borderColor: feito
                          ? d.selos === TOTAL_SELOS
                            ? `${RED}59`
                            : `${GOLD}45`
                          : "rgba(255,255,255,0.08)",
                        backgroundColor: feito ? "rgba(255,255,255,0.04)" : "transparent",
                      }}
                    >
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold"
                        style={
                          feito
                            ? {
                                borderColor: d.selos === TOTAL_SELOS ? RED : GOLD,
                                backgroundColor: d.selos === TOTAL_SELOS ? RED : GOLD,
                                color: "#060B1C",
                              }
                            : { borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.3)" }
                        }
                      >
                        {feito ? <Check /> : d.selos}
                      </span>
                      <div>
                        <p
                          className="font-display text-sm font-semibold uppercase tracking-wide"
                          style={{ color: feito ? "#fff" : "rgba(255,255,255,0.45)" }}
                        >
                          {d.frequencia} · {d.rotulo}
                        </p>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">
                          {d.beneficio}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="text-[11px] leading-relaxed text-white/30">
              Demonstração sem back-end: os dados existem só nesta tela e somem ao recarregar. Na
              campanha, o pass roda sobre a base do Somma, com check-in por QR Code na chegada.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="m2.6 7.4 2.8 2.8 6-6.4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Desenha um QR de mentira de 7×7 a partir do nome. Determinístico de
 * propósito: o mesmo nome gera o mesmo padrão no servidor e no cliente, então
 * a hidratação não quebra.
 */
function desenhaQr(semente: string): boolean[] {
  let h = 2166136261;
  for (let i = 0; i < semente.length; i++) {
    h ^= semente.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Array.from({ length: 49 }, (_, i) => {
    // Cantos de marcação, como num QR de verdade.
    const linha = Math.floor(i / 7);
    const coluna = i % 7;
    const canto =
      (linha < 2 && coluna < 2) || (linha < 2 && coluna > 4) || (linha > 4 && coluna < 2);
    if (canto) return true;
    h = Math.imul(h ^ (i + 1), 16777619);
    return ((h >>> 13) & 1) === 1;
  });
}
