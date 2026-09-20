"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Etapa = 1 | 2 | 3 | 4 | 5;
const ETAPAS: readonly Etapa[] = [1, 2, 3, 4, 5] as const;

interface LinhaPainel {
  etapa: Etapa;
  rotulo: string;
  segmento: string;
  assunto: string;
  status: "pendente" | "rascunho" | "agendado" | "enviando" | "enviado" | "cancelado";
  enviadoEm: string | null;
  totalDestinatarios: number;
  aberturas: number;
  cliques: number;
  naoAbriram: number | null;
  bloqueada: string | null;
  /** ISO do horário marcado, ou null se a etapa não está agendada. */
  agendadoPara: string | null;
  /** ISO do horário que a régua propõe para esta linha. */
  sugeridoPara: string | null;
}

interface Painel {
  campanha: string;
  evento: { titulo: string; dataIso: string };
  base: { total: number; porSegmento: Record<string, number> };
  linhas: LinhaPainel[];
  webhookConfigurado: boolean;
}

/** Chave de UI por linha: cada etapa do mesmo segmento é uma linha distinta. */
const chave = (l: Pick<LinhaPainel, "etapa" | "segmento">) => `${l.etapa}:${l.segmento}`;

const VARIANTE: Record<Etapa, string> = {
  1: "convite",
  2: "reforco",
  3: "dia-inteiro",
  4: "vespera",
  5: "ultima-chamada",
};

const TITULO_ETAPA: Record<Etapa, { rotulo: string; publico: string }> = {
  1: { rotulo: "Etapa 1 · convite", publico: "Base inteira do segmento, menos descadastros." },
  2: { rotulo: "Etapa 2 · reforço", publico: "Só quem recebeu a etapa 1 e não abriu nem clicou." },
  3: { rotulo: "Etapa 3 · o dia inteiro", publico: "Só quem abriu ou clicou em alguma etapa anterior." },
  4: { rotulo: "Etapa 4 · véspera", publico: "Volta para a base inteira. Sexta de manhã." },
  5: { rotulo: "Etapa 5 · última chamada", publico: "Só quem engajou. Sexta à noite, despertador." },
};

const CORES: Record<LinhaPainel["status"], string> = {
  pendente: "rgba(242,240,236,0.4)",
  rascunho: "rgba(242,240,236,0.6)",
  agendado: "var(--somma)",
  enviando: "var(--somma)",
  enviado: "#4ade80",
  cancelado: "var(--evolve)",
};

const brasilia = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Data para dentro do input datetime-local, SEMPRE em Brasília.
 *
 * `toISOString().slice(0,16)` seria mais curto e estaria errado: daria UTC, e o
 * campo apareceria três horas adiantado. O locale sueco é o atalho honesto para
 * "AAAA-MM-DD HH:MM" sem montar a string na mão.
 */
const paraInput = (iso: string) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(iso))
    .replace(" ", "T");

const agoraEmBrasilia = () => paraInput(new Date().toISOString());

const jaPassou = (iso: string | null) => Boolean(iso && new Date(iso).getTime() <= Date.now());

