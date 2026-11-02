/**
 * Sexo é obrigatório em todo check-in feito pelo site (decisão do Alex,
 * 02/11/2026): nenhuma linha nova em `checkins` entra sem ele. Os valores são
 * os mesmos de `cadastro_site.sexo` e do formulário do /check-in.
 */
export const SEXOS = ["masculino", "feminino"] as const;
export type Sexo = (typeof SEXOS)[number];

/** Devolve o valor canônico, ou null se não veio um dos dois aceitos. */
export function sexoValido(valor: unknown): Sexo | null {
  const v = String(valor ?? "").trim().toLowerCase();
  return (SEXOS as readonly string[]).includes(v) ? (v as Sexo) : null;
}

export const SEXO_OBRIGATORIO_MSG = "Informe o sexo (masculino ou feminino).";
