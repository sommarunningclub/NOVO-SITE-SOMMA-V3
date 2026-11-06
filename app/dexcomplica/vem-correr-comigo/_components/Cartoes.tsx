"use client";

import { linkInstagram, linkWhatsapp, nomePreferencia } from "@/lib/vem-correr-comigo/regras";
import { rastrearCorre } from "@/lib/vem-correr-comigo/analytics";
import type { AcaoGrupo, AcaoPessoa, Cartao, Grupo } from "@/lib/vem-correr-comigo/tipos";
import { MENSAGENS, rotuloKm, urlFoto } from "./api";

export function Avatar({ p, tamanho = "m" }: { p: Pick<Cartao, "codigo" | "nome" | "foto">; tamanho?: "p" | "m" | "g" }) {
  return (
    <span className={`cr-avatar cr-avatar--${tamanho}`}>
      {p.foto != null ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlFoto(p.codigo, p.foto)} alt={`Foto de ${p.nome}`} loading="lazy" decoding="async" />
      ) : (
        <span aria-hidden="true">{p.nome.charAt(0)}</span>
      )}
    </span>
  );
}

export function Contatos({ p }: { p: Cartao }) {
  return (
    <>
      {p.instagram ? (
        <a className="cr-ig" href={linkInstagram(p.instagram)} target="_blank" rel="noopener noreferrer">@{p.instagram}</a>
      ) : null}
      {p.whatsapp ? (
        <a className="cr-wa" href={linkWhatsapp(p.whatsapp)} target="_blank" rel="noopener noreferrer" onClick={() => rastrearCorre("whatsapp_clicked")}>
          Chamar no WhatsApp
        </a>
      ) : null}
    </>
  );
}

const ROTULO_PESSOA: Partial<Record<AcaoPessoa, string>> = {
  aguardando: "Convite enviado",
  distancia: MENSAGENS.distancia,
  sem_vaga_no_meu: "Não cabe no seu grupo",
};

export function CartaoPessoa({ p, acao, onQuero, ocupado }: { p: Cartao; acao: AcaoPessoa; onQuero: () => void; ocupado: boolean }) {
  const pode = acao === "conectar" || acao === "convidar" || acao === "aceitar";
  return (
    <article className="cr-card">
      <Avatar p={p} tamanho="g" />
      <h3>{p.nome}</h3>
      <p className="cr-card__meta">
        <span className="cr-selo cr-selo--km">{rotuloKm(p.pelotao)}</span>
        <span className="cr-selo">{nomePreferencia(p.preferencia)}</span>
      </p>
      <p className="cr-card__disp">Disponível</p>
      <div className="cr-card__contatos"><Contatos p={p} /></div>
      {pode ? (
        <button className="lr-btn lr-btn--vermelho lr-btn--p lr-btn--bloco" onClick={onQuero} disabled={ocupado}>
          {acao === "aceitar" ? "Aceitar convite" : "Quero descomplicar com você"}
        </button>
      ) : (
        <p className="cr-card__estado">{ROTULO_PESSOA[acao]}</p>
      )}
    </article>
  );
}

const ROTULO_GRUPO: Partial<Record<AcaoGrupo, string>> = {
  meu: "Esse é o seu grupo",
  completo: MENSAGENS.grupoCompleto,
  distancia: MENSAGENS.distancia,
  ja_em_grupo: "Você já está em um grupo",
  incompativel: "Sem vaga compatível com você",
};

export const nomeGrupo = (total: number) => (total === 2 ? "Dupla" : total === 3 ? "Trio" : total === 4 ? "Quarteto" : "Grupo");

export function CartaoGrupo({ g, acao, onQuero, onAbrir, ocupado }: {
  g: Grupo; acao?: AcaoGrupo; onQuero?: () => void; onAbrir?: () => void; ocupado?: boolean;
}) {
  return (
    <article className={`cr-card cr-card--grupo${g.info.completo ? " is-completo" : ""}`}>
      <button type="button" className="cr-card__abrir" onClick={onAbrir} disabled={!onAbrir} aria-label={`Abrir ${nomeGrupo(g.info.total)} e ver quem está dentro`}>
        <div className="cr-pilha">
          {g.membros.map((m) => <Avatar key={m.codigo} p={m} />)}
        </div>
        <h3>{nomeGrupo(g.info.total)}</h3>
        <p className="cr-card__nomes">{g.membros.map((m) => m.nome.split(" ")[0]).join(", ")}</p>
        <p className="cr-card__meta">
          <span className="cr-selo cr-selo--km">{rotuloKm(g.pelotao)}</span>
          <span className={`cr-selo${g.info.completo ? " cr-selo--ok" : ""}`}>
            {g.info.completo ? "Completo" : g.info.vagas === 1 ? "1 vaga" : `${g.info.vagas} vagas`}
          </span>
        </p>
        {onAbrir ? <span className="cr-card__ver">Ver quem está dentro</span> : null}
      </button>
      {acao === "entrar" && onQuero ? (
        <button className="lr-btn lr-btn--vermelho lr-btn--p lr-btn--bloco" onClick={onQuero} disabled={ocupado}>Quero descomplicar com vocês</button>
      ) : acao ? (
        <p className="cr-card__estado">{ROTULO_GRUPO[acao]}</p>
      ) : null}
    </article>
  );
}
