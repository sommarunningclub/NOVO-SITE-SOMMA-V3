/**
 * Apresentação de cada professor nos links dedicados.
 *
 * Só quem está aqui ganha a bio no topo do link; quem não está continua com o
 * checkout direto, como antes. É assim que a bio entra professor a professor,
 * sem depender de mexer no banco e sem quebrar os links já em circulação.
 *
 * A chave é o nome exato em `professores_curriculo_assessoria`.
 */
export interface Numero {
  /** Só o número, para o contador animar até ele. */
  valor: number
  /** O que vem grudado no número ("km", "x"). */
  sufixo?: string
  label: string
}

export interface Bio {
  /** Como o professor é chamado no meio do texto e nos botões. */
  primeiroNome: string
  /** Uma linha, a primeira coisa que o cliente lê. */
  chamada: string
  /** Etiquetas curtas embaixo do nome. */
  tags: string[]
  /** Os números que contam a história dele, em destaque. */
  numeros: Numero[]
  /** Texto corrido, um parágrafo por item. */
  paragrafos: string[]
}

export const BIOS: Record<string, Bio> = {
  "Mateus Fonseca": {
    primeiroNome: "Mateus",
    chamada: "Triatleta amador e ultramaratonista. Corre longe e sabe o caminho até lá.",
    tags: ["Triatleta amador", "Ultramaratonista", "Longa distância"],
    numeros: [
      { valor: 6, label: "maratonas" },
      { valor: 3, label: "Ironman 70.3" },
      { valor: 52, sufixo: " km", label: "de ultramaratona" },
    ],
    paragrafos: [
      "Triatleta amador e ultramaratonista, possui experiência em provas de longa distância, incluindo 6 maratonas, 3 provas de Ironman 70.3 e uma ultramaratona de 52 km.",
      "Trabalho buscando integrar ciência, treinamento e experiência prática para desenvolver performance de forma consistente e sustentável, com atenção à progressão, individualidade e prevenção de lesões.",
    ],
  },
}

export function bioDoProfessor(nome: string): Bio | null {
  return BIOS[nome] ?? null
}
