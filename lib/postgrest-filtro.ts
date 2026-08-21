/**
 * Valores literais para dentro de um filtro `.or()` do PostgREST.
 *
 * O `.or()` recebe uma STRING que o PostgREST reparsa: vírgula separa
 * condições, ponto separa coluna/operador/valor e parêntese abre grupo. Um
 * termo de busca interpolado cru — um nome com vírgula, um e-mail com ponto —
 * deixa de ser valor e vira sintaxe. Daí para reescrever a condição inteira
 * (`...,id.gt.0` devolve a tabela toda) é um passo.
 *
 * A defesa é a que o próprio PostgREST oferece: valor entre aspas duplas, com
 * `\` e `"` escapados. Dentro das aspas, vírgula e ponto são apenas texto.
 *
 * Quando dá para não usar `.or()`, prefira `.eq()`, `.in()` ou `.ilike()`
 * separados — esses já vão como parâmetro e não passam por este parser.
 */

/** Valor literal, pronto para colar depois de `coluna.operador.`. */
export function filtroValor(valor: unknown): string {
  const texto = String(valor ?? "")
  return `"${texto.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}

/**
 * Termo de busca para `ilike`. `%` e `_` são curingas do LIKE: vindos do
 * usuário viram varredura da tabela inteira, então saem de cena.
 * `exato` devolve o termo sem curinga (usado em sigla, por exemplo).
 */
export function filtroIlike(termo: unknown, opcoes: { exato?: boolean } = {}): string {
  const limpo = String(termo ?? "").replace(/[%_]/g, " ").trim()
  return filtroValor(opcoes.exato ? limpo : `%${limpo}%`)
}
