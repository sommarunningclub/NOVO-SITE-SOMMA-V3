"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { DISTANCIAS, DISTANCIAS_BASE, type DistanciaBase } from "@/lib/evp/config";
import { dataHora } from "@/lib/evp/formato";
import type { Coordenada } from "@/lib/evp/tipos";
import { Carregando, Campo, Mensagem, useApi, useSecao, type Aviso, type EventoAdmin, type PercursoAdmin, type RelatorioPercurso } from "./api";

const km = (m: number | undefined) => (typeof m === "number" ? `${(m / 1000).toFixed(2).replace(".", ",")} km` : "–");

/** Traçado do arquivo em SVG: projeção equirretangular, sem mapa de fundo. */
function Previa({ coordenadas, nome }: { coordenadas: Coordenada[]; nome: string }) {
  const d = useMemo(() => {
    if (coordenadas.length < 2) return null;
    const lats = coordenadas.map((c) => c[1]);
    const lngs = coordenadas.map((c) => c[0]);
    const latMin = Math.min(...lats), latMax = Math.max(...lats), lngMin = Math.min(...lngs), lngMax = Math.max(...lngs);
    const cos = Math.cos((((latMin + latMax) / 2) * Math.PI) / 180);
    const larg = Math.max((lngMax - lngMin) * cos, 1e-9);
    const alt = Math.max(latMax - latMin, 1e-9);
    const W = 600, H = 360, M = 24;
    const escala = Math.min((W - 2 * M) / larg, (H - 2 * M) / alt);
    const ox = (W - larg * escala) / 2, oy = (H - alt * escala) / 2;
    const p = ([lng, lat]: Coordenada) => [ox + (lng - lngMin) * cos * escala, oy + (latMax - lat) * escala] as const;
    const pontos = coordenadas.map(p);
    return {
      caminho: pontos.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" "),
      inicio: pontos[0],
      fim: pontos[pontos.length - 1],
    };
  }, [coordenadas]);
  if (!d) return null;
  return (
    <figure>
      <svg viewBox="0 0 600 360" role="img" aria-label={`Traçado do arquivo de ${nome}`} className="w-full rounded-xl" style={{ background: "var(--mt-grafite)" }}>
        <path d={d.caminho} fill="none" stroke="var(--mt-laranja)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={d.fim[0]} cy={d.fim[1]} r="7" fill="var(--mt-preto)" stroke="#fff" strokeWidth="2" />
        <circle cx={d.inicio[0]} cy={d.inicio[1]} r="7" fill="#fff" />
      </svg>
      <figcaption className="mt-2 text-xs" style={{ color: "var(--mt-cinza)" }}>
        Pré-visualização do arquivo, sem mapa de fundo. Ponto branco: primeiro ponto do arquivo. Ponto escuro: último.
      </figcaption>
    </figure>
  );
}

