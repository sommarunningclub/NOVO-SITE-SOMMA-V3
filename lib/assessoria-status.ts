/**
 * Vendas da Assessoria Somma. Fechadas desde 23/10/2026: nenhuma assinatura
 * nova entra, por nenhum caminho.
 *
 * Com `false`:
 * - /assessoria, todo /checkout/* e os links de professor (/alexandre,
 *   /gabriel-brito, /joseph, /mateus) mostram o cadeado de "fora do ar";
 * - a seção #assessoria some da home, junto com os links de menu e rodapé;
 * - as rotas que criam cliente e cobrança no Asaas recusam o pedido. É essa a
 *   trava que vale: a tela some, mas quem chama a API direto também não passa.
 *
 * Quem já é aluno não é afetado: webhook, consulta de status e /assessoria/nps
 * seguem funcionando. Para reabrir, trocar para `true` e publicar.
 */
export const ASSESSORIA_VENDAS_ABERTAS = false;

export const ASSESSORIA_FORA_DO_AR = "Assessoria fora do ar";

/**
 * Resposta das rotas de cobrança enquanto as vendas estão fechadas. `Response`
 * e não `NextResponse`: este arquivo também é lido pelo menu (client).
 */
export function respostaVendasFechadas() {
  return Response.json(
    { error: `${ASSESSORIA_FORA_DO_AR}. Novas assinaturas estão suspensas.` },
    { status: 403 }
  );
}
