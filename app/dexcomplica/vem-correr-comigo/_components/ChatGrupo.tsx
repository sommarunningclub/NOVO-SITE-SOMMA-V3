"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Cartao } from "@/lib/vem-correr-comigo/tipos";
import { Avatar } from "./Cartoes";
import { MENSAGENS, SessaoExpirada, enviarJson, pedir } from "./api";

const EMOJIS = ["❤️", "😂", "🔥", "👏", "😮", "😢"] as const;
const ATUALIZAR_MS = 4000;

export type MensagemChat = {
  id: string;
  texto: string;
  apagada: boolean;
  criado_em: string;
  editado_em: string | null;
  minha: boolean;
  autor: Cartao;
  reacoes: { emoji: string; total: number; eu: boolean }[];
};

type Props = {
  codigoGrupo: string;
  onSessao: () => void;
};

export default function ChatGrupo({ codigoGrupo, onSessao }: Props) {
  const [msgs, setMsgs] = useState<MensagemChat[]>([]);
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [reagirDe, setReagirDe] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const lista = useRef<HTMLDivElement>(null);
  const fim = useRef(true);

  const carregar = useCallback(async () => {
    try {
      const r = await pedir<{ ok: boolean; mensagens?: MensagemChat[]; erro?: string }>(
        `/chat?grupo=${encodeURIComponent(codigoGrupo)}`
      );
      if (!r.ok) return setErro(r.erro === "sem_foto" ? "Coloque sua foto para participar do bate-papo." : MENSAGENS.rede);
      setErro("");
      setMsgs(r.mensagens ?? []);
    } catch (e) {
      if (e instanceof SessaoExpirada) onSessao();
    }
  }, [codigoGrupo, onSessao]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") carregar();
    }, ATUALIZAR_MS);
    return () => clearInterval(id);
  }, [carregar]);

  useEffect(() => {
    if (fim.current) lista.current?.scrollTo({ top: lista.current.scrollHeight });
  }, [msgs]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setErro("");
    try {
      if (editando) {
        const r = await enviarJson<{ ok: boolean; mensagem?: MensagemChat; erro?: string }>("/chat", {
          tipo: "editar", mensagem: editando, texto: t,
        });
        if (!r.ok || !r.mensagem) return setErro(MENSAGENS.rede);
        setMsgs((a) => a.map((m) => (m.id === r.mensagem!.id ? r.mensagem! : m)));
        setEditando(null);
      } else {
        const r = await enviarJson<{ ok: boolean; mensagem?: MensagemChat; erro?: string }>("/chat", {
          tipo: "enviar", grupo: codigoGrupo, texto: t,
        });
        if (!r.ok || !r.mensagem) return setErro(MENSAGENS.rede);
        setMsgs((a) => (a.some((m) => m.id === r.mensagem!.id) ? a : [...a, r.mensagem!]));
        fim.current = true;
      }
      setTexto("");
    } catch (err) {
      if (err instanceof SessaoExpirada) onSessao();
      else setErro(MENSAGENS.rede);
    } finally {
      setEnviando(false);
    }
  }

  async function apagar(id: string) {
    if (enviando) return;
    setEnviando(true);
    try {
      const r = await enviarJson<{ ok: boolean }>("/chat", { tipo: "apagar", mensagem: id });
      if (r.ok) setMsgs((a) => a.map((m) => (m.id === id ? { ...m, apagada: true, texto: "", reacoes: [] } : m)));
    } catch (err) {
      if (err instanceof SessaoExpirada) onSessao();
    } finally {
      setEnviando(false);
      setReagirDe(null);
    }
  }

  async function reagir(id: string, emoji: string) {
    try {
      const r = await enviarJson<{ ok: boolean; mensagem?: MensagemChat }>("/chat", {
        tipo: "reagir", mensagem: id, emoji,
      });
      if (r.ok && r.mensagem) setMsgs((a) => a.map((m) => (m.id === r.mensagem!.id ? r.mensagem! : m)));
    } catch (err) {
      if (err instanceof SessaoExpirada) onSessao();
    } finally {
      setReagirDe(null);
    }
  }

  function comecarEdicao(m: MensagemChat) {
    setEditando(m.id);
    setTexto(m.texto);
    setReagirDe(null);
  }

  return (
    <div className="cr-chat">
      <h3 className="cr-chat__titulo">Bate-papo do grupo</h3>
      <p className="cr-chat__nota">Público para a comunidade. Qualquer inscrito pode comentar.</p>
      <div
        className="cr-chat__lista"
        ref={lista}
        onScroll={() => {
          const el = lista.current;
          if (!el) return;
          fim.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
        }}
      >
        {msgs.length === 0 ? <p className="cr-chat__vazio">Ninguém falou ainda. Quebre o gelo!</p> : null}
        {msgs.map((m) => (
          <article key={m.id} className={`cr-chat__msg${m.minha ? " is-minha" : ""}`}>
            <Avatar p={m.autor} tamanho="p" />
            <div className="cr-chat__bolha">
              <header>
                <strong>{m.autor.nome.split(" ")[0]}</strong>
                <time dateTime={m.criado_em}>
                  {new Date(m.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  {m.editado_em && !m.apagada ? " · editada" : ""}
                </time>
              </header>
              {m.apagada ? (
                <p className="cr-chat__apagada">Mensagem apagada</p>
              ) : (
                <p>{m.texto}</p>
              )}
              {!m.apagada && m.reacoes.length > 0 ? (
                <div className="cr-chat__reacoes">
                  {m.reacoes.map((r) => (
                    <button
                      key={r.emoji}
                      type="button"
                      className={`cr-chat__reacao${r.eu ? " is-on" : ""}`}
                      onClick={() => reagir(m.id, r.emoji)}
                      aria-label={`${r.emoji} ${r.total}`}
                    >
                      {r.emoji} {r.total}
                    </button>
                  ))}
                </div>
              ) : null}
              {!m.apagada ? (
                <div className="cr-chat__acoes">
                  <button type="button" className="cr-link" onClick={() => setReagirDe(reagirDe === m.id ? null : m.id)}>Reagir</button>
                  {m.minha ? (
                    <>
                      <button type="button" className="cr-link" onClick={() => comecarEdicao(m)}>Editar</button>
                      <button type="button" className="cr-link" onClick={() => apagar(m.id)}>Apagar</button>
                    </>
                  ) : null}
                </div>
              ) : null}
              {reagirDe === m.id ? (
                <div className="cr-chat__emojis" role="group" aria-label="Escolher reação">
                  {EMOJIS.map((e) => (
                    <button key={e} type="button" onClick={() => reagir(m.id, e)} aria-label={`Reagir com ${e}`}>{e}</button>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      <form className="cr-chat__form" onSubmit={enviar}>
        {editando ? (
          <p className="cr-chat__editando">
            Editando mensagem{" "}
            <button type="button" className="cr-link" onClick={() => { setEditando(null); setTexto(""); }}>Cancelar</button>
          </p>
        ) : null}
        <div className="cr-chat__envio">
          <input
            className="cr-input"
            value={texto}
            maxLength={500}
            placeholder="Escreva no bate-papo…"
            aria-label="Mensagem"
            onChange={(e) => setTexto(e.target.value)}
          />
          <button className="lr-btn lr-btn--vermelho lr-btn--p" disabled={enviando || !texto.trim()}>
            {editando ? "Salvar" : "Enviar"}
          </button>
        </div>
        {erro ? <p className="cr-erro" role="alert">{erro}</p> : null}
      </form>
    </div>
  );
}
