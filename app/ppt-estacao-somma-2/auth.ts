import { criarPptAuth } from "@/lib/ppt/auth";

/**
 * Trava da apresentação Estação SOMMA versão 2 (SOMMA Club + Evolve + Bugu).
 *
 * Toda a mecânica vive em `lib/ppt/auth.ts` — cookie assinado com o
 * segredo de sessão da aplicação e código exigido por variável de ambiente.
 * Aceita `PPT_ESTACAO_SOMMA_2_CODE` e cai em `PPT_ESTACAO_SOMMA_CODE` quando a
 * primeira não existe: assim esta versão pode abrir com o mesmo código do
 * deck-mãe até alguém decidir separar os dois. Sem nenhuma das duas, o deck não
 * abre — aqui não há código padrão no fonte.
 */
const auth = criarPptAuth("ppt-estacao-somma-2", ["PPT_ESTACAO_SOMMA_2_CODE", "PPT_ESTACAO_SOMMA_CODE"]);

export const COOKIE = auth.COOKIE;
export const COOKIE_OPTS = auth.COOKIE_OPTS;
export const configurado = auth.configurado;
export const senhaCorreta = auth.senhaCorreta;
export const tokenDeAcesso = auth.tokenDeAcesso;
export const cookieValido = auth.cookieValido;
export const temAcesso = auth.temAcesso;
