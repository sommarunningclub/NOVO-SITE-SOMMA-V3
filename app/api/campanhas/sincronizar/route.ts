import { NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { sincronizarBase } from "@/lib/campanhas/regua";

export const dynamic = "force-dynamic";
/** Ler as duas bases inteiras e gravar 6.9 mil linhas não cabe nos 10s padrão. */
export const maxDuration = 300;

/**
 * Puxa `cadastro_site` + `checkins` para `campanha_contatos`, deduplicando.
 *
 * Idempotente: roda quantas vezes quiser. Contato que já existe é ignorado, não
 * duplicado, então rodar de novo só absorve quem entrou na base desde a última
 * vez. Não mexe em etapa já disparada.
 */
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
