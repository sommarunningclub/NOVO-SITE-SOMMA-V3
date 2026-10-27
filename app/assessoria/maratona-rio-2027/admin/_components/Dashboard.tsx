"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LogOut, MessageCircle, RefreshCw, Search, Trash2, X } from "lucide-react";
import { PROVAS_RIO, SEXOS, type ProvaRio, type Sexo } from "@/lib/maratona-rio-2027/provas";
import { cn } from "@/lib/utils";

export interface Cadastro {
  id: number;
  criado_em: string;
  atualizado_em: string;
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  sexo: Sexo;
  prova: ProvaRio["id"];
}

const FUSO = "America/Sao_Paulo";
const diaBR = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }); // AAAA-MM-DD
const dataHora = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, dateStyle: "short", timeStyle: "short" });
const diaCurto = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
const diaLongo = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "short" });

const NOME_PROVA = Object.fromEntries(PROVAS_RIO.map((p) => [p.id, p.nome])) as Record<ProvaRio["id"], string>;
const NOME_SEXO = Object.fromEntries(SEXOS.map((s) => [s.id, s.nome])) as Record<Sexo, string>;

function telefoneLegivel(t: string): string {
  const d = t.startsWith("55") ? t.slice(2) : t;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return t;
}

function cpfLegivel(c: string): string {
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function pct(parte: number, todo: number): string {
  return todo ? `${Math.round((parte / todo) * 100)}%` : "0%";
}

function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function baixarCsv(linhas: Cadastro[]) {
  const cab = ["Nome", "Telefone", "E-mail", "CPF", "Sexo", "Distância", "Cadastrado em", "Atualizado em"];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const corpo = linhas.map((c) =>
    [
      c.nome,
      telefoneLegivel(c.telefone),
      c.email,
      cpfLegivel(c.cpf),
      NOME_SEXO[c.sexo],
      NOME_PROVA[c.prova],
      dataHora.format(new Date(c.criado_em)),
      dataHora.format(new Date(c.atualizado_em)),
    ]
      .map(esc)
      .join(";")
  );
  // BOM + ";" para o Excel em português abrir com acentos e colunas certas.
  const blob = new Blob(["﻿" + [cab.map(esc).join(";"), ...corpo].join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `maratona-rio-2027-cadastros-${diaBR.format(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Cartao({ titulo, children, className }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6", className)}>
      <h2 className="font-bora text-xs font-bold uppercase tracking-[0.2em] text-white/50">{titulo}</h2>
      {children}
    </section>
  );
}

function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: string | number; detalhe?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-white/50">{rotulo}</p>
      <p className="mt-2 font-bora text-4xl font-black italic leading-none tabular-nums">{valor}</p>
      {detalhe && <p className="mt-2 text-sm text-white/55">{detalhe}</p>}
    </div>
  );
}

/** Colunas de cadastros por dia (fuso de Brasília), do primeiro cadastro até hoje. */
function PorDia({ cadastros }: { cadastros: Cadastro[] }) {
  const [foco, setFoco] = useState<number | null>(null);

  const dias = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const c of cadastros) {
      const k = diaBR.format(new Date(c.criado_em));
      contagem.set(k, (contagem.get(k) ?? 0) + 1);
    }
    const hoje = diaBR.format(new Date());
    const chaves = [...contagem.keys()].sort();
    const inicio = chaves[0] ?? hoje;
    const lista: { dia: string; total: number }[] = [];
    for (let d = new Date(`${inicio}T00:00:00Z`); ; d.setUTCDate(d.getUTCDate() + 1)) {
      const k = d.toISOString().slice(0, 10);
      lista.push({ dia: k, total: contagem.get(k) ?? 0 });
      if (k >= hoje) break;
    }
    // Mais de 60 dias não cabe legível: mostra os últimos 60.
    return lista.slice(-60);
  }, [cadastros]);

  const maximo = Math.max(1, ...dias.map((d) => d.total));
  const altura = 160;
  const marcado = foco !== null ? dias[foco] : null;

  return (
    <div className="mt-5">
      <div className="mb-3 h-5 text-sm tabular-nums text-white/70" aria-live="polite">
        {marcado ? (
          <>
            {diaLongo.format(new Date(`${marcado.dia}T00:00:00Z`))}:{" "}
            <strong className="text-white">
              {marcado.total} {marcado.total === 1 ? "cadastro" : "cadastros"}
            </strong>
          </>
        ) : (
          <span className="text-white/40">Passe o dedo ou o mouse nas colunas</span>
        )}
      </div>
      <div className="relative" style={{ height: altura }} onMouseLeave={() => setFoco(null)}>
        {/* Linha do máximo e base, discretas. */}
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-white/10" />
        <span className="absolute right-0 top-1 text-[11px] tabular-nums text-white/40">{maximo}</span>
        <div className="absolute inset-x-0 bottom-0 border-t border-white/20" />
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {dias.map((d, i) => (
            <button
              key={d.dia}
              type="button"
              aria-label={`${diaLongo.format(new Date(`${d.dia}T00:00:00Z`))}: ${d.total}`}
              onMouseEnter={() => setFoco(i)}
              onFocus={() => setFoco(i)}
              onClick={() => setFoco(i)}
              className="group flex h-full min-w-0 flex-1 items-end"
            >
              <span
                className={cn(
                  "block w-full rounded-t-[4px] transition-colors",
                  foco === null || foco === i ? "bg-bora" : "bg-bora/35"
                )}
                style={{ height: d.total ? `${Math.max(3, (d.total / maximo) * 100)}%` : 0 }}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-white/40">
        <span>{diaCurto.format(new Date(`${dias[0].dia}T00:00:00Z`))}</span>
        <span>hoje</span>
      </div>
    </div>
  );
}

export function Dashboard({ cadastros, erro }: { cadastros: Cadastro[]; erro?: string }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [prova, setProva] = useState<ProvaRio["id"] | null>(null);
  const [sexo, setSexo] = useState<Sexo | null>(null);
  const [apagando, setApagando] = useState<number | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const total = cadastros.length;
  const agora = Date.now();
  const ultimas24h = cadastros.filter((c) => agora - new Date(c.criado_em).getTime() < 86_400_000).length;
  const ultimos7d = cadastros.filter((c) => agora - new Date(c.criado_em).getTime() < 7 * 86_400_000).length;
  const mulheres = cadastros.filter((c) => c.sexo === "feminino").length;
  const homens = total - mulheres;

  const porProva = PROVAS_RIO.map((p) => {
    const daProva = cadastros.filter((c) => c.prova === p.id);
    return {
      ...p,
      total: daProva.length,
      feminino: daProva.filter((c) => c.sexo === "feminino").length,
      masculino: daProva.filter((c) => c.sexo === "masculino").length,
    };
  });
  const maiorProva = Math.max(1, ...porProva.map((p) => p.total));
  // Quilômetros que a assessoria vai correr no Rio, somando todo mundo.
  const KM: Record<ProvaRio["id"], number> = { "5k": 5, "10k": 10, "21k": 21.1, "42k": 42.2, desafio_63k: 63.3 };
  const kmTotal = Math.round(cadastros.reduce((s, c) => s + KM[c.prova], 0));

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim());
    const digitos = busca.replace(/\D/g, "");
    return cadastros.filter((c) => {
      if (prova && c.prova !== prova) return false;
      if (sexo && c.sexo !== sexo) return false;
      if (!termo) return true;
      return (
        semAcento(c.nome).includes(termo) ||
        c.email.includes(termo) ||
        (digitos.length >= 3 && (c.cpf.includes(digitos) || c.telefone.includes(digitos)))
      );
    });
  }, [cadastros, busca, prova, sexo]);

  async function apagar(c: Cadastro) {
    if (!window.confirm(`Apagar o cadastro de ${c.nome}? Não dá para desfazer.`)) return;
    setApagando(c.id);
    const res = await fetch(`/api/maratona-rio-2027/admin/intencoes?id=${c.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok && res?.status !== 401) {
      const data = await res?.json().catch(() => ({}));
      window.alert(data?.error || "Não deu certo. Tente de novo.");
    }
    setApagando(null);
    router.refresh();
  }

  async function sair() {
    await fetch("/api/maratona-rio-2027/admin/login", { method: "DELETE" }).catch(() => null);
    router.refresh();
  }

  function atualizar() {
    setAtualizando(true);
    router.refresh();
    setTimeout(() => setAtualizando(false), 800);
  }

  const temFiltro = Boolean(prova || sexo || busca);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Painel da assessoria</p>
          <h1 className="mt-2 font-bora text-4xl font-black uppercase italic leading-none sm:text-5xl">
            Maratona do Rio 2027
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={atualizar}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm hover:border-white/40"
          >
            <RefreshCw className={cn("h-4 w-4", atualizando && "animate-spin")} /> Atualizar
          </button>
          <button
            type="button"
            onClick={() => baixarCsv(filtrados)}
            disabled={!filtrados.length}
            className="inline-flex items-center gap-2 rounded-full bg-bora px-4 py-2.5 text-sm font-bold text-black hover:bg-white disabled:opacity-40"
          >
            <Download className="h-4 w-4" /> Exportar CSV{temFiltro ? ` (${filtrados.length})` : ""}
          </button>
          <button
            type="button"
            onClick={sair}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/70 hover:border-white/40 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>

      {erro && (
        <p role="alert" className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Não deu para ler os cadastros: {erro}
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero rotulo="Cadastros" valor={total} detalhe={`${kmTotal.toLocaleString("pt-BR")} km somados`} />
        <Numero rotulo="Últimas 24h" valor={ultimas24h} detalhe={`${ultimos7d} nos últimos 7 dias`} />
        <Numero rotulo="Mulheres" valor={mulheres} detalhe={pct(mulheres, total)} />
        <Numero rotulo="Homens" valor={homens} detalhe={pct(homens, total)} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-5">
        <Cartao titulo="Por distância" className="lg:col-span-3">
          <ul className="mt-5 space-y-2">
            {porProva.map((p) => {
              const ativa = prova === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setProva(ativa ? null : p.id)}
                    aria-pressed={ativa}
                    className={cn(
                      "w-full rounded-2xl px-3 py-2.5 text-left transition-colors",
                      ativa ? "bg-white/10" : "hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">
                        {p.nome}
                        {p.nome !== p.distancia && <span className="text-white/45"> · {p.distancia}</span>}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        <strong className="text-base">{p.total}</strong>
                        <span className="text-white/45"> · {pct(p.total, total)}</span>
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-bora"
                        style={{ width: p.total ? `${Math.max(2, (p.total / maiorProva) * 100)}%` : 0 }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs tabular-nums text-white/45">
                      {p.feminino} {p.feminino === 1 ? "mulher" : "mulheres"} · {p.masculino}{" "}
                      {p.masculino === 1 ? "homem" : "homens"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 px-3 text-xs text-white/40">Toque numa distância para filtrar a lista.</p>
        </Cartao>

        <Cartao titulo="Cadastros por dia" className="lg:col-span-2">
          {total ? <PorDia cadastros={cadastros} /> : <p className="mt-5 text-sm text-white/50">Nenhum cadastro ainda.</p>}
        </Cartao>
      </div>

      <section className="mt-3 rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:p-5 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <span className="sr-only">Buscar</span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail, CPF ou telefone"
              className="w-full rounded-full border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-bora"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={prova ?? ""}
              onChange={(e) => setProva((e.target.value || null) as ProvaRio["id"] | null)}
              aria-label="Distância"
              className="rounded-full border border-white/15 bg-black px-4 py-2.5 text-sm text-white outline-none focus:border-bora"
            >
              <option value="">Todas as distâncias</option>
              {PROVAS_RIO.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            <select
              value={sexo ?? ""}
              onChange={(e) => setSexo((e.target.value || null) as Sexo | null)}
              aria-label="Sexo"
              className="rounded-full border border-white/15 bg-black px-4 py-2.5 text-sm text-white outline-none focus:border-bora"
            >
              <option value="">Todos</option>
              {SEXOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
            {temFiltro && (
              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setProva(null);
                  setSexo(null);
                }}
                className="inline-flex items-center gap-1 rounded-full px-3 py-2.5 text-sm text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" /> Limpar
              </button>
            )}
          </div>
        </div>

        <p className="px-4 pt-4 text-sm text-white/50 sm:px-5">
          {filtrados.length === total
            ? `${total} ${total === 1 ? "cadastro" : "cadastros"}`
            : `${filtrados.length} de ${total} cadastros`}
        </p>

        {/* Celular: um cartão por pessoa. */}
        <ul className="mt-3 divide-y divide-white/[0.06] md:hidden">
          {filtrados.map((c) => (
            <li key={c.id} className="flex gap-3 px-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{c.nome}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-white/55">
                  <span className="rounded-full border border-bora/40 px-2.5 py-0.5 text-bora">{NOME_PROVA[c.prova]}</span>
                  {NOME_SEXO[c.sexo]}
                </p>
                <a
                  href={`https://wa.me/${c.telefone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/80"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-bora" /> {telefoneLegivel(c.telefone)}
                </a>
                <p className="mt-1 break-all text-sm text-white/60">{c.email}</p>
                <p className="mt-1 text-xs tabular-nums text-white/40">
                  CPF {cpfLegivel(c.cpf)} · {dataHora.format(new Date(c.criado_em))}
                </p>
              </div>
              <button
                type="button"
                onClick={() => apagar(c)}
                disabled={apagando === c.id}
                aria-label={`Apagar ${c.nome}`}
                className="self-start rounded-full p-2 text-white/35 hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {!filtrados.length && (
            <li className="px-5 py-12 text-center text-white/45">
              {total ? "Nenhum cadastro com esses filtros." : "Nenhum cadastro ainda."}
            </li>
          )}
        </ul>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-4 py-3 font-medium sm:px-5">Nome</th>
                <th className="px-3 py-3 font-medium">Distância</th>
                <th className="px-3 py-3 font-medium">Sexo</th>
                <th className="px-3 py-3 font-medium">Telefone</th>
                <th className="px-3 py-3 font-medium">E-mail</th>
                <th className="px-3 py-3 font-medium">CPF</th>
                <th className="px-3 py-3 font-medium">Cadastro</th>
                <th className="px-4 py-3 sm:px-5">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id} className="border-t border-white/[0.06] hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap px-4 py-3 font-medium sm:px-5">{c.nome}</td>
                  <td className="px-3 py-3">
                    <span className="whitespace-nowrap rounded-full border border-bora/40 px-2.5 py-1 text-xs text-bora">
                      {NOME_PROVA[c.prova]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-white/70">{NOME_SEXO[c.sexo]}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <a
                      href={`https://wa.me/${c.telefone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-white/80 hover:text-bora"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> {telefoneLegivel(c.telefone)}
                    </a>
                  </td>
                  <td className="px-3 py-3 text-white/70">{c.email}</td>
                  <td className="whitespace-nowrap px-3 py-3 tabular-nums text-white/70">{cpfLegivel(c.cpf)}</td>
                  <td className="whitespace-nowrap px-3 py-3 tabular-nums text-white/50">
                    {dataHora.format(new Date(c.criado_em))}
                    {c.atualizado_em !== c.criado_em &&
                      new Date(c.atualizado_em).getTime() - new Date(c.criado_em).getTime() > 60_000 && (
                        <span className="block text-[11px] text-white/35">
                          editado {dataHora.format(new Date(c.atualizado_em))}
                        </span>
                      )}
                  </td>
                  <td className="px-4 py-3 text-right sm:px-5">
                    <button
                      type="button"
                      onClick={() => apagar(c)}
                      disabled={apagando === c.id}
                      aria-label={`Apagar ${c.nome}`}
                      className="rounded-full p-2 text-white/35 hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!filtrados.length && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-white/45">
                    {total ? "Nenhum cadastro com esses filtros." : "Nenhum cadastro ainda."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
