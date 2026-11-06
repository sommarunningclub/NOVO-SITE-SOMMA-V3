"use client";

import { useCallback, useState } from "react";
import { mensagemDeErro } from "@/lib/vem-correr-comigo/regras";
import { rastrearCorre } from "@/lib/vem-correr-comigo/analytics";
import type { Comentario } from "@/lib/vem-correr-comigo/tipos";
import type { Pergunta } from "./Paineis";
import { MENSAGENS, SessaoExpirada, enviarJson, pedir } from "./api";

const MAX = 200;

type Props = {
  recado: string;
  total: number;
  onSessao: () => void;
  onAviso: (t: string) => void;
  onPergunta: (p: Pergunta | null) => void;
};

/** Comentários de um recado. Anônimos: de quem comentou, só chega a inicial. */
export default function Comentarios({ recado, total: totalInicial, onSessao, onAviso, onPergunta }: Props) {
  const [aberto, setAberto] = useState(false);
  const [itens, setItens] = useState<Comentario[]>([]);
  const [total, setTotal] = useState(totalInicial);
  const [carregando, setCarregando] = useState(false);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const buscar = useCallback(
    (offset: number) => pedir<{ ok: boolean; erro?: string; itens: Comentario[]; total: number }>(`/correio/comentarios?recado=${recado}&offset=${offset}`),
    [recado]
  );

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const r = await buscar(0);
      if (!r.ok) return setErro(mensagemDeErro(r.erro));
      setItens(r.itens);
      setTotal(r.total);
    } catch (e) {
      if (e instanceof SessaoExpirada) onSessao();
      else setErro(MENSAGENS.rede);
    } finally {
      setCarregando(false);
    }
  }, [buscar, onSessao]);

  function alternar() {
    if (!aberto) carregar();
    setAberto((v) => !v);
  }

  async function verMais() {
    const r = await buscar(itens.length).catch(() => null);
    if (r?.ok) {
      setItens((a) => [...a, ...r.itens]);
      setTotal(r.total);
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando || !texto.trim()) return;
    setErro("");
    setEnviando(true);
    try {
      const r = await enviarJson<{ ok: boolean; erro?: string }>("/correio/comentarios", { recado, texto });
      if (!r.ok) return setErro(mensagemDeErro(r.erro));
      rastrearCorre("correio_commented");
      setTexto("");
      await carregar();
    } catch (ex) {
      if (ex instanceof SessaoExpirada) onSessao();
      else setErro(MENSAGENS.rede);
    } finally {
      setEnviando(false);
    }
  }

  async function agir(tipo: "comentario_apagar" | "comentario_denunciar", id: string) {
    try {
      const r = await enviarJson<{ ok: boolean; erro?: string }>("/correio/acao", { tipo, id });
      if (!r.ok) onAviso(mensagemDeErro(r.erro));
      else onAviso(tipo === "comentario_apagar" ? "Comentário apagado." : "Obrigado por avisar. Vamos revisar esse comentário.");
      await carregar();
    } catch (e) {
      if (e instanceof SessaoExpirada) onSessao();
      else onAviso(MENSAGENS.rede);
    } finally {
      onPergunta(null);
    }
  }

  return (
    <div className="cr-coms">
      <button className="cr-coms__abrir" aria-expanded={aberto} onClick={alternar}>
        {total === 0 ? "Comentar" : total === 1 ? "1 comentário" : `${total} comentários`}
      </button>

      {aberto ? (
        <div className="cr-coms__painel">
          {carregando && itens.length === 0 ? <p className="cr-coms__nota">Carregando…</p> : null}
          {itens.length > 0 ? (
            <ul className="cr-coms__lista">
              {itens.map((c) => (
                <li key={c.id} className="cr-com">
                  <span className="cr-com__inicial" aria-label={`Comentário anônimo, inicial ${c.inicial}`}>{c.inicial}</span>
                  <div className="cr-com__corpo">
                    <p>{c.texto}</p>
                    <div className="cr-com__acoes">
                      {c.pode_apagar ? (
                        <button className="cr-link cr-link--tinta" onClick={() => onPergunta({ titulo: "Apagar este comentário?", botao: "Apagar comentário", onSim: () => agir("comentario_apagar", c.id) })}>Apagar</button>
                      ) : null}
                      {c.meu ? null : c.denunciei ? (
                        <span>Denúncia enviada</span>
                      ) : (
                        <button className="cr-link cr-link--tinta" onClick={() => onPergunta({ titulo: "Denunciar este comentário?", texto: "Use para comentário ofensivo ou com dados de alguém.", botao: "Denunciar", onSim: () => agir("comentario_denunciar", c.id) })}>Denunciar</button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {itens.length < total ? <button className="cr-link cr-link--tinta" onClick={verMais}>Ver mais comentários</button> : null}

          <form className="cr-coms__form" onSubmit={enviar} noValidate>
            <input
              className="cr-input"
              maxLength={MAX}
              placeholder="Escreva um comentário"
              aria-label="Escreva um comentário"
              value={texto}
              onChange={(e) => { setTexto(e.target.value); if (erro) setErro(""); }}
            />
            <button className="lr-btn lr-btn--vermelho lr-btn--p" disabled={enviando || !texto.trim()}>{enviando ? "…" : "Enviar"}</button>
          </form>
          {erro ? <p className="cr-erro" role="alert">{erro}</p> : null}
          <p className="cr-coms__nota">Comentário anônimo: aparece só a inicial do seu nome. Em caso de denúncia, a organização consegue saber quem escreveu.</p>
        </div>
      ) : null}
    </div>
  );
}
