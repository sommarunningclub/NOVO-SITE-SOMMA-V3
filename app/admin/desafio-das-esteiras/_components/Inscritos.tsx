"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CATEGORIAS,
  FAIXAS_ETARIAS,
  PARTICIPACAO_LABELS,
  UNITS,
  getUnit,
  type Participacao,
  type VagasStatus,
} from "@/lib/desafio-esteiras/event.config";
import { formatPhone } from "@/lib/desafio-esteiras/schema";
import type { OperatorSession } from "@/lib/desafio-esteiras/auth";
import { FichaCadastro } from "./FichaCadastro";
import { NovoCadastro } from "./NovoCadastro";
import { STATUS_COR, STATUS_LABEL, horaInscrito, type Inscrito } from "./inscrito";

interface Resumo {
  total: number;
  cancelados: number;
  competidores: number;
  espectadores: number;
  checkins: number;
  comFoto: number;
  semCategoria: number;
  porSexo: { feminino: number; masculino: number };
  idadeMedia: number | null;
  idadeMin: number | null;
  idadeMax: number | null;
  porFaixa: { id: string; nome: string; n: number }[];
  porUnidade: {
    id: string;
    curto: string;
    total: number;
    competidores: number;
    espectadores: number;
    checkins: number;
    feminino: number;
    masculino: number;
    vagas: Record<
      "feminino" | "masculino",
      {
        ocupadas: number;
        total: number;
        restantes: number;
        status: VagasStatus;
        baterias: { n: number; ocupadas: number }[];
        semBateria: number;
      }
    >;
  }[];
  porOrigem: { fonte: string; n: number }[];
}

const hora = horaInscrito;

