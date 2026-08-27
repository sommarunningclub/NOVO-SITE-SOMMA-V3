/**
 * Valores literais para dentro de um filtro `.or()` do PostgREST.
 *
 * O `.or()` recebe uma STRING que o PostgREST reparsa: vírgula separa
 * condições, ponto separa coluna/operador/valor e parêntese abre grupo. Um
 * termo de busca interpolado cru (um nome com vírgula, um @ com ponto) deixa
 * de ser valor e vira sintaxe, e daí para reescrever a condição inteira é um
 * passo.
 *
 * A defesa é a que o próprio PostgREST oferece: valor entre aspas duplas, com
 * `\` e `"` escapados. Dentro das aspas, vírgula e ponto são só texto.
 *
 * Existe uma cópia deste helper em `lib/postgrest-filtro.ts`. A daqui é
 * deliberada: aquele arquivo não está em todos os ramos do projeto, e o painel
 * do Longão não pode deixar de compilar por causa de qual base ele foi
 * publicado. Se um dia os dois convergirem, este some.
 */

/** Valor literal, pronto para colar depois de `coluna.operador.`. */
export function filtroValor(valor: unknown): string {
  const texto = String(valor ?? "");
  return `"${texto.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Termo de busca para `ilike`. `%` e `_` são curingas do LIKE: vindos do
 * usuário viram varredura da tabela inteira, então saem de cena.
 */
export function filtroIlike(termo: unknown): string {
  const limpo = String(termo ?? "").replace(/[%_]/g, " ").trim();
  return filtroValor(`%${limpo}%`);
}
