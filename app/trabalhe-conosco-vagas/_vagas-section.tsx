"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Briefcase, Check, Clock, MapPin, Sparkles, Wallet, X } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { CandidaturaForm } from "./_candidatura-form";
import type { Vaga } from "./_vagas";

function Tag({ Icon, children }: { Icon: typeof MapPin; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3 py-1.5 text-xs font-medium text-ink">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {children}
    </span>
  );
}

function Lista({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wider text-primary">{titulo}</h4>
      <ul className="mt-3 space-y-2.5">
        {itens.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VagaCard({ vaga, onCandidatar }: { vaga: Vaga; onCandidatar: () => void }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
      {/* Cabeçalho */}
      <div className="border-b border-black/5 bg-light px-7 py-8 md:px-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">{vaga.area}</p>
        <h3 className="mt-2 text-2xl font-semibold leading-tight text-ink md:text-3xl">
          {vaga.titulo}
        </h3>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{vaga.resumo}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Tag Icon={Briefcase}>{vaga.tipo}</Tag>
          <Tag Icon={MapPin}>{vaga.local}</Tag>
          <Tag Icon={Clock}>{vaga.modelo}</Tag>
          <Tag Icon={Wallet}>{vaga.remuneracao}</Tag>
        </div>
      </div>

      {/* Corpo */}
      <div className="px-7 py-8 md:px-10 md:py-10">
        <p className="max-w-3xl text-base leading-relaxed text-muted">{vaga.sobre}</p>

        <div className="mt-9 grid gap-9 md:grid-cols-2">
          <Lista titulo="O que você vai fazer" itens={vaga.atividades} />
          <Lista titulo="O que buscamos" itens={vaga.requisitos} />
          <Lista titulo="Conta pontos" itens={vaga.diferenciais} />
          <Lista titulo="Benefícios" itens={vaga.beneficios} />
        </div>

        <div className="mt-10 flex flex-col items-start gap-4 border-t border-black/5 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-muted">
            <Sparkles className="h-4 w-4 text-primary" />
            Leva menos de 3 minutos para se candidatar.
          </p>
          <button
            type="button"
            onClick={onCandidatar}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover sm:w-auto"
          >
            Quero me candidatar <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function VagasSection({ vagas }: { vagas: Vaga[] }) {
  const [vagaSelecionada, setVagaSelecionada] = useState<Vaga | null>(null);

  const fechar = useCallback(() => setVagaSelecionada(null), []);

  // Esc fecha o modal e o body para de rolar por trás dele.
  useEffect(() => {
    if (!vagaSelecionada) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    const overflowAnterior = document.body.style.overflow;

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowAnterior;
    };
  }, [vagaSelecionada, fechar]);

  return (
    <>
      <section id="vagas" className="scroll-mt-24 bg-white py-20 md:py-28">
        <div className="container-somma">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Vagas abertas
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-ink md:text-4xl">
              Venha construir a corrida do DF com a gente
            </h2>
          </Reveal>

          <div className="mt-14 space-y-8">
            {vagas.length === 0 ? (
              <Reveal>
                <div className="rounded-3xl border border-dashed border-black/10 px-8 py-16 text-center">
                  <h3 className="text-xl font-semibold text-ink">
                    Nenhuma vaga aberta no momento
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-muted">
                    Siga o Somma no Instagram: é por lá que anunciamos cada nova oportunidade antes
                    de todo mundo.
                  </p>
                </div>
              </Reveal>
            ) : (
              vagas.map((vaga, i) => (
                <Reveal key={vaga.slug} delay={i * 0.08}>
                  <VagaCard vaga={vaga} onCandidatar={() => setVagaSelecionada(vaga)} />
                </Reveal>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Modal da candidatura */}
      <AnimatePresence>
        {vagaSelecionada && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(e) => {
              // Só fecha se o clique começou no backdrop — evita fechar quando o
              // usuário arrasta uma seleção de dentro do modal para fora.
              if (e.target === e.currentTarget) fechar();
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="candidatura-titulo"
              className="relative my-auto w-full max-w-md rounded-3xl bg-white shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-black/5 px-7 py-6 md:px-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Candidatura
                  </p>
                  <h3 id="candidatura-titulo" className="mt-1 text-xl font-semibold text-ink">
                    {vagaSelecionada.titulo}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={fechar}
                  aria-label="Fechar formulário"
                  className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-black/5 hover:text-ink"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <CandidaturaForm vaga={vagaSelecionada} onClose={fechar} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
