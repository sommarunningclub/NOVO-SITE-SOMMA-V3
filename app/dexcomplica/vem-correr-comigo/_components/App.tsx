"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { mensagemDeErro } from "@/lib/vem-correr-comigo/regras";
import { rastrearCorre } from "@/lib/vem-correr-comigo/analytics";
import type { Cartao, Celebrar, Estado, Grupo, ItemVitrine, ResultadoAcao } from "@/lib/vem-correr-comigo/tipos";
import Acesso from "./Acesso";
import Celebracao from "./Celebracao";
import FormPerfil from "./FormPerfil";
import MeuCorre from "./MeuCorre";
import PlayerSom from "./PlayerSom";
import Vitrine from "./Vitrine";
import { CartaoGrupo } from "./Cartoes";
import { Confirmar, Convites, Destino, Modal, Notificacoes, type Pergunta } from "./Paineis";
import { MENSAGENS, SessaoExpirada, TEXTO_PERFIL, acao, compartilhar, enviarJson, pedir, textoGrupo } from "./api";

/** Sem Realtime: as tabelas são fechadas para o navegador. Atualiza por consulta curta. */
const ATUALIZAR_MS = 20000;

type Alvo = { perfil?: string; grupo?: string };
type DestinoAberto = { perfil?: Cartao; grupo?: Grupo | null; proprio: boolean; podeEntrar: boolean; alvo: Alvo };

