import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getServiceSupabase } from "@/lib/supabase";
import { getEventoPorId, getParticipantePorToken } from "@/lib/dexcomplica-love-run/db";
import { EVENTO_SLUG } from "@/lib/dexcomplica-love-run/event.config";
import { camposComErro, telefoneSchema } from "@/lib/dexcomplica-love-run/schema";
import { tokenValido } from "@/lib/dexcomplica-love-run/ticket";

export const dynamic = "force-dynamic";

const corpoSchema = z.object({ token: z.string().max(80), telefone: telefoneSchema });

/**
 * Completa o WhatsApp de quem se inscreveu antes de o campo existir
 * (28/10/2026). Quem pode é quem tem o token do ingresso, o mesmo segredo do
 * QR. Só PREENCHE vazio: quem já tem número não troca por aqui, em nenhuma das
 * três tabelas (inscrição, lista da gestão e cadastro da pessoa).
 */
export async function POST(request: NextRequest) {
  const limite = await rateLimit(`love-run:whatsapp:${clientIp(request)}`, 10, 600);
  if (!limite.ok) return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });

  const parsed = corpoSchema.safeParse((await request.json().catch(() => null)) ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Confira o número.", campos: camposComErro(parsed.error.issues) }, { status: 422 });
  }
  const { token, telefone } = parsed.data;
  if (!tokenValido(token)) return NextResponse.json({ error: "Ingresso não encontrado." }, { status: 404 });

  const p = await getParticipantePorToken(token);
  const evento = p ? await getEventoPorId(p.evento_id) : null;
  if (!p || p.status === "cancelado" || evento?.slug !== EVENTO_SLUG) {
    return NextResponse.json({ error: "Ingresso não encontrado." }, { status: 404 });
  }
  if (p.telefone) return NextResponse.json({ ok: true, ja_tinha: true });

  const sb = getServiceSupabase();
  if (!sb) return NextResponse.json({ error: "Tente de novo em instantes." }, { status: 503 });

  const cpf = String(p.cpf).replace(/\D/g, "");
  const mascarado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
  const [a, b, c] = await Promise.all([
    sb.from("evento_participantes").update({ telefone }).eq("id", p.id).is("telefone", null),
    sb.from("checkins").update({ telefone }).eq("evento_id", p.evento_id).in("cpf", [cpf, mascarado]).or("telefone.is.null,telefone.eq."),
    sb.from("cadastro_site").update({ whatsapp: telefone }).eq("id", p.pessoa_id).or("whatsapp.is.null,whatsapp.eq."),
  ]);
  const erro = a.error ?? b.error ?? c.error;
  if (erro) {
    console.error("[love-run] Erro ao completar WhatsApp:", erro.message);
    return NextResponse.json({ error: "Não conseguimos salvar agora. Tente de novo." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
