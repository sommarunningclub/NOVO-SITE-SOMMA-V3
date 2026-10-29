"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Fatia, ResumoInscricoes } from "@/lib/parceiro/estatisticas";

export interface EventoAberto {
  titulo: string;
  dataEvento: string | null;
  horario: string | null;
  local: string | null;
  inscritos: number;
  resumo: ResumoInscricoes;
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

function formatarDia(dia: string, longo = false): string {
  const [ano, mes, d] = dia.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", longo ? { day: "2-digit", month: "long" } : { day: "2-digit", month: "2-digit" }).format(
    new Date(ano, mes - 1, d),
  );
}

const rotuloHora = (h: number) => `${String(h).padStart(2, "0")}h`;
const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);
const plural = (n: number) => `${n.toLocaleString("pt-BR")} ${n === 1 ? "inscrição" : "inscrições"}`;

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">{children}</p>
  );
}

/**
 * Colunas de uma série só, na cor da marca. O número fica escrito só no pico;
 * os outros aparecem ao passar o dedo/mouse (ou com o foco, pelo teclado).
 */
function Colunas({
  titulo,
  pontos,
  pico,
}: {
  titulo: string;
  pontos: { rotulo: string; total: number }[];
  pico: string | null;
}) {
  const max = Math.max(1, ...pontos.map((p) => p.total));
  // Com muitas colunas, o eixo mostra um rótulo a cada N para não encavalar.
  const passo = pontos.length > 12 ? Math.ceil(pontos.length / 6) : 1;
  return (
    <figure className="mt-6">
      <figcaption className="sr-only">{titulo}</figcaption>
      <div className="flex h-36 items-end gap-[2px] border-b border-white/10" aria-hidden="true">
        {pontos.map((p) => {
          const ehPico = p.rotulo === pico;
          return (
            <div key={p.rotulo} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none">
              {ehPico && (
                <span className="absolute inset-x-0 text-center text-[11px] font-semibold tabular-nums text-white" style={{ bottom: `calc(${(p.total / max) * 100}% + 4px)` }}>
                  {p.total}
                </span>
              )}
              <span
                className={`w-full rounded-t-[4px] bg-primary transition-opacity ${ehPico ? "" : "opacity-60 group-hover:opacity-100 group-focus:opacity-100"}`}
                style={{ height: p.total ? `${Math.max(2, (p.total / max) * 100)}%` : 0 }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-white/15 bg-[#1a1a1a] px-2 py-1 text-[11px] text-white/80 group-hover:block group-focus:block">
                {p.rotulo}: <strong className="tabular-nums text-white">{p.total}</strong>
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-[2px] text-[10px] tabular-nums text-white/35" aria-hidden="true">
        {pontos.map((p, i) => (
          <span key={p.rotulo} className="flex-1 text-center">
            {i % passo === 0 ? p.rotulo : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{titulo}</caption>
        <tbody>
          {pontos.map((p) => (
            <tr key={p.rotulo}>
              <th scope="row">{p.rotulo}</th>
              <td>{plural(p.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Barras horizontais com número e porcentagem: lê bem no celular. */
function Barras({ fatias, total }: { fatias: Fatia[]; total: number }) {
  const max = Math.max(1, ...fatias.map((f) => f.total));
  return (
    <ul className="mt-5 space-y-4">
      {fatias.map((f) => (
        <li key={f.rotulo}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-white/80">{f.rotulo}</span>
            <span className="tabular-nums text-white">
              {f.total.toLocaleString("pt-BR")}
              <span className="ml-2 text-xs text-white/40">{pct(f.total, total)}%</span>
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/[0.06]" aria-hidden="true">
            <div className="h-full rounded-full bg-primary" style={{ width: f.total ? `${Math.max(2, (f.total / max) * 100)}%` : 0 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Estatisticas({ inscritos, resumo }: { inscritos: number; resumo: ResumoInscricoes }) {
  if (!inscritos) return null;
  const { diaPico, horaPico } = resumo;
  const variosDias = resumo.porDia.length > 1;
  return (
    <>
      <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <Rotulo>Pico de inscrições</Rotulo>
        <dl className="mt-4 grid grid-cols-2 gap-4">
          {diaPico && (
            <div>
              <dt className="text-xs text-white/45">Dia</dt>
              <dd className="mt-1 font-display text-2xl font-bold">{formatarDia(diaPico.dia, true)}</dd>
              <dd className="text-xs tabular-nums text-white/45">{plural(diaPico.total)}</dd>
            </div>
          )}
          {horaPico && (
            <div>
              <dt className="text-xs text-white/45">Horário</dt>
              <dd className="mt-1 font-display text-2xl font-bold tabular-nums">
                {rotuloHora(horaPico.hora)}–{rotuloHora((horaPico.hora + 1) % 24)}
              </dd>
              <dd className="text-xs tabular-nums text-white/45">{plural(horaPico.total)}</dd>
            </div>
          )}
        </dl>

        {variosDias && diaPico && (
          <>
            <p className="mt-8 text-xs text-white/45">Inscrições por dia</p>
            <Colunas
              titulo="Inscrições por dia"
              pontos={resumo.porDia.map((d) => ({ rotulo: formatarDia(d.dia), total: d.total }))}
              pico={formatarDia(diaPico.dia)}
            />
          </>
        )}
        {horaPico && (
          <>
            <p className="mt-8 text-xs text-white/45">
              Inscrições por horário{variosDias ? ", somando todos os dias" : ""}
            </p>
            <Colunas
              titulo="Inscrições por horário"
              pontos={resumo.porHora.map((h) => ({ rotulo: rotuloHora(h.hora), total: h.total }))}
              pico={rotuloHora(horaPico.hora)}
            />
          </>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <Rotulo>Sexo</Rotulo>
        <Barras fatias={resumo.porSexo} total={inscritos} />
      </section>

      {resumo.porPelotao.length > 0 && (
        <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <Rotulo>Pelotões</Rotulo>
          <Barras fatias={resumo.porPelotao} total={inscritos} />
        </section>
      )}
    </>
  );
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

            <Estatisticas inscritos={evento.inscritos} resumo={evento.resumo} />

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
