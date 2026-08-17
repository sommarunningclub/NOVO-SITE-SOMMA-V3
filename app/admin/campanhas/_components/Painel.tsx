"use client";

import { useCallback, useEffect, useState } from "react";

interface LinhaPainel {
  etapa: 1 | 2 | 3;
  rotulo: string;
  segmento: string;
  assunto: string;
  status: "pendente" | "rascunho" | "agendado" | "enviado" | "cancelado";
  enviadoEm: string | null;
  totalDestinatarios: number;
  aberturas: number;
  cliques: number;
  naoAbriram: number | null;
}

interface Painel {
  campanha: string;
  base: { total: number; porSegmento: Record<string, number> };
  linhas: LinhaPainel[];
  webhookConfigurado: boolean;
}

const CORES: Record<LinhaPainel["status"], string> = {
  pendente: "rgba(242,240,236,0.4)",
  rascunho: "rgba(242,240,236,0.6)",
  agendado: "var(--somma)",
  enviado: "#4ade80",
  cancelado: "var(--evolve)",
};

const brasilia = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

export function PainelCampanhas() {
  const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [previas, setPrevias] = useState<Record<string, { total: number; amostra: string[] } | string>>({});

  const chave = (l: LinhaPainel) => `${l.etapa}:${l.segmento}`;

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/campanhas/painel");
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Falha ao carregar."); return; }
      setPainel(data as Painel);
      setErro(null);
    } catch {
      setErro("Falha de conexão.");
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  async function sincronizar() {
    if (!confirm("Puxar cadastro_site + checkins para a campanha? Não envia nada.")) return;
    setOcupado("sync");
    try {
      const res = await fetch("/api/campanhas/sincronizar", { method: "POST" });
      const data = await res.json();
      if (!res.ok) setErro(data.error ?? "Falha ao sincronizar.");
      else {
        alert(
          `Base sincronizada.\n\ncadastro_site: ${data.cadastroSite}\ncheckins (exclusivos): ${data.checkins}\ntotal: ${data.total}\n\nO cruzamento tirou ${data.removidosPorCruzamento} repetidos.`
        );
        await carregar();
      }
    } finally {
      setOcupado(null);
    }
  }

  async function calcularPrevia(l: LinhaPainel) {
    const k = chave(l);
    setOcupado(`previa:${k}`);
    try {
      const res = await fetch(`/api/campanhas/previa?etapa=${l.etapa}&segmento=${l.segmento}`);
      const data = await res.json();
      setPrevias((p) => ({ ...p, [k]: res.ok ? { total: data.total, amostra: data.amostra } : data.error }));
    } finally {
      setOcupado(null);
    }
  }

  async function disparar(l: LinhaPainel) {
    const k = chave(l);
    const previa = previas[k];
    if (!previa || typeof previa === "string") {
      alert("Calcule a prévia primeiro: é ela que diz quantas pessoas vão receber.");
      return;
    }

    const texto =
      `ETAPA ${l.etapa} · ${l.rotulo} · ${l.segmento}\n\n` +
      `Destinatários: ${previa.total}\n` +
      `Assunto: ${l.assunto}\n\n` +
      `Isto dispara AGORA, por e-mail transacional em lotes de 100, e NÃO tem volta.\n\nConfirmar?`;
    if (!confirm(texto)) return;

    setOcupado(`disparo:${k}`);
    setErro(null);
    try {
      const res = await fetch("/api/campanhas/disparar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa: l.etapa, segmento: l.segmento, confirmar: true }),
      });
      const data = await res.json();
      if (!res.ok) setErro(data.error ?? "Falha ao disparar.");
      else {
        alert(`Enviado.\n\nEnviados: ${data.enviados}\nFalhas: ${data.falhas}\nTotal na etapa: ${data.total}`);
        await carregar();
      }
    } finally {
      setOcupado(null);
    }
  }

  if (erro && !painel) {
    return <p className="dst-wrap py-10 text-[color:var(--evolve)]">{erro}</p>;
  }
  if (!painel) {
    return <p className="dst-wrap py-10 text-[color:rgba(242,240,236,0.5)]">Carregando...</p>;
  }

  return (
    <main className="dst-grain min-h-[100svh] py-10 md:py-14">
      <div className="dst-wrap">
        <p className="dst-label text-[color:var(--somma)]">Régua de 3 etapas · envio transacional</p>
        <h1 className="dst-display mt-3 text-[clamp(1.8rem,7vw,3.5rem)] leading-[0.88]">
          CAMPANHA
          <br />
          EVOLVE
        </h1>

        {/* O aviso mais importante da tela: sem webhook a régua não fecha. */}
        {!painel.webhookConfigurado && (
          <div className="mt-7 border border-[color:var(--evolve)] bg-[rgba(226,33,28,0.1)] p-5">
            <p className="dst-label mb-2 text-[color:var(--evolve)]">Webhook não configurado</p>
            <p className="text-[0.9rem] leading-relaxed text-[color:rgba(242,240,236,0.75)]">
              Sem <code className="dst-mono">RESEND_WEBHOOK_SECRET</code> as aberturas não são
              capturadas, e as etapas 2 e 3 não têm como saber quem não abriu. Configure antes de
              disparar a etapa 1: abertura que acontece com o webhook fora do ar não volta.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={sincronizar}
            disabled={ocupado === "sync"}
            className="dst-label border border-[color:var(--line)] px-4 py-2.5 disabled:opacity-40"
          >
            {ocupado === "sync" ? "Sincronizando..." : "Sincronizar base"}
          </button>
          <p className="dst-label text-[color:rgba(242,240,236,0.45)]">
            {painel.base.total} contatos ativos ·{" "}
            {Object.entries(painel.base.porSegmento).map(([s, n]) => `${s}: ${n}`).join(" · ") || "vazio"}
          </p>
        </div>

        {erro && <p className="mt-5 text-[0.9rem] text-[color:var(--evolve)]">{erro}</p>}

        <div className="mt-10 space-y-4">
          {painel.linhas.map((l) => {
            const k = chave(l);
            const previa = previas[k];
            const podeDisparar = l.status === "pendente" || l.status === "cancelado";

            return (
              <section key={k} className="dst-panel p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="dst-label" style={{ color: CORES[l.status] }}>
                    Etapa {l.etapa} · {l.rotulo} · {l.segmento} · {l.status}
                  </p>
                  {l.enviadoEm && (
                    <p className="dst-label text-[color:rgba(242,240,236,0.45)]">
                      enviado {brasilia(l.enviadoEm)}
                    </p>
                  )}
                </div>

                <p className="mt-3 text-[1.02rem] leading-snug">{l.assunto}</p>

                {l.status === "enviado" ? (
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
                ) : null}

                {podeDisparar && (
                  <div className="mt-5 border-t border-[color:var(--line)] pt-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => calcularPrevia(l)}
                        disabled={ocupado === `previa:${k}`}
                        className="dst-label border border-[color:var(--line)] px-4 py-2.5 disabled:opacity-40"
                      >
                        {ocupado === `previa:${k}` ? "Calculando..." : "Calcular prévia"}
                      </button>

                      <button
                        type="button"
                        onClick={() => disparar(l)}
                        disabled={ocupado === `disparo:${k}` || !previa || typeof previa === "string"}
                        className="dst-label bg-[color:var(--evolve)] px-4 py-2.5 text-[color:var(--paper)] disabled:opacity-30"
                      >
                        {ocupado === `disparo:${k}` ? "Enviando..." : "Disparar agora"}
                      </button>
                    </div>

                    {previa !== undefined && (
                      <p className="mt-3 text-[0.88rem] leading-relaxed">
                        {typeof previa === "string" ? (
                          <span className="text-[color:var(--evolve)]">{previa}</span>
                        ) : (
                          <span className="text-[color:rgba(242,240,236,0.7)]">
                            <strong className="text-[color:var(--paper)]">{previa.total}</strong>{" "}
                            destinatários. Ex.: {previa.amostra.join(", ") || "nenhum"}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <p className="dst-label mt-12 text-[color:rgba(242,240,236,0.3)]">
          Abertura é medida por pixel: quem lê com imagem bloqueada conta como não aberto, e o Apple
          Mail pré-carrega o pixel de quem talvez não tenha visto. A régua é aproximação, não fato.
        </p>
      </div>
    </main>
  );
}
