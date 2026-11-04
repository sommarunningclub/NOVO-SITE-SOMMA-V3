"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Download, FileText, LogOut, MessageCircle, RefreshCw, Search, Undo2, X } from "lucide-react";
import { LIMITE_VAGAS, reais } from "@/lib/maratona-rio-2027/inscricao";
import { cn } from "@/lib/utils";

type Status = "aguardando_pagamento" | "pago" | "cancelado";

export interface Inscricao {
  id: number;
  criado_em: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  data_nascimento: string;
  sexo: "feminino" | "masculino";
  treinador: string;
  treinador_outro: string | null;
  estrutura_apoio: boolean;
  valor_total: number | string;
  status: Status;
  pago_em: string | null;
  comprovante_enviado_em: string | null;
}

/** Filtro da lista: um status, ou "conferir" (aguardando Pix com comprovante anexado). */
type Filtro = Status | "conferir";

const FUSO = "America/Sao_Paulo";
const dataHora = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, dateStyle: "short", timeStyle: "short" });
const diaBR = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO });

const NOME_STATUS: Record<Status, string> = {
  aguardando_pagamento: "Aguardando Pix",
  pago: "Pago",
  cancelado: "Cancelado",
};

const COR_STATUS: Record<Status, string> = {
  aguardando_pagamento: "border-amber-400/50 text-amber-300",
  pago: "border-bora/60 text-bora",
  cancelado: "border-white/20 text-white/40",
};

function telefoneLegivel(t: string): string {
  const d = t.startsWith("55") ? t.slice(2) : t;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return t;
}

const cpfLegivel = (c: string) => c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
const nascLegivel = (d: string) => d.split("-").reverse().join("/");
const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: string | number; detalhe?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-white/50">{rotulo}</p>
      <p className="mt-2 font-bora text-4xl font-black italic leading-none tabular-nums">{valor}</p>
      {detalhe && <p className="mt-2 text-sm text-white/55">{detalhe}</p>}
    </div>
  );
}

