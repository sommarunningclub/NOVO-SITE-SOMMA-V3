"use client";

import { useEffect, useRef } from "react";
import type { Cartao, Estado, Grupo, Notificacao } from "@/lib/vem-correr-comigo/tipos";
import { Avatar, CartaoGrupo, Contatos, nomeGrupo } from "./Cartoes";
import { MENSAGENS, rotuloKm } from "./api";
import { nomePreferencia } from "@/lib/vem-correr-comigo/regras";

export function Modal({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: React.ReactNode }) {
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    caixa.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onFechar(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);
  return (
    <div className="cr-modal" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="cr-modal__caixa" ref={caixa} tabIndex={-1}>
        <button className="cr-modal__fechar" onClick={onFechar} aria-label="Fechar">×</button>
        <h2 className="cr-modal__titulo">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

export type Pergunta = { titulo: string; texto?: string; botao: string; perigo?: boolean; onSim: () => void };

export function Confirmar({ p, ocupado, onFechar }: { p: Pergunta; ocupado: boolean; onFechar: () => void }) {
  return (
    <Modal titulo={p.titulo} onFechar={onFechar}>
      {p.texto ? <p className="cr-modal__texto">{p.texto}</p> : null}
      <div className="cr-modal__botoes">
        <button className="lr-btn lr-btn--vermelho lr-btn--bloco" disabled={ocupado} onClick={p.onSim}>{ocupado ? "Um instante…" : p.botao}</button>
        <button className="cr-link" onClick={onFechar}>Cancelar</button>
      </div>
    </Modal>
  );
}

export function Convites({ estado, ocupado, onResponder, onCancelar, onFechar }: {
  estado: Estado; ocupado: boolean;
  onResponder: (id: string, aceitar: boolean) => void;
  onCancelar: (id: string) => void;
  onFechar: () => void;
}) {
  const recebidos = estado.convites_recebidos ?? [];
  const enviados = estado.convites_enviados ?? [];
  return (
    <Modal titulo="Meus convites" onFechar={onFechar}>
      {recebidos.length === 0 && enviados.length === 0 ? <p className="cr-modal__texto">Nenhum convite por aqui.</p> : null}
      {recebidos.length > 0 ? <h3 className="cr-modal__sub">Recebidos</h3> : null}
      {recebidos.map((c) => (
        <div className="cr-convite" key={c.id}>
          <Avatar p={c.de} tamanho="p" />
          <div>
            <strong>{c.de.nome}</strong>
            <small>{c.grupo ? `Chamou você para o grupo (${nomeGrupo(c.grupo.info.total)})` : "Quer descomplicar com você"}</small>
          </div>
          <div className="cr-convite__botoes">
            <button className="lr-btn lr-btn--vermelho lr-btn--p" disabled={ocupado} onClick={() => onResponder(c.id, true)}>Aceitar</button>
            <button className="cr-link" disabled={ocupado} onClick={() => onResponder(c.id, false)}>Recusar</button>
          </div>
        </div>
      ))}
      {enviados.length > 0 ? <h3 className="cr-modal__sub">Enviados</h3> : null}
      {enviados.map((c) => (
        <div className="cr-convite" key={c.id}>
          <Avatar p={c.para} tamanho="p" />
          <div><strong>{c.para.nome}</strong><small>Aguardando resposta</small></div>
          <div className="cr-convite__botoes">
            <button className="cr-link" disabled={ocupado} onClick={() => onCancelar(c.id)}>Cancelar</button>
          </div>
        </div>
      ))}
    </Modal>
  );
}

const TEXTO_NOTIFICACAO: Record<string, (n: Notificacao) => string> = {
  convite_recebido: (n) => `${n.dados.nome} quer descomplicar com você.`,
  convite_aceito: (n) => `${n.dados.nome} aceitou seu convite.`,
  convite_recusado: (n) => `${n.dados.nome} não pôde aceitar seu convite.`,
  novo_integrante: (n) => `${n.dados.nome} entrou no seu grupo.`,
  saida: (n) => (n.dados.desfeito ? `${n.dados.nome} saiu e o grupo foi desfeito. Você está disponível de novo.` : `${n.dados.nome} saiu do grupo.`),
  grupo_completo: () => "Seu grupo está completo!",
};

export function Notificacoes({ lista, onFechar }: { lista: Notificacao[]; onFechar: () => void }) {
  return (
    <Modal titulo="Notificações" onFechar={onFechar}>
      {lista.length === 0 ? <p className="cr-modal__texto">Nada novo por aqui.</p> : null}
      <ul className="cr-notifs">
        {lista.map((n) => (
          <li key={n.id} className={n.lida_em ? "" : "is-nova"}>{TEXTO_NOTIFICACAO[n.tipo]?.(n) ?? "Novidade no seu corre."}</li>
        ))}
      </ul>
    </Modal>
  );
}

export function Destino({ perfil, grupo, proprio, ocupado, onQuero, onFechar }: {
  perfil?: Cartao; grupo?: Grupo | null; proprio: boolean; ocupado: boolean;
  onQuero: () => void; onFechar: () => void;
}) {
  const alvoCheio = !perfil && grupo?.info.completo;
  return (
    <Modal titulo={perfil ? perfil.nome : nomeGrupo(grupo?.info.total ?? 0)} onFechar={onFechar}>
      {perfil ? (
        <div className="cr-destino">
          <Avatar p={perfil} tamanho="g" />
          <p className="cr-card__meta">
            <span className="cr-selo cr-selo--km">{rotuloKm(perfil.pelotao)}</span>
            <span className="cr-selo">{nomePreferencia(perfil.preferencia)}</span>
          </p>
          <div className="cr-card__contatos"><Contatos p={perfil} /></div>
        </div>
      ) : grupo ? (
        <CartaoGrupo g={grupo} />
      ) : null}
      {proprio ? null : alvoCheio ? (
        <p className="cr-modal__texto">{MENSAGENS.grupoCompleto}</p>
      ) : (
        <div className="cr-modal__botoes">
          <button className="lr-btn lr-btn--vermelho lr-btn--bloco" disabled={ocupado} onClick={onQuero}>
            {perfil ? "Quero descomplicar com você" : "Quero descomplicar com vocês"}
          </button>
        </div>
      )}
    </Modal>
  );
}
