import "server-only";
import { cookies } from "next/headers";
import { createSignedToken, safeCompare, verifySignedToken } from "@/lib/auth/session-token";

/**
 * Trava dos decks comerciais (/ppt-*).
 *
 * A verificação acontece só no servidor: o código nunca vai para o navegador e
 * os slides só são renderizados depois que o cookie está válido. Um bloqueio
 * feito no cliente não protegeria nada, porque tanto o código quanto o conteúdo
 * já teriam sido baixados junto com a página.
 *
 * Hoje só a Estação SOMMA versão 2 usa este módulo; os outros decks ainda têm o
 * `auth.ts` próprio de cada rota. Duas coisas aqui são diferentes deles, e a
 * ideia é que os outros migrem para cá:
 *
 * 1. **Sem código padrão.** Cada deck tem `"258510"` ou `"101010"` escrito no
 *    fonte — versionado no Git e repetido no README. Aqui, sem a variável de
 *    ambiente, o deck simplesmente não abre.
 * 2. **Segredo de assinatura separado do código.** Nos outros, o cookie é
 *    assinado com uma chave derivada do próprio código de acesso, então quem
 *    descobre o código pode forjar o cookie de qualquer um. Aqui quem assina é
 *    o segredo de sessão da aplicação, com um propósito por deck: um cookie de
 *    um deck não vale no outro, e nenhum deriva do código.
 */

const DIAS = 30;
const MAX_AGE = 60 * 60 * 24 * DIAS;

export interface PptAuth {
  COOKIE: string;
  COOKIE_OPTS: {
    httpOnly: boolean;
    sameSite: "lax";
    secure: boolean;
    path: string;
    maxAge: number;
  };
  /** Existe código configurado? Sem ele a rota devolve 503 em vez de 401. */
  configurado(): boolean;
  senhaCorreta(tentativa: string): boolean;
  tokenDeAcesso(): string;
  cookieValido(valor: string | undefined): boolean;
  temAcesso(): Promise<boolean>;
}

/**
 * @param slug     Segmento da URL do deck (`ppt-michelob`), que vira o nome do
 *                 cookie, o caminho a que ele fica preso e o propósito do HMAC.
 * @param codeEnvs Variáveis de código, em ordem de precedência. As propostas do
 *                 Michelob aceitam a variável própria e caem na do deck-mãe.
 */
export function criarPptAuth(slug: string, codeEnvs: string[]): PptAuth {
  const COOKIE = slug;
  const PURPOSE = `ppt:${slug}`;

  function codigo(): string | null {
    for (const nome of codeEnvs) {
      const valor = process.env[nome]?.trim();
      if (valor) return valor;
    }
    return null;
  }

  const auth: PptAuth = {
    COOKIE,
    COOKIE_OPTS: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: `/${slug}`,
      maxAge: MAX_AGE,
    },

    configurado() {
      return codigo() !== null;
    },

    /** Comparação de tempo constante: nunca `===` em código de acesso. */
    senhaCorreta(tentativa: string): boolean {
      const esperado = codigo();
      if (!esperado) return false;
      return safeCompare(tentativa.trim(), esperado);
    },

    tokenDeAcesso(): string {
      return createSignedToken(PURPOSE, { deck: slug }, MAX_AGE);
    },

    cookieValido(valor: string | undefined): boolean {
      if (!valor) return false;
      return verifySignedToken<{ deck?: string }>(PURPOSE, valor)?.deck === slug;
    },

    async temAcesso(): Promise<boolean> {
      // Deck sem código configurado não abre para ninguém, nem com cookie antigo.
      if (!auth.configurado()) return false;
      const jar = await cookies();
      return auth.cookieValido(jar.get(COOKIE)?.value);
    },
  };

  return auth;
}
