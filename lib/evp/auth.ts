import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSignedToken, safeCompare, verifySignedToken } from "@/lib/auth/session-token";
import { SLUG } from "./config";
import { rpc } from "./db";
import type { Papel, Sessao } from "./tipos";

/**
 * Acesso da equipe ao credenciamento e ao painel.
 *
 * Dois caminhos de entrada:
 *   - e-mail + senha de uma conta em `evp_staff` (senha com scrypt);
 *   - a senha mestra da variável `EVP_ADMIN_SENHA`, que entra como admin e
 *     serve para criar as primeiras contas. Sem valor padrão no código: o
 *     repositório é público.
 *
 * O cookie é assinado (HMAC) e guarda só o id da conta. A cada requisição o
 * servidor confere no banco se a conta segue ativa e qual é o papel: desativar
 * alguém no painel tira o acesso na hora, sem esperar o cookie vencer.
 */

export const COOKIE = "evp_equipe";
const PROPOSITO = `evp-equipe:${SLUG}`;
const DURACAO = 60 * 60 * 12;

export const ENV_SENHA_MESTRA = "EVP_ADMIN_SENHA";

export function senhaMestraConfigurada(): boolean {
  return Boolean(process.env[ENV_SENHA_MESTRA]?.trim());
}

export function senhaMestraCorreta(tentativa: string): boolean {
  const senha = process.env[ENV_SENHA_MESTRA]?.trim();
  return Boolean(senha) && safeCompare(tentativa.trim(), senha!);
}

export function tokenDaSessao(staffId: string): string {
  return createSignedToken(PROPOSITO, { id: staffId }, DURACAO);
}

export const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // strict: o painel cancela inscrição e exporta dados; nada disso pode partir
  // de navegação vinda de outro site.
  sameSite: "strict" as const,
  path: "/",
  maxAge: DURACAO,
};

type LinhaSessao = { id: string; nome: string; papel: Papel; ativo: boolean; mestre: boolean };

export async function lerSessao(): Promise<Sessao | null> {
  const jar = await cookies();
  const p = verifySignedToken<{ id?: unknown }>(PROPOSITO, jar.get(COOKIE)?.value);
  if (!p || typeof p.id !== "string" || !/^[0-9a-f-]{36}$/i.test(p.id)) return null;
  try {
    const s = await rpc<LinhaSessao | null>("evp_staff_sessao", { p_slug: SLUG, p_staff: p.id });
    if (!s || !s.ativo) return null;
    // A conta mestra só vale enquanto a senha mestra existir no ambiente.
    if (s.mestre && !senhaMestraConfigurada()) return null;
    return { id: s.id, nome: s.nome, papel: s.papel, mestre: s.mestre };
  } catch {
    return null;
  }
}

/** Operador e admin fazem check-in; só admin entra no painel. */
export function pode(sessao: Sessao | null, exigido: Papel): sessao is Sessao {
  if (!sessao) return false;
  return exigido === "operador" ? true : sessao.papel === "admin";
}

type Acesso = { sessao: Sessao; negado: null } | { sessao: null; negado: NextResponse };

/** Para as rotas de API: 401 sem sessão, 403 com sessão sem o papel. */
export async function exigir(papel: Papel): Promise<Acesso> {
  const sessao = await lerSessao();
  if (!sessao) {
    return { sessao: null, negado: NextResponse.json({ error: "Sessão expirada. Entre de novo." }, { status: 401 }) };
  }
  if (!pode(sessao, papel)) {
    return {
      sessao: null,
      negado: NextResponse.json({ error: "Sua conta não tem permissão para isso." }, { status: 403 }),
    };
  }
  return { sessao, negado: null };
}
