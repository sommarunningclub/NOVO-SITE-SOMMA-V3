import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { getServiceSupabase } from "@/lib/supabase";
import { brDateToISO, isValidBirthDate, isValidCpf } from "@/lib/validation";
import { sexoValido } from "@/lib/maratona-rio-2027/provas";
import { LIMITE_VAGAS, VALOR_ESTRUTURA, VALOR_INSCRICAO, pixCopiaECola } from "@/lib/maratona-rio-2027/inscricao";
import { PROFESSORES_BORA } from "@/lib/nova-assessoria/professores";
import { ipDaRequisicao } from "@/lib/nova-assessoria/rastreio-servidor";

/**
 * Inscrição na Meia Maratona do Rio 2027 pela assessoria.
 *
 * A vaga é reservada no banco (`maratona_rio_2027_inscrever`, com o teto de
 * LIMITE_VAGAS sob lock) e a resposta já traz o Pix com o valor certo. Quem
 * já está inscrito e envia de novo atualiza os dados sem ocupar outra vaga.
 */

export const dynamic = "force-dynamic";

// Teto de envios por IP em 10 minutos.
const LIMITE_POR_IP = 15;

const TREINADORES = new Set([...PROFESSORES_BORA.map((p) => p.slug), "outro"]);

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
  if (nome.length < 5 || nome.split(" ").length < 2 || nome.length > 120) return erro("Digite seu nome completo.", 400);

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro("Digite um e-mail válido.", 400);

  const telefone = normalizarTelefone(body.telefone);
  if (!telefone) return erro("Digite um telefone com DDD.", 400);

  const cpf = typeof body.cpf === "string" ? body.cpf.replace(/\D/g, "") : "";
  if (!isValidCpf(cpf)) return erro("CPF inválido.", 400);

  const nascimento = typeof body.nascimento === "string" ? body.nascimento.trim() : "";
  if (!isValidBirthDate(nascimento)) return erro("Data de nascimento inválida.", 400);

  if (!sexoValido(body.sexo)) return erro("Selecione o sexo.", 400);

  const treinador = typeof body.treinador === "string" ? body.treinador : "";
  if (!TREINADORES.has(treinador)) return erro("Escolha o seu treinador.", 400);
  const treinadorOutro =
    treinador === "outro" && typeof body.treinadorOutro === "string" ? body.treinadorOutro.trim().slice(0, 80) : "";
  if (treinador === "outro" && treinadorOutro.length < 2) return erro("Digite o nome do seu treinador.", 400);

  if (typeof body.estrutura !== "boolean") return erro("Diga se quer a estrutura de apoio no Rio.", 400);
  if (body.termo !== true) return erro("É preciso aceitar o termo de adesão.", 400);

  const supabase = getServiceSupabase();
  if (!supabase) return erro("Inscrições indisponíveis agora. Tente de novo em instantes.", 503);

  const ip = ipDaRequisicao(req);
  if (ip) {
    const { count } = await supabase
      .from("maratona_rio_2027_inscricoes")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("atualizado_em", new Date(Date.now() - 10 * 60_000).toISOString());
    if ((count ?? 0) >= LIMITE_POR_IP) return erro("Muitos envios seguidos. Espere alguns minutos e tente de novo.", 429);
  }

  const { data, error } = await supabase.rpc("maratona_rio_2027_inscrever", {
    p_limite: LIMITE_VAGAS,
    p_dados: {
      nome,
      email,
      telefone,
      cpf,
      data_nascimento: brDateToISO(nascimento),
      sexo: body.sexo,
      treinador,
      treinador_outro: treinadorOutro,
      estrutura_apoio: body.estrutura,
      valor_inscricao: VALOR_INSCRICAO,
      valor_estrutura: body.estrutura ? VALOR_ESTRUTURA : 0,
      ip,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) || null,
    },
  });
  if (error) {
    console.error("[maratona-rio-2027] Falha na inscrição:", error.message);
    return erro("Não deu certo. Tente de novo.", 500);
  }

  const r = Array.isArray(data) ? data[0] : data;
  if (r?.resultado === "esgotado") {
    return NextResponse.json({ error: "As vagas acabaram. Fale com o seu treinador.", esgotado: true }, { status: 409 });
  }

  const { data: inscricao, error: erroLeitura } = await supabase
    .from("maratona_rio_2027_inscricoes")
    .select("id, valor_total, estrutura_apoio, status, token, comprovante_enviado_em")
    .eq("id", r?.inscricao_id)
    .single();
  if (erroLeitura || !inscricao) {
    console.error("[maratona-rio-2027] Inscrição gravada mas não lida:", erroLeitura?.message);
    return erro("Sua vaga foi reservada, mas não deu para mostrar o Pix. Recarregue a página e envie de novo.", 500);
  }

  const total = Number(inscricao.valor_total);
  const pix = pixCopiaECola(total, `MDR27I${inscricao.id}`);
  const qrSvg = await QRCode.toString(pix, { type: "svg", margin: 1, errorCorrectionLevel: "M" });

  return NextResponse.json({
    ok: true,
    resultado: r.resultado,
    id: inscricao.id,
    total,
    estrutura: inscricao.estrutura_apoio,
    pago: inscricao.status === "pago",
    token: inscricao.token,
    comprovante: Boolean(inscricao.comprovante_enviado_em),
    pix,
    qrSvg,
    vagasRestantes: r.vagas_restantes,
  });
}
