"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { COMUNIDADE, META_COMUNIDADE, TOTAL } from "../../_data/comunidade";
import {
  INSTAGRAM_FORMATOS,
  INSTAGRAM_PRINCIPAIS,
  INSTAGRAM_PUBLICO,
  INSTAGRAM_SECUNDARIAS,
  META_INSTAGRAM,
} from "../../_data/instagram";
import { fmtInt, fmtPct, pct, repartir100 } from "../../_lib/formato";
import { Waffle } from "../pontos";
import { Entra, Fonte, Kicker, TituloMascara, useSlide, type SlideProps } from "../ui";

/* 04 · Três dimensões de influência --------------------------------------- */
const DIMENSOES = [
  {
    id: "fisica",
    nome: "Influência física",
    curto: "Física",
    texto: "Pessoas reunidas em experiências reais, toda semana, no mesmo lugar.",
    prova: `${COMUNIDADE.eventos.length} encontros com check-in desde março · mediana de ${fmtInt(COMUNIDADE.sabados.mediana)} confirmações por sábado`,
    alimenta: "O encontro vira conteúdo.",
    pos: { cx: 0, cy: -0.62 },
  },
  {
    id: "digital",
    nome: "Influência digital",
    curto: "Digital",
    texto: "Conteúdo, distribuição e conversa que continuam depois do sábado.",
    prova: "415 mil visualizações no Instagram em 30 dias",
    alimenta: "O conteúdo vira hábito e identidade.",
    pos: { cx: 0.62, cy: 0.42 },
  },
  {
    id: "cultural",
    nome: "Influência cultural",
    curto: "Cultural",
    texto: "Hábito, identidade e pertencimento: correr com a SOMMA vira parte de quem a pessoa é.",
    prova: `${fmtInt(TOTAL.recorrentes)} pessoas já voltaram a mais de um encontro`,
    alimenta: "A identidade traz as pessoas de volta para a rua.",
    pos: { cx: -0.62, cy: 0.42 },
  },
];

