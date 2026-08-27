/** Partículas que não contam como sobrenome sozinhas. */
const PARTICULAS = new Set(["DE", "DA", "DO", "DAS", "DOS", "E", "DI", "DEL"]);

/** Nome gravado: maiúsculas, um espaço entre as palavras. */
export function normalizarNome(raw: string): string {
  return String(raw ?? "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleUpperCase("pt-BR");
}

/** Enquanto a pessoa digita: só sobe a caixa, sem comer o espaço do sobrenome. */
export function nomeDigitando(raw: string): string {
  return String(raw ?? "").toLocaleUpperCase("pt-BR");
}

/**
 * Pelo menos nome e sobrenome reais. Recusa inicial solta ("A SILVA"),
 * um nome só, número e caractere que não entra em nome de pessoa.
 */
export function isNomeCompleto(raw: string): boolean {
  const nome = normalizarNome(raw);
  if (nome.length < 5 || nome.length > 120) return false;
  if (!/^[\p{L}'’.\- ]+$/u.test(nome)) return false;

  const significativas = nome.split(" ").filter((p) => {
    const letras = p.replace(/['’.\-]/g, "");
    if (letras.length < 2) return false;
    if (PARTICULAS.has(letras)) return false;
    return true;
  });

  return significativas.length >= 2;
}
