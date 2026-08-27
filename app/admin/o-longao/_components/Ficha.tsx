"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ── Tipos ──────────────────────────────────────────────────────────────── */

type CrewStatus = "pendente" | "aprovada" | "reprovada";
type TeamStatus = "inscrita" | "classificada" | "finalista" | "eliminada";
type PagamentoStatus = "isento" | "pendente" | "pago";

interface Atleta {
  id: string;
  nome: string;
  cpf: string;
  nascimento: string;
  telefone: string;
  email: string;
  instagram: string | null;
  camiseta: string;
  emergencia_nome: string;
  emergencia_telefone: string;
  tipo: "titular" | "reserva";
  ordem: number;
}

interface Equipe {
  id: string;
  categoria: "masculino" | "feminino";
  status: TeamStatus;
  seletiva_km: number | null;
  seletiva_posicao: number | null;
  seletiva_bateria: number | null;
  final_km: number | null;
  final_posicao: number | null;
  atletas: Atleta[];
}

interface CrewDetalhe {
  id: string;
  codigo: string;
  nome: string;
  instagram: string;
  cidade: string;
  logo_url: string | null;
  status: CrewStatus;
  pagamento_status: PagamentoStatus;
  pagamento_marcado_em: string | null;
  notas_internas: string | null;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_telefone: string;
  responsavel_whatsapp: string;
  responsavel_email: string;
  capitao_nome: string;
  capitao_telefone: string;
  capitao_email: string;
  created_at: string;
  teams: Equipe[];
  consents: { tipo: string; aceito_em: string }[];
}

type Aba = "ficha" | "gestao" | "perigo";

const COR_STATUS: Record<CrewStatus, string> = {
  pendente: "var(--sinal)",
  aprovada: "#22c55e",
  reprovada: "var(--somma)",
};

const formatador = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function dataHora(iso: string | null): string {
  if (!iso) return "...";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "...";
  return formatador.format(d);
}

function dataSimples(iso: string | null): string {
  if (!iso) return "...";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return "...";
  return `${dia}/${mes}/${ano}`;
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-[color:var(--line)] py-2">
      <span className="lgo-label text-[color:rgba(242,240,236,0.5)]">{rotulo}</span>
      <span className="text-[0.9rem]">{valor || "..."}</span>
    </div>
  );
}

/* ── Ficha ──────────────────────────────────────────────────────────────── */

