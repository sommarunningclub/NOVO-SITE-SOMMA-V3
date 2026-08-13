"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EVENT, getUnit } from "@/lib/desafio-esteiras/event.config";
import type { OperatorSession } from "@/lib/desafio-esteiras/auth";
import { FichaCadastro } from "./FichaCadastro";
import { NovoCadastro } from "./NovoCadastro";

interface Dados {
  escopo: string;
  role: string;
  nome: string;
  total: number;
  cancelados: number;
  checkins: number;
  pendentes: number;
  porUnidade: {
    id: string;
    nome: string;
    curto: string;
    inscritos: number;
    checkins: number;
    pendentes: number;
    capacidade: number | null;
  }[];
  origens: { fonte: string; inscritos: number; checkins: number }[];
  campanhas: { campanha: string; inscritos: number }[];
  porDia: { dia: string; n: number }[];
  porHora: { hora: string; n: number }[];
  ultimos: { id: string; full_name: string; ticket_code: string; unit_id: string; status: string; created_at: string }[];
  gestao: {
    vinculado: boolean;
    checkinStatus: "aberto" | "bloqueado" | "encerrado" | null;
    encerrado: boolean;
    titulo: string | null;
  };
  atualizado_em: string;
}

const ROTULO_CHECKIN: Record<string, string> = {
  aberto: "check-in aberto",
  bloqueado: "check-in bloqueado",
  encerrado: "check-in encerrado",
};

const INTERVALO = 20_000;

/**
 * Painel do evento.
 *
 * Atualiza sozinho por polling de 20s enquanto a aba está visível — sem reload.
 * Não usamos Supabase Realtime porque a tabela roda com RLS sem policy: assinar
 * pelo browser exigiria abrir leitura para a anon key, o que não compensa.
 */