export default function App({ logado, destino }: { logado: boolean; destino?: { tipo: "perfil" | "grupo"; codigo: string } }) {
  const [entrou, setEntrou] = useState(logado);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [editando, setEditando] = useState(false);
  const [versao, setVersao] = useState(0);
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [pergunta, setPergunta] = useState<Pergunta | null>(null);
  const [painel, setPainel] = useState<"convites" | "notificacoes" | null>(null);
  const [celebrar, setCelebrar] = useState<Celebrar | null>(null);
  const [aberto, setAberto] = useState<DestinoAberto | null>(null);
  const destinoVisto = useRef(false);
  const celebradas = useRef(new Set<string>());

  const sair = useCallback(() => { setEntrou(false); setEstado(null); }, []);

  const carregar = useCallback(async () => {
    try {
      const r = await pedir<Estado>("/estado");
      if (!r.ok) { setFalhou(true); return null; }
      setFalhou(false);
      setEstado(r);
      return r;
    } catch (e) {
      if (e instanceof SessaoExpirada) sair();
      else setFalhou(true);
      return null;
    }
  }, [sair]);

  useEffect(() => { if (entrou) carregar(); }, [entrou, carregar]);

  useEffect(() => {
    if (!entrou) return;
    const id = setInterval(() => { if (document.visibilityState === "visible") carregar(); }, ATUALIZAR_MS);
    const volta = () => { if (document.visibilityState === "visible") carregar(); };
    document.addEventListener("visibilitychange", volta);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", volta); };
  }, [entrou, carregar]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 4500);
    return () => clearTimeout(t);
  }, [aviso]);

  // Conexão feita por outra pessoa: celebra uma vez e marca como lida, então recarregar não repete.
  useEffect(() => {
    if (!estado?.notificacoes || celebrar) return;
    const nova = estado.notificacoes.find((n) => !n.lida_em && n.dados.celebrar && !celebradas.current.has(n.id));
    if (!nova) return;
    celebradas.current.add(nova.id);
    acao({ tipo: "ler_notificacoes", ids: [nova.id] }).catch(() => {});
    if (estado.grupo && nova.dados.grupo === estado.grupo.codigo) setCelebrar(nova.dados.celebrar!);
    setVersao((v) => v + 1);
  }, [estado, celebrar]);

  // Link compartilhado: depois do login, abre o que a pessoa veio ver.
  useEffect(() => {
    if (!destino || destinoVisto.current || !estado?.perfil) return;
    destinoVisto.current = true;
    pedir<{ ok: boolean; erro?: string; proprio?: boolean; meu?: boolean; perfil?: Cartao; grupo?: Grupo | null }>(
      `/ver?tipo=${destino.tipo}&codigo=${encodeURIComponent(destino.codigo)}`
    )
      .then((r) => {
        if (!r.ok) return setAviso(mensagemDeErro(r.erro));
        setAberto({
          perfil: destino.tipo === "perfil" ? r.perfil : undefined,
          grupo: r.grupo,
          proprio: Boolean(r.proprio || r.meu),
          podeEntrar: !r.proprio && !r.meu && !r.grupo?.info.completo,
          alvo: destino.tipo === "perfil" ? { perfil: destino.codigo } : { grupo: destino.codigo },
        });
      })
      .catch(() => setAviso(MENSAGENS.rede));
  }, [destino, estado]);

  /** O sucesso só aparece com a resposta do banco na mão. */
  async function concluir(r: ResultadoAcao) {
    if (!r.ok) {
      setAviso(mensagemDeErro(r.erro));
    } else if (r.resultado === "convite_enviado") {
      rastrearCorre("invitation_sent");
      setAviso(MENSAGENS.conviteEnviado);
    } else if (r.celebrar) {
      rastrearCorre("group_joined", { tamanho: r.celebrar });
      if (r.celebrar === "quarteto") rastrearCorre("group_completed");
    }
    await carregar();
    setVersao((v) => v + 1);
    if (r.ok && r.celebrar) setCelebrar(r.celebrar);
  }

  async function executar(corpo: Record<string, unknown>) {
    if (ocupado) return;
    setOcupado(true);
    try {
      await concluir(await acao(corpo));
    } catch (e) {
      if (e instanceof SessaoExpirada) sair();
      else setAviso(MENSAGENS.rede);
    } finally {
      setOcupado(false);
      setPergunta(null);
      setAberto(null);
    }
  }

  const interesse = (alvo: Alvo) => executar({ tipo: "interesse", ...alvo });

  function abrirGrupo(g: Grupo, podeEntrar: boolean) {
    setAberto({
      grupo: g,
      proprio: Boolean(estado?.grupo && estado.grupo.codigo === g.codigo),
      podeEntrar,
      alvo: { grupo: g.codigo },
    });
  }

  function quero(it: ItemVitrine) {
    if (it.tipo === "grupo") {
      setPergunta({
        titulo: "Entrar neste grupo?",
        texto: "Você entra na hora e o grupo fica sabendo. Dá para sair quando quiser.",
        botao: "Entrar no grupo",
        onSim: () => interesse({ grupo: it.dados.codigo }),
      });
    } else if (it.acao === "aceitar") {
      interesse({ perfil: it.dados.codigo });
    } else if (it.acao === "convidar") {
      setPergunta({
        titulo: "Quer convidar essa pessoa para descomplicar com você?",
        botao: "Enviar convite",
        onSim: () => interesse({ perfil: it.dados.codigo }),
      });
    } else {
      setPergunta({
        titulo: `Conectar com ${it.dados.nome.split(" ")[0]}?`,
        texto: "Vocês dois aceitam entrada direta, então o grupo se forma na hora. Outras pessoas compatíveis podem entrar depois, até o limite que vocês escolheram.",
        botao: "Quero descomplicar",
        onSim: () => interesse({ perfil: it.dados.codigo }),
      });
    }
  }

  async function responder(id: string, aceitar: boolean) {
    await executar({ tipo: "responder", convite: id, aceitar });
    if (aceitar) rastrearCorre("invitation_accepted");
    setPainel(null);
  }

  async function mostrarCompartilhado(r: "compartilhado" | "copiado" | "erro") {
    if (r === "copiado") setAviso("Link copiado!");
    if (r === "erro") setAviso(MENSAGENS.rede);
  }

  const compartilharGrupo = async () => {
    const g = estado?.grupo;
    if (g) mostrarCompartilhado(await compartilhar({ tipo: "grupo", codigo: g.codigo, texto: textoGrupo(g.info.total, g.info.completo) }));
  };

  async function abrirNotificacoes() {
    setPainel("notificacoes");
    await acao({ tipo: "ler_notificacoes" }).catch(() => {});
  }

  async function sairDaConta() {
    await enviarJson("/sair", {}).catch(() => {});
    sair();
  }

  const novas = estado?.notificacoes?.filter((n) => !n.lida_em).length ?? 0;
  const conexoes = (estado?.conexoes ?? []).filter((g) => g.codigo !== estado?.grupo?.codigo);

  return (
    <div className="cr-root">
      <header className="cr-topo">
        <Link href="/dexcomplica" aria-label="Voltar para o Love Run" className="cr-topo__marcas">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dexcomplica-love-run/marca/somma-preta.svg" alt="Somma Club" />
          <span aria-hidden="true">×</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dexcomplica-love-run/marca/dex-logo.png" alt="Dexcomplica" />
        </Link>
        {entrou && estado?.perfil ? (
          <div className="cr-topo__acoes">
            <button className="cr-sino" onClick={abrirNotificacoes} aria-label={novas ? `${novas} notificações novas` : "Notificações"}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
              {novas > 0 ? <i>{novas}</i> : null}
            </button>
            <button className="cr-link cr-link--claro" onClick={sairDaConta}>Sair</button>
          </div>
        ) : null}
      </header>

      {!entrou ? (
        <Acesso onEntrou={() => setEntrou(true)} compartilhado={Boolean(destino)} />
      ) : !estado ? (
        <div className="cr-carregando" aria-busy="true">
          {falhou ? (
            <>
              <p>{MENSAGENS.rede}</p>
              <button className="lr-btn lr-btn--branco lr-btn--p" onClick={carregar}>Tentar de novo</button>
            </>
          ) : (
            <span className="cr-pulso" aria-label="Carregando" />
          )}
        </div>
      ) : !estado.perfil || estado.perfil.foto == null ? (
        <main className="cr-conteudo cr-conteudo--estreito">
          <FormPerfil
            perfil={estado.perfil}
            inscricao={estado.inscricao}
            onSalvo={() => { setAviso(estado.perfil ? "Foto salva. Agora é só descomplicar." : MENSAGENS.perfilCriado); carregar(); }}
          />
        </main>
      ) : (
        <main className="cr-conteudo">
          <section className="cr-heroi">
            <div>
              <p className="lr-eyebrow lr-eyebrow--claro">Dexcomplica Love Run</p>
              <h1 className="cr-titulo">Vem correr comigo?</h1>
              <p className="cr-lead">Encontre sua companhia, forme seu grupo e venha descomplicar com a gente.</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dexcomplica-love-run/marca/dex-coracao.png" alt="" className="cr-heroi__mascote" />
          </section>

          <MeuCorre
            estado={estado}
            onEditar={() => setEditando(true)}
            onCompartilharPerfil={async () => mostrarCompartilhado(await compartilhar({ tipo: "perfil", codigo: estado.perfil!.codigo, texto: TEXTO_PERFIL }))}
            onCompartilharGrupo={compartilharGrupo}
            onAbrirGrupo={() => estado.grupo && abrirGrupo(estado.grupo, false)}
            onConvites={() => setPainel("convites")}
            onSairDoGrupo={() => setPergunta({
              titulo: "Sair do grupo?",
              texto: "Sua vaga no grupo fica livre e as outras pessoas são avisadas.",
              botao: "Sair do grupo",
              onSim: () => executar({ tipo: "sair_do_grupo" }),
            })}
          />

          <Vitrine
            versao={versao}
            ocupado={ocupado}
            onQuero={quero}
            onAbrirGrupo={(it) => abrirGrupo(it.dados, it.acao === "entrar")}
            onSessao={sair}
          />

          {conexoes.length > 0 ? (
            <section className="cr-sec" aria-labelledby="t-conexoes">
              <h2 id="t-conexoes" className="cr-h2">A galera já está descomplicando!</h2>
              <div className="cr-trilho">
                {conexoes.map((g) => (
                  <CartaoGrupo
                    key={g.codigo}
                    g={g}
                    onAbrir={() => abrirGrupo(g, !estado.grupo && !g.info.completo)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {estado.numeros ? (
            <section className="cr-sec" aria-labelledby="t-numeros">
              <h2 id="t-numeros" className="cr-h2">Nosso corre em números</h2>
              <dl className="cr-numeros">
                {([
                  ["Na comunidade", estado.numeros.comunidade],
                  ["Pessoas conectadas", estado.numeros.conectadas],
                  ["Duplas", estado.numeros.duplas],
                  ["Trios", estado.numeros.trios],
                  ["Quartetos completos", estado.numeros.quartetos],
                ] as const).map(([r, n]) => <div key={r}><dd>{n}</dd><dt>{r}</dt></div>)}
              </dl>
            </section>
          ) : null}
        </main>
      )}

      {editando && estado?.perfil ? (
        <Modal titulo="Meu perfil" onFechar={() => setEditando(false)}>
          <FormPerfil perfil={estado.perfil} onSalvo={() => { setEditando(false); setAviso("Perfil atualizado."); carregar(); setVersao((v) => v + 1); }} onCancelar={() => setEditando(false)} />
        </Modal>
      ) : null}
      {pergunta ? <Confirmar p={pergunta} ocupado={ocupado} onFechar={() => setPergunta(null)} /> : null}
      {painel === "convites" && estado ? (
        <Convites estado={estado} ocupado={ocupado} onResponder={responder} onCancelar={(id) => executar({ tipo: "cancelar", convite: id })} onFechar={() => setPainel(null)} />
      ) : null}
      {painel === "notificacoes" ? <Notificacoes lista={estado?.notificacoes ?? []} onFechar={() => { setPainel(null); carregar(); }} /> : null}
      {aberto ? (
        <Destino
          {...aberto}
          ocupado={ocupado}
          onQuero={() => interesse(aberto.alvo)}
          onFechar={() => setAberto(null)}
          onSessao={sair}
        />
      ) : null}
      {celebrar && estado?.grupo ? (
        <Celebracao
          tipo={celebrar}
          membros={estado.grupo.membros}
          onFechar={() => setCelebrar(null)}
          onVer={() => { setCelebrar(null); document.getElementById("meu-corre")?.scrollIntoView({ behavior: "smooth" }); }}
          onCompartilhar={compartilharGrupo}
        />
      ) : null}
      {aviso ? <div className="cr-aviso-flutuante" role="status">{aviso}</div> : null}
      {entrou && estado?.perfil?.foto != null ? <PlayerSom /> : null}
    </div>
  );
}
