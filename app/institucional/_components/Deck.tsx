"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, LayoutDashboard, LayoutGrid, Maximize, Minimize, NotebookText, X } from "lucide-react";
import { ATOS, SLIDES } from "../_data/slides";
import { Painel } from "./painel/Painel";
import { S01Abertura, S02GrandeIdeia, S03QuemSomos } from "./slides/ato1";
import { S04Dimensoes, S05AudienciaDigital, S06Distribuicao, S07Perfil, S08AlemDoDigital } from "./slides/ato2";
import { S09ExposicaoExperiencia, S10OQueCriar, S11Cases } from "./slides/ato3";
import { S12LinhaDoTempo, S13Inteligencia, S14Painel, S15Modelo, S16Chamada } from "./slides/ato4";
import { Logo, SlideCtx, type Modo, type SlideProps } from "./ui";

const COMPONENTES: Record<string, ComponentType<SlideProps>> = {
  abertura: S01Abertura,
  "grande-ideia": S02GrandeIdeia,
  "quem-somos": S03QuemSomos,
  dimensoes: S04Dimensoes,
  "audiencia-digital": S05AudienciaDigital,
  distribuicao: S06Distribuicao,
  perfil: S07Perfil,
  "alem-do-digital": S08AlemDoDigital,
  "exposicao-experiencia": S09ExposicaoExperiencia,
  "o-que-criar": S10OQueCriar,
  cases: S11Cases,
  "linha-do-tempo": S12LinhaDoTempo,
  inteligencia: S13Inteligencia,
  painel: S14Painel,
  modelo: S15Modelo,
  chamada: S16Chamada,
};

const TOTAL = SLIDES.length;
const FUNDO: Record<string, string> = { escuro: "#000000", claro: "#f4f4f2", laranja: "#ff2c03" };
const nomeAto = (id: string) => ATOS.find((a) => a.id === id)?.nome ?? "";

/** Palco 16:9 no desktop/paisagem; leitura empilhada no celular em retrato. */
function useModo(): Modo | null {
  const [modo, setModo] = useState<Modo | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px) and (min-aspect-ratio: 6/5)");
    const atualizar = () => setModo(mq.matches ? "palco" : "leitura");
    atualizar();
    mq.addEventListener("change", atualizar);
    return () => mq.removeEventListener("change", atualizar);
  }, []);
  return modo;
}

