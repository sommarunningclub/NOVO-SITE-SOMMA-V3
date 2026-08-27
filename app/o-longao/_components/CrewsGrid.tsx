"use client";

import Image from "next/image";
import Link from "next/link";
import { LINKS } from "@/lib/o-longao/config";
import { CREWS_GRID, HERO } from "@/lib/o-longao/copy";
import { track } from "@/lib/o-longao/analytics";
import { maskReveal, riseIn, useScope } from "../_motion";
import { FitLines } from "./FitLines";

/**
 * O grid das crews confirmadas.
 *
 * Vitrine pública: só o que a crew mostraria na camiseta (nome, cidade,
 * Instagram, logo, categorias). Na final este grid vira o perfil de cada
 * crew com dados ao vivo da telemetria: distância, atleta em pista, trocas.
 */

/*
 * Espelho local de `CrewPublica` (lib/o-longao/db.ts). O módulo do banco é
 * server-only e não pode ser importado por um Client Component; o page.tsx
 * busca no servidor e entrega por props com este mesmo contrato.
 */
export interface CrewPublicaView {
  id: string;
  nome: string;
  cidade: string;
  instagram: string;
  logo_url: string | null;
  categorias: ("masculino" | "feminino")[];
  classificada: boolean;
}

const CHIP: Record<CrewPublicaView["categorias"][number], string> = {
  masculino: "MASC",
  feminino: "FEM",
};

export function CrewsGrid({ crews }: { crews: CrewPublicaView[] }) {
  const root = useScope<HTMLElement>(({ root }) => {
    maskReveal(root.querySelectorAll(".crews-titulo > *"), { trigger: root, start: "top 78%" });
    riseIn(root.querySelectorAll(".crews-anim"), { trigger: root, start: "top 72%", stagger: 0.06 });

    const cards = root.querySelectorAll(".crew-card");
    if (cards.length) {
      riseIn(cards, {
        trigger: root.querySelector(".crews-grade") ?? root,
        start: "top 85%",
        stagger: 0.06,
      });
    }
  });

  return (
    <section
      ref={root}
      id="grid"
      className="lgo-section relative scroll-mt-16 overflow-hidden border-t border-[color:var(--line)] bg-[color:var(--noite)]"
      aria-labelledby="crews-grid-titulo"
    >
      <div className="lgo-lanes" aria-hidden />

      <div className="lgo-wrap relative">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="lgo-label mb-6 text-[color:var(--somma)]">{CREWS_GRID.kicker}</p>
            <h2 id="crews-grid-titulo">
              <FitLines
                linhas={[CREWS_GRID.titulo]}
                maskClass="crews-titulo"
                max="8.5rem"
                min="2rem"
              />
            </h2>
          </div>

          {crews.length > 0 && (
            <p className="crews-anim flex items-baseline gap-3">
              <span
                className="lgo-num text-[clamp(2.2rem,7vw,3.4rem)] font-bold leading-none"
                style={{ color: "var(--sinal)" }}
              >
                {crews.length.toLocaleString("pt-BR")}
              </span>
              <span className="lgo-label text-[color:rgba(242,240,236,0.45)]">
                {CREWS_GRID.kicker}
              </span>
            </p>
          )}
        </div>

        {crews.length === 0 ? (
          /* Grid vazio: a seção vira convite. Sem placeholder falso de crew. */
          <div className="crews-anim mt-12 border border-[color:var(--line)] px-6 py-14 text-center md:mt-16 md:py-20">
            <p className="lgo-display lgo-display-condensed mx-auto max-w-[22ch] text-[clamp(1.35rem,4.6vw,2.6rem)]">
              {CREWS_GRID.vazio}
            </p>
            <div className="mx-auto mt-10 max-w-[420px]">
              <Link
                href={LINKS.inscricao}
                onClick={() => track("begin_registration", { origem: "grid_crews" })}
                className="lgo-btn w-full"
              >
                {HERO.ctaPrimario}
              </Link>
            </div>
          </div>
        ) : (
          <ul className="crews-grade mt-12 grid gap-3 sm:grid-cols-2 md:mt-16 lg:grid-cols-3">
            {crews.map((crew) => (
              <li key={crew.id} className="crew-card">
                <CrewCard crew={crew} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CrewCard({ crew }: { crew: CrewPublicaView }) {
  const handle = crew.instagram.replace(/^@/, "");

  return (
    <article className="lgo-panel flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <CrewLogo crew={crew} />
        {crew.classificada && (
          <span
            className="lgo-label lgo-clip-tag shrink-0 px-3 py-2"
            style={{ background: "var(--sinal)", color: "var(--noite)" }}
          >
            Classificada
          </span>
        )}
      </div>

      <div className="min-w-0">
        <h3 className="lgo-display lgo-display-condensed truncate text-[clamp(1.15rem,3.6vw,1.5rem)]">
          {crew.nome}
        </h3>
        <p className="lgo-mono mt-1.5 text-[0.78rem] uppercase tracking-[0.08em] text-[color:rgba(242,240,236,0.5)]">
          {crew.cidade}
        </p>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--line)] pt-3">
        <a
          href={`https://instagram.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="lgo-mono flex min-h-[44px] items-center text-[0.82rem] text-[color:rgba(242,240,236,0.7)] transition-colors hover:text-[color:var(--somma)]"
        >
          @{handle}
        </a>

        <span className="flex gap-1.5" aria-label={crew.categorias.map((c) => CHIP[c]).join(" e ")}>
          {crew.categorias.map((cat) => (
            <span
              key={cat}
              className="lgo-label border border-[color:var(--line)] bg-[color:var(--noite-3)] px-2.5 py-1.5"
            >
              {CHIP[cat]}
            </span>
          ))}
        </span>
      </div>
    </article>
  );
}

function CrewLogo({ crew }: { crew: CrewPublicaView }) {
  return (
    <span
      className="relative block h-16 w-16 shrink-0 overflow-hidden border"
      style={{
        background: "var(--noite-3)",
        borderColor: crew.logo_url ? "var(--line)" : "rgba(255,196,0,0.5)",
      }}
    >
      {crew.logo_url ? (
        // Logos vêm do storage do Supabase, host fora do `remotePatterns` do
        // next.config — `unoptimized` evita o erro do otimizador e o recorte
        // já é pequeno; trocar quando o host entrar na lista.
        <Image
          src={crew.logo_url}
          alt={`Logo da crew ${crew.nome}`}
          fill
          sizes="64px"
          unoptimized
          className="object-cover"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center" aria-hidden>
          <span className="lgo-display text-[1.6rem] leading-none text-[color:var(--sinal)]">
            {crew.nome.trim().charAt(0).toUpperCase() || "?"}
          </span>
        </span>
      )}
    </span>
  );
}
