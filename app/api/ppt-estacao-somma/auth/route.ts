import { NextResponse } from "next/server";
import { COOKIE, COOKIE_OPTS, senhaCorreta, tokenDeAcesso } from "@/app/ppt-estacao-somma/auth";

/** Atraso fixo por tentativa: 6 dígitos são só 1 milhão de combinações. */
const ATRASO_MS = 450;

export async function POST(req: Request) {
  const inicio = Date.now();
  let codigo = "";
  try {
    const body = (await req.json()) as { codigo?: unknown };
    codigo = typeof body.codigo === "string" ? body.codigo : "";
  } catch {
    codigo = "";
  }

  const ok = codigo.length > 0 && senhaCorreta(codigo);

  const resta = ATRASO_MS - (Date.now() - inicio);
  if (resta > 0) await new Promise((r) => setTimeout(r, resta));

  if (!ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, tokenDeAcesso(), COOKIE_OPTS);
  return res;
}
