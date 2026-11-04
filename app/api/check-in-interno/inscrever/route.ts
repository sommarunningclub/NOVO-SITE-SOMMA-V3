import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { exigirAcesso } from "@/lib/check-in-interno/auth";
import { buscarEventoInterno } from "@/lib/check-in-interno/eventos";
import { camposComErro, cpfSchema, emailSchema, nomeSchema, sexoSchema, telefoneSchema } from "@/lib/dexcomplica-love-run/schema";
import { getEventoPorId, getParticipacao, inscrever } from "@/lib/dexcomplica-love-run/db";
import { urlIngresso } from "@/lib/dexcomplica-love-run/ticket";
import { enviarIngresso } from "@/lib/emails/dexcomplica-love-run-ingresso";

export const dynamic = "force-dynamic";

/**
 * Inscrição feita pela equipe no /check-in/interno.
 *
 * Ignora de propósito o estado público do evento (bloqueado, encerrado,
 * oculto, lotado): quem chega aqui passou pela senha. Grava no mesmo lugar que
 * a inscrição pública grava, para a gestão ver a pessoa na lista de sempre:
 *
 * - Love Run (LP com ingresso): `inscrever_no_evento` sem teto de vagas, com
 *   espelho em `checkins` e o e-mail do ingresso, igual à LP.
 * - Demais eventos: uma linha em `checkins`, igual ao /api/checkin.
 *
 * Sexo é obrigatório em todo check-in do site.
 */

const corpoSchema = z.object({
  evento_id: z.string().uuid("Escolha o evento"),
  nome: nomeSchema,
  email: emailSchema,
  cpf: cpfSchema,
  telefone: telefoneSchema,
  sexo: sexoSchema,
  pelotao: z.string().trim().max(40).optional().default(""),
});

function cpfMascarado(cpf: string): string {
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

export async function POST(req: NextRequest) {
  const negado = await exigirAcesso();
  if (negado) return negado;

  const limite = await rateLimit(`checkin-interno:inscrever:${clientIp(req)}`, 60, 600);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitas inscrições seguidas. Aguarde alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
    );
  }

  try {
    const parsed = corpoSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Confira os campos destacados.", campos: camposComErro(parsed.error.issues) },
        { status: 422 }
      );
    }
    const dados = parsed.data;

    const evento = await buscarEventoInterno(dados.evento_id);
    if (!evento) {
      return NextResponse.json({ error: "Esse evento não está mais na lista (já passou ou foi apagado)." }, { status: 404 });
    }

    const pelotao = evento.tipo === "personalizado" ? null : dados.pelotao;
    if (evento.tipo !== "personalizado" && (!pelotao || !evento.pelotoes.includes(pelotao))) {
      return NextResponse.json(
        { error: "Confira os campos destacados.", campos: { pelotao: "Escolha um dos pelotões do evento" } },
        { status: 422 }
      );
    }

    // ── Love Run: mesma inscrição da LP, com ingresso ──────────────────────
    if (evento.comIngresso) {
      const linha = await getEventoPorId(evento.id);
      if (!linha) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

      const existente = await getParticipacao(evento.id, dados.cpf);
      if (existente) {
        return NextResponse.json(
          {
            ok: false,
            ja_inscrito: true,
            error: `${existente.nome_completo} já está inscrito(a) neste evento.`,
            ingresso_url: urlIngresso(existente.ticket_token),
            ticket_code: existente.ticket_code,
          },
          { status: 409 }
        );
      }

      const resultado = await inscrever(
        { ...dados, pelotao: pelotao ?? "", marketing: false, utm: { utm_source: "check-in-interno" } },
        linha,
        { interno: true }
      );
      if (!resultado.ok) {
        return NextResponse.json(
          { error: "Não conseguimos salvar a inscrição agora. Nada foi registrado; tente de novo." },
          { status: 503 }
        );
      }
      const p = resultado.participante;
      if (resultado.jaEstava) {
        return NextResponse.json(
          {
            ok: false,
            ja_inscrito: true,
            error: `${p.nome_completo} já está inscrito(a) neste evento.`,
            ingresso_url: urlIngresso(p.ticket_token),
            ticket_code: p.ticket_code,
          },
          { status: 409 }
        );
      }

      const email = p.email
        ? await enviarIngresso({
            nome: p.nome_completo,
            email: p.email,
            ticketCode: p.ticket_code,
            ticketToken: p.ticket_token,
            pelotao: p.pelotao,
          })
        : { ok: false };

      return NextResponse.json(
        {
          ok: true,
          nome: p.nome_completo,
          evento: evento.titulo,
          pelotao: p.pelotao,
          email_enviado: email.ok,
          ingresso_url: urlIngresso(p.ticket_token),
          ticket_code: p.ticket_code,
        },
        { status: 201 }
      );
    }

    // ── Demais eventos: lista de check-in da gestão ────────────────────────
    const supabase = getServiceSupabase();
    if (!supabase) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });

    const { data: existente, error: erroBusca } = await supabase
      .from("checkins")
      .select("id, nome_completo")
      .eq("evento_id", evento.id)
      .in("cpf", [dados.cpf, cpfMascarado(dados.cpf)])
      .limit(1);
    if (erroBusca) {
      console.error("[check-in-interno] Erro ao conferir duplicidade:", erroBusca.message);
      return NextResponse.json({ error: "Não conseguimos conferir a lista agora. Tente de novo." }, { status: 503 });
    }
    if (existente && existente.length > 0) {
      return NextResponse.json(
        { ok: false, ja_inscrito: true, error: `${existente[0].nome_completo} já está inscrito(a) neste evento.` },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("checkins").insert({
      nome_completo: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      cpf: dados.cpf,
      sexo: dados.sexo,
      pelotao,
      data_do_evento: evento.data,
      nome_do_evento: evento.titulo,
      evento_id: evento.id,
      data_hora_checkin: new Date().toISOString(),
      validacao_do_checkin: false,
    });
    if (error) {
      console.error("[check-in-interno] Erro ao inserir:", error.message, error.details);
      return NextResponse.json({ error: "Não conseguimos salvar a inscrição agora. Tente de novo." }, { status: 503 });
    }

    return NextResponse.json({ ok: true, nome: dados.nome, evento: evento.titulo, pelotao }, { status: 201 });
  } catch (erro) {
    console.error("[check-in-interno] Erro:", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "Erro interno. Tente de novo em instantes." }, { status: 500 });
  }
}