function indiceDoHash(): number {
  const n = parseInt(window.location.hash.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n >= 1 && n <= TOTAL ? n - 1 : 0;
}

function interativo(alvo: EventTarget | null): boolean {
  return alvo instanceof Element && !!alvo.closest("button, a, input, select, textarea, label, [role=tab], [data-interativo]");
}

export function Deck() {
  const modo = useModo();
  const [atual, setAtual] = useState(0);
  const [direcao, setDirecao] = useState(1);
  const [visao, setVisao] = useState(false);
  const [notas, setNotas] = useState(false);
  const [painel, setPainel] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);
  const [ocioso, setOcioso] = useState(false);
  const [vistos, setVistos] = useState<Set<number>>(() => new Set([0]));
  const toque = useRef<{ x: number; y: number } | null>(null);
  const secoes = useRef<(HTMLElement | null)[]>([]);

  const irPara = useCallback(
    (i: number) => {
      const alvo = Math.max(0, Math.min(TOTAL - 1, i));
      setDirecao(alvo >= atual ? 1 : -1);
      setAtual(alvo);
      setVisao(false);
      if (modo === "leitura") secoes.current[alvo]?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [atual, modo],
  );
  const proximo = useCallback(() => irPara(atual + 1), [atual, irPara]);
  // Tela cheia.
  const alternarTelaCheia = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  }, []);

  const anterior = useCallback(() => irPara(atual - 1), [atual, irPara]);

  // Slide inicial pelo hash (#5), para recarregar sem perder o lugar.
  useEffect(() => {
    const i = indiceDoHash();
    setAtual(i);
    setVistos(new Set([i]));
    if (new URLSearchParams(window.location.search).get("painel") === "1") setPainel(true);
  }, []);

  useEffect(() => {
    if (modo === null) return;
    window.history.replaceState(null, "", `#${atual + 1}`);
    setVistos((v) => (v.has(atual) ? v : new Set(v).add(atual)));
  }, [atual, modo]);

  // No modo leitura, o slide "atual" é o que está na tela.
  useEffect(() => {
    if (modo !== "leitura") return;
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.indice);
          setVistos((v) => (v.has(i) ? v : new Set(v).add(i)));
          if (e.intersectionRatio >= 0.35) setAtual(i);
        }
      },
      { threshold: [0.12, 0.35] },
    );
    secoes.current.forEach((s) => s && io.observe(s));
    const i = indiceDoHash();
    if (i > 0) secoes.current[i]?.scrollIntoView({ block: "start" });
    return () => io.disconnect();
  }, [modo]);

  // Teclado.
  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        if (painel) setPainel(false);
        else if (visao) setVisao(false);
        else if (notas) setNotas(false);
        return;
      }
      if (painel) return;
      const k = e.key.toLowerCase();
      if (modo === "palco" && ["arrowright", "pagedown", " ", "arrowdown", "enter"].includes(k)) {
        if (k === "enter" && interativo(t)) return;
        if (k === " " && interativo(t)) return;
        e.preventDefault();
        proximo();
      } else if (modo === "palco" && ["arrowleft", "pageup", "arrowup", "backspace"].includes(k)) {
        e.preventDefault();
        anterior();
      } else if (k === "home") irPara(0);
      else if (k === "end") irPara(TOTAL - 1);
      else if (k === "f") alternarTelaCheia();
      else if (k === "g" || k === "o") setVisao((v) => !v);
      else if (k === "n") setNotas((v) => !v);
      else if (k === "p") setPainel(true);
      else if (/^[1-9]$/.test(k) && !visao) irPara(Number(k) - 1);
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [alternarTelaCheia, anterior, irPara, modo, notas, painel, proximo, visao]);

  useEffect(() => {
    const f = () => setTelaCheia(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);

  // Controles somem quando o mouse para (palco).
  useEffect(() => {
    if (modo !== "palco") return;
    let t: ReturnType<typeof setTimeout>;
    const mexeu = () => {
      setOcioso(false);
      clearTimeout(t);
      t = setTimeout(() => setOcioso(true), 2600);
    };
    mexeu();
    window.addEventListener("mousemove", mexeu);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousemove", mexeu);
    };
  }, [modo]);

  // Painel aberto: trava a rolagem da página por trás.
  useEffect(() => {
    document.body.style.overflow = painel || visao ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [painel, visao]);

  if (modo === null) return <div style={{ position: "fixed", inset: 0, background: "#000" }} />;

  const info = SLIDES[atual];
  const props = (i: number): SlideProps => ({
    ativo: modo === "palco" ? i === atual : vistos.has(i),
    modo,
    abrirPainel: () => setPainel(true),
    irPara,
  });

  return (
    <MotionConfig reducedMotion="user">
      <div className={`modo-${modo}`}>
        {modo === "palco" ? (
          <div
            className="inst-palco"
            style={{ backgroundColor: FUNDO[info.tema] }}
            onClick={(e) => {
              if (interativo(e.target) || window.getSelection()?.toString()) return;
              if (e.shiftKey) anterior();
              else proximo();
            }}
            onTouchStart={(e) => (toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
            onTouchEnd={(e) => {
              const ini = toque.current;
              toque.current = null;
              if (!ini) return;
              const dx = e.changedTouches[0].clientX - ini.x;
              const dy = e.changedTouches[0].clientY - ini.y;
              if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? proximo : anterior)();
            }}
          >
            <div className={`inst-quadro tema-${info.tema}`} aria-roledescription="apresentação">
              <AnimatePresence initial={false} custom={direcao}>
                <motion.section
                  key={info.id}
                  className={`inst-slide tema-${info.tema}`}
                  aria-label={`Slide ${atual + 1} de ${TOTAL}: ${info.titulo}`}
                  custom={direcao}
                  initial={{ opacity: 0, x: direcao * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direcao * -40 }}
                  transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
                >
                  <SlideCtx.Provider value={{ ativo: true, modo }}>
                    {(() => {
                      const C = COMPONENTES[info.id];
                      return <C {...props(atual)} />;
                    })()}
                  </SlideCtx.Provider>
                </motion.section>
              </AnimatePresence>

              <div className="inst-progresso" aria-hidden="true">
                {SLIDES.map((s, i) => (
                  <span key={s.id} data-feito={i <= atual ? "true" : "false"} />
                ))}
              </div>

              <div className="inst-rodape">
                <div className="ato">
                  <span>{nomeAto(info.ato)}</span>
                </div>
                <nav className="inst-controles" data-oculto={ocioso && !notas ? "true" : "false"} aria-label="Navegação da apresentação">
                  <button type="button" onClick={anterior} disabled={atual === 0} aria-label="Slide anterior">
                    <ChevronLeft />
                  </button>
                  <span className="inst-contador" aria-live="polite">
                    {String(atual + 1).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
                  </span>
                  <button type="button" onClick={proximo} disabled={atual === TOTAL - 1} aria-label="Próximo slide">
                    <ChevronRight />
                  </button>
                  <button type="button" onClick={() => setVisao(true)} aria-label="Visão geral dos slides (G)" title="Visão geral (G)">
                    <LayoutGrid />
                  </button>
                  <button type="button" onClick={() => setNotas((v) => !v)} aria-label="Notas do apresentador (N)" title="Notas (N)" aria-pressed={notas}>
                    <NotebookText />
                  </button>
                  <button type="button" onClick={() => setPainel(true)} aria-label="Abrir painel da comunidade (P)" title="Painel (P)">
                    <LayoutDashboard />
                  </button>
                  <button type="button" onClick={alternarTelaCheia} aria-label={telaCheia ? "Sair da tela cheia (F)" : "Tela cheia (F)"} title="Tela cheia (F)">
                    {telaCheia ? <Minimize /> : <Maximize />}
                  </button>
                </nav>
              </div>
            </div>
          </div>
        ) : (
          <>
            <header className="inst-topo-leitura">
              <Logo tom="claro" />
              <div className="linha g-1" style={{ fontSize: 13 }}>
                <span style={{ fontFeatureSettings: '"tnum"', opacity: 0.8 }}>
                  {String(atual + 1).padStart(2, "0")} / {TOTAL}
                </span>
                <button
                  type="button"
                  onClick={() => setVisao(true)}
                  aria-label="Índice dos slides"
                  style={{ width: 40, height: 40, display: "grid", placeItems: "center", background: "none", border: 0, color: "#fff" }}
                >
                  <LayoutGrid size={20} />
                </button>
              </div>
              <span className="barra" style={{ width: `${((atual + 1) / TOTAL) * 100}%` }} />
            </header>
            <main className="inst-quadro">
              {SLIDES.map((s, i) => {
                const C = COMPONENTES[s.id];
                return (
                  <section
                    key={s.id}
                    ref={(el) => {
                      secoes.current[i] = el;
                    }}
                    data-indice={i}
                    id={`slide-${i + 1}`}
                    className={`inst-slide tema-${s.tema}`}
                    aria-label={`Slide ${i + 1} de ${TOTAL}: ${s.titulo}`}
                  >
                    <SlideCtx.Provider value={{ ativo: vistos.has(i), modo }}>
                      <C {...props(i)} />
                    </SlideCtx.Provider>
                  </section>
                );
              })}
            </main>
          </>
        )}

        {/* Notas do apresentador */}
        {notas && modo === "palco" && !painel && (
          <aside className="inst-notas" aria-label="Notas do apresentador">
            <div>
              <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.55, marginBottom: 6 }}>
                Notas · {String(atual + 1).padStart(2, "0")} {info.titulo}
              </div>
              <p>{info.notas}</p>
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, maxWidth: 260 }}>
              {atual < TOTAL - 1 ? (
                <>
                  Próximo:
                  <br />
                  <strong style={{ opacity: 1 }}>{SLIDES[atual + 1].titulo}</strong>
                </>
              ) : (
                "Último slide"
              )}
              <button
                type="button"
                onClick={() => setNotas(false)}
                aria-label="Fechar notas"
                style={{ display: "block", marginTop: 10, background: "none", border: 0, color: "#fff", cursor: "pointer", textDecoration: "underline" }}
              >
                Fechar (N)
              </button>
            </div>
          </aside>
        )}

        {/* Visão geral */}
        <AnimatePresence>
          {visao && (
            <motion.div
              className="inst-camada"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-label="Visão geral dos slides"
            >
              <button
                type="button"
                onClick={() => setVisao(false)}
                aria-label="Fechar visão geral"
                style={{ position: "fixed", top: 16, right: 16, width: 44, height: 44, borderRadius: 999, border: "1px solid rgba(255,255,255,.2)", background: "none", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", zIndex: 2 }}
              >
                <X size={20} />
              </button>
              <div className="inst-visao">
                {SLIDES.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-current={i === atual}
                    onClick={() => irPara(i)}
                    style={{ background: FUNDO[s.tema], color: s.tema === "escuro" ? "#fff" : "#0a0a0a" }}
                  >
                    <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.6 }}>
                      {String(i + 1).padStart(2, "0")} · {nomeAto(s.ato)}
                    </span>
                    <span className="t-display" style={{ fontSize: 17, lineHeight: 1.05 }}>
                      {s.titulo}
                    </span>
                  </button>
                ))}
              </div>
              <p style={{ textAlign: "center", fontSize: 12, opacity: 0.5, paddingBottom: 32 }}>
                ← → navegar · F tela cheia · G visão geral · N notas · P painel · Esc fechar
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Painel da comunidade por cima da apresentação: fechar volta ao mesmo slide. */}
        <AnimatePresence>
          {painel && (
            <motion.div
              className="inst-painel-camada"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Painel da comunidade"
            >
              <Painel aoVoltar={() => setPainel(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
