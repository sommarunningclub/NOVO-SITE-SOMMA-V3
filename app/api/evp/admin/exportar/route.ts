import { NextResponse } from "next/server";
import { exigir } from "@/lib/evp/auth";
import { ROTULO_DISTANCIA, SEM_PROVA, SLUG, type DistanciaInscricao } from "@/lib/evp/config";
import { rpc } from "@/lib/evp/db";
import { cpfMascarado } from "@/lib/evp/schema";

export const dynamic = "force-dynamic";

type Linha = {
  status: string; codigo: string; nome: string; email: string; telefone: string; cpf_final: string;
  sexo: string; distancia: DistanciaInscricao; primeira_vez: boolean; aceite_marketing: boolean;
  tem_assessoria: boolean; assessoria_nome: string | null; ja_membro: boolean;
  origem_fonte: string; created_at: string; confirmada_em: string | null; cancelada_em: string | null; checkin_em: string | null;
};

const STATUS: Record<string, string> = { confirmada: "Confirmada", lista_espera: "Lista de espera", cancelada: "Cancelada" };

/** Célula segura: aspas escapadas e nada que o Excel leia como fórmula. */
function celula(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const quando = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }) : "";

/**
 * CSV dos participantes. O CPF sai mascarado: a planilha circula, e o CPF
 * inteiro só é visto um a um, no painel, com registro de quem viu. Cada
 * exportação fica no histórico.
 */
export async function GET() {
  const { sessao, negado } = await exigir("admin");
  if (negado) return negado;
  try {
    const linhas = (await rpc<Linha[]>("evp_admin_participantes", { p_slug: SLUG })) ?? [];
    const cabecalho = [
      "Status", "Código", "Nome", "E-mail", "WhatsApp", "CPF", "Sexo", "Vai correr", "Distância", "Primeira vez na distância",
      "Assessoria", "Já era da base SOMMA",
      "Aceita comunicação", "Origem", "Inscrição em", "Confirmada em", "Cancelada em", "Check-in em",
    ];
    const corpo = linhas.map((l) =>
      [
        STATUS[l.status] ?? l.status, l.codigo, l.nome, l.email, l.telefone, cpfMascarado(l.cpf_final),
        l.sexo === "feminino" ? "Feminino" : "Masculino", l.distancia === SEM_PROVA ? "Não" : "Sim",
        l.distancia === SEM_PROVA ? "" : (ROTULO_DISTANCIA[l.distancia] ?? l.distancia),
        l.distancia === SEM_PROVA ? "" : l.primeira_vez ? "Sim" : "Não",
        l.tem_assessoria ? (l.assessoria_nome || "Sim") : "Não", l.ja_membro ? "Sim" : "Não", l.aceite_marketing ? "Sim" : "Não", l.origem_fonte,
        quando(l.created_at), quando(l.confirmada_em), quando(l.cancelada_em), quando(l.checkin_em),
      ].map(celula).join(";")
    );
    await rpc("evp_admin_log", {
      p_slug: SLUG, p_staff: sessao.id, p_acao: "participantes_exportados", p_alvo_tipo: "evento", p_alvo_id: null,
      p_detalhes: { linhas: linhas.length },
    });
    const csv = `﻿${[cabecalho.map(celula).join(";"), ...corpo].join("\r\n")}\r\n`;
    const dia = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="meeting-tecnico-participantes-${dia}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível exportar." }, { status: 503 });
  }
}
