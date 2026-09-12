import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { identificacaoSchema } from "@/lib/somma-day/schema";
import { getEvento, identificarPorCpf } from "@/lib/somma-day/db";

export const dynamic = "force-dynamic";

/**
 * Etapa 1 da inscrição: o CPF.
 *
 * A rota é, por natureza, um oráculo de "este CPF está na base do Somma?" —
 * não dá para fechá-la sem quebrar o fluxo, então o que se faz é encarecer a
 * varredura: cota por IP e tempo de resposta constante, para achado e
 * não-achado saírem indistinguíveis no relógio. Mesmo desenho de
 * `/api/verify-cpf`.
 *
 * Devolve o PRIMEIRO nome e só ele. O resto do cadastro nunca sai daqui: a
 * tela só precisa saber a quem cumprimentar e o que ainda falta perguntar.
 */
const ATRASO_MS = 320;

async function responder(inicio: number, corpo: Record<string, unknown>, status = 200) {
  const resta = ATRASO_MS - (Date.now() - inicio);
  if (resta > 0) await new Promise((r) => setTimeout(r, resta));
  return NextResponse.json(corpo, { status });
}

export async function POST(request: NextRequest) {
  const inicio = Date.now();
  try {
    const ip = clientIp(request);
    const limite = await rateLimit(`somma-day:identificar:${ip}`, 20, 600);
    if (!limite.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
      );
    }

    const corpo = await request.json().catch(() => null);
    const parsed = identificacaoSchema.safeParse(corpo ?? {});
    if (!parsed.success) {
      return responder(
        inicio,
        { error: parsed.error.issues[0]?.message ?? "CPF inválido" },
        422
      );
    }

    const evento = await getEvento();
    const resultado = await identificarPorCpf(parsed.data.cpf, evento?.id ?? null);

    return responder(inicio, {
      existe: resultado.existe,
      primeiro_nome: resultado.primeiroNome,
      faltando: resultado.faltando,
      ja_inscrito: resultado.jaInscrito
        ? {
            ticket: resultado.jaInscrito.ticket,
            pelotao: resultado.jaInscrito.pelotao,
            credencial_url: `/edicao-especial-set-2026/credencial/${resultado.jaInscrito.token}`,
          }
        : null,
    });
  } catch (erro) {
    console.error("[somma-day] Erro ao identificar:", erro);
    return responder(inicio, { error: "Erro interno do servidor" }, 500);
  }
}
