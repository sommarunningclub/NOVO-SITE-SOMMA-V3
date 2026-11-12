import { NextResponse, type NextRequest } from "next/server";
import { registrarAceites } from "@/lib/aceites/registrar";
import { identificar } from "@/lib/cadastro/identificacao";
import { SLUG } from "@/lib/evp/config";
import { lerEventoPublico } from "@/lib/evp/db";
import { avisarPorEmail, conferirSelo, inscrever } from "@/lib/evp/inscricao";
import { camposComErro, corpoInscricaoSchema, emailMascarado } from "@/lib/evp/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Inscrição no Meeting Técnico.
 *
 * Ordem: limite por IP, isca e selo (anti-robô), validação, e só então o banco,
 * que decide vaga, fila e duplicidade numa transação. O aceite dos termos e o
 * e-mail vêm depois de gravar, para envio recusado não virar aceite.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limite = await rateLimit(`evp:inscricao:${ip}`, 12, 600);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
    );
  }

  try {
    const bruto = await req.json().catch(() => null);
    if (!bruto || typeof bruto !== "object") {
      return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
    }

    // Isca preenchida: responde como se tivesse dado certo e não grava nada.
    if (typeof bruto.site === "string" && bruto.site.trim() !== "") {
      return NextResponse.json({ ok: true, status: "confirmada", ticket_url: null }, { status: 201 });
    }

    const parsed = corpoInscricaoSchema.safeParse(bruto);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Confira os campos destacados.", campos: camposComErro(parsed.error.issues) },
        { status: 422 }
      );
    }
    const { idempotency_key, selo, origem, site: _site, ...dados } = parsed.data;
    void _site;

    const situacaoSelo = conferirSelo(selo);
    if (situacaoSelo !== "ok") {
      return NextResponse.json(
        {
          error:
            situacaoSelo === "rapido"
              ? "Envio rápido demais. Aguarde alguns segundos e confirme de novo."
              : "Sua sessão do formulário expirou. Confirme de novo.",
          renovar_selo: true,
        },
        { status: 400 }
      );
    }

    // Já era da base do clube antes desta inscrição? Quem responde é o servidor, não o formulário.
    let jaMembro = false;
    try {
      jaMembro = (await identificar(dados.cpf)).origem === "cadastro";
    } catch {
      /* base do clube fora do ar não impede a inscrição */
    }

    const r = await inscrever(dados, { idempotencyKey: idempotency_key, origem, jaMembro });

    if (!r.ok) {
      if (r.motivo === "duplicada") {
        return NextResponse.json(
          {
            error: "Este CPF já tem inscrição neste evento.",
            ja_inscrito: true,
            lista_espera: r.status === "lista_espera",
            email: emailMascarado(r.email),
          },
          { status: 409 }
        );
      }
      if (r.motivo === "lotado") {
        return NextResponse.json({ error: "As vagas acabaram.", lotado: true, vagas: r.vagas }, { status: 409 });
      }
      if (r.motivo === "fechada") {
        return NextResponse.json({ error: "As inscrições não estão abertas.", fechada: true, vagas: r.vagas }, { status: 409 });
      }
      if (r.motivo === "chave_em_uso") {
        return NextResponse.json({ error: "Recarregue a página e tente de novo." }, { status: 409 });
      }
      return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
    }

    const ins = r.inscricao;
    let emailEnviado = false;
    if (!r.repetida) {
      await registrarAceites(req, {
        tipos: ["lgpd", "uso_imagem"],
        origem: SLUG,
        cpf: dados.cpf,
        nome: dados.nome,
        email: dados.email,
      });
      const evento = await lerEventoPublico();
      if (evento) emailEnviado = (await avisarPorEmail(ins, evento, "inscricao")).ok;
    }

    return NextResponse.json(
      {
        ok: true,
        status: ins.status,
        codigo: ins.codigo,
        posicao_fila: ins.posicao_fila,
        ticket_token: ins.ticket_token,
        email_enviado: emailEnviado,
        vagas: r.vagas ?? null,
      },
      { status: r.repetida ? 200 : 201 }
    );
  } catch (erro) {
    console.error("[evp] Erro na inscrição:", erro instanceof Error ? erro.message : erro);
    return NextResponse.json(
      { error: "Não conseguimos salvar sua inscrição agora. Nada foi registrado: tente de novo em instantes." },
      { status: 503 }
    );
  }
}