export function Inscritos({ session }: { session: OperatorSession }) {
  const [lista, setLista] = useState<Inscrito[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [filtrados, setFiltrados] = useState(0);
  const [f, setF] = useState({
    q: "",
    unidade: "",
    status: "",
    sexo: "",
    participacao: "",
    faixa: "",
    foto: "",
    ordem: "recentes",
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ficha, setFicha] = useState<{ inscrito: Inscrito; inicio?: "ficha" | "editar" | "transferir" | "excluir" } | null>(null);
  const [novo, setNovo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const p = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => {
        if (v && !(k === "q" && v.trim().length < 3)) p.set(k, v);
      });
      const res = await fetch(`/api/desafio-esteiras/admin/inscritos?${p}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível carregar.");
        return;
      }
      setLista(data.inscritos ?? []);
      setResumo(data.resumo ?? null);
      setFiltrados(data.filtrados ?? 0);
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setCarregando(false);
    }
  }, [f]);

  useEffect(() => {
    const t = setTimeout(carregar, 300);
    return () => clearTimeout(t);
  }, [carregar]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((atual) => ({ ...atual, [k]: e.target.value }));

  const temFiltro = useMemo(
    () => Object.entries(f).some(([k, v]) => v && k !== "ordem"),
    [f]
  );

  async function mudarStatus(i: Inscrito, novo: Inscrito["status"]) {
    setAviso(null);
    const res = await fetch("/api/desafio-esteiras/admin/inscritos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: i.id, status: novo }),
    });
    const data = await res.json();
    if (!res.ok) return setErro(data.error ?? "Não foi possível alterar.");
    setAviso(`${i.full_name}: ${STATUS_LABEL[novo].toLowerCase()}.`);
    carregar();
  }

  async function definirBateria(i: Inscrito, n: number | null) {
    setAviso(null);
    const res = await fetch("/api/desafio-esteiras/admin/inscritos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: i.id, heat_number: n }),
    });
    const data = await res.json();
    if (!res.ok) return setErro(data.error ?? "Não foi possível definir a bateria.");
    setAviso(n ? `${i.full_name} → bateria ${n}.` : `${i.full_name} ficou sem bateria.`);
    carregar();
  }

  /** Exporta o que está na tela — o CSV respeita os filtros aplicados. */
  function exportarCsv() {
    const cab = [
      "nome", "cpf", "idade", "nascimento", "email", "telefone", "unidade", "categoria",
      "participacao", "status", "ticket", "foto", "inscrito_em", "checkin_em",
      "utm_source", "utm_medium", "utm_campaign", "referral", "bateria",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const linhas = lista.map((i) =>
      [
        i.full_name, i.cpf_mascarado, i.idade ?? "", i.birth_date, i.email, formatPhone(i.phone),
        getUnit(i.unit_id)?.nome ?? i.unit_id,
        CATEGORIAS.find((c) => c.id === i.sexo)?.curto ?? "",
        PARTICIPACAO_LABELS[i.participacao]?.titulo ?? i.participacao,
        STATUS_LABEL[i.status], i.ticket_code, i.tem_foto ? "sim" : "não",
        hora(i.created_at), hora(i.checked_in_at),
        i.utm_source ?? "", i.utm_medium ?? "", i.utm_campaign ?? "", i.referral ?? "", i.heat_number ?? "",
      ].map(esc).join(";")
    );
    // BOM para o Excel abrir os acentos corretamente
    const blob = new Blob(["﻿" + [cab.join(";"), ...linhas].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `desafio-esteiras-inscritos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const escopo = session.unitId ? getUnit(session.unitId)?.nome : "todas as unidades";

  return (
    <main className="dst-wrap py-6 md:py-10">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--line)] pb-5">
        <div>
          <p className="dst-label text-[color:var(--somma)]">Inscritos</p>
          <h1 className="dst-display mt-2 text-[clamp(1.5rem,6vw,2.4rem)]">GESTÃO DE CADASTROS</h1>
          <p className="dst-label mt-2 text-[color:rgba(242,240,236,0.45)]">
            {session.nome} · escopo: {escopo}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setNovo(true)}
            className="dst-btn !min-h-[44px] !px-4 !text-[0.7rem]"
          >
            Novo cadastro
          </button>
          <button
            type="button"
            onClick={exportarCsv}
            disabled={!lista.length}
            className="dst-btn dst-btn--ghost !min-h-[44px] !px-4 !text-[0.7rem] disabled:opacity-40"
          >
            Exportar CSV
          </button>
          <Link href="/admin/desafio-das-esteiras" className="dst-btn dst-btn--ghost !min-h-[44px] !px-4 !text-[0.7rem]">
            Painel
          </Link>
          <Link href="/admin/desafio-das-esteiras/checkin" className="dst-btn !min-h-[44px] !px-4 !text-[0.7rem]">
            Check-in
          </Link>
        </div>
      </header>

      {/* ── Resumo ── */}
      {resumo && (
        <>
          <section className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="Resumo">
            {[
              { k: "Inscritos", v: resumo.total, cor: "var(--paper)" },
              { k: "Competidores", v: resumo.competidores, cor: "var(--somma)" },
              { k: "Espectadores", v: resumo.espectadores, cor: "var(--paper)" },
              { k: "Check-ins", v: resumo.checkins, cor: "var(--somma)" },
              { k: "Com foto", v: resumo.comFoto, cor: "var(--paper)" },
              { k: "Cancelados", v: resumo.cancelados, cor: "rgba(242,240,236,0.45)" },
            ].map((c) => (
              <div key={c.k} className="dst-panel p-4">
                <p className="dst-label text-[color:rgba(242,240,236,0.4)]">{c.k}</p>
                <p className="dst-num mt-2 text-[1.8rem] font-bold leading-none" style={{ color: c.cor }}>
                  {c.v.toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
          </section>

          <div className="mt-2 grid gap-2 lg:grid-cols-3">
            {/* Categoria */}
            <section className="dst-panel p-5" aria-label="Por categoria">
              <p className="dst-label mb-3 text-[color:rgba(242,240,236,0.4)]">Por categoria</p>
              <ul className="space-y-2.5">
                {[
                  { n: "Feminino", v: resumo.porSexo.feminino },
                  { n: "Masculino", v: resumo.porSexo.masculino },
                  { n: "Sem categoria", v: resumo.semCategoria },
                ].map((c) => (
                  <li key={c.n} className="flex items-center justify-between gap-3">
                    <span className="text-[0.88rem]">{c.n}</span>
                    <span className="dst-num text-[1rem] font-bold">{c.v}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Idade */}
            <section className="dst-panel p-5" aria-label="Por idade">
              <p className="dst-label mb-3 text-[color:rgba(242,240,236,0.4)]">
                Idade {resumo.idadeMedia !== null && `· média ${resumo.idadeMedia} anos`}
                {resumo.idadeMin !== null && ` · ${resumo.idadeMin}–${resumo.idadeMax}`}
              </p>
              <ul className="space-y-2">
                {resumo.porFaixa.map((fa) => {
                  const max = Math.max(1, ...resumo.porFaixa.map((x) => x.n));
                  return (
                    <li key={fa.id} className="flex items-center gap-3">
                      <span className="dst-mono w-14 shrink-0 text-[0.75rem] opacity-60">{fa.nome}</span>
                      <span className="h-2.5 flex-1 bg-[color:var(--line)]" aria-hidden>
                        <span
                          className="block h-full"
                          style={{ background: "var(--energia)", width: `${(fa.n / max) * 100}%` }}
                        />
                      </span>
                      <span className="dst-num w-7 shrink-0 text-right text-[0.85rem] font-bold">{fa.n}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Origem */}
            <section className="dst-panel p-5" aria-label="Por origem">
              <p className="dst-label mb-3 text-[color:rgba(242,240,236,0.4)]">Origem</p>
              <ul className="space-y-2.5">
                {resumo.porOrigem.slice(0, 6).map((o) => (
                  <li key={o.fonte} className="flex items-center justify-between gap-3">
                    <span className="dst-mono truncate text-[0.82rem]">{o.fonte}</span>
                    <span className="dst-num shrink-0 text-[1rem] font-bold">{o.n}</span>
                  </li>
                ))}
                {!resumo.porOrigem.length && (
                  <li className="dst-label text-[color:rgba(242,240,236,0.35)]">Sem dados</li>
                )}
              </ul>
            </section>
          </div>

          {/* Unidades + vagas de competidor */}
          <section className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Por unidade">
            {resumo.porUnidade.map((u) => (
              <div key={u.id} className="dst-panel p-5">
                <p className="dst-display text-[1.05rem]">{u.curto}</p>
                <p className="dst-num mt-2 text-[1.8rem] font-bold leading-none">{u.total}</p>
                <p className="dst-label mt-1.5 text-[color:rgba(242,240,236,0.4)]">inscritos</p>

                <dl className="mt-4 space-y-1.5 border-t border-[color:var(--line)] pt-3">
                  {[
                    ["Competem", u.competidores],
                    ["Assistem", u.espectadores],
                    ["Feminino", u.feminino],
                    ["Masculino", u.masculino],
                    ["Check-ins", u.checkins],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex justify-between gap-2">
                      <dt className="dst-label text-[color:rgba(242,240,236,0.4)]">{k}</dt>
                      <dd className="dst-num text-[0.85rem] font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>

                {/* Vagas e baterias por categoria — a regra da competição */}
                <div className="mt-3 space-y-3 border-t border-[color:var(--line)] pt-3">
                  {(["feminino", "masculino"] as const).map((cat) => {
                    const v = u.vagas?.[cat];
                    if (!v) return null;
                    return (
                      <div key={cat}>
                        <p className="dst-label flex items-baseline justify-between gap-2">
                          <span className="text-[color:rgba(242,240,236,0.5)]">
                            {cat === "feminino" ? "Feminino" : "Masculino"}
                          </span>
                          <span
                            className="dst-num"
                            style={{
                              color:
                                v.status === "esgotada"
                                  ? "var(--evolve)"
                                  : v.status === "ultimas"
                                    ? "var(--somma)"
                                    : "var(--paper)",
                            }}
                          >
                            {v.ocupadas} / {v.total}
                          </span>
                        </p>
                        <div className="mt-1.5 h-[3px] w-full bg-[color:var(--line)]" aria-hidden>
                          <div
                            className="h-full origin-left"
                            style={{
                              background: "var(--energia)",
                              transform: `scaleX(${Math.min(1, v.ocupadas / v.total)})`,
                            }}
                          />
                        </div>
                        <p className="dst-label mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.5rem] text-[color:rgba(242,240,236,0.4)]">
                          {v.baterias.map((b) => (
                            <span
                              key={b.n}
                              style={{ color: b.ocupadas >= 4 ? "var(--somma)" : undefined }}
                            >
                              B{b.n} {b.ocupadas}/4
                            </span>
                          ))}
                          {v.semBateria > 0 && (
                            <span style={{ color: "var(--evolve)" }}>{v.semBateria} sem bateria</span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {/* ── Filtros ── */}
      <section className="mt-6 border-t border-[color:var(--line)] pt-6" aria-label="Filtros">
        <div className="dst-field-wrap">
          <input id="busca" value={f.q} onChange={set("q")} placeholder=" " autoComplete="off" className="dst-field" />
          <label htmlFor="busca" className="dst-field-label">
            Nome, e-mail, CPF, telefone ou ticket
          </label>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {session.role === "admin" && (
            <Select rotulo="Unidade" value={f.unidade} onChange={set("unidade")} opcoes={[["", "Todas as unidades"], ...UNITS.map((u) => [u.id, u.curto] as [string, string])]} />
          )}
          <Select rotulo="Status" value={f.status} onChange={set("status")} opcoes={[["", "Todos os status"], ["confirmed", "Confirmados"], ["checked_in", "Com check-in"], ["cancelled", "Cancelados"]]} />
          <Select rotulo="Categoria" value={f.sexo} onChange={set("sexo")} opcoes={[["", "Todas as categorias"], ...CATEGORIAS.map((c) => [c.id, c.curto] as [string, string]), ["sem", "Sem categoria"]]} />
          <Select rotulo="Participação" value={f.participacao} onChange={set("participacao")} opcoes={[["", "Competidor e espectador"], ["competidor", "Só competidores"], ["espectador", "Só espectadores"]]} />
          <Select rotulo="Faixa etária" value={f.faixa} onChange={set("faixa")} opcoes={[["", "Todas as idades"], ...FAIXAS_ETARIAS.map((x) => [x.id, `${x.nome} anos`] as [string, string])]} />
          <Select rotulo="Foto" value={f.foto} onChange={set("foto")} opcoes={[["", "Com e sem foto"], ["com", "Só com foto"], ["sem", "Só sem foto"]]} />
          <Select rotulo="Ordem" value={f.ordem} onChange={set("ordem")} opcoes={[["recentes", "Mais recentes"], ["antigos", "Mais antigos"], ["nome", "Nome (A–Z)"], ["idade", "Idade (maior)"], ["idade-asc", "Idade (menor)"]]} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <p className="dst-label text-[color:rgba(242,240,236,0.4)]">
            {carregando ? "Carregando…" : `${filtrados} cadastro${filtrados === 1 ? "" : "s"}`}
            {lista.length < filtrados && ` · mostrando ${lista.length}`}
          </p>
          {temFiltro && (
            <button
              type="button"
              onClick={() => setF({ q: "", unidade: "", status: "", sexo: "", participacao: "", faixa: "", foto: "", ordem: f.ordem })}
              className="dst-label underline underline-offset-4 hover:text-[color:var(--somma)]"
            >
              limpar filtros
            </button>
          )}
        </div>
      </section>

      {aviso && <p role="status" className="dst-label mt-5 text-[color:var(--somma)]">{aviso}</p>}
      {erro && <p role="alert" className="dst-label mt-5 text-[color:var(--evolve)]">{erro}</p>}

      {/* ── Lista ── */}
      <ul className="mt-4 space-y-3">
        {lista.map((i) => (
          <li key={i.id} className="dst-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                {i.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.foto_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" loading="lazy" />
                ) : (
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{ background: "var(--ink-3)" }} aria-hidden>
                    <span className="dst-display text-[1rem] text-[color:rgba(242,240,236,0.5)]">
                      {i.full_name.charAt(0).toUpperCase()}
                    </span>
                  </span>
                )}

                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setFicha({ inscrito: i })}
                    className="dst-display text-left text-[1.1rem] underline-offset-4 hover:underline"
                  >
                    {i.full_name}
                  </button>
                  <p className="dst-mono mt-1.5 text-[0.78rem] opacity-65">
                    {getUnit(i.unit_id)?.curto ?? i.unit_id} · {i.ticket_code}
                    {i.sexo ? ` · ${CATEGORIAS.find((c) => c.id === i.sexo)?.curto}` : " · sem categoria"}
                    {i.idade !== null && ` · ${i.idade} anos`}
                    {i.heat_number ? ` · bateria ${i.heat_number}` : ""}
                  </p>
                  <p className="dst-mono mt-1 text-[0.75rem] opacity-45">
                    {i.email} · {formatPhone(i.phone)} · {i.cpf_mascarado}
                  </p>
                  <p className="dst-label mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[color:rgba(242,240,236,0.4)]">
                    <span style={{ color: i.participacao === "competidor" ? "var(--somma)" : undefined }}>
                      {PARTICIPACAO_LABELS[i.participacao]?.titulo ?? i.participacao}
                    </span>
                    <span>inscrito {hora(i.created_at)}</span>
                    {i.checked_in_at && <span>check-in {hora(i.checked_in_at)}</span>}
                    {i.atualizado_em && <span>editado {hora(i.atualizado_em)}</span>}
                    {i.utm_source && (
                      <span>
                        via {i.utm_source}
                        {i.utm_medium && `/${i.utm_medium}`}
                        {i.utm_campaign && ` · ${i.utm_campaign}`}
                      </span>
                    )}
                    {i.referral && <span>ref {i.referral}</span>}
                  </p>
                </div>
              </div>

              <span className="dst-label shrink-0" style={{ color: STATUS_COR[i.status] }}>
                {STATUS_LABEL[i.status]}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-[color:var(--line)] pt-4">
              <button type="button" onClick={() => setFicha({ inscrito: i })} className="dst-btn dst-btn--ghost !min-h-[40px] !px-4 !text-[0.65rem]">
                Ver ficha
              </button>
              <button type="button" onClick={() => setFicha({ inscrito: i, inicio: "editar" })} className="dst-btn dst-btn--ghost !min-h-[40px] !px-4 !text-[0.65rem]">
                Editar
              </button>
              {session.role === "admin" && (
                <button type="button" onClick={() => setFicha({ inscrito: i, inicio: "transferir" })} className="dst-btn dst-btn--ghost !min-h-[40px] !px-4 !text-[0.65rem]">
                  Transferir
                </button>
              )}
              {i.status !== "cancelled" ? (
                <button type="button" onClick={() => mudarStatus(i, "cancelled")} className="dst-btn dst-btn--ghost !min-h-[40px] !px-4 !text-[0.65rem]">
                  Cancelar inscrição
                </button>
              ) : (
                <button type="button" onClick={() => mudarStatus(i, "confirmed")} className="dst-btn !min-h-[40px] !px-4 !text-[0.65rem]">
                  Reativar
                </button>
              )}
              {i.status === "checked_in" && (
                <button type="button" onClick={() => mudarStatus(i, "confirmed")} className="dst-btn dst-btn--ghost !min-h-[40px] !px-4 !text-[0.65rem]">
                  Desfazer check-in
                </button>
              )}
              <a href={`/desafios-das-esteiras-evolve/confirmado/${i.ticket_token}`} target="_blank" rel="noopener noreferrer" className="dst-btn dst-btn--ghost !min-h-[40px] !px-4 !text-[0.65rem]">
                Ver ticket
              </a>

              {/* Bateria — o banco recusa a 5ª pessoa na mesma bateria */}
              {i.participacao === "competidor" && i.sexo && i.status !== "cancelled" && (
                <label className="flex items-center gap-2">
                  <span className="dst-label text-[color:rgba(242,240,236,0.4)]">Bateria</span>
                  <select
                    value={i.heat_number ?? ""}
                    onChange={(e) => definirBateria(i, e.target.value ? Number(e.target.value) : null)}
                    aria-label={`Bateria de ${i.full_name}`}
                    className="dst-field !min-h-[40px] !w-[74px] !border !border-[color:var(--line)] !px-2 !py-0 !text-[0.8rem]"
                  >
                    <option value="">—</option>
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {session.role === "admin" && (
                <button type="button" onClick={() => setFicha({ inscrito: i, inicio: "excluir" })} className="dst-label ml-auto self-center underline underline-offset-4 hover:text-[color:var(--evolve)]">
                  excluir
                </button>
              )}
            </div>
          </li>
        ))}

        {!carregando && lista.length === 0 && (
          <li className="dst-label py-10 text-center text-[color:rgba(242,240,236,0.35)]">
            Nenhum cadastro encontrado com esses filtros.
          </li>
        )}
      </ul>

      {ficha && (
        <FichaCadastro
          key={`${ficha.inscrito.id}-${ficha.inicio ?? "ficha"}`}
          id={ficha.inscrito.id}
          inicial={ficha.inscrito}
          inicio={ficha.inicio}
          session={session}
          onFechar={() => setFicha(null)}
          onMudou={(msg) => {
            setAviso(msg);
            carregar();
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
            carregar();
          }}
        />
      )}
    </main>
  );
}

function Select({
  rotulo,
  value,
  onChange,
  opcoes,
}: {
  rotulo: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  opcoes: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      aria-label={rotulo}
      className="dst-field !min-h-[48px] !border !border-[color:var(--line)] !px-3 !py-0 !text-[0.85rem]"
    >
      {opcoes.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

