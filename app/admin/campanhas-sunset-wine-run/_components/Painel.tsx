"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface LinhaPainel {
  segmento: string;
  assunto: string;
  status: "pendente" | "rascunho" | "agendado" | "enviado" | "cancelado";
  enviadoEm: string | null;
  totalDestinatarios: number;
  aberturas: number;
  cliques: number;
}

interface Painel {
  campanha: string;
  linkPendente: boolean;
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

export function PainelSunsetWineRun() {
  const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [previas, setPrevias] = useState<Record<string, { total: number; amostra: string[] } | string>>({});
  const [novoEmail, setNovoEmail] = useState("");
  const [novoNome, setNovoNome] = useState("");

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/campanhas-sunset-wine-run/painel");
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
    if (!confirm("Puxar cadastro_site + checkins para esta campanha? Não envia nada.")) return;
    setOcupado("sync");
    try {
      const res = await fetch("/api/campanhas-sunset-wine-run/sincronizar", { method: "POST" });
      const data = await res.json();
      if (!res.ok) setErro(data.error ?? "Falha ao sincronizar.");
      else {
        alert(`Base sincronizada.\n\ncadastro_site: ${data.cadastroSite}\ncheckins: ${data.checkins}\ntotal: ${data.total}`);
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
      const res = await fetch("/api/campanhas-sunset-wine-run/contato", {
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

  async function calcularPrevia(segmento: string) {
    setOcupado(`previa:${segmento}`);
    try {
      const res = await fetch(`/api/campanhas-sunset-wine-run/previa?segmento=${segmento}`);
      const data = await res.json();
      setPrevias((p) => ({ ...p, [segmento]: res.ok ? { total: data.total, amostra: data.amostra } : data.error }));
    } finally {
      setOcupado(null);
    }
  }

  async function disparar(l: LinhaPainel) {
    const previa = previas[l.segmento];
    if (!previa || typeof previa === "string") {
      alert("Calcule a prévia primeiro: é ela que diz quantas pessoas vão receber.");
      return;
    }
    const texto =
      `SEGMENTO ${l.segmento}\n\nDestinatários: ${previa.total}\nAssunto: ${l.assunto}\n\n` +
      `Isto dispara AGORA e NÃO tem volta.\n\nConfirmar?`;
    if (!confirm(texto)) return;

    setOcupado(`disparo:${l.segmento}`);
    setErro(null);
    try {
      const res = await fetch("/api/campanhas-sunset-wine-run/disparar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmento: l.segmento, confirmar: true }),
      });
      const data = await res.json();
      if (!res.ok) setErro(data.error ?? "Falha ao disparar.");
      else {
        alert(`Enviado.\n\nEnviados: ${data.enviados}\nFalhas: ${data.falhas}\nTotal: ${data.total}`);
        await carregar();
      }
    } finally {
      setOcupado(null);
    }
  }

  if (erro && !painel) return <p className="dst-wrap py-10 text-[color:var(--evolve)]">{erro}</p>;
  if (!painel) return <p className="dst-wrap py-10 text-[color:rgba(242,240,236,0.5)]">Carregando...</p>;

  return (
    <main className="dst-grain min-h-[100svh] py-10 md:py-14">
      <div className="dst-wrap">
        <p className="dst-label text-[color:var(--somma)]">Disparo único · envio transacional</p>
        <h1 className="dst-display mt-3 text-[clamp(1.8rem,7vw,3.5rem)] leading-[0.88]">
          SUNSET
          <br />
          WINE RUN
        </h1>

        {painel.linkPendente && (
          <div className="mt-7 border border-[color:var(--evolve)] bg-[rgba(226,33,28,0.1)] p-5">
            <p className="dst-label mb-2 text-[color:var(--evolve)]">Link de vendas pendente</p>
            <p className="text-[0.9rem] leading-relaxed text-[color:rgba(242,240,236,0.75)]">
              `EVENTO.linkIngresso` em lib/emails/sunset-wine-run.ts ainda é o placeholder. Disparo
              recusa rodar até isso ser trocado pelo link real.
            </p>
          </div>
        )}
        {!painel.webhookConfigurado && (
          <div className="mt-4 border border-[color:var(--evolve)] bg-[rgba(226,33,28,0.1)] p-5">
            <p className="dst-label text-[color:var(--evolve)]">Webhook não configurado</p>
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
            {painel.base.total} contatos ·{" "}
            {Object.entries(painel.base.porSegmento).map(([s, n]) => `${s}: ${n}`).join(" · ") || "vazio"}
          </p>
        </div>

        <form onSubmit={adicionarContato} className="mt-5 flex flex-wrap items-end gap-3">
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

        {erro && <p className="mt-5 text-[0.9rem] text-[color:var(--evolve)]">{erro}</p>}

        <div className="mt-10 space-y-4">
          {painel.linhas.map((l) => {
            const previa = previas[l.segmento];
            const podeDisparar = l.status === "pendente" || l.status === "cancelado";

            return (
              <section key={l.segmento} className="dst-panel p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="dst-label" style={{ color: CORES[l.status] }}>
                    {l.segmento} · {l.status}
                  </p>
                  {l.enviadoEm && (
                    <p className="dst-label text-[color:rgba(242,240,236,0.45)]">enviado {brasilia(l.enviadoEm)}</p>
                  )}
                </div>

                <p className="mt-3 text-[1.02rem] leading-snug">{l.assunto}</p>

                {l.status === "enviado" ? (
                  <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
                    {[
                      ["Enviados", l.totalDestinatarios],
                      ["Aberturas", l.aberturas],
                      ["Cliques", l.cliques],
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
                        onClick={() => calcularPrevia(l.segmento)}
                        disabled={ocupado === `previa:${l.segmento}`}
                        className="dst-label border border-[color:var(--line)] px-4 py-2.5 disabled:opacity-40"
                      >
                        {ocupado === `previa:${l.segmento}` ? "Calculando..." : "Calcular prévia"}
                      </button>

                      <button
                        type="button"
                        onClick={() => disparar(l)}
                        disabled={ocupado === `disparo:${l.segmento}` || !previa || typeof previa === "string" || painel.linkPendente}
                        className="dst-label bg-[color:var(--evolve)] px-4 py-2.5 text-[color:var(--paper)] disabled:opacity-30"
                      >
                        {ocupado === `disparo:${l.segmento}` ? "Enviando..." : "Disparar agora"}
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
              </section>
            );
          })}
        </div>

        <Link href="/admin/campanhas" className="dst-label mt-12 block text-[color:rgba(242,240,236,0.4)] underline">
          Ver campanha Evolve fortalecimento
        </Link>
      </div>
    </main>
  );
}