export function PainelSommaDay() {
  const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [previas, setPrevias] = useState<Record<string, { total: number; amostra: string[] } | string>>({});
  /** Horário digitado por linha, no formato do input (hora de Brasília). */
  const [quandos, setQuandos] = useState<Record<string, string>>({});

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/campanhas-somma-day/painel");
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Falha ao carregar.");
        return;
      }
      setPainel(data as Painel);
      setErro(null);
    } catch {
      setErro("Falha de conexão.");
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  /** O valor do input: o que o operador digitou, senão o agendado, senão a sugestão. */
  function quandoDaLinha(l: LinhaPainel): string {
    const digitado = quandos[chave(l)];
    if (digitado !== undefined) return digitado;
    if (l.agendadoPara) return paraInput(l.agendadoPara);
    if (l.sugeridoPara && !jaPassou(l.sugeridoPara)) return paraInput(l.sugeridoPara);
    return "";
  }

  async function sincronizar() {
    if (!confirm("Puxar cadastro_site + checkins para esta campanha, sem duplicados? Não envia nada.")) return;
    setOcupado("sync");
    setErro(null);
    try {
      const res = await fetch("/api/campanhas-somma-day/sincronizar", { method: "POST" });
      const data = await res.json();
      if (!res.ok) setErro(data.error ?? "Falha ao sincronizar.");
      else {
        setAviso(
          `Base sincronizada. cadastro_site: ${data.cadastroSite} · checkins (só quem não estava no cadastro): ${data.checkins} · ` +
            `duplicados removidos entre as tabelas: ${data.removidosPorCruzamento} · total único: ${data.total}.`
        );
        await carregar();
      }
    } finally {
      setOcupado(null);
    }
  }

  async function agendarTudo() {
    if (!painel) return;
    const livres = painel.linhas.filter(
      (l) => (l.status === "pendente" || l.status === "rascunho" || l.status === "cancelado") && l.sugeridoPara && !jaPassou(l.sugeridoPara)
    );
    if (livres.length === 0) {
      alert("Não há etapa livre com horário sugerido no futuro.");
      return;
    }
    const lista = livres.map((l) => `  etapa ${l.etapa} · ${l.segmento} → ${brasilia(l.sugeridoPara!)}`).join("\n");
    if (!confirm(`Agendar ${livres.length} disparos nos horários sugeridos?\n\n${lista}\n\nEtapas já agendadas não são alteradas.`)) return;

    setOcupado("agendar-tudo");
    setErro(null);
    try {
      const res = await fetch("/api/campanhas-somma-day/agendar", { method: "PUT" });
      const data = await res.json();
      if (!res.ok) setErro(data.error ?? "Falha ao agendar.");
      else {
        const puladas = (data.puladas as Array<{ etapa: number; segmento: string; motivo: string }>).filter(
          (p) => !p.motivo.startsWith("já está")
        );
        setAviso(
          `${data.agendadas.length} disparos agendados.` +
            (puladas.length
              ? ` Ficaram de fora: ${puladas.map((p) => `etapa ${p.etapa}/${p.segmento} (${p.motivo})`).join("; ")}.`
              : "")
        );
        await carregar();
      }
    } finally {
      setOcupado(null);
    }
  }

  async function calcularPrevia(l: LinhaPainel) {
    setOcupado(`previa:${chave(l)}`);
    try {
      const res = await fetch(`/api/campanhas-somma-day/previa?segmento=${l.segmento}&etapa=${l.etapa}`);
      const data = await res.json();
      setPrevias((p) => ({ ...p, [chave(l)]: res.ok ? { total: data.total, amostra: data.amostra } : data.error }));
    } finally {
      setOcupado(null);
    }
  }

  async function agendar(l: LinhaPainel) {
    const quando = quandoDaLinha(l);
    if (!quando) {
      alert("Escolha a data e a hora.");
      return;
    }
    const verbo = l.status === "agendado" ? "Reagendar" : "Agendar";
    if (!confirm(`${verbo} a etapa ${l.etapa} de ${l.segmento} para ${quando.replace("T", " ")} (Brasília)?`)) return;

    setOcupado(`agendar:${chave(l)}`);
    setErro(null);
    try {
      const res = await fetch("/api/campanhas-somma-day/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmento: l.segmento, etapa: l.etapa, quando }),
      });
      const data = await res.json();
      if (!res.ok) setErro(data.error ?? "Falha ao agendar.");
      else {
        setQuandos((q) => {
          const resto = { ...q };
          delete resto[chave(l)];
          return resto;
        });
        await carregar();
      }
    } finally {
      setOcupado(null);
    }
  }

  async function desagendar(l: LinhaPainel) {
    if (!confirm(`Cancelar o agendamento da etapa ${l.etapa} de ${l.segmento}?`)) return;
    setOcupado(`agendar:${chave(l)}`);
    setErro(null);
    try {
      const res = await fetch(`/api/campanhas-somma-day/agendar?segmento=${l.segmento}&etapa=${l.etapa}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) setErro(data.error ?? "Falha ao cancelar.");
      else await carregar();
    } finally {
      setOcupado(null);
    }
  }

  async function disparar(l: LinhaPainel) {
    const previa = previas[chave(l)];
    if (!previa || typeof previa === "string") {
      alert("Calcule a prévia primeiro: é ela que diz quantas pessoas vão receber.");
      return;
    }
    const texto =
      `ETAPA ${l.etapa} · SEGMENTO ${l.segmento}\n\nDestinatários: ${previa.total}\nAssunto: ${l.assunto}\n\n` +
      `Isto dispara AGORA e NÃO tem volta.\n\nConfirmar?`;
    if (!confirm(texto)) return;

    setOcupado(`disparo:${chave(l)}`);
    setErro(null);
    try {
      const res = await fetch("/api/campanhas-somma-day/disparar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmento: l.segmento, etapa: l.etapa, confirmar: true }),
      });
      const data = await res.json();
      if (!res.ok) setErro(data.error ?? "Falha ao disparar.");
      else {
        setAviso(`Etapa ${l.etapa} de ${l.segmento} enviada. Enviados: ${data.enviados} · falhas: ${data.falhas}.`);
        await carregar();
      }
    } finally {
      setOcupado(null);
    }
  }

  if (erro && !painel) return <p className="dst-wrap py-10 text-[color:var(--evolve)]">{erro}</p>;
  if (!painel) return <p className="dst-wrap py-10 text-[color:rgba(242,240,236,0.5)]">Carregando...</p>;

  const agendadas = painel.linhas.filter((l) => l.status === "agendado").length;
  const enviadas = painel.linhas.filter((l) => l.status === "enviado").length;

  return (
    <main className="dst-grain min-h-[100svh] py-10 md:py-14">
      <div className="dst-wrap">
        <p className="dst-label text-[color:var(--somma)]">Cinco etapas · envio transacional · até a véspera</p>
        <h1 className="dst-display mt-3 text-[clamp(1.8rem,7vw,3.5rem)] leading-[0.88]">
          SOMMA DAY
          <br />
          SET 2026
        </h1>
        <p className="mt-4 text-[0.95rem] text-[color:rgba(242,240,236,0.6)]">
          Sábado, 26/09 · 07h00 · Estacionamento 9, Parque da Cidade. CTA: sommaclub.com.br/check-in
        </p>

        {!painel.webhookConfigurado && (
          <div className="mt-6 border border-[color:var(--evolve)] bg-[rgba(226,33,28,0.1)] p-5">
            <p className="dst-label mb-2 text-[color:var(--evolve)]">Webhook não configurado</p>
            <p className="text-[0.9rem] leading-relaxed text-[color:rgba(242,240,236,0.75)]">
              Sem RESEND_WEBHOOK_SECRET as aberturas não chegam, e as etapas 2, 3 e 5 não têm como saber quem engajou.
            </p>
          </div>
        )}

        {/* ── Base ───────────────────────────────────────────────────────── */}
        <section className="dst-panel mt-8 p-5">
          <p className="dst-label text-[color:rgba(242,240,236,0.45)]">Base · cadastro_site + checkins, sem duplicados</p>
          <p className="dst-display mt-2 text-[2.2rem] leading-none">{painel.base.total.toLocaleString("pt-BR")}</p>
          <p className="dst-label mt-2 text-[color:rgba(242,240,236,0.45)]">
            {Object.entries(painel.base.porSegmento)
              .map(([s, n]) => `${s}: ${n.toLocaleString("pt-BR")}`)
              .join(" · ") || "vazia, sincronize antes de disparar"}
          </p>
          <button
            type="button"
            onClick={sincronizar}
            disabled={ocupado === "sync"}
            className="dst-label mt-4 border border-[color:var(--line)] px-4 py-2.5 disabled:opacity-40"
          >
            {ocupado === "sync" ? "Sincronizando..." : "Sincronizar base"}
          </button>
          <p className="mt-3 text-[0.82rem] leading-relaxed text-[color:rgba(242,240,236,0.45)]">
            Dedup por e-mail: quem está nas duas tabelas entra uma vez só, como cadastro-site. Descadastrados de qualquer
            campanha ficam de fora na hora do envio. O cron também ressincroniza antes de cada disparo agendado.
          </p>
        </section>

        {/* ── Plano de disparo ───────────────────────────────────────────── */}
        <section className="dst-panel mt-6 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="dst-label text-[color:var(--somma)]">Plano de disparo</p>
            <p className="dst-label text-[color:rgba(242,240,236,0.45)]">
              {enviadas} enviados · {agendadas} agendados · {painel.linhas.length} no total
            </p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[0.86rem]">
              <thead>
                <tr className="dst-label text-[color:rgba(242,240,236,0.4)]">
                  <th className="py-2 pr-3 font-normal">Etapa</th>
                  <th className="py-2 pr-3 font-normal">Segmento</th>
                  <th className="py-2 pr-3 font-normal">Quando</th>
                  <th className="py-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {painel.linhas.map((l) => {
                  const quando = l.enviadoEm ?? l.agendadoPara ?? l.sugeridoPara;
                  const rotuloQuando = l.enviadoEm ? "enviado" : l.agendadoPara ? "agendado" : "sugerido";
                  return (
                    <tr key={chave(l)} className="border-t border-[color:var(--line)]">
                      <td className="py-2 pr-3">
                        {l.etapa} · {l.rotulo}
                      </td>
                      <td className="py-2 pr-3 text-[color:rgba(242,240,236,0.6)]">{l.segmento}</td>
                      <td className="py-2 pr-3">
                        {quando ? (
                          <>
                            {brasilia(quando)}{" "}
                            <span className="text-[color:rgba(242,240,236,0.4)]">({rotuloQuando})</span>
                            {rotuloQuando === "sugerido" && jaPassou(quando) && (
                              <span className="text-[color:var(--evolve)]"> já passou</span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2" style={{ color: CORES[l.status] }}>
                        {l.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={agendarTudo}
            disabled={ocupado === "agendar-tudo"}
            className="dst-label mt-5 bg-[color:var(--somma)] px-4 py-3 text-[color:var(--ink)] disabled:opacity-40"
          >
            {ocupado === "agendar-tudo" ? "Agendando..." : "Agendar régua inteira nos horários sugeridos"}
          </button>
          <p className="mt-3 text-[0.82rem] leading-relaxed text-[color:rgba(242,240,236,0.45)]">
            Hora de Brasília. Quem dispara é o servidor, não este navegador: pode fechar a aba e desligar o computador.
            A varredura roda de 5 em 5 minutos. Os dois segmentos saem com 20 minutos de intervalo para cada disparo
            caber numa varredura. Etapa já agendada à mão não é alterada.
          </p>
        </section>

        {aviso && <p className="mt-5 border-l-2 border-[color:var(--somma)] pl-3 text-[0.9rem] text-[color:rgba(242,240,236,0.8)]">{aviso}</p>}
        {erro && <p className="mt-5 text-[0.9rem] text-[color:var(--evolve)]">{erro}</p>}

        {/* ── Etapas ─────────────────────────────────────────────────────── */}
        <div className="mt-10 space-y-10">
          {ETAPAS.map((etapa) => (
            <div key={etapa} className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="dst-label text-[color:var(--somma)]">{TITULO_ETAPA[etapa].rotulo}</p>
                  <p className="mt-1 text-[0.85rem] text-[color:rgba(242,240,236,0.45)]">{TITULO_ETAPA[etapa].publico}</p>
                </div>
                <a
                  href={`/api/campanhas-somma-day/email?variante=${VARIANTE[etapa]}`}
                  target="_blank"
                  rel="noreferrer"
                  className="dst-label text-[color:rgba(242,240,236,0.6)] underline"
                >
                  Ver e-mail
                </a>
              </div>

              {painel.linhas
                .filter((l) => l.etapa === etapa)
                .map((l) => {
                  const previa = previas[chave(l)];
                  const livre = l.status === "pendente" || l.status === "rascunho" || l.status === "cancelado";
                  const podeDisparar = !l.bloqueada && livre;
                  /* Agendar vale para etapa bloqueada também: na hora marcada a
                     etapa anterior já vai ter saído. Se não tiver, o cron recusa
                     e a linha volta para rascunho, visível aqui. */
                  const podeAgendar = livre || l.status === "agendado";
                  const quando = quandoDaLinha(l);

                  return (
                    <section key={chave(l)} className="dst-panel p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <p className="dst-label" style={{ color: CORES[l.status] }}>
                          {l.segmento} · {l.status}
                        </p>
                        {l.enviadoEm ? (
                          <p className="dst-label text-[color:rgba(242,240,236,0.45)]">enviado {brasilia(l.enviadoEm)}</p>
                        ) : l.status === "agendado" && l.agendadoPara ? (
                          <p className="dst-label text-[color:var(--somma)]">sai {brasilia(l.agendadoPara)}</p>
                        ) : null}
                      </div>

                      <p className="mt-3 text-[1.02rem] leading-snug">{l.assunto}</p>

                      {l.status === "enviado" && (
                        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
                          {[
                            ["Enviados", l.totalDestinatarios],
                            ["Aberturas", l.aberturas],
                            ["Cliques", l.cliques],
                            ["Não abriram", l.naoAbriram ?? 0],
                          ].map(([rot, n]) => (
                            <span key={String(rot)} className="dst-label text-[color:rgba(242,240,236,0.45)]">
                              {rot}: <strong className="text-[color:var(--paper)]">{n}</strong>
                            </span>
                          ))}
                        </div>
                      )}

                      {l.bloqueada && l.status !== "enviado" && (
                        <p className="mt-4 text-[0.85rem] text-[color:rgba(242,240,236,0.45)]">{l.bloqueada}</p>
                      )}

                      {podeDisparar && (
                        <div className="mt-5 border-t border-[color:var(--line)] pt-5">
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => calcularPrevia(l)}
                              disabled={ocupado === `previa:${chave(l)}`}
                              className="dst-label border border-[color:var(--line)] px-4 py-2.5 disabled:opacity-40"
                            >
                              {ocupado === `previa:${chave(l)}` ? "Calculando..." : "Calcular prévia"}
                            </button>
                            <button
                              type="button"
                              onClick={() => disparar(l)}
                              disabled={ocupado === `disparo:${chave(l)}` || !previa || typeof previa === "string"}
                              className="dst-label bg-[color:var(--evolve)] px-4 py-2.5 text-[color:var(--paper)] disabled:opacity-30"
                            >
                              {ocupado === `disparo:${chave(l)}` ? "Enviando..." : "Disparar agora"}
                            </button>
                          </div>

                          {previa !== undefined && (
                            <p className="mt-3 text-[0.88rem] leading-relaxed">
                              {typeof previa === "string" ? (
                                <span className="text-[color:var(--evolve)]">{previa}</span>
                              ) : (
                                <span className="text-[color:rgba(242,240,236,0.7)]">
                                  <strong className="text-[color:var(--paper)]">{previa.total}</strong> destinatários. Ex.:{" "}
                                  {previa.amostra.join(", ") || "nenhum"}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      )}

                      {podeAgendar && (
                        <div className="mt-5 border-t border-[color:var(--line)] pt-5">
                          <p className="dst-label text-[color:rgba(242,240,236,0.45)]">
                            {l.status === "agendado" ? "Agendado" : "Agendar disparo"}
                            {l.sugeridoPara && l.status !== "agendado" && (
                              <span className="ml-2 normal-case tracking-normal">
                                · sugerido {brasilia(l.sugeridoPara)}
                                {jaPassou(l.sugeridoPara) && (
                                  <span className="text-[color:var(--evolve)]"> (já passou, escolha outro horário ou dispare agora)</span>
                                )}
                              </span>
                            )}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <input
                              type="datetime-local"
                              value={quando}
                              min={agoraEmBrasilia()}
                              onChange={(e) => setQuandos((q) => ({ ...q, [chave(l)]: e.target.value }))}
                              className="border border-[color:var(--line)] bg-transparent px-3 py-2 text-[color:var(--paper)] outline-none focus:border-[color:var(--somma)] [color-scheme:dark]"
                            />
                            <button
                              type="button"
                              onClick={() => agendar(l)}
                              disabled={ocupado === `agendar:${chave(l)}` || !quando}
                              className="dst-label border border-[color:var(--somma)] px-4 py-2.5 text-[color:var(--somma)] disabled:opacity-30"
                            >
                              {ocupado === `agendar:${chave(l)}` ? "Salvando..." : l.status === "agendado" ? "Reagendar" : "Agendar"}
                            </button>
                            {l.status === "agendado" && (
                              <button
                                type="button"
                                onClick={() => desagendar(l)}
                                disabled={ocupado === `agendar:${chave(l)}`}
                                className="dst-label border border-[color:var(--line)] px-4 py-2.5 disabled:opacity-30"
                              >
                                Cancelar agendamento
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </section>
                  );
                })}
            </div>
          ))}
        </div>

        <p className="dst-label mt-12 text-[color:rgba(242,240,236,0.3)]">
          Abertura é medida por pixel: quem lê com imagem bloqueada conta como não aberto, e o Apple Mail pré-carrega o
          pixel de quem talvez não tenha visto. A régua é aproximação, não fato.
        </p>
        <Link href="/admin/campanhas" className="dst-label mt-4 block text-[color:rgba(242,240,236,0.4)] underline">
          Ver campanha Evolve fortalecimento
        </Link>
      </div>
    </main>
  );
}
