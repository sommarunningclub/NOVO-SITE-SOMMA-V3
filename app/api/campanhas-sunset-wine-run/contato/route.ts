import { NextRequest, NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { adicionarContatoManual } from "@/lib/campanhas/regua-sunset-wine-run";

export const dynamic = "force-dynamic";

/** Adiciona um e-mail avulso (imprensa, parceiros) à base desta campanha. */
export async function POST(request: NextRequest) {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  let body: { email?: unknown; nome?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const nome = typeof body.nome === "string" ? body.nome : null;
  if (!email) return NextResponse.json({ error: "E-mail obrigatório." }, { status: 400 });

  try {
    const resultado = await adicionarContatoManual(email, nome);
    if (!resultado.ok) return NextResponse.json({ error: resultado.motivo }, { status: 409 });
    return NextResponse.json({ ok: true, email: email.toLowerCase() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao adicionar." },
      { status: 500 }
    );
  }
}
