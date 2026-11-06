"use client";

import { useCallback, useEffect, useState } from "react";
import { API_CORRE, linkInstagram, linkWhatsapp, mensagemDeErro } from "@/lib/vem-correr-comigo/regras";
import { rastrearCorre } from "@/lib/vem-correr-comigo/analytics";
import type { MeuPerfil, Recado } from "@/lib/vem-correr-comigo/tipos";
import { Avatar } from "./Cartoes";
import FotoPerfil from "./FotoPerfil";
import { Confirmar, Modal, type Pergunta } from "./Paineis";
import { MENSAGENS, SessaoExpirada, enviarJson, pedir } from "./api";

const MAX = 280;

type Props = { perfil: MeuPerfil; onSessao: () => void; onAviso: (t: string) => void };

export default function Correio({ perfil, onSessao, onAviso }: Props) {
  const [itens, setItens] = useState<Recado[]>([]);
  const [total, setTotal] = useState(0);
  const [estado, setEstado] = useState<"carregando" | "ok" | "erro">("carregando");
  const [escrevendo, setEscrevendo] = useState(false);
  const [pergunta, setPergunta] = useState<Pergunta | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const buscar = useCallback((offset: number) => pedir<{ ok: boolean; itens: Recado[]; total: number }>(`/correio?offset=${offset}`), []);

  const recarregar = useCallback(async () => {
    try {
      const r = await buscar(0);
      if (!r.ok) return setEstado("erro");
      setItens(r.itens);
      setTotal(r.total);
      setEstado("ok");
    } catch (e) {
      if (e instanceof SessaoExpirada) onSessao();
      else setEstado("erro");
    }
  }, [buscar, onSessao]);

  useEffect(() => {
    rastrearCorre("correio_viewed");
    recarregar();
  }, [recarregar]);

  async function verMais() {
    const r = await buscar(itens.length).catch(() => null);
    if (r?.ok) {
      setItens((a) => [...a, ...r.itens]);
      setTotal(r.total);
    }
  }

  async function agir(tipo: "apagar" | "denunciar", id: string) {
    setOcupado(true);
    try {
      const r = await enviarJson<{ ok: boolean; erro?: string }>("/correio/acao", { tipo, id });
      if (!r.ok) onAviso(mensagemDeErro(r.erro));
      else if (tipo === "denunciar") {
        rastrearCorre("correio_reported");
        onAviso("Obrigado por avisar. Vamos revisar esse recado.");
      } else onAviso("Recado apagado.");
      await recarregar();
    } catch (e) {
      if (e instanceof SessaoExpirada) onSessao();
      else onAviso(MENSAGENS.rede);
    } finally {
      setOcupado(false);
      setPergunta(null);
    }
  }

  return (
    <section className="cr-sec cr-correio" aria-labelledby="t-correio">
      <h2 id="t-correio" className="cr-h2">Correio Elegante</h2>
      <p className="cr-lead">Mande um recado para aquele alguém do corre. Ele aparece aqui no mural, para quem está inscrito no Love Run.</p>
      <button className="lr-btn lr-btn--vermelho lr-btn--bloco cr-correio__novo" onClick={() => setEscrevendo(true)}>Escrever um recado</button>

      {estado === "carregando" ? (
        <div className="cr-mural" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="cr-recado cr-card--esqueleto" />)}</div>
      ) : estado === "erro" ? (
        <p className="cr-vazio">{MENSAGENS.rede}</p>
      ) : itens.length === 0 ? (
        <p className="cr-vazio">O mural ainda está vazio. Que tal escrever o primeiro recado?</p>
      ) : (
        <>
          <div className="cr-mural">
            {itens.map((r, i) => (
              <article key={r.id} className={`cr-recado cr-recado--${i % 3}`}>
                {r.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="cr-recado__foto" src={`${API_CORRE}/correio/foto/${r.id}`} alt="Foto do recado" loading="lazy" decoding="async" />
                ) : null}
                <p className="cr-recado__para"><span>Para</span> {r.para}</p>
                <p className="cr-recado__texto">{r.mensagem}</p>
                <footer className="cr-recado__de">
                  {r.autor ? (
                    <>
                      <Avatar p={r.autor} tamanho="p" />
                      <div>
                        <strong>{r.autor.nome}</strong>
                        <span className="cr-recado__contatos">
                          {r.autor.instagram ? <a href={linkInstagram(r.autor.instagram)} target="_blank" rel="noopener noreferrer">@{r.autor.instagram}</a> : null}
                          {r.autor.whatsapp ? <a href={linkWhatsapp(r.autor.whatsapp)} target="_blank" rel="noopener noreferrer" onClick={() => rastrearCorre("whatsapp_clicked", { origem: "correio" })}>Chamar no WhatsApp</a> : null}
                        </span>
                      </div>
                    </>
                  ) : (
                    <strong className="cr-recado__anonimo">Alguém do corre ♥</strong>
                  )}
                </footer>
                <div className="cr-recado__acoes">
                  {r.meu ? (
                    <button className="cr-link cr-link--tinta" disabled={ocupado} onClick={() => setPergunta({ titulo: "Apagar este recado?", texto: "Ele sai do mural na hora.", botao: "Apagar recado", onSim: () => agir("apagar", r.id) })}>Apagar</button>
                  ) : r.denunciei ? (
                    <span>Denúncia enviada</span>
                  ) : (
                    <button className="cr-link cr-link--tinta" disabled={ocupado} onClick={() => setPergunta({ titulo: "Denunciar este recado?", texto: "Use para recado ofensivo, com dados de alguém ou foto sem autorização.", botao: "Denunciar", onSim: () => agir("denunciar", r.id) })}>Denunciar</button>
                  )}
                </div>
              </article>
            ))}
          </div>
          {itens.length < total ? <button className="lr-btn lr-btn--branco lr-btn--p cr-mais" onClick={verMais}>Ver mais</button> : null}
        </>
      )}

      {escrevendo ? (
        <Modal titulo="Escrever um recado" onFechar={() => setEscrevendo(false)}>
          <FormRecado perfil={perfil} onPublicado={() => { setEscrevendo(false); onAviso("Recado no mural!"); recarregar(); }} onSessao={onSessao} />
        </Modal>
      ) : null}
      {pergunta ? <Confirmar p={pergunta} ocupado={ocupado} onFechar={() => setPergunta(null)} /> : null}
    </section>
  );
}

