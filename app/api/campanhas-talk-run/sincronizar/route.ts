import { NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { sincronizarBase } from "@/lib/campanhas/regua-talk-run";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Puxa cadastro_site + checkins, deduplicados, para a base desta campanha. */
export async function POST() {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json({ ok: true, ...(await sincronizarBase()) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao sincronizar." },
      { status: 500 }
    );
  }
}
