"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CATEGORIAS,
  EVENT_PATH,
  UNITS,
  UNIT_ACCENT,
  VAGAS_POR_CATEGORIA,
  VAGAS_POR_UNIDADE,
  VAGAS_TOTAIS,
  VAGAS_TOTAIS_POR_CATEGORIA,
  inscricoesAbertas,
  vagasStatus,
} from "@/lib/desafio-esteiras/event.config";
import { track } from "@/lib/desafio-esteiras/analytics";
import type { Competidor } from "@/lib/desafio-esteiras/db";
import { gsap, maskReveal, useScope } from "../_motion";
import { FitLines } from "./FitLines";
import { statsPorUnidade, useLiveStats, type StatsIniciais } from "./useLiveStats";

type Filtro = "todas" | (typeof UNITS)[number]["id"];

/**
 * Quem vai disputar.
 *
 * Grade de competidores por unidade e categoria, alimentada pelo banco. Só
 * aparece quem escolheu competir: primeiro nome, categoria e foto — nada além
 * disso sai da API. Quem não enviou foto entra com a inicial sobre a cor da
 * própria unidade, então a grade nunca fica com buraco.
 */
export function Competidores({
  iniciais,
  competidoresIniciais,
}: {
  iniciais: StatsIniciais;
  competidoresIniciais: Competidor[];
}) {
  const [lista, setLista] = useState<Competidor[]>(competidoresIniciais);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const stats = useLiveStats(iniciais);

  // Acompanha os cadastros chegando, no mesmo ritmo dos contadores.
  useEffect(() => {
    let vivo = true;
    const id = setInterval(async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/desafio-esteiras/competidores", { cache: "no-store" });
        if (!res.ok || !vivo) return;
        const data = (await res.json()) as { competidores: Competidor[] };
        setLista(data.competidores ?? []);
      } catch {
        /* mantém a lista atual */
      }
    }, 30_000);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, []);

  const root = useScope<HTMLElement>(({ root }) => {
    maskReveal(root.querySelectorAll(".comp-titulo > *"), { trigger: root, start: "top 78%" });
    gsap.fromTo(
      root.querySelectorAll(".comp-bloco"),
      { y: 32, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root.querySelector(".comp-grade"), start: "top 85%", once: true },
      }
    );
  });

  const visiveis = useMemo(
    () => (filtro === "todas" ? lista : lista.filter((c) => c.unitId === filtro)),
    [lista, filtro]
  );

  const porCategoria = useMemo(
    () =>
      CATEGORIAS.map((cat) => ({
        ...cat,
        atletas: visiveis.filter((c) => c.sexo === cat.id),
      })),
    [visiveis]
  );

  /* Os números do painel seguem o filtro selecionado, e vêm do banco:
     "todas" → as 96 vagas da competição; uma unidade → as 24 dela. */
  const unidadesStats = statsPorUnidade(stats);
  const vagasNoFiltro = filtro === "todas" ? VAGAS_TOTAIS : VAGAS_POR_UNIDADE;
  const totalCategoria =
    filtro === "todas" ? VAGAS_TOTAIS_POR_CATEGORIA : VAGAS_POR_CATEGORIA;

  const ocupadasCategoria = {
    feminino: unidadesStats
      .filter((u) => filtro === "todas" || u.id === filtro)
      .reduce((s, u) => s + (u.categorias?.feminino.ocupadas ?? 0), 0),
    masculino: unidadesStats
      .filter((u) => filtro === "todas" || u.id === filtro)
      .reduce((s, u) => s + (u.categorias?.masculino.ocupadas ?? 0), 0),
  };
  const ocupadasNoFiltro = ocupadasCategoria.feminino + ocupadasCategoria.masculino;

  const abertas = inscricoesAbertas();

  return (
    <section
      ref={root}
      id="competidores"
      className="dst-section relative scroll-mt-16 overflow-hidden border-t border-[color:var(--line)]"
      aria-labelledby="competidores-titulo"
    >
      <div className="dst-lanes" />

      <div className="dst-wrap relative">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="dst-col-7">
            <p className="dst-label mb-6 text-[color:var(--somma)]">Quem vai disputar</p>
            <h2 id="competidores-titulo">
              <FitLines linhas={["OS", "COMPETIDORES"]} maskClass="comp-titulo" max="8rem" min="2.2rem" />
            </h2>
          </div>

          {/* O contador segue o filtro: "todas" mostra as 96 vagas da competição;
              uma unidade mostra as 24 dela. */}
          <div className="dst-panel min-w-[230px] p-5">
            <p className="dst-label mb-3 text-[color:rgba(242,240,236,0.45)]">Competidores</p>
            <p className="flex items-baseline gap-2">
              <span
                className="dst-num text-[clamp(2.4rem,8vw,3.6rem)] font-bold leading-none"
                style={{ color: "var(--somma)" }}
              >
                {ocupadasNoFiltro}
              </span>
              <span className="dst-num text-[1.4rem] font-bold leading-none text-[color:rgba(242,240,236,0.35)]">
                /{vagasNoFiltro}
              </span>
            </p>
            <p className="dst-label mt-3 text-[color:rgba(242,240,236,0.4)]">
              {filtro === "todas" ? "vagas na competição" : "vagas nesta unidade"}
            </p>

            <div className="mt-3 h-[3px] w-full bg-[color:var(--line)]" aria-hidden>
              <div
                className="h-full origin-left transition-transform duration-700"
                style={{
                  background: "var(--energia)",
                  transform: `scaleX(${Math.min(1, ocupadasNoFiltro / vagasNoFiltro)})`,
                }}
              />
            </div>

            {/* Quebra por categoria — a regra é 12 em cada */}
            <div className="mt-4 space-y-2 border-t border-[color:var(--line)] pt-3">
              {CATEGORIAS.map((c) => {
                const oc = ocupadasCategoria[c.id];
                const tot = totalCategoria;
                const st = vagasStatus(oc, tot);
                return (
                  <p key={c.id} className="dst-label flex items-baseline justify-between gap-3">
                    <span className="text-[color:rgba(242,240,236,0.5)]">{c.curto}</span>
                    <span
                      className="dst-num"
                      style={{
                        color:
                          st === "esgotada"
                            ? "var(--evolve)"
                            : st === "ultimas"
                              ? "var(--somma)"
                              : "var(--paper)",
                      }}
                    >
                      {oc} / {tot}
                    </span>
                  </p>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filtro por unidade — cada uma com seu total ao vivo */}
        <div className="mt-10 flex gap-2 overflow-x-auto pb-2 md:mt-12">
          <BotaoFiltro ativo={filtro === "todas"} onClick={() => setFiltro("todas")} rotulo="Todas" n={lista.length} />
          {UNITS.map((u) => (
            <BotaoFiltro
              key={u.id}
              ativo={filtro === u.id}
              onClick={() => {
                setFiltro(u.id);
                track("select_unit", { unidade: u.id, origem: "grade_competidores" });
              }}
              rotulo={u.curto}
              // conta a partir da própria lista, não do contador de inscrições:
              // quem marcou competir mas está sem categoria não entra na grade,
              // e o número do filtro tem que bater com o que aparece abaixo.
              n={lista.filter((c) => c.unitId === u.id).length}
              cor={UNIT_ACCENT[u.id]}
            />
          ))}
        </div>

        {/* Grade por categoria */}
        <div className="comp-grade mt-8 space-y-12 md:mt-10 md:space-y-16">
          {porCategoria.map((cat) => (
            <div key={cat.id} className="comp-bloco">
              <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-[color:var(--line)] pb-3">
                <h3 className="dst-display dst-display-condensed text-[clamp(1.4rem,5vw,2.4rem)]">
                  {cat.nome}
                </h3>
                <span className="dst-num shrink-0 text-[1.1rem] font-bold" style={{ color: "var(--somma)" }}>
                  {cat.atletas.length.toLocaleString("pt-BR")}
                </span>
              </div>

              {cat.atletas.length === 0 ? (
                <p className="dst-label text-[color:rgba(242,240,236,0.4)]">
                  {filtro === "todas"
                    ? "Ninguém inscrito nesta categoria ainda — pode ser você."
                    : "Nenhum competidor desta categoria nesta unidade ainda."}
                </p>
              ) : (
                <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {cat.atletas.map((atleta, i) => (
                    <li key={`${atleta.nome}-${atleta.unitId}-${i}`} className="text-center">
                      <Avatar atleta={atleta} />
                      <p className="dst-display mt-2.5 truncate text-[0.9rem] leading-tight">
                        {atleta.nome}
                      </p>
                      <p className="dst-label mt-1 truncate text-[0.5rem] text-[color:rgba(242,240,236,0.4)]">
                        {UNITS.find((u) => u.id === atleta.unitId)?.curto ?? atleta.unitId}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {abertas && (
          <div className="mt-14 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={`${EVENT_PATH}/inscricao`}
              onClick={() => track("begin_registration", { origem: "grade_competidores" })}
              className="dst-btn sm:min-w-[280px]"
            >
              Entrar na disputa
            </Link>
            <Link href={`${EVENT_PATH}/meu-cadastro`} className="dst-btn dst-btn--ghost">
              Alterar meus dados
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function Avatar({ atleta }: { atleta: Competidor }) {
  const cor = UNIT_ACCENT[atleta.unitId] ?? "#e0261b";
  return (
    <span
      className="relative mx-auto block aspect-square w-full max-w-[88px] overflow-hidden rounded-full"
      style={{ background: atleta.fotoUrl ? "var(--ink-2)" : cor }}
    >
      {atleta.fotoUrl ? (
        // Fotos vêm do storage do Supabase e são muitas por página; o next/image
        // exigiria configurar o host e não traria ganho — já são recortes pequenos.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={atleta.fotoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center">
          <span className="dst-display text-[clamp(1.4rem,4vw,2rem)] leading-none text-[color:var(--ink)]">
            {atleta.inicial}
          </span>
        </span>
      )}
    </span>
  );
}

function BotaoFiltro({
  ativo,
  onClick,
  rotulo,
  n,
  cor,
}: {
  ativo: boolean;
  onClick: () => void;
  rotulo: string;
  n: number;
  cor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className="dst-panel flex min-h-[52px] shrink-0 items-center gap-2.5 px-4 py-2.5 transition-colors"
      style={{
        borderColor: ativo ? "var(--somma)" : "var(--line)",
        background: ativo ? "rgba(255,44,4,0.08)" : "var(--ink-2)",
      }}
    >
      {cor && <span className="block h-2 w-2 rounded-full" style={{ background: cor }} aria-hidden />}
      <span className="dst-label" style={{ color: ativo ? "var(--somma)" : undefined }}>
        {rotulo}
      </span>
      <span className="dst-num text-[0.85rem] font-bold text-[color:rgba(242,240,236,0.5)]">{n}</span>
    </button>
  );
}
