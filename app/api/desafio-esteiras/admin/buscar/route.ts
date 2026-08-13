import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { escopoDaSessao, requireOperator } from "@/lib/desafio-esteiras/auth";
import { TABLE, type Registration } from "@/lib/desafio-esteiras/db";
import { extractToken, normalizeTicketCode } from "@/lib/desafio-esteiras/ticket";
import { onlyDigits } from "@/lib/desafio-esteiras/schema";

export const dynamic = "force-dynamic";

const COLUNAS =
  "id, full_name, cpf, phone, email, unit_id, ticket_code, ticket_token, status, created_at, checked_in_at, checked_in_by";

/** Esconde o miolo do CPF na tela do balcão: 123.***.**9-01 → suficiente para conferir. */
function maskCpf(cpf: string): string {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return "—";
  return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
}

function maskPhone(phone: string): string {
  const d = onlyDigits(phone);
  if (d.length < 10) return "—";
  return `(${d.slice(0, 2)}) ****-${d.slice(-4)}`;
}

/**
 * Busca de participante no check-in. Aceita, na ordem:
 * QR/token → código do ticket → CPF → telefone → nome.
 * Operador de unidade só enxerga a própria unidade.
 */
export async function GET(request: NextRequest) {
  const auth = await requireOperator();
  if (!auth.ok) return auth.response;

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 3) {
    return NextResponse.json({ error: "Digite ao menos 3 caracteres.", resultados: [] }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Banco indisponível.", resultados: [] }, { status: 503 });
  }

  const escopo = () => {
    const base = supabase.from(TABLE).select(COLUNAS);
    const escopo = escopoDaSessao(auth.session);
    return escopo
      ? base.eq("unit_id", escopo)
      : base;
  };

  const digitos = onlyDigits(q);
  const token = extractToken(q);
  const codigo = normalizeTicketCode(q);

  let resultados: Registration[] = [];

  // 1. Token do QR (o caso mais comum na porta)
  if (token.length >= 20 && /^[A-Za-z0-9_-]+$/.test(token)) {
    const { data } = await escopo().eq("ticket_token", token).limit(1);
    resultados = (data ?? []) as unknown as Registration[];
  }

  // 2. Código do ticket digitado
  if (!resultados.length && codigo.startsWith("DST")) {
    const { data } = await escopo().eq("ticket_code", codigo).limit(1);
    resultados = (data ?? []) as unknown as Registration[];
  }

  // 3. CPF ou telefone
  if (!resultados.length && digitos.length >= 10) {
    const { data } = await escopo()
      .or(`cpf.eq.${digitos},phone.eq.${digitos}`)
      .limit(20);
    resultados = (data ?? []) as unknown as Registration[];
  }

  // 4. Nome (ou e-mail)
  if (!resultados.length && !digitos.match(/^\d+$/)) {
    const termo = q.replace(/[%,()]/g, " ").trim();
    const { data } = await escopo()
      .or(`full_name.ilike.%${termo}%,email.ilike.%${termo}%`)
      .order("full_name")
      .limit(20);
    resultados = (data ?? []) as unknown as Registration[];
  }

  return NextResponse.json({
    resultados: resultados.map((r) => ({
      id: r.id,
      full_name: r.full_name,
      cpf_mascarado: maskCpf(r.cpf),
      phone_mascarado: maskPhone(r.phone),
      unit_id: r.unit_id,
      ticket_code: r.ticket_code,
      ticket_token: r.ticket_token,
      status: r.status,
      created_at: r.created_at,
      checked_in_at: r.checked_in_at,
      checked_in_by: r.checked_in_by,
    })),
    escopo: escopoDaSessao(auth.session) ?? "todas",
  });
}
