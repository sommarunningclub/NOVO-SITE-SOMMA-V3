"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OperatorSession } from "@/lib/desafio-esteiras/auth";
import {
  BATERIAS,
  EVENT,
  VAGAS_POR_CATEGORIA,
  VAGAS_POR_UNIDADE,
  getUnit,
} from "@/lib/desafio-esteiras/event.config";
import { STATUS_COR, STATUS_LABEL, horaInscrito, type Inscrito } from "./inscrito";

/* ── Formato do que a API devolve ────────────────────────────────────────── */

interface VagasCategoria {
  ocupadas: number;
  total: number;
  restantes: number;
  status: "aberta" | "ultimas" | "esgotada";
  baterias: { n: number; ocupadas: number }[];
  semBateria: number;
}

interface ResumoUnidade {
  id: string;
  curto: string;
  total: number;
  competidores: number;
  espectadores: number;
  checkins: number;
  vagas: { feminino: VagasCategoria; masculino: VagasCategoria };
}

interface Resposta {
  inscritos: Inscrito[];
  filtrados: number;
  truncado: boolean;
  resumo: {
    total: number;
    cancelados: number;
    competidores: number;
    espectadores: number;
    checkins: number;
    porUnidade: ResumoUnidade[];
  };
  escopo: string;
  role: string;
}

/* ── Painel ──────────────────────────────────────────────────────────────── */

type Aba = "todos" | "competidor" | "espectador" | "checkin" | "falta";

const ABAS: { id: Aba; nome: string }[] = [
  { id: "todos", nome: "Todos" },
  { id: "competidor", nome: "Competidores" },
  { id: "espectador", nome: "Só assistindo" },
  { id: "checkin", nome: "Já chegaram" },
  { id: "falta", nome: "Ainda não chegaram" },
];

/**
 * O que a recepção de uma Evolve precisa no dia: quantos vêm, quantos já
 * chegaram, quem falta e como estão as vagas de cada categoria.
 *
 * Deliberadamente não edita cadastro. A única escrita é marcar presença, que
 * é o que a portaria faz de fato; qualquer correção de dado é com a
 * organização. A API recusa o resto de novo, do lado do servidor.
 */
