"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COMUNIDADE, META_COMUNIDADE } from "../../_data/comunidade";
import { fmtData, fmtInt } from "../../_lib/formato";
import { CampoPessoas, SimboloMontagem } from "../pontos";
import { Entra, Fonte, Kicker, Logo, TituloMascara, useSlide, type SlideProps } from "../ui";

/* 01 · Abertura ------------------------------------------------------------ */
export function S01Abertura({ modo }: SlideProps) {
  const { ativo } = useSlide();
  return (
    <>
      <div
        className="trama"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          maskImage: "radial-gradient(ellipse 60% 70% at 72% 50%, #000 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 70% at 72% 50%, #000 0%, transparent 75%)",
          opacity: 0.9,
        }}
      />
      <div className="s-topo" style={{ position: "relative" }}>
        <Entra className="so-palco">
          <Logo tom="claro" style={{ height: "2.6em" }} />
        </Entra>
        <Entra atraso={0.1} className="so-palco">
          <span className="selo">Apresentação institucional · 2026</span>
        </Entra>
      </div>

      <div className="s-corpo grade-2 grade-2-l" style={{ position: "relative" }}>
        <div className="pilha g-2">
          <Entra atraso={0.15}>
            <Kicker>Para marcas que querem fazer parte</Kicker>
          </Entra>
          <TituloMascara as="h1" className="fs-hero" linhas={["Sua marca", "faz parte do", "movimento?"]} destaque={[2]} atraso={0.25} />
          <Entra atraso={0.7} className="fs-lead c-2 bonito" style={{ maxWidth: "28em" }}>
            Mais do que correr, criamos experiências que conectam pessoas, marcas e histórias.
          </Entra>
        </div>

        <div style={{ position: "relative", height: modo === "palco" ? "100%" : 300, display: "grid", placeItems: "center" }}>
          <SimboloMontagem style={{ width: modo === "palco" ? "78%" : "70%", height: "auto", maxHeight: "100%" }} atraso={0.35} />
          {/* O anel que sobra fora do símbolo: o lugar da marca. */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={ativo ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
            transition={{ delay: ativo ? 2.1 : 0, duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
            style={{
              position: "absolute",
              right: modo === "palco" ? "4%" : "6%",
              bottom: modo === "palco" ? "8%" : "2%",
              display: "flex",
              alignItems: "center",
              gap: "0.9em",
            }}
          >
            <span
              style={{
                width: modo === "palco" ? "2.6em" : 30,
                height: modo === "palco" ? "2.6em" : 30,
                borderRadius: "50%",
                border: "2px solid var(--laranja)",
                animation: "inst-pulso 2.6s ease-in-out infinite",
              }}
            />
            <span className="fs-small peso-6" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Sua marca
            </span>
          </motion.div>
        </div>
      </div>

      <Entra atraso={1.2} className="linha g-2 fs-micro c-3 so-palco" style={{ position: "relative" }}>
        <span>Cada ponto é uma pessoa.</span>
        <span>Use ← → para navegar · F para tela cheia</span>
      </Entra>
    </>
  );
}

/* 02 · A grande ideia: um sábado com a SOMMA ----------------------------- */
const SABADO = [
  {
    quando: "Durante a semana",
    titulo: "O convite",
    texto: "O sábado é anunciado no Instagram e nos grupos de WhatsApp da comunidade.",
    marca: "Aviso do encontro com a marca presente desde o convite.",
  },
  {
    quando: "Antes de sair de casa",
    titulo: "O check-in",
    texto: "A pessoa confirma presença pelo site da SOMMA e escolhe o pelotão.",
    marca: "Inscrição ou QR de uma ação da marca.",
  },
  {
    quando: "7h · Parque da Cidade",
    titulo: "O encontro",
    texto: "Estacionamento 10. Gente de todos os níveis, aquecendo junto.",
    marca: "Aquecimento conduzido ou espaço assinado pela marca.",
  },
  {
    quando: "Na pista",
    titulo: "A corrida",
    texto: "Pelotões de 4, 6 e 8 km, do iniciante ao mais rápido. Ninguém corre sozinho.",
    marca: "Percurso, pelotão ou desafio temático.",
  },
  {
    quando: "Depois",
    titulo: "O pós-treino",
    texto: "Hidratação, conversa e foto. O momento mais aberto da manhã.",
    marca: "Amostragem, recovery, hidratação, café.",
  },
  {
    quando: "Nas redes",
    titulo: "O compartilhamento",
    texto: "Stories, marcações e o grupo comentando o sábado até o próximo.",
    marca: "Conteúdo, collab e registro da ativação.",
  },
];

export function S02GrandeIdeia({ modo }: SlideProps) {
  const [sel, setSel] = useState(4);
  const m = SABADO[sel];
  return (
    <>
      <Entra>
        <Kicker>A grande ideia</Kicker>
      </Entra>
      <div style={{ marginTop: "1.6em" }}>
        <TituloMascara
          className="fs-h1"
          linhas={["As marcas querem fazer parte", "da vida das pessoas.", "Nós já fazemos."]}
          destaque={[2]}
        />
      </div>

      <div className="s-corpo" style={{ justifyContent: "flex-end", marginTop: "2em" }}>
        <Entra atraso={0.45} className="linha entre" style={{ marginBottom: "1.4em" }}>
          <span className="fs-small peso-6" style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Um sábado com a SOMMA · 6 pontos de contato
          </span>
          <span className="fs-micro c-3 so-palco">Toque em cada momento</span>
        </Entra>

        <Entra atraso={0.55}>
          <div
            role="tablist"
            aria-label="Momentos de um sábado"
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: modo === "palco" ? "repeat(6, 1fr)" : "repeat(3, 1fr)",
              gap: modo === "palco" ? 0 : 12,
            }}
          >
            {modo === "palco" && (
              <span
                aria-hidden="true"
                style={{ position: "absolute", left: "8.3%", right: "8.3%", top: "0.9em", height: 1, background: "var(--linha)" }}
              />
            )}
            {SABADO.map((s, i) => {
              const on = i === sel;
              return (
                <button
                  key={s.titulo}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSel(i)}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: modo === "palco" ? "center" : "flex-start",
                    gap: "0.7em",
                    background: "none",
                    border: 0,
                    padding: 0,
                    cursor: "pointer",
                    color: "inherit",
                    font: "inherit",
                    textAlign: modo === "palco" ? "center" : "left",
                  }}
                >
                  <span
                    style={{
                      width: "1.8em",
                      height: "1.8em",
                      borderRadius: "50%",
                      background: on ? "var(--laranja)" : "var(--papel)",
                      border: `2px solid ${on ? "var(--laranja)" : "var(--ponto-medio)"}`,
                      transition: "all .3s",
                      transform: on ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                  <span className="fs-micro c-3" style={{ letterSpacing: "0.06em" }}>
                    {s.quando}
                  </span>
                  <span className="fs-body peso-6" style={{ color: on ? "var(--texto-1)" : "var(--texto-2)" }}>
                    {s.titulo}
                  </span>
                </button>
              );
            })}
          </div>
        </Entra>

        <Entra atraso={0.7}>
          <div className="cartao grade-2" style={{ marginTop: "1.6em", gap: "2.4em", alignItems: "start" }} role="tabpanel">
            <AnimatePresence mode="wait">
              <motion.p
                key={`t${sel}`}
                className="fs-lead"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {m.texto}
              </motion.p>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div
                key={`m${sel}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, delay: 0.05 }}
                className="pilha g-04"
              >
                <span className="kicker">Onde uma marca cabe</span>
                <span className="fs-lead peso-6">{m.marca}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </Entra>

        <Entra atraso={0.85} className="fs-body c-2" style={{ marginTop: "1.4em" }}>
          Ninguém conhece a SOMMA só por uma tela. As pessoas vêm, participam, compartilham e voltam.
        </Entra>
      </div>
    </>
  );
}

/* 03 · Quem somos: cada ponto é uma pessoa -------------------------------- */
export function S03QuemSomos({ modo }: SlideProps) {
  const b = COMUNIDADE.base;
  const fatos = [
    ["Todo sábado", "às 7h"],
    ["Parque da Cidade", "Estacionamento 10, Brasília"],
    ["Gratuito", "aberto a todos os níveis"],
    ["Pelotões", "de 4, 6 e 8 km"],
  ];
  return (
    <div className="s-corpo grade-2" style={{ alignItems: "stretch" }}>
      <div className="pilha g-2" style={{ justifyContent: "center" }}>
        <Entra>
          <Kicker>Quem somos</Kicker>
        </Entra>
        <TituloMascara className="fs-h1" linhas={["Uma comunidade.", "Milhares de", "conexões."]} destaque={[1, 2]} />
        <Entra atraso={0.4} className="fs-lead c-2 bonito" style={{ maxWidth: "26em" }}>
          A SOMMA nasceu em Brasília, no Parque da Cidade. Toda semana, gente de todos os níveis se encontra para correr junto. A corrida
          é o motivo. O pertencimento é o que faz voltar.
        </Entra>
        <Entra atraso={0.55}>
          <dl className="grade-2" style={{ gap: "1.2em 2em", alignItems: "start" }}>
            {fatos.map(([a, b2]) => (
              <div key={a} className="regua" style={{ paddingTop: "0.9em" }}>
                <dt className="fs-body peso-6">{a}</dt>
                <dd className="fs-small c-3">{b2}</dd>
              </div>
            ))}
          </dl>
        </Entra>
      </div>

      <div className="pilha g-1" style={{ minHeight: 0 }}>
        <Entra atraso={0.2} className="linha entre" style={{ alignItems: "flex-end" }}>
          <div>
            <span className="t-numero fs-h1" style={{ display: "block" }}>
              {fmtInt(b.pessoasNaBase)}
            </span>
            <span className="fs-small c-2">pessoas na base da SOMMA. Cada ponto é uma delas.</span>
          </div>
        </Entra>
        <div style={{ flex: 1, minHeight: modo === "palco" ? 0 : 320, position: "relative" }}>
          <CampoPessoas
            total={b.pessoasNaBase}
            destaque={b.pessoasComParticipacao}
            rotulo={`${fmtInt(b.pessoasNaBase)} pontos, um por pessoa; ${fmtInt(b.pessoasComParticipacao)} em laranja já confirmaram presença em encontros`}
          />
        </div>
        <Entra atraso={0.6} className="pilha g-04 fs-small">
          <span className="linha g-08">
            <i style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--laranja)", flex: "none" }} />
            <span>
              <strong>{fmtInt(b.pessoasComParticipacao)}</strong> já confirmaram presença em encontros desde{" "}
              {fmtData(COMUNIDADE.historico.inicio)}
            </span>
          </span>
          <span className="linha g-08 c-2">
            <i style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--ponto-medio)", flex: "none" }} />
            <span>{fmtInt(b.pessoasNaBase - b.pessoasComParticipacao)} cadastradas no site, ainda sem check-in registrado</span>
          </span>
        </Entra>
        <Entra atraso={0.7}>
          <Fonte meta={META_COMUNIDADE} extra="base = cadastro do site + quem já fez check-in" />
        </Entra>
      </div>
    </div>
  );
}
