/**
 * Maratona do Rio 2027: as distâncias que a galera da assessoria pode escolher
 * em /assessoria/maratona-rio-2027.
 *
 * O `id` é o que vai para o banco (`maratona_rio_2027_intencoes.prova`, com
 * CHECK). Distância nova exige entrada aqui e uma migration trocando o CHECK.
 */
export interface ProvaRio {
  id: "5k" | "10k" | "21k" | "42k" | "desafio_63k";
  nome: string;
  distancia: string;
  detalhe?: string;
}

export const PROVAS_RIO: ProvaRio[] = [
  { id: "5k", nome: "5 km", distancia: "5 km" },
  { id: "10k", nome: "10 km", distancia: "10 km" },
  { id: "21k", nome: "Meia Maratona", distancia: "21 km" },
  { id: "42k", nome: "Maratona", distancia: "42 km" },
  {
    id: "desafio_63k",
    nome: "Desafio Cidade Maravilhosa",
    distancia: "63 km",
    detalhe: "21 km no sábado + 42 km no domingo",
  },
];

export function provaValida(id: unknown): id is ProvaRio["id"] {
  return PROVAS_RIO.some((p) => p.id === id);
}

export const SEXOS = [
  { id: "feminino", nome: "Feminino" },
  { id: "masculino", nome: "Masculino" },
] as const;

export type Sexo = (typeof SEXOS)[number]["id"];

export function sexoValido(id: unknown): id is Sexo {
  return SEXOS.some((s) => s.id === id);
}
