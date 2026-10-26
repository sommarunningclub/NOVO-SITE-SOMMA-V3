import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase";
import {
  PROFESSORES_BORA,
  linkDoWhatsapp,
  paginaValida,
  professorPorSlug,
  type ProfessorBora,
} from "@/lib/nova-assessoria/professores";
import { dadosDeRastreio, ipDaRequisicao } from "@/lib/nova-assessoria/rastreio-servidor";

/**
 * Contato com a BORA: a pessoa deixou nome e WhatsApp e quer falar com um
 * professor. Devolve o link do WhatsApp dele, com a mensagem já escrita.
 *
 * Em /assessoria o professor sai do rodízio (`nova_assessoria_rodizio`): cada
 * pessoa nova leva o próximo da fila. Quem já recebeu um professor (mesmo
 * aparelho ou mesmo WhatsApp) volta para ele, sem andar a fila, para ninguém
 * cair em dois professores clicando de novo. No link de um professor, é
 * sempre ele.
 *
 * Banco fora do ar não deixa ninguém sem conversa: o professor sai da sorte e
 * o erro vai para o log.
 */

// Quanto tempo o mesmo professor fica reservado para quem já foi distribuído.
const DIAS_DE_RESERVA = 60;
// Teto de contatos por IP em 10 minutos. Segura robô andando a fila sozinho
// sem barrar uma família no mesmo Wi-Fi.
const LIMITE_POR_IP = 8;

/** Só dígitos, com DDI 55. Aceita com ou sem DDI e com ou sem o 9. */
function normalizarWhatsapp(bruto: unknown): string | null {
  if (typeof bruto !== "string") return null;
  const digitos = bruto.replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) return digitos;
  return null;
}

function erro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status });
}

interface Escolha {
  professor: ProfessorBora;
  posicao: number | null;
  repetido: boolean;
}

/** Professor que esta pessoa já recebeu do rodízio, se recebeu. */
async function professorJaRecebido(
  supabase: SupabaseClient,
  visitanteId: string | null,
  whatsapp: string
): Promise<ProfessorBora | null> {
  const desde = new Date(Date.now() - DIAS_DE_RESERVA * 86_400_000).toISOString();
  const filtros = [`whatsapp.eq.${whatsapp}`];
  if (visitanteId && /^[\w-]+$/.test(visitanteId)) filtros.push(`visitante_id.eq.${visitanteId}`);
  const { data, error } = await supabase
    .from("nova_assessoria_eventos")
    .select("professor")
    .eq("tipo", "contato")
    .eq("pagina", "assessoria")
    .gte("criado_em", desde)
    .or(filtros.join(","))
    .order("criado_em", { ascending: false })
    .limit(1);
  if (error) throw error;
  return professorPorSlug(data?.[0]?.professor);
}

async function escolherProfessor(
  supabase: SupabaseClient | null,
  pagina: string,
  visitanteId: string | null,
  whatsapp: string
): Promise<Escolha> {
  const doLink = pagina.startsWith("bio-") ? professorPorSlug(pagina.slice(4)) : null;
  if (doLink) return { professor: doLink, posicao: null, repetido: false };

  if (supabase) {
    try {
      const anterior = await professorJaRecebido(supabase, visitanteId, whatsapp);
      if (anterior) return { professor: anterior, posicao: null, repetido: true };

      const { data, error } = await supabase.rpc("nova_assessoria_avancar_rodizio");
      if (error) throw error;
      const vez = Array.isArray(data) ? data[0] : data;
      const professor = professorPorSlug(vez?.professor);
      if (professor) return { professor, posicao: Number(vez.posicao), repetido: false };
      console.error("[nova-assessoria] Rodízio devolveu professor desconhecido:", vez);
    } catch (err) {
      console.error("[nova-assessoria] Falha no rodízio:", err);
    }
  }

  const sorteado = PROFESSORES_BORA[Math.floor(Math.random() * PROFESSORES_BORA.length)];
  return { professor: sorteado, posicao: null, repetido: false };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return erro("Pedido inválido.", 400);

  // Campo invisível: gente não preenche, robô preenche.
  if (typeof body.empresa === "string" && body.empresa.trim()) return erro("Pedido inválido.", 400);

  const { pagina } = body;
  if (!paginaValida(pagina)) return erro("Página desconhecida.", 400);

  const nome = typeof body.nome === "string" ? body.nome.trim().replace(/\s+/g, " ") : "";
  if (nome.length < 2 || nome.length > 80) return erro("Digite seu nome.", 400);

  const whatsapp = normalizarWhatsapp(body.whatsapp);
  if (!whatsapp) return erro("Digite um WhatsApp com DDD.", 400);

  const supabase = getServiceSupabase();
  const rastreio = dadosDeRastreio(req, body.rastreio);

  if (supabase) {
    const ip = ipDaRequisicao(req);
    if (ip) {
      const { count } = await supabase
        .from("nova_assessoria_eventos")
        .select("id", { count: "exact", head: true })
        .eq("tipo", "contato")
        .eq("ip", ip)
        .gte("criado_em", new Date(Date.now() - 10 * 60_000).toISOString());
      if ((count ?? 0) >= LIMITE_POR_IP) {
        return erro("Muitas tentativas seguidas. Espere alguns minutos e tente de novo.", 429);
      }
    }
  }

  const escolha = await escolherProfessor(supabase, pagina, rastreio.visitante_id, whatsapp);
  const url = linkDoWhatsapp(escolha.professor, nome);

  if (supabase) {
    const { error } = await supabase.from("nova_assessoria_eventos").insert({
      tipo: "contato",
      pagina,
      professor: escolha.professor.slug,
      professor_nome: escolha.professor.nome,
      professor_whatsapp: escolha.professor.whatsapp,
      rodizio_posicao: escolha.posicao,
      repetido: escolha.repetido,
      nome,
      whatsapp,
      ...rastreio,
    });
    if (error) console.error("[nova-assessoria] Falha ao registrar contato:", error.message);
  }

  return NextResponse.json({
    url,
    professor: { nome: escolha.professor.nome, primeiroNome: escolha.professor.primeiroNome },
  });
}
