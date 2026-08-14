"use client";

import { useEffect, useState } from "react";
import {
  CATEGORIAS,
  PARTICIPACAO_LABELS,
  UNITS,
  getUnit,
  type Participacao,
} from "@/lib/desafio-esteiras/event.config";
import { nomeDigitando } from "@/lib/desafio-esteiras/nome";
import { formatPhone } from "@/lib/desafio-esteiras/schema";
import type { OperatorSession } from "@/lib/desafio-esteiras/auth";
import {
  STATUS_COR,
  STATUS_LABEL,
  horaInscrito,
  type Inscrito,
} from "./inscrito";

type Aba = "ficha" | "editar" | "transferir" | "excluir";

/**
 * Ficha operacional do inscrito: dados, edição, transferência de unidade,
 * reenvio de e-mail e exclusão. Abre no painel (clique na tabela) e na
 * gestão de cadastros.
 */
export function FichaCadastro({
  id,
  inicial,
  inicio = "ficha",
  session,
  onFechar,
  onMudou,
}: {
  id: string;
  inicial?: Inscrito | null;
  inicio?: Aba;
  session: OperatorSession;
  onFechar: () => void;
  onMudou: (aviso: string) => void;
}) {
  const [inscrito, setInscrito] = useState<Inscrito | null>(inicial ?? null);
  const [aba, setAba] = useState<Aba>(inicio);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function recarregar() {
    const res = await fetch(`/api/desafio-esteiras/admin/inscritos?id=${id}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setErro(data.error ?? "Não foi possível carregar o cadastro.");
      return null;
    }
    setInscrito(data.inscrito as Inscrito);
    return data.inscrito as Inscrito;
  }

  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    recarregar().finally(() => {
      if (vivo) setCarregando(false);
    });
    return () => {
      vivo = false;
    };
    // Só na abertura — recarregar() depois das ações.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function patch(body: Record<string, unknown>, aviso: string) {
    setErro(null);
    const res = await fetch("/api/desafio-esteiras/admin/inscritos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErro(data.error ?? "Não foi possível salvar.");
      return false;
    }
    await recarregar();
    onMudou(aviso);
    return true;
  }

  async function excluir() {
    const res = await fetch(`/api/desafio-esteiras/admin/inscritos?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setErro(data.error ?? "Não foi possível excluir.");
      return;
    }
    onMudou(`${data.nome} foi excluído definitivamente.`);
    onFechar();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(8,8,10,0.9)] p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ficha-titulo"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="dst-panel w-full max-w-[560px] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="dst-label text-[color:var(--somma)]">Cadastro</p>
            <h2 id="ficha-titulo" className="dst-display mt-1 text-[clamp(1.3rem,4vw,1.8rem)]">
              {inscrito?.full_name ?? "…"}
            </h2>
          </div>
          <button type="button" onClick={onFechar} className="dst-label underline underline-offset-4">
            fechar
          </button>
        </div>

        {carregando && !inscrito && (
          <p className="dst-label mt-8 text-[color:rgba(242,240,236,0.4)]">Carregando ficha…</p>
        )}
        {erro && (
          <p role="alert" className="dst-label mt-5 text-[color:var(--evolve)]">
            {erro}
          </p>
        )}

        {inscrito && aba === "ficha" && (
          <FichaView
            inscrito={inscrito}
            session={session}
            onEditar={() => setAba("editar")}
            onTransferir={() => setAba("transferir")}
            onExcluir={() => setAba("excluir")}
            onStatus={(s, aviso) => patch({ status: s }, aviso)}
            onReenviar={() =>
              patch({ reenviar_email: true }, `E-mail do ticket reenviado para ${inscrito.email}.`)
            }
          />
        )}
        {inscrito && aba === "editar" && (
          <ModalEdicao
            inscrito={inscrito}
            session={session}
            embutido
            onFechar={() => setAba("ficha")}
            onSalvo={async () => {
              await recarregar();
              setAba("ficha");
              onMudou("Cadastro atualizado.");
            }}
          />
        )}
        {inscrito && aba === "transferir" && (
          <TransferirTicket
            inscrito={inscrito}
            session={session}
            onCancelar={() => setAba("ficha")}
            onOk={async (msg) => {
              await recarregar();
              setAba("ficha");
              onMudou(msg);
            }}
          />
        )}
        {inscrito && aba === "excluir" && (
          <ModalExclusao
            nomes={[inscrito.full_name]}
            onCancelar={() => setAba("ficha")}
            onConfirmar={excluir}
          />
        )}
      </div>
    </div>
  );
}

