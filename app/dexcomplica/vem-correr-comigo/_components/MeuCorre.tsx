"use client";

import { nomePreferencia } from "@/lib/vem-correr-comigo/regras";
import type { Estado } from "@/lib/vem-correr-comigo/tipos";
import { Avatar, Contatos, nomeGrupo } from "./Cartoes";
import { MENSAGENS, rotuloKm } from "./api";

type Props = {
  estado: Estado;
  onEditar: () => void;
  onCompartilharPerfil: () => void;
  onCompartilharGrupo: () => void;
  onAbrirGrupo: () => void;
  onConvites: () => void;
  onSairDoGrupo: () => void;
};

export default function MeuCorre({ estado, onEditar, onCompartilharPerfil, onCompartilharGrupo, onAbrirGrupo, onConvites, onSairDoGrupo }: Props) {
  const p = estado.perfil!;
  const g = estado.grupo ?? null;
  const recebidos = estado.convites_recebidos?.length ?? 0;
  const enviados = estado.convites_enviados?.length ?? 0;

  return (
    <section className="cr-meu" id="meu-corre" aria-labelledby="t-meu">
      <h2 id="t-meu" className="cr-h2 cr-h2--tinta">Meu corre</h2>
      <div className="cr-meu__topo">
        <Avatar p={p} tamanho="g" />
        <div>
          <p className="cr-meu__nome">{p.nome}</p>
          <p className="cr-card__meta">
            <span className="cr-selo cr-selo--km">{rotuloKm(p.pelotao)}</span>
            <span className="cr-selo">{nomePreferencia(p.preferencia)}</span>
          </p>
          {p.instagram ? <p className="cr-meu__ig">@{p.instagram}</p> : null}
        </div>
      </div>

      <p className="cr-meu__status">
        {g
          ? g.info.completo
            ? `${nomeGrupo(g.info.total)} completo. Agora é só descomplicar!`
            : `${nomeGrupo(g.info.total)} formado, ${g.info.vagas === 1 ? "1 vaga aberta" : `${g.info.vagas} vagas abertas`}.`
          : MENSAGENS.semGrupo}
      </p>

      {recebidos > 0 ? (
        <button className="cr-meu__alerta" onClick={onConvites}>
          {MENSAGENS.conviteRecebido} {recebidos === 1 ? "1 convite" : `${recebidos} convites`} para responder.
        </button>
      ) : null}

      {g ? (
        <div className="cr-meu__grupo" id="meu-grupo">
          <ul>
            {g.membros.map((m) => (
              <li key={m.codigo}>
                <Avatar p={m} tamanho="p" />
                <span><strong>{m.nome}</strong></span>
                <span className="cr-meu__contatos"><Contatos p={m} /></span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="cr-meu__acoes">
        <button className="lr-btn lr-btn--tinta lr-btn--p" onClick={onCompartilharPerfil}>Compartilhar meu corre</button>
        <button className="lr-btn lr-btn--branco lr-btn--p" onClick={onConvites}>
          Meus convites{recebidos + enviados > 0 ? ` (${recebidos + enviados})` : ""}
        </button>
        <button className="lr-btn lr-btn--branco lr-btn--p" onClick={onEditar}>Editar perfil</button>
        {g ? (
          <>
            <button className="lr-btn lr-btn--branco lr-btn--p" onClick={onAbrirGrupo}>Ver grupo e bate-papo</button>
            <button className="lr-btn lr-btn--branco lr-btn--p" onClick={onCompartilharGrupo}>Compartilhar grupo</button>
            <button className="cr-link cr-link--tinta" onClick={onSairDoGrupo}>Sair do grupo</button>
          </>
        ) : null}
      </div>
    </section>
  );
}
