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
  type Sexo,
  type VagasStatus,
} from "@/lib/desafio-esteiras/event.config";
import { formatPhone } from "@/lib/desafio-esteiras/schema";
import type { OperatorSession } from "@/lib/desafio-esteiras/auth";

interface Inscrito {
  id: string;
  created_at: string;
  full_name: string;
  cpf_mascarado: string;
  birth_date: string;
  idade: number | null;
  faixa_etaria: string | null;
  email: string;
  phone: string;
  unit_id: string;
  sexo: Sexo | null;
  participacao: Participacao;
  foto_url: string | null;
  tem_foto: boolean;
  ticket_code: string;
  ticket_token: string;
  status: "confirmed" | "checked_in" | "cancelled";
  checked_in_at: string | null;
  origem: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referral: string | null;
  atualizado_em: string | null;
}

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
    vagasCompetidores: number | null;
    vagasRestantes: number | null;
    vagasStatus: VagasStatus;
  }[];
  porOrigem: { fonte: string; n: number }[];
}

const STATUS_LABEL: Record<Inscrito["status"], string> = {
  confirmed: "CONFIRMADO",
  checked_in: "CHECK-IN",
  cancelled: "CANCELADO",
};
const STATUS_COR: Record<Inscrito["status"], string> = {
  confirmed: "rgba(242,240,236,0.6)",
  checked_in: "var(--somma)",
  cancelled: "var(--evolve)",
};
const VAGAS_LABEL: Record<VagasStatus, string> = {
  aberta: "vagas abertas",
  ultimas: "últimas vagas",
  esgotada: "esgotada",
  indefinida: "limite a definir",
};

