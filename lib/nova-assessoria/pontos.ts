/**
 * Onde e quando os alunos BORA treinam em Brasília, para a seção "Onde e
 * quando treinar" dos links de professor (sommaclub.com.br/<slug>).
 *
 * A BORA treina só no Noroeste e no Parque da Cidade, e os horários valem
 * para todos os professores.
 */

export interface Horario {
  dia: string;
  horario: string;
}

export interface PontoBora {
  nome: string;
  horarios: Horario[];
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
