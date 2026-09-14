import { NextResponse } from "next/server";
import { CONVITE_COOKIE } from "@/lib/assessoria-nps/db";

export const dynamic = "force-dynamic";

/**
 * "Responder por outra pessoa neste aparelho": esquece o link pessoal.
 *
 * Sem isto, a segunda pessoa que responde no mesmo celular teria a resposta
 * vinculada ao aluno do convite. O envio também manda `use_invite: false`, então
 * esta rota só garante que um refresh não traga o nome do convite de volta.
 */
export async function DELETE() {
  const resposta = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  resposta.cookies.set(CONVITE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return resposta;
}
