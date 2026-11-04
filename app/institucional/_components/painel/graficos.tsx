"use client";

import { useEffect, useRef, useState } from "react";
import type { Coorte, EventoAgregado, FiltroSexo, PontoTendencia, Retencao } from "../../_data/comunidade";
import { fmtData, fmtDiaMes, fmtInt, fmtMes, fmtPct, pct } from "../../_lib/formato";

/** Largura real do contêiner, para desenhar em pixels (texto nítido). */
export function useLargura<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function ticks(max: number, alvo = 4): number[] {
  if (max <= 0) return [0];
  const bruto = max / alvo;
  const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => p >= bruto) ?? bruto;
  const out = [];
  for (let v = 0; v <= max + passo * 0.001; v += passo) out.push(Math.round(v));
  if (out[out.length - 1] < max) out.push(out[out.length - 1] + passo);
  return out;
}

const fmtEixo = (v: number) => (v >= 10_000 ? `${Math.round(v / 1000)} mil` : fmtInt(v));

interface Dica {
  x: number;
  y: number;
  conteudo: React.ReactNode;
}

function CaixaDica({ dica, largura }: { dica: Dica | null; largura: number }) {
  if (!dica) return null;
  const aDireita = dica.x < largura * 0.62;
  return (
    <div
      className="dica"
      style={{
        left: aDireita ? dica.x + 14 : undefined,
        right: aDireita ? undefined : largura - dica.x + 14,
        top: Math.max(0, dica.y - 12),
      }}
    >
      {dica.conteudo}
    </div>
  );
}

export function Legenda({ itens }: { itens: { cor: string; rotulo: string; forma?: "ponto" | "linha" }[] }) {
  return (
    <div className="pn-legenda">
      {itens.map((i) => (
        <span key={i.rotulo}>
          <i
            style={{
              background: i.cor,
              borderRadius: i.forma === "linha" ? 2 : "50%",
              height: i.forma === "linha" ? 3 : undefined,
              width: i.forma === "linha" ? 14 : undefined,
            }}
          />
          {i.rotulo}
        </span>
      ))}
    </div>
  );
}

/** Participações por evento: colunas empilhadas (estreantes × já vinham). */
export function GraficoEventos({
  eventos,
  sexo,
  vista,
  selecionado,
  aoSelecionar,
  altura = 260,
}: {
  eventos: EventoAgregado[];
  sexo: FiltroSexo;
  vista: "composicao" | "total";
  selecionado: string | null;
  aoSelecionar: (id: string | null) => void;
  altura?: number;
}) {
  const [ref, w] = useLargura<HTMLDivElement>();
  const [dica, setDica] = useState<Dica | null>(null);
  const valores = eventos.map((e) => {
    const total = sexo === "todos" ? e.participacoes : e.porSexo[sexo].participacoes;
    const est = sexo === "todos" ? e.estreantes : e.porSexo[sexo].estreantes;
    return { e, total, est, rec: total - est };
  });
  const max = Math.max(1, ...valores.map((v) => v.total));
  const marcas = ticks(max);
  const topo = marcas[marcas.length - 1];
  const m = { t: 14, r: 8, b: 30, l: 44 };
  const iw = Math.max(0, w - m.l - m.r);
  const ih = altura - m.t - m.b;
  const banda = valores.length ? iw / valores.length : 0;
  const larg = Math.max(2, Math.min(24, banda - 2));
  const y = (v: number) => m.t + ih - (v / topo) * ih;
  const passoRotulo = Math.max(1, Math.ceil(56 / Math.max(1, banda)));

  return (
    <div ref={ref} className="pn-grafico" style={{ height: altura }}>
      {w > 0 && (
        <svg width={w} height={altura} role="img" aria-label="Participações por evento">
          {marcas.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} stroke="var(--linha)" strokeWidth={1} />
              <text x={m.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="pn-eixo">
                {fmtEixo(t)}
              </text>
            </g>
          ))}
          {valores.map((v, i) => {
            const x = m.l + i * banda + (banda - larg) / 2;
            const sel = selecionado === v.e.id;
            const apagado = selecionado != null && !sel;
            const hEst = (v.est / topo) * ih;
            const hRec = (v.rec / topo) * ih;
            const raio = Math.min(4, larg / 2);
            const segs =
              vista === "total"
                ? [{ h: (v.total / topo) * ih, cor: "var(--laranja)", base: 0 }]
                : [
                    { h: hRec, cor: "var(--ponto-medio)", base: 0 },
                    { h: hEst, cor: "var(--laranja)", base: hRec + (hRec > 0 && hEst > 0 ? 2 : 0) },
                  ];
            const ultimo = segs.filter((s) => s.h > 0.5).length - 1;
            return (
              <g key={v.e.id} opacity={apagado ? 0.35 : 1} style={{ transition: "opacity .25s" }}>
                {segs
                  .filter((s) => s.h > 0.5)
                  .map((s, k) => {
                    const yTopo = m.t + ih - s.base - s.h;
                    const arred = k === ultimo ? raio : 0;
                    const h = s.h;
                    return (
                      <path
                        key={k}
                        d={`M${x},${yTopo + h} V${yTopo + arred} Q${x},${yTopo} ${x + arred},${yTopo} H${x + larg - arred} Q${x + larg},${yTopo} ${x + larg},${yTopo + arred} V${yTopo + h} Z`}
                        fill={s.cor}
                      />
                    );
                  })}
                {i % passoRotulo === 0 && (
                  <text x={x + larg / 2} y={altura - 10} textAnchor="middle" className="pn-eixo">
                    {fmtDiaMes(v.e.data)}
                  </text>
                )}
                <rect
                  x={m.l + i * banda}
                  y={m.t}
                  width={banda}
                  height={ih}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onMouseMove={(ev) => {
                    const r = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setDica({
                      x: ev.clientX - r.left,
                      y: ev.clientY - r.top,
                      conteudo: (
                        <>
                          <strong style={{ display: "block", maxWidth: 260, whiteSpace: "normal" }}>{v.e.titulo}</strong>
                          <span style={{ opacity: 0.7 }}>{fmtData(v.e.data)}</span>
                          <br />
                          {fmtInt(v.total)} confirmações
                          <br />
                          <span style={{ color: "#ff6a45" }}>●</span> {fmtInt(v.est)} estreantes ({fmtPct(pct(v.est, v.total), 0)})
                          <br />
                          <span style={{ color: "#9a9a9a" }}>●</span> {fmtInt(v.rec)} já tinham vindo
                        </>
                      ),
                    });
                  }}
                  onMouseLeave={() => setDica(null)}
                  onClick={() => aoSelecionar(sel ? null : v.e.id)}
                  data-interativo
                >
                  <title>{`${v.e.titulo}: ${v.total} confirmações`}</title>
                </rect>
              </g>
            );
          })}
        </svg>
      )}
      <CaixaDica dica={dica} largura={w} />
    </div>
  );
}

