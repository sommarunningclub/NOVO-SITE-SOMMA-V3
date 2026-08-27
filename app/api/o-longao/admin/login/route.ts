import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  authConfigured,
  createSessionToken,
  resolveLogin,
  sessionCookieOptions,
} from "@/lib/o-longao/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Atraso fixo por tentativa: encarece a força bruta sem punir quem acerta. */
const ATRASO_MS = 500;

export async function POST(request: NextRequest) {
  const limit = await rateLimit(`lgo:login:${clientIp(request)}`, 10, 600);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  await new Promise((r) => setTimeout(r, ATRASO_MS));

  if (!authConfigured()) {
    return NextResponse.json(
      {
        error:
          "Acesso ainda não configurado. Defina O_LONGAO_ADMIN_PASSWORD (e AUTH_SECRET) no ambiente.",
      },
      { status: 503 }
    );
  }

  let senha = "";
  try {
    const body = (await request.json()) as { senha?: unknown };
    senha = typeof body.senha === "string" ? body.senha : "";
  } catch {
    senha = "";
  }

  const session = resolveLogin(senha);
  if (!session) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(session), sessionCookieOptions());
  return response;
}

/** Logout: derruba o cookie de sessão. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
