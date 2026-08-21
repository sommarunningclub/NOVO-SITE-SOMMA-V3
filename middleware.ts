import { NextResponse, type NextRequest } from "next/server";
import { verifySignedTokenEdge } from "@/lib/auth/session-token-edge";

/**
 * Porteiro de `/admin/*`.
 *
 * Cada página de admin já confere a própria sessão — este middleware não
 * substitui isso, e não deve. Ele existe porque "cada página confere" é uma
 * promessa que depende de ninguém esquecer: basta uma página nova sem a
 * checagem para o painel inteiro ficar aberto. Aqui a regra é a inversa, e vale
 * por omissão: rota de admin que este arquivo não conhece não abre.
 *
 * A raiz de cada módulo passa sempre — é ela que desenha o formulário de login.
 * O que exige sessão é tudo abaixo dela.
 *
 * O token é verificado de verdade (HMAC), não só "existe um cookie": um cookie
 * qualquer com o nome certo não passa daqui.
 */

interface Modulo {
  /** Primeiro segmento depois de /admin. */
  base: string;
  cookie: string;
  purpose: string;
}

const MODULOS: Modulo[] = [
  { base: "campanhas", cookie: "camp_op", purpose: "campanhas-operador" },
  { base: "campanhas-desafio-esteiras", cookie: "camp_op", purpose: "campanhas-operador" },
  { base: "campanhas-sunset-wine-run", cookie: "camp_op", purpose: "campanhas-operador" },
  {
    base: "desafio-das-esteiras",
    cookie: "dst_op",
    purpose: "desafio-esteiras-operador",
  },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segmentos = pathname.split("/").filter(Boolean); // ["admin", "<base>", ...]
  const base = segmentos[1];

  // `/admin` sozinho não tem página; manda para a home em vez de 404 interno.
  if (!base) return NextResponse.redirect(new URL("/", request.url));

  const modulo = MODULOS.find((m) => m.base === base);

  // Módulo desconhecido: nega por omissão. Rota nova de admin precisa entrar
  // nesta lista para funcionar — é o ponto do arquivo.
  if (!modulo) return NextResponse.redirect(new URL("/", request.url));

  // Raiz do módulo: é onde mora o login.
  if (segmentos.length === 2) return NextResponse.next();

  const token = request.cookies.get(modulo.cookie)?.value;
  const payload = await verifySignedTokenEdge(modulo.purpose, token);
  if (!payload) {
    return NextResponse.redirect(new URL(`/admin/${modulo.base}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