export function Dashboard({ session }: { session: OperatorSession }) {
  const router = useRouter();
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);

  const buscar = useCallback(async () => {
    setAtualizando(true);
    try {
      const res = await fetch("/api/desafio-esteiras/admin/dashboard", { cache: "no-store" });
      if (res.status === 401) {
        router.refresh();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível carregar.");
        return;
      }
      setDados(data as Dados);
      setErro(null);
    } catch {
      setErro("Falha de conexão. Tentando de novo…");
    } finally {
      setAtualizando(false);
    }
  }, [router]);

  useEffect(() => {
    buscar();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") buscar();
    }, INTERVALO);
    return () => clearInterval(id);
  }, [buscar]);

  async function sair() {
    await fetch("/api/desafio-esteiras/admin/login", { method: "DELETE" });
    router.refresh();
  }

  const maxDia = Math.max(1, ...(dados?.porDia.map((d) => d.n) ?? [1]));
  const maxHora = Math.max(1, ...(dados?.porHora.map((d) => d.n) ?? [1]));

  return (
    <main className="dst-wrap py-6 md:py-10">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--line)] pb-5">
        <div>
          <p className="dst-label text-[color:var(--somma)]">Painel do evento</p>
          <h1 className="dst-display mt-2 text-[clamp(1.6rem,6vw,2.6rem)]">DESAFIO DAS ESTEIRAS</h1>
          <p className="dst-label mt-2 text-[color:rgba(242,240,236,0.45)]">
            {EVENT.dataExtenso} · {session.nome}
            {session.unitId && ` · escopo: ${getUnit(session.unitId)?.nome}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setNovo(true)}
            className="dst-btn !min-h-[44px] !px-4 !text-[0.7rem]"
          >
            Novo cadastro
          </button>
          <Link
            href="/admin/desafio-das-esteiras/inscritos"
            className="dst-btn dst-btn--ghost !min-h-[44px] !px-4 !text-[0.7rem]"
          >
            Inscritos
          </Link>
          <Link href="/admin/desafio-das-esteiras/checkin" className="dst-btn !min-h-[44px] !px-4 !text-[0.7rem]">
            Check-in
          </Link>
          <button
            type="button"
            onClick={sair}
            className="dst-btn dst-btn--ghost !min-h-[44px] !px-4 !text-[0.7rem]"
          >
            Sair
          </button>
        </div>
      </header>

      {aviso && (
        <p role="status" className="dst-label mt-5 text-[color:var(--somma)]">
          {aviso}
        </p>
      )}
      {erro && (
        <p role="alert" className="dst-label mt-5 text-[color:var(--evolve)]">
          {erro}
        </p>
      )}

      {!dados ? (
        <p className="dst-label mt-10 text-[color:rgba(242,240,236,0.4)]">Carregando dados…</p>
      ) : (
        <>
          {/* Vínculo com o sistema de eventos da gestão */}
          <section
            className="dst-panel mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 p-4"
            style={{ borderColor: dados.gestao?.vinculado ? "var(--line)" : "rgba(224,38,27,0.5)" }}
            aria-label="Integração com a gestão"
          >
            <span
              className="block h-2 w-2 shrink-0 rounded-full"
              style={{ background: dados.gestao?.vinculado ? "var(--somma)" : "var(--evolve)" }}
              aria-hidden
            />
            {dados.gestao?.vinculado ? (
              <>
                <span className="dst-label text-[color:var(--somma)]">Sincronizado com a gestão</span>
                <span className="dst-mono text-[0.78rem] text-[color:rgba(242,240,236,0.55)]">
                  {dados.gestao.titulo}
                  {dados.gestao.checkinStatus && ` · ${ROTULO_CHECKIN[dados.gestao.checkinStatus]}`}
                  {dados.gestao.encerrado && " · evento encerrado"}
                </span>
              </>
            ) : (
              <>
                <span className="dst-label text-[color:var(--evolve)]">Sem vínculo com a gestão</span>
                <span className="dst-mono text-[0.78rem] text-[color:rgba(242,240,236,0.55)]">
                  rode scripts/desafio-esteiras-integracao-gestao.sql — as inscrições funcionam, mas
                  não aparecem no painel de eventos
                </span>
              </>
            )}
          </section>

          {/* Números principais */}
          <section className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumo">
            {[
              { k: "Total de inscritos", v: dados.total, cor: "var(--paper)" },
              { k: "Check-ins realizados", v: dados.checkins, cor: "var(--somma)" },
              { k: "Check-ins pendentes", v: dados.pendentes, cor: "var(--paper)" },
              { k: "Cancelados", v: dados.cancelados, cor: "rgba(242,240,236,0.5)" },
            ].map((c) => (
              <div key={c.k} className="dst-panel p-5">
                <p className="dst-label text-[color:rgba(242,240,236,0.4)]">{c.k}</p>
                <p className="dst-num mt-3 text-[2.6rem] font-bold leading-none" style={{ color: c.cor }}>
                  {c.v.toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
          </section>

          {/* Por unidade */}
          <section className="mt-8" aria-labelledby="por-unidade">
            <h2 id="por-unidade" className="dst-label mb-3 text-[color:rgba(242,240,236,0.4)]">
              Por unidade
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {dados.porUnidade.map((u) => {
                const taxa = u.inscritos ? Math.round((u.checkins / u.inscritos) * 100) : 0;
                return (
                  <div key={u.id} className="dst-panel p-5">
                    <p className="dst-display text-[1.15rem]">{u.curto}</p>
                    <p className="dst-num mt-3 text-[2.2rem] font-bold leading-none">
                      {u.inscritos.toLocaleString("pt-BR")}
                    </p>
                    <p className="dst-label mt-1.5 text-[color:rgba(242,240,236,0.4)]">inscritos</p>

                    <div className="mt-4 h-[3px] w-full bg-[color:var(--line)]" aria-hidden>
                      <div
                        className="h-full origin-left transition-transform duration-700"
                        style={{ background: "var(--energia)", transform: `scaleX(${taxa / 100})` }}
                      />
                    </div>
                    <p className="dst-label mt-2.5 flex justify-between text-[color:rgba(242,240,236,0.5)]">
                      <span style={{ color: "var(--somma)" }}>{u.checkins} check-in</span>
                      <span>{taxa}%</span>
                    </p>
                    {u.capacidade !== null && (
                      <p className="dst-label mt-1.5 text-[color:rgba(242,240,236,0.35)]">
                        capacidade {u.capacidade}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            {/* Origem */}
            <section className="dst-panel p-5" aria-labelledby="origens">
              <h2 id="origens" className="dst-label mb-4 text-[color:rgba(242,240,236,0.4)]">
                Conversão por origem
              </h2>
              <ul className="space-y-3">
                {dados.origens.slice(0, 8).map((o) => (
                  <li key={o.fonte} className="flex items-center justify-between gap-4">
                    <span className="dst-mono truncate text-[0.85rem]">{o.fonte}</span>
                    <span className="flex shrink-0 items-baseline gap-3">
                      <span className="dst-num text-[1.05rem] font-bold">{o.inscritos}</span>
                      <span className="dst-label text-[color:var(--somma)]">
                        {o.inscritos ? Math.round((o.checkins / o.inscritos) * 100) : 0}% ✓
                      </span>
                    </span>
                  </li>
                ))}
                {!dados.origens.length && (
                  <li className="dst-label text-[color:rgba(242,240,236,0.35)]">Sem inscrições ainda</li>
                )}
              </ul>
            </section>

            {/* Campanhas */}
            <section className="dst-panel p-5" aria-labelledby="campanhas">
              <h2 id="campanhas" className="dst-label mb-4 text-[color:rgba(242,240,236,0.4)]">
                UTMs (source · medium · campaign)
              </h2>
              <ul className="space-y-3">
                {dados.campanhas.map((c) => (
                  <li key={c.campanha} className="flex items-center justify-between gap-4">
                    <span className="dst-mono truncate text-[0.8rem]">{c.campanha}</span>
                    <span className="dst-num shrink-0 text-[1.05rem] font-bold">{c.inscritos}</span>
                  </li>
                ))}
                {!dados.campanhas.length && (
                  <li className="dst-label text-[color:rgba(242,240,236,0.35)]">
                    Nenhuma campanha marcada com UTM
                  </li>
                )}
              </ul>
            </section>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {/* Inscrições por dia */}
            <section className="dst-panel p-5" aria-labelledby="por-dia">
              <h2 id="por-dia" className="dst-label mb-4 text-[color:rgba(242,240,236,0.4)]">
                Inscrições por dia
              </h2>
              <ul className="space-y-2">
                {dados.porDia.slice(-10).map((d) => (
                  <li key={d.dia} className="flex items-center gap-3">
                    <span className="dst-mono w-16 shrink-0 text-[0.75rem] opacity-60">{d.dia}</span>
                    <span className="h-3 flex-1 bg-[color:var(--line)]" aria-hidden>
                      <span
                        className="block h-full"
                        style={{ background: "var(--energia)", width: `${(d.n / maxDia) * 100}%` }}
                      />
                    </span>
                    <span className="dst-num w-8 shrink-0 text-right text-[0.85rem] font-bold">{d.n}</span>
                  </li>
                ))}
                {!dados.porDia.length && (
                  <li className="dst-label text-[color:rgba(242,240,236,0.35)]">Sem dados</li>
                )}
              </ul>
            </section>

            {/* Inscrições por hora */}
            <section className="dst-panel p-5" aria-labelledby="por-hora">
              <h2 id="por-hora" className="dst-label mb-4 text-[color:rgba(242,240,236,0.4)]">
                Últimas 24 horas com inscrição
              </h2>
              <ul className="space-y-2">
                {dados.porHora.slice(-10).map((h) => (
                  <li key={h.hora} className="flex items-center gap-3">
                    <span className="dst-mono w-24 shrink-0 text-[0.72rem] opacity-60">{h.hora}h</span>
                    <span className="h-3 flex-1 bg-[color:var(--line)]" aria-hidden>
                      <span
                        className="block h-full"
                        style={{ background: "var(--somma)", width: `${(h.n / maxHora) * 100}%` }}
                      />
                    </span>
                    <span className="dst-num w-8 shrink-0 text-right text-[0.85rem] font-bold">{h.n}</span>
                  </li>
                ))}
                {!dados.porHora.length && (
                  <li className="dst-label text-[color:rgba(242,240,236,0.35)]">Sem dados</li>
                )}
              </ul>
            </section>
          </div>

          {/* Últimos inscritos */}
          <section className="dst-panel mt-3 overflow-x-auto" aria-labelledby="ultimos">
            <h2 id="ultimos" className="dst-label p-5 pb-3 text-[color:rgba(242,240,236,0.4)]">
              Últimos inscritos · clique no nome para abrir a ficha
            </h2>
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-y border-[color:var(--line)]">
                  {["Nome", "Unidade", "Ticket", "Status", "Quando"].map((h) => (
                    <th key={h} className="dst-label px-5 py-3 text-[color:rgba(242,240,236,0.4)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dados.ultimos.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer border-b border-[color:var(--line)] transition-colors hover:bg-[rgba(255,44,4,0.06)]"
                    onClick={() => setFichaId(r.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setFichaId(r.id);
                      }
                    }}
                    tabIndex={0}
                  >
                    <td className="px-5 py-3 text-[0.9rem]">
                      <span className="underline-offset-4 hover:underline">{r.full_name}</span>
                    </td>
                    <td className="px-5 py-3 text-[0.85rem] opacity-70">
                      {getUnit(r.unit_id)?.curto ?? r.unit_id}
                    </td>
                    <td className="dst-mono px-5 py-3 text-[0.8rem]">{r.ticket_code}</td>
                    <td className="px-5 py-3">
                      <span
                        className="dst-label"
                        style={{ color: r.status === "checked_in" ? "var(--somma)" : "rgba(242,240,236,0.5)" }}
                      >
                        {r.status === "checked_in" ? "CHECK-IN" : "CONFIRMADO"}
                      </span>
                    </td>
                    <td className="dst-mono px-5 py-3 text-[0.78rem] opacity-60">
                      {new Date(r.created_at).toLocaleString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
                {!dados.ultimos.length && (
                  <tr>
                    <td colSpan={5} className="dst-label px-5 py-8 text-center text-[color:rgba(242,240,236,0.35)]">
                      Nenhuma inscrição ainda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <p className="dst-label mt-5 flex items-center gap-2 text-[color:rgba(242,240,236,0.35)]">
            <span
              className="block h-1.5 w-1.5 rounded-full"
              style={{ background: atualizando ? "var(--somma)" : "rgba(242,240,236,0.3)" }}
            />
            Atualizado{" "}
            {new Date(dados.atualizado_em).toLocaleTimeString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })}{" "}
            · atualiza a cada 20s
          </p>
        </>
      )}

      {fichaId && (
        <FichaCadastro
          id={fichaId}
          session={session}
          onFechar={() => setFichaId(null)}
          onMudou={(msg) => {
            setAviso(msg);
            buscar();
          }}
        />
      )}
      {novo && (
        <NovoCadastro
          session={session}
          onFechar={() => setNovo(false)}
          onCriado={(msg) => {
            setNovo(false);
            setAviso(msg);
            buscar();
          }}
        />
      )}
    </main>
  );
}
