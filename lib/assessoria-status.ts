/**
 * Vendas da Assessoria Somma. Fechadas desde 23/10/2026: nenhuma assinatura
 * nova entra, por nenhum caminho.
 *
 * Com `false`:
 * - todo /checkout/* mostra o cadeado de "fora do ar";
 * - a seção #assessoria some da home, junto com os links de menu e rodapé;
 * - as rotas que criam cliente e cobrança no Asaas recusam o pedido. É essa a
 *   trava que vale: a tela some, mas quem chama a API direto também não passa.
 *
 * Quem já é aluno não é afetado: webhook, consulta de status e /assessoria/nps
 * seguem funcionando. Para reabrir, trocar para `true` e publicar.
 *
 * Desde 26/10/2026 /assessoria e os links de professor (/joseph, /alexandre,
 * /mateus, /gabriel-brito) não dependem mais desta flag: apresentam a BORA,
 * a assessoria oficial do SOMMA Club. A assinatura é no checkout da BORA na
 * Runy (lib/nova-assessoria/promo), não no Asaas do SOMMA.
 */
export const ASSESSORIA_VENDAS_ABERTAS = false;

/**
 * Professores que vendem pelo Asaas mesmo com as vendas fechadas. De 28/10 a
 * 04/11/2026 os quatro links de professor foram checkout aqui; desde então a
 * venda é pela Runy e a lista está vazia. O nome é o exato de
 * `professores_curriculo_assessoria`, o mesmo que o checkout manda às rotas
 * de cobrança.
 */
export const PROFESSORES_COM_VENDA_ABERTA: string[] = [];

/** Se uma venda com este professor pode passar pelas rotas de cobrança. */
export function vendaAberta(professor: unknown): boolean {
  return (
    ASSESSORIA_VENDAS_ABERTAS ||
    (typeof professor === "string" && PROFESSORES_COM_VENDA_ABERTA.includes(professor))
  );
}

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
