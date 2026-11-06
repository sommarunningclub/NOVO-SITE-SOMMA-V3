import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { recuperarSchema } from "@/lib/dexcomplica-love-run/schema";
import { SLUG, gravarSessao, rpc } from "@/lib/vem-correr-comigo/servidor";

export const dynamic = "force-dynamic";

/** Mesmo tempo com ou sem inscrição; o limite por IP segura quem tentar CPFs em sequência. */
const TEMPO_MS = 700;

export async function POST(request: NextRequest) {
  const inicio = Date.now();
  const esperar = async () => {
    const resta = TEMPO_MS - (Date.now() - inicio);
    if (resta > 0) await new Promise((r) => setTimeout(r, resta));
  };

  try {
    const limite = await rateLimit(`corre:acesso:${clientIp(request)}`, 20, 600);
    if (!limite.ok) {
      return NextResponse.json(
        { ok: false, error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      );
    }

    const parsed = recuperarSchema.safeParse((await request.json().catch(() => null)) ?? {});
    if (!parsed.success) {
      await esperar();
      return NextResponse.json({ ok: false, error: "Confira o CPF." }, { status: 422 });
    }

    const r = await rpc<{ participacao_id: string; pessoa_id: number } | null>("dex_corre_entrar", {
      p_slug: SLUG,
      p_cpf: parsed.data.cpf,
    });
    await esperar();
    if (!r) {
      return NextResponse.json({ ok: false, error: "Não encontramos inscrição com esse CPF. Confira os números." }, { status: 404 });
    }

    const res = NextResponse.json({ ok: true });
    gravarSessao(res, { participacao: r.participacao_id, pessoa: Number(r.pessoa_id) });
    return res;
  } catch (erro) {
    console.error("[corre] acesso:", erro instanceof Error ? erro.message : erro);
    await esperar();
    return NextResponse.json({ ok: false, error: "Não conseguimos concluir agora. Tente novamente." }, { status: 500 });
  }
}
