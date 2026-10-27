import { NextResponse, type NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isValidCpf } from "@/lib/validation";
import { provaValida, sexoValido } from "@/lib/maratona-rio-2027/provas";
import { ipDaRequisicao } from "@/lib/nova-assessoria/rastreio-servidor";

/**
 * Intenção de prova na Maratona do Rio 2027 (/assessoria/maratona-rio-2027).
 *
 * Uma linha por CPF: quem envia de novo atualiza a própria intenção, e a
 * resposta avisa que foi atualização. Não é inscrição na prova.
 */

// Teto de envios por IP em 10 minutos. Segura robô sem barrar a assessoria
// inteira preenchendo no mesmo Wi-Fi do treino.
const LIMITE_POR_IP = 15;

/** Só dígitos, com DDI 55. Aceita com ou sem DDI. */
function normalizarTelefone(bruto: unknown): string | null {
  if (typeof bruto !== "string") return null;
  const digitos = bruto.replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) return digitos;
  return null;
}

function erro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return erro("Pedido inválido.", 400);

  // Campo invisível: gente não preenche, robô preenche.
  if (typeof body.empresa === "string" && body.empresa.trim()) return erro("Pedido inválido.", 400);

  const nome = typeof body.nome === "string" ? body.nome.trim().replace(/\s+/g, " ") : "";
  if (nome.length < 3 || nome.length > 120) return erro("Digite seu nome completo.", 400);

  const telefone = normalizarTelefone(body.telefone);
  if (!telefone) return erro("Digite um telefone com DDD.", 400);

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro("Digite um e-mail válido.", 400);

  const cpf = typeof body.cpf === "string" ? body.cpf.replace(/\D/g, "") : "";
  if (!isValidCpf(cpf)) return erro("CPF inválido.", 400);

  if (!sexoValido(body.sexo)) return erro("Selecione o sexo.", 400);
  if (!provaValida(body.prova)) return erro("Escolha a distância.", 400);

  const supabase = getServiceSupabase();
  if (!supabase) return erro("Cadastro indisponível agora. Tente de novo em instantes.", 503);

  const ip = ipDaRequisicao(req);
  if (ip) {
    const { count } = await supabase
      .from("maratona_rio_2027_intencoes")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("atualizado_em", new Date(Date.now() - 10 * 60_000).toISOString());
    if ((count ?? 0) >= LIMITE_POR_IP) {
      return erro("Muitos envios seguidos. Espere alguns minutos e tente de novo.", 429);
    }
  }

  const { data: existente, error: erroBusca } = await supabase
    .from("maratona_rio_2027_intencoes")
    .select("id")
    .eq("cpf", cpf)
    .maybeSingle();
  if (erroBusca) {
    console.error("[maratona-rio-2027] Falha ao buscar CPF:", erroBusca.message);
    return erro("Não deu certo. Tente de novo.", 500);
  }

  const { error } = await supabase.from("maratona_rio_2027_intencoes").upsert(
    {
      nome,
      telefone,
      email,
      cpf,
      sexo: body.sexo,
      prova: body.prova,
      ip,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) || null,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "cpf" }
  );
  if (error) {
    console.error("[maratona-rio-2027] Falha ao gravar intenção:", error.message);
    return erro("Não deu certo. Tente de novo.", 500);
  }

  return NextResponse.json({ ok: true, atualizado: Boolean(existente) });
}
