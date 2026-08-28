"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * Simulação de compra de créditos avulsos, na linha do "Pass" da The Simple
 * Gym: escolhe o vínculo e a área, e o valor muda. Roda sozinha em loop,
 * alternando membro Evolve, SOMMA e não membro; um toque pausa o loop e deixa
 * explorar. Valores ilustrativos, marcados como tal: a tabela final é da
 * frente de modelo comercial.
 */

const EVOLVE = "#DF271B";
const ORANGE = "#FF2C03";

type VinculoId = "evolve-plus" | "evolve" | "somma" | "publico";

const VINCULOS: { id: VinculoId; nome: string; cor?: string }[] = [
  { id: "evolve-plus", nome: "Evolve+", cor: EVOLVE },
  { id: "evolve", nome: "Aluno Evolve" },
  { id: "somma", nome: "Membro SOMMA", cor: ORANGE },
  { id: "publico", nome: "Não membro" },
];

type Preco = { valor: number } | { texto: string; apoio: string };

const AREAS: { id: string; nome: string; sub: string; precos: Record<VinculoId, Preco> }[] = [
  {
    id: "recovery",
    nome: "Recovery",
    sub: "Sessão de 30 min",
    precos: {
      "evolve-plus": { texto: "Voucher", apoio: "Até 3 por mês inclusos no plano. Depois, crédito com desconto." },
      evolve: { valor: 77 },
      somma: { valor: 87 },
      publico: { valor: 97 },
    },
  },
  {
    id: "locker",
    nome: "Locker",
    sub: "Diária",
    precos: {
      "evolve-plus": { texto: "Incluso", apoio: "Parte do plano Evolve+." },
      evolve: { valor: 8 },
      somma: { valor: 10 },
      publico: { valor: 15 },
    },
  },
  {
    id: "quadra",
    nome: "Quadra",
    sub: "1 hora · agenda online",
    precos: {
      "evolve-plus": { valor: 70 },
      evolve: { valor: 80 },
      somma: { valor: 90 },
      publico: { valor: 110 },
    },
  },
];

const PASSO_MS = 2400;
/** Depois de um toque, o loop espera antes de voltar a rodar sozinho. */
const PAUSA_MS = 9000;

export function SimuladorCreditos({ className = "" }: { className?: string }) {
  const [vinculo, setVinculo] = useState<VinculoId>("publico");
  const [area, setArea] = useState(0);
  const valorRef = useRef<HTMLDivElement>(null);
  const pausadoAte = useRef(0);

  /* Loop: percorre os vínculos; ao completar a volta, troca de área. */
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (Date.now() < pausadoAte.current) return;
      setVinculo((v) => {
        const i = VINCULOS.findIndex((x) => x.id === v);
        const proximo = (i + 1) % VINCULOS.length;
        if (proximo === 0) setArea((a) => (a + 1) % AREAS.length);
        return VINCULOS[proximo].id;
      });
    }, PASSO_MS);
    return () => window.clearInterval(timer);
  }, []);

  /* O valor novo entra de baixo, como um contador de painel. */
  useEffect(() => {
    if (!valorRef.current) return;
    const tw = gsap.fromTo(valorRef.current, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
    return () => {
      tw.kill();
    };
  }, [vinculo, area]);

  const tocar = useCallback((fn: () => void) => {
    pausadoAte.current = Date.now() + PAUSA_MS;
    fn();
  }, []);

  const a = AREAS[area];
  const preco = a.precos[vinculo];
  const corVinculo = VINCULOS.find((v) => v.id === vinculo)?.cor;

  return (
    <div className={`a-up border border-[color:var(--line)] bg-[color:var(--surface)] p-6 sm:p-8 ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--fg-faint)]">
          Simulação de compra · pelo app
        </p>
        <span className="hidden h-1.5 w-1.5 animate-pulse rounded-full sm:block" style={{ backgroundColor: ORANGE }} aria-hidden />
      </div>

      {/* Vínculo */}
      <p className="mt-6 font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--fg-faint)]">Vínculo</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {VINCULOS.map((v) => {
          const on = v.id === vinculo;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => tocar(() => setVinculo(v.id))}
              className="px-3 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors duration-300"
              style={
                on
                  ? { backgroundColor: v.cor ?? "#F5F3EF", color: v.cor ? "#F5F3EF" : "#0A0A0A" }
                  : { border: "1px solid var(--line)", color: "var(--fg-soft)" }
              }
            >
              {v.nome}
            </button>
          );
        })}
      </div>

      {/* Área */}
      <p className="mt-5 font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--fg-faint)]">Área</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {AREAS.map((x, i) => {
          const on = i === area;
          return (
            <button
              key={x.id}
              type="button"
              onClick={() => tocar(() => setArea(i))}
              className="px-3 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors duration-300"
              style={on ? { backgroundColor: "#F5F3EF", color: "#0A0A0A" } : { border: "1px solid var(--line)", color: "var(--fg-soft)" }}
            >
              {x.nome}
            </button>
          );
        })}
      </div>

      {/* Valor */}
      <div className="mt-7 flex min-h-[7.5rem] items-end justify-between gap-6 overflow-hidden border-t border-[color:var(--line)] pt-5">
        <div>
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--fg-faint)]">
            {a.nome} · {a.sub}
          </p>
          <p className="mt-2 max-w-[16rem] text-[12px] font-light leading-relaxed text-[color:var(--fg-soft)]">
            {"apoio" in preco
              ? preco.apoio
              : vinculo === "evolve-plus"
                ? "Melhor condição e prioridade de reserva."
                : vinculo === "publico"
                  ? "Valor integral, sem vínculo."
                  : "Condição do plano aplicada no app."}
          </p>
        </div>
        <div ref={valorRef} key={`${vinculo}-${area}`} className="text-right">
          {"valor" in preco ? (
            <p className="font-display font-bold leading-none tracking-tight" style={corVinculo ? { color: corVinculo } : undefined}>
              <span className="align-top text-xl sm:text-2xl">R$</span>
              <span className="text-6xl sm:text-7xl md:text-[5.2rem]">{preco.valor}</span>
            </p>
          ) : (
            <p className="font-display text-4xl font-bold uppercase leading-none tracking-tight sm:text-5xl" style={{ color: corVinculo ?? "var(--fg)" }}>
              {preco.texto}
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-[10.5px] leading-relaxed text-[color:var(--fg-faint)]">
        Valores ilustrativos, só para leitura da mecânica. A tabela final é definida na frente de modelo comercial.
      </p>
    </div>
  );
}
