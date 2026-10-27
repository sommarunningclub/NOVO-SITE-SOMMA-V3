import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { acessoLoveRun } from "@/lib/dexcomplica-love-run/acesso";

export const dynamic = "force-dynamic";

/**
 * Recebe o formulário de senha da LP (POST de formulário comum, funciona sem
 * JavaScript). Certa: grava o cookie e volta para /dexcomplica. Errada:
 * volta com ?erro=1. Cota por IP para ninguém testar senha em massa.
 */
export async function POST(request: NextRequest) {
  const voltar = (q = "") => NextResponse.redirect(new URL(`/dexcomplica${q}`, request.url), 303);

  const limite = await rateLimit(`love-run:senha:${clientIp(request)}`, 10, 600);
  if (!limite.ok) return voltar("?erro=limite");

  const form = await request.formData().catch(() => null);
  const senha = String(form?.get("senha") ?? "").slice(0, 64);
  if (!acessoLoveRun.senhaCorreta(senha)) return voltar("?erro=1");

  const res = voltar();
  res.cookies.set(acessoLoveRun.COOKIE, acessoLoveRun.tokenDeAcesso(), acessoLoveRun.COOKIE_OPTS);
  return res;
}
