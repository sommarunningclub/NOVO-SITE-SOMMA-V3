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
 * Desde 26/10/2026 /assessoria não depende mais desta flag: apresenta a BORA,
 * a assessoria oficial do SOMMA Club, e leva ao WhatsApp dos professores
 * (lib/nova-assessoria). Os links de professor são a exceção, logo abaixo.
 */
export const ASSESSORIA_VENDAS_ABERTAS = false;

/**
 * Professores que seguem vendendo com as vendas fechadas. Desde 28/10/2026 os
 * links deles (/alexandre, /joseph, /mateus, /gabriel-brito) voltaram a ser o
 * checkout de Mensal, Semestral e Anual, a pedido do Alex; /assessoria e
 * /checkout/* continuam fechados. O nome é o exato de
 * `professores_curriculo_assessoria`, o mesmo que o checkout manda às rotas
 * de cobrança.
 */
export const PROFESSORES_COM_VENDA_ABERTA = [
  "Alexandre Alves",
  "Joseph Pereira",
  "Mateus Fonseca",
  "Gabriel Brito",
];

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
