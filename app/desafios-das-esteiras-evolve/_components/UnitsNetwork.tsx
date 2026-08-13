"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  EVENT_PATH,
  UNITS,
  UNIT_LABELS,
  inscricoesAbertas,
} from "@/lib/desafio-esteiras/event.config";
import { track } from "@/lib/desafio-esteiras/analytics";
import { FitLines } from "./FitLines";
import { countUp, drawLine, gsap, maskReveal, prefersReducedMotion, useScope } from "../_motion";
import { statsPorUnidade, useLiveStats, type StatsIniciais } from "./useLiveStats";

/**
 * Posições no diagrama de rede (viewBox 1000×520).
 * Espelham a geografia relativa real das unidades: Vicente Pires ao norte,
 * Alameda no centro-oeste, Samambaia a sudoeste e Luziânia bem ao sul.
 */
const NOS: Record<string, { x: number; y: number }> = {
  "vicente-pires": { x: 500, y: 96 },
  alameda: { x: 236, y: 214 },
  samambaia: { x: 178, y: 392 },
  luziania: { x: 792, y: 408 },
};

const ARESTAS: [string, string][] = [
  ["vicente-pires", "alameda"],
  ["vicente-pires", "samambaia"],
  ["vicente-pires", "luziania"],
  ["alameda", "samambaia"],
  ["alameda", "luziania"],
  ["samambaia", "luziania"],
];

