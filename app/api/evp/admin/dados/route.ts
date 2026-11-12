import { NextResponse, type NextRequest } from "next/server";
import { exigir, senhaMestraConfigurada } from "@/lib/evp/auth";
import { SLUG } from "@/lib/evp/config";
import { rpc } from "@/lib/evp/db";
import { isResendConfigured } from "@/lib/resend";

export const dynamic = "force-dynamic";

const FUNCOES: Record<string, string> = {
  painel: "evp_admin_painel",
  participantes: "evp_admin_participantes",
  evento: "evp_admin_evento",
  equipe: "evp_admin_staff_listar",
};

/** GET ?secao=painel|participantes|evento|equipe|auditoria|operacao */
export async function GET(req: NextRequest) {
  const { negado } = await exigir("admin");
  if (negado) return negado;
  const secao = new URL(req.url).searchParams.get("secao") ?? "painel";
  try {
    if (secao === "auditoria") {
      const dados = await rpc("evp_admin_auditoria", { p_slug: SLUG, p_limite: 200 });
      return NextResponse.json({ dados }, { headers: { "Cache-Control": "no-store" } });
    }
    if (secao === "operacao") {
      // O que está configurado no ambiente. Só sim ou não: nenhum valor sai daqui.
      return NextResponse.json({
        dados: {
          email: isResendConfigured(),
          mapa: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
          mapa_id: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID),
          segredo_dados: Boolean(process.env.EVP_DADOS_SECRET),
          senha_mestra: senhaMestraConfigurada(),
          limite_global: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
        },
      });
    }
    const fn = FUNCOES[secao];
    if (!fn) return NextResponse.json({ error: "Seção desconhecida." }, { status: 400 });
    const dados = await rpc(fn, { p_slug: SLUG });
    return NextResponse.json({ dados }, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    console.error("[evp] Painel:", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "Não foi possível carregar os dados." }, { status: 503 });
  }
}
