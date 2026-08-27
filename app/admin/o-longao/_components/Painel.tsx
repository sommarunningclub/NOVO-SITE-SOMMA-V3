"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ficha } from "./Ficha";

/* ── Tipos ──────────────────────────────────────────────────────────────── */

export type CrewStatus = "pendente" | "aprovada" | "reprovada";
export type Categoria = "masculino" | "feminino";

export interface CrewLista {
  id: string;
  codigo: string;
  nome: string;
  instagram: string;
  cidade: string;
  logo_url: string | null;
  status: CrewStatus;
  pagamento_status: "isento" | "pendente" | "pago";
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_email: string;
  responsavel_whatsapp: string;
  created_at: string;
  categorias: Categoria[];
  atletas: number;
}

interface Resumo {
  total: number;
  pendentes: number;
  aprovadas: number;
  reprovadas: number;
  equipes_masculino: number;
  equipes_feminino: number;
}

const RESUMO_ZERO: Resumo = {
  total: 0,
  pendentes: 0,
  aprovadas: 0,
  reprovadas: 0,
  equipes_masculino: 0,
  equipes_feminino: 0,
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

export const COR_STATUS: Record<CrewStatus, string> = {
  pendente: "var(--sinal)",
  aprovada: "#22c55e",
  reprovada: "var(--somma)",
};

const formatador = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function dataBR(iso: string | null): string {
  if (!iso) return "...";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "...";
  return formatador.format(d);
}

function celulaCsv(valor: unknown): string {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  return `"${texto.replace(/"/g, '""')}"`;
}

/* ── Painel ─────────────────────────────────────────────────────────────── */

export function Painel() {
  const router = useRouter();

  const [crews, setCrews] = useState<CrewLista[]>([]);
  const [resumo, setResumo] = useState<Resumo>(RESUMO_ZERO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [status, setStatus] = useState("");
  const [categoria, setCategoria] = useState("");
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");

  const [aberta, setAberta] = useState<string | null>(null);
  const pedido = useRef(0);

  // Busca só vale a partir de 3 caracteres, com 300ms de folga para digitar.
  useEffect(() => {
    const termo = busca.trim();
    const alvo = termo.length >= 3 ? termo : "";
    const t = setTimeout(() => setBuscaAplicada(alvo), 300);
    return () => clearTimeout(t);
  }, [busca]);

  const carregar = useCallback(async () => {
    const meu = ++pedido.current;
    setCarregando(true);
    setErro(null);

    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (categoria) params.set("categoria", categoria);
    if (buscaAplicada) params.set("busca", buscaAplicada);

    try {
      const res = await fetch(`/api/o-longao/admin/inscricoes?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        router.refresh();
        return;
      }
      const data = (await res.json()) as {
        crews?: CrewLista[];
        resumo?: Resumo;
        error?: string;
      };
      if (meu !== pedido.current) return;
      if (!res.ok) {
        setErro(data.error ?? "Falha ao carregar.");
        return;
      }
      setCrews(data.crews ?? []);
      setResumo(data.resumo ?? RESUMO_ZERO);
    } catch {
      if (meu === pedido.current) setErro("Falha de conexão.");
    } finally {
      if (meu === pedido.current) setCarregando(false);
    }
  }, [status, categoria, buscaAplicada, router]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function sair() {
    try {
      await fetch("/api/o-longao/admin/login", { method: "DELETE" });
    } catch {
      /* logout é melhor-esforço: o refresh abaixo devolve o login mesmo assim */
    }
    router.refresh();
  }

  function exportarCsv() {
    const cabecalho = [
      "codigo",
      "crew",
      "instagram",
      "cidade",
      "categorias",
      "atletas",
      "status",
      "responsavel_nome",
      "responsavel_email",
      "responsavel_whatsapp",
      "criado_em",
    ];

    const linhas = crews.map((c) =>
      [
        c.codigo,
        c.nome,
        `@${c.instagram}`,
        c.cidade,
        c.categorias.join(" + "),
        c.atletas,
        c.status,
        c.responsavel_nome,
        c.responsavel_email,
        c.responsavel_whatsapp,
        dataBR(c.created_at),
      ]
        .map(celulaCsv)
        .join(";")
    );

    const conteudo = "﻿" + [cabecalho.join(";"), ...linhas].join("\r\n");
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `o-longao-inscricoes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const cards = useMemo(
    () => [
      { rotulo: "Inscrições", valor: resumo.total },
      { rotulo: "Pendentes", valor: resumo.pendentes, cor: "var(--sinal)" },
      { rotulo: "Aprovadas", valor: resumo.aprovadas, cor: "#22c55e" },
      { rotulo: "Equipes M", valor: resumo.equipes_masculino },
      { rotulo: "Equipes F", valor: resumo.equipes_feminino },
    ],
    [resumo]
  );

  return (
    <main className="lgo-wrap py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="lgo-label text-[color:var(--sinal)]">Organização</p>
          <h1 className="lgo-display text-[clamp(1.5rem,5vw,2.4rem)]">O LONGÃO · PAINEL</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/o-longao"
            className="lgo-mono flex min-h-[44px] items-center px-3 text-[0.8rem] text-[color:rgba(242,240,236,0.6)] hover:text-[color:var(--papel)]"
          >
            VER A PÁGINA
          </Link>
          <button type="button" onClick={sair} className="lgo-btn lgo-btn--ghost min-h-[44px]">
            SAIR
          </button>
        </div>
      </header>

      <div className="lgo-hairline my-6" />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((c) => (
          <div key={c.rotulo} className="lgo-panel p-4">
            <p className="lgo-label text-[color:rgba(242,240,236,0.5)]">{c.rotulo}</p>
            <p className="lgo-num mt-1 text-[1.8rem]" style={c.cor ? { color: c.cor } : undefined}>
              {c.valor}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-6 flex flex-wrap items-end gap-3">
        <div className="lgo-field-wrap min-w-[160px] flex-1">
          <select
            id="f-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="lgo-field"
            required
          >
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="aprovada">Aprovada</option>
            <option value="reprovada">Reprovada</option>
          </select>
          <label htmlFor="f-status" className="lgo-field-label">
            Status
          </label>
        </div>

        <div className="lgo-field-wrap min-w-[160px] flex-1">
          <select
            id="f-categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="lgo-field"
            required
          >
            <option value="">Todas</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
          </select>
          <label htmlFor="f-categoria" className="lgo-field-label">
            Categoria
          </label>
        </div>

        <div className="lgo-field-wrap min-w-[220px] flex-[2]">
          <input
            id="f-busca"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder=" "
            className="lgo-field"
          />
          <label htmlFor="f-busca" className="lgo-field-label">
            Buscar crew, @ ou cidade
          </label>
        </div>

        <button type="button" onClick={exportarCsv} className="lgo-btn min-h-[44px]">
          EXPORTAR CSV
        </button>
      </section>

      {erro && (
        <p role="alert" className="lgo-mono mt-4 text-[0.85rem] text-[color:var(--somma)]">
          {erro}
        </p>
      )}

      <section className="mt-6">
        {carregando ? (
          <p className="lgo-mono text-[0.85rem] text-[color:rgba(242,240,236,0.5)]">Carregando...</p>
        ) : crews.length === 0 ? (
          <p className="lgo-mono text-[0.85rem] text-[color:rgba(242,240,236,0.5)]">
            Nenhuma inscrição com esses filtros.
          </p>
        ) : (
          <>
            {/* Mobile: cartões */}
            <ul className="space-y-3 md:hidden">
              {crews.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setAberta(c.id)}
                    className="lgo-panel block w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[1rem] font-semibold">{c.nome}</p>
                        <p className="lgo-mono text-[0.75rem] text-[color:rgba(242,240,236,0.55)]">
                          @{c.instagram} · {c.cidade}
                        </p>
                      </div>
                      <span
                        className="lgo-label shrink-0"
                        style={{ color: COR_STATUS[c.status] }}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {c.categorias.map((cat) => (
                        <span
                          key={cat}
                          className="lgo-mono bg-[color:var(--noite-3)] px-2 py-1 text-[0.7rem] uppercase"
                        >
                          {cat}
                        </span>
                      ))}
                      <span className="lgo-mono text-[0.72rem] text-[color:rgba(242,240,236,0.5)]">
                        {c.atletas} atletas · {dataBR(c.created_at)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop: tabela */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="lgo-label text-[color:rgba(242,240,236,0.5)]">
                    <th className="border-b border-[color:var(--line)] px-3 py-3">Crew</th>
                    <th className="border-b border-[color:var(--line)] px-3 py-3">Cidade</th>
                    <th className="border-b border-[color:var(--line)] px-3 py-3">Categorias</th>
                    <th className="border-b border-[color:var(--line)] px-3 py-3">Atletas</th>
                    <th className="border-b border-[color:var(--line)] px-3 py-3">Status</th>
                    <th className="border-b border-[color:var(--line)] px-3 py-3">Inscrição</th>
                  </tr>
                </thead>
                <tbody>
                  {crews.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setAberta(c.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setAberta(c.id);
                        }
                      }}
                      className="cursor-pointer border-b border-[color:var(--line)] hover:bg-[color:var(--noite-2)]"
                    >
                      <td className="px-3 py-4">
                        <p className="font-semibold">{c.nome}</p>
                        <p className="lgo-mono text-[0.75rem] text-[color:rgba(242,240,236,0.5)]">
                          @{c.instagram}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-[0.9rem]">{c.cidade}</td>
                      <td className="px-3 py-4">
                        <span className="flex flex-wrap gap-1">
                          {c.categorias.map((cat) => (
                            <span
                              key={cat}
                              className="lgo-mono bg-[color:var(--noite-3)] px-2 py-1 text-[0.68rem] uppercase"
                            >
                              {cat.slice(0, 3)}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td className="lgo-num px-3 py-4">{c.atletas}</td>
                      <td className="lgo-label px-3 py-4" style={{ color: COR_STATUS[c.status] }}>
                        {c.status}
                      </td>
                      <td className="lgo-mono px-3 py-4 text-[0.75rem] text-[color:rgba(242,240,236,0.55)]">
                        {dataBR(c.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {aberta && (
        <Ficha
          id={aberta}
          onClose={() => setAberta(null)}
          onChange={() => {
            void carregar();
          }}
        />
      )}
    </main>
  );
}
