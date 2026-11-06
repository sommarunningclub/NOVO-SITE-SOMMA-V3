import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSignedToken, verifySignedToken } from "@/lib/auth/session-token";
import { getServiceSupabase } from "@/lib/supabase";
import { EVENTO_SLUG } from "@/lib/dexcomplica-love-run/event.config";

/**
 * Sessão da comunidade. O site não usa Supabase Auth para participante, então
 * segue o padrão do resto da casa: token assinado, aqui num cookie httpOnly.
 *
 * Guarda a vaga E a pessoa: a transferência troca o titular na mesma linha, e
 * quem transferiu não pode continuar entrando com a sessão antiga. O banco
 * confere esse par em toda chamada.
 */
const COOKIE = "dex_corre_sessao";
const PROPOSITO = "dex-corre-sessao";
const DURACAO = 60 * 60 * 24 * 5;

export const SLUG = EVENTO_SLUG;
export const BUCKET_FOTOS = "dex-corre-fotos";

export interface Sessao {
  participacao: string;
  pessoa: number;
}

export async function lerSessao(): Promise<Sessao | null> {
  const jar = await cookies();
  const p = verifySignedToken<{ id: string; pessoa: number }>(PROPOSITO, jar.get(COOKIE)?.value);
  if (!p || typeof p.id !== "string" || typeof p.pessoa !== "number") return null;
  return { participacao: p.id, pessoa: p.pessoa };
}

export function gravarSessao(res: NextResponse, s: Sessao) {
  res.cookies.set(COOKIE, createSignedToken(PROPOSITO, { id: s.participacao, pessoa: s.pessoa }, DURACAO), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO,
  });
}

export function apagarSessao(res: NextResponse) {
  res.cookies.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

/** Todas as leituras e escritas passam por funções do banco, nunca por tabela. */
export async function rpc<T>(funcao: string, args: Record<string, unknown>): Promise<T> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("banco indisponível");
  const { data, error } = await supabase.rpc(funcao, args);
  if (error) throw new Error(`${funcao}: ${error.message}`);
  return data as T;
}

/** Argumentos de identidade: sempre da sessão, nunca do navegador. */
export const quem = (s: Sessao) => ({ p_participacao: s.participacao, p_pessoa: s.pessoa });

export const semSessao = () => NextResponse.json({ ok: false, erro: "sessao" }, { status: 401 });
export const falha = (rota: string, erro: unknown) => {
  console.error(`[corre] ${rota}:`, erro instanceof Error ? erro.message : erro);
  return NextResponse.json({ ok: false, erro: "rede" }, { status: 500 });
};