export function Ficha({
  id,
  onClose,
  onChange,
}: {
  id: string;
  onClose: () => void;
  onChange: () => void;
}) {
  const [crew, setCrew] = useState<CrewDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [aba, setAba] = useState<Aba>("ficha");
  const [notas, setNotas] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const fecharRef = useRef<HTMLButtonElement | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/o-longao/admin/inscricoes?id=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { crew?: CrewDetalhe; error?: string };
      if (!res.ok || !data.crew) {
        setErro(data.error ?? "Falha ao carregar a ficha.");
        return;
      }
      setCrew(data.crew);
      setNotas(data.crew.notas_internas ?? "");
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    fecharRef.current?.focus();
  }, [carregando]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  /** Todo PATCH da ficha passa por aqui: um lugar só para erro e recarga. */
  const patch = useCallback(
    async (body: Record<string, unknown>): Promise<boolean> => {
      setSalvando(true);
      setErro(null);
      try {
        const res = await fetch("/api/o-longao/admin/inscricoes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...body }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setErro(data.error ?? "Falha ao salvar.");
          return false;
        }
        await carregar();
        onChange();
        return true;
      } catch {
        setErro("Falha de conexão.");
        return false;
      } finally {
        setSalvando(false);
      }
    },
    [id, carregar, onChange]
  );

  async function excluir() {
    if (!crew || confirmacao.trim().toUpperCase() !== crew.codigo.toUpperCase()) return;
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/o-longao/admin/inscricoes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErro(data.error ?? "Falha ao excluir.");
        return;
      }
      onChange();
      onClose();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(5,5,8,0.85)] p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ficha da crew"
        className="lgo-panel my-6 w-full max-w-[860px] p-5 md:p-7"
      >
        <div className="relative z-10">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="lgo-mono text-[0.75rem] text-[color:var(--sinal)]">
                {crew?.codigo ?? "..."}
              </p>
              <h2 className="lgo-display text-[clamp(1.2rem,4vw,1.8rem)]">
                {crew?.nome ?? "Carregando..."}
              </h2>
              {crew && (
                <p className="lgo-mono mt-1 text-[0.75rem] text-[color:rgba(242,240,236,0.55)]">
                  @{crew.instagram} · {crew.cidade} · inscrita em {dataHora(crew.created_at)}
                </p>
              )}
            </div>
            <button
              ref={fecharRef}
              type="button"
              onClick={onClose}
              className="lgo-mono min-h-[44px] min-w-[44px] text-[0.8rem] text-[color:rgba(242,240,236,0.6)] hover:text-[color:var(--papel)]"
            >
              FECHAR
            </button>
          </header>

          <nav className="mt-5 flex flex-wrap gap-2">
            {(
              [
                ["ficha", "FICHA"],
                ["gestao", "GESTÃO"],
                ["perigo", "PERIGO"],
              ] as [Aba, string][]
            ).map(([chave, rotulo]) => (
              <button
                key={chave}
                type="button"
                onClick={() => setAba(chave)}
                className="lgo-mono min-h-[44px] border px-4 text-[0.78rem]"
                style={{
                  borderColor: aba === chave ? "var(--sinal)" : "var(--line)",
                  color: aba === chave ? "var(--sinal)" : "rgba(242,240,236,0.6)",
                }}
              >
                {rotulo}
              </button>
            ))}
          </nav>

          {erro && (
            <p role="alert" className="lgo-mono mt-4 text-[0.82rem] text-[color:var(--somma)]">
              {erro}
            </p>
          )}

          {carregando || !crew ? (
            <p className="lgo-mono mt-6 text-[0.85rem] text-[color:rgba(242,240,236,0.5)]">
              Carregando...
            </p>
          ) : aba === "ficha" ? (
            <AbaFicha crew={crew} />
          ) : aba === "gestao" ? (
            <AbaGestao
              crew={crew}
              notas={notas}
              setNotas={setNotas}
              salvando={salvando}
              patch={patch}
            />
          ) : (
            <section className="mt-6">
              <p className="lgo-label text-[color:var(--somma)]">Zona de perigo</p>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-[color:rgba(242,240,236,0.7)]">
                Excluir apaga a crew, as equipes, os atletas e os consentimentos. Não tem volta.
                Digite o código <strong className="lgo-mono">{crew.codigo}</strong> para liberar.
              </p>
              <div className="lgo-field-wrap mt-4 max-w-[280px]">
                <input
                  id="confirmar-codigo"
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                  placeholder=" "
                  className="lgo-field"
                  autoComplete="off"
                />
                <label htmlFor="confirmar-codigo" className="lgo-field-label">
                  Código da crew
                </label>
              </div>
              <button
                type="button"
                onClick={excluir}
                disabled={
                  salvando || confirmacao.trim().toUpperCase() !== crew.codigo.toUpperCase()
                }
                className="lgo-btn mt-5 min-h-[44px] disabled:opacity-40"
              >
                EXCLUIR A CREW
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Aba FICHA ──────────────────────────────────────────────────────────── */

function AbaFicha({ crew }: { crew: CrewDetalhe }) {
  return (
    <section className="mt-6 space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="lgo-label mb-2 text-[color:var(--sinal)]">Responsável</p>
          <Linha rotulo="Nome" valor={crew.responsavel_nome} />
          <Linha rotulo="CPF" valor={crew.responsavel_cpf} />
          <Linha rotulo="Telefone" valor={crew.responsavel_telefone} />
          <Linha rotulo="WhatsApp" valor={crew.responsavel_whatsapp} />
          <Linha rotulo="E-mail" valor={crew.responsavel_email} />
        </div>
        <div>
          <p className="lgo-label mb-2 text-[color:var(--sinal)]">Capitão</p>
          <Linha rotulo="Nome" valor={crew.capitao_nome} />
          <Linha rotulo="Telefone" valor={crew.capitao_telefone} />
          <Linha rotulo="E-mail" valor={crew.capitao_email} />
          <Linha rotulo="Status" valor={crew.status} />
          <Linha rotulo="Pagamento" valor={crew.pagamento_status} />
        </div>
      </div>

      {crew.teams.map((eq) => (
        <div key={eq.id}>
          <p className="lgo-label mb-3 text-[color:var(--sinal)]">
            Equipe {eq.categoria} · {eq.status} · {eq.atletas.length} atletas
          </p>
          <div className="space-y-3">
            {eq.atletas.length === 0 && (
              <p className="lgo-mono text-[0.8rem] text-[color:rgba(242,240,236,0.5)]">
                Nenhum atleta cadastrado.
              </p>
            )}
            {eq.atletas.map((a) => (
              <div key={a.id} className="border border-[color:var(--line)] p-3">
                <p className="lgo-mono text-[0.72rem] text-[color:rgba(242,240,236,0.5)]">
                  {String(a.ordem).padStart(2, "0")} · {a.tipo} · camiseta {a.camiseta}
                </p>
                <p className="mt-1 text-[0.95rem] font-semibold">{a.nome}</p>
                <div className="mt-2 grid gap-x-6 text-[0.82rem] text-[color:rgba(242,240,236,0.75)] md:grid-cols-2">
                  <span>CPF {a.cpf}</span>
                  <span>Nascimento {dataSimples(a.nascimento)}</span>
                  <span>Telefone {a.telefone}</span>
                  <span>{a.email}</span>
                  <span>{a.instagram ? `@${a.instagram}` : "sem instagram"}</span>
                  <span>
                    Emergência: {a.emergencia_nome} · {a.emergencia_telefone}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div>
        <p className="lgo-label mb-2 text-[color:var(--sinal)]">Consentimentos</p>
        {crew.consents.length === 0 ? (
          <p className="lgo-mono text-[0.8rem] text-[color:rgba(242,240,236,0.5)]">
            Nenhum aceite registrado.
          </p>
        ) : (
          crew.consents.map((c) => (
            <Linha key={c.tipo} rotulo={c.tipo} valor={dataHora(c.aceito_em)} />
          ))
        )}
      </div>
    </section>
  );
}

/* ── Aba GESTÃO ─────────────────────────────────────────────────────────── */

function AbaGestao({
  crew,
  notas,
  setNotas,
  salvando,
  patch,
}: {
  crew: CrewDetalhe;
  notas: string;
  setNotas: (v: string) => void;
  salvando: boolean;
  patch: (body: Record<string, unknown>) => Promise<boolean>;
}) {
  return (
    <section className="mt-6 space-y-8">
      <div>
        <p className="lgo-label mb-3 text-[color:var(--sinal)]">
          Status atual:{" "}
          <span style={{ color: COR_STATUS[crew.status] }}>{crew.status}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["aprovada", "APROVAR"],
              ["reprovada", "REPROVAR"],
              ["pendente", "PENDENTE"],
            ] as [CrewStatus, string][]
          ).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              disabled={salvando || crew.status === valor}
              onClick={() => void patch({ acao: "status", status: valor })}
              className="lgo-btn lgo-btn--ghost min-h-[44px] disabled:opacity-40"
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="lgo-field-wrap max-w-[280px]">
        <select
          id="pagamento"
          value={crew.pagamento_status}
          disabled={salvando}
          onChange={(e) => void patch({ acao: "pagamento", pagamento_status: e.target.value })}
          className="lgo-field"
          required
        >
          <option value="isento">Isento</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
        </select>
        <label htmlFor="pagamento" className="lgo-field-label">
          Pagamento
        </label>
      </div>

      <div>
        <p className="lgo-label mb-2 text-[color:var(--sinal)]">Notas internas</p>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={4}
          className="w-full border border-[color:var(--line)] bg-transparent p-3 text-[0.9rem] text-[color:var(--papel)]"
        />
        <button
          type="button"
          disabled={salvando}
          onClick={() => void patch({ acao: "notas", notas_internas: notas })}
          className="lgo-btn mt-3 min-h-[44px] disabled:opacity-50"
        >
          SALVAR NOTAS
        </button>
      </div>

      {crew.teams.map((eq) => (
        <EquipeGestao key={eq.id} equipe={eq} salvando={salvando} patch={patch} />
      ))}
    </section>
  );
}

function EquipeGestao({
  equipe,
  salvando,
  patch,
}: {
  equipe: Equipe;
  salvando: boolean;
  patch: (body: Record<string, unknown>) => Promise<boolean>;
}) {
  const [status, setStatus] = useState<TeamStatus>(equipe.status);
  const [posicao, setPosicao] = useState(
    equipe.seletiva_posicao === null ? "" : String(equipe.seletiva_posicao)
  );
  const [km, setKm] = useState(equipe.seletiva_km === null ? "" : String(equipe.seletiva_km));
  const [bateria, setBateria] = useState(
    equipe.seletiva_bateria === null ? "" : String(equipe.seletiva_bateria)
  );

  return (
    <div className="border border-[color:var(--line)] p-4">
      <p className="lgo-label mb-3 text-[color:var(--sinal)]">Equipe {equipe.categoria}</p>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="lgo-field-wrap">
          <select
            id={`st-${equipe.id}`}
            value={status}
            onChange={(e) => setStatus(e.target.value as TeamStatus)}
            className="lgo-field"
            required
          >
            <option value="inscrita">Inscrita</option>
            <option value="classificada">Classificada</option>
            <option value="finalista">Finalista</option>
            <option value="eliminada">Eliminada</option>
          </select>
          <label htmlFor={`st-${equipe.id}`} className="lgo-field-label">
            Status
          </label>
        </div>

        <div className="lgo-field-wrap">
          <input
            id={`pos-${equipe.id}`}
            inputMode="numeric"
            value={posicao}
            onChange={(e) => setPosicao(e.target.value)}
            placeholder=" "
            className="lgo-field"
          />
          <label htmlFor={`pos-${equipe.id}`} className="lgo-field-label">
            Posição seletiva
          </label>
        </div>

        <div className="lgo-field-wrap">
          <input
            id={`km-${equipe.id}`}
            inputMode="decimal"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            placeholder=" "
            className="lgo-field"
          />
          <label htmlFor={`km-${equipe.id}`} className="lgo-field-label">
            Km seletiva
          </label>
        </div>

        <div className="lgo-field-wrap">
          <input
            id={`bat-${equipe.id}`}
            inputMode="numeric"
            value={bateria}
            onChange={(e) => setBateria(e.target.value)}
            placeholder=" "
            className="lgo-field"
          />
          <label htmlFor={`bat-${equipe.id}`} className="lgo-field-label">
            Bateria
          </label>
        </div>
      </div>

      <button
        type="button"
        disabled={salvando}
        onClick={() =>
          void patch({
            acao: "equipe",
            team_id: equipe.id,
            status,
            seletiva_posicao: posicao,
            seletiva_km: km,
            seletiva_bateria: bateria,
          })
        }
        className="lgo-btn mt-4 min-h-[44px] disabled:opacity-50"
      >
        SALVAR EQUIPE
      </button>
    </div>
  );
}
