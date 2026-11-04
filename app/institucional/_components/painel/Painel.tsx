"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Info, X } from "lucide-react";
import {
  COMUNIDADE,
  resumo,
  type EventoAgregado,
  type FiltroFormato,
  type FiltroSexo,
  type Janela,
} from "../../_data/comunidade";
import { fmtData, fmtDec, fmtInt, fmtPct, pct } from "../../_lib/formato";
import {
  BarrasHorizontais,
  GraficoEventos,
  GraficoFrequencia,
  GraficoRetencao,
  GraficoTendencia,
  Legenda,
  MapaCoortes,
} from "./graficos";

type Periodo = Janela | "personalizado";

const PERIODOS: { id: Periodo; rotulo: string; dias: number | null }[] = [
  { id: "30d", rotulo: "30 dias", dias: 30 },
  { id: "90d", rotulo: "90 dias", dias: 90 },
  { id: "180d", rotulo: "180 dias", dias: 180 },
  { id: "tudo", rotulo: "Todo o histórico", dias: null },
  { id: "personalizado", rotulo: "Personalizado", dias: null },
];

const SEXOS: { id: FiltroSexo; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "F", rotulo: "Mulheres" },
  { id: "M", rotulo: "Homens" },
];

const FORMATOS: { id: FiltroFormato; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos os formatos" },
  { id: "sabado", rotulo: "Sábados" },
  { id: "especial", rotulo: "Outros dias e formatos" },
];

const DIA = 86_400_000;
const ms = (d: string) => Date.parse(`${d}T12:00:00Z`);

export interface EstadoPainel {
  periodo: Periodo;
  de: string;
  ate: string;
  sexo: FiltroSexo;
  formato: FiltroFormato;
  vista: "composicao" | "total";
  evento: string | null;
}

export function estadoInicial(): EstadoPainel {
  return {
    periodo: "180d",
    de: COMUNIDADE.historico.inicio,
    ate: COMUNIDADE.historico.corte,
    sexo: "todos",
    formato: "todos",
    vista: "composicao",
    evento: null,
  };
}

/** Eventos do recorte (período + formato). */
export function eventosDoRecorte(e: EstadoPainel): EventoAgregado[] {
  const { corte } = COMUNIDADE.historico;
  const p = PERIODOS.find((x) => x.id === e.periodo);
  return COMUNIDADE.eventos.filter((ev) => {
    if (e.formato !== "todos" && ev.categoria !== e.formato) return false;
    if (e.periodo === "personalizado") return ev.data >= e.de && ev.data <= e.ate;
    if (p?.dias == null) return true;
    return ms(ev.data) >= ms(corte) - (p.dias - 1) * DIA;
  });
}

export interface Kpis {
  eventos: number;
  participacoes: number;
  pessoas: number | null;
  mediaPorEvento: number;
  estreantes: number;
  recorrentes: number | null;
  taxaRecorrencia: number | null;
  mediaEventosPorPessoa: number | null;
}

/** KPIs do recorte. No personalizado, só o que é somável por evento. */
export function kpisDoRecorte(e: EstadoPainel, evs: EventoAgregado[]): Kpis {
  if (e.periodo !== "personalizado") {
    const r = resumo(e.periodo, e.sexo, e.formato);
    return {
      eventos: r.eventos,
      participacoes: r.participacoes,
      pessoas: r.pessoas,
      mediaPorEvento: r.mediaPorEvento,
      estreantes: r.estreantes,
      recorrentes: r.recorrentes,
      taxaRecorrencia: r.taxaRecorrencia,
      mediaEventosPorPessoa: r.mediaEventosPorPessoa,
    };
  }
  const part = evs.reduce((s, ev) => s + (e.sexo === "todos" ? ev.participacoes : ev.porSexo[e.sexo].participacoes), 0);
  const est = evs.reduce((s, ev) => s + (e.sexo === "todos" ? ev.estreantes : ev.porSexo[e.sexo].estreantes), 0);
  return {
    eventos: evs.length,
    participacoes: part,
    pessoas: null,
    mediaPorEvento: evs.length ? Math.round(part / evs.length) : 0,
    estreantes: est,
    recorrentes: null,
    taxaRecorrencia: null,
    mediaEventosPorPessoa: null,
  };
}