/** Retenção em 30, 90 e 180 dias: linha com três pontos, um eixo. */
export function GraficoRetencao({ dados, altura = 200 }: { dados: Retencao[]; altura?: number }) {
  const [ref, w] = useLargura<HTMLDivElement>();
  const validos = dados.filter((d) => d.taxa != null);
  const topo = Math.max(60, Math.ceil(Math.max(0, ...validos.map((d) => d.taxa ?? 0)) / 20) * 20);
  const m = { t: 22, r: 28, b: 30, l: 40 };
  const iw = Math.max(0, w - m.l - m.r);
  const ih = altura - m.t - m.b;
  const x = (d: number) => m.l + (d / 180) * iw;
  const y = (v: number) => m.t + ih - (v / topo) * ih;
  const pontos = [{ dias: 0, taxa: 0 }, ...validos] as { dias: number; taxa: number }[];
  return (
    <div ref={ref} className="pn-grafico" style={{ height: altura }}>
      {w > 0 && (
        <svg width={w} height={altura} role="img" aria-label="Retenção em 30, 90 e 180 dias">
          {[0, topo / 2, topo].map((t) => (
            <g key={t}>
              <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} stroke="var(--linha)" />
              <text x={m.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="pn-eixo">
                {t}%
              </text>
            </g>
          ))}
          <path
            d={pontos.map((p, i) => `${i ? "L" : "M"}${x(p.dias)},${y(p.taxa)}`).join(" ")}
            fill="none"
            stroke="var(--laranja)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {validos.map((d) => (
            <g key={d.dias}>
              <circle cx={x(d.dias)} cy={y(d.taxa ?? 0)} r={5} fill="var(--laranja)" stroke="var(--superficie)" strokeWidth={2} />
              <text x={x(d.dias)} y={y(d.taxa ?? 0) - 12} textAnchor="middle" className="pn-valor">
                {fmtPct(d.taxa)}
              </text>
              <text x={x(d.dias)} y={altura - 10} textAnchor="middle" className="pn-eixo">
                {d.dias} dias
              </text>
              <title>{`Retenção em ${d.dias} dias: ${fmtPct(d.taxa)} de ${fmtInt(d.elegiveis)} pessoas elegíveis`}</title>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

/** Mapa de calor das coortes mensais. */
export function MapaCoortes({ coortes }: { coortes: Coorte[] }) {
  const colunas = Math.max(...coortes.map((c) => c.celulas.length));
  const [foco, setFoco] = useState<string | null>(null);
  return (
    <div className="pn-coortes" role="table" aria-label="Coortes mensais por mês de estreia">
      <div role="row" className="pn-coortes-linha pn-coortes-cab">
        <span role="columnheader">Estreia</span>
        <span role="columnheader">Pessoas</span>
        {Array.from({ length: colunas }, (_, k) => (
          <span key={k} role="columnheader">
            {k === 0 ? "Mês 0" : `+${k}`}
          </span>
        ))}
      </div>
      {coortes.map((c) => (
        <div role="row" key={c.mes} className="pn-coortes-linha">
          <span role="rowheader" style={{ textTransform: "capitalize" }}>
            {fmtMes(c.mes)}
          </span>
          <span className="pn-num">{fmtInt(c.pessoas)}</span>
          {Array.from({ length: colunas }, (_, k) => {
            const v = c.celulas[k];
            if (k >= c.celulas.length) return <span key={k} role="cell" />;
            const intens = v == null ? 0 : k === 0 ? 0.18 : Math.min(1, v / 40);
            const chave = `${c.mes}-${k}`;
            return (
              <span
                key={k}
                role="cell"
                className="pn-celula"
                data-escura={intens > 0.62 ? "true" : "false"}
                style={{
                  background:
                    v == null ? "transparent" : `color-mix(in oklab, var(--laranja) ${Math.round(intens * 100)}%, var(--superficie-2))`,
                  outline: foco === chave ? "2px solid var(--texto-1)" : undefined,
                }}
                onMouseEnter={() => setFoco(chave)}
                onMouseLeave={() => setFoco(null)}
                title={
                  v == null
                    ? "Coorte pequena demais para exibir"
                    : `Estreia em ${fmtMes(c.mes)}: ${fmtPct(v)} voltaram ${k === 0 ? "no próprio mês" : `${k} ${k === 1 ? "mês" : "meses"} depois`}`
                }
              >
                {v == null ? "·" : k === 0 ? "100%" : `${Math.round(v)}%`}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Frequência: quantas pessoas foram a 1, 2, 3… eventos. */
export function GraficoFrequencia({ dados, altura = 200 }: { dados: { rotulo: string; pessoas: number }[]; altura?: number }) {
  const [ref, w] = useLargura<HTMLDivElement>();
  const total = dados.reduce((s, d) => s + d.pessoas, 0) || 1;
  const max = Math.max(1, ...dados.map((d) => d.pessoas));
  const m = { t: 34, r: 4, b: 30, l: 4 };
  const iw = Math.max(0, w - m.l - m.r);
  const ih = altura - m.t - m.b;
  const banda = iw / dados.length;
  const larg = Math.min(24, banda * 0.6);
  return (
    <div ref={ref} className="pn-grafico" style={{ height: altura }}>
      {w > 0 && (
        <svg width={w} height={altura} role="img" aria-label="Distribuição de frequência">
          <line x1={m.l} x2={w - m.r} y1={m.t + ih} y2={m.t + ih} stroke="var(--linha)" />
          {dados.map((d, i) => {
            const h = Math.max(d.pessoas ? 2 : 0, (d.pessoas / max) * ih);
            const x = m.l + i * banda + (banda - larg) / 2;
            const yTopo = m.t + ih - h;
            const r = Math.min(4, h, larg / 2);
            return (
              <g key={d.rotulo}>
                <path
                  d={`M${x},${m.t + ih} V${yTopo + r} Q${x},${yTopo} ${x + r},${yTopo} H${x + larg - r} Q${x + larg},${yTopo} ${x + larg},${yTopo + r} V${m.t + ih} Z`}
                  fill={i === 0 ? "var(--ponto-medio)" : "var(--laranja)"}
                />
                <text x={x + larg / 2} y={yTopo - 18} textAnchor="middle" className="pn-valor">
                  {fmtInt(d.pessoas)}
                </text>
                <text x={x + larg / 2} y={yTopo - 5} textAnchor="middle" className="pn-eixo">
                  {fmtPct(pct(d.pessoas, total), 0)}
                </text>
                <text x={x + larg / 2} y={altura - 10} textAnchor="middle" className="pn-eixo">
                  {d.rotulo}
                </text>
                <title>{`${d.rotulo} ${d.rotulo === "1" ? "evento" : "eventos"}: ${fmtInt(d.pessoas)} pessoas`}</title>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/** Tendência mensal: pessoas únicas e estreantes por mês (mesma unidade, um eixo). */
export function GraficoTendencia({ dados, altura = 220 }: { dados: PontoTendencia[]; altura?: number }) {
  const [ref, w] = useLargura<HTMLDivElement>();
  const [foco, setFoco] = useState<number | null>(null);
  const max = Math.max(1, ...dados.map((d) => d.pessoas));
  const marcas = ticks(max);
  const topo = marcas[marcas.length - 1];
  const m = { t: 16, r: 16, b: 30, l: 44 };
  const iw = Math.max(0, w - m.l - m.r);
  const ih = altura - m.t - m.b;
  const x = (i: number) => m.l + (dados.length > 1 ? (i / (dados.length - 1)) * iw : iw / 2);
  const y = (v: number) => m.t + ih - (v / topo) * ih;
  const linha = (k: "pessoas" | "estreantes") => dados.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[k])}`).join(" ");
  const ultimo = dados.length - 1;
  return (
    <div ref={ref} className="pn-grafico" style={{ height: altura }}>
      {w > 0 && (
        <svg
          width={w}
          height={altura}
          role="img"
          aria-label="Pessoas únicas e estreantes por mês"
          onMouseMove={(ev) => {
            const r = ev.currentTarget.getBoundingClientRect();
            const px = ev.clientX - r.left;
            const i = Math.round(((px - m.l) / Math.max(1, iw)) * (dados.length - 1));
            setFoco(Math.max(0, Math.min(ultimo, i)));
          }}
          onMouseLeave={() => setFoco(null)}
          data-interativo
        >
          {marcas.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} stroke="var(--linha)" />
              <text x={m.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="pn-eixo">
                {fmtEixo(t)}
              </text>
            </g>
          ))}
          {dados.map((d, i) => (
            <text key={d.mes} x={x(i)} y={altura - 10} textAnchor="middle" className="pn-eixo">
              {fmtMes(d.mes)}
            </text>
          ))}
          {foco != null && <line x1={x(foco)} x2={x(foco)} y1={m.t} y2={m.t + ih} stroke="var(--texto-3)" />}
          <path d={linha("pessoas")} fill="none" stroke="var(--laranja)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <path d={linha("estreantes")} fill="none" stroke="var(--ponto-medio)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {(["pessoas", "estreantes"] as const).map((k) => {
            const i = foco ?? ultimo;
            return (
              <circle
                key={k}
                cx={x(i)}
                cy={y(dados[i][k])}
                r={4.5}
                fill={k === "pessoas" ? "var(--laranja)" : "var(--ponto-medio)"}
                stroke="var(--superficie)"
                strokeWidth={2}
              />
            );
          })}
        </svg>
      )}
      {foco != null && w > 0 && (
        <CaixaDica
          largura={w}
          dica={{
            x: x(foco),
            y: y(dados[foco].pessoas),
            conteudo: (
              <>
                <strong style={{ textTransform: "capitalize" }}>{fmtMes(dados[foco].mes)}</strong>
                <br />
                <span style={{ color: "#ff6a45" }}>●</span> {fmtInt(dados[foco].pessoas)} pessoas únicas
                <br />
                <span style={{ color: "#9a9a9a" }}>●</span> {fmtInt(dados[foco].estreantes)} estreantes
                <br />
                {fmtInt(dados[foco].participacoes)} confirmações
              </>
            ),
          }}
        />
      )}
    </div>
  );
}

/** Barras horizontais simples (idade, perfil). Uma série; destaque por índice. */
export function BarrasHorizontais({
  dados,
  destaque = [],
  sufixo = "%",
}: {
  dados: { rotulo: string; valor: number | null; detalhe?: string }[];
  destaque?: string[];
  sufixo?: string;
}) {
  const max = Math.max(1, ...dados.map((d) => d.valor ?? 0));
  return (
    <div className="pn-barras">
      {dados.map((d) => (
        <div key={d.rotulo} className="pn-barra-linha" title={d.detalhe}>
          <span className="pn-barra-rotulo">{d.rotulo}</span>
          <span className="pn-barra-trilho">
            <span
              className="pn-barra"
              style={{
                width: `${((d.valor ?? 0) / max) * 100}%`,
                background: destaque.includes(d.rotulo) ? "var(--laranja)" : "var(--ponto-medio)",
              }}
            />
          </span>
          <span className="pn-barra-valor">
            {d.valor == null ? "<5" : sufixo === "%" ? fmtPct(d.valor) : fmtInt(d.valor)}
          </span>
        </div>
      ))}
    </div>
  );
}
