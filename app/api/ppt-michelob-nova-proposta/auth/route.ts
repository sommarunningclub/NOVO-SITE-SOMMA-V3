import { NextResponse } from "next/server";
import {
  COOKIE,
  COOKIE_OPTS,
  configurado,
  senhaCorreta,
  tokenDeAcesso,
} from "@/app/ppt-michelob-nova-proposta/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/** Atraso fixo por tentativa: 6 dígitos são só 1 milhão de combinações. */
const ATRASO_MS = 450;

export async function POST(req: Request) {
  const inicio = Date.now();

  // O atraso sozinho não segura força bruta distribuída no tempo: a cota por IP
  // é o que transforma 1 milhão de combinações em algo inviável de varrer.
  const ip = clientIp(req);
  const limite = await rateLimit(`ppt:ppt-michelob-nova-proposta:${ip}`, 12, 600);
  if (!limite.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
    );
  }

  if (!configurado()) {
    console.error("[ppt-michelob-nova-proposta] Código de acesso não configurado.");
    return NextResponse.json({ ok: false, error: "Acesso não configurado." }, { status: 503 });
  }

  let codigo = "";
  try {
    const body = (await req.json()) as { codigo?: unknown };
    codigo = typeof body.codigo === "string" ? body.codigo : "";
  } catch {
    codigo = "";
  }

  const ok = codigo.length > 0 && senhaCorreta(codigo);

  // O atraso vale para acerto e erro, então o tempo de resposta não entrega nada.
  const resta = ATRASO_MS - (Date.now() - inicio);
  if (resta > 0) await new Promise((r) => setTimeout(r, resta));

  if (!ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, tokenDeAcesso(), COOKIE_OPTS);
  return res;
}
