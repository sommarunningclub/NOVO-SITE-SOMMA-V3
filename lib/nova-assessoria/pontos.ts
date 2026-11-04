/**
 * Onde e quando os alunos BORA treinam em Brasília, para a seção "Onde e
 * quando treinar" dos links de professor (sommaclub.com.br/<slug>).
 *
 * O Parque de Águas Claras depende do professor (`AGUAS_CLARAS`); os outros
 * pontos da BORA valem para todos (`PONTOS_BSB`). Passado pelo Alex em
 * 04/11/2026.
 */

export interface Horario {
  dia: string;
  horario: string;
}

export interface PontoBora {
  nome: string;
  horarios: Horario[];
}

export const AGUAS_CLARAS_NOME = "Brasília - Parque de Águas Claras";

/** Turmas de cada professor no Parque de Águas Claras, pelo slug. `null` = horário a consultar no WhatsApp dele. */
const AGUAS_CLARAS: Record<string, Horario[] | null> = {
  joseph: [
    { dia: "Terça-feira", horario: "Noite" },
    { dia: "Quinta-feira", horario: "Noite" },
  ],
  mateus: [
    { dia: "Terça-feira", horario: "Noite" },
    { dia: "Quinta-feira", horario: "Noite" },
  ],
  "gabriel-brito": [
    { dia: "Terça-feira", horario: "Manhã" },
    { dia: "Quinta-feira", horario: "Manhã" },
  ],
  alexandre: null,
};

export function aguasClarasDoProfessor(slug: string): Horario[] | null {
  return AGUAS_CLARAS[slug] ?? null;
}

export const PONTOS_BSB: PontoBora[] = [
  {
    nome: "Brasília - Noroeste",
    horarios: [
      { dia: "Terça-feira", horario: "6h30 às 8h | 18h15 às 20h15" },
      { dia: "Quinta-feira", horario: "6h30 às 8h | 18h15 às 20h15" },
    ],
  },
  {
    nome: "Brasília - Parque da Cidade",
    horarios: [
      { dia: "Terça-feira", horario: "6h às 8h30 | 18h30 às 20h30" },
      { dia: "Quinta-feira", horario: "6h às 8h30 | 18h30 às 20h30" },
      { dia: "Sábado", horario: "6h às 10h30" },
    ],
  },
];
