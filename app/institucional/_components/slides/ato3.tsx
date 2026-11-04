"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CASES, ROTULO_STATUS_CASE } from "../../_data/cases";
import { META_COMUNIDADE } from "../../_data/comunidade";
import { OPORTUNIDADES } from "../../_data/oportunidades";
import { Entra, Kicker, TituloMascara, useSlide, type SlideProps } from "../ui";

/* 09 · Aparecer ou ser vivida ---------------------------------------------- */
const SEMANAS = 10;
const TOQUES = [
  { semana: 1, rotulo: "experimenta" },
  { semana: 3, rotulo: "lembra" },
  { semana: 5, rotulo: "compartilha" },
  { semana: 7, rotulo: "reconhece" },
  { semana: 9, rotulo: "volta" },
];

export function S09ExposicaoExperiencia({ modo }: SlideProps) {
  const { ativo } = useSlide();
  const [vivida, setVivida] = useState(true);
  const W = 100;
  const x = (s: number) => 4 + (s / (SEMANAS - 1)) * (W - 8);
  const colunas = [
    {
      id: "exposicao",
      titulo: "Exposição tradicional",
      itens: ["O público vê a mensagem", "O contato costuma ser breve", "A participação, em geral, é passiva"],
    },
    {
      id: "experiencia",
      titulo: "Experiência SOMMA",
      itens: [
        "As pessoas interagem com a marca",
        "A marca participa de momentos que importam",
        "A experiência pode ser compartilhada nas redes",
        "A repetição constrói familiaridade",
      ],
    },
  ];
  return (
    <>
      <div className="s-topo quebra">
        <div className="pilha g-1">
          <Entra>
            <Kicker>Da exposição à experiência</Kicker>
          </Entra>
          <TituloMascara className="fs-h1" linhas={["Sua marca pode aparecer.", "Ou pode ser vivida."]} destaque={[1]} />
        </div>
        <Entra atraso={0.3}>
          <div className="segmentos" role="tablist" aria-label="Modo de presença">
            <button role="tab" aria-selected={!vivida} onClick={() => setVivida(false)}>
              Aparecer
            </button>
            <button role="tab" aria-selected={vivida} onClick={() => setVivida(true)}>
              Ser vivida
            </button>
          </div>
        </Entra>
      </div>

      <div className="s-corpo" style={{ justifyContent: "center", gap: "1.6em", marginTop: "1em" }}>
        <Entra atraso={0.35}>
          <svg viewBox={`0 0 ${W} 15`} style={{ width: "100%", height: "auto", overflow: "visible" }} role="img"
            aria-label={vivida ? "Cinco contatos ao longo de dez semanas, ligados entre si" : "Um contato isolado em dez semanas"}>
            <line x1={x(0)} x2={x(SEMANAS - 1)} y1={8} y2={8} stroke="var(--linha)" strokeWidth={0.2} />
            {Array.from({ length: SEMANAS }, (_, s) => (
              <g key={s}>
                <circle cx={x(s)} cy={8} r={0.7} fill="var(--ponto-neutro)" />
                <text x={x(s)} y={14.2} textAnchor="middle" style={{ fontSize: 1.4, fill: "var(--texto-3)" }}>
                  sem. {s + 1}
                </text>
              </g>
            ))}
            {vivida && (
              <motion.path
                key="linha"
                d={TOQUES.map((t, i) => `${i ? "L" : "M"}${x(t.semana)},8`).join(" ")}
                fill="none"
                stroke="var(--laranja)"
                strokeWidth={0.45}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: ativo ? 1 : 0 }}
                transition={{ duration: 1.6, ease: "easeInOut" }}
              />
            )}
            <AnimatePresence>
              {vivida
                ? TOQUES.map((t, i) => (
                    <motion.g
                      key={`v${t.semana}`}
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 0.25 + i * 0.3, duration: 0.4 }}
                      style={{ transformOrigin: `${x(t.semana)}px 8px` }}
                    >
                      <circle cx={x(t.semana)} cy={8} r={1.2 + i * 0.2} fill="var(--laranja)" />
                      <text x={x(t.semana)} y={3.4} textAnchor="middle" style={{ fontSize: 1.7, fontWeight: 600, fill: "var(--texto-1)" }}>
                        {t.rotulo}
                      </text>
                    </motion.g>
                  ))
                : [
                    <motion.g
                      key="unico"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 1, 0.25] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2.4, times: [0, 0.15, 0.55, 1] }}
                    >
                      <circle cx={x(2)} cy={8} r={1.8} fill="var(--laranja)" />
                      <text x={x(2)} y={3.4} textAnchor="middle" style={{ fontSize: 1.7, fontWeight: 600, fill: "var(--texto-1)" }}>
                        vê
                      </text>
                    </motion.g>,
                  ]}
            </AnimatePresence>
          </svg>
        </Entra>

        <Entra atraso={0.5} className="grade-2" style={{ alignItems: "start" }}>
          {colunas.map((c) => {
            const on = (c.id === "experiencia") === vivida;
            return (
              <div
                key={c.id}
                className="cartao"
                style={{
                  borderColor: on ? "var(--laranja)" : "var(--linha)",
                  opacity: on ? 1 : 0.55,
                  transition: "opacity .3s, border-color .3s",
                }}
              >
                <h3 className="t-display fs-h3" style={{ marginBottom: "0.8em" }}>
                  {c.titulo}
                </h3>
                <ul className="pilha g-08">
                  {c.itens.map((i) => (
                    <li key={i} className="fs-body linha g-08" style={{ alignItems: "baseline" }}>
                      <i style={{ width: 7, height: 7, borderRadius: "50%", background: on ? "var(--laranja)" : "var(--ponto-medio)", flex: "none", transform: "translateY(-2px)" }} />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </Entra>
      </div>

      <Entra atraso={0.7} className="fs-body c-2" style={{ marginTop: modo === "palco" ? "1em" : 24 }}>
        Não é um contra o outro. A mídia gera alcance; a experiência gera vínculo. Juntas, se complementam.
      </Entra>
    </>
  );
}

/* 10 · O que as marcas podem criar ----------------------------------------- */
export function S10OQueCriar({ modo }: SlideProps) {
  const [sel, setSel] = useState(0);
  const c = OPORTUNIDADES[sel];
  return (
    <>
      <div className="pilha g-1">
        <Entra>
          <Kicker>O que as marcas podem criar</Kicker>
        </Entra>
        <TituloMascara className="fs-h1" linhas={["Existem muitas formas", "de fazer parte."]} destaque={[1]} />
      </div>

      <div className="s-corpo grade-2 grade-2-r" style={{ marginTop: "2em", alignItems: "stretch" }}>
        <Entra atraso={0.3}>
          <div role="tablist" aria-label="Territórios" aria-orientation="vertical" className="pilha">
            {OPORTUNIDADES.map((o, i) => {
              const on = i === sel;
              return (
                <button
                  key={o.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSel(i)}
                  className="linha g-1 regua"
                  style={{
                    padding: modo === "palco" ? "1em 0" : "14px 0",
                    background: "none",
                    border: 0,
                    borderTop: "1px solid var(--linha)",
                    cursor: "pointer",
                    font: "inherit",
                    color: "inherit",
                    textAlign: "left",
                  }}
                >
                  <span className="t-numero fs-h3" style={{ color: on ? "var(--laranja)" : "var(--texto-3)", width: "2em", transition: "color .25s" }}>
                    {o.numero}
                  </span>
                  <span className="fs-lead peso-6" style={{ color: on ? "var(--texto-1)" : "var(--texto-2)", flex: 1 }}>
                    {o.titulo}
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      width: "0.8em",
                      height: "0.8em",
                      borderRadius: "50%",
                      background: on ? "var(--laranja)" : "transparent",
                      border: `2px solid ${on ? "var(--laranja)" : "var(--ponto-neutro)"}`,
                      transition: "all .25s",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </Entra>

        <Entra atraso={0.4}>
          <AnimatePresence mode="wait">
            <motion.div
              key={c.id}
              role="tabpanel"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3 }}
              className="cartao pilha g-2"
              style={{ height: "100%" }}
            >
              <p className="fs-lead peso-6">{c.resumo}</p>
              <div className="grade-2" style={{ gap: "1.4em 2em", alignItems: "start" }}>
                {c.exemplos.map((e) => (
                  <div key={e.titulo} className="pilha g-04">
                    <span className="fs-body peso-6 linha g-08">
                      <i style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--laranja)", flex: "none" }} />
                      {e.titulo}
                    </span>
                    <span className="fs-small c-2">{e.descricao}</span>
                  </div>
                ))}
              </div>
              <div className="regua mt-auto" style={{ paddingTop: "1em" }}>
                <span className="fs-micro c-3 peso-6" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  O que dá para acompanhar
                </span>
                <p className="fs-small c-2" style={{ marginTop: "0.3em" }}>
                  {c.sinais}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </Entra>
      </div>

      <Entra atraso={0.6}>
        <p className="fonte" style={{ marginTop: "1.2em" }}>
          Exemplos ilustrativos, não entregas garantidas. O escopo de cada parceria é definido em proposta.
        </p>
      </Entra>
    </>
  );
}

/* 11 · Cases ---------------------------------------------------------------- */
export function S11Cases({ modo }: SlideProps) {
  const [sel, setSel] = useState(0);
  const c = CASES[sel];
  return (
    <>
      <div className="pilha g-1">
        <Entra>
          <Kicker>Histórias reais</Kicker>
        </Entra>
        <TituloMascara className="fs-h1" linhas={["Marcas que já entraram", "em movimento com a gente."]} destaque={[1]} />
      </div>

      <div className="s-corpo grade-2 grade-2-r" style={{ marginTop: "1.8em", alignItems: "stretch" }}>
        <Entra atraso={0.3}>
          <div role="tablist" aria-label="Marcas" aria-orientation="vertical" className="pilha">
            {CASES.map((x, i) => {
              const on = i === sel;
              return (
                <button
                  key={x.marca}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSel(i)}
                  className="linha entre g-1"
                  style={{
                    padding: modo === "palco" ? "0.75em 0" : "12px 0",
                    background: "none",
                    border: 0,
                    borderTop: "1px solid var(--linha)",
                    cursor: "pointer",
                    font: "inherit",
                    color: "inherit",
                    textAlign: "left",
                  }}
                >
                  <span className="t-display fs-h2" style={{ color: on ? "var(--texto-1)" : "var(--texto-3)", transition: "color .25s" }}>
                    {x.marca}
                  </span>
                  <span className="selo" style={{ borderColor: on ? "var(--laranja)" : undefined }}>
                    {ROTULO_STATUS_CASE[x.status]}
                  </span>
                </button>
              );
            })}
          </div>
        </Entra>

        <Entra atraso={0.4}>
          <AnimatePresence mode="wait">
            <motion.article
              key={c.marca}
              role="tabpanel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="cartao pilha g-1"
              style={{ height: "100%" }}
            >
              <div className="linha entre g-1 quebra">
                <h3 className="t-display fs-h2">{c.marca}</h3>
                <span className="selo selo-ponto">{ROTULO_STATUS_CASE[c.status]}</span>
              </div>
              <dl className="grade-2" style={{ gap: "1.1em 2em", alignItems: "start" }}>
                {[
                  ["Contexto", c.contexto],
                  ["Experiência", c.experiencia],
                  ["Papel da SOMMA", c.papelSomma],
                  ["Evidência disponível", c.evidencias.join(" · ")],
                ].map(([t, v]) => (
                  <div key={t}>
                    <dt className="fs-micro c-3 peso-6" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      {t}
                    </dt>
                    <dd className="fs-small" style={{ marginTop: "0.3em" }}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="regua mt-auto linha g-3 quebra" style={{ paddingTop: "1em", alignItems: "flex-end" }}>
                {c.resultados.length ? (
                  c.resultados.map((r) => (
                    <div key={r.rotulo} className="pilha g-04" style={{ maxWidth: "13em" }}>
                      <span className="t-numero fs-h2" style={{ color: "var(--laranja)" }}>
                        {r.valor}
                      </span>
                      <span className="fs-micro c-2">{r.rotulo}</span>
                    </div>
                  ))
                ) : (
                  <span className="fs-small c-3">Resultados serão publicados depois da primeira edição.</span>
                )}
              </div>
            </motion.article>
          </AnimatePresence>
        </Entra>
      </div>

      <Entra atraso={0.6}>
        <p className="fonte" style={{ marginTop: "1.2em" }}>
          Números do sistema de check-in da SOMMA (confirmações de presença, {META_COMUNIDADE.periodo}). Sem dados de venda, mídia paga ou
          retorno financeiro.
        </p>
      </Entra>
    </>
  );
}
