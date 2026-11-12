import { NextResponse, type NextRequest } from "next/server";
import { isValidCPF } from "@/lib/cpf";
import { SLUG } from "@/lib/evp/config";
import { hmacCpf } from "@/lib/evp/cripto";
import { lerEventoPublico, rpc } from "@/lib/evp/db";
import { avisarPorEmail } from "@/lib/evp/inscricao";
import type { InscricaoPublica } from "@/lib/evp/tipos";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * "Já me inscrevi e perdi o e-mail." Reenvia a confirmação para o e-mail da
 * inscrição. A resposta é a mesma exista ou não a inscrição: quem digita um CPF
 * alheio não descobre se a pessoa vai ao evento, e o ingresso só chega na caixa
 * de quem se inscreveu.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limite = await rateLimit(`evp:reenviar:${ip}`, 5, 900);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
    );
  }
  const corpo = await req.json().catch(() => ({}));
  const cpf = String(corpo?.cpf ?? "").replace(/\D/g, "");
  if (!isValidCPF(cpf)) return NextResponse.json({ error: "CPF inválido: confira os números." }, { status: 422 });

  // Um reenvio por CPF a cada 10 minutos, venha de onde vier.
  const porCpf = await rateLimit(`evp:reenviar:cpf:${hmacCpf(SLUG, cpf)}`, 1, 600);
  if (porCpf.ok) {
    try {
      const ins = await rpc<InscricaoPublica | null>("evp_inscricao_por_cpf", { p_slug: SLUG, p_cpf_hmac: hmacCpf(SLUG, cpf) });
      const evento = ins ? await lerEventoPublico() : null;
      if (ins && evento) await avisarPorEmail(ins, evento, "reenvio");
    } catch (erro) {
      console.error("[evp] Reenvio falhou:", erro instanceof Error ? erro.message : erro);
    }
  }
  return NextResponse.json({
    ok: true,
    mensagem: "Se este CPF tiver inscrição, a confirmação foi reenviada para o e-mail cadastrado.",
  });
}