export function UnitsNetwork({ iniciais }: { iniciais: StatsIniciais }) {
  const stats = useLiveStats(iniciais);
  const unidades = statsPorUnidade(stats);
  const totalRef = useRef<HTMLSpanElement>(null);
  const jaAnimou = useRef(false);

  const root = useScope<HTMLElement>(({ root }) => {
    maskReveal(root.querySelectorAll(".net-titulo > *"), { trigger: root, start: "top 76%" });

    // As conexões se desenham conforme a seção entra — a cidade "se ligando".
    root.querySelectorAll<SVGLineElement>(".net-aresta").forEach((linha, i) => {
      drawLine(linha, root, { start: "top 78%", end: "center 55%" });
      gsap.fromTo(
        linha,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, delay: i * 0.04, scrollTrigger: { trigger: root, start: "top 78%", once: true } }
      );
    });

    gsap.fromTo(
      root.querySelectorAll(".net-no"),
      { scale: 0, transformOrigin: "center" },
      {
        scale: 1,
        duration: 0.75,
        ease: "back.out(2)",
        stagger: 0.1,
        scrollTrigger: { trigger: root, start: "top 70%", once: true },
      }
    );

    gsap.fromTo(
      root.querySelectorAll(".net-card"),
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.09,
        scrollTrigger: { trigger: root.querySelector(".net-grid"), start: "top 84%", once: true },
      }
    );

    // Pulsos percorrendo as conexões: a energia circulando entre as unidades.
    root.querySelectorAll<SVGCircleElement>(".net-pulso").forEach((pulso, i) => {
      const a = NOS[ARESTAS[i][0]];
      const b = NOS[ARESTAS[i][1]];
      gsap.fromTo(
        pulso,
        { attr: { cx: a.x, cy: a.y }, opacity: 0 },
        {
          attr: { cx: b.x, cy: b.y },
          opacity: 1,
          duration: 2.4,
          delay: i * 0.55,
          repeat: -1,
          repeatDelay: 1.6,
          ease: "power1.inOut",
          keyframes: undefined,
        }
      );
    });
  });

  // Contadores: sobem uma vez ao entrar; depois o polling só troca o valor.
  useEffect(() => {
    if (jaAnimou.current || !totalRef.current) return;
    if (prefersReducedMotion()) {
      totalRef.current.textContent = stats.total.toLocaleString("pt-BR");
      jaAnimou.current = true;
      return;
    }
    if (stats.total >= 0) {
      jaAnimou.current = true;
      countUp(totalRef.current, stats.total, { duration: 2 });
    }
    // roda só na montagem: as atualizações seguintes vêm do render normal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!jaAnimou.current || !totalRef.current) return;
    totalRef.current.textContent = stats.total.toLocaleString("pt-BR");
  }, [stats.total]);

  const abertas = inscricoesAbertas();

  return (
    <section
      ref={root}
      id="unidades"
      className="dst-section relative scroll-mt-16 overflow-hidden"
      aria-labelledby="unidades-titulo"
    >
      <div
        className="dst-glow left-1/2 top-1/3 h-[50vh] w-[50vh] -translate-x-1/2"
        style={{ background: "var(--evolve)", opacity: 0.18 }}
      />

      <div className="dst-wrap relative">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="dst-label mb-6 text-[color:var(--somma)]">Rede do desafio</p>
            {/* divide a linha com o painel de total no desktop */}
            <h2 id="unidades-titulo" className="dst-col-7">
              <FitLines linhas={["4 UNIDADES.", "1 DESAFIO."]} maskClass="net-titulo" max="8rem" min="2.2rem" />
            </h2>
          </div>

          {/* Total ao vivo */}
          <div className="dst-panel min-w-[220px] p-5 md:p-6">
            <p className="dst-label mb-3 text-[color:rgba(242,240,236,0.45)]">Total de inscritos</p>
            <span
              ref={totalRef}
              className="dst-num block text-[clamp(2.8rem,9vw,4.5rem)] font-bold leading-none"
              style={{ color: "var(--somma)" }}
            >
              {stats.total.toLocaleString("pt-BR")}
            </span>
            <p className="dst-label mt-3 flex items-center gap-2 text-[color:rgba(242,240,236,0.4)]">
              <span
                className="block h-1.5 w-1.5 rounded-full"
                style={{ background: stats.disponivel ? "var(--somma)" : "rgba(242,240,236,0.3)" }}
              />
              {stats.disponivel ? "Atualizando ao vivo" : "Aguardando dados"}
            </p>
          </div>
        </div>

        {/* Diagrama de rede — decorativo; os dados acessíveis estão na grade abaixo */}
        <div className="relative mt-12 hidden md:mt-16 md:block">
          <svg
            viewBox="0 0 1000 520"
            className="h-auto w-full"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient id="net-energia" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e0261b" />
                <stop offset="100%" stopColor="#ff2c04" />
              </linearGradient>
            </defs>

            {ARESTAS.map(([a, b], i) => (
              <line
                key={`${a}-${b}`}
                className="net-aresta"
                x1={NOS[a].x}
                y1={NOS[a].y}
                x2={NOS[b].x}
                y2={NOS[b].y}
                stroke="url(#net-energia)"
                strokeWidth={i < 3 ? 1.6 : 0.9}
                strokeOpacity={i < 3 ? 0.85 : 0.35}
              />
            ))}

            {ARESTAS.map(([a, b]) => (
              <circle
                key={`p-${a}-${b}`}
                className="net-pulso"
                cx={NOS[a].x}
                cy={NOS[a].y}
                r={3.5}
                fill="#ff2c04"
                opacity={0}
              />
            ))}

            {UNITS.map((unit) => {
              const no = NOS[unit.id];
              const dados = unidades.find((u) => u.id === unit.id);
              return (
                <g key={unit.id} className="net-no">
                  <circle
                    cx={no.x}
                    cy={no.y}
                    r={unit.sommaBase ? 15 : 10}
                    fill={unit.sommaBase ? "#ff2c04" : "#08080a"}
                    stroke={unit.sommaBase ? "#ff2c04" : "#e0261b"}
                    strokeWidth={2}
                  />
                  {unit.sommaBase && (
                    <circle cx={no.x} cy={no.y} r={26} fill="none" stroke="#ff2c04" strokeWidth={1} opacity={0.4}>
                      <animate attributeName="r" values="18;40;18" dur="3.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.55;0;0.55" dur="3.2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <text
                    x={no.x}
                    y={no.y - (unit.sommaBase ? 34 : 26)}
                    textAnchor="middle"
                    fill="#f2f0ec"
                    fontSize="19"
                    fontWeight="800"
                    letterSpacing="0.5"
                    style={{ fontFamily: "var(--font-dst-sans), sans-serif", textTransform: "uppercase" }}
                  >
                    {unit.curto.toUpperCase()}
                  </text>
                  <text
                    x={no.x}
                    y={no.y + (unit.sommaBase ? 40 : 32)}
                    textAnchor="middle"
                    fill="#ff2c04"
                    fontSize="17"
                    fontWeight="700"
                    style={{ fontFamily: "var(--font-dst-mono), monospace" }}
                  >
                    {(dados?.inscritos ?? 0).toLocaleString("pt-BR")}
                  </text>
                  <text
                    x={no.x}
                    y={no.y + (unit.sommaBase ? 56 : 48)}
                    textAnchor="middle"
                    fill="rgba(242,240,236,0.4)"
                    fontSize="10"
                    letterSpacing="2"
                    style={{ fontFamily: "var(--font-dst-mono), monospace" }}
                  >
                    INSCRITOS
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Grade de unidades — a fonte acessível dos números */}
        <ul className="net-grid mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {UNITS.map((unit) => {
            const dados = unidades.find((u) => u.id === unit.id);
            const inscritos = dados?.inscritos ?? 0;
            const status = dados?.status ?? unit.status;
            const esgotada = status === "esgotada" || status === "encerrada";
            const capacidade = dados?.capacidade ?? unit.capacidade;

            return (
              <li
                key={unit.id}
                className="net-card dst-panel group relative flex flex-col p-5"
                style={unit.sommaBase ? { borderColor: "rgba(255,44,4,0.55)" } : undefined}
              >
                {unit.sommaBase && (
                  <span
                    className="dst-label dst-clip-tag absolute right-0 top-0 bg-[color:var(--somma)] px-3 py-1.5 text-[0.5rem] text-[color:var(--ink)]"
                    style={{ clipPath: "polygon(10px 0, 100% 0, 100% 100%, 0 100%)" }}
                  >
                    SOMMA BASE
                  </span>
                )}

                <p className="dst-label text-[color:rgba(242,240,236,0.4)]">
                  {unit.cidade}/{unit.uf}
                </p>
                <h3 className="dst-display mt-2 text-[clamp(1.3rem,4.5vw,1.75rem)]">
                  {unit.curto}
                </h3>

                <p className="mt-5 flex items-baseline gap-2">
                  <span
                    className="dst-num text-[2.4rem] font-bold leading-none"
                    style={{ color: unit.sommaBase ? "var(--somma)" : "var(--paper)" }}
                  >
                    {inscritos.toLocaleString("pt-BR")}
                  </span>
                  <span className="dst-label text-[color:rgba(242,240,236,0.45)]">inscritos</span>
                </p>

                {capacidade !== null && (
                  <div className="mt-3" aria-hidden>
                    <div className="h-[3px] w-full bg-[color:var(--line)]">
                      <div
                        className="h-full origin-left transition-transform duration-700"
                        style={{
                          background: "var(--energia)",
                          transform: `scaleX(${Math.min(1, inscritos / capacidade)})`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <p
                  className="dst-label mt-4 flex items-center gap-2"
                  style={{ color: esgotada ? "rgba(242,240,236,0.4)" : "var(--somma)" }}
                >
                  <span
                    className="block h-1.5 w-1.5 rounded-full"
                    style={{ background: "currentColor" }}
                  />
                  {UNIT_LABELS[status]}
                </p>

                {abertas && !esgotada && (
                  <Link
                    href={`${EVENT_PATH}/inscricao?unidade=${unit.slug}`}
                    onClick={() => {
                      track("select_unit", { unidade: unit.id, origem: "grade_unidades" });
                      track("begin_registration", { origem: "grade_unidades", unidade: unit.id });
                    }}
                    className="dst-label mt-5 flex min-h-[44px] items-center gap-2 border-t border-[color:var(--line)] pt-4 transition-colors hover:text-[color:var(--somma)]"
                  >
                    Escolher esta unidade
                    <span aria-hidden className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