export function S04Dimensoes({ modo }: SlideProps) {
  const { ativo } = useSlide();
  const [sel, setSel] = useState(0);
  const [tocou, setTocou] = useState(false);
  // Gira sozinho pelo ciclo até alguém interagir.
  useEffect(() => {
    if (!ativo || tocou) return;
    const t = setInterval(() => setSel((s) => (s + 1) % 3), 4200);
    return () => clearInterval(t);
  }, [ativo, tocou]);
  const d = DIMENSOES[sel];
  const escolher = (i: number) => {
    setTocou(true);
    setSel(i);
  };
  return (
    <>
      <Entra>
        <Kicker>Três dimensões de influência</Kicker>
      </Entra>
      <div className="s-corpo grade-2 grade-2-r" style={{ marginTop: "1.2em" }}>
        <Entra atraso={0.2} style={{ height: modo === "palco" ? "100%" : 320, display: "grid", placeItems: "center" }}>
          <svg viewBox="-1.75 -1.6 3.5 3.3" style={{ width: "100%", height: "100%", maxHeight: modo === "palco" ? "34em" : 320 }} data-interativo>
            {/* Ciclo: um ponto percorre as três dimensões. */}
            <circle r={1.32} fill="none" stroke="var(--linha)" strokeWidth={0.008} strokeDasharray="0.02 0.035" />
            <g style={{ transformOrigin: "0 0", animation: ativo ? "inst-orbita 9s linear infinite" : undefined }}>
              <circle cx={0} cy={-1.32} r={0.045} fill="var(--laranja)" />
            </g>
            {DIMENSOES.map((x, i) => {
              const on = i === sel;
              return (
                <g key={x.id} onClick={() => escolher(i)} style={{ cursor: "pointer" }} role="button" aria-label={x.nome} tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && escolher(i)}>
                  <motion.circle
                    cx={x.pos.cx}
                    cy={x.pos.cy}
                    r={0.86}
                    initial={false}
                    animate={{
                      fill: on ? "rgba(255,44,3,0.16)" : "rgba(10,10,10,0.0)",
                      stroke: on ? "#ff2c03" : "rgba(10,10,10,0.35)",
                    }}
                    strokeWidth={0.012}
                    transition={{ duration: 0.4 }}
                  />
                  <text
                    x={x.pos.cx + (x.pos.cx === 0 ? 0 : x.pos.cx > 0 ? 0.28 : -0.28)}
                    y={x.pos.cy + (x.pos.cy < 0 ? -0.38 : 0.42)}
                    textAnchor="middle"
                    style={{
                      fontFamily: "var(--f-display)",
                      fontWeight: 800,
                      fontVariationSettings: '"wdth" 72',
                      textTransform: "uppercase",
                      fontSize: 0.2,
                      fill: on ? "#0a0a0a" : "rgba(10,10,10,0.55)",
                      transition: "fill .3s",
                    }}
                  >
                    {x.curto}
                  </text>
                </g>
              );
            })}
            <circle r={0.2} fill="#0a0a0a" />
            <text y={0.035} textAnchor="middle" style={{ fill: "#fff", fontSize: 0.075, fontWeight: 700, letterSpacing: "0.02em" }}>
              SOMMA
            </text>
          </svg>
        </Entra>

        <div className="pilha g-2">
          <TituloMascara className="fs-h1" linhas={["A nossa influência", "não acontece em", "um único lugar."]} destaque={[2]} />
          <Entra atraso={0.4}>
            <div className="segmentos" role="tablist" aria-label="Dimensões">
              {DIMENSOES.map((x, i) => (
                <button key={x.id} role="tab" aria-selected={i === sel} onClick={() => escolher(i)}>
                  {x.curto}
                </button>
              ))}
            </div>
          </Entra>
          <Entra atraso={0.5}>
            <AnimatePresence mode="wait">
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="pilha g-1"
                style={{ minHeight: modo === "palco" ? "13em" : undefined }}
              >
                <h3 className="t-display fs-h2">{d.nome}</h3>
                <p className="fs-lead c-2">{d.texto}</p>
                <p className="fs-body peso-6 linha g-08">
                  <i style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--laranja)", flex: "none" }} />
                  {d.prova}
                </p>
                <p className="fs-body c-2">
                  <span className="c-3">E então: </span>
                  {d.alimenta}
                </p>
              </motion.div>
            </AnimatePresence>
          </Entra>
        </div>
      </div>
    </>
  );
}

/* 05 · Audiência digital --------------------------------------------------- */
function valorAnimado(id: string): { valor: number; sufixo: string; casas: number } {
  switch (id) {
    case "visualizacoes":
      return { valor: 415, sufixo: " mil", casas: 0 };
    case "visualizadores":
      return { valor: 44.4, sufixo: " mil", casas: 1 };
    case "seguidores":
      return { valor: 14.8, sufixo: " mil", casas: 1 };
    default:
      return { valor: 7.4, sufixo: " mil", casas: 1 };
  }
}

