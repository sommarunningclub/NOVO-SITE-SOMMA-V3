"use client";

import { useEffect, useRef } from "react";
import { DISTANCIAS, PROVA, type DistanciaBase } from "@/lib/evp/config";

/** A seção trata das duas provas de domingo. 5 km e 10 km seguem só no formulário. */
const DISTANCIAS_BASE = ["21k", "42k"] as const satisfies readonly DistanciaBase[];
import { EASE, gsap, semMovimento } from "../_motion";
import { useEvento } from "./Contexto";
import { Secao, Titulo } from "./Secao";

export function SeletorDistancia() {
  const { distancia: escolhida, escolherDistancia } = useEvento();
  // Quem marcou 5 km ou 10 km no formulário vê aqui a meia, que é a primeira das duas.
  const distancia = escolhida === "42k" ? "42k" : "21k";
  const d = DISTANCIAS[distancia];
  const painel = useRef<HTMLDivElement>(null);
  const primeira = useRef(true);

  // Troca de distância: os dados técnicos reentram em sequência.
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    if (!painel.current || semMovimento()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-troca]", { y: 18, autoAlpha: 0, duration: 0.55, ease: EASE.soft, stagger: 0.045, clearProps: "all" });
      gsap.from("[data-numero]", { yPercent: 60, autoAlpha: 0, duration: 0.7, ease: EASE.out, clearProps: "all" });
    }, painel);
    return () => ctx.revert();
  }, [distancia]);

  const aoTeclar = (e: React.KeyboardEvent, i: number) => {
    const passo = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!passo) return;
    e.preventDefault();
    const proxima = DISTANCIAS_BASE[(i + passo + DISTANCIAS_BASE.length) % DISTANCIAS_BASE.length];
    escolherDistancia(proxima, "seletor");
    document.getElementById(`aba-${proxima}`)?.focus();
  };

  return (
    <Secao id="distancias" marco="02" rotulo="Escolha a sua distância">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <Titulo id="distancias" linhas={["Duas provas.", "Dois planos."]} />
      </div>

      <div role="tablist" aria-label="Distâncias da prova" data-sobe className="mt-10 grid grid-cols-2 gap-2 sm:gap-3">
        {DISTANCIAS_BASE.map((id, i) => {
          const ativo = id === distancia;
          return (
            <button
              key={id}
              id={`aba-${id}`}
              role="tab"
              type="button"
              aria-selected={ativo}
              aria-controls="painel-distancia"
              tabIndex={ativo ? 0 : -1}
              onClick={() => escolherDistancia(id, "seletor")}
              onKeyDown={(e) => aoTeclar(e, i)}
              className="relative flex min-h-[5.5rem] flex-col items-start justify-between overflow-hidden rounded-xl border p-3 text-left transition-[background-color,border-color,color] duration-300 sm:min-h-[8rem] sm:rounded-2xl sm:p-5"
              style={{
                background: ativo ? "var(--mt-laranja)" : "var(--mt-carvao)",
                borderColor: ativo ? "var(--mt-laranja)" : "var(--mt-linha)",
                color: ativo ? "var(--mt-preto)" : "var(--mt-branco)",
              }}
            >
              <span className="mt-mono text-[0.6rem] opacity-80 sm:text-[0.7rem]">{DISTANCIAS[id].dia.slice(0, 3)} {DISTANCIAS[id].data.slice(0, 5)}</span>
              <span className="mt-display flex items-baseline gap-1 text-[2.5rem] sm:text-[4.5rem]">
                {DISTANCIAS[id].numero}
                <span className="text-[0.32em] tracking-normal">KM</span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        ref={painel}
        id="painel-distancia"
        role="tabpanel"
        aria-labelledby={`aba-${distancia}`}
        tabIndex={0}
        className="mt-3 overflow-hidden rounded-2xl border border-[color:var(--mt-linha)] bg-[color:var(--mt-carvao)]"
      >
        <div className="grid lg:grid-cols-12">
          <div className="border-b border-[color:var(--mt-linha)] p-6 sm:p-8 lg:col-span-5 lg:border-b-0 lg:border-r">
            <p data-troca className="mt-rotulo">{d.oficial} · {PROVA.nome}</p>
            <p className="mt-display mt-4 overflow-hidden text-[clamp(3.2rem,13vw,6.5rem)]">
              <span data-numero className="block">{d.titulo}</span>
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-x-5 gap-y-6">
              <div data-troca>
                <dt className="mt-rotulo">Data</dt>
                <dd className="mt-1.5 text-[1.05rem] font-semibold">{d.dia}, {d.data.slice(0, 5)}</dd>
              </div>
              <div data-troca>
                <dt className="mt-rotulo">Largada geral</dt>
                <dd className="mt-1.5 text-[1.05rem] font-semibold">a partir das {d.largada}</dd>
              </div>
              <div data-troca>
                <dt className="mt-rotulo">Tempo limite oficial</dt>
                <dd className="mt-mono mt-1.5 text-[1.5rem] font-medium tracking-normal text-[color:var(--mt-laranja)]">{d.limite}</dd>
              </div>
            </dl>

            <div data-troca className="mt-8 flex flex-wrap gap-2">
              <a href="#percursos" className="mt-botao mt-botao--linha mt-botao--pequeno">Ver no mapa</a>
              <a href={d.mapaOficial} target="_blank" rel="noopener noreferrer" className="mt-botao mt-botao--linha mt-botao--pequeno">
                Mapa oficial (PDF)<span className="mt-so-leitor">, abre em nova aba</span>
              </a>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:col-span-7">
            <h3 data-troca className="mt-rotulo !text-[color:var(--mt-laranja)]">No Meeting, para quem corre {d.oficial}</h3>
            <ul className="mt-4 space-y-3">
              {d.assuntos.slice(0, 3).map((a) => (
                <li key={a} data-troca className="flex gap-3 text-[1rem] leading-relaxed text-[#e2e2e2]">
                  <span aria-hidden className="mt-[0.65em] h-px w-5 flex-none bg-[color:var(--mt-laranja)]" />
                  {a}
                </li>
              ))}
            </ul>

            {d.cortes.length > 0 && (
              <div data-troca className="mt-8 grid gap-3 sm:grid-cols-2">
                {d.cortes.map((c) => (
                  <div key={c.km} className="rounded-xl border border-[color:var(--mt-laranja)] bg-[rgba(255,44,3,0.08)] p-4">
                    <p className="mt-rotulo !text-[color:var(--mt-laranja-claro)]">Ponto de corte</p>
                    <p className="mt-mono mt-2 text-[1.35rem] font-medium tracking-normal">
                      km {String(c.km).replace(".", ",")} · {c.limite}
                    </p>
                    <p className="mt-2 text-[0.85rem] leading-relaxed text-[#cfcfcf]">{c.regra}</p>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      <p data-sobe className="mt-4 text-[0.9rem] leading-relaxed text-[color:var(--mt-cinza)]">
        Vai correr 5 km, 10 km ou o Desafio Monumental? O Meeting também é para você: no formulário você escolhe a sua prova.
        Dados da prova:{" "}
        <a href={PROVA.regulamento} target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">
          regulamento oficial<span className="mt-so-leitor">, abre em nova aba</span>
        </a>.
      </p>
    </Secao>
  );
}
