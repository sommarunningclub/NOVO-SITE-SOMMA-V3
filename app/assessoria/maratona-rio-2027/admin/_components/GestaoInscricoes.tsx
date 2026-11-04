"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ClipboardCopy,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Lock,
  MessageCircle,
  NotebookPen,
  RefreshCw,
  Search,
  Undo2,
  Unlock,
  X,
} from "lucide-react";
import { reais } from "@/lib/maratona-rio-2027/inscricao";
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
  observacao: string | null;
}

export interface Comprovante {
  url: string;
  tipo: "imagem" | "pdf";
}

export interface ConfigLote {
  limite: number;
  abertas: boolean;
  doBanco: boolean;
}

/** Filtro da lista: um status, ou "conferir" (aguardando Pix com comprovante anexado). */
type Filtro = Status | "conferir";

const LINK_PUBLICO = "https://sommaclub.com.br/assessoria/maratona-rio-2027-garanta-sua-vaga";
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
const sexoLegivel = (s: Inscricao["sexo"]) => (s === "feminino" ? "Feminino" : "Masculino");

async function copiarTexto(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const area = document.createElement("textarea");
    area.value = texto;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}

function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: string | number; detalhe?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-white/50">{rotulo}</p>
      <p className="mt-2 font-bora text-3xl font-black italic leading-none tabular-nums sm:text-4xl">{valor}</p>
      {detalhe && <p className="mt-2 text-sm text-white/55">{detalhe}</p>}
    </div>
  );
}