const hora = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

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
  const [editando, setEditando] = useState<Inscrito | null>(null);
  const [excluindo, setExcluindo] = useState<Inscrito | null>(null);
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

  async function excluir() {
    if (!excluindo) return;
    const res = await fetch(`/api/desafio-esteiras/admin/inscritos?id=${excluindo.id}`, { method: "DELETE" });
    const data = await res.json();
    setExcluindo(null);
    if (!res.ok) return setErro(data.error ?? "Não foi possível excluir.");
    setAviso(`${data.nome} foi excluído definitivamente.`);
    carregar();
  }

  /** Exporta o que está na tela — o CSV respeita os filtros aplicados. */
  function exportarCsv() {
    const cab = [
      "nome", "cpf", "idade", "nascimento", "email", "telefone", "unidade", "categoria",
      "participacao", "status", "ticket", "foto", "inscrito_em", "checkin_em",
      "utm_source", "utm_medium", "utm_campaign", "referral",
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
        i.utm_source ?? "", i.utm_medium ?? "", i.utm_campaign ?? "", i.referral ?? "",
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

                <div className="mt-3 border-t border-[color:var(--line)] pt-3">
                  <p
                    className="dst-label"
                    style={{
                      color:
                        u.vagasStatus === "esgotada"
                          ? "var(--evolve)"
                          : u.vagasStatus === "ultimas"
                            ? "var(--somma)"
                            : "rgba(242,240,236,0.4)",
                    }}
                  >
                    {u.vagasCompetidores === null
                      ? "Vagas de competidor: limite a definir"
                      : `${u.vagasRestantes} de ${u.vagasCompetidores} vagas · ${VAGAS_LABEL[u.vagasStatus]}`}
                  </p>
                  {u.vagasCompetidores !== null && (
                    <div className="mt-2 h-[3px] w-full bg-[color:var(--line)]" aria-hidden>
                      <div
                        className="h-full origin-left"
                        style={{
                          background: "var(--energia)",
                          transform: `scaleX(${Math.min(1, u.competidores / u.vagasCompetidores)})`,
                        }}
                      />
                    </div>
                  )}
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
                  <p className="dst-display text-[1.1rem]">{i.full_name}</p>
                  <p className="dst-mono mt-1.5 text-[0.78rem] opacity-65">
                    {getUnit(i.unit_id)?.curto ?? i.unit_id} · {i.ticket_code}
                    {i.sexo ? ` · ${CATEGORIAS.find((c) => c.id === i.sexo)?.curto}` : " · sem categoria"}
                    {i.idade !== null && ` · ${i.idade} anos`}
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
              <button type="button" onClick={() => setEditando(i)} className="dst-btn dst-btn--ghost !min-h-[40px] !px-4 !text-[0.65rem]">
                Editar
              </button>
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
              {session.role === "admin" && (
                <button type="button" onClick={() => setExcluindo(i)} className="dst-label ml-auto self-center underline underline-offset-4 hover:text-[color:var(--evolve)]">
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

      {editando && (
        <ModalEdicao
          inscrito={editando}
          session={session}
          onFechar={() => setEditando(null)}
          onSalvo={() => {
            setEditando(null);
            setAviso("Cadastro atualizado.");
            carregar();
          }}
        />
      )}
      {excluindo && <ModalExclusao inscrito={excluindo} onCancelar={() => setExcluindo(null)} onConfirmar={excluir} />}
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

/* ── Edição ──────────────────────────────────────────────────────────────── */

function ModalEdicao({
  inscrito,
  session,
  onFechar,
  onSalvo,
}: {
  inscrito: Inscrito;
  session: OperatorSession;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [removerFoto, setRemoverFoto] = useState(false);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (salvando) return;
    setErro(null);
    setSalvando(true);
    const f = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/desafio-esteiras/admin/inscritos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: inscrito.id,
          dados: {
            full_name: String(f.get("full_name") ?? ""),
            email: String(f.get("email") ?? ""),
            phone: String(f.get("phone") ?? ""),
            unit_id: String(f.get("unit_id") ?? ""),
            sexo: String(f.get("sexo") ?? ""),
            participacao: String(f.get("participacao") ?? ""),
            remover_foto: removerFoto,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) return setErro(data.error ?? "Não foi possível salvar.");
      onSalvo();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(8,8,10,0.9)] p-4 py-10" role="dialog" aria-modal="true" aria-labelledby="edicao-titulo">
      <div className="dst-panel w-full max-w-[520px] p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="edicao-titulo" className="dst-display text-[1.4rem]">EDITAR CADASTRO</h2>
          <button type="button" onClick={onFechar} className="dst-label underline underline-offset-4">fechar</button>
        </div>
        <p className="dst-mono mt-2 text-[0.78rem] opacity-50">
          {inscrito.ticket_code} · CPF {inscrito.cpf_mascarado} · nasc. {inscrito.birth_date}
          {inscrito.idade !== null && ` (${inscrito.idade} anos)`} — não editáveis
        </p>

        <form onSubmit={salvar} className="mt-6">
          <div className="dst-field-wrap">
            <input id="ed-nome" name="full_name" defaultValue={inscrito.full_name} placeholder=" " className="dst-field" />
            <label htmlFor="ed-nome" className="dst-field-label">Nome completo</label>
          </div>
          <div className="dst-field-wrap mt-4">
            <input id="ed-email" name="email" type="email" defaultValue={inscrito.email} placeholder=" " className="dst-field" />
            <label htmlFor="ed-email" className="dst-field-label">E-mail</label>
          </div>
          <div className="dst-field-wrap mt-4">
            <input id="ed-tel" name="phone" defaultValue={formatPhone(inscrito.phone)} placeholder=" " className="dst-field" />
            <label htmlFor="ed-tel" className="dst-field-label">Telefone</label>
          </div>

          <fieldset className="mt-6">
            <legend className="dst-label mb-2.5 text-[color:rgba(242,240,236,0.45)]">Unidade</legend>
            {session.role === "operador" && (
              <p className="dst-label mb-2.5 text-[color:rgba(242,240,236,0.4)]">
                Só o admin geral pode mover para outra unidade.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {UNITS.map((u) => (
                <label key={u.id} className="dst-panel flex min-h-[48px] cursor-pointer items-center justify-center p-2 text-center has-[:checked]:border-[color:var(--somma)] has-[:checked]:bg-[rgba(255,44,4,0.08)] has-[:disabled]:opacity-40">
                  <input type="radio" name="unit_id" value={u.id} defaultChecked={inscrito.unit_id === u.id} disabled={session.role === "operador" && u.id !== session.unitId} className="sr-only" />
                  <span className="dst-display text-[0.9rem]">{u.curto}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="dst-label mb-2.5 text-[color:rgba(242,240,236,0.45)]">Participação</legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PARTICIPACAO_LABELS) as Participacao[]).map((p) => (
                <label key={p} className="dst-panel flex min-h-[48px] cursor-pointer items-center justify-center p-2 text-center has-[:checked]:border-[color:var(--somma)] has-[:checked]:bg-[rgba(255,44,4,0.08)]">
                  <input type="radio" name="participacao" value={p} defaultChecked={inscrito.participacao === p} className="sr-only" />
                  <span className="dst-display text-[0.9rem]">{PARTICIPACAO_LABELS[p].titulo}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="dst-label mb-2.5 text-[color:rgba(242,240,236,0.45)]">Categoria</legend>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map((c) => (
                <label key={c.id} className="dst-panel flex min-h-[48px] cursor-pointer items-center justify-center p-2 has-[:checked]:border-[color:var(--somma)] has-[:checked]:bg-[rgba(255,44,4,0.08)]">
                  <input type="radio" name="sexo" value={c.id} defaultChecked={inscrito.sexo === c.id} className="sr-only" />
                  <span className="dst-display text-[0.9rem]">{c.curto}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {inscrito.foto_url && (
            <label className="mt-6 flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={removerFoto} onChange={(e) => setRemoverFoto(e.target.checked)} className="h-5 w-5 accent-[color:var(--somma)]" />
              <span className="text-[0.9rem] text-[color:rgba(242,240,236,0.7)]">Remover a foto de perfil</span>
            </label>
          )}

          {erro && <p role="alert" className="dst-label mt-5 text-[color:var(--evolve)]">{erro}</p>}

          <div className="mt-7 flex gap-3">
            <button type="submit" disabled={salvando} className="dst-btn flex-1 disabled:opacity-60">
              {salvando ? "Salvando…" : "Salvar"}
            </button>
            <button type="button" onClick={onFechar} className="dst-btn dst-btn--ghost">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Exclusão ────────────────────────────────────────────────────────────── */

/** Exclusão pede o código do ticket digitado: é irreversível e não pode sair por clique errado. */
function ModalExclusao({
  inscrito,
  onCancelar,
  onConfirmar,
}: {
  inscrito: Inscrito;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  const [texto, setTexto] = useState("");
  const confere = texto.trim().toUpperCase() === inscrito.ticket_code.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(8,8,10,0.9)] p-4" role="dialog" aria-modal="true" aria-labelledby="excluir-titulo">
      <div className="dst-panel w-full max-w-[440px] p-6" style={{ borderColor: "var(--evolve)" }}>
        <h2 id="excluir-titulo" className="dst-display text-[1.4rem]" style={{ color: "var(--evolve)" }}>
          EXCLUIR DEFINITIVAMENTE
        </h2>
        <p className="mt-4 text-[0.92rem] leading-relaxed text-[color:rgba(242,240,236,0.7)]">
          Isso apaga a inscrição de <strong>{inscrito.full_name}</strong>, o registro dela no painel
          de eventos da gestão e a foto de perfil. Não dá para desfazer.
        </p>
        <p className="mt-3 text-[0.88rem] leading-relaxed text-[color:rgba(242,240,236,0.55)]">
          Se a intenção é só tirar a pessoa do evento, use <strong>Cancelar inscrição</strong> — ela
          sai das contagens e da grade, mas o histórico continua.
        </p>

        <div className="dst-field-wrap mt-6">
          <input id="conf-ticket" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder=" " autoComplete="off" className="dst-field" />
          <label htmlFor="conf-ticket" className="dst-field-label">
            Digite {inscrito.ticket_code} para confirmar
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" disabled={!confere} onClick={onConfirmar} className="dst-btn flex-1 disabled:opacity-40" style={{ background: "var(--evolve)" }}>
            Excluir
          </button>
          <button type="button" onClick={onCancelar} className="dst-btn dst-btn--ghost">Voltar</button>
        </div>
      </div>
    </div>
  );
}
