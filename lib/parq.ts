// Par-Q (Physical Activity Readiness Questionnaire) — anamnese pós-compra.
// Cada pergunta vira uma coluna boolean em "gestao-clientes-assessoria".

export type ParqQuestion = { id: string; label: string };

export const PARQ_QUESTIONS: ParqQuestion[] = [
  {
    id: "parq_cardio_pressao_supervisao",
    label:
      "Ao realizar atividades físicas, algum médico já diagnosticou algum problema de coração ou pressão arterial, recomendando que você só as realize sob supervisão profissional de saúde?",
  },
  {
    id: "parq_dor_peito_atividade",
    label: "Você sente dores no peito ao praticar atividade física?",
  },
  {
    id: "parq_dor_peito_ultimo_mes",
    label: "No último mês, você sentiu dores no peito ao praticar atividade física?",
  },
  {
    id: "parq_desequilibrio_tontura",
    label:
      "Você apresenta algum desequilíbrio devido à tontura e/ou perda momentânea da consciência?",
  },
  {
    id: "parq_problema_osseo_articular",
    label:
      "Você possui algum problema ósseo ou articular que pode ser afetado ou agravado pela atividade física?",
  },
  {
    id: "parq_medicacao_continua",
    label: "Você toma atualmente algum tipo de medicação de uso contínuo?",
  },
  {
    id: "parq_tratamento_pressao_cardiaco",
    label:
      "Você realiza algum tipo de tratamento médico para pressão arterial ou problemas cardíacos?",
  },
  {
    id: "parq_tratamento_continuo_afeta",
    label:
      "Você realiza algum tratamento médico contínuo que possa ser afetado ou prejudicado pela atividade física?",
  },
  {
    id: "parq_cirurgia_compromete",
    label:
      "Você já se submeteu a algum tipo de cirurgia que possa comprometer sua atividade física?",
  },
  {
    id: "parq_outra_razao_saude",
    label:
      "Você sabe de alguma outra razão pela qual a atividade física possa eventualmente comprometer sua saúde?",
  },
];

export const PARQ_IDS = PARQ_QUESTIONS.map((q) => q.id);

// "Apto" = nenhuma resposta "Sim" (todas false). Qualquer "Sim" recomenda liberação médica.
export function computeApto(answers: Record<string, boolean>): boolean {
  return PARQ_IDS.every((id) => answers[id] === false);
}