function Kpi({ valor, rotulo, nota, destaque }: { valor: string; rotulo: string; nota?: string; destaque?: boolean }) {
  return (
    <div className="pn-kpi" data-destaque={destaque ? "true" : undefined}>
      <span className="pn-kpi-valor">{valor}</span>
      <span className="pn-kpi-rotulo">{rotulo}</span>
      {nota && <span className="pn-kpi-nota">{nota}</span>}
    </div>
  );
}

export function LinhaKpis({ k, compacto = false }: { k: Kpis; compacto?: boolean }) {
  const so = "só nos períodos padrão";
  const itens = [
    { valor: k.pessoas == null ? "—" : fmtInt(k.pessoas), rotulo: "Pessoas únicas", nota: k.pessoas == null ? so : undefined, destaque: true },
    { valor: fmtInt(k.participacoes), rotulo: "Confirmações" },
    { valor: fmtInt(k.eventos), rotulo: "Eventos" },
    { valor: fmtInt(k.mediaPorEvento), rotulo: "Média por evento" },
    { valor: fmtInt(k.estreantes), rotulo: "Estreantes" },
    {
      valor: k.taxaRecorrencia == null ? "—" : fmtPct(k.taxaRecorrencia),
      rotulo: "Foram a 2+ eventos",
      nota: k.recorrentes == null ? so : `${fmtInt(k.recorrentes)} pessoas`,
    },
    {
      valor: k.mediaEventosPorPessoa == null ? "—" : fmtDec(k.mediaEventosPorPessoa, 2),
      rotulo: "Eventos por pessoa",
      nota: k.mediaEventosPorPessoa == null ? so : undefined,
    },
  ];
  return (
    <div className="pn-kpis" data-compacto={compacto ? "true" : undefined}>
      {(compacto ? itens.slice(0, 5) : itens).map((i) => (
        <Kpi key={i.rotulo} {...i} />
      ))}
    </div>
  );
}

export function DetalheEvento({ ev, sexo, aoFechar }: { ev: EventoAgregado; sexo: FiltroSexo; aoFechar: () => void }) {
  const total = sexo === "todos" ? ev.participacoes : ev.porSexo[sexo].participacoes;
  const est = sexo === "todos" ? ev.estreantes : ev.porSexo[sexo].estreantes;
  const conhecidos = ev.porSexo.F.participacoes + ev.porSexo.M.participacoes;
  const min = COMUNIDADE.privacidade.minimoCelula;
  const mostra = (n: number) => (n < min ? `menos de ${min}` : fmtInt(n));
  return (
    <div className="pn-detalhe">
      <div className="pn-detalhe-topo">
        <div>
          <span className="pn-rotulo">
            {fmtData(ev.data)} · {ev.categoria === "sabado" ? "Sábado" : "Outro dia ou formato"}
          </span>
          <strong>{ev.titulo}</strong>
        </div>
        <button type="button" onClick={aoFechar} aria-label="Fechar detalhe do evento" className="pn-icone">
          <X size={16} />
        </button>
      </div>
      <div className="pn-detalhe-grade">
        <div>
          <span className="pn-detalhe-num">{fmtInt(total)}</span>
          <span className="pn-rotulo">confirmações{sexo !== "todos" ? (sexo === "F" ? " · mulheres" : " · homens") : ""}</span>
        </div>
        <div>
          <span className="pn-detalhe-num">{fmtPct(pct(est, total), 0)}</span>
          <span className="pn-rotulo">estreantes ({mostra(est)})</span>
        </div>
        <div>
          <span className="pn-detalhe-num">{ev.voltaramDepois == null ? "—" : fmtPct(ev.voltaramDepois, 0)}</span>
          <span className="pn-rotulo">
            {ev.voltaramDepois == null ? "ainda sem eventos depois deste" : `voltaram em algum dos ${ev.eventosDepois} eventos seguintes`}
          </span>
        </div>
        <div>
          <span className="pn-detalhe-num">{conhecidos ? fmtPct(pct(ev.porSexo.F.participacoes, conhecidos), 0) : "—"}</span>
          <span className="pn-rotulo">mulheres, entre quem informou o sexo</span>
        </div>
      </div>
    </div>
  );
}

