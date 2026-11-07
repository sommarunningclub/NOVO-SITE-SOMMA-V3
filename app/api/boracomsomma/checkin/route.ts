import { NextResponse, type NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { registrarAceites } from "@/lib/aceites/registrar";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { buscarEvento } from "@/lib/boracomsomma/evento";
import { criarTokenIngresso } from "@/lib/boracomsomma/ingresso";
import { cpfValido, emailValido, nomeValido, sexoValido, telefoneValido } from "@/lib/boracomsomma/validacao";

export const dynamic = "force-dynamic";

/**
 * Check-in do corre BORA com SOMMA (14/11/2026).
 *
 * Grava em `checkins` ligado ao evento `boracomsomma` de `eventos`, igual ao
 * /api/checkin: é isso que faz a inscrição aparecer no módulo de Check-in da
 * gestão. A diferença é que aqui o servidor confere o evento (status aberto,
 * pelotão existente) em vez de confiar no que a página mandou.
 */

function erro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status });
}

export async function POST(request: NextRequest) {
  const limite = await rateLimit(`boracomsomma:checkin:${clientIp(request)}`, 8, 600);
  if (!limite.ok) return erro("Muitas tentativas seguidas. Espere alguns minutos e tente de novo.", 429);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return erro("Pedido inválido.", 400);

  // Campo invisível: gente não preenche, robô preenche.
  if (typeof body.empresa === "string" && body.empresa.trim()) return erro("Pedido inválido.", 400);

  const nome = typeof body.nome === "string" ? body.nome.trim().replace(/\s+/g, " ") : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const telefone = typeof body.telefone === "string" ? body.telefone.replace(/\D/g, "") : "";
  const cpf = typeof body.cpf === "string" ? body.cpf.replace(/\D/g, "") : "";
  const { sexo, pelotao } = body;

  if (!nomeValido(nome) || nome.length > 120) return erro("Escreva nome e sobrenome.", 400);
  if (!emailValido(email)) return erro("Confira o e-mail.", 400);
  if (!telefoneValido(telefone)) return erro("Confira o WhatsApp com DDD.", 400);
  if (!cpfValido(cpf)) return erro("Confira o CPF.", 400);
  if (!sexoValido(sexo)) return erro("Escolha masculino ou feminino.", 400);
  if (body.aceite_imagem !== true) return erro("Aceite o Termo de Uso de Imagem para confirmar.", 400);

  const evento = await buscarEvento({ servidor: true });
  if (!evento.id || evento.estado === "sem-evento") return erro("O check-in ainda não abriu. Volte em breve.", 409);
  if (evento.estado === "encerrado") return erro("O check-in deste corre foi encerrado.", 410);
  if (evento.estado !== "aberto") return erro("O check-in está fechado no momento.", 409);
  if (typeof pelotao !== "string" || !evento.pelotoes.includes(pelotao)) return erro("Escolha o seu pelotão.", 400);

  const supabase = getServiceSupabase();
  if (!supabase) return erro("Não deu para confirmar agora. Tente de novo em instantes.", 500);

  const cpfMascarado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
  const { data: existentes, error: erroBusca } = await supabase
    .from("checkins")
    .select("id, email")
    .eq("evento_id", evento.id)
    .or(`cpf.eq.${cpf},cpf.eq.${cpfMascarado}`)
    .limit(1);
  if (erroBusca) {
    console.error("[boracomsomma] Falha ao conferir duplicidade:", erroBusca.message);
    return erro("Não deu para confirmar agora. Tente de novo em instantes.", 500);
  }
  if (existentes && existentes.length > 0) {
    // Mesmo CPF e mesmo e-mail: é a própria pessoa voltando. Devolve o ingresso.
    const anterior = existentes[0];
    if (String(anterior.email || "").trim().toLowerCase() === email) {
      return NextResponse.json({ ok: true, jaInscrito: true, token: criarTokenIngresso(anterior.id) });
    }
    return erro("Esse CPF já fez check-in neste corre. Para ver o ingresso, use \"Retirar meu ingresso\" com o e-mail do check-in.", 409);
  }

  const { data: criado, error } = await supabase.from("checkins").insert({
    nome_completo: nome,
    email,
    telefone,
    cpf,
    sexo,
    pelotao,
    data_do_evento: evento.data,
    nome_do_evento: evento.titulo,
    evento_id: evento.id,
    data_hora_checkin: new Date().toISOString(),
    validacao_do_checkin: false,
  }).select("id").single();
  if (error || !criado) {
    console.error("[boracomsomma] Falha ao gravar check-in:", error?.message, error?.details);
    return erro("Não deu para confirmar agora. Tente de novo em instantes.", 500);
  }

  await registrarAceites(request, {
    tipos: ["uso_imagem"],
    origem: "boracomsomma",
    cpf,
    nome,
    email,
    eventoId: evento.id,
  });

  return NextResponse.json({ ok: true, token: criarTokenIngresso(criado.id) }, { status: 201 });
}
