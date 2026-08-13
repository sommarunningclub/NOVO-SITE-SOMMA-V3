import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase";
import { BUCKET_FOTOS, TABLE } from "@/lib/desafio-esteiras/db";
import { lerTokenEdicao, removerFoto } from "@/lib/desafio-esteiras/perfil";
import { clientIp, rateLimit } from "@/lib/desafio-esteiras/rate-limit";
import { generateTicketCode, generateTicketToken } from "@/lib/desafio-esteiras/ticket";
import {
  birthDateSchema,
  cpfSchema,
  phoneSchema,
  registrationSchema,
  sexoSchema,
} from "@/lib/desafio-esteiras/schema";
import { VAGAS_POR_CATEGORIA, getUnit, inscricoesAbertas } from "@/lib/desafio-esteiras/event.config";
import { sendDesafioEsteirasTicketEmail } from "@/lib/emails/desafio-esteiras-ticket";

export const dynamic = "force-dynamic";

const transferenciaSchema = z.object({
  full_name: registrationSchema.shape.full_name,
  cpf: cpfSchema,
  birth_date: birthDateSchema,
  email: registrationSchema.shape.email,
  phone: phoneSchema,
  sexo: sexoSchema,
});

/**
 * Transferência do ticket para outra pessoa.
 *
 * A inscrição é a MESMA linha: trocamos o titular e mantemos unidade, categoria
 * e — principalmente — a vaga. Liberar e reocupar deixaria a vaga exposta a
 * quem estivesse no formulário naquele segundo, e a pessoa perderia o lugar que
 * já era dela.
 *
 * O que muda de verdade:
 *  - o ticket_token é regenerado, então o link antigo para de funcionar. Sem
 *    isso, quem transferiu continuaria com um QR válido para a mesma vaga;
 *  - o ticket_code é reemitido quando o prefixo da unidade não bate;
 *  - a foto do titular anterior é apagada — ela é de outra pessoa.
 *
 * Se o novo titular for de outra categoria, a vaga muda de fila: o trigger
 * `dst_capacidade` recusa se a categoria de destino já estiver cheia.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limite = rateLimit(`dst:transferir:${ip}`, 5, 600);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
    );
  }

  let body: { token?: unknown; novo?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const id = lerTokenEdicao(typeof body.token === "string" ? body.token : null);
  if (!id) {
    return NextResponse.json(
      { error: "Sua sessão expirou. Informe CPF e data de nascimento de novo." },
      { status: 401 }
    );
  }

  const parsed = transferenciaSchema.safeParse(body.novo);
  if (!parsed.success) {
    const primeiro = parsed.error.issues[0];
    return NextResponse.json(
      { error: primeiro?.message ?? "Dados inválidos.", campo: primeiro?.path?.[0] ?? null },
      { status: 400 }
    );
  }
  const novo = parsed.data;

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

  const { data: atual } = await supabase
    .from(TABLE)
    .select("id, full_name, cpf, unit_id, sexo, participacao, status, foto_path, ticket_code")
    .eq("id", id)
    .maybeSingle();

  if (!atual) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });

  const linha = atual as {
    full_name: string;
    cpf: string;
    unit_id: string;
    sexo: string | null;
    participacao: string;
    status: string;
    foto_path: string | null;
    ticket_code: string;
  };

  if (linha.status === "cancelled") {
    return NextResponse.json({ error: "Esta inscrição está cancelada." }, { status: 409 });
  }
  if (linha.status === "checked_in") {
    return NextResponse.json(
      { error: "Este ticket já foi utilizado no evento e não pode ser transferido." },
      { status: 409 }
    );
  }
  if (!inscricoesAbertas()) {
    return NextResponse.json(
      { error: "As inscrições foram encerradas — não é mais possível transferir." },
      { status: 409 }
    );
  }
  if (novo.cpf === linha.cpf) {
    return NextResponse.json(
      { error: "Este CPF já é o titular do ticket." },
      { status: 409 }
    );
  }

  // O destinatário não pode já ter inscrição própria: uma pessoa, um ticket.
  const { data: jaInscrito } = await supabase
    .from(TABLE)
    .select("id")
    .eq("cpf", novo.cpf)
    .maybeSingle();

  if (jaInscrito) {
    return NextResponse.json(
      { error: "Essa pessoa já tem uma inscrição no Desafio das Esteiras." },
      { status: 409 }
    );
  }

  const unit = getUnit(linha.unit_id);
  if (!unit) return NextResponse.json({ error: "Unidade inválida." }, { status: 400 });

  // Mudou de categoria? A vaga sai de uma fila e entra em outra — confere antes
  // de tentar, para a mensagem ser clara (o trigger é a garantia final).
  const mudouCategoria = linha.participacao === "competidor" && linha.sexo !== novo.sexo;
  if (mudouCategoria) {
    const { count } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("unit_id", linha.unit_id)
      .eq("sexo", novo.sexo)
      .eq("participacao", "competidor")
      .neq("status", "cancelled");

    if ((count ?? 0) >= VAGAS_POR_CATEGORIA) {
      return NextResponse.json(
        {
          error: `A categoria ${novo.sexo} da ${unit.nome} está com as ${VAGAS_POR_CATEGORIA} vagas preenchidas. Não é possível transferir para alguém dessa categoria.`,
        },
        { status: 409 }
      );
    }
  }

  const anterior = linha.full_name;
  const novoToken = generateTicketToken();
  const novoCode = generateTicketCode(unit);

  const { data: atualizado, error } = await supabase
    .from(TABLE)
    .update({
      full_name: novo.full_name.replace(/\s+/g, " ").trim(),
      cpf: novo.cpf,
      birth_date: novo.birth_date,
      email: novo.email,
      phone: novo.phone,
      sexo: novo.sexo,
      ticket_token: novoToken,
      ticket_code: novoCode,
      foto_path: null,
      heat_number: null, // a organização redistribui: a pessoa é outra
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "confirmed") // corrida: se fizeram check-in agora, não transfere
    .select("ticket_code, ticket_token")
    .maybeSingle();

  if (error) {
    if (error.message.includes("DST_CATEGORIA_ESGOTADA")) {
      return NextResponse.json(
        { error: "A categoria de destino acabou de lotar. A transferência não foi feita." },
        { status: 409 }
      );
    }
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Essa pessoa já tem uma inscrição no Desafio das Esteiras." },
        { status: 409 }
      );
    }
    console.error("[desafio-esteiras] transferência falhou:", error.message);
    return NextResponse.json({ error: "Não foi possível transferir. Tente novamente." }, { status: 500 });
  }

  if (!atualizado) {
    return NextResponse.json(
      { error: "Este ticket acabou de ser validado no evento e não pode mais ser transferido." },
      { status: 409 }
    );
  }

  // A foto era do titular anterior — não pode seguir com o ticket.
  if (linha.foto_path) await removerFoto(linha.foto_path);

  // Avisa o novo titular. Se o e-mail falhar, a transferência continua válida.
  void sendDesafioEsteirasTicketEmail({
    nome: novo.full_name,
    email: novo.email,
    ticketCode: atualizado.ticket_code,
    ticketToken: atualizado.ticket_token,
    unit,
    transferidoDe: anterior,
  }).catch((err) => {
    console.error("[desafio-esteiras] e-mail de transferência falhou:", err);
  });

  return NextResponse.json({
    ok: true,
    ticket_code: atualizado.ticket_code,
    novo_titular: novo.full_name,
    email: novo.email,
  });
}
