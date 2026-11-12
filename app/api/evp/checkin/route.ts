import { NextResponse, type NextRequest } from "next/server";
import { exigir } from "@/lib/evp/auth";
import { PREFIXO_QR, SLUG } from "@/lib/evp/config";
import { rpc } from "@/lib/evp/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Presentes, confirmados e os últimos check-ins. */
export async function GET() {
  const { negado } = await exigir("operador");
  if (negado) return negado;
  try {
    const resumo = await rpc("evp_checkin_resumo", { p_slug: SLUG });
    return NextResponse.json(resumo ?? {}, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar o resumo." }, { status: 503 });
  }
}

type Resposta = {
  ok: boolean;
  motivo?: string;
  inscricao?: { id: string; nome: string; codigo: string; distancia: string; cpf_final: string };
  feito_em?: string;
  operador?: string;
  presentes?: number;
};

const MENSAGEM: Record<string, string> = {
  invalido: "QR Code inválido. Esta credencial não é deste evento.",
  duplicado: "Check-in já feito para esta pessoa.",
  cancelada: "Inscrição cancelada. Não liberar a entrada.",
  lista_espera: "Pessoa em lista de espera, sem vaga confirmada.",
  sem_permissao: "Sua conta não tem permissão para fazer check-in.",
  sem_evento: "Evento não encontrado.",
};

/**
 * Confirma a presença. Corpo: { qr } (texto lido pela câmera) ou { id } (escolha
 * na busca manual). O texto do QR é só um identificador: quem decide é o banco.
 */
export async function POST(req: NextRequest) {
  const { sessao, negado } = await exigir("operador");
  if (negado) return negado;

  const limite = await rateLimit(`evp:checkin:${sessao.id}:${clientIp(req)}`, 240, 600);
  if (!limite.ok) return NextResponse.json({ error: "Muitas leituras seguidas. Aguarde um instante." }, { status: 429 });

  const corpo = await req.json().catch(() => ({}));
  const id = typeof corpo?.id === "string" && /^[0-9a-f-]{36}$/i.test(corpo.id) ? corpo.id : null;
  let qr: string | null = null;
  if (!id) {
    const lido = typeof corpo?.qr === "string" ? corpo.qr.trim() : "";
    // Fora do formato já é inválido, mas passa pelo banco para ficar no histórico.
    qr = lido.startsWith(PREFIXO_QR) ? lido.slice(PREFIXO_QR.length).slice(0, 80) : `fora-do-formato:${lido.slice(0, 40)}`;
  }

  try {
    const r = await rpc<Resposta>("evp_checkin", {
      p_slug: SLUG,
      p_staff: sessao.id,
      p_qr_token: qr,
      p_registration: id,
      p_via: id ? "manual" : "qr",
    });
    if (r.ok) return NextResponse.json(r);
    const status = r.motivo === "sem_permissao" ? 403 : r.motivo === "invalido" ? 404 : 409;
    return NextResponse.json({ ...r, error: MENSAGEM[r.motivo ?? ""] ?? "Check-in recusado." }, { status });
  } catch (erro) {
    console.error("[evp] Erro no check-in:", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "Falha ao registrar. Tente de novo." }, { status: 503 });
  }
}
