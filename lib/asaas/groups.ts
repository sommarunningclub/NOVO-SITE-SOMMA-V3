// Vínculo nome do professor → nome EXATO do grupo de clientes no Asaas.
// Chave: nome normalizado (lowercase, sem acento, espaços colapsados).
// Valor: nome canônico do grupo, idêntico ao cadastrado no painel do Asaas.
// Salvaguarda contra duplicação de grupo por divergência de grafia.
const GROUP_MAP: Record<string, string> = {
  // Nomes completos (checkout)
  "mateus fonseca": "Mateus Fonseca",
  "matheus fonseca": "Mateus Fonseca", // tolera grafia antiga com "h"
  "alexandre alves": "Alexandre Alves",
  "joseph pereira": "Joseph Pereira",
  // Apelidos usados na planilha de gestão
  "matheus": "Mateus Fonseca",
  "mateus": "Mateus Fonseca",
  "alexandre": "Alexandre Alves",
  "jojo": "Joseph Pereira", // "JôJô" → normalizado para "jojo"
  "joseph": "Joseph Pereira",
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Resolve o nome canônico do grupo de clientes no Asaas a partir do nome do
 * professor selecionado. Retorna `null` quando o professor não é reconhecido
 * — nunca inventa um grupo novo, evitando duplicações no painel.
 */
export function resolveGroupName(professorNome?: string | null): string | null {
  if (!professorNome) return null
  const key = normalize(professorNome)
  if (!key) return null
  return GROUP_MAP[key] ?? null
}