export function GestaoInscricoes({
  inscricoes,
  comprovantes,
  treinadores,
  config,
  erro,
}: {
  inscricoes: Inscricao[];
  /** id da inscrição → link assinado (1 h) do comprovante. */
  comprovantes: Record<number, Comprovante>;
  treinadores: Record<string, string>;
  config: ConfigLote;
  erro?: string;
}) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro | null>(null);
  const [mudando, setMudando] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [vendo, setVendo] = useState<Inscricao | null>(null);
  const [destaque, setDestaque] = useState<number | null>(null);
  const [notaAberta, setNotaAberta] = useState<number | null>(null);
  const [nota, setNota] = useState("");
  const [limiteNovo, setLimiteNovo] = useState(String(config.limite));
  const [salvandoLote, setSalvandoLote] = useState(false);

  useEffect(() => setLimiteNovo(String(config.limite)), [config.limite]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2200);
    return () => clearTimeout(t);
  }, [aviso]);

  useEffect(() => {
    if (!vendo) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setVendo(null);
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [vendo]);

  const nomeTreinador = (i: Inscricao) =>
    i.treinador === "outro" ? `${i.treinador_outro ?? "Outro"} (outro)` : treinadores[i.treinador] ?? i.treinador;

  // Número da vaga: ordem de chegada entre as inscrições que ocupam vaga.
  const ativas = useMemo(() => inscricoes.filter((i) => i.status !== "cancelado"), [inscricoes]);
  const vagaDe = useMemo(() => new Map(ativas.map((i, n) => [i.id, n + 1])), [ativas]);
  const pagas = ativas.filter((i) => i.status === "pago");
  const aguardando = ativas.filter((i) => i.status === "aguardando_pagamento");
  const paraConferir = aguardando.filter((i) => i.comprovante_enviado_em);
  const soma = (l: Inscricao[]) => l.reduce((s, i) => s + Number(i.valor_total), 0);
  const comEstrutura = ativas.filter((i) => i.estrutura_apoio).length;
  const ocupadas = ativas.length;
  const livres = Math.max(config.limite - ocupadas, 0);

  const porTreinador = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of ativas) m.set(nomeTreinador(i), (m.get(nomeTreinador(i)) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativas]);
  const maiorTreinador = Math.max(1, ...porTreinador.map(([, n]) => n));

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim());
    const digitos = busca.replace(/\D/g, "");
    return inscricoes
      .filter((i) => {
        if (filtro === "conferir") {
          if (!(i.status === "aguardando_pagamento" && i.comprovante_enviado_em)) return false;
        } else if (filtro && i.status !== filtro) return false;
        if (!termo) return true;
        return (
          semAcento(i.nome).includes(termo) ||
          i.email.includes(termo) ||
          (digitos.length >= 3 && (i.cpf.includes(digitos) || i.telefone.includes(digitos)))
        );
      })
      .sort((a, b) => (vagaDe.get(a.id) ?? 9999) - (vagaDe.get(b.id) ?? 9999) || a.id - b.id);
  }, [inscricoes, busca, filtro, vagaDe]);

  function linhaDe(i: Inscricao): string[] {
    return [
      vagaDe.has(i.id) ? String(vagaDe.get(i.id)) : "",
      i.nome,
      cpfLegivel(i.cpf),
      nascLegivel(i.data_nascimento),
      sexoLegivel(i.sexo),
      i.email,
      telefoneLegivel(i.telefone),
      nomeTreinador(i),
      i.estrutura_apoio ? "Sim" : "Não",
      Number(i.valor_total).toFixed(2).replace(".", ","),
      NOME_STATUS[i.status],
      i.comprovante_enviado_em ? "Sim" : "Não",
      dataHora.format(new Date(i.criado_em)),
      i.pago_em ? dataHora.format(new Date(i.pago_em)) : "",
      i.observacao ?? "",
    ];
  }
  const CABECALHO = [
    "Vaga", "Nome", "CPF", "Nascimento", "Sexo", "E-mail", "Telefone", "Treinador",
    "Estrutura de apoio", "Total (R$)", "Status", "Comprovante", "Inscrito em", "Pago em", "Observação",
  ];

  function baixarCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const linhas = [CABECALHO, ...filtradas.map(linhaDe)].map((l) => l.map(esc).join(";"));
    const blob = new Blob(["﻿" + linhas.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meia-maratona-rio-2027-inscricoes-${diaBR.format(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Tabulado: cola direto no Google Planilhas ou no Excel, uma coluna por campo. */
  async function copiarLista() {
    const tsv = [CABECALHO, ...filtradas.map(linhaDe)]
      .map((l) => l.map((v) => v.replace(/[\t\r\n]+/g, " ")).join("\t"))
      .join("\n");
    await copiarTexto(tsv);
    setAviso(`${filtradas.length} ${filtradas.length === 1 ? "inscrição copiada" : "inscrições copiadas"}. Cole na planilha.`);
  }

  async function copiarDados(i: Inscricao) {
    const texto = [
      `Nome: ${i.nome}`,
      `CPF: ${cpfLegivel(i.cpf)}`,
      `Nascimento: ${nascLegivel(i.data_nascimento)}`,
      `Sexo: ${sexoLegivel(i.sexo)}`,
      `E-mail: ${i.email}`,
      `Telefone: ${telefoneLegivel(i.telefone)}`,
      `Treinador: ${nomeTreinador(i)}`,
      `Prova: Meia Maratona 21 km, kit sem camisa`,
      `Estrutura de apoio: ${i.estrutura_apoio ? "Sim" : "Não"}`,
      `Total: ${reais(Number(i.valor_total))} (${NOME_STATUS[i.status]})`,
    ].join("\n");
    await copiarTexto(texto);
    setAviso(`Dados de ${i.nome.split(" ")[0]} copiados.`);
  }

  async function copiarCampo(valor: string, rotulo: string) {
    await copiarTexto(valor);
    setAviso(`${rotulo} copiado.`);
  }

  async function salvar(corpo: Record<string, unknown>, url = "/api/maratona-rio-2027/admin/inscricoes") {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    }).catch(() => null);
    if (!res?.ok && res?.status !== 401) {
      const data = await res?.json().catch(() => ({}));
      window.alert(data?.error || "Não deu certo. Tente de novo.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function mudar(i: Inscricao, novo: Status) {
    if (novo === "cancelado" && !window.confirm(`Cancelar a inscrição de ${i.nome}? A vaga volta para o lote.`)) return;
    if (novo === "aguardando_pagamento" && i.status === "cancelado" && ocupadas >= config.limite) {
      if (!window.confirm(`O lote já tem ${ocupadas} de ${config.limite} vagas ocupadas. Reativar mesmo assim?`)) return;
    }
    setMudando(i.id);
    const ok = await salvar({ id: i.id, status: novo });
    setMudando(null);
    if (ok && vendo?.id === i.id) setVendo(null);
    if (ok) setAviso(novo === "pago" ? `Pix de ${i.nome.split(" ")[0]} confirmado.` : "Inscrição atualizada.");
  }

  async function salvarNota(i: Inscricao) {
    setMudando(i.id);
    const ok = await salvar({ id: i.id, observacao: nota });
    setMudando(null);
    if (ok) {
      setNotaAberta(null);
      setAviso("Observação salva.");
    }
  }

  async function salvarLote(corpo: { limite?: number; abertas?: boolean }) {
    if (corpo.limite !== undefined && corpo.limite < ocupadas) {
      const ok = window.confirm(
        `Já existem ${ocupadas} inscrições ocupando vaga. Com ${corpo.limite} vagas ninguém é removido, mas ninguém novo consegue entrar. Salvar mesmo assim?`
      );
      if (!ok) return;
    }
    if (corpo.abertas === false && !window.confirm("Fechar as inscrições? O formulário some do link público.")) return;
    setSalvandoLote(true);
    const ok = await salvar(corpo, "/api/maratona-rio-2027/admin/config");
    setSalvandoLote(false);
    if (ok) {
      setAviso(
        corpo.abertas === undefined ? `Lote com ${corpo.limite} vagas.` : corpo.abertas ? "Inscrições abertas." : "Inscrições fechadas."
      );
    }
  }

  function irPara(id: number) {
    setFiltro(null);
    setBusca("");
    setDestaque(id);
    requestAnimationFrame(() =>
      document.getElementById(`insc-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
    setTimeout(() => setDestaque(null), 2500);
  }

  const filtros: { id: Filtro | null; nome: string; n: number }[] = [
    { id: null, nome: "Todas", n: inscricoes.length },
    { id: "conferir", nome: "Comprovante para conferir", n: paraConferir.length },
    { id: "aguardando_pagamento", nome: "Aguardando Pix", n: aguardando.length },
    { id: "pago", nome: "Pagas", n: pagas.length },
    { id: "cancelado", nome: "Canceladas", n: inscricoes.length - ocupadas },
  ];

  const celulas = Math.max(config.limite, ocupadas);
  const limiteDigitado = Number(limiteNovo);
  const limiteValido = Number.isInteger(limiteDigitado) && limiteDigitado >= 0 && limiteDigitado <= 1000;

  return (
    <div>
      {erro && (
        <p role="alert" className="mb-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Não deu para ler as inscrições: {erro}
        </p>
      )}

      {/* Lote: vagas, abertura e link */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-medium uppercase tracking-widest text-white/50">Vagas ocupadas</p>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold",
                  config.abertas ? "bg-bora text-black" : "bg-red-500/20 text-red-300"
                )}
              >
                {config.abertas ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {config.abertas ? (livres ? "Inscrições abertas" : "Esgotado") : "Inscrições fechadas"}
              </span>
            </div>
            <p className="mt-2 font-bora text-5xl font-black italic leading-none tabular-nums">
              {ocupadas}
              <span className="text-2xl text-white/40"> / {config.limite}</span>
            </p>
            <div className="mt-4 flex h-3 gap-[2px] overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
              <div className="bg-bora" style={{ width: `${(pagas.length / Math.max(celulas, 1)) * 100}%` }} />
              <div className="bg-bora/40" style={{ width: `${(aguardando.length / Math.max(celulas, 1)) * 100}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/60">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-bora" /> Pagas: {pagas.length}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-bora/40" /> Aguardando Pix: {aguardando.length}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" /> Livres: {livres}</span>
            </div>
          </div>

          <div className="w-full space-y-3 lg:w-80">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <label className="text-xs font-medium uppercase tracking-widest text-white/50" htmlFor="limite-vagas">
                Vagas do lote
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="limite-vagas"
                  value={limiteNovo}
                  onChange={(e) => setLimiteNovo(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  className="w-20 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-center text-lg font-bold tabular-nums text-white outline-none focus:border-bora"
                />
                <button
                  type="button"
                  disabled={salvandoLote || !limiteValido || limiteDigitado === config.limite}
                  onClick={() => salvarLote({ limite: limiteDigitado })}
                  className="flex-1 rounded-xl bg-bora px-3 py-2 text-sm font-bold text-black hover:bg-white disabled:opacity-40"
                >
                  Salvar
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                {[5, 10, 20].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={salvandoLote}
                    onClick={() => salvarLote({ limite: config.limite + n })}
                    className="flex-1 rounded-xl border border-white/15 py-1.5 text-sm text-white/80 hover:border-bora hover:text-bora disabled:opacity-40"
                  >
                    +{n} vagas
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={salvandoLote}
                onClick={() => salvarLote({ abertas: !config.abertas })}
                className={cn(
                  "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold disabled:opacity-40",
                  config.abertas
                    ? "border border-red-500/40 text-red-300 hover:bg-red-500/10"
                    : "bg-bora text-black hover:bg-white"
                )}
              >
                {config.abertas ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                {config.abertas ? "Fechar inscrições" : "Abrir inscrições"}
              </button>
              {!config.doBanco && (
                <p className="mt-3 text-xs text-amber-300">
                  A tabela de configuração ainda não existe no banco: valem 50 vagas fixas até ela ser criada.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => copiarCampo(LINK_PUBLICO, "Link da inscrição")}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:border-white/40"
              >
                <Copy className="h-4 w-4" /> Copiar link
              </button>
              <a
                href={LINK_PUBLICO}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 hover:border-white/40"
              >
                <ExternalLink className="h-4 w-4" /> Abrir página
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero rotulo="Recebido" valor={reais(soma(pagas))} detalhe={`${pagas.length} ${pagas.length === 1 ? "paga" : "pagas"}`} />
        <Numero
          rotulo="A receber"
          valor={reais(soma(aguardando))}
          detalhe={`${aguardando.length} aguardando · ${paraConferir.length} com comprovante`}
        />
        <Numero rotulo="Estrutura de apoio" valor={comEstrutura} detalhe={`de ${ocupadas} inscritos`} />
        <Numero
          rotulo="Mulheres · homens"
          valor={`${ativas.filter((i) => i.sexo === "feminino").length} · ${ativas.filter((i) => i.sexo === "masculino").length}`}
        />
      </div>

      {/* Mapa de vagas */}
      <section className="mt-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bora text-xs font-bold uppercase tracking-[0.2em] text-white/50">Mapa de vagas</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-bora" /> Pago</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-bora bg-bora/25" /> Comprovante para conferir</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-amber-400/70" /> Aguardando Pix</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-white/[0.06]" /> Livre</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
          {Array.from({ length: celulas }, (_, n) => {
            const i = ativas[n];
            const excedente = n >= config.limite;
            if (!i) {
              return (
                <span
                  key={`livre-${n}`}
                  className="flex aspect-square items-center justify-center rounded-lg bg-white/[0.05] text-[11px] tabular-nums text-white/25"
                >
                  {n + 1}
                </span>
              );
            }
            const comComprovante = i.status === "aguardando_pagamento" && Boolean(i.comprovante_enviado_em);
            return (
              <button
                key={i.id}
                type="button"
                onClick={() => irPara(i.id)}
                title={`Vaga ${n + 1}: ${i.nome} · ${NOME_STATUS[i.status]}${comComprovante ? " · comprovante para conferir" : ""}`}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg text-[11px] font-bold tabular-nums transition-transform hover:scale-110",
                  i.status === "pago" && "bg-bora text-black",
                  comComprovante && "border-2 border-bora bg-bora/25 text-bora",
                  i.status === "aguardando_pagamento" && !comComprovante && "border border-amber-400/70 text-amber-300",
                  excedente && "ring-2 ring-red-400/70"
                )}
              >
                {n + 1}
              </button>
            );
          })}
        </div>
        {ocupadas > config.limite && (
          <p className="mt-3 text-xs text-red-300">
            Há {ocupadas - config.limite} {ocupadas - config.limite === 1 ? "inscrição" : "inscrições"} além do limite
            atual (contorno vermelho).
          </p>
        )}
        <p className="mt-3 text-xs text-white/40">Toque numa vaga para ir até a pessoa na lista.</p>
      </section>

      {porTreinador.length > 0 && (
        <section className="mt-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="font-bora text-xs font-bold uppercase tracking-[0.2em] text-white/50">Por treinador</h2>
          <ul className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2">
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

      {/* Lista */}
      <section className="mt-3 rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <span className="sr-only">Buscar</span>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, e-mail, CPF ou telefone"
                className="w-full rounded-full border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-bora"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copiarLista}
                disabled={!filtradas.length}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm hover:border-white/40 disabled:opacity-40 sm:flex-none"
              >
                <ClipboardCopy className="h-4 w-4" /> Copiar lista
              </button>
              <button
                type="button"
                onClick={baixarCsv}
                disabled={!filtradas.length}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-bora px-4 py-2.5 text-sm font-bold text-black hover:bg-white disabled:opacity-40 sm:flex-none"
              >
                <Download className="h-4 w-4" /> Exportar CSV
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {filtros.map((f) => (
              <button
                key={f.nome}
                type="button"
                onClick={() => setFiltro(f.id)}
                aria-pressed={filtro === f.id}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm transition-colors",
                  filtro === f.id ? "border-bora bg-bora text-black" : "border-white/15 text-white/70 hover:border-white/40"
                )}
              >
                {f.nome} <span className="tabular-nums opacity-60">{f.n}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-white/40">
            Copiar lista e Exportar CSV levam o que está filtrado. A lista copiada cola direto numa planilha.
          </p>
        </div>

        <ul className="divide-y divide-white/[0.06]">
          {filtradas.map((i) => {
            const vaga = vagaDe.get(i.id);
            const ocupado = mudando === i.id;
            const base = "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold disabled:opacity-40";
            return (
              <li
                key={i.id}
                id={`insc-${i.id}`}
                className={cn(
                  "px-4 py-4 transition-colors sm:px-5",
                  i.status === "cancelado" && "opacity-55",
                  destaque === i.id && "bg-bora/10"
                )}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-bold tabular-nums">
                        {vaga ? `Vaga ${vaga}` : "Sem vaga"}
                      </span>
                      <p className="font-medium">{i.nome}</p>
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-xs", COR_STATUS[i.status])}>
                        {NOME_STATUS[i.status]}
                      </span>
                      <span className="text-sm font-bold tabular-nums">{reais(Number(i.valor_total))}</span>
                      {i.estrutura_apoio && (
                        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-white/60">+ estrutura</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-white/65">
                      <a
                        href={`https://wa.me/${i.telefone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 hover:text-bora"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> {telefoneLegivel(i.telefone)}
                      </a>
                      <button type="button" onClick={() => copiarCampo(i.email, "E-mail")} className="break-all text-left hover:text-bora" title="Copiar e-mail">
                        {i.email}
                      </button>
                      <button type="button" onClick={() => copiarCampo(cpfLegivel(i.cpf), "CPF")} className="tabular-nums hover:text-bora" title="Copiar CPF">
                        CPF {cpfLegivel(i.cpf)}
                      </button>
                      <span>Treinador: {nomeTreinador(i)}</span>
                    </div>
                    <p className="mt-1 text-xs tabular-nums text-white/40">
                      Nasc. {nascLegivel(i.data_nascimento)} · {sexoLegivel(i.sexo)} · inscrito{" "}
                      {dataHora.format(new Date(i.criado_em))}
                      {i.comprovante_enviado_em && ` · comprovante ${dataHora.format(new Date(i.comprovante_enviado_em))}`}
                      {i.pago_em && ` · pago ${dataHora.format(new Date(i.pago_em))}`} · Pix MDR27I{i.id}
                    </p>
                    {i.observacao && notaAberta !== i.id && (
                      <p className="mt-2 rounded-lg bg-white/[0.05] px-3 py-2 text-sm text-white/75">📝 {i.observacao}</p>
                    )}
                    {notaAberta === i.id && (
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <textarea
                          value={nota}
                          onChange={(e) => setNota(e.target.value)}
                          maxLength={1000}
                          rows={2}
                          autoFocus
                          placeholder="Observação interna da equipe"
                          className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-bora"
                        />
                        <div className="flex gap-2 sm:flex-col">
                          <button type="button" disabled={ocupado} onClick={() => salvarNota(i)} className={cn(base, "justify-center bg-bora text-black")}>
                            Salvar
                          </button>
                          <button type="button" onClick={() => setNotaAberta(null)} className={cn(base, "justify-center text-white/60")}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 lg:max-w-[22rem] lg:justify-end">
                    {comprovantes[i.id] ? (
                      <button type="button" onClick={() => setVendo(i)} className={cn(base, "bg-white text-black hover:bg-bora")}>
                        <FileText className="h-3.5 w-3.5" /> Ver comprovante
                      </button>
                    ) : (
                      i.status === "aguardando_pagamento" && (
                        <span className="inline-flex items-center px-2 py-2 text-xs text-white/35">sem comprovante</span>
                      )
                    )}
                    {i.status === "aguardando_pagamento" && (
                      <button type="button" disabled={ocupado} onClick={() => mudar(i, "pago")} className={cn(base, "bg-bora text-black hover:bg-white")}>
                        <Check className="h-3.5 w-3.5" /> Confirmar Pix
                      </button>
                    )}
                    <button type="button" onClick={() => copiarDados(i)} className={cn(base, "border border-white/15 text-white/80 hover:border-white/40")}>
                      <Copy className="h-3.5 w-3.5" /> Copiar dados
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNota(i.observacao ?? "");
                        setNotaAberta(i.id);
                      }}
                      className={cn(base, "border border-white/15 text-white/70 hover:border-white/40")}
                    >
                      <NotebookPen className="h-3.5 w-3.5" /> Observação
                    </button>
                    {i.status === "pago" && (
                      <button type="button" disabled={ocupado} onClick={() => mudar(i, "aguardando_pagamento")} className={cn(base, "text-white/50 hover:text-white")}>
                        <Undo2 className="h-3.5 w-3.5" /> Desfazer pago
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
                </div>
              </li>
            );
          })}
          {!filtradas.length && (
            <li className="px-5 py-12 text-center text-white/45">
              {inscricoes.length ? "Nenhuma inscrição com esses filtros." : "Nenhuma inscrição ainda."}
            </li>
          )}
        </ul>
      </section>

      {/* Comprovante aberto no próprio painel */}
      {vendo && comprovantes[vendo.id] && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
          <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setVendo(null)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Comprovante de ${vendo.nome}`}
            className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b0b0b] sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4 sm:p-5">
              <div className="min-w-0">
                <p className="truncate font-medium">{vendo.nome}</p>
                <p className="mt-0.5 text-sm text-white/55">
                  {vagaDe.has(vendo.id) ? `Vaga ${vagaDe.get(vendo.id)} · ` : ""}
                  Esperado: <strong className="text-white">{reais(Number(vendo.valor_total))}</strong>
                  {vendo.estrutura_apoio ? " (com estrutura)" : ""} · {NOME_STATUS[vendo.status]}
                </p>
              </div>
              <button type="button" onClick={() => setVendo(null)} aria-label="Fechar" className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-black/40 p-3">
              {comprovantes[vendo.id].tipo === "pdf" ? (
                <iframe src={comprovantes[vendo.id].url} title="Comprovante" className="h-[65vh] w-full rounded-xl bg-white" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={comprovantes[vendo.id].url} alt={`Comprovante de ${vendo.nome}`} className="mx-auto max-h-[65vh] w-auto rounded-xl" />
              )}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-white/10 p-4 sm:p-5">
              <a
                href={comprovantes[vendo.id].url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-3 text-sm hover:border-white/40"
              >
                <ExternalLink className="h-4 w-4" /> Abrir em outra aba
              </a>
              {vendo.status === "aguardando_pagamento" && (
                <button
                  type="button"
                  disabled={mudando === vendo.id}
                  onClick={() => mudar(vendo, "pago")}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-bora px-4 py-3 text-sm font-bold text-black hover:bg-white disabled:opacity-40"
                >
                  <Check className="h-4 w-4" /> Confirmar Pix de {reais(Number(vendo.valor_total))}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {aviso && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[110] -translate-x-1/2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black shadow-lg"
        >
          {aviso}
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/70 hover:border-white/40"
        >
          <RefreshCw className="h-4 w-4" /> Atualizar dados
        </button>
      </div>
    </div>
  );
}
