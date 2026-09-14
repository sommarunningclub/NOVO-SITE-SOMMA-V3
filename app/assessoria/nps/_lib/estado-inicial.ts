import "server-only";
import { cookies } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase";
import { SURVEY_VERSION } from "@/lib/assessoria-nps/survey";
import { rotuloDoPeriodo } from "@/lib/assessoria-nps/rodada";
import {
  CONVITE_COOKIE,
  buscarCampanhaAtual,
  buscarCampanhaPorSlug,
  buscarConvite,
  conviteRespondido,
} from "@/lib/assessoria-nps/db";
import type { EstadoInicial } from "../_components/types";

/**
 * O que a pesquisa mostra ao abrir, resolvido no servidor.
 *
 * Sem slug é o link geral (/assessoria/nps): vale a rodada no ar. Com slug é o
 * link da rodada (/assessoria/nps/2026-set-out): vale aquela rodada, mesmo que
 * já tenha encerrado ou ainda não tenha aberto, e a tela diz qual é o caso.
 */
export async function carregarEstadoInicial(slug?: string): Promise<EstadoInicial> {
  const sb = getServiceSupabase();
  if (!sb) return { tipo: "indisponivel" };

  const busca = slug === undefined ? await buscarCampanhaAtual(sb) : await buscarCampanhaPorSlug(sb, slug);

  switch (busca.status) {
    case "indisponivel":
      return { tipo: "indisponivel" };
    case "nao_encontrada":
      return { tipo: "nao-encontrada" };
    case "encerrada":
      return { tipo: "encerrada", rotulo: rotuloDoPeriodo(busca.campanha?.reference_period) };
    case "agendada":
      return {
        tipo: "agendada",
        abreEm: busca.campanha.opens_at,
        rotulo: rotuloDoPeriodo(busca.campanha.reference_period),
      };
  }

  const { campanha } = busca;
  if (campanha.survey_version !== SURVEY_VERSION) {
    console.error("[assessoria-nps] rodada com survey_version diferente do código:", campanha.slug);
    return { tipo: "indisponivel" };
  }

  // Link pessoal: o token vive num cookie httpOnly (ver convite/[token]/route.ts)
  // e só vale na rodada para a qual foi gerado.
  const token = (await cookies()).get(CONVITE_COOKIE)?.value;
  const convite = await buscarConvite(sb, token);
  const conviteDaRodada = convite && convite.campaign_id === campanha.id ? convite : null;

  return {
    tipo: "aberta",
    campanha: campanha.slug,
    rotulo: rotuloDoPeriodo(campanha.reference_period),
    convite: conviteDaRodada
      ? {
          firstName: conviteDaRodada.first_name,
          lastName: conviteDaRodada.last_name,
          jaRespondeu: await conviteRespondido(sb, conviteDaRodada.id),
        }
      : null,
  };
}
