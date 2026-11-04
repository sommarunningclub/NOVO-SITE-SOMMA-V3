"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, LayoutDashboard, Mail, MessageCircle } from "lucide-react";
import { COMUNIDADE, TOTAL } from "../../_data/comunidade";
import { CONTATO, linkEmail, linkWhatsapp } from "../../_data/contato";
import { DURACOES, FATORES_PARCERIA, NOTA_LINHA_DO_TEMPO, NOTA_SABADOS, PROCESSO, ROTULO_MARCO, type Marco, type TipoMarco } from "../../_data/parceria";
import { fmtInt, fmtPct } from "../../_lib/formato";
import { DetalheEvento, LinhaKpis, SeloFonte, eventosDoRecorte, estadoInicial, kpisDoRecorte, type EstadoPainel } from "../painel/Painel";
import { GraficoEventos, Legenda } from "../painel/graficos";
import { SimboloMontagem } from "../pontos";
import { Entra, Kicker, Logo, TituloMascara, useSlide, type SlideProps } from "../ui";

/* 12 · Linha do tempo da parceria ------------------------------------------ */
const ESTILO_MARCO: Record<TipoMarco, { faixa: number; tamanho: string; fundo: string; borda?: string; raio: string }> = {
  ativacao: { faixa: 1, tamanho: "1.15em", fundo: "var(--laranja)", raio: "50%" },
  especial: { faixa: 1, tamanho: "1.7em", fundo: "transparent", borda: "3px solid var(--laranja)", raio: "50%" },
  conteudo: { faixa: 2, tamanho: "0.8em", fundo: "var(--tinta)", raio: "50%" },
  leitura: { faixa: 3, tamanho: "0.95em", fundo: "var(--tinta)", raio: "2px" },
};
const FAIXAS = ["Encontros de sábado", "Ativações e eventos", "Conteúdo digital", "Leituras"];

