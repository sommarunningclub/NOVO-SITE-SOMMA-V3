import "server-only";
import { criarPptAuth } from "@/lib/ppt/auth";

/**
 * Senha da LP enquanto o evento não foi liberado.
 *
 * Mesmo mecanismo dos decks (/ppt-*): a senha vem de variável de ambiente
 * (o repositório é público, então ela não pode estar no código), a conferência
 * é só no servidor e o acesso vira um cookie assinado, preso a /dexcomplica,
 * que vale 30 dias. Sem `LOVE_RUN_SENHA` configurada, ninguém entra.
 *
 * Depois da liberação a página é pública e a senha não é pedida.
 */
export const acessoLoveRun = criarPptAuth("dexcomplica", ["LOVE_RUN_SENHA"]);