export function PainelInscricoes({
  inscricoes,
  comprovantes,
  treinadores,
  erro,
}: {
  inscricoes: Inscricao[];
  /** id da inscrição → link assinado do comprovante. */
  comprovantes: Record<number, string>;
  treinadores: Record<string, string>;
  erro?: string;
}) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<Filtro | null>(null);
  const [mudando, setMudando] = useState<number | null>(null);

  const nomeTreinador = (i: Inscricao) =>
    i.treinador === "outro" ? `${i.treinador_outro ?? "Outro"} (outro)` : treinadores[i.treinador] ?? i.treinador;

  const ativas = inscricoes.filter((i) => i.status !== "cancelado");
  const pagas = ativas.filter((i) => i.status === "pago");
  const aguardando = ativas.filter((i) => i.status === "aguardando_pagamento");
  const paraConferir = aguardando.filter((i) => i.comprovante_enviado_em);
  const soma = (l: Inscricao[]) => l.reduce((s, i) => s + Number(i.valor_total), 0);
  const comEstrutura = ativas.filter((i) => i.estrutura_apoio).length;
  const ocupadas = ativas.length;

  const porTreinador = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of ativas) m.set(nomeTreinador(i), (m.get(nomeTreinador(i)) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inscricoes]);
  const maiorTreinador = Math.max(1, ...porTreinador.map(([, n]) => n));

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim());
    const digitos = busca.replace(/\D/g, "");
    return inscricoes
      .map((i, n) => ({ ...i, ordem: n + 1 }))
      .filter((i) => {
        if (status === "conferir" ? !(i.status === "aguardando_pagamento" && i.comprovante_enviado_em) : status && i.status !== status) {
          return false;
        }
        if (!termo) return true;
        return (
          semAcento(i.nome).includes(termo) ||
          i.email.includes(termo) ||
          (digitos.length >= 3 && (i.cpf.includes(digitos) || i.telefone.includes(digitos)))
        );
      })
      .reverse();
  }, [inscricoes, busca, status]);

  async function mudar(i: Inscricao, novo: Status) {
    if (novo === "cancelado" && !window.confirm(`Cancelar a inscrição de ${i.nome}? A vaga volta para o lote.`)) return;
    if (novo === "aguardando_pagamento" && i.status === "cancelado" && ocupadas >= LIMITE_VAGAS) {
      if (!window.confirm(`O lote já tem ${ocupadas} de ${LIMITE_VAGAS} vagas ocupadas. Reativar mesmo assim?`)) return;
    }
    setMudando(i.id);
    const res = await fetch("/api/maratona-rio-2027/admin/inscricoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: i.id, status: novo }),
    }).catch(() => null);
    if (!res?.ok && res?.status !== 401) {
      const data = await res?.json().catch(() => ({}));
      window.alert(data?.error || "Não deu certo. Tente de novo.");
    }
    setMudando(null);
    router.refresh();
  }

  function baixarCsv() {
    const cab = [
      "Nº", "Nome", "E-mail", "Telefone", "CPF", "Nascimento", "Sexo", "Treinador",
      "Estrutura de apoio", "Total", "Status", "Comprovante", "Inscrito em", "Pago em",
    ];
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const linhas = [...filtradas].reverse().map((i) =>
      [
        String(i.ordem), i.nome, i.email, telefoneLegivel(i.telefone), cpfLegivel(i.cpf), nascLegivel(i.data_nascimento),
        i.sexo === "feminino" ? "Feminino" : "Masculino", nomeTreinador(i), i.estrutura_apoio ? "Sim" : "Não",
        Number(i.valor_total).toFixed(2).replace(".", ","), NOME_STATUS[i.status],
        i.comprovante_enviado_em ? `Enviado ${dataHora.format(new Date(i.comprovante_enviado_em))}` : "Não",
        dataHora.format(new Date(i.criado_em)), i.pago_em ? dataHora.format(new Date(i.pago_em)) : "",
      ].map(esc).join(";")
    );
    const blob = new Blob(["﻿" + [cab.map(esc).join(";"), ...linhas].join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meia-maratona-rio-2027-inscricoes-${diaBR.format(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function sair() {
    await fetch("/api/maratona-rio-2027/admin/login", { method: "DELETE" }).catch(() => null);
    router.refresh();
  }

  function Acoes({ i }: { i: Inscricao }) {
    const ocupado = mudando === i.id;
    const base = "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold disabled:opacity-40";
    return (
      <div className="flex flex-wrap justify-end gap-1.5">
        {i.status === "aguardando_pagamento" && (
          <button type="button" disabled={ocupado} onClick={() => mudar(i, "pago")} className={cn(base, "bg-bora text-black hover:bg-white")}>
            <Check className="h-3.5 w-3.5" /> Confirmar Pix
          </button>
        )}
        {i.status === "pago" && (
          <button type="button" disabled={ocupado} onClick={() => mudar(i, "aguardando_pagamento")} className={cn(base, "border border-white/15 text-white/70 hover:text-white")}>
            <Undo2 className="h-3.5 w-3.5" /> Desfazer
          </button>
        )}
        {i.status !== "cancelado" ? (
          <button type="button" disabled={ocupado} onClick={() => mudar(i, "cancelado")} className={cn(base, "text-white/40 hover:bg-red-500/15 hover:text-red-400")}>
            <X className="h-3.5 w-3.5" /> Cancelar
          </button>
        ) : (
          <button type="button" disabled={ocupado} onClick={() => mudar(i, "aguardando_pagamento")} className={cn(base, "border border-white/15 text-white/70 hover:text-white")}>
            <Undo2 className="h-3.5 w-3.5" /> Reativar
          </button>
        )}
      </div>
    );
  }

  const filtros: { id: Filtro | null; nome: string; n: number }[] = [
    { id: null, nome: "Todas", n: inscricoes.length },
    { id: "conferir", nome: "Comprovante para conferir", n: paraConferir.length },
    { id: "aguardando_pagamento", nome: "Aguardando Pix", n: aguardando.length },
    { id: "pago", nome: "Pagas", n: pagas.length },
    { id: "cancelado", nome: "Canceladas", n: inscricoes.length - ocupadas },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-bora text-sm font-bold uppercase tracking-[0.2em] text-bora">Painel da assessoria</p>
          <h1 className="mt-2 font-bora text-4xl font-black uppercase italic leading-none sm:text-5xl">
            Inscrições · Meia do Rio 2027
          </h1>
          <Link href="/assessoria/maratona-rio-2027/admin" className="mt-2 inline-block text-sm text-white/50 hover:text-bora">
            Ver cadastros de intenção →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm hover:border-white/40">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </button>
          <button type="button" onClick={baixarCsv} disabled={!filtradas.length} className="inline-flex items-center gap-2 rounded-full bg-bora px-4 py-2.5 text-sm font-bold text-black hover:bg-white disabled:opacity-40">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          <button type="button" onClick={sair} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/70 hover:border-white/40 hover:text-white">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>

      {erro && (
        <p role="alert" className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Não deu para ler as inscrições: {erro}
        </p>
      )}

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-xs font-medium uppercase tracking-widest text-white/50">Vagas ocupadas</p>
          <p className="text-sm tabular-nums text-white/60">
            {Math.max(LIMITE_VAGAS - ocupadas, 0)} {LIMITE_VAGAS - ocupadas === 1 ? "restante" : "restantes"}
          </p>
        </div>
        <p className="mt-2 font-bora text-5xl font-black italic leading-none tabular-nums">
          {ocupadas}
          <span className="text-2xl text-white/40"> / {LIMITE_VAGAS}</span>
        </p>
        {/* Pagas em verde cheio, aguardando em verde claro, por cima do total do lote. */}
        <div className="mt-4 flex h-3 gap-[2px] overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
          <div className="bg-bora" style={{ width: `${(pagas.length / LIMITE_VAGAS) * 100}%` }} />
          <div className="bg-bora/40" style={{ width: `${(aguardando.length / LIMITE_VAGAS) * 100}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/60">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-bora" /> Pagas: {pagas.length}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-bora/40" /> Aguardando Pix: {aguardando.length}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" /> Livres: {Math.max(LIMITE_VAGAS - ocupadas, 0)}</span>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero rotulo="Recebido" valor={reais(soma(pagas))} detalhe={`${pagas.length} ${pagas.length === 1 ? "inscrição paga" : "inscrições pagas"}`} />
        <Numero
          rotulo="A receber"
          valor={reais(soma(aguardando))}
          detalhe={`${aguardando.length} aguardando Pix · ${paraConferir.length} com comprovante`}
        />
        <Numero rotulo="Estrutura de apoio" valor={comEstrutura} detalhe={`de ${ocupadas} inscritos`} />
        <Numero
          rotulo="Mulheres · homens"
          valor={`${ativas.filter((i) => i.sexo === "feminino").length} · ${ativas.filter((i) => i.sexo === "masculino").length}`}
        />
      </div>

      {porTreinador.length > 0 && (
        <section className="mt-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="font-bora text-xs font-bold uppercase tracking-[0.2em] text-white/50">Por treinador</h2>
          <ul className="mt-4 space-y-3">
            {porTreinador.map(([nome, n]) => (
              <li key={nome}>
                <div className="flex justify-between text-sm">
                  <span>{nome}</span>
                  <strong className="tabular-nums">{n}</strong>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-bora" style={{ width: `${(n / maiorTreinador) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-3 rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:p-5">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <span className="sr-only">Buscar</span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail, CPF ou telefone"
              className="w-full rounded-full border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-bora"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {filtros.map((f) => (
              <button
                key={f.nome}
                type="button"
                onClick={() => setStatus(f.id)}
                aria-pressed={status === f.id}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm transition-colors",
                  status === f.id ? "border-bora bg-bora text-black" : "border-white/15 text-white/70 hover:border-white/40"
                )}
              >
                {f.nome} <span className="tabular-nums opacity-60">{f.n}</span>
              </button>
            ))}
          </div>
        </div>

        <ul className="divide-y divide-white/[0.06]">
          {filtradas.map((i) => (
            <li key={i.id} className={cn("grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-[1fr_auto] md:items-center", i.status === "cancelado" && "opacity-50")}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs tabular-nums text-white/35">#{i.ordem}</span>
                  <p className="font-medium">{i.nome}</p>
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-xs", COR_STATUS[i.status])}>{NOME_STATUS[i.status]}</span>
                  <span className="text-sm font-bold tabular-nums">{reais(Number(i.valor_total))}</span>
                  {i.estrutura_apoio && (
                    <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-white/60">+ estrutura</span>
                  )}
                  {comprovantes[i.id] ? (
                    <a
                      href={comprovantes[i.id]}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-black hover:bg-bora"
                    >
                      <FileText className="h-3.5 w-3.5" /> Ver comprovante
                    </a>
                  ) : (
                    i.status === "aguardando_pagamento" && <span className="text-xs text-white/35">sem comprovante</span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/60">
                  <a href={`https://wa.me/${i.telefone}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-bora">
                    <MessageCircle className="h-3.5 w-3.5" /> {telefoneLegivel(i.telefone)}
                  </a>
                  <span className="break-all">{i.email}</span>
                  <span>Treinador: {nomeTreinador(i)}</span>
                </div>
                <p className="mt-1 text-xs tabular-nums text-white/40">
                  CPF {cpfLegivel(i.cpf)} · nasc. {nascLegivel(i.data_nascimento)} ·{" "}
                  {i.sexo === "feminino" ? "Feminino" : "Masculino"} · inscrito {dataHora.format(new Date(i.criado_em))}
                  {i.pago_em && ` · pago ${dataHora.format(new Date(i.pago_em))}`} · Pix MDR27I{i.id}
                </p>
              </div>
              <Acoes i={i} />
            </li>
          ))}
          {!filtradas.length && (
            <li className="px-5 py-12 text-center text-white/45">
              {inscricoes.length ? "Nenhuma inscrição com esses filtros." : "Nenhuma inscrição ainda."}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
