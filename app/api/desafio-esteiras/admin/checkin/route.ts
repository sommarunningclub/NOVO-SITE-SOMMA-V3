import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { canActOnUnit, requireOperator } from "@/lib/desafio-esteiras/auth";
import { TABLE, type Registration } from "@/lib/desafio-esteiras/db";
import { extractToken, normalizeTicketCode } from "@/lib/desafio-esteiras/ticket";
import { getUnit } from "@/lib/desafio-esteiras/event.config";
import { checkinSchema } from "@/lib/desafio-esteiras/schema";

export const dynamic = "force-dynamic";

const COLUNAS =
  "id, full_name, unit_id, ticket_code, ticket_token, status, created_at, checked_in_at, checked_in_by";

/**
 * Valida o ticket no dia do evento.
 *
 * Regras:
 * - operador só valida ticket da própria unidade;
 * - segundo check-in é recusado com o horário da primeira validação;
 * - o UPDATE é condicionado a `status = 'confirmed'`, então dois leitores
 *   apontando para o mesmo QR ao mesmo tempo não conseguem validar duas vezes.
 */
export async function POST(request: NextRequest) {
  const auth = await requireOperator();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = checkinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe o QR Code ou o código do ticket." }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });

  const raw = parsed.data.value;
  const token = extractToken(raw);
  const codigo = normalizeTicketCode(raw);

  // Localiza por token (QR) ou por código digitado.
  let registro: Registration | null = null;

  if (token.length >= 20 && /^[A-Za-z0-9_-]+$/.test(token)) {
    const { data } = await supabase.from(TABLE).select(COLUNAS).eq("ticket_token", token).maybeSingle();
    registro = (data as unknown as Registration) ?? null;
  }
  if (!registro && codigo.startsWith("DST")) {
    const { data } = await supabase.from(TABLE).select(COLUNAS).eq("ticket_code", codigo).maybeSingle();
    registro = (data as unknown as Registration) ?? null;
  }

  if (!registro) {
    return NextResponse.json({ resultado: "nao_encontrado", error: "Ticket não encontrado." }, { status: 404 });
  }

  const unit = getUnit(registro.unit_id);

  if (!canActOnUnit(auth.session, registro.unit_id)) {
    return NextResponse.json(
      {
        resultado: "unidade_incorreta",
        error: `Este ticket é da ${unit?.nome ?? registro.unit_id}. Você só pode validar tickets da sua unidade.`,
        participante: { full_name: registro.full_name, unit_id: registro.unit_id, ticket_code: registro.ticket_code },
      },
      { status: 403 }
    );
  }

  if (registro.status === "cancelled") {
    return NextResponse.json(
      { resultado: "cancelado", error: "Este ticket foi cancelado.", participante: publico(registro) },
      { status: 409 }
    );
  }

  if (registro.status === "checked_in") {
    return NextResponse.json(
      {
        resultado: "ja_utilizado",
        error: "TICKET JÁ UTILIZADO",
        checked_in_at: registro.checked_in_at,
        checked_in_by: registro.checked_in_by,
        participante: publico(registro),
      },
      { status: 409 }
    );
  }

  const agora = new Date().toISOString();
  const quem =
    auth.session.role === "admin" ? "admin" : `${auth.session.role}:${auth.session.unitId}`;

  const { data: atualizado, error } = await supabase
    .from(TABLE)
    .update({ status: "checked_in", checked_in_at: agora, checked_in_by: quem })
    .eq("id", registro.id)
    .eq("status", "confirmed") // corrida: só o primeiro UPDATE encontra a linha
    .select(COLUNAS)
    .maybeSingle();

  if (error) {
    console.error("[desafio-esteiras] checkin falhou:", error.message);
    return NextResponse.json({ error: "Não foi possível validar. Tente novamente." }, { status: 500 });
  }

  if (!atualizado) {
    // Outro leitor validou entre o SELECT e o UPDATE.
    const { data: agoraRegistro } = await supabase
      .from(TABLE)
      .select(COLUNAS)
      .eq("id", registro.id)
      .maybeSingle();
    const atual = (agoraRegistro as unknown as Registration) ?? registro;
    return NextResponse.json(
      {
        resultado: "ja_utilizado",
        error: "TICKET JÁ UTILIZADO",
        checked_in_at: atual.checked_in_at,
        checked_in_by: atual.checked_in_by,
        participante: publico(atual),
      },
      { status: 409 }
    );
  }

  const registroFinal = atualizado as unknown as Registration;
  return NextResponse.json({
    resultado: "validado",
    checked_in_at: registroFinal.checked_in_at,
    checked_in_by: registroFinal.checked_in_by,
    participante: publico(registroFinal),
  });
}

function publico(r: Registration) {
  return {
    full_name: r.full_name,
    unit_id: r.unit_id,
    ticket_code: r.ticket_code,
    status: r.status,
    created_at: r.created_at,
    checked_in_at: r.checked_in_at,
  };
}
