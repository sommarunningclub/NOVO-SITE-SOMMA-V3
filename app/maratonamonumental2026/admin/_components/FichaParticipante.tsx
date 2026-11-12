"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { DISTANCIAS_INSCRICAO, ROTULO_DISTANCIA, type DistanciaInscricao } from "@/lib/evp/config";
import { dataHora } from "@/lib/evp/formato";
import { cpfMascarado, mascararTelefone, SEXO_ROTULO, SEXOS } from "@/lib/evp/schema";
import { Campo, Mensagem, STATUS_ROTULO, STATUS_SELO, useApi, type Aviso, type Ficha } from "./api";
import { rotuloAcao } from "./rotulos";

type Edicao = { nome: string; email: string; telefone: string; sexo: "feminino" | "masculino"; distancia: DistanciaInscricao; primeira_vez: boolean };

function Dado({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="mt-rotulo">{rotulo}</dt>
      <dd className="mt-1 break-words">{children}</dd>
    </div>
  );
}

export function FichaParticipante({ id, fechar, mudou }: { id: string; fechar: () => void; mudou: () => void }) {
  const api = useApi();
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState<Aviso>(null);
  const [ocupado, setOcupado] = useState("");
  const [cpf, setCpf] = useState<string | null>(null);
  const [modo, setModo] = useState<"ver" | "editar" | "cancelar">("ver");
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [motivo, setMotivo] = useState("");
  const caixa = useRef<HTMLDivElement>(null);

  const carregar = useCallback(async () => {
    const r = await api<{ dados: Ficha }>(`/api/evp/admin/participante?id=${id}`);
    if (r.ok) {
      setFicha(r.corpo.dados);
      setErro("");
    } else setErro(r.erro);
  }, [api, id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // Modal: foco entra, Esc fecha, a página de trás não rola, o foco volta ao sair.
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    caixa.current?.focus();
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
      if (e.key !== "Tab" || !caixa.current) return;
      const focaveis = caixa.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input, select, textarea");
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === caixa.current)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = rolagem;
      anterior?.focus();
    };
  }, [fechar]);

  async function acao(nome: string, extra: Record<string, unknown> = {}) {
    setOcupado(nome);
    setAviso(null);
    const r = await api<Record<string, unknown>>("/api/evp/admin/participante", {
      method: "POST",
      body: JSON.stringify({ id, acao: nome, ...extra }),
    });
    setOcupado("");
    return r;
  }

  async function revelar() {
    const r = await acao("revelar_cpf");
    if (!r.ok) return setAviso({ tipo: "erro", texto: r.erro });
    setCpf(String(r.corpo.cpf ?? ""));
    void carregar();
  }

  async function reenviar() {
    const r = await acao("reenviar");
    setAviso(r.ok ? { tipo: "ok", texto: "Confirmação reenviada para o e-mail da inscrição." } : { tipo: "erro", texto: r.erro });
    void carregar();
  }

  async function desfazer() {
    if (!window.confirm("Desfazer o check-in desta pessoa? O registro anterior continua no histórico.")) return;
    const r = await acao("desfazer_checkin");
    setAviso(r.ok ? { tipo: "ok", texto: "Check-in desfeito." } : { tipo: "erro", texto: r.erro });
    void carregar();
    mudou();
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!edicao) return;
    setCampos({});
    const r = await acao("editar", { dados: edicao });
    if (!r.ok) {
      setCampos((r.corpo.campos as Record<string, string>) ?? {});
      return setAviso({ tipo: "erro", texto: r.erro });
    }
    const n = Array.isArray(r.corpo.mudou) ? r.corpo.mudou.length : 0;
    setAviso({ tipo: "ok", texto: n ? "Dados atualizados." : "Nada mudou." });
    setModo("ver");
    void carregar();
    mudou();
  }

  async function cancelar(e: FormEvent) {
    e.preventDefault();
    const r = await acao("cancelar", { motivo });
    if (!r.ok) return setAviso({ tipo: "erro", texto: r.erro });
    const n = Number(r.corpo.promovidas ?? 0);
    setAviso({
      tipo: "ok",
      texto: n ? `Inscrição cancelada. ${n} pessoa(s) da fila ficaram com a vaga, ${Number(r.corpo.avisados ?? 0)} avisada(s) por e-mail.` : "Inscrição cancelada. A vaga foi liberada.",
    });
    setModo("ver");
    setMotivo("");
    void carregar();
    mudou();
  }

  const presente = ficha?.checkins.some((c) => !c.desfeito_em) ?? false;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.7)" }} onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ficha-titulo"
        tabIndex={-1}
        className="h-full w-full max-w-xl overflow-y-auto border-l p-5 outline-none sm:p-7"
        style={{ background: "var(--mt-preto)", borderColor: "var(--mt-linha-forte)", paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mt-rotulo">Inscrição {ficha?.codigo ?? ""}</p>
            <h2 id="ficha-titulo" className="mt-1 break-words text-2xl font-bold">
              {ficha?.nome ?? (erro ? "Inscrição" : "Carregando...")}
            </h2>
          </div>
          <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno shrink-0" onClick={fechar}>
            Fechar
          </button>
        </div>

        {erro ? <p className="mt-4" role="alert" style={{ color: "#ff8a8a" }}>{erro}</p> : null}
        <div className="mt-3"><Mensagem aviso={aviso} /></div>

        {ficha && modo === "ver" ? (
          <>
            <div className="flex flex-wrap gap-2">
              <span className={STATUS_SELO[ficha.status]}>{STATUS_ROTULO[ficha.status]}</span>
              {presente ? <span className="mt-selo mt-selo--ok">Presente</span> : null}
              {ficha.primeira_vez ? <span className="mt-selo mt-selo--fora">Primeira vez na distância</span> : null}
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <Dado rotulo="E-mail">{ficha.email}</Dado>
              <Dado rotulo="WhatsApp">{mascararTelefone(ficha.telefone)}</Dado>
              <Dado rotulo="CPF">
                <span className="mt-mono text-sm">{cpf ?? cpfMascarado(ficha.cpf_final)}</span>
                {!cpf ? (
                  <>
                    <button type="button" className="ml-3 underline underline-offset-4" style={{ minHeight: 44 }} onClick={revelar} disabled={ocupado !== ""}>
                      {ocupado === "revelar_cpf" ? "Abrindo..." : "Ver CPF inteiro"}
                    </button>
                    <span className="block text-xs" style={{ color: "var(--mt-cinza)" }}>
                      Ver o CPF inteiro fica registrado no histórico, com o seu nome.
                    </span>
                  </>
                ) : null}
              </Dado>
              <Dado rotulo="Sexo">{SEXO_ROTULO[ficha.sexo]}</Dado>
              <Dado rotulo="Distância">{ROTULO_DISTANCIA[ficha.distancia]}</Dado>
              <Dado rotulo="Origem">{ficha.origem_fonte}</Dado>
              <Dado rotulo="Inscrição em">{dataHora(ficha.created_at)}</Dado>
              <Dado rotulo="Termos aceitos em">{dataHora(ficha.aceite_termos_em)}</Dado>
              <Dado rotulo="Aceita comunicação">{ficha.aceite_marketing ? "Sim" : "Não"}</Dado>
              {ficha.cancelada_em ? (
                <Dado rotulo="Cancelada em">
                  {dataHora(ficha.cancelada_em)}
                  {ficha.cancelada_motivo ? ` · ${ficha.cancelada_motivo}` : ""}
                </Dado>
              ) : null}
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className="mt-botao mt-botao--linha mt-botao--pequeno"
                disabled={ocupado !== ""}
                onClick={() => {
                  setEdicao({ nome: ficha.nome, email: ficha.email, telefone: mascararTelefone(ficha.telefone), sexo: ficha.sexo, distancia: ficha.distancia, primeira_vez: ficha.primeira_vez });
                  setCampos({});
                  setAviso(null);
                  setModo("editar");
                }}
              >
                Editar dados
              </button>
              {ficha.status !== "cancelada" ? (
                <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno" onClick={reenviar} disabled={ocupado !== ""}>
                  {ocupado === "reenviar" ? "Enviando..." : "Reenviar confirmação"}
                </button>
              ) : null}
              {presente ? (
                <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno" onClick={desfazer} disabled={ocupado !== ""}>
                  Desfazer check-in
                </button>
              ) : null}
              {ficha.status !== "cancelada" ? (
                <button
                  type="button"
                  className="mt-botao mt-botao--linha mt-botao--pequeno"
                  style={{ borderColor: "#ff6b6b", color: "#ff8a8a" }}
                  disabled={ocupado !== ""}
                  onClick={() => {
                    setAviso(null);
                    setModo("cancelar");
                  }}
                >
                  Cancelar inscrição
                </button>
              ) : null}
            </div>

            <h3 className="mt-rotulo mt-8">Histórico de check-in</h3>
            {ficha.checkins.length === 0 ? (
              <p className="mt-2 text-sm" style={{ color: "var(--mt-cinza)" }}>Nenhum check-in registrado.</p>
            ) : (
              <ul className="mt-2 grid gap-2 text-sm">
                {ficha.checkins.map((c, i) => (
                  <li key={i} className="mt-cartao p-3">
                    {dataHora(c.feito_em)} · {c.via === "qr" ? "QR Code" : "Busca manual"} · por {c.operador}
                    {c.desfeito_em ? (
                      <span className="block" style={{ color: "var(--mt-cinza)" }}>
                        Desfeito em {dataHora(c.desfeito_em)}{c.desfeito_por ? ` por ${c.desfeito_por}` : ""}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            <h3 className="mt-rotulo mt-8">Histórico de alterações</h3>
            <ul className="mt-2 grid gap-2 text-sm">
              {ficha.historico.map((h, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 border-b pb-2" style={{ borderColor: "var(--mt-linha)" }}>
                  <span>{rotuloAcao(h.acao, h.detalhes)}</span>
                  <span style={{ color: "var(--mt-cinza)" }}>{h.quem} · {dataHora(h.criado_em)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {ficha && modo === "editar" && edicao ? (
          <form onSubmit={salvar} className="mt-2 grid gap-4" noValidate>
            <Campo rotulo="Nome completo" erro={campos.nome}>
              <input className="mt-input" value={edicao.nome} aria-invalid={campos.nome ? true : undefined} onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })} autoComplete="off" />
            </Campo>
            <Campo rotulo="E-mail" erro={campos.email}>
              <input className="mt-input" type="email" inputMode="email" value={edicao.email} aria-invalid={campos.email ? true : undefined} onChange={(e) => setEdicao({ ...edicao, email: e.target.value })} autoComplete="off" />
            </Campo>
            <Campo rotulo="WhatsApp com DDD" erro={campos.telefone}>
              <input className="mt-input" type="tel" inputMode="tel" value={edicao.telefone} aria-invalid={campos.telefone ? true : undefined} onChange={(e) => setEdicao({ ...edicao, telefone: mascararTelefone(e.target.value) })} autoComplete="off" />
            </Campo>
            <Campo rotulo="Sexo" erro={campos.sexo}>
              <select className="mt-input" value={edicao.sexo} onChange={(e) => setEdicao({ ...edicao, sexo: e.target.value as Edicao["sexo"] })}>
                {SEXOS.map((s) => <option key={s} value={s}>{SEXO_ROTULO[s]}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Distância" erro={campos.distancia}>
              <select className="mt-input" value={edicao.distancia} onChange={(e) => setEdicao({ ...edicao, distancia: e.target.value as DistanciaInscricao })}>
                {DISTANCIAS_INSCRICAO.map((d) => <option key={d} value={d}>{ROTULO_DISTANCIA[d]}</option>)}
              </select>
            </Campo>
            <label className="mt-check">
              <input type="checkbox" checked={edicao.primeira_vez} onChange={(e) => setEdicao({ ...edicao, primeira_vez: e.target.checked })} />
              <span>É a primeira vez nessa distância</span>
            </label>
            <p className="text-sm" style={{ color: "var(--mt-cinza)" }}>
              O CPF não é editável. Se estiver errado, cancele esta inscrição e peça uma nova.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="mt-botao mt-botao--cheio mt-botao--pequeno" disabled={ocupado !== ""}>
                {ocupado === "editar" ? "Salvando..." : "Salvar"}
              </button>
              <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno" onClick={() => setModo("ver")}>
                Voltar
              </button>
            </div>
          </form>
        ) : null}

        {ficha && modo === "cancelar" ? (
          <form onSubmit={cancelar} className="mt-2 grid gap-4">
            <p className="mt-texto">
              Cancelar a inscrição de <strong>{ficha.nome}</strong>? A vaga é liberada na hora
              {ficha.status === "confirmada" ? " e, se a promoção automática estiver ligada, vai para a primeira pessoa da lista de espera." : "."}
            </p>
            <Campo rotulo="Motivo (fica no histórico)">
              <textarea className="mt-input" rows={3} maxLength={300} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </Campo>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="mt-botao mt-botao--cheio mt-botao--pequeno" disabled={ocupado !== ""}>
                {ocupado === "cancelar" ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
              <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno" onClick={() => setModo("ver")}>
                Voltar
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
