"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { rastrearCorre } from "@/lib/vem-correr-comigo/analytics";
import type { ItemVitrine } from "@/lib/vem-correr-comigo/tipos";
import { CartaoGrupo, CartaoPessoa } from "./Cartoes";
import { MENSAGENS, SessaoExpirada, pedir } from "./api";

type Filtros = { pelotao: string; tamanho: string; com_vagas: boolean; busca: string };
const VAZIO: Filtros = { pelotao: "", tamanho: "", com_vagas: false, busca: "" };
const KM = [["4km", "4 km"], ["6km", "6 km"], ["8km", "8 km"]];
const TAM = [["2", "Duplas"], ["3", "Trios"], ["4", "Quartetos"]];

type Props = {
  versao: number;
  ocupado: boolean;
  onQuero: (item: ItemVitrine) => void;
  onSessao: () => void;
};

export default function Vitrine({ versao, ocupado, onQuero, onSessao }: Props) {
  const [f, setF] = useState<Filtros>(VAZIO);
  const [busca, setBusca] = useState("");
  const [itens, setItens] = useState<ItemVitrine[]>([]);
  const [total, setTotal] = useState(0);
  const [estado, setEstado] = useState<"carregando" | "ok" | "erro">("carregando");
  const [maisCarregando, setMais] = useState(false);
  const pedido = useRef(0);

  const consulta = useCallback((offset: number) => {
    const q = new URLSearchParams({ offset: String(offset) });
    if (f.pelotao) q.set("pelotao", f.pelotao);
    if (f.tamanho) q.set("tamanho", f.tamanho);
    if (f.com_vagas) q.set("com_vagas", "1");
    if (f.busca) q.set("busca", f.busca);
    return pedir<{ ok: boolean; itens: ItemVitrine[]; total: number }>(`/vitrine?${q}`);
  }, [f]);

  useEffect(() => {
    const id = ++pedido.current;
    consulta(0)
      .then((r) => {
        if (id !== pedido.current) return;
        if (!r.ok) return setEstado("erro");
        setItens(r.itens);
        setTotal(r.total);
        setEstado("ok");
      })
      .catch((e) => {
        if (e instanceof SessaoExpirada) onSessao();
        else if (id === pedido.current) setEstado("erro");
      });
  }, [consulta, versao, onSessao]);

  useEffect(() => { rastrearCorre("directory_viewed"); }, []);

  useEffect(() => {
    const t = setTimeout(() => setF((v) => (v.busca === busca ? v : { ...v, busca })), 300);
    return () => clearTimeout(t);
  }, [busca]);

  const alternar = (campo: "pelotao" | "tamanho", valor: string) => {
    rastrearCorre("filter_used", { filtro: campo, valor });
    setF((v) => ({ ...v, [campo]: v[campo] === valor ? "" : valor }));
  };

  async function verMais() {
    setMais(true);
    try {
      const r = await consulta(itens.length);
      if (r.ok) {
        setItens((a) => [...a, ...r.itens]);
        setTotal(r.total);
      }
    } catch (e) {
      if (e instanceof SessaoExpirada) onSessao();
    } finally {
      setMais(false);
    }
  }

  const semFiltro = !f.pelotao && !f.tamanho && !f.com_vagas && !f.busca;

  return (
    <section className="cr-sec" id="vitrine" aria-labelledby="t-vitrine">
      <h2 id="t-vitrine" className="cr-h2">Quem vai descomplicar com você?</h2>
      <div className="cr-filtros" role="group" aria-label="Filtros">
        <button className={`cr-chip${semFiltro ? " is-on" : ""}`} onClick={() => { setF(VAZIO); setBusca(""); }}>Todos</button>
        {KM.map(([v, r]) => <button key={v} className={`cr-chip${f.pelotao === v ? " is-on" : ""}`} aria-pressed={f.pelotao === v} onClick={() => alternar("pelotao", v)}>{r}</button>)}
        {TAM.map(([v, r]) => <button key={v} className={`cr-chip${f.tamanho === v ? " is-on" : ""}`} aria-pressed={f.tamanho === v} onClick={() => alternar("tamanho", v)}>{r}</button>)}
        <button className={`cr-chip${f.com_vagas ? " is-on" : ""}`} aria-pressed={f.com_vagas} onClick={() => { rastrearCorre("filter_used", { filtro: "com_vagas" }); setF((v) => ({ ...v, com_vagas: !v.com_vagas })); }}>Com vagas</button>
      </div>
      <input className="cr-input cr-busca" type="search" placeholder="Buscar por nome" aria-label="Buscar por nome" value={busca} onChange={(e) => setBusca(e.target.value)} />

      {estado === "carregando" ? (
        <div className="cr-grade" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="cr-card cr-card--esqueleto" />)}</div>
      ) : estado === "erro" ? (
        <p className="cr-vazio">{MENSAGENS.rede}</p>
      ) : itens.length === 0 ? (
        <p className="cr-vazio">{MENSAGENS.semResultado}</p>
      ) : (
        <>
          <div className="cr-grade">
            {itens.map((it) =>
              it.tipo === "pessoa" ? (
                <CartaoPessoa key={`p${it.dados.codigo}`} p={it.dados} acao={it.acao} ocupado={ocupado} onQuero={() => onQuero(it)} />
              ) : (
                <CartaoGrupo key={`g${it.dados.codigo}`} g={it.dados} acao={it.acao} ocupado={ocupado} onQuero={() => onQuero(it)} />
              )
            )}
          </div>
          {itens.length < total ? (
            <button className="lr-btn lr-btn--branco lr-btn--p cr-mais" onClick={verMais} disabled={maisCarregando}>
              {maisCarregando ? "Carregando…" : "Ver mais"}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
