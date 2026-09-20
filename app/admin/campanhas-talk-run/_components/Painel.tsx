"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Etapa = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Status = "pendente" | "rascunho" | "agendado" | "enviando" | "enviado" | "cancelado";

interface LinhaPainel {
  etapa: Etapa;
  segmento: string;
  assunto: string;
  status: Status;
  enviadoEm: string | null;
  totalDestinatarios: number;
  aberturas: number;
  cliques: number;
  naoAbriram: number | null;
  agendadoPara: string | null;
  quandoPlanejado: string;
  publico: number;
}

interface DiaDaRegua {
  etapa: Etapa;
  variante: string;
  quando: string;
  rotulo: string;
  gancho: string;
}

interface Painel {
  campanha: string;
  evento: { nome: string; dataExtenso: string; local: string; largada: string; cupom: string; link: string };
  base: { total: number; porSegmento: Record<string, number> };
  calendario: DiaDaRegua[];
  linhas: LinhaPainel[];
  webhookConfigurado: boolean;
  problemasCalendario: string[];
}

const CORES: Record<Status, string> = {
  pendente: "rgba(242,240,236,0.4)",
  rascunho: "rgba(242,240,236,0.6)",
  agendado: "var(--somma)",
  enviando: "#facc15",
  enviado: "#4ade80",
  cancelado: "var(--evolve)",
};

const brasilia = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

/**
 * Data para dentro do input datetime-local, SEMPRE em Brasília.
 *
 * `toISOString().slice(0,16)` seria mais curto e estaria errado: daria UTC, e o
 * campo apareceria três horas atrás do que foi marcado. O locale sueco é o
 * atalho honesto para "AAAA-MM-DD HH:MM" sem montar a string na mão.
 */
const paraInput = (iso: string) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  })
    .format(new Date(iso))
    .replace(" ", "T");

const agoraEmBrasilia = () => paraInput(new Date().toISOString());

/** "dom 20/09 · 21:00", para o calendário ler como calendário. */
const diaLegivel = (local: string) => {
  const d = new Date(`${local}:00-03:00`);
  const semana = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short" }).replace(".", "");
  const data = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });
  return `${semana} ${data} · ${local.slice(11)}`;
};

/**
 * Painel da régua da Talk Run, organizado como CALENDÁRIO e não como lista de
 * 21 cartões (7 etapas x 3 segmentos).
 *
 * A unidade que o operador pensa é "o e-mail de terça", não "a etapa 3 do
 * segmento checkins". Então cada etapa é um dia, com um horário só, e as ações
 * (agendar, cancelar, disparar) valem para todos os segmentos daquele dia de
 * uma vez. Os segmentos aparecem dentro do dia, só para leitura de status e
 * números. A API continua granular por segmento; quem agrupa é esta tela.
 */
