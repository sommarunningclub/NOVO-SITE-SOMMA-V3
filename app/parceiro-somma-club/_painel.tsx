"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export interface EventoAberto {
  titulo: string;
  dataEvento: string | null;
  horario: string | null;
  local: string | null;
  inscritos: number;
}

/** Intervalo do refresh automático: o número anda durante a semana, não ao vivo. */
const REFRESH_MS = 60_000;

function formatarData(iso: string | null): string | null {
  if (!iso) return null;
  // A data vem como `YYYY-MM-DD` (coluna `date`). Montar com `new Date(iso)`
  // interpretaria como UTC e voltaria um dia no fuso de Brasília.
  const [ano, mes, dia] = iso.split("-").map(Number);
  if (!ano || !mes || !dia) return null;
  const texto = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(ano, mes - 1, dia));
  // Só a inicial sobe. `capitalize` no CSS viraria "26 De Setembro", e
  // `first-letter:` não vale para inline como o <span> abaixo.
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarHora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export function Painel({
  parceiro,
  evento,
  atualizadoEm,
}: {
  parceiro: string;
  evento: EventoAberto | null;
  atualizadoEm: string;
}) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();

  // `atualizadoEm` vem do servidor: formatar direto no corpo causaria divergência
  // entre o HTML do servidor e o do cliente. Só depois de montar é que vira hora.
  const [hora, setHora] = useState<string | null>(null);
  useEffect(() => setHora(formatarHora(atualizadoEm)), [atualizadoEm]);

  useEffect(() => {
    const id = setInterval(() => startTransition(() => router.refresh()), REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  const data = formatarData(evento?.dataEvento ?? null);

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-5 py-12 text-white">
      <div className="mx-auto w-full max-w-lg">
        <header className="flex items-center justify-between">
          <Image
            src="/logo-somma.svg"
            alt="SOMMA Club"
            width={120}
            height={32}
            className="h-7 w-auto"
            priority
          />
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
            Acesso exclusivo
          </span>
        </header>

        <p className="mt-10 text-sm text-white/50">Olá, {parceiro}.</p>

        {evento ? (
          <>
            <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
                Check-in aberto
              </p>
              <h1 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">
                {evento.titulo}
              </h1>
              {(data || evento.horario || evento.local) && (
                <p className="mt-2 text-sm text-white/50">
                  {[data, evento.horario, evento.local].filter(Boolean).join(" · ")}
                </p>
              )}

              <div className="mt-8 border-t border-white/10 pt-8">
                <p className="font-display text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">
                  Inscritos até agora
                </p>
                <p className="mt-3 font-display text-6xl font-bold tabular-nums leading-none sm:text-7xl">
                  {evento.inscritos.toLocaleString("pt-BR")}
                </p>
              </div>
            </section>

            <div className="mt-4 flex items-center justify-between text-xs text-white/35">
              <span aria-live="polite">
                {pendente ? "Atualizando..." : hora ? `Atualizado às ${hora}` : " "}
              </span>
              <button
                type="button"
                onClick={() => startTransition(() => router.refresh())}
                disabled={pendente}
                className="rounded-lg border border-white/15 px-3 py-1.5 font-medium text-white/60 transition-colors hover:border-white/30 hover:text-white disabled:opacity-40"
              >
                Atualizar
              </button>
            </div>
          </>
        ) : (
          <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">
              Nenhum check-in aberto
            </p>
            <p className="mt-3 text-sm text-white/60">
              Assim que o próximo treino abrir as inscrições, o número aparece aqui.
            </p>
          </section>
        )}

        <p className="mt-10 text-[11px] text-white/25">
          Conteúdo exclusivo para parceiros do SOMMA Club.
        </p>
      </div>
    </main>
  );
}