export function S05AudienciaDigital({ modo }: SlideProps) {
  const { ativo } = useSlide();
  const [foco, setFoco] = useState<string | null>(null);
  return (
    <>
      <div className="s-topo">
        <div className="pilha g-1">
          <Entra>
            <Kicker>Instagram @somma.club · últimos 30 dias</Kicker>
          </Entra>
          <TituloMascara className="fs-h1" linhas={["A comunidade", "continua conectada."]} destaque={[1]} />
        </div>
      </div>

      <div className="s-corpo" style={{ justifyContent: "center" }}>
        <div className="grade-4" style={{ gap: modo === "palco" ? "0" : 16 }}>
          {INSTAGRAM_PRINCIPAIS.map((m, i) => {
            const a = valorAnimado(m.id);
            return (
              <Entra key={m.id} atraso={0.3 + i * 0.1}>
                <div
                  tabIndex={0}
                  onMouseEnter={() => setFoco(m.id)}
                  onMouseLeave={() => setFoco(null)}
                  onFocus={() => setFoco(m.id)}
                  onBlur={() => setFoco(null)}
                  data-interativo
                  style={{
                    position: "relative",
                    padding: modo === "palco" ? "1.4em 1.6em 1.6em" : "16px 0",
                    borderLeft: modo === "palco" ? "1px solid var(--linha)" : undefined,
                    borderTop: modo === "leitura" ? "1px solid var(--linha)" : undefined,
                    cursor: "default",
                  }}
                >
                  <span className="t-numero" style={{ fontSize: modo === "palco" ? "6.2em" : 56, display: "block", color: i === 0 ? "var(--laranja)" : undefined }}>
                    <NumberFlow
                      value={ativo ? a.valor : 0}
                      suffix={a.sufixo}
                      locales="pt-BR"
                      format={{ minimumFractionDigits: a.casas, maximumFractionDigits: a.casas }}
                      transformTiming={{ duration: 1200, easing: "cubic-bezier(.2,.7,.2,1)" }}
                    />
                  </span>
                  <span className="fs-body peso-6" style={{ display: "block", marginTop: "0.6em" }}>
                    {m.rotulo}
                  </span>
                  <span
                    className="fs-small c-2"
                    style={{ display: "block", marginTop: "0.5em", minHeight: modo === "palco" ? "4.4em" : undefined }}
                  >
                    {foco === m.id || modo === "leitura" ? (
                      <>
                        <strong style={{ color: "var(--texto-1)" }}>{fmtInt(m.valor)}</strong> · {m.definicao}
                      </>
                    ) : (
                      <span className="c-3">Passe o mouse para o número exato</span>
                    )}
                  </span>
                </div>
              </Entra>
            );
          })}
        </div>

        <Entra atraso={0.8}>
          <div className="linha g-3 quebra regua" style={{ marginTop: "2.4em", paddingTop: "1.4em" }}>
            {INSTAGRAM_SECUNDARIAS.map((m) => (
              <div key={m.id} className="linha g-08" title={m.definicao}>
                <span className="t-numero fs-h3">{m.destaque}</span>
                <span className="fs-small c-2">{m.rotulo}</span>
              </div>
            ))}
          </div>
        </Entra>
      </div>

      <Entra atraso={0.9} className="pilha g-04">
        <p className="fonte">
          Visualizações contam exibições, não pessoas: uma mesma conta pode ver vários conteúdos. Visualizadores incluem quem não segue o
          perfil.
        </p>
        <Fonte meta={META_INSTAGRAM} />
      </Entra>
    </>
  );
}