export function PainelTalkRun() {
  const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [novoEmail, setNovoEmail] = useState("");
  const [novoNome, setNovoNome] = useState("");
  /** Horário por etapa, no formato do input (hora de Brasília). */
  const [quandos, setQuandos] = useState<Record<number, string>>({});

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/campanhas-talk-run/painel");
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Falha ao carregar."); return; }
      setPainel(data as Painel);
      setErro(null);
    } catch {
      setErro("Falha de conexão.");
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  const linhasDa = (etapa: Etapa) => (painel?.linhas ?? []).filter((l) => l.etapa === etapa);
  const comPublico = (etapa: Etapa) => linhasDa(etapa).filter((l) => l.publico > 0);

  /** O horário que vale para a etapa: o digitado, o já agendado, ou o planejado. */
  const quandoDa = (dia: DiaDaRegua) => {
    if (quandos[dia.etapa]) return quandos[dia.etapa];
    const agendada = linhasDa(dia.etapa).find((l) => l.agendadoPara);
    return agendada?.agendadoPara ? paraInput(agendada.agendadoPara) : dia.quando;
  };

  async function sincronizar() {
    if (!confirm("Puxar cadastro_site + checkins para esta campanha, sem duplicados? Não envia nada.")) return;
    setOcupado("sync");
    setErro(null);
    try {
      const res = await fetch("/api/campanhas-talk-run/sincronizar", { method: "POST" });
      const data = await res.json();
      if (!res.ok) setErro(data.error ?? "Falha ao sincronizar.");
      else {
        setAviso(
          `Base sincronizada: ${data.cadastroSite} de cadastro_site + ${data.checkins} de checkins = ${data.total} ` +
          `contatos novos nesta campanha. ${data.removidosPorCruzamento} duplicados entre as duas tabelas ficaram de fora.`
        );
        await carregar();
      }
    } finally {
      setOcupado(null);
    }
  }

  async function adicionarContato(e: React.FormEvent) {
    e.preventDefault();
    if (!novoEmail) return;
    setOcupado("contato");
    try {
      const res = await fetch("/api/campanhas-talk-run/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: novoEmail, nome: novoNome || null }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error ?? "Falha ao adicionar.");
      else {
        setNovoEmail("");
        setNovoNome("");
        await carregar();
      }
    } finally {
      setOcupado(null);
    }
  }

  /** Aplica o calendário inteiro, com os horários que estão na tela. */
  async function agendarRegua() {
    if (!painel) return;
    const horarios: Record<string, string> = {};
    for (const dia of painel.calendario) horarios[String(dia.etapa)] = quandoDa(dia);

    const resumo = painel.calendario.map((d) => `  ${d.rotulo}: ${diaLegivel(horarios[String(d.etapa)])}`).join("\n");
    if (!confirm(
      `Agendar a régua inteira?\n\n${resumo}\n\n` +
      `Vai para ${painel.base.total} contatos por etapa. Horários já passados e etapas já enviadas são pulados. ` +
      `Tudo pode ser cancelado aqui até a hora de cada envio.`
    )) return;

    setOcupado("regua");
    setErro(null);
    setAviso(null);
    try {
      const res = await fetch("/api/campanhas-talk-run/agendar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horarios }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Falha ao agendar a régua."); return; }

      /* Só mostra os pulos que o operador precisa ver. Segmento vazio é ruído:
         o segmento `manual` quase sempre está vazio e isso não é problema. */
      const relevantes = (data.linhas as { etapa: number; segmento: string; resultado: string; motivo?: string }[])
        .filter((l) => l.resultado === "pulado" && l.motivo !== "Segmento sem ninguém na base.");
      setAviso(
        `${data.agendadas} envio(s) agendado(s).` +
        (relevantes.length ? `\n\nPulados:\n${relevantes.map((l) => `  etapa ${l.etapa} / ${l.segmento}: ${l.motivo}`).join("\n")}` : "")
      );
      setQuandos({});
      await carregar();
    } finally {
      setOcupado(null);
    }
  }

  async function agendarEtapa(dia: DiaDaRegua) {
    const quando = quandoDa(dia);
    const alvos = comPublico(dia.etapa).filter((l) => ["pendente", "rascunho", "cancelado", "agendado"].includes(l.status));
    if (alvos.length === 0) { alert("Nada para agendar nesta etapa: nenhum segmento com público e livre."); return; }
    if (!confirm(`Agendar ${dia.rotulo} para ${diaLegivel(quando)} (Brasília)?`)) return;

    setOcupado(`agendar:${dia.etapa}`);
    setErro(null);
    try {
      const falhas: string[] = [];
      for (const l of alvos) {
        const res = await fetch("/api/campanhas-talk-run/agendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segmento: l.segmento, etapa: l.etapa, quando }),
        });
        if (!res.ok) falhas.push(`${l.segmento}: ${(await res.json()).error ?? "falhou"}`);
      }
      if (falhas.length) setErro(falhas.join("\n"));
      setQuandos((q) => { const n = { ...q }; delete n[dia.etapa]; return n; });
      await carregar();
    } finally {
      setOcupado(null);
    }
  }

  async function cancelarEtapa(dia: DiaDaRegua) {
    const alvos = linhasDa(dia.etapa).filter((l) => l.status === "agendado");
    if (!confirm(`Cancelar o agendamento de ${dia.rotulo}? Os outros dias continuam agendados.`)) return;

    setOcupado(`agendar:${dia.etapa}`);
    setErro(null);
    try {
      for (const l of alvos) {
        await fetch(`/api/campanhas-talk-run/agendar?segmento=${l.segmento}&etapa=${l.etapa}`, { method: "DELETE" });
      }
      await carregar();
    } finally {
      setOcupado(null);
    }
  }

  /**
   * Dispara a etapa AGORA em todos os segmentos com público.
   *
   * Calcula a prévia real de cada segmento ANTES de pedir confirmação, em vez
   * de mostrar o número do painel: é o número que vai de fato receber, com o
   * descadastro de agora há pouco já descontado.
   */
  async function dispararEtapa(dia: DiaDaRegua) {
    const alvos = comPublico(dia.etapa).filter((l) => ["pendente", "rascunho", "cancelado"].includes(l.status));
    if (alvos.length === 0) { alert("Nada para disparar: nenhum segmento livre com público nesta etapa."); return; }

    setOcupado(`disparo:${dia.etapa}`);
    setErro(null);
    try {
      const previas: { segmento: string; total: number }[] = [];
      for (const l of alvos) {
        const res = await fetch(`/api/campanhas-talk-run/previa?segmento=${l.segmento}&etapa=${l.etapa}`);
        const data = await res.json();
        if (!res.ok) { setErro(`${l.segmento}: ${data.error}`); return; }
        previas.push({ segmento: l.segmento, total: data.total });
      }
      const total = previas.reduce((s, p) => s + p.total, 0);
      const texto =
        `${dia.rotulo.toUpperCase()}\n\n` +
        previas.map((p) => `  ${p.segmento}: ${p.total}`).join("\n") +
        `\n  TOTAL: ${total} pessoas\n\nAssunto: ${alvos[0].assunto}\n\n` +
        `Isto dispara AGORA e NÃO tem volta.\n\nConfirmar?`;
      if (!confirm(texto)) return;

      const resultados: string[] = [];
      for (const l of alvos) {
        const res = await fetch("/api/campanhas-talk-run/disparar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segmento: l.segmento, etapa: l.etapa, confirmar: true }),
        });
        const data = await res.json();
        resultados.push(res.ok
          ? `${l.segmento}: ${data.enviados} enviados, ${data.falhas} falhas`
          : `${l.segmento}: ERRO ${data.error}`);
      }
      setAviso(`${dia.rotulo} disparada.\n\n${resultados.join("\n")}`);
      await carregar();
    } finally {
      setOcupado(null);
    }
  }

  if (erro && !painel) return <p className="dst-wrap py-10 text-[color:var(--evolve)]">{erro}</p>;
  if (!painel) return <p className="dst-wrap py-10 text-[color:rgba(242,240,236,0.5)]">Carregando...</p>;

  const agendadas = new Set(painel.linhas.filter((l) => l.status === "agendado").map((l) => l.etapa)).size;
  const enviadas = new Set(painel.linhas.filter((l) => l.status === "enviado").map((l) => l.etapa)).size;

  return (
    <main className="dst-grain min-h-[100svh] py-10 md:py-14">
      <div className="dst-wrap">
        <p className="dst-label text-[color:var(--somma)]">Sete disparos · um por dia até a véspera</p>
        <h1 className="dst-display mt-3 text-[clamp(1.8rem,7vw,3.5rem)] leading-[0.88]">
          TALK RUN
          <br />
          2026
        </h1>
        <p className="mt-4 text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.7)]">
          {painel.evento.dataExtenso}, largada {painel.evento.largada}, {painel.evento.local}. Cupom{" "}
          <strong className="text-[color:var(--paper)]">{painel.evento.cupom}</strong>.{" "}
          <a href={painel.evento.link} target="_blank" rel="noreferrer" className="underline">Página de inscrição</a>
        </p>

        {painel.problemasCalendario.length > 0 && (
          <div className="mt-7 border border-[color:var(--evolve)] bg-[rgba(226,33,28,0.1)] p-5">
            <p className="dst-label mb-2 text-[color:var(--evolve)]">Calendário inconsistente</p>
            {painel.problemasCalendario.map((p) => (
              <p key={p} className="text-[0.9rem] leading-relaxed text-[color:rgba(242,240,236,0.75)]">{p}</p>
            ))}
          </div>
        )}
        {!painel.webhookConfigurado && (
          <div className="mt-4 border border-[color:var(--evolve)] bg-[rgba(226,33,28,0.1)] p-5">
            <p className="dst-label text-[color:var(--evolve)]">Webhook não configurado: aberturas e cliques não serão contados</p>
          </div>
        )}

        {/* ── Base ─────────────────────────────────────────────────────── */}
        <section className="dst-panel mt-8 p-5">
          <p className="dst-label text-[color:rgba(242,240,236,0.45)]">Base · cadastro_site + checkins, sem duplicados</p>
          <p className="mt-2 text-[1.6rem] font-bold leading-none">{painel.base.total}</p>
          <p className="dst-label mt-2 text-[color:rgba(242,240,236,0.45)]">
            {Object.entries(painel.base.porSegmento).map(([s, n]) => `${s}: ${n}`).join(" · ") || "vazia, sincronize antes de agendar"}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={sincronizar}
              disabled={ocupado === "sync"}
              className="dst-label border border-[color:var(--line)] px-4 py-2.5 disabled:opacity-40"
            >
              {ocupado === "sync" ? "Sincronizando..." : "Sincronizar base"}
            </button>
            <p className="text-[0.82rem] leading-relaxed text-[color:rgba(242,240,236,0.45)]">
              O cron também ressincroniza antes de cada envio agendado: quem se cadastrar durante a semana entra no e-mail do dia seguinte.
            </p>
          </div>
        </section>

        {/* ── Régua inteira ────────────────────────────────────────────── */}
        <section className="mt-6 border border-[color:var(--somma)] p-5">
          <p className="dst-label text-[color:var(--somma)]">
            {enviadas} enviada(s) · {agendadas} agendada(s) · {7 - enviadas - agendadas} sem data
          </p>
          <p className="mt-2 text-[0.9rem] leading-relaxed text-[color:rgba(242,240,236,0.7)]">
            Aplica os horários abaixo nas sete etapas de uma vez. Pode reaplicar: o que já foi enviado não é tocado, o que
            já estava agendado é remarcado para o horário da tela.
          </p>
          <button
            type="button"
            onClick={agendarRegua}
            disabled={ocupado === "regua" || painel.base.total === 0 || painel.problemasCalendario.length > 0}
            className="dst-label mt-4 bg-[color:var(--somma)] px-5 py-3 text-[color:var(--ink,#08080a)] disabled:opacity-30"
          >
            {ocupado === "regua" ? "Agendando..." : "Agendar a régua inteira"}
          </button>
          <p className="mt-3 text-[0.82rem] leading-relaxed text-[color:rgba(242,240,236,0.45)]">
            Hora de Brasília. Quem dispara é o servidor, não este navegador: pode fechar a aba e desligar o computador.
            A varredura roda de 5 em 5 minutos, então cada envio sai entre a hora marcada e cinco minutos depois.
          </p>
        </section>

        {aviso && (
          <pre className="mt-5 whitespace-pre-wrap border border-[color:var(--line)] p-4 font-[inherit] text-[0.88rem] leading-relaxed text-[color:rgba(242,240,236,0.8)]">
            {aviso}
          </pre>
        )}
        {erro && <pre className="mt-5 whitespace-pre-wrap font-[inherit] text-[0.9rem] text-[color:var(--evolve)]">{erro}</pre>}

        {/* ── Calendário ───────────────────────────────────────────────── */}
        <div className="mt-10 space-y-5">
          {painel.calendario.map((dia) => {
            const linhas = linhasDa(dia.etapa);
            const livres = comPublico(dia.etapa).filter((l) => ["pendente", "rascunho", "cancelado"].includes(l.status));
            const temAgendada = linhas.some((l) => l.status === "agendado");
            const temEnviando = linhas.some((l) => l.status === "enviando");
            const todasEnviadas = comPublico(dia.etapa).length > 0 && comPublico(dia.etapa).every((l) => l.status === "enviado");
            const quando = quandoDa(dia);
            const agendadaPara = linhas.find((l) => l.agendadoPara)?.agendadoPara ?? null;
            const enviadaEm = linhas.find((l) => l.enviadoEm)?.enviadoEm ?? null;
            const assunto = linhas[0]?.assunto ?? "";
            const podeAgendar = !todasEnviadas && !temEnviando && (livres.length > 0 || temAgendada);

            const tot = linhas.reduce(
              (s, l) => ({ env: s.env + l.totalDestinatarios, ab: s.ab + l.aberturas, cl: s.cl + l.cliques }),
              { env: 0, ab: 0, cl: 0 }
            );

            return (
              <section key={dia.etapa} className="dst-panel p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="dst-label text-[color:var(--somma)]">{dia.rotulo}</p>
                  <p className="dst-label" style={{
                    color: todasEnviadas ? CORES.enviado : temEnviando ? CORES.enviando : temAgendada ? CORES.agendado : CORES.pendente,
                  }}>
                    {todasEnviadas && enviadaEm
                      ? `enviada ${brasilia(enviadaEm)}`
                      : temEnviando
                        ? "enviando agora"
                        : temAgendada && agendadaPara
                          ? `sai ${brasilia(agendadaPara)}`
                          : `planejada ${diaLegivel(dia.quando)}`}
                  </p>
                </div>

                <p className="mt-3 text-[1.02rem] leading-snug">{assunto}</p>
                <p className="mt-1 text-[0.85rem] leading-relaxed text-[color:rgba(242,240,236,0.45)]">{dia.gancho}</p>

                {/* Status por segmento, só leitura. */}
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
                  {linhas.map((l) => (
                    <span key={l.segmento} className="dst-label text-[color:rgba(242,240,236,0.45)]">
                      {l.segmento}:{" "}
                      <span style={{ color: CORES[l.status] }}>{l.publico === 0 && l.status === "pendente" ? "vazio" : l.status}</span>
                    </span>
                  ))}
                </div>

                {tot.env > 0 && (
                  <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
                    {[
                      ["Enviados", tot.env],
                      ["Aberturas", tot.ab],
                      ["Cliques", tot.cl],
                      ["Abertura", `${tot.env ? Math.round((tot.ab / tot.env) * 100) : 0}%`],
                    ].map(([rot, n]) => (
                      <span key={String(rot)} className="dst-label text-[color:rgba(242,240,236,0.45)]">
                        {rot}: <strong className="text-[color:var(--paper)]">{n}</strong>
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[color:var(--line)] pt-5">
                  <a
                    href={`/api/campanhas-talk-run/email?etapa=${dia.etapa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="dst-label border border-[color:var(--line)] px-4 py-2.5"
                  >
                    Ver e-mail
                  </a>

                  {podeAgendar && (
                    <>
                      <input
                        type="datetime-local"
                        value={quando}
                        min={agoraEmBrasilia()}
                        onChange={(e) => setQuandos((q) => ({ ...q, [dia.etapa]: e.target.value }))}
                        className="border border-[color:var(--line)] bg-transparent px-3 py-2 text-[color:var(--paper)] outline-none focus:border-[color:var(--somma)] [color-scheme:dark]"
                      />
                      <button
                        type="button"
                        onClick={() => agendarEtapa(dia)}
                        disabled={ocupado === `agendar:${dia.etapa}` || !quando}
                        className="dst-label border border-[color:var(--somma)] px-4 py-2.5 text-[color:var(--somma)] disabled:opacity-30"
                      >
                        {ocupado === `agendar:${dia.etapa}` ? "Salvando..." : temAgendada ? "Reagendar" : "Agendar"}
                      </button>
                      {temAgendada && (
                        <button
                          type="button"
                          onClick={() => cancelarEtapa(dia)}
                          disabled={ocupado === `agendar:${dia.etapa}`}
                          className="dst-label border border-[color:var(--line)] px-4 py-2.5 disabled:opacity-30"
                        >
                          Cancelar
                        </button>
                      )}
                    </>
                  )}

                  {livres.length > 0 && !temAgendada && (
                    <button
                      type="button"
                      onClick={() => dispararEtapa(dia)}
                      disabled={ocupado === `disparo:${dia.etapa}`}
                      className="dst-label bg-[color:var(--evolve)] px-4 py-2.5 text-[color:var(--paper)] disabled:opacity-30"
                    >
                      {ocupado === `disparo:${dia.etapa}` ? "Enviando..." : "Disparar agora"}
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {/* ── Contato avulso ───────────────────────────────────────────── */}
        <form onSubmit={adicionarContato} className="mt-10 flex flex-wrap items-end gap-3">
          <label className="dst-label text-[color:rgba(242,240,236,0.45)]">
            E-mail avulso
            <input
              type="email"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="imprensa@exemplo.com"
              className="ml-2 border border-[color:var(--line)] bg-transparent px-3 py-2 text-[color:var(--paper)] outline-none focus:border-[color:var(--somma)]"
            />
          </label>
          <label className="dst-label text-[color:rgba(242,240,236,0.45)]">
            Nome (opcional)
            <input
              type="text"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              className="ml-2 border border-[color:var(--line)] bg-transparent px-3 py-2 text-[color:var(--paper)] outline-none focus:border-[color:var(--somma)]"
            />
          </label>
          <button
            type="submit"
            disabled={ocupado === "contato" || !novoEmail}
            className="dst-label border border-[color:var(--line)] px-4 py-2.5 disabled:opacity-40"
          >
            {ocupado === "contato" ? "Adicionando..." : "Adicionar à base (manual)"}
          </button>
        </form>

        <Link href="/admin/campanhas-sunset-wine-run" className="dst-label mt-12 block text-[color:rgba(242,240,236,0.4)] underline">
          Ver campanha Sunset Wine Run
        </Link>
      </div>
    </main>
  );
}