function Relatorio({ r }: { r: RelatorioPercurso }) {
  const dif = r.diferenca_pct;
  return (
    <div>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><dt className="mt-rotulo">Medido</dt><dd className="mt-1">{km(r.comprimento_m)}</dd></div>
        <div><dt className="mt-rotulo">Oficial</dt><dd className="mt-1">{km(r.oficial_m)}</dd></div>
        <div><dt className="mt-rotulo">Diferença</dt><dd className="mt-1">{typeof dif === "number" ? `${dif > 0 ? "+" : ""}${String(dif).replace(".", ",")}%` : "–"}</dd></div>
        <div><dt className="mt-rotulo">Pontos</dt><dd className="mt-1">{r.pontos ?? "–"}{r.pontos_no_arquivo ? ` (de ${r.pontos_no_arquivo})` : ""}</dd></div>
      </dl>
      {r.avisos?.length ? (
        <ul className="mt-3 grid gap-2 text-sm">
          {r.avisos.map((a, i) => (
            <li key={i} className="rounded-lg p-3" style={{ background: "rgba(255,196,0,0.1)", color: "#ffd75e" }}>{a}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm" style={{ color: "var(--mt-verde)" }}>Nenhum aviso na leitura do arquivo.</p>
      )}
    </div>
  );
}

function Cartao({ distancia, percurso, recarregar }: { distancia: DistanciaBase; percurso: PercursoAdmin | undefined; recarregar: () => void }) {
  const api = useApi();
  const info = DISTANCIAS[distancia];
  const arquivo = useRef<HTMLInputElement>(null);
  const [fonte, setFonte] = useState("");
  const [conferido, setConferido] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [ocupado, setOcupado] = useState("");

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const f = arquivo.current?.files?.[0];
    if (!f) return setAviso({ tipo: "erro", texto: "Escolha o arquivo do percurso." });
    if (!fonte.trim()) return setAviso({ tipo: "erro", texto: "Informe a origem do arquivo." });
    const corpo = new FormData();
    corpo.set("distancia", distancia);
    corpo.set("arquivo", f);
    corpo.set("fonte", fonte.trim());
    setOcupado("enviar");
    setAviso(null);
    const r = await api("/api/evp/admin/percurso", { method: "POST", body: corpo });
    setOcupado("");
    if (!r.ok) return setAviso({ tipo: "erro", texto: r.erro });
    setAviso({ tipo: "ok", texto: "Arquivo lido e guardado em validação. Confira o traçado antes de publicar." });
    setConferido(false);
    setFonte("");
    if (arquivo.current) arquivo.current.value = "";
    recarregar();
  }

  async function acao(nome: "publicar" | "despublicar" | "remover") {
    if (nome === "remover" && !window.confirm(`Remover o percurso de ${info.oficial}? A página volta a mostrar só o mapa oficial em PDF.`)) return;
    setOcupado(nome);
    setAviso(null);
    const r = await api("/api/evp/admin/percurso", { method: "PATCH", body: JSON.stringify({ distancia, acao: nome, conferido: nome === "publicar" ? conferido : undefined }) });
    setOcupado("");
    if (!r.ok) return setAviso({ tipo: "erro", texto: r.erro });
    setAviso({ tipo: "ok", texto: nome === "publicar" ? "Percurso publicado na página." : nome === "despublicar" ? "Percurso retirado da página. Voltou para validação." : "Percurso removido." });
    setConferido(false);
    recarregar();
  }

  const selo = !percurso
    ? { classe: "mt-selo mt-selo--fora", texto: "Sem arquivo" }
    : percurso.status === "publicado"
      ? { classe: "mt-selo mt-selo--ok", texto: "Publicado" }
      : { classe: "mt-selo mt-selo--espera", texto: "Em validação" };
  const idConf = `conferido-${distancia}`;

  return (
    <section className="mt-cartao p-5 sm:p-6" aria-labelledby={`percurso-${distancia}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={`percurso-${distancia}`} className="text-xl font-bold">{info.oficial}</h3>
        <span className={selo.classe}>{selo.texto}</span>
      </div>
      <a href={info.mapaOficial} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center underline underline-offset-4" style={{ minHeight: 44 }}>
        Abrir o mapa oficial em PDF
      </a>

      {percurso ? (
        <div className="mt-4 grid gap-4">
          <p className="break-words text-sm" style={{ color: "var(--mt-cinza)" }}>
            Arquivo {percurso.arquivo_nome ?? "sem nome"} ({(percurso.formato ?? "").toUpperCase()}), enviado em {dataHora(percurso.enviado_em)}.
            {percurso.fonte ? ` Origem: ${percurso.fonte}.` : ""}
            {percurso.publicado_em ? ` Publicado em ${dataHora(percurso.publicado_em)}.` : ""}
          </p>
          <Previa coordenadas={percurso.coordenadas} nome={info.oficial} />
          <Relatorio r={percurso.relatorio} />
          {percurso.status === "em_validacao" ? (
            <div className="grid gap-3">
              <label className="mt-check" htmlFor={idConf}>
                <input id={idConf} type="checkbox" checked={conferido} onChange={(e) => setConferido(e.target.checked)} />
                <span>Conferi este traçado com o mapa oficial da organização</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="mt-botao mt-botao--cheio mt-botao--pequeno" disabled={!conferido || ocupado !== ""} onClick={() => void acao("publicar")}>
                  {ocupado === "publicar" ? "Publicando..." : "Publicar na página"}
                </button>
                <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno" disabled={ocupado !== ""} onClick={() => void acao("remover")}>Remover</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno" disabled={ocupado !== ""} onClick={() => void acao("despublicar")}>
                {ocupado === "despublicar" ? "Retirando..." : "Retirar da página"}
              </button>
              <button type="button" className="mt-botao mt-botao--linha mt-botao--pequeno" disabled={ocupado !== ""} onClick={() => void acao("remover")}>Remover</button>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm" style={{ color: "var(--mt-cinza)" }}>
          Sem arquivo, a página mostra o estado “percurso em preparação” com o link do mapa oficial.
        </p>
      )}

      <form onSubmit={enviar} className="mt-5 grid gap-3 border-t pt-5" style={{ borderColor: "var(--mt-linha)" }}>
        <p className="mt-rotulo">{percurso ? "Substituir o arquivo" : "Enviar arquivo"}</p>
        <Campo rotulo="Arquivo GPX, KML ou GeoJSON (até 8 MB)">
          <input ref={arquivo} className="mt-input" type="file" accept=".gpx,.kml,.geojson,.json,application/gpx+xml,application/vnd.google-earth.kml+xml,application/geo+json,application/json" />
        </Campo>
        <Campo rotulo="Origem do arquivo" dica="Quem enviou e quando. Exemplo: enviado pela organização da prova em 12/11/2026.">
          <input className="mt-input" value={fonte} maxLength={200} onChange={(e) => setFonte(e.target.value)} />
        </Campo>
        <div>
          <button type="submit" className="mt-botao mt-botao--linha mt-botao--pequeno" disabled={ocupado !== ""}>
            {ocupado === "enviar" ? "Lendo o arquivo..." : "Enviar para validação"}
          </button>
        </div>
      </form>
      <Mensagem aviso={aviso} />
    </section>
  );
}

export function AbaPercursos() {
  const { dados, erro, carregando, recarregar } = useSecao<EventoAdmin>("evento");
  if (!dados) return <Carregando erro={erro} carregando={carregando} tentar={recarregar} />;
  return (
    <div className="grid gap-5">
      <div className="mt-cartao p-5 text-sm" style={{ borderColor: "var(--mt-laranja)" }}>
        <p className="font-bold">Regra dos percursos</p>
        <ul className="mt-2 grid list-disc gap-1 pl-5" style={{ color: "#d4d4d4" }}>
          <li>Só entra arquivo georreferenciado oficial (GPX, KML ou GeoJSON), vindo da organização da prova.</li>
          <li>Não desenhe um traçado por cima do PDF nem de uma imagem do mapa.</li>
          <li>Não use rota calculada pelo Google: ela não é o percurso da prova.</li>
          <li>Todo arquivo entra em validação. Só vai para a página depois que alguém compara com o mapa oficial e publica.</li>
        </ul>
      </div>
      {DISTANCIAS_BASE.map((d) => (
        <Cartao key={d} distancia={d} percurso={dados.percursos.find((p) => p.distancia === d)} recarregar={() => void recarregar()} />
      ))}
    </div>
  );
}
