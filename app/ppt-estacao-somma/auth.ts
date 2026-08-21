import { criarPptAuth } from "@/lib/ppt/auth";

/**
 * Trava da apresentação Estação SOMMA (SOMMA Club + Evolve).
 *
 * Toda a mecânica vive em `lib/ppt/auth.ts` — cookie assinado com o
 * `AUTH_SECRET` da aplicação e código exigido por variável de ambiente
 * (PPT_ESTACAO_SOMMA_CODE). Sem a variável, o deck não abre:
 * o código padrão que ficava aqui no fonte foi removido.
 */
const auth = criarPptAuth("ppt-estacao-somma", ["PPT_ESTACAO_SOMMA_CODE"]);

export const COOKIE = auth.COOKIE;
export const COOKIE_OPTS = auth.COOKIE_OPTS;
export const configurado = auth.configurado;
export const senhaCorreta = auth.senhaCorreta;
export const tokenDeAcesso = auth.tokenDeAcesso;
export const cookieValido = auth.cookieValido;
export const temAcesso = auth.temAcesso;