export function SeloFonte() {
  const real = COMUNIDADE.fonte === "real";
  return (
    <div className="pn-selos">
      <span className="pn-selo" data-tipo={real ? "real" : "demo"}>
        {real ? "Dados reais · agregados" : "Dados demonstrativos"}
      </span>
      <span className="pn-selo">
        Histórico: {fmtData(COMUNIDADE.historico.inicio)} a {fmtData(COMUNIDADE.historico.corte)}
      </span>
      <span className="pn-selo">Atualizado em {fmtData(COMUNIDADE.geradoEm)}</span>
    </div>
  );
}

function Segmentos<T extends string>({
  opcoes,
  valor,
  aoMudar,
  rotulo,
}: {
  opcoes: { id: T; rotulo: string }[];
  valor: T;
  aoMudar: (v: T) => void;
  rotulo: string;
}) {
  return (
    <div className="segmentos" role="group" aria-label={rotulo}>
      {opcoes.map((o) => (
        <button key={o.id} type="button" aria-pressed={valor === o.id} onClick={() => aoMudar(o.id)}>
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

function Cartao({ titulo, sub, children, largo }: { titulo: string; sub?: string; children: React.ReactNode; largo?: boolean }) {
  return (
    <section className="pn-cartao" data-largo={largo ? "true" : undefined}>
      <header>
        <h3>{titulo}</h3>
        {sub && <p>{sub}</p>}
      </header>
      {children}
    </section>
  );
}

const DEFINICOES: { termo: string; texto: string }[] = [
  {
    termo: "Confirmação",
    texto:
      "Uma pessoa (CPF) confirmada em um evento pelo site ou app de check-in da SOMMA. Confirmações repetidas da mesma pessoa no mesmo evento contam uma vez. É confirmação de presença, não contagem auditada na porta.",
  },
  { termo: "Pessoas únicas", texto: "CPFs distintos com ao menos uma confirmação no recorte." },
  {
    termo: "Estreante",
    texto: "Pessoa cuja primeira confirmação registrada caiu no recorte. Somável por evento: cada pessoa estreia uma vez só.",
  },
  { termo: "Foram a 2+ eventos", texto: "Pessoas com confirmação em pelo menos dois eventos distintos no recorte, sobre o total de pessoas únicas." },
  { termo: "Média por evento", texto: "Confirmações divididas pelo número de eventos do recorte." },
  {
    termo: "Retenção em N dias",
    texto:
      "Entre quem estreou há pelo menos N dias da data de corte, a parcela que voltou a algum evento em até N dias depois da estreia. Quem estreou há menos tempo fica fora da conta, para não puxar a taxa para baixo.",
  },
  {
    termo: "Coorte",
    texto: "Pessoas agrupadas pelo mês da estreia. Cada célula mostra a parcela da coorte com confirmação naquele mês.",
  },
  { termo: "Voltaram depois", texto: "Parcela das pessoas de um evento que confirmou presença em algum evento posterior." },
];

export function Painel({
  aoVoltar,
  rotuloVoltar = "Voltar à apresentação",
}: {
  aoVoltar?: () => void;
  rotuloVoltar?: string;
}) {
  const [e, setE] = useState<EstadoPainel>(estadoInicial);
  const set = <K extends keyof EstadoPainel>(k: K, v: EstadoPainel[K]) => setE((s) => ({ ...s, [k]: v }));
  const evs = useMemo(() => eventosDoRecorte(e), [e]);
  const k = useMemo(() => kpisDoRecorte(e, evs), [e, evs]);
  const evSel = e.evento ? COMUNIDADE.eventos.find((x) => x.id === e.evento) ?? null : null;
  const personalizado = e.periodo === "personalizado";
  const r = e.periodo === "personalizado" ? null : resumo(e.periodo, e.sexo, e.formato);
  const hist = COMUNIDADE.porSexo[e.sexo];
  const q = COMUNIDADE.qualidade;

  const idadeTotal = r ? r.idade.faixas.reduce((s, f) => s + (f.pessoas ?? 0), 0) : 0;
  const sexoConhecido = r ? (r.sexo.F ?? 0) + (r.sexo.M ?? 0) : 0;

  return (
    <div className="pn tema-escuro">
      <div className="pn-cabecalho">
        <div className="pn-wrap pn-cab-linha">
          <div className="pn-titulo">
            {aoVoltar && (
              <button type="button" className="botao" onClick={aoVoltar}>
                <ArrowLeft size={16} /> {rotuloVoltar}
              </button>
            )}
            <div>
              <span className="kicker">SOMMA Club · Inteligência da comunidade</span>
              <h1>Painel da comunidade</h1>
            </div>
          </div>
          <SeloFonte />
        </div>
        <div className="pn-wrap pn-filtros">
          <Segmentos rotulo="Período" opcoes={PERIODOS} valor={e.periodo} aoMudar={(v) => setE((s) => ({ ...s, periodo: v, evento: null }))} />
          {personalizado && (
            <div className="pn-datas">
              <label>
                De
                <input
                  type="date"
                  value={e.de}
                  min={COMUNIDADE.historico.inicio}
                  max={e.ate}
                  onChange={(ev) => ev.target.value && set("de", ev.target.value)}
                />
              </label>
              <label>
                Até
                <input
                  type="date"
                  value={e.ate}
                  min={e.de}
                  max={COMUNIDADE.historico.corte}
                  onChange={(ev) => ev.target.value && set("ate", ev.target.value)}
                />
              </label>
            </div>
          )}
          <Segmentos rotulo="Público" opcoes={SEXOS} valor={e.sexo} aoMudar={(v) => set("sexo", v)} />
          <Segmentos rotulo="Formato" opcoes={FORMATOS} valor={e.formato} aoMudar={(v) => setE((s) => ({ ...s, formato: v, evento: null }))} />
        </div>
      </div>

      <main className="pn-wrap pn-corpo">
        <p className="pn-aviso">
          <Info size={15} />
          {personalizado
            ? "No intervalo personalizado aparecem só as métricas que se somam evento a evento. Pessoas únicas, recorrência, frequência e perfil usam os períodos padrão."
            : `Recorte: ${PERIODOS.find((p) => p.id === e.periodo)?.rotulo.toLowerCase()} até ${fmtData(COMUNIDADE.historico.corte)}, data do último evento do retrato.`}
        </p>

        <LinhaKpis k={k} />
        <p className="pn-base">
          <strong>{fmtInt(COMUNIDADE.base.pessoasNaBase)}</strong> pessoas na base da SOMMA (cadastro do site somado a quem já confirmou
          presença), {fmtInt(COMUNIDADE.base.cadastros)} delas com cadastro completo.
        </p>

        <div className="pn-grade">
          <Cartao titulo="Confirmações por evento" sub="Clique numa coluna para ver o evento." largo>
            <div className="pn-cartao-barra">
              <Legenda
                itens={
                  e.vista === "composicao"
                    ? [
                        { cor: "var(--laranja)", rotulo: "Estreantes" },
                        { cor: "var(--ponto-medio)", rotulo: "Já tinham vindo" },
                      ]
                    : [{ cor: "var(--laranja)", rotulo: "Confirmações" }]
                }
              />
              <Segmentos
                rotulo="Vista do gráfico"
                opcoes={[
                  { id: "composicao" as const, rotulo: "Estreantes × recorrentes" },
                  { id: "total" as const, rotulo: "Total" },
                ]}
                valor={e.vista}
                aoMudar={(v) => set("vista", v)}
              />
            </div>
            {evs.length ? (
              <GraficoEventos eventos={evs} sexo={e.sexo} vista={e.vista} selecionado={e.evento} aoSelecionar={(id) => set("evento", id)} />
            ) : (
              <p className="pn-vazio">Nenhum evento neste recorte.</p>
            )}
            {evSel && <DetalheEvento ev={evSel} sexo={e.sexo} aoFechar={() => set("evento", null)} />}
          </Cartao>

          <Cartao titulo="Retenção" sub="Parcela que voltou a um evento em até 30, 90 e 180 dias depois da estreia. Todo o histórico.">
            <GraficoRetencao dados={hist.retencao} />
            <p className="pn-nota">
              Pessoas elegíveis: {hist.retencao.map((x) => `${fmtInt(x.elegiveis)} (${x.dias} dias)`).join(" · ")}
            </p>
          </Cartao>

          <Cartao titulo="Frequência" sub="Quantas pessoas foram a 1, 2, 3 ou mais eventos no recorte.">
            {r ? (
              <>
                <GraficoFrequencia dados={r.frequencia} />
                <Legenda
                  itens={[
                    { cor: "var(--ponto-medio)", rotulo: "Um evento" },
                    { cor: "var(--laranja)", rotulo: "Voltaram (2 ou mais)" },
                  ]}
                />
              </>
            ) : (
              <p className="pn-vazio">Escolha um período padrão.</p>
            )}
          </Cartao>

          <Cartao
            titulo="Coortes por mês de estreia"
            sub="Cada linha é o grupo que estreou naquele mês; cada coluna, um mês depois. Todo o histórico."
            largo
          >
            <MapaCoortes coortes={hist.coortes} />
            <p className="pn-nota">
              O histórico começa em {fmtData(COMUNIDADE.historico.inicio)}: quem já corria antes aparece como estreante em março. Coortes com
              menos de {COMUNIDADE.privacidade.minimoElegiveis} pessoas não são exibidas.
            </p>
          </Cartao>

          <Cartao titulo="Pessoas únicas por mês" sub="Quantas pessoas diferentes confirmaram presença em cada mês, e quantas eram estreantes.">
            <Legenda
              itens={[
                { cor: "var(--laranja)", rotulo: "Pessoas únicas", forma: "linha" },
                { cor: "var(--ponto-medio)", rotulo: "Estreantes", forma: "linha" },
              ]}
            />
            <GraficoTendencia dados={hist.tendencia} />
          </Cartao>

          <Cartao titulo="Perfil de quem participa" sub="Sexo e idade declarados no check-in e no cadastro do site.">
            {r ? (
              <div className="pn-perfil">
                <div>
                  <span className="pn-rotulo">Sexo · entre quem informou ({fmtInt(sexoConhecido)})</span>
                  <BarrasHorizontais
                    dados={[
                      { rotulo: "Mulheres", valor: r.sexo.F == null ? null : pct(r.sexo.F, sexoConhecido) },
                      { rotulo: "Homens", valor: r.sexo.M == null ? null : pct(r.sexo.M, sexoConhecido) },
                    ]}
                    destaque={["Mulheres"]}
                  />
                </div>
                <div>
                  <span className="pn-rotulo">
                    Idade · conhecida para {fmtInt(idadeTotal)} de {fmtInt(r.pessoas)} ({fmtPct(pct(idadeTotal, r.pessoas), 0)})
                  </span>
                  <BarrasHorizontais
                    dados={r.idade.faixas.map((f) => ({
                      rotulo: f.faixa,
                      valor: f.pessoas == null ? null : pct(f.pessoas, idadeTotal),
                      detalhe: f.pessoas == null ? undefined : `${fmtInt(f.pessoas)} pessoas`,
                    }))}
                    destaque={["25–34", "35–44"]}
                  />
                </div>
              </div>
            ) : (
              <p className="pn-vazio">Escolha um período padrão.</p>
            )}
          </Cartao>
        </div>

        <section className="pn-definicoes">
          <h3>Como os números são calculados</h3>
          <dl>
            {DEFINICOES.map((d) => (
              <div key={d.termo}>
                <dt>{d.termo}</dt>
                <dd>{d.texto}</dd>
              </div>
            ))}
          </dl>
          <h3>Tratamento e privacidade</h3>
          <ul>
            <li>
              {fmtInt(q.registrosBrutos)} registros lidos. Ficaram fora {fmtInt(q.semEventoRealizado)} de eventos que ainda não aconteceram,{" "}
              {fmtInt(q.semCpfValido)} sem CPF válido e {fmtInt(q.duplicados)} repetidos no mesmo evento. Restaram {fmtInt(q.validos)} confirmações.
            </li>
            <li>
              O painel mostra só contagens agregadas: nenhum CPF, nome, e-mail ou telefone sai do banco. Grupos com menos de{" "}
              {COMUNIDADE.privacidade.minimoCelula} pessoas aparecem como “menos de {COMUNIDADE.privacidade.minimoCelula}”.
            </li>
            <li>
              O retrato é gerado por script a partir do sistema de check-in. A rotina sugerida é trimestral, e ele pode ser refeito a qualquer
              momento.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