export function S12LinhaDoTempo({ modo }: SlideProps) {
  const [sel, setSel] = useState(1);
  const [marco, setMarco] = useState<Marco | null>(null);
  const d = DURACOES[sel];
  const pos = (semana: number) => `${((semana - 1) / (d.semanas - 1)) * 100}%`;
  const conta = (t: TipoMarco) => d.marcos.filter((m) => m.tipo === t).length;
  return (
    <>
      <div className="s-topo quebra">
        <div className="pilha g-1">
          <Entra>
            <Kicker>Recorrência</Kicker>
          </Entra>
          <TituloMascara className="fs-h1" linhas={["Uma marca não se constrói", "em um único sábado."]} destaque={[1]} />
        </div>
        <Entra atraso={0.3}>
          <div className="segmentos" role="tablist" aria-label="Duração da parceria">
            {DURACOES.map((x, i) => (
              <button key={x.id} role="tab" aria-selected={i === sel} onClick={() => { setSel(i); setMarco(null); }}>
                {x.titulo}
              </button>
            ))}
          </div>
        </Entra>
      </div>

      <div className="s-corpo" style={{ justifyContent: "center", gap: "1.6em", marginTop: "1.4em" }}>
        <Entra atraso={0.35}>
          <AnimatePresence mode="wait">
            <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="linha entre g-2 quebra" style={{ alignItems: "flex-end" }}>
              <div>
                <span className="t-display fs-h2" style={{ display: "block" }}>{d.subtitulo}</span>
                <span className="fs-body c-2">{d.ideal}</span>
              </div>
              <span className="selo">Ilustrativo</span>
            </motion.div>
          </AnimatePresence>
        </Entra>

        <Entra atraso={0.45}>
          <div style={{ display: "grid", gridTemplateColumns: modo === "palco" ? "11em 1fr" : "1fr", gap: modo === "palco" ? "0 1.6em" : 6 }} data-interativo>
            {FAIXAS.map((f, faixa) => (
              <div key={f} style={{ display: "contents" }}>
                <span className="fs-small c-2" style={{ alignSelf: "center", padding: modo === "palco" ? "1em 0" : "8px 0 0" }}>{f}</span>
                <div style={{ position: "relative", height: modo === "palco" ? "3.2em" : 30, borderTop: "1px solid var(--linha)" }}>
                  {faixa === 0 &&
                    Array.from({ length: d.semanas }, (_, s) => (
                      <motion.span
                        key={`${d.id}-s${s}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: s * (0.6 / d.semanas), duration: 0.3 }}
                        style={{
                          position: "absolute",
                          left: pos(s + 1),
                          top: "50%",
                          width: "0.55em",
                          height: "0.55em",
                          marginLeft: "-0.275em",
                          marginTop: "-0.275em",
                          borderRadius: "50%",
                          background: "var(--ponto-medio)",
                        }}
                      />
                    ))}
                  {d.marcos
                    .filter((m) => ESTILO_MARCO[m.tipo].faixa === faixa)
                    .map((m, i) => {
                      const e = ESTILO_MARCO[m.tipo];
                      const on = marco === m;
                      return (
                        <motion.button
                          key={`${d.id}-${m.tipo}-${i}`}
                          type="button"
                          aria-label={`${ROTULO_MARCO[m.tipo]}: ${m.rotulo}, semana ${Math.round(m.semana)}`}
                          onMouseEnter={() => setMarco(m)}
                          onFocus={() => setMarco(m)}
                          onClick={() => setMarco(m)}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: on ? 1.3 : 1, opacity: 1 }}
                          transition={{ delay: on ? 0 : 0.3 + i * 0.05, duration: 0.3 }}
                          style={{
                            position: "absolute",
                            left: pos(m.semana),
                            top: "50%",
                            width: e.tamanho,
                            height: e.tamanho,
                            marginLeft: `calc(${e.tamanho} / -2)`,
                            marginTop: `calc(${e.tamanho} / -2)`,
                            borderRadius: e.raio,
                            background: e.fundo,
                            border: e.borda ?? 0,
                            padding: 0,
                            cursor: "pointer",
                          }}
                        />
                      );
                    })}
                </div>
              </div>
            ))}
            <span className="so-palco" />
            <div style={{ position: "relative", height: "1.6em", borderTop: "1px solid var(--linha)" }}>
              {Array.from({ length: d.meses }, (_, m) => (
                <span key={m} className="fs-micro c-3" style={{ position: "absolute", left: pos(1 + m * 4.33), top: "0.4em" }}>
                  {modo === "leitura" && d.meses > 6 ? (m % 3 === 0 ? `m${m + 1}` : "") : `mês ${m + 1}`}
                </span>
              ))}
            </div>
          </div>
        </Entra>

        <Entra atraso={0.55} className="linha entre g-2 quebra">
          <p className="fs-body" style={{ minHeight: "1.6em" }}>
            {marco ? (
              <>
                <strong>{ROTULO_MARCO[marco.tipo]}</strong> <span className="c-2">· {marco.rotulo} · semana {Math.round(marco.semana)}</span>
              </>
            ) : (
              <span className="c-3">Passe o mouse nos marcos da linha.</span>
            )}
          </p>
          <p className="fs-small c-2">
            {d.semanas} sábados · {conta("ativacao")} ativações · {conta("especial")} {conta("especial") === 1 ? "ação especial" : "ações especiais"} ·{" "}
            {conta("conteudo")} pautas de conteúdo · {conta("leitura")} {conta("leitura") === 1 ? "leitura" : "leituras"}
          </p>
        </Entra>
      </div>

      <Entra atraso={0.65} className="pilha g-04">
        <p className="fs-small peso-6">{NOTA_LINHA_DO_TEMPO}</p>
        <p className="fonte">{NOTA_SABADOS}</p>
      </Entra>
    </>
  );
}

/* 13 · Inteligência --------------------------------------------------------- */
export function S13Inteligencia({ abrirPainel, modo }: SlideProps) {
  const ret = COMUNIDADE.porSexo.todos.retencao.find((r) => r.dias === 180);
  const passos = [
    { t: "Inscrição", d: "Cada pessoa confirma presença pelo site, com cadastro próprio." },
    { t: "Check-in com QR", d: "A participação fica registrada evento a evento." },
    { t: "Base agregada", d: "Estreantes, recorrência e retenção, sem expor ninguém." },
    { t: "Leitura para a marca", d: "Relatórios por etapa, para ajustar a rota." },
  ];
  const kpis = [
    { v: fmtInt(COMUNIDADE.eventos.length), r: "eventos com check-in" },
    { v: fmtInt(TOTAL.participacoes), r: "confirmações" },
    { v: fmtInt(TOTAL.pessoas), r: "pessoas únicas" },
    { v: fmtPct(ret?.taxa ?? null, 0), r: "voltaram em até 180 dias" },
  ];
  return (
    <>
      <div className="grade-2" style={{ alignItems: "end" }}>
        <div className="pilha g-1">
          <Entra>
            <Kicker>Inteligência da comunidade</Kicker>
          </Entra>
          <TituloMascara className="fs-h1" linhas={["A experiência", "acontece na rua.", "A inteligência", "continua depois dela."]} destaque={[2, 3]} />
        </div>
        <Entra atraso={0.4} className="pilha g-1" style={{ alignItems: modo === "palco" ? "flex-end" : "flex-start" }}>
          <button type="button" className="botao botao-primario" onClick={abrirPainel} style={{ fontSize: "var(--fs-body)" }}>
            <LayoutDashboard size={18} /> Abrir painel da comunidade
          </button>
          <span className="fs-micro c-3">ou tecla P · Esc volta para a apresentação</span>
        </Entra>
      </div>

      <div className="s-corpo" style={{ justifyContent: "flex-end", gap: "2.2em", marginTop: "2em" }}>
        <Entra atraso={0.5}>
          <ol className="grade-4" style={{ gap: modo === "palco" ? "1.6em" : 16, position: "relative" }}>
            {passos.map((p, i) => (
              <li key={p.t} className="pilha g-08" style={{ position: "relative" }}>
                <span className="linha g-08">
                  <span
                    style={{
                      width: "2.2em",
                      height: "2.2em",
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      background: i === 3 ? "var(--laranja)" : "transparent",
                      border: `2px solid ${i === 3 ? "var(--laranja)" : "var(--ponto-medio)"}`,
                      color: i === 3 ? "#0a0a0a" : "var(--texto-1)",
                      fontWeight: 700,
                      flex: "none",
                    }}
                    className="fs-small"
                  >
                    {i + 1}
                  </span>
                  {i < 3 && <span className="so-palco" style={{ flex: 1, height: 1, background: "var(--linha)" }} />}
                </span>
                <span className="fs-lead peso-6">{p.t}</span>
                <span className="fs-small c-2">{p.d}</span>
              </li>
            ))}
          </ol>
        </Entra>
        <Entra atraso={0.65}>
          <div className="grade-4 regua" style={{ paddingTop: "1.4em", gap: modo === "palco" ? "1.6em" : 12 }}>
            {kpis.map((k) => (
              <div key={k.r}>
                <span className="t-numero fs-h2" style={{ display: "block" }}>
                  {k.v}
                </span>
                <span className="fs-small c-2">{k.r}</span>
              </div>
            ))}
          </div>
        </Entra>
        <Entra atraso={0.75}>
          <p className="fonte">
            Nenhum CPF, nome ou contato aparece no painel: só números agregados, e grupos com menos de {COMUNIDADE.privacidade.minimoCelula}{" "}
            pessoas não são exibidos.
          </p>
        </Entra>
      </div>
    </>
  );
}

/* 14 · Painel dentro do slide ---------------------------------------------- */
function useAltura<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [h, setH] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setH(Math.round(e.contentRect.height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, h] as const;
}

export function S14Painel({ abrirPainel, modo }: SlideProps) {
  const [e, setE] = useState<EstadoPainel>(() => ({ ...estadoInicial(), periodo: "tudo" }));
  const evs = useMemo(() => eventosDoRecorte(e), [e]);
  const k = useMemo(() => kpisDoRecorte(e, evs), [e, evs]);
  const evSel = e.evento ? COMUNIDADE.eventos.find((x) => x.id === e.evento) ?? null : null;
  const [refGrafico, altura] = useAltura<HTMLDivElement>();
  const periodos = [
    { id: "30d" as const, r: "30 dias" },
    { id: "90d" as const, r: "90 dias" },
    { id: "180d" as const, r: "180 dias" },
    { id: "tudo" as const, r: "Tudo" },
  ];
  return (
    <div className="pn-embutido s-corpo pilha g-1">
      <div className="linha entre g-1 quebra">
        <div className="pilha g-04">
          <Entra>
            <Kicker>Painel da comunidade</Kicker>
          </Entra>
          <Entra atraso={0.1}>
            <h2 className="t-display fs-h2">Quem vem, quem volta, quem estreia.</h2>
          </Entra>
        </div>
        <Entra atraso={0.15} className="linha g-1 quebra">
          <div className="segmentos" role="group" aria-label="Período">
            {periodos.map((p) => (
              <button key={p.id} type="button" aria-pressed={e.periodo === p.id} onClick={() => setE((s) => ({ ...s, periodo: p.id, evento: null }))}>
                {p.r}
              </button>
            ))}
          </div>
          <div className="segmentos" role="group" aria-label="Formato">
            {(
              [
                ["todos", "Todos"],
                ["sabado", "Sábados"],
                ["especial", "Outros"],
              ] as const
            ).map(([id, r]) => (
              <button key={id} type="button" aria-pressed={e.formato === id} onClick={() => setE((s) => ({ ...s, formato: id, evento: null }))}>
                {r}
              </button>
            ))}
          </div>
        </Entra>
      </div>

      <Entra atraso={0.25}>
        <LinhaKpis k={k} compacto />
      </Entra>

      <Entra atraso={0.35} className="pn-cartao pilha" style={{ flex: 1, minHeight: modo === "palco" ? 0 : undefined }}>
        <div className="pn-cartao-barra">
          <Legenda
            itens={[
              { cor: "var(--laranja)", rotulo: "Estreantes" },
              { cor: "var(--ponto-medio)", rotulo: "Já tinham vindo" },
            ]}
          />
          <span className="pn-rotulo">Clique numa coluna para ver o evento</span>
        </div>
        <div ref={refGrafico} style={{ flex: 1, minHeight: modo === "palco" ? 0 : 240 }}>
          {evSel ? (
            <DetalheEvento ev={evSel} sexo="todos" aoFechar={() => setE((s) => ({ ...s, evento: null }))} />
          ) : (
            <GraficoEventos
              eventos={evs}
              sexo="todos"
              vista="composicao"
              selecionado={e.evento}
              aoSelecionar={(id) => setE((s) => ({ ...s, evento: id }))}
              altura={Math.max(180, modo === "palco" ? altura : 240)}
            />
          )}
        </div>
      </Entra>

      <Entra atraso={0.45} className="linha entre g-1 quebra">
        <SeloFonte />
        <button type="button" className="botao botao-primario" onClick={abrirPainel}>
          Abrir painel completo <ArrowUpRight size={16} />
        </button>
      </Entra>
    </div>
  );
}

/* 15 · Modelo de parceria ---------------------------------------------------- */
export function S15Modelo({ modo }: SlideProps) {
  const [duracao, setDuracao] = useState<string | null>(null);
  const [fatores, setFatores] = useState<string[]>([]);
  const alternar = (f: string) => setFatores((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]));
  const mensagem = useMemo(() => {
    const partes = ["Olá! Vi a apresentação institucional da SOMMA Club e quero conversar sobre uma parceria."];
    if (duracao) partes.push(`Horizonte: ${duracao}.`);
    if (fatores.length) partes.push(`O que mais importa para nós: ${fatores.join(", ").toLowerCase()}.`);
    return partes.join(" ");
  }, [duracao, fatores]);
  const link = `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(mensagem)}`;
  return (
    <>
      <div className="pilha g-1">
        <Entra>
          <Kicker>Modelo de parceria</Kicker>
        </Entra>
        <TituloMascara className="fs-h1" linhas={["A sua marca. O seu objetivo.", "Uma experiência construída", "em conjunto."]} destaque={[2]} />
      </div>

      <div className="s-corpo grade-2" style={{ marginTop: "1.8em", alignItems: "stretch" }}>
        <div className="pilha g-2">
          <Entra atraso={0.3} className="pilha g-08">
            <span className="fs-micro c-3 peso-6" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
              1 · Horizonte
            </span>
            <div className="grade-3" style={{ gap: "0.8em" }}>
              {DURACOES.map((d) => {
                const on = duracao === d.titulo;
                return (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDuracao(on ? null : d.titulo)}
                    className="cartao pilha g-04"
                    style={{
                      textAlign: "left",
                      cursor: "pointer",
                      font: "inherit",
                      color: "inherit",
                      borderColor: on ? "var(--laranja)" : undefined,
                      background: on ? "var(--superficie)" : "transparent",
                      padding: "1.1em",
                    }}
                  >
                    <span className="t-numero fs-h2" style={{ color: on ? "var(--laranja)" : undefined }}>
                      {d.titulo}
                    </span>
                    <span className="fs-small c-2">{d.subtitulo}</span>
                  </button>
                );
              })}
            </div>
          </Entra>
          <Entra atraso={0.4} className="pilha g-08">
            <span className="fs-micro c-3 peso-6" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
              2 · O que molda a parceria
            </span>
            <div className="linha quebra" style={{ gap: "0.5em" }}>
              {FATORES_PARCERIA.map((f) => {
                const on = fatores.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={on}
                    onClick={() => alternar(f)}
                    className="selo"
                    style={{
                      cursor: "pointer",
                      font: "inherit",
                      fontSize: "var(--fs-small)",
                      padding: modo === "palco" ? "0.5em 0.95em" : "8px 12px",
                      background: on ? "var(--tinta)" : "transparent",
                      color: on ? "#fff" : "var(--texto-1)",
                      borderColor: on ? "var(--tinta)" : "var(--linha)",
                    }}
                  >
                    {on ? "✓ " : ""}
                    {f}
                  </button>
                );
              })}
            </div>
          </Entra>
          <Entra atraso={0.5} className="linha g-1 quebra mt-auto">
            <a className="botao botao-primario" href={link} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={16} /> Conversar sobre isso
            </a>
            <span className="fs-micro c-3">Leva o que você marcou para a conversa no WhatsApp.</span>
          </Entra>
        </div>

        <Entra atraso={0.45} className="pilha g-1">
          <span className="fs-micro c-3 peso-6" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
            3 · Como construímos juntos
          </span>
          <ol className="pilha">
            {PROCESSO.map((p) => (
              <li key={p.passo} className="linha g-1 regua" style={{ padding: "0.9em 0", alignItems: "baseline" }}>
                <span className="t-numero fs-h3 c-destaque" style={{ width: "1.8em", flex: "none" }}>
                  {p.passo}
                </span>
                <span className="pilha g-04">
                  <span className="fs-lead peso-6">{p.titulo}</span>
                  <span className="fs-small c-2">{p.texto}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="fs-small peso-6 mt-auto">Sem tabela de preço e sem pacote pronto: cada proposta nasce do objetivo da marca.</p>
        </Entra>
      </div>
    </>
  );
}

/* 16 · Chamada final ---------------------------------------------------------- */
export function S16Chamada({ modo }: SlideProps) {
  const { ativo } = useSlide();
  return (
    <>
      <div className="s-topo">
        <Entra>
          <Logo tom="preto" style={{ height: modo === "palco" ? "2.6em" : 28 }} />
        </Entra>
        <Entra atraso={0.1} className="so-palco">
          <span className="selo" style={{ color: "var(--texto-1)" }}>
            {CONTATO.encontro}
          </span>
        </Entra>
      </div>

      <div className="s-corpo grade-2 grade-2-l">
        <div className="pilha g-2">
          <TituloMascara
            className="fs-h1"
            linhas={["Sua marca pode aparecer", "em uma corrida.", "Ou fazer parte de", "uma comunidade."]}
            destaque={[]}
          />
          <Entra atraso={0.55} className="fs-lead bonito" style={{ maxWidth: "26em" }}>
            Vamos construir uma presença relevante no universo da corrida e do wellness.
          </Entra>
          <Entra atraso={0.7} className="linha g-1 quebra">
            <a
              className="botao"
              href={linkWhatsapp()}
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: "#0a0a0a", color: "#fff", borderColor: "#0a0a0a", fontSize: "var(--fs-body)" }}
            >
              <MessageCircle size={18} /> WhatsApp {CONTATO.whatsappExibicao}
            </a>
            <a className="botao" href={linkEmail()} style={{ borderColor: "rgba(10,10,10,.4)", fontSize: "var(--fs-body)" }}>
              <Mail size={18} /> {CONTATO.email}
            </a>
          </Entra>
          <Entra atraso={0.8} className="linha g-2 quebra fs-small c-2">
            <a href={CONTATO.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
              {CONTATO.instagram}
            </a>
            <span>{CONTATO.site}</span>
          </Entra>
        </div>
        <div style={{ height: modo === "palco" ? "100%" : 260, display: "grid", placeItems: "center" }}>
          <SimboloMontagem cor="#0a0a0a" style={{ width: modo === "palco" ? "72%" : "60%", height: "auto", maxHeight: "100%" }} />
        </div>
      </div>

      <motion.p
        className="t-display fs-h3"
        initial={{ opacity: 0 }}
        animate={{ opacity: ativo ? 1 : 0 }}
        transition={{ delay: ativo ? 1.2 : 0, duration: 0.8 }}
        style={{ borderTop: "1px solid var(--linha)", paddingTop: "0.9em" }}
      >
        SOMMA Club. Sua marca dentro de uma comunidade em movimento.
      </motion.p>
    </>
  );
}
