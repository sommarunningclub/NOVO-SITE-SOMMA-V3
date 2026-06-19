import { type NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { PARQ_IDS, computeApto } from "@/lib/parq";

// Recebe as respostas do Par-Q e atualiza o cadastro do aluno
// em "gestao-clientes-assessoria", localizado pelo CPF.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cpf, answers, observacoes } = body as {
      cpf?: string;
      answers?: Record<string, unknown>;
      observacoes?: string;
    };

    if (!cpf) {
      return NextResponse.json({ error: "CPF não informado." }, { status: 400 });
    }
    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Respostas inválidas." }, { status: 400 });
    }

    // Normaliza para boolean e garante que todas as perguntas foram respondidas.
    const normalized: Record<string, boolean> = {};
    for (const id of PARQ_IDS) {
      const v = answers[id];
      if (v !== true && v !== false) {
        return NextResponse.json(
          { error: "Responda todas as perguntas do Par-Q." },
          { status: 400 }
        );
      }
      normalized[id] = v;
    }

    const supabase = getSupabase();
    if (!supabase) {
      console.warn("[parq] Supabase não configurado. Respostas não persistidas:", { cpf });
      return NextResponse.json({ success: true, persisted: false });
    }

    const cpfDigits = String(cpf).replace(/\D/g, "");
    const cpfFormatted = cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    const payload = {
      ...normalized,
      parq_observacoes: observacoes?.trim() || null,
      parq_apto: computeApto(normalized),
      parq_respondido_em:
        new Date()
          .toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" })
          .replace(" ", "T") + "-03:00",
    };

    // Atualiza pelo CPF (compara contra dígitos e formatado).
    const { data, error } = await supabase
      .from("gestao-clientes-assessoria")
      .update(payload)
      .in("cpf", [cpfDigits, cpfFormatted, cpf])
      .select("id");

    if (error) {
      console.error("[parq] Erro ao atualizar cadastro:", error);
      return NextResponse.json(
        { error: "Não foi possível salvar suas respostas agora." },
        { status: 400 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Cadastro não encontrado para este CPF." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, persisted: true, apto: payload.parq_apto });
  } catch (err) {
    console.error("[parq] Erro interno:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
