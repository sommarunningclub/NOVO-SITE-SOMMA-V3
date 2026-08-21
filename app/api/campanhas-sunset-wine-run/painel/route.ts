import { NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { montarPainel } from "@/lib/campanhas/regua-sunset-wine-run";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json(await montarPainel());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao montar o painel." },
      { status: 500 }
    );
  }
}
