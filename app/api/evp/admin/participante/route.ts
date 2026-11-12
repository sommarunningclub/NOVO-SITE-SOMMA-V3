import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { exigir } from "@/lib/evp/auth";
import { DISTANCIAS_INSCRICAO, SLUG } from "@/lib/evp/config";
import { decifrarCpf } from "@/lib/evp/cripto";
import { rpc } from "@/lib/evp/db";
import { avisarPorEmail, avisarPromovidas } from "@/lib/evp/inscricao";
import { camposComErro, etapa1Schema, normalizarBusca, SEXOS } from "@/lib/evp/schema";
import type { InscricaoPublica } from "@/lib/evp/tipos";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

type Ficha = Record<string, unknown> & {
  id: string;
  cpf_cifrado?: string;
  cpf_final: string;
  ticket_token: string;
  nome: string;
  email: string;
  codigo: string;
  distancia: InscricaoPublica["distancia"];
  status: InscricaoPublica["status"];
};

async function lerFicha(id: string): Promise<Ficha | null> {
  return rpc<Ficha | null>("evp_admin_participante", { p_slug: SLUG, p_id: id });
}

/** Ficha de uma inscrição. O CPF sai mascarado; para ver inteiro existe a ação `revelar_cpf`. */
export async function GET(req: NextRequest) {
  const { negado } = await exigir("admin");
  if (negado) return negado;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });
  try {
    const ficha = await lerFicha(id);
    if (!ficha) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
    const { cpf_cifrado: _c, ...publica } = ficha;
    void _c;
    return NextResponse.json({ dados: publica }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar a inscrição." }, { status: 503 });
  }
}

const edicaoSchema = z.object({
  nome: etapa1Schema.shape.nome,
  email: etapa1Schema.shape.email,
  telefone: etapa1Schema.shape.telefone,
  sexo: z.enum(SEXOS),
  distancia: z.enum(DISTANCIAS_INSCRICAO),
  primeira_vez: z.boolean(),
});

/** POST { id, acao, ... }: editar | cancelar | reenviar | revelar_cpf | desfazer_checkin | promover_fila */
export async function POST(req: NextRequest) {
  const { sessao, negado } = await exigir("admin");
  if (negado) return negado;
  const corpo = await req.json().catch(() => ({}));
  const acao = String(corpo?.acao ?? "");
  const id = String(corpo?.id ?? "");

  try {
    if (acao === "promover_fila") {
      const r = await rpc<{ ok: boolean; promovidas: Parameters<typeof avisarPromovidas>[0] }>("evp_admin_promover_fila", {
        p_slug: SLUG,
        p_staff: sessao.id,
      });
      const avisados = await avisarPromovidas(r.promovidas);
      return NextResponse.json({ ok: true, promovidas: r.promovidas?.length ?? 0, avisados });
    }

    if (!UUID.test(id)) return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });

    if (acao === "editar") {
      const parsed = edicaoSchema.safeParse(corpo?.dados);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Confira os campos destacados.", campos: camposComErro(parsed.error.issues) },
          { status: 422 }
        );
      }
      const r = await rpc<{ ok: boolean; motivo?: string; mudou?: string[] }>("evp_admin_editar_participante", {
        p_slug: SLUG,
        p_staff: sessao.id,
        p_id: id,
        p: { ...parsed.data, nome_busca: normalizarBusca(parsed.data.nome) },
      });
      if (!r.ok) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
      return NextResponse.json({ ok: true, mudou: r.mudou ?? [] });
    }

    if (acao === "cancelar") {
      const motivo = typeof corpo?.motivo === "string" ? corpo.motivo.slice(0, 300) : "";
      const r = await rpc<{ ok: boolean; motivo?: string; promovidas?: Parameters<typeof avisarPromovidas>[0] }>(
        "evp_admin_cancelar",
        { p_slug: SLUG, p_staff: sessao.id, p_id: id, p_motivo: motivo }
      );
      if (!r.ok) {
        const msg = r.motivo === "ja_cancelada" ? "Esta inscrição já estava cancelada." : "Inscrição não encontrada.";
        return NextResponse.json({ error: msg }, { status: r.motivo === "ja_cancelada" ? 409 : 404 });
      }
      const avisados = await avisarPromovidas(r.promovidas);
      return NextResponse.json({ ok: true, promovidas: r.promovidas?.length ?? 0, avisados });
    }

    if (acao === "desfazer_checkin") {
      const r = await rpc<{ ok: boolean }>("evp_checkin_desfazer", { p_slug: SLUG, p_staff: sessao.id, p_registration: id });
      if (!r.ok) return NextResponse.json({ error: "Esta inscrição não tem check-in ativo." }, { status: 409 });
      return NextResponse.json({ ok: true });
    }

    const ficha = await lerFicha(id);
    if (!ficha) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });

    if (acao === "revelar_cpf") {
      const cpf = ficha.cpf_cifrado ? decifrarCpf(ficha.cpf_cifrado) : null;
      await rpc("evp_admin_log", {
        p_slug: SLUG, p_staff: sessao.id, p_acao: "cpf_revelado", p_alvo_tipo: "inscricao", p_alvo_id: id, p_detalhes: {},
      });
      if (!cpf) {
        return NextResponse.json(
          { error: "Não foi possível decifrar o CPF. O segredo de dados do ambiente mudou desde a inscrição." },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, cpf }, { headers: { "Cache-Control": "no-store" } });
    }

    if (acao === "reenviar") {
      if (ficha.status === "cancelada") {
        return NextResponse.json({ error: "Inscrição cancelada não recebe confirmação." }, { status: 409 });
      }
      const ing = await rpc<(InscricaoPublica & { evento: Parameters<typeof avisarPorEmail>[1] }) | null>("evp_ingresso", {
        p_slug: SLUG,
        p_ticket_token: ficha.ticket_token,
      });
      if (!ing) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
      const envio = await avisarPorEmail(ing, ing.evento, "reenvio");
      await rpc("evp_admin_log", {
        p_slug: SLUG, p_staff: sessao.id, p_acao: "confirmacao_reenviada", p_alvo_tipo: "inscricao", p_alvo_id: id,
        p_detalhes: { enviado: envio.ok },
      });
      if (!envio.ok) {
        const msg =
          envio.motivo === "nao_configurado"
            ? "O envio de e-mail não está configurado neste ambiente (RESEND_API_KEY e VIP_EMAIL_FROM)."
            : "O e-mail não saiu. Tente de novo em instantes.";
        return NextResponse.json({ error: msg }, { status: 503 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  } catch (erro) {
    console.error("[evp] Participante:", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "Não foi possível concluir. Nada foi alterado." }, { status: 503 });
  }
}
