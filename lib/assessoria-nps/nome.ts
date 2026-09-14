/**
 * Nome e sobrenome na pesquisa NPS da Assessoria.
 *
 * Três formas do mesmo nome, cada uma com seu uso:
 * - apresentação (`capitalizarNome`): o que vai para `first_name`/`last_name`;
 * - validação (`erroNoNome`): a mesma regra no navegador e no servidor;
 * - busca (`normalizarParaBusca`): sem acento, minúsculo, sem partícula. É o
 *   que casa "joão da silva" com "JOAO SILVA" no cadastro da gestão.
 *
 * Módulo puro, sem dependências: roda no cliente e no servidor.
 */

export const NOME_MAX = 60;
export const SOBRENOME_MAX = 80;

/** Partículas que não identificam ninguém sozinhas. */
const PARTICULAS = new Set(["de", "da", "do", "das", "dos", "e", "di", "del", "du", "d"]);

const SO_LETRAS = /^[\p{L}\p{M}'’.\- ]+$/u;

export function limparEspacos(raw: string): string {
  return String(raw ?? "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

function primeiraMaiuscula(palavra: string): string {
  // "maria-clara" → "Maria-Clara", "d'ávila" → "D'Ávila"
  return palavra.replace(/(^|[-'’])(\p{L})/gu, (_, sep: string, letra: string) => sep + letra.toLocaleUpperCase("pt-BR"));
}

/**
 * Caixa de apresentação. Só mexe quando o nome veio todo minúsculo ou todo
 * maiúsculo: se a pessoa escreveu "McArthur" ou "de Souza", a escolha é dela.
 */
export function capitalizarNome(raw: string): string {
  const limpo = limparEspacos(raw);
  if (!limpo) return limpo;

  const temMinuscula = limpo !== limpo.toLocaleUpperCase("pt-BR");
  const temMaiuscula = limpo !== limpo.toLocaleLowerCase("pt-BR");
  if (temMinuscula && temMaiuscula) return limpo;

  return limpo
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((p, i) => (i > 0 && PARTICULAS.has(p) ? p : primeiraMaiuscula(p)))
    .join(" ");
}

export type ParteDoNome = "first_name" | "last_name";

/** Mensagem de erro humana, ou `null` quando está tudo certo. */
export function erroNoNome(raw: string, parte: ParteDoNome): string | null {
  const valor = limparEspacos(raw);
  const rotulo = parte === "first_name" ? "nome" : "sobrenome";

  if (!valor) return `Informe seu ${rotulo}.`;
  if (!SO_LETRAS.test(valor)) return `Use apenas letras no ${rotulo}.`;

  const letras = valor.replace(/[^\p{L}]/gu, "");
  if (letras.length < 2) return `Escreva seu ${rotulo} completo.`;

  const max = parte === "first_name" ? NOME_MAX : SOBRENOME_MAX;
  if (valor.length > max) return `Esse ${rotulo} passou de ${max} caracteres.`;

  return null;
}

/** "João da Silva" → "joao silva". Base de busca e deduplicação. */
export function normalizarParaBusca(raw: string): string {
  return tokensDoNome(raw).join(" ");
}

export function tokensDoNome(raw: string): string[] {
  return String(raw ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0 && !PARTICULAS.has(t));
}

/**
 * O nome digitado identifica este cadastro? O primeiro nome precisa bater, e
 * todo sobrenome digitado precisa existir no cadastro. "Ana Souza" casa com
 * "ANA PAULA DE SOUZA LIMA"; "Ana Lima Costa" não casa (Costa não está lá).
 */
export function nomeCasaCom(digitado: string, cadastro: string): boolean {
  const d = tokensDoNome(digitado);
  const c = tokensDoNome(cadastro);
  if (d.length < 2 || c.length < 2) return false;
  if (d[0] !== c[0]) return false;
  const resto = new Set(c.slice(1));
  return d.slice(1).every((t) => resto.has(t));
}

/** Nome completo do cadastro → nome e sobrenome para pré-preencher o convite. */
export function separarNomeCompleto(completo: string): { first: string; last: string } {
  const partes = capitalizarNome(completo).split(" ").filter(Boolean);
  if (partes.length <= 1) return { first: partes[0] ?? "", last: "" };
  return { first: partes[0], last: partes.slice(1).join(" ") };
}