function FichaView({
  inscrito,
  session,
  onEditar,
  onTransferir,
  onExcluir,
  onStatus,
  onReenviar,
}: {
  inscrito: Inscrito;
  session: OperatorSession;
  onEditar: () => void;
  onTransferir: () => void;
  onExcluir: () => void;
  onStatus: (s: Inscrito["status"], aviso: string) => void;
  onReenviar: () => void;
}) {
  const unidade = getUnit(inscrito.unit_id);
  const cpf = inscrito.cpf || inscrito.cpf_mascarado;
  const nasc = inscrito.birth_date
    ? inscrito.birth_date.split("-").reverse().join("/")
    : "—";

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {inscrito.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={inscrito.foto_url} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span
            className="grid h-14 w-14 place-items-center rounded-full"
            style={{ background: "var(--ink-3)" }}
            aria-hidden
          >
            <span className="dst-display text-[1.2rem] text-[color:rgba(242,240,236,0.5)]">
              {inscrito.full_name.charAt(0).toUpperCase()}
            </span>
          </span>
        )}
        <span className="dst-label" style={{ color: STATUS_COR[inscrito.status] }}>
          {STATUS_LABEL[inscrito.status]}
        </span>
        <span
          className="dst-label"
          style={{ color: inscrito.participacao === "competidor" ? "var(--somma)" : undefined }}
        >
          {PARTICIPACAO_LABELS[inscrito.participacao]?.titulo ?? inscrito.participacao}
        </span>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <Dado k="Ticket" v={inscrito.ticket_code} mono />
        <Dado k="Unidade" v={unidade?.nome ?? inscrito.unit_id} />
        <Dado k="CPF" v={cpf} mono />
        <Dado
          k="Nascimento"
          v={`${nasc}${inscrito.idade !== null ? ` · ${inscrito.idade} anos` : ""}`}
        />
        <Dado k="E-mail" v={inscrito.email} />
        <Dado k="Telefone" v={formatPhone(inscrito.phone)} />
        <Dado k="Categoria" v={CATEGORIAS.find((c) => c.id === inscrito.sexo)?.curto ?? "Sem categoria"} />
        <Dado k="Bateria" v={inscrito.heat_number ? String(inscrito.heat_number) : "—"} />
        <Dado k="Inscrito em" v={horaInscrito(inscrito.created_at)} />
        <Dado k="Check-in" v={horaInscrito(inscrito.checked_in_at)} />
        <Dado k="Origem" v={inscrito.origem ?? "(direto)"} />
        {(inscrito.utm_source || inscrito.referral) && (
          <Dado
            k="Campanha"
            v={[inscrito.utm_source, inscrito.utm_medium, inscrito.utm_campaign, inscrito.referral]
              .filter(Boolean)
              .join(" · ")}
          />
        )}
      </dl>

      <div className="mt-7 flex flex-wrap gap-2 border-t border-[color:var(--line)] pt-5">
        <button type="button" onClick={onEditar} className="dst-btn !min-h-[44px] !px-4 !text-[0.7rem]">
          Editar
        </button>
        {session.role === "admin" && (
          <button
            type="button"
            onClick={onTransferir}
            disabled={inscrito.status === "checked_in"}
            className="dst-btn dst-btn--ghost !min-h-[44px] !px-4 !text-[0.7rem] disabled:opacity-40"
          >
            Transferir ticket
          </button>
        )}
        <button
          type="button"
          onClick={onReenviar}
          className="dst-btn dst-btn--ghost !min-h-[44px] !px-4 !text-[0.7rem]"
        >
          Reenviar e-mail
        </button>
        <a
          href={`/desafios-das-esteiras-evolve/confirmado/${inscrito.ticket_token}`}
          target="_blank"
          rel="noopener noreferrer"
          className="dst-btn dst-btn--ghost !min-h-[44px] !px-4 !text-[0.7rem]"
        >
          Ver ticket
        </a>
        {inscrito.status !== "cancelled" ? (
          <button
            type="button"
            onClick={() => onStatus("cancelled", `${inscrito.full_name}: inscrição cancelada.`)}
            className="dst-btn dst-btn--ghost !min-h-[44px] !px-4 !text-[0.7rem]"
          >
            Cancelar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onStatus("confirmed", `${inscrito.full_name}: inscrição reativada.`)}
            className="dst-btn !min-h-[44px] !px-4 !text-[0.7rem]"
          >
            Reativar
          </button>
        )}
        {inscrito.status === "checked_in" && (
          <button
            type="button"
            onClick={() => onStatus("confirmed", `${inscrito.full_name}: check-in desfeito.`)}
            className="dst-btn dst-btn--ghost !min-h-[44px] !px-4 !text-[0.7rem]"
          >
            Desfazer check-in
          </button>
        )}
        {session.role === "admin" && (
          <button
            type="button"
            onClick={onExcluir}
            className="dst-label ml-auto self-center underline underline-offset-4 hover:text-[color:var(--evolve)]"
          >
            excluir
          </button>
        )}
      </div>
      {inscrito.status === "checked_in" && session.role === "admin" && (
        <p className="dst-label mt-3 text-[color:rgba(242,240,236,0.4)]">
          Para transferir de unidade, desfaça o check-in primeiro.
        </p>
      )}
    </>
  );
}

