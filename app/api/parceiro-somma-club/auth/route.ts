import { NextResponse } from "next/server";
import { COOKIE, COOKIE_OPTS, tokenDeAcesso, validarCodigo } from "@/lib/parceiro/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Atraso fixo por tentativa, como nos decks: encarece a varredura de códigos. */
const ATRASO_MS = 450;

export async function POST(req: Request) {
  const inicio = Date.now();

  // O atraso sozinho não segura força bruta distribuída; a cota por IP é o que
  // torna inviável varrer a lista de códigos.
  const ip = clientIp(req);
  const limite = await rateLimit(`parceiro:acesso:${ip}`, 12, 600);
  if (!limite.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
    );
  }

  let codigo: unknown = "";
  try {
    const body = (await req.json()) as { codigo?: unknown };
    codigo = body.codigo;
  } catch {
    codigo = "";
  }

  const parceiro = await validarCodigo(codigo);

  // O atraso vale para acerto e erro: o tempo de resposta não entrega se o
  // código existe.
  const resta = ATRASO_MS - (Date.now() - inicio);
  if (resta > 0) await new Promise((r) => setTimeout(r, resta));

  if (!parceiro) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, tokenDeAcesso(parceiro), COOKIE_OPTS);
  return res;
}
