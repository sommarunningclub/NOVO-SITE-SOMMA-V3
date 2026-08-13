"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CATEGORIAS,
  PARTICIPACAO_LABELS,
  UNITS,
  getUnit,
  type Participacao,
  type Sexo,
} from "@/lib/desafio-esteiras/event.config";
import { formatPhone } from "@/lib/desafio-esteiras/schema";
import type { OperatorSession } from "@/lib/desafio-esteiras/auth";

interface Inscrito {
  id: string;
  created_at: string;
  full_name: string;
  cpf_mascarado: string;
  birth_date: string;
  email: string;
  phone: string;
  unit_id: string;
  sexo: Sexo | null;
  participacao: Participacao;
  foto_url: string | null;
  ticket_code: string;
  ticket_token: string;
  status: "confirmed" | "checked_in" | "cancelled";
  checked_in_at: string | null;
  origem: string | null;
  utm_source: string | null;
  atualizado_em: string | null;
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

/**
 * Gestão de inscritos.
 *
 * Busca, edição e remoção. Cancelar é reversível e mantém o histórico —
 * é o caminho normal para tirar alguém do evento. Excluir apaga de vez
 * (inscrição, espelho na gestão e foto) e só o admin geral pode.
 */
export function Inscritos({ session }: { session: OperatorSession }) {
  const [lista, setLista] = useState<Inscrito[]>([]);
  const [busca, setBusca] = useState("");
  const [unidade, setUnidade] = useState("");
  const [status, setStatus] = useState("");
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
      if (busca.trim().length >= 3) p.set("q", busca.trim());
      if (unidade) p.set("unidade", unidade);
      if (status) p.set("status", status);
      const res = await fetch(`/api/desafio-esteiras/admin/inscritos?${p}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível carregar.");
        return;
      }
      setLista(data.inscritos ?? []);
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setCarregando(false);
    }
  }, [busca, unidade, status]);

  useEffect(() => {
    const t = setTimeout(carregar, 300);
    return () => clearTimeout(t);
  }, [carregar]);

  async function mudarStatus(i: Inscrito, novo: Inscrito["status"]) {
    setAviso(null);
    const res = await fetch("/api/desafio-esteiras/admin/inscritos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: i.id, status: novo }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErro(data.error ?? "Não foi possível alterar.");
      return;
    }
    setAviso(`${i.full_name}: ${STATUS_LABEL[novo].toLowerCase()}.`);
    carregar();
  }

  async function excluir() {
    if (!excluindo) return;
    setAviso(null);
    const res = await fetch(`/api/desafio-esteiras/admin/inscritos?id=${excluindo.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setErro(data.error ?? "Não foi possível excluir.");
      setExcluindo(null);
      return;
    }
    setAviso(`${data.nome} foi excluído definitivamente.`);
    setExcluindo(null);
    carregar();
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
        <div className="flex gap-2">
          <Link href="/admin/desafio-das-esteiras" className="dst-btn dst-btn--ghost !min-h-[44px] !px-4 !text-[0.7rem]">
            Painel
          </Link>
          <Link href="/admin/desafio-das-esteiras/checkin" className="dst-btn !min-h-[44px] !px-4 !text-[0.7rem]">
            Check-in
          </Link>
        </div>
      </header>

      {/* Filtros */}
      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="dst-field-wrap">
          <input
            id="busca"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder=" "
            autoComplete="off"
            className="dst-field"
          />
          <label htmlFor="busca" className="dst-field-label">
            Nome, e-mail, CPF, telefone ou ticket
          </label>
        </div>

        {session.role === "admin" && (
          <select
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            aria-label="Filtrar por unidade"
            className="dst-field !min-h-[56px] !border !border-[color:var(--line)] !px-4 !py-0"
          >
            <option value="">Todas as unidades</option>
            {UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.curto}
              </option>
            ))}
          </select>
        )}

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrar por status"
          className="dst-field !min-h-[56px] !border !border-[color:var(--line)] !px-4 !py-0"
        >
          <option value="">Todos os status</option>
          <option value="confirmed">Confirmados</option>
          <option value="checked_in">Com check-in</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

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

      <p className="dst-label mt-5 text-[color:rgba(242,240,236,0.4)]">
        {carregando ? "Carregando…" : `${lista.length} cadastro${lista.length === 1 ? "" : "s"}`}
      </p>

      {/* Lista */}
      <ul className="mt-4 space-y-3">
        {lista.map((i) => (
          <li key={i.id} className="dst-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                {i.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={i.foto_url}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
                    style={{ background: "var(--ink-3)" }}
                    aria-hidden
                  >
                    <span className="dst-display text-[1rem] text-[color:rgba(242,240,236,0.5)]">
                      {i.full_name.charAt(0).toUpperCase()}
                    </span>
                  </span>
                )}

                <div className="min-w-0">
                  <p className="dst-display text-[1.1rem]">{i.full_name}</p>
                  <p className="dst-mono mt-1.5 text-[0.78rem] opacity-65">
                    {getUnit(i.unit_id)?.curto ?? i.unit_id} · {i.ticket_code}
                    {i.sexo && ` · ${CATEGORIAS.find((c) => c.id === i.sexo)?.curto}`}
                  </p>
                  <p className="dst-mono mt-1 text-[0.75rem] opacity-45">
                    {i.email} · {formatPhone(i.phone)} · {i.cpf_mascarado}
                  </p>
                  <p className="dst-label mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[color:rgba(242,240,236,0.4)]">
                    <span>{PARTICIPACAO_LABELS[i.participacao]?.titulo ?? i.participacao}</span>
                    <span>inscrito {hora(i.created_at)}</span>
                    {i.checked_in_at && <span>check-in {hora(i.checked_in_at)}</span>}
                    {i.utm_source && <span>via {i.utm_source}</span>}
                  </p>
                </div>
              </div>

              <span className="dst-label shrink-0" style={{ color: STATUS_COR[i.status] }}>
                {STATUS_LABEL[i.status]}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-[color:var(--line)] pt-4">
              <button
                type="button"
                onClick={() => setEditando(i)}
                className="dst-btn dst-btn--ghost !min-h-[40px] !px-4 !text-[0.65rem]"
              >
                Editar
              </button>

              {i.status !== "cancelled" ? (
                <button
                  type="button"
                  onClick={() => mudarStatus(i, "cancelled")}
                  className="dst-btn dst-btn--ghost !min-h-[40px] !px-4 !text-[0.65rem]"
                >
                  Cancelar inscrição
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => mudarStatus(i, "confirmed")}
                  className="dst-btn !min-h-[40px] !px-4 !text-[0.65rem]"
                >
                  Reativar
                </button>
              )}

              {i.status === "checked_in" && (
                <button
                  type="button"
                  onClick={() => mudarStatus(i, "confirmed")}
                  className="dst-btn dst-btn--ghost !min-h-[40px] !px-4 !text-[0.65rem]"
                >
                  Desfazer check-in
                </button>
              )}

              <a
                href={`/desafios-das-esteiras-evolve/confirmado/${i.ticket_token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="dst-btn dst-btn--ghost !min-h-[40px] !px-4 !text-[0.65rem]"
              >
                Ver ticket
              </a>

              {session.role === "admin" && (
                <button
                  type="button"
                  onClick={() => setExcluindo(i)}
                  className="dst-label ml-auto self-center underline underline-offset-4 hover:text-[color:var(--evolve)]"
                >
                  excluir
                </button>
              )}
            </div>
          </li>
        ))}

        {!carregando && lista.length === 0 && (
          <li className="dst-label py-10 text-center text-[color:rgba(242,240,236,0.35)]">
            Nenhum cadastro encontrado.
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

      {excluindo && (
        <ModalExclusao inscrito={excluindo} onCancelar={() => setExcluindo(null)} onConfirmar={excluir} />
      )}
    </main>
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
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível salvar.");
        return;
      }
      onSalvo();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(8,8,10,0.9)] p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edicao-titulo"
    >
      <div className="dst-panel w-full max-w-[520px] p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="edicao-titulo" className="dst-display text-[1.4rem]">
            EDITAR CADASTRO
          </h2>
          <button type="button" onClick={onFechar} className="dst-label underline underline-offset-4">
            fechar
          </button>
        </div>
        <p className="dst-mono mt-2 text-[0.78rem] opacity-50">
          {inscrito.ticket_code} · CPF {inscrito.cpf_mascarado} (não editável)
        </p>

        <form onSubmit={salvar} className="mt-6">
          <div className="dst-field-wrap">
            <input id="ed-nome" name="full_name" defaultValue={inscrito.full_name} placeholder=" " className="dst-field" />
            <label htmlFor="ed-nome" className="dst-field-label">
              Nome completo
            </label>
          </div>

          <div className="dst-field-wrap mt-4">
            <input id="ed-email" name="email" type="email" defaultValue={inscrito.email} placeholder=" " className="dst-field" />
            <label htmlFor="ed-email" className="dst-field-label">
              E-mail
            </label>
          </div>

          <div className="dst-field-wrap mt-4">
            <input id="ed-tel" name="phone" defaultValue={formatPhone(inscrito.phone)} placeholder=" " className="dst-field" />
            <label htmlFor="ed-tel" className="dst-field-label">
              Telefone
            </label>
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
                <label
                  key={u.id}
                  className="dst-panel flex min-h-[48px] cursor-pointer items-center justify-center p-2 text-center has-[:checked]:border-[color:var(--somma)] has-[:checked]:bg-[rgba(255,44,4,0.08)] has-[:disabled]:opacity-40"
                >
                  <input
                    type="radio"
                    name="unit_id"
                    value={u.id}
                    defaultChecked={inscrito.unit_id === u.id}
                    disabled={session.role === "operador" && u.id !== session.unitId}
                    className="sr-only"
                  />
                  <span className="dst-display text-[0.9rem]">{u.curto}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="dst-label mb-2.5 text-[color:rgba(242,240,236,0.45)]">Participação</legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PARTICIPACAO_LABELS) as Participacao[]).map((p) => (
                <label
                  key={p}
                  className="dst-panel flex min-h-[48px] cursor-pointer items-center justify-center p-2 text-center has-[:checked]:border-[color:var(--somma)] has-[:checked]:bg-[rgba(255,44,4,0.08)]"
                >
                  <input
                    type="radio"
                    name="participacao"
                    value={p}
                    defaultChecked={inscrito.participacao === p}
                    className="sr-only"
                  />
                  <span className="dst-display text-[0.9rem]">{PARTICIPACAO_LABELS[p].titulo}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="dst-label mb-2.5 text-[color:rgba(242,240,236,0.45)]">Categoria</legend>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map((c) => (
                <label
                  key={c.id}
                  className="dst-panel flex min-h-[48px] cursor-pointer items-center justify-center p-2 has-[:checked]:border-[color:var(--somma)] has-[:checked]:bg-[rgba(255,44,4,0.08)]"
                >
                  <input
                    type="radio"
                    name="sexo"
                    value={c.id}
                    defaultChecked={inscrito.sexo === c.id}
                    className="sr-only"
                  />
                  <span className="dst-display text-[0.9rem]">{c.curto}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {inscrito.foto_url && (
            <label className="mt-6 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={removerFoto}
                onChange={(e) => setRemoverFoto(e.target.checked)}
                className="h-5 w-5 accent-[color:var(--somma)]"
              />
              <span className="text-[0.9rem] text-[color:rgba(242,240,236,0.7)]">
                Remover a foto de perfil
              </span>
            </label>
          )}

          {erro && (
            <p role="alert" className="dst-label mt-5 text-[color:var(--evolve)]">
              {erro}
            </p>
          )}

          <div className="mt-7 flex gap-3">
            <button type="submit" disabled={salvando} className="dst-btn flex-1 disabled:opacity-60">
              {salvando ? "Salvando…" : "Salvar"}
            </button>
            <button type="button" onClick={onFechar} className="dst-btn dst-btn--ghost">
              Cancelar
            </button>
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
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(8,8,10,0.9)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="excluir-titulo"
    >
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
          <input
            id="conf-ticket"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder=" "
            autoComplete="off"
            className="dst-field"
          />
          <label htmlFor="conf-ticket" className="dst-field-label">
            Digite {inscrito.ticket_code} para confirmar
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={!confere}
            onClick={onConfirmar}
            className="dst-btn flex-1 disabled:opacity-40"
            style={{ background: "var(--evolve)" }}
          >
            Excluir
          </button>
          <button type="button" onClick={onCancelar} className="dst-btn dst-btn--ghost">
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