function Dado({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <dt className="dst-label text-[color:rgba(242,240,236,0.4)]">{k}</dt>
      <dd className={`mt-1 break-all text-[0.92rem] ${mono ? "dst-mono text-[0.82rem]" : ""}`}>{v}</dd>
    </div>
  );
}

function TransferirTicket({
  inscrito,
  session,
  onCancelar,
  onOk,
}: {
  inscrito: Inscrito;
  session: OperatorSession;
  onCancelar: () => void;
  onOk: (msg: string) => void;
}) {
  const [destino, setDestino] = useState("");
  const [reenviar, setReenviar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const origem = getUnit(inscrito.unit_id);

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (!destino || salvando) return;
    setErro(null);
    setSalvando(true);
    try {
      const res = await fetch("/api/desafio-esteiras/admin/inscritos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: inscrito.id,
          transferir_para: destino,
          reenviar_email: reenviar,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setErro(data.error ?? "Não foi possível transferir.");
      const nomeDest = getUnit(destino)?.curto ?? destino;
      onOk(
        `Ticket transferido para ${nomeDest}. Novo código: ${data.ticket_code}.${
          reenviar ? " E-mail reenviado." : ""
        }`,
      );
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={confirmar} className="mt-6">
      <p className="text-[0.92rem] leading-relaxed text-[color:rgba(242,240,236,0.7)]">
        O ticket sai da <strong>{origem?.nome}</strong> e ganha um código novo da unidade de destino.
        A bateria é zerada. O link do QR continua o mesmo.
      </p>
      {session.role === "operador" && (
        <p className="dst-label mt-3 text-[color:rgba(242,240,236,0.4)]">
          Só o admin geral transfere entre unidades.
        </p>
      )}
      <fieldset className="mt-5">
        <legend className="dst-label mb-2.5 text-[color:rgba(242,240,236,0.45)]">Nova unidade</legend>
        <div className="grid grid-cols-2 gap-2">
          {UNITS.filter((u) => u.id !== inscrito.unit_id).map((u) => (
            <label
              key={u.id}
              className="dst-panel flex min-h-[48px] cursor-pointer items-center justify-center p-2 text-center has-[:checked]:border-[color:var(--somma)] has-[:checked]:bg-[rgba(255,44,4,0.08)]"
            >
              <input
                type="radio"
                name="destino"
                value={u.id}
                checked={destino === u.id}
                onChange={() => setDestino(u.id)}
                className="sr-only"
              />
              <span className="dst-display text-[0.9rem]">{u.curto}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-5 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={reenviar}
          onChange={(e) => setReenviar(e.target.checked)}
          className="h-5 w-5 accent-[color:var(--somma)]"
        />
        <span className="text-[0.9rem] text-[color:rgba(242,240,236,0.7)]">
          Reenviar o e-mail do ticket para {inscrito.email}
        </span>
      </label>
      {erro && (
        <p role="alert" className="dst-label mt-5 text-[color:var(--evolve)]">
          {erro}
        </p>
      )}
      <div className="mt-7 flex gap-3">
        <button type="submit" disabled={!destino || salvando} className="dst-btn flex-1 disabled:opacity-40">
          {salvando ? "Transferindo…" : "Transferir"}
        </button>
        <button type="button" onClick={onCancelar} className="dst-btn dst-btn--ghost">
          Voltar
        </button>
      </div>
    </form>
  );
}

export function ModalEdicao({
  inscrito,
  session,
  onFechar,
  onSalvo,
  embutido = false,
}: {
  inscrito: Inscrito;
  session: OperatorSession;
  onFechar: () => void;
  onSalvo: () => void;
  embutido?: boolean;
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

  const form = (
    <>
      {!embutido && (
        <div className="flex items-start justify-between gap-4">
          <h2 id="edicao-titulo" className="dst-display text-[1.4rem]">
            EDITAR CADASTRO
          </h2>
          <button type="button" onClick={onFechar} className="dst-label underline underline-offset-4">
            fechar
          </button>
        </div>
      )}
      <p className="dst-mono mt-2 text-[0.78rem] opacity-50">
        {inscrito.ticket_code} · CPF {inscrito.cpf ?? inscrito.cpf_mascarado} · nasc. {inscrito.birth_date}
        {inscrito.idade !== null && ` (${inscrito.idade} anos)`} — não editáveis
      </p>

      <form onSubmit={salvar} className="mt-6">
        <div className="dst-field-wrap">
          <input
            id="ed-nome"
            name="full_name"
            defaultValue={inscrito.full_name}
            placeholder=" "
            className="dst-field"
            autoCapitalize="characters"
            spellCheck={false}
            onInput={(e) => {
              e.currentTarget.value = nomeDigitando(e.currentTarget.value);
            }}
          />
          <label htmlFor="ed-nome" className="dst-field-label">
            Nome e sobrenome
          </label>
        </div>
        <div className="dst-field-wrap mt-4">
          <input
            id="ed-email"
            name="email"
            type="email"
            defaultValue={inscrito.email}
            placeholder=" "
            className="dst-field"
          />
          <label htmlFor="ed-email" className="dst-field-label">
            E-mail
          </label>
        </div>
        <div className="dst-field-wrap mt-4">
          <input
            id="ed-tel"
            name="phone"
            defaultValue={formatPhone(inscrito.phone)}
            placeholder=" "
            className="dst-field"
            inputMode="tel"
            maxLength={16}
            onInput={(e) => {
              e.currentTarget.value = formatPhone(e.currentTarget.value);
            }}
          />
          <label htmlFor="ed-tel" className="dst-field-label">
            Telefone
          </label>
        </div>

        <fieldset className="mt-6">
          <legend className="dst-label mb-2.5 text-[color:rgba(242,240,236,0.45)]">Unidade</legend>
          {session.role === "operador" && (
            <p className="dst-label mb-2.5 text-[color:rgba(242,240,236,0.4)]">
              Só o admin geral pode mover para outra unidade. Use Transferir ticket.
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
            <span className="text-[0.9rem] text-[color:rgba(242,240,236,0.7)]">Remover a foto de perfil</span>
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
    </>
  );

  if (embutido) return <div className="mt-4">{form}</div>;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(8,8,10,0.9)] p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edicao-titulo"
    >
      <div className="dst-panel w-full max-w-[520px] p-6">{form}</div>
    </div>
  );
}

export function ModalExclusao({
  nomes,
  onCancelar,
  onConfirmar,
  ocupado = false,
}: {
  nomes: string[];
  onCancelar: () => void;
  onConfirmar: () => void;
  ocupado?: boolean;
}) {
  const varios = nomes.length > 1;
  const quem = varios
    ? `${nomes.length} cadastros`
    : nomes[0] ?? "este cadastro";

  return (
    <div className="mt-6">
      <h3 className="dst-display text-[1.3rem]" style={{ color: "var(--evolve)" }}>
        EXCLUIR?
      </h3>
      <p className="mt-4 text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.75)]">
        {varios ? (
          <>
            Apagar <strong>{nomes.length} inscrições</strong> de vez? Não dá para desfazer.
          </>
        ) : (
          <>
            Apagar a inscrição de <strong>{quem}</strong>? Não dá para desfazer.
          </>
        )}
      </p>
      {varios && (
        <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-[0.88rem] text-[color:rgba(242,240,236,0.55)]">
          {nomes.slice(0, 12).map((n, i) => (
            <li key={`${n}-${i}`}>{n}</li>
          ))}
          {nomes.length > 12 && <li>+ {nomes.length - 12} outros</li>}
        </ul>
      )}
      <p className="mt-3 text-[0.88rem] leading-relaxed text-[color:rgba(242,240,236,0.5)]">
        Se a intenção é só tirar do evento, use <strong>Cancelar</strong> — o histórico continua.
      </p>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onConfirmar}
          disabled={ocupado}
          className="dst-btn flex-1 disabled:opacity-40"
          style={{ background: "var(--evolve)" }}
        >
          {ocupado ? "Excluindo…" : "Sim, excluir"}
        </button>
        <button type="button" onClick={onCancelar} disabled={ocupado} className="dst-btn dst-btn--ghost flex-1 disabled:opacity-40">
          Não
        </button>
      </div>
    </div>
  );
}
