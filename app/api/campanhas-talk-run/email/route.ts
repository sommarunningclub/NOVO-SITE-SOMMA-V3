import { NextRequest, NextResponse } from "next/server";
import { requireCampanhaAuth } from "@/lib/campanhas/auth";
import { CALENDARIO, ETAPAS, type EtapaTalkRun } from "@/lib/campanhas/regua-talk-run";
import { renderTalkRunEmail } from "@/lib/emails/talk-run";

export const dynamic = "force-dynamic";

/**
 * O HTML de uma etapa, como ele vai chegar, para o painel abrir numa aba.
 *
 * Renderizado com `agora` = o horário planejado da etapa, não o de hoje: a
 * véspera diz "É amanhã" e a etapa 3 diz "Faltam 5 dias", e ver isso agora com
 * a contagem de hoje seria revisar um e-mail que não é o que vai sair.
 *
 * Os assets vêm pela URL pública de produção, como no e-mail real. Antes do
 * primeiro deploy com public/talk-run/ as imagens aparecem quebradas aqui, e é
 * sinal verdadeiro: no e-mail elas também estariam.
 */
export async function GET(request: NextRequest) {
  const auth = await requireCampanhaAuth();
  if (!auth.ok) return auth.response;

  const etapa = Number(new URL(request.url).searchParams.get("etapa") ?? 1) as EtapaTalkRun;
  if (!ETAPAS.includes(etapa)) {
    return NextResponse.json({ error: `Etapa inválida. Use ${ETAPAS.join(" | ")}.` }, { status: 400 });
  }
  const dia = CALENDARIO.find((d) => d.etapa === etapa)!;

  const html = renderTalkRunEmail({
    nome: "Maria Silva",
    variante: dia.variante,
    agora: new Date(`${dia.quando}:00-03:00`),
    descadastroUrl: "#descadastro-exemplo",
  });
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
