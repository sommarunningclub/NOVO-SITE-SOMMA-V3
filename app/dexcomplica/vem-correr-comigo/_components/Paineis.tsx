"use client";

import { useEffect, useRef } from "react";
import type { Cartao, Estado, Grupo, Notificacao } from "@/lib/vem-correr-comigo/tipos";
import { rastrearCorre } from "@/lib/vem-correr-comigo/analytics";
import { linkInstagram, nomePreferencia } from "@/lib/vem-correr-comigo/regras";
import { Avatar, Contatos, nomeGrupo } from "./Cartoes";
import ChatGrupo from "./ChatGrupo";
import { MENSAGENS, rotuloKm, rotuloKmGrupo } from "./api";

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
  recado_comentado: () => "Comentaram no seu recado do Correio Elegante.",
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

export function Destino({ perfil, grupo, proprio, ocupado, podeEntrar, onQuero, onFechar, onSessao }: {
  perfil?: Cartao; grupo?: Grupo | null; proprio: boolean; ocupado: boolean;
  podeEntrar?: boolean; onQuero: () => void; onFechar: () => void; onSessao: () => void;
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
        <div className="cr-destino cr-destino--grupo">
          <p className="cr-card__meta">
            <span className="cr-selo cr-selo--km">{rotuloKmGrupo(grupo.membros)}</span>
            <span className={`cr-selo${grupo.info.completo ? " cr-selo--ok" : ""}`}>
              {grupo.info.completo ? "Completo" : grupo.info.vagas === 1 ? "1 vaga" : `${grupo.info.vagas} vagas`}
            </span>
          </p>
          <ul className={`cr-grupo-membros cr-grupo-membros--${Math.min(grupo.membros.length, 4)}`}>
            {grupo.membros.map((m) => {
              const ig = m.instagram ? linkInstagram(m.instagram) : null;
              const corpo = (
                <>
                  <Avatar p={m} tamanho="m" />
                  <strong>{m.nome.split(" ")[0]}</strong>
                  <span className="cr-grupo-membros__km">{rotuloKm(m.pelotao)}</span>
                  {m.instagram ? <span className="cr-grupo-membros__ig">@{m.instagram}</span> : null}
                </>
              );
              return (
                <li key={m.codigo}>
                  {ig ? (
                    <a
                      className="cr-grupo-membros__pessoa"
                      href={ig}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir Instagram de ${m.nome}`}
                      onClick={() => rastrearCorre("instagram_clicked", { origem: "grupo" })}
                    >
                      {corpo}
                    </a>
                  ) : (
                    <div className="cr-grupo-membros__pessoa">{corpo}</div>
                  )}
                  {m.whatsapp ? (
                    <span className="cr-grupo-membros__contatos"><Contatos p={{ ...m, instagram: null }} /></span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {proprio ? null : alvoCheio ? (
        <p className="cr-modal__texto">{MENSAGENS.grupoCompleto}</p>
      ) : podeEntrar !== false ? (
        <div className="cr-modal__botoes">
          <button className="lr-btn lr-btn--vermelho lr-btn--bloco" disabled={ocupado} onClick={onQuero}>
            {perfil ? "Quero descomplicar com você" : "Quero descomplicar com vocês"}
          </button>
        </div>
      ) : null}
      {grupo ? <ChatGrupo codigoGrupo={grupo.codigo} onSessao={onSessao} /> : null}
    </Modal>
  );
}