export function PainelUnidade({
  session,
  unidadeDaUrl,
}: {
  session: OperatorSession;
  unidadeDaUrl: string;
}) {
  const router = useRouter();

  // Um admin que abrir esta URL enxerga tudo; o escopo real é o da sessão.
  const unitId = session.unitId ?? unidadeDaUrl;
  const unit = getUnit(unitId);

  const [dados, setDados] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState<Aba>("todos");
  const [marcando, setMarcando] = useState<string | null>(null);

  const buscaRef = useRef(busca);
  buscaRef.current = busca;

  const carregar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    try {
      const sp = new URLSearchParams({ ordem: "nome" });
      const q = buscaRef.current.trim();
      if (q.length >= 3) sp.set("q", q);

      const res = await fetch(`/api/desafio-esteiras/admin/inscritos?${sp}`, { cache: "no-store" });
      if (res.status === 401) {
        router.refresh();
        return;
      }
      const json = (await res.json()) as Resposta & { error?: string };
      if (!res.ok) {
        setErro(json.error ?? "Não foi possível carregar.");
        return;
      }
      setDados(json);
      setErro(null);
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setCarregando(false);
    }
  }, [router]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // A busca é servida pela API; esperamos a digitação parar para não disparar
  // uma requisição por tecla.
  useEffect(() => {
    const t = setTimeout(() => void carregar(true), 350);
    return () => clearTimeout(t);
  }, [busca, carregar]);

  // No dia do evento a lista muda sozinha: atualiza sem ninguém pedir.
  useEffect(() => {
    const t = setInterval(() => void carregar(true), 30_000);
    return () => clearInterval(t);
  }, [carregar]);

  const daUnidade: ResumoUnidade | null = useMemo(() => {
    if (!dados) return null;
    return dados.resumo.porUnidade.find((u) => u.id === unitId) ?? null;
  }, [dados, unitId]);

  const lista = useMemo(() => {
    const todos = dados?.inscritos.filter((i) => i.unit_id === unitId) ?? [];
    if (aba === "competidor") return todos.filter((i) => i.participacao === "competidor");
    if (aba === "espectador") return todos.filter((i) => i.participacao === "espectador");
    if (aba === "checkin") return todos.filter((i) => i.status === "checked_in");
    if (aba === "falta") return todos.filter((i) => i.status === "confirmed");
    return todos;
  }, [dados, unitId, aba]);

  async function marcarPresenca(inscrito: Inscrito) {
    if (marcando) return;
    const chegou = inscrito.status === "checked_in";
    setMarcando(inscrito.id);
    setAviso(null);
    setErro(null);

    try {
      const res = await fetch("/api/desafio-esteiras/admin/inscritos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: inscrito.id,
          status: chegou ? "confirmed" : "checked_in",
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErro(json.error ?? "Não foi possível registrar.");
        return;
      }
      setAviso(
        chegou
          ? `Presença de ${primeiroNome(inscrito.full_name)} desfeita.`
          : `${primeiroNome(inscrito.full_name)} chegou.`
      );
      await carregar(true);
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setMarcando(null);
    }
  }

  async function sair() {
    await fetch("/api/desafio-esteiras/admin/login", { method: "DELETE" });
    router.refresh();
  }

  if (!unit) {
    return (
      <main className="dst-wrap py-16">
        <p className="dst-label text-[color:var(--evolve)]">Unidade não encontrada.</p>
      </main>
    );
  }

  const totalPrevisto = daUnidade?.total ?? 0;
  const jaChegaram = daUnidade?.checkins ?? 0;
  const percentual = totalPrevisto ? Math.round((jaChegaram / totalPrevisto) * 100) : 0;

  return (
    <main className="dst-wrap py-10 sm:py-14">
      {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="dst-label text-[color:var(--somma)]">Operação da unidade</p>
          <h1 className="dst-display mt-3 text-[clamp(1.9rem,7vw,3.1rem)]">
            EVOLVE {unit.curto.toUpperCase()}
          </h1>
          <p className="dst-label mt-3 text-[color:rgba(242,240,236,0.45)]">
            {unit.cidade}/{unit.uf} · {EVENT.dataExtenso} · {EVENT.horaExtenso}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Na portaria, ler o QR é mais rápido que achar o nome na lista. */}
          <Link href="/admin/desafio-das-esteiras/checkin" className="dst-btn dst-btn--ghost">
            Ler QR Code
          </Link>
          <button
            type="button"
            onClick={() => void carregar()}
            className="dst-btn dst-btn--ghost"
            disabled={carregando}
          >
            {carregando ? "Atualizando…" : "Atualizar"}
          </button>
          <button type="button" onClick={() => void sair()} className="dst-btn dst-btn--ghost">
            Sair
          </button>
        </div>
      </header>

      {erro && (
        <p role="alert" className="dst-label mt-6 text-[color:var(--evolve)]">
          {erro}
        </p>
      )}
      {aviso && (
        <p role="status" className="dst-label mt-6 text-[color:var(--somma)]">
          {aviso}
        </p>
      )}

      {/* ── Números da noite ───────────────────────────────────────────── */}
      <section className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero rotulo="Inscritos" valor={totalPrevisto} />
        <Numero rotulo="Competidores" valor={daUnidade?.competidores ?? 0} nota={`de ${VAGAS_POR_UNIDADE}`} />
        <Numero rotulo="Só assistindo" valor={daUnidade?.espectadores ?? 0} />
        <Numero rotulo="Já chegaram" valor={jaChegaram} destaque nota={`${percentual}%`} />
      </section>

      {/* ── Barra de chegada ───────────────────────────────────────────── */}
      <div className="mt-4">
        <div className="h-2.5 w-full bg-[rgba(255,255,255,0.07)]">
          <div
            className="h-full bg-[color:var(--somma)] transition-[width] duration-500"
            style={{ width: `${percentual}%` }}
          />
        </div>
        <p className="dst-label mt-2 text-[color:rgba(242,240,236,0.35)]">
          {jaChegaram} de {totalPrevisto} presentes
        </p>
      </div>

      {/* ── Vagas por categoria ────────────────────────────────────────── */}
      {daUnidade && (
        <section className="mt-9">
          <h2 className="dst-label text-[color:rgba(242,240,236,0.45)]">Vagas para competir</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <CardVagas titulo="Feminino" vagas={daUnidade.vagas.feminino} />
            <CardVagas titulo="Masculino" vagas={daUnidade.vagas.masculino} />
          </div>
          <p className="dst-label mt-3 leading-relaxed text-[color:rgba(242,240,236,0.3)]">
            São {VAGAS_POR_CATEGORIA} vagas em cada categoria, distribuídas em{" "}
            {BATERIAS.length} baterias de 4 esteiras. A organização define quem corre em qual
            bateria.
          </p>
        </section>
      )}

      {/* ── Lista ──────────────────────────────────────────────────────── */}
      <section className="mt-11">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="dst-display text-[1.4rem]">QUEM VEM</h2>
          {/* Input próprio: `.dst-field` esconde o placeholder (é float label),
              e aqui o placeholder é a única instrução que a recepção tem. */}
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, código, e-mail ou telefone"
            aria-label="Buscar inscrito"
            className="w-full max-w-[400px] border px-3.5 py-2.5 text-[0.92rem] outline-none placeholder:text-[color:rgba(242,240,236,0.35)] focus:border-[color:var(--somma)]"
            style={{ background: "var(--ink-2)", borderColor: "var(--line)", color: "var(--paper)" }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAba(a.id)}
              className="dst-label border px-3.5 py-2 transition-colors"
              style={{
                borderColor: aba === a.id ? "var(--somma)" : "var(--line)",
                background: aba === a.id ? "rgba(255,44,4,0.12)" : "transparent",
                color: aba === a.id ? "var(--somma)" : "rgba(242,240,236,0.55)",
              }}
            >
              {a.nome}
            </button>
          ))}
        </div>

        {carregando && !dados ? (
          <p className="dst-label mt-8 text-[color:rgba(242,240,236,0.4)]">Carregando…</p>
        ) : lista.length === 0 ? (
          <p className="dst-label mt-8 text-[color:rgba(242,240,236,0.4)]">
            {busca.trim().length >= 3
              ? "Ninguém encontrado com esse termo."
              : "Nenhuma inscrição nesta lista ainda."}
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-[color:var(--line)] border-y border-[color:var(--line)]">
            {lista.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-4 py-4">
                <Avatar inscrito={i} />

                <div className="min-w-[190px] flex-1">
                  <p className="text-[0.98rem] font-semibold leading-tight">{i.full_name}</p>
                  <p className="dst-mono mt-1.5 text-[0.72rem] text-[color:rgba(242,240,236,0.4)]">
                    {i.ticket_code}
                    {i.sexo ? ` · ${i.sexo === "feminino" ? "Feminino" : "Masculino"}` : ""}
                    {i.heat_number ? ` · Bateria ${i.heat_number}` : ""}
                  </p>
                </div>

                <div className="text-right">
                  <p className="dst-label" style={{ color: STATUS_COR[i.status] }}>
                    {i.participacao === "espectador" && i.status === "confirmed"
                      ? "ASSISTINDO"
                      : STATUS_LABEL[i.status]}
                  </p>
                  <p className="dst-mono mt-1.5 text-[0.7rem] text-[color:rgba(242,240,236,0.32)]">
                    {i.status === "checked_in" ? horaInscrito(i.checked_in_at) : horaInscrito(i.created_at)}
                  </p>
                </div>

                {i.status !== "cancelled" && (
                  <button
                    type="button"
                    onClick={() => void marcarPresenca(i)}
                    disabled={marcando === i.id}
                    className="dst-btn dst-btn--ghost min-w-[128px] disabled:opacity-50"
                    style={
                      i.status === "checked_in"
                        ? undefined
                        : { borderColor: "var(--somma)", color: "var(--somma)" }
                    }
                  >
                    {marcando === i.id
                      ? "…"
                      : i.status === "checked_in"
                        ? "Desfazer"
                        : "Marcar chegada"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {dados?.truncado && (
          <p className="dst-label mt-4 text-[color:rgba(242,240,236,0.35)]">
            Mostrando os primeiros 500. Use a busca para achar alguém específico.
          </p>
        )}
      </section>

      <footer className="mt-14 border-t border-[color:var(--line)] pt-6">
        <p className="dst-label leading-relaxed text-[color:rgba(242,240,236,0.3)]">
          Este acesso acompanha a {unit.curto} e valida ticket na entrada. Para corrigir dado,
          cancelar inscrição ou distribuir bateria, fale com a organização.
        </p>
        <Link href="/desafios-das-esteiras-evolve" className="dst-label mt-4 inline-block underline underline-offset-4">
          Ver a página do evento
        </Link>
      </footer>
    </main>
  );
}

/* ── Peças ───────────────────────────────────────────────────────────────── */

function Numero({
  rotulo,
  valor,
  nota,
  destaque,
}: {
  rotulo: string;
  valor: number;
  nota?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className="border p-4"
      style={{
        borderColor: destaque ? "rgba(255,44,4,0.5)" : "var(--line)",
        background: destaque ? "rgba(255,44,4,0.07)" : "var(--ink-2)",
      }}
    >
      <p className="dst-label text-[color:rgba(242,240,236,0.4)]">{rotulo}</p>
      <p
        className="dst-display mt-2.5 text-[2rem] leading-none"
        style={destaque ? { color: "var(--somma)" } : undefined}
      >
        {valor}
      </p>
      {nota && <p className="dst-mono mt-1.5 text-[0.72rem] text-[color:rgba(242,240,236,0.35)]">{nota}</p>}
    </div>
  );
}

function CardVagas({ titulo, vagas }: { titulo: string; vagas: VagasCategoria }) {
  const cor =
    vagas.status === "esgotada"
      ? "var(--evolve)"
      : vagas.status === "ultimas"
        ? "var(--somma)"
        : "rgba(242,240,236,0.55)";

  return (
    <div className="border border-[color:var(--line)] bg-[color:var(--ink-2)] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="dst-display text-[1.15rem]">{titulo.toUpperCase()}</p>
        <p className="dst-mono text-[1.1rem]">
          {vagas.ocupadas}
          <span className="text-[color:rgba(242,240,236,0.35)]">/{vagas.total}</span>
        </p>
      </div>

      {/* uma marca por vaga: a categoria cheia se lê sem contar número */}
      <div className="mt-3 grid grid-cols-12 gap-1">
        {Array.from({ length: vagas.total }, (_, n) => (
          <i
            key={n}
            className="block h-6 border"
            style={{
              borderColor: n < vagas.ocupadas ? "rgba(255,44,4,0.7)" : "var(--line)",
              background: n < vagas.ocupadas ? "rgba(255,44,4,0.3)" : "transparent",
            }}
          />
        ))}
      </div>

      <p className="dst-label mt-3" style={{ color: cor }}>
        {vagas.restantes === 0
          ? "Esgotada"
          : vagas.restantes === 1
            ? "Última vaga"
            : `${vagas.restantes} vagas livres`}
      </p>

      <p className="dst-mono mt-2 text-[0.72rem] text-[color:rgba(242,240,236,0.35)]">
        {vagas.baterias.map((b) => `B${b.n}: ${b.ocupadas}`).join(" · ")}
        {vagas.semBateria > 0 ? ` · sem bateria: ${vagas.semBateria}` : ""}
      </p>
    </div>
  );
}

function Avatar({ inscrito }: { inscrito: Inscrito }) {
  if (inscrito.foto_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- foto do Storage, sem loader do next/image
      <img
        src={inscrito.foto_url}
        alt=""
        className="h-11 w-11 flex-none rounded-full object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="dst-mono flex h-11 w-11 flex-none items-center justify-center rounded-full text-[0.85rem]"
      style={{ background: "rgba(255,255,255,0.07)", color: "rgba(242,240,236,0.5)" }}
    >
      {iniciais(inscrito.full_name)}
    </span>
  );
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const a = partes[0]?.[0] ?? "";
  const b = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (a + b).toUpperCase();
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}