function FormRecado({ perfil, onPublicado, onSessao }: { perfil: MeuPerfil; onPublicado: () => void; onSessao: () => void }) {
  const [para, setPara] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [foto, setFoto] = useState<Blob | null>(null);
  const [identificado, setIdentificado] = useState(true);
  const [mostrarIg, setMostrarIg] = useState(false);
  const [mostrarWa, setMostrarWa] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    if (!para.trim() || !mensagem.trim()) return setErro("Escreva para quem é e a mensagem.");
    setErro("");
    setEnviando(true);
    try {
      const d = new FormData();
      d.append("para", para);
      d.append("mensagem", mensagem);
      d.append("identificado", identificado ? "1" : "0");
      d.append("mostrar_instagram", identificado && mostrarIg ? "1" : "0");
      d.append("mostrar_whatsapp", identificado && mostrarWa ? "1" : "0");
      if (foto) d.append("foto", foto, "recado.jpg");
      const r = await pedir<{ ok: boolean; erro?: string }>("/correio", { method: "POST", body: d });
      if (!r.ok) return setErro(mensagemDeErro(r.erro));
      rastrearCorre("correio_published", { identificado, com_foto: Boolean(foto) });
      onPublicado();
    } catch (ex) {
      if (ex instanceof SessaoExpirada) onSessao();
      else setErro(MENSAGENS.rede);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="cr-form" onSubmit={publicar} noValidate>
      <label className="cr-campo">
        <span>Para quem é?</span>
        <input className="cr-input" maxLength={60} placeholder="Nome, apelido ou uma pista" value={para} onChange={(e) => setPara(e.target.value)} />
      </label>
      <label className="cr-campo">
        <span>Sua mensagem</span>
        <textarea className="cr-input cr-textarea" maxLength={MAX} rows={4} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
        <small>{mensagem.length}/{MAX}. Sem telefone ou documento de ninguém.</small>
      </label>
      <div className="cr-campo">
        <span>Foto (opcional)</span>
        <FotoPerfil atual={null} onPronta={setFoto} />
        <small>Use uma foto sua ou de quem autorizou.</small>
      </div>

      <label className="cr-chave">
        <input type="checkbox" checked={identificado} onChange={(e) => setIdentificado(e.target.checked)} />
        <span>Mostrar meu nome no recado</span>
      </label>
      {identificado ? (
        <>
          <label className={`cr-chave${perfil.instagram ? "" : " cr-chave--off"}`}>
            <input type="checkbox" checked={mostrarIg} disabled={!perfil.instagram} onChange={(e) => setMostrarIg(e.target.checked)} />
            <span>{perfil.instagram ? `Mostrar meu Instagram (@${perfil.instagram})` : "Mostrar meu Instagram (cadastre em Editar perfil)"}</span>
          </label>
          <label className={`cr-chave${perfil.whatsapp ? "" : " cr-chave--off"}`}>
            <input type="checkbox" checked={mostrarWa} disabled={!perfil.whatsapp} onChange={(e) => setMostrarWa(e.target.checked)} />
            <span>{perfil.whatsapp ? "Mostrar meu WhatsApp neste recado" : "Mostrar meu WhatsApp (cadastre em Editar perfil)"}</span>
          </label>
        </>
      ) : (
        <p className="cr-nota">Seu nome não aparece no mural. Em caso de denúncia, a organização consegue saber quem escreveu.</p>
      )}

      <p className="cr-nota">Vai aparecer como: <strong>{identificado ? perfil.nome : "Alguém do corre"}</strong></p>
      {erro ? <p className="cr-erro" role="alert">{erro}</p> : null}
      <button className="lr-btn lr-btn--vermelho lr-btn--bloco" disabled={enviando}>{enviando ? "Publicando…" : "Publicar no mural"}</button>
    </form>
  );
}