/* 06 · Distribuição de conteúdo -------------------------------------------- */
export function S06Distribuicao({ modo }: SlideProps) {
  const [foco, setFoco] = useState<string | null>(null);
  const total = INSTAGRAM_FORMATOS.reduce((s, f) => s + f.valor, 0);
  const pontos = repartir100(INSTAGRAM_FORMATOS.map((f) => f.valor));
  const cores = ["var(--laranja)", "var(--ponto-claro)", "var(--ponto-medio)"];
  const cats = INSTAGRAM_FORMATOS.map((f, i) => ({ id: f.id, rotulo: f.rotulo, pontos: pontos[i], cor: cores[i] }));
  const stories = pct(INSTAGRAM_FORMATOS[0].valor, total);
  return (
    <div className="s-corpo grade-2 grade-2-r">
      <Entra atraso={0.15} style={{ display: "grid", placeItems: "center", height: modo === "palco" ? "100%" : undefined }}>
        <Waffle
          categorias={cats}
          foco={foco}
          aoFocar={setFoco}
          rotulo={`Visualizações por formato: ${cats.map((c) => `${c.rotulo} ${c.pontos}%`).join(", ")}`}
          className="waffle"
        />
      </Entra>

      <div className="pilha g-2">
        <Entra>
          <Kicker>Instagram · visualizações por formato</Kicker>
        </Entra>
        <TituloMascara className="fs-h1" linhas={["Conteúdo que", "mantém a comunidade", "em movimento."]} destaque={[2]} />
        <Entra atraso={0.35}>
          <ul className="pilha" onMouseLeave={() => setFoco(null)} data-interativo>
            {INSTAGRAM_FORMATOS.map((f, i) => (
              <li
                key={f.id}
                onMouseEnter={() => setFoco(f.id)}
                className="linha entre regua"
                style={{
                  padding: "0.85em 0",
                  opacity: foco && foco !== f.id ? 0.4 : 1,
                  transition: "opacity .25s",
                }}
              >
                <span className="linha g-08 fs-lead peso-6">
                  <i style={{ width: "0.7em", height: "0.7em", borderRadius: "50%", background: cores[i], flex: "none" }} />
                  {f.rotulo}
                </span>
                <span className="linha g-1">
                  <span className="t-numero fs-h3">{f.destaque}</span>
                  <span className="fs-small c-2" style={{ minWidth: "3.6em", textAlign: "right" }}>
                    {fmtPct(pct(f.valor, total), 0)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Entra>
        <Entra atraso={0.5} className="fs-body c-2 bonito" style={{ maxWidth: "32em" }}>
          Stories somam cerca de {fmtPct(stories, 0)} das visualizações: é o canal do dia a dia, onde o sábado é anunciado, vivido e
          lembrado. Comunicação recorrente cria vários pontos de contato ao longo do tempo.
        </Entra>
        <Entra atraso={0.6}>
          <p className="fonte">
            Cada ponto é 1% das visualizações. Valores arredondados pelo Instagram. Uma parceria não recebe automaticamente toda a audiência
            orgânica da conta.
          </p>
        </Entra>
      </div>
    </div>
  );
}

/* 07 · Perfil da audiência -------------------------------------------------- */
type PublicoId = "seguidores" | "participantes";

function perfilParticipantes() {
  const r = TOTAL;
  const F = r.sexo.F ?? 0;
  const M = r.sexo.M ?? 0;
  const conhecidos = F + M;
  const idadeTotal = r.idade.faixas.reduce((s, f) => s + (f.pessoas ?? 0), 0);
  const faixas = r.idade.faixas.map((f) => ({ faixa: f.faixa, pct: f.pessoas == null ? null : pct(f.pessoas, idadeTotal) }));
  const nucleo = r.idade.faixas
    .filter((f) => f.faixa === "25–34" || f.faixa === "35–44")
    .reduce((s, f) => s + (f.pessoas ?? 0), 0);
  return {
    mulheres: pct(F, conhecidos),
    homens: pct(M, conhecidos),
    faixas,
    nucleo: pct(nucleo, idadeTotal),
    cobertura: pct(idadeTotal, r.pessoas),
    idadeTotal,
  };
}

export function S07Perfil({ modo }: SlideProps) {
  const [pub, setPub] = useState<PublicoId>("seguidores");
  const [foco, setFoco] = useState<string | null>(null);
  const part = perfilParticipantes();
  const ig = INSTAGRAM_PUBLICO;
  const nucleoIg = ig.idade.filter((f) => ig.faixasNucleo.includes(f.faixa)).reduce((s, f) => s + f.pct, 0);

  const dados =
    pub === "seguidores"
      ? {
          mulheres: ig.sexo[0].pct,
          homens: ig.sexo[1].pct,
          faixas: ig.idade.map((f) => ({ faixa: f.faixa, pct: f.pct as number | null })),
          destaque: `${fmtPct(nucleoIg)} têm entre 25 e 44 anos`,
          extra: `${fmtPct(ig.brasil)} estão no Brasil`,
          nota: "Seguidores do Instagram @somma.club, segundo o Instagram Insights (04/11/2026).",
        }
      : {
          mulheres: part.mulheres,
          homens: part.homens,
          faixas: part.faixas,
          destaque: `${fmtPct(part.nucleo)} têm entre 25 e 44 anos`,
          extra: `idade conhecida para ${fmtInt(part.idadeTotal)} pessoas (${fmtPct(part.cobertura, 0)} de quem participou)`,
          nota: `Quem confirmou presença em encontros entre ${META_COMUNIDADE.periodo}. Sexo entre quem informou; idade pelo cadastro do site.`,
        };

  const pontos = repartir100([dados.mulheres, dados.homens]);
  const cats = [
    { id: "F", rotulo: "Mulheres", pontos: pontos[0], cor: "var(--laranja)" },
    { id: "M", rotulo: "Homens", pontos: pontos[1], cor: "var(--ponto-claro)" },
  ];
  const max = Math.max(...dados.faixas.map((f) => f.pct ?? 0));

  return (
    <>
      <div className="s-topo quebra">
        <div className="pilha g-1">
          <Entra>
            <Kicker>Perfil da audiência</Kicker>
          </Entra>
          <TituloMascara className="fs-h1" linhas={["Uma audiência", "com identidade."]} destaque={[1]} />
        </div>
        <Entra atraso={0.3}>
          <div className="segmentos" role="tablist" aria-label="Público">
            <button role="tab" aria-selected={pub === "seguidores"} onClick={() => setPub("seguidores")}>
              Seguidores do Instagram
            </button>
            <button role="tab" aria-selected={pub === "participantes"} onClick={() => setPub("participantes")}>
              Participantes dos encontros
            </button>
          </div>
        </Entra>
      </div>

      <div className="s-corpo grade-2" style={{ marginTop: "1.6em", alignItems: "stretch" }}>
        <Entra atraso={0.35} className="linha g-3" style={{ alignItems: "center" }}>
          <div style={{ width: modo === "palco" ? "15em" : 140, flex: "none" }}>
            <Waffle key={pub} categorias={cats} foco={foco} aoFocar={setFoco} rotulo={`Mulheres ${pontos[0]}%, homens ${pontos[1]}%`} />
          </div>
          <div className="pilha g-1">
            {cats.map((c, i) => (
              <div
                key={c.id}
                onMouseEnter={() => setFoco(c.id)}
                onMouseLeave={() => setFoco(null)}
                style={{ opacity: foco && foco !== c.id ? 0.4 : 1, transition: "opacity .25s" }}
              >
                <span className="t-numero fs-h2" style={{ display: "block" }}>
                  {fmtPct(i === 0 ? dados.mulheres : dados.homens)}
                </span>
                <span className="fs-small c-2 linha g-08">
                  <i style={{ width: 9, height: 9, borderRadius: "50%", background: c.cor, flex: "none" }} />
                  {c.rotulo}
                </span>
              </div>
            ))}
          </div>
        </Entra>

        <Entra atraso={0.45} className="pilha g-1" style={{ justifyContent: "center" }}>
          <span className="fs-small c-3 peso-6" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Idade
          </span>
          <div className="pilha" style={{ gap: "0.55em" }}>
            {dados.faixas.map((f) => {
              const nucleo = f.faixa === "25–34" || f.faixa === "35–44";
              return (
                <div key={f.faixa} className="linha g-1" title={f.pct == null ? "Grupo pequeno demais para exibir" : undefined}>
                  <span className="fs-small c-2" style={{ width: "4.4em", flex: "none" }}>
                    {f.faixa}
                  </span>
                  <span style={{ flex: 1, height: "0.95em", position: "relative" }}>
                    <motion.span
                      key={`${pub}-${f.faixa}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${((f.pct ?? 0) / max) * 100}%` }}
                      transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
                      style={{
                        position: "absolute",
                        inset: "0 auto 0 0",
                        borderRadius: "0 4px 4px 0",
                        minWidth: 2,
                        background: nucleo ? "var(--laranja)" : "var(--ponto-medio)",
                      }}
                    />
                  </span>
                  <span className="fs-small" style={{ width: "3.6em", textAlign: "right", fontFeatureSettings: '"tnum"' }}>
                    {f.pct == null ? "<5" : fmtPct(f.pct)}
                  </span>
                </div>
              );
            })}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={pub}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="pilha g-04"
              style={{ marginTop: "0.8em" }}
            >
              <span className="fs-lead peso-6">{dados.destaque}</span>
              <span className="fs-small c-2">{dados.extra}</span>
            </motion.div>
          </AnimatePresence>
        </Entra>
      </div>

      <Entra atraso={0.6} className="pilha g-04" style={{ marginTop: "1.2em" }}>
        <p className="fonte">{dados.nota}</p>
        <p className="fonte">
          Seguidores e participantes são públicos diferentes e aparecem separados. Não inferimos renda, profissão ou poder de compra a partir
          de idade ou sexo.
        </p>
      </Entra>
    </>
  );
}

/* 08 · Além do algoritmo: o ecossistema ------------------------------------ */
const NOS = [
  { id: "instagram", nome: "Instagram", texto: "Anúncio, conteúdo e conversa da semana." },
  { id: "site", nome: "Site", texto: "Agenda, páginas de evento e inscrições." },
  { id: "whatsapp", nome: "WhatsApp", texto: "Grupos da comunidade e avisos diretos." },
  { id: "cadastro", nome: "Cadastro", texto: "Base própria de pessoas, com consentimento." },
  { id: "checkin", nome: "Check-in com QR", texto: "Presença confirmada em cada encontro." },
  { id: "sabados", nome: "Encontros de sábado", texto: "Todo sábado, às 7h, no Parque da Cidade." },
  { id: "especiais", nome: "Eventos especiais", texto: "SOMMA DAY, edições temáticas e desafios." },
  { id: "email", nome: "E-mail", texto: "Comunicação direta com quem se inscreveu." },
];

export function S08AlemDoDigital({ modo }: SlideProps) {
  const { ativo } = useSlide();
  const [sel, setSel] = useState<number | null>(null);
  const s = COMUNIDADE.sabados;
  const n = NOS.length;
  return (
    <div className="s-corpo grade-2" style={{ alignItems: "stretch" }}>
      <div className="pilha g-2" style={{ justifyContent: "center" }}>
        <Entra>
          <Kicker>Além do digital</Kicker>
        </Entra>
        <TituloMascara className="fs-h1" linhas={["Não dependemos", "apenas de um", "algoritmo para", "reunir pessoas."]} destaque={[3]} />
        <Entra atraso={0.4} className="grade-3" style={{ gap: "1.4em", marginTop: "0.4em" }}>
          <div className="regua" style={{ paddingTop: "0.9em" }}>
            <span className="t-numero fs-h2" style={{ display: "block" }}>
              {fmtInt(COMUNIDADE.base.pessoasNaBase)}
            </span>
            <span className="fs-small c-2">pessoas na base própria</span>
          </div>
          <div className="regua" style={{ paddingTop: "0.9em" }}>
            <span className="t-numero fs-h2" style={{ display: "block" }}>
              {fmtInt(s.mediana)}
            </span>
            <span className="fs-small c-2">
              confirmações num sábado típico (mediana; metade fica entre {fmtInt(s.p25)} e {fmtInt(s.p75)})
            </span>
          </div>
          <div className="regua" style={{ paddingTop: "0.9em" }}>
            <span className="t-numero fs-h2" style={{ display: "block" }}>
              {fmtPct(TOTAL.taxaRecorrencia, 0)}
            </span>
            <span className="fs-small c-2">de quem veio voltou a outro encontro</span>
          </div>
        </Entra>
        <Entra atraso={0.55}>
          <blockquote className="fs-lead peso-6 equilibrar" style={{ borderLeft: "3px solid var(--laranja)", paddingLeft: "1em" }}>
            “A nossa relação com a comunidade não termina quando alguém fecha o Instagram.”
          </blockquote>
        </Entra>
        <Entra atraso={0.65}>
          <Fonte meta={META_COMUNIDADE} extra={`${s.eventos} sábados com check-in`} />
        </Entra>
      </div>

      <Entra atraso={0.2} style={{ display: "grid", placeItems: "center", minHeight: modo === "palco" ? 0 : 360 }}>
        <div style={{ position: "relative", width: modo === "palco" ? "min(100%, 36em)" : "100%", aspectRatio: "1" }} data-interativo>
          <svg viewBox="-1.3 -1.3 2.6 2.6" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
            <circle r={0.92} fill="none" stroke="var(--linha)" strokeWidth={0.006} />
            <circle r={0.6} fill="none" stroke="var(--linha)" strokeWidth={0.006} strokeDasharray="0.015 0.03" />
            {NOS.map((_, i) => {
              const a = (i / n) * Math.PI * 2 - Math.PI / 2;
              return (
                <line
                  key={i}
                  x1={Math.cos(a) * 0.3}
                  y1={Math.sin(a) * 0.3}
                  x2={Math.cos(a) * 0.92}
                  y2={Math.sin(a) * 0.92}
                  stroke={sel === i ? "var(--laranja)" : "var(--linha)"}
                  strokeWidth={sel === i ? 0.01 : 0.006}
                />
              );
            })}
            <g style={{ transformOrigin: "0 0", animation: ativo ? "inst-orbita 14s linear infinite" : undefined }}>
              <circle cx={0.92} cy={0} r={0.025} fill="var(--laranja)" />
              <circle cx={-0.6} cy={0} r={0.018} fill="var(--laranja)" />
            </g>
            <circle r={0.3} fill="#0a0a0a" />
          </svg>
          <div
            style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", textAlign: "center", color: "#fff", width: "22%" }}
          >
            <span className="fs-small peso-6" style={{ display: "block", lineHeight: 1.2 }}>
              {sel == null ? "Comunidade" : NOS[sel].nome}
            </span>
          </div>
          {NOS.map((no, i) => {
            const a = (i / n) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + (Math.cos(a) * 0.92 * 50) / 1.3;
            const y = 50 + (Math.sin(a) * 0.92 * 50) / 1.3;
            const on = sel === i;
            return (
              <button
                key={no.id}
                type="button"
                onMouseEnter={() => setSel(i)}
                onMouseLeave={() => setSel(null)}
                onFocus={() => setSel(i)}
                onBlur={() => setSel(null)}
                onClick={() => setSel(on ? null : i)}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%,-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.35em",
                  background: "none",
                  border: 0,
                  cursor: "pointer",
                  font: "inherit",
                  color: "inherit",
                  width: "8.5em",
                }}
              >
                <span
                  style={{
                    width: "1.5em",
                    height: "1.5em",
                    borderRadius: "50%",
                    background: on ? "var(--laranja)" : "var(--tinta)",
                    transition: "background .25s, transform .25s",
                    transform: on ? "scale(1.25)" : "scale(1)",
                    boxShadow: "0 0 0 4px var(--papel)",
                  }}
                />
                <span className="fs-micro peso-6" style={{ lineHeight: 1.2, textAlign: "center" }}>
                  {no.nome}
                </span>
              </button>
            );
          })}
        </div>
        <p className="fs-small c-2" style={{ minHeight: "2.8em", textAlign: "center", marginTop: "0.6em" }}>
          {sel == null ? "Passe o mouse em cada canal." : NOS[sel].texto}
        </p>
      </Entra>
    </div>
  );
}
