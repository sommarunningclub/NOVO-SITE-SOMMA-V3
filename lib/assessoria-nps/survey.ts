/**
 * Questionário do NPS da Assessoria Somma: a fonte única.
 *
 * Pergunta, alternativa, ordem, obrigatoriedade e condição de exibição moram
 * aqui e em mais nenhum lugar. A tela, a validação do navegador e a validação
 * do servidor leem este arquivo, então não há como uma divergir da outra.
 *
 * O `id` de cada pergunta é o nome da coluna em `nps_assessoria_responses`, e
 * o `value` de cada alternativa é o valor gravado (os CHECKs da migration
 * listam os mesmos valores).
 *
 * Mudou texto que altera o sentido, alternativa ou ordem de escala? Suba o
 * `SURVEY_VERSION` e crie uma campanha nova. Respostas de versões diferentes
 * não devem ser somadas como se fossem a mesma pergunta.
 *
 * Módulo puro: roda no cliente e no servidor.
 */

export const SURVEY_VERSION = "assessoria_nps_v1";

// ─── Valores gravados ───────────────────────────────────────────────────────
export const NEEDS_FEEDBACK = ["yes", "no", "sometimes"] as const;
export const MESSAGE_VOLUME = ["very_low", "low", "adequate", "high", "very_high"] as const;
export const WHATSAPP_CONTENT = [
  "training_guidance",
  "coach_content",
  "running_tips",
  "race_info",
  "announcements",
  "student_results",
  "member_interaction",
  "benefits_partners",
  "other",
] as const;
export const SUNDAY_FREQUENCY = [
  "never",
  "rarely",
  "sometimes_monthly",
  "almost_every_sunday",
  "every_sunday",
] as const;
export const WEEKDAY_INTEREST = ["yes", "maybe", "no"] as const;
export const WEEKDAY_COMBINATION = ["mon_wed", "tue_thu", "no_preference", "other"] as const;
export const PREFERRED_PERIOD = ["morning", "afternoon", "evening", "multiple"] as const;
export const PERIODS = ["morning", "afternoon", "evening"] as const;
export const MORNING_TIME = ["before_6", "6_to_7", "7_to_8", "after_8"] as const;
export const EVENING_TIME = ["17_to_18", "18_to_19", "19_to_20", "after_20"] as const;
export const WEEKLY_FREQUENCY = ["once", "twice", "three_plus", "depends_on_schedule"] as const;

export type Period = (typeof PERIODS)[number];

/** Uma resposta completa, com as chaves exatamente iguais às colunas. */
export interface Answers {
  nps_score: number | null;
  nps_reason: string | null;
  overall_quality: number | null;
  expectation_delivery: number | null;

  teacher_followup: number | null;
  teacher_understands_goals: number | null;
  teacher_whatsapp_access: number | null;
  teacher_support_quality: number | null;
  teacher_communication_quality: number | null;

  training_quality: number | null;
  training_level_fit: number | null;
  training_goal_alignment: number | null;
  perceived_progress: number | null;
  needs_more_feedback: (typeof NEEDS_FEEDBACK)[number] | null;

  whatsapp_group_quality: number | null;
  whatsapp_connection: number | null;
  whatsapp_message_volume: (typeof MESSAGE_VOLUME)[number] | null;
  whatsapp_information_clarity: number | null;
  whatsapp_content_preferences: (typeof WHATSAPP_CONTENT)[number][] | null;
  whatsapp_content_other: string | null;

  community_climate: number | null;
  community_belonging: number | null;
  community_interaction: number | null;
  community_one_word: string | null;

  sunday_frequency: (typeof SUNDAY_FREQUENCY)[number] | null;
  sunday_support_quality: number | null;
  sunday_value: number | null;
  sunday_improvements: string | null;

  weekday_training_interest: (typeof WEEKDAY_INTEREST)[number] | null;
  preferred_weekday_combination: (typeof WEEKDAY_COMBINATION)[number] | null;
  preferred_weekday_other: string | null;
  preferred_period: (typeof PREFERRED_PERIOD)[number] | null;
  available_periods: Period[] | null;
  preferred_morning_time: (typeof MORNING_TIME)[number] | null;
  preferred_evening_time: (typeof EVENING_TIME)[number] | null;
  expected_weekly_frequency: (typeof WEEKLY_FREQUENCY)[number] | null;

  physical_structure_quality: number | null;
  physical_structure_improvements: string | null;

  cost_benefit: number | null;
  renewal_probability: number | null;

  what_is_excellent: string | null;
  what_needs_improvement: string | null;
  one_change: string | null;
}

export type AnswerKey = keyof Answers;
export type Draft = Partial<Answers>;

// ─── Seções ─────────────────────────────────────────────────────────────────
export type SectionId =
  | "identificacao"
  | "geral"
  | "professor"
  | "treinos"
  | "whatsapp"
  | "comunidade"
  | "domingos"
  | "semana"
  | "estrutura"
  | "final";

export interface Section {
  id: SectionId;
  title: string;
}

export const SECTIONS: readonly Section[] = [
  { id: "identificacao", title: "Identificação" },
  { id: "geral", title: "Experiência geral" },
  { id: "professor", title: "Seu professor" },
  { id: "treinos", title: "Seus treinos" },
  { id: "whatsapp", title: "WhatsApp" },
  { id: "comunidade", title: "Comunidade" },
  { id: "domingos", title: "Domingos" },
  { id: "semana", title: "Treinos na semana" },
  { id: "estrutura", title: "Estrutura" },
  { id: "final", title: "Avaliação final" },
];

// ─── Tipos de pergunta ──────────────────────────────────────────────────────
export interface Option<V extends string = string> {
  value: V;
  label: string;
}

interface QuestionBase {
  id: AnswerKey;
  section: Exclude<SectionId, "identificacao">;
  title: string;
  helper?: string;
  /** Obrigatória QUANDO exibida. Pergunta escondida nunca é obrigatória. */
  required: boolean;
  /** Ausente = sempre exibida. */
  showWhen?: (a: Draft) => boolean;
}

/** Escala 0 a 10 (NPS e chance de renovação). */
export interface ScaleQuestion extends QuestionBase {
  kind: "scale";
  minLabel: string;
  maxLabel: string;
}

/** Escala 1 a 5 com rótulo por ponto. */
export interface RatingQuestion extends QuestionBase {
  kind: "rating";
  labels: readonly [string, string, string, string, string];
}

/** Campo extra que aparece dentro da pergunta quando uma alternativa é marcada. */
export type FollowUp =
  | {
      kind: "text";
      when: string;
      field: "whatsapp_content_other" | "preferred_weekday_other";
      label: string;
      placeholder: string;
      maxLength: number;
    }
  | {
      kind: "multi";
      when: string;
      field: "available_periods";
      label: string;
      options: readonly Option<Period>[];
      min: number;
    };

export interface SingleQuestion extends QuestionBase {
  kind: "single";
  options: readonly Option[];
  followUp?: FollowUp;
}

export interface MultiQuestion extends QuestionBase {
  kind: "multi";
  options: readonly Option[];
  min: number;
  followUp?: FollowUp;
}

export interface TextQuestion extends QuestionBase {
  kind: "text";
  variant: "short" | "long";
  maxLength: number;
  placeholder: string | ((a: Draft) => string);
  /** Opcional, mas a tela pede uma segunda vez antes de deixar pular. */
  encourage?: string;
}

export type Question = ScaleQuestion | RatingQuestion | SingleQuestion | MultiQuestion | TextQuestion;

// ─── Condições ──────────────────────────────────────────────────────────────
// Enquanto a pergunta que decide não foi respondida, o que depende dela conta
// como visível. Assim o total de etapas começa em 10 e só DIMINUI quando a
// pessoa responde "Nunca" ou "Não" (soa como atalho), em vez de crescer no meio
// da pesquisa. Não afeta validação nem gravação: a pergunta que decide vem
// antes na ordem e é obrigatória.
export const frequentaDomingo = (a: Draft) => a.sunday_frequency !== "never";

export const temInteresseNaSemana = (a: Draft) => a.weekday_training_interest !== "no";

/**
 * Períodos de fato. "Manhã" vira ["morning"]; "mais de um período" vira os
 * que a pessoa marcou. É o que decide quais horários perguntar e o que vai
 * para `available_periods`.
 */
export function periodosEfetivos(a: Draft): Period[] {
  if (!temInteresseNaSemana(a)) return [];
  const p = a.preferred_period;
  if (p === "morning" || p === "afternoon" || p === "evening") return [p];
  if (p === "multiple") {
    const marcados = new Set(a.available_periods ?? []);
    return PERIODS.filter((x) => marcados.has(x));
  }
  return [];
}

// ─── Rótulos reaproveitados ─────────────────────────────────────────────────
const QUALIDADE_A = ["Muito ruim", "Ruim", "Regular", "Boa", "Excelente"] as const;
const QUALIDADE_O = ["Muito ruim", "Ruim", "Regular", "Bom", "Excelente"] as const;
const FREQUENCIA = ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"] as const;
const INTENSIDADE = ["Nada", "Pouco", "Razoavelmente", "Bastante", "Muito"] as const;

// ─── As perguntas, na ordem em que aparecem ─────────────────────────────────
export const QUESTIONS: readonly Question[] = [
  // Experiência geral
  {
    id: "nps_score",
    section: "geral",
    kind: "scale",
    title: "De 0 a 10, o quanto você recomendaria a Assessoria Somma Club para um amigo?",
    minLabel: "Nada provável",
    maxLabel: "Muito provável",
    required: true,
  },
  {
    id: "nps_reason",
    section: "geral",
    kind: "text",
    variant: "long",
    title: "Qual é o principal motivo para a sua nota?",
    maxLength: 2000,
    required: false,
    placeholder: (a) => {
      const n = a.nps_score;
      if (n == null) return "Conte com suas palavras.";
      if (n >= 9) return "O que você mais valoriza hoje?";
      if (n >= 7) return "O que faltou para a nota ser 10?";
      return "O que precisa mudar para essa nota subir?";
    },
    encourage: "Uma frase já ajuda muito a entender a sua nota.",
  },
  {
    id: "overall_quality",
    section: "geral",
    kind: "rating",
    title: "Como você avalia a qualidade geral da Assessoria Somma Club?",
    labels: QUALIDADE_A,
    required: true,
  },
  {
    id: "expectation_delivery",
    section: "geral",
    kind: "rating",
    title: "Hoje, você sente que a assessoria entrega o que você esperava quando entrou?",
    labels: [
      "Muito abaixo do esperado",
      "Abaixo do esperado",
      "Dentro do esperado",
      "Acima do esperado",
      "Muito acima do esperado",
    ],
    required: true,
  },

  // Seu professor
  {
    id: "teacher_followup",
    section: "professor",
    kind: "rating",
    title: "Você sente que seu professor acompanha sua rotina de treinos com frequência?",
    labels: FREQUENCIA,
    required: true,
  },
  {
    id: "teacher_understands_goals",
    section: "professor",
    kind: "rating",
    title: "Você sente que seu professor conhece seus objetivos e acompanha sua evolução?",
    labels: ["Nada", "Pouco", "Razoavelmente", "Bem", "Muito bem"],
    required: true,
  },
  {
    id: "teacher_whatsapp_access",
    section: "professor",
    kind: "rating",
    title: "Você tem facilidade para conversar individualmente com seu professor pelo WhatsApp quando precisa?",
    labels: ["Muito difícil", "Difícil", "Razoável", "Fácil", "Muito fácil"],
    required: true,
  },
  {
    id: "teacher_support_quality",
    section: "professor",
    kind: "rating",
    title: "Quando você chama seu professor no privado, sente que recebe atenção e suporte adequados?",
    labels: FREQUENCIA,
    required: true,
  },
  {
    id: "teacher_communication_quality",
    section: "professor",
    kind: "rating",
    title: "Como você avalia a qualidade da comunicação com seu professor?",
    labels: QUALIDADE_A,
    required: true,
  },

  // Seus treinos
  {
    id: "training_quality",
    section: "treinos",
    kind: "rating",
    title: "Como você avalia a qualidade dos seus treinos?",
    labels: QUALIDADE_A,
    required: true,
  },
  {
    id: "training_level_fit",
    section: "treinos",
    kind: "rating",
    title: "Você considera que os treinos são adequados ao seu nível atual?",
    labels: [
      "Nada adequados",
      "Pouco adequados",
      "Razoavelmente adequados",
      "Bem adequados",
      "Totalmente adequados",
    ],
    required: true,
  },
  {
    id: "training_goal_alignment",
    section: "treinos",
    kind: "rating",
    title: "Você considera que os treinos estão alinhados aos seus objetivos pessoais?",
    labels: [
      "Nada alinhados",
      "Pouco alinhados",
      "Razoavelmente alinhados",
      "Bem alinhados",
      "Totalmente alinhados",
    ],
    required: true,
  },
  {
    id: "perceived_progress",
    section: "treinos",
    kind: "rating",
    title: "Você percebe evolução desde que começou a treinar com a Assessoria Somma?",
    labels: ["Nenhuma evolução", "Pouca evolução", "Evolução moderada", "Boa evolução", "Muita evolução"],
    required: true,
  },
  {
    id: "needs_more_feedback",
    section: "treinos",
    kind: "single",
    title: "Você sente necessidade de mais feedback do professor sobre sua evolução?",
    options: [
      { value: "yes", label: "Sim" },
      { value: "no", label: "Não" },
      { value: "sometimes", label: "Às vezes" },
    ],
    required: true,
  },

  // WhatsApp
  {
    id: "whatsapp_group_quality",
    section: "whatsapp",
    kind: "rating",
    title: "Como você avalia os grupos de WhatsApp da Assessoria Somma?",
    labels: ["Muito ruins", "Ruins", "Regulares", "Bons", "Excelentes"],
    required: true,
  },
  {
    id: "whatsapp_connection",
    section: "whatsapp",
    kind: "rating",
    title: "O grupo ajuda você a se sentir mais conectado com outros membros da assessoria?",
    labels: INTENSIDADE,
    required: true,
  },
  {
    id: "whatsapp_message_volume",
    section: "whatsapp",
    kind: "single",
    title: "Como você considera o volume de mensagens nos grupos?",
    options: [
      { value: "very_low", label: "Muito baixo" },
      { value: "low", label: "Baixo" },
      { value: "adequate", label: "Adequado" },
      { value: "high", label: "Alto" },
      { value: "very_high", label: "Muito alto" },
    ],
    required: true,
  },
  {
    id: "whatsapp_information_clarity",
    section: "whatsapp",
    kind: "rating",
    title: "Você considera que as informações importantes ficam claras e fáceis de encontrar no grupo?",
    labels: FREQUENCIA,
    required: true,
  },
  {
    id: "whatsapp_content_preferences",
    section: "whatsapp",
    kind: "multi",
    title: "O que você gostaria de receber mais nos grupos?",
    helper: "Marque quantas quiser.",
    options: [
      { value: "training_guidance", label: "Orientações sobre os treinos" },
      { value: "coach_content", label: "Conteúdo dos professores" },
      { value: "running_tips", label: "Dicas de corrida" },
      { value: "race_info", label: "Informações sobre provas" },
      { value: "announcements", label: "Avisos da assessoria" },
      { value: "student_results", label: "Resultados e evolução dos alunos" },
      { value: "member_interaction", label: "Interação entre os membros" },
      { value: "benefits_partners", label: "Benefícios e parceiros" },
      { value: "other", label: "Outro" },
    ],
    min: 1,
    required: true,
    followUp: {
      kind: "text",
      when: "other",
      field: "whatsapp_content_other",
      label: "O que mais?",
      placeholder: "Conte o que você gostaria de receber",
      maxLength: 200,
    },
  },

  // Comunidade
  {
    id: "community_climate",
    section: "comunidade",
    kind: "rating",
    title: "Como você avalia o clima entre os membros da Assessoria Somma?",
    labels: QUALIDADE_O,
    required: true,
  },
  {
    id: "community_belonging",
    section: "comunidade",
    kind: "rating",
    title: "Você se sente parte da comunidade Somma?",
    labels: INTENSIDADE,
    required: true,
  },
  {
    id: "community_interaction",
    section: "comunidade",
    kind: "rating",
    title: "Você sente que existe abertura para conversar, interagir e conhecer outros membros?",
    labels: INTENSIDADE,
    required: true,
  },
  {
    id: "community_one_word",
    section: "comunidade",
    kind: "text",
    variant: "short",
    title: "Se você tivesse que definir o clima da Assessoria Somma em uma palavra, qual seria?",
    maxLength: 40,
    placeholder: "Uma palavra",
    required: false,
  },

  // Domingos: a frequência vem antes, porque decide se as avaliações aparecem.
  {
    id: "sunday_frequency",
    section: "domingos",
    kind: "single",
    title: "Com que frequência você participa dos encontros presenciais de domingo?",
    options: [
      { value: "never", label: "Nunca" },
      { value: "rarely", label: "Raramente" },
      { value: "sometimes_monthly", label: "Algumas vezes por mês" },
      { value: "almost_every_sunday", label: "Quase todos os domingos" },
      { value: "every_sunday", label: "Todos os domingos" },
    ],
    required: true,
  },
  {
    id: "sunday_support_quality",
    section: "domingos",
    kind: "rating",
    title: "Como você avalia o suporte presencial oferecido pela assessoria aos domingos?",
    labels: QUALIDADE_O,
    required: true,
    showWhen: frequentaDomingo,
  },
  {
    id: "sunday_value",
    section: "domingos",
    kind: "rating",
    title: "O encontro presencial de domingo agrega valor à sua experiência na Assessoria Somma?",
    labels: INTENSIDADE,
    required: true,
    showWhen: frequentaDomingo,
  },
  {
    id: "sunday_improvements",
    section: "domingos",
    kind: "text",
    variant: "long",
    title: "O que poderia melhorar nos encontros presenciais de domingo?",
    maxLength: 2000,
    placeholder: "Horário, local, dinâmica, suporte…",
    required: false,
    showWhen: frequentaDomingo,
  },

  // Treinos na semana
  {
    id: "weekday_training_interest",
    section: "semana",
    kind: "single",
    title:
      "Se a Assessoria Somma passasse a oferecer treinos presenciais durante a semana, você teria interesse em participar?",
    options: [
      { value: "yes", label: "Sim" },
      { value: "maybe", label: "Talvez" },
      { value: "no", label: "Não" },
    ],
    required: true,
  },
  {
    id: "preferred_weekday_combination",
    section: "semana",
    kind: "single",
    title: "Qual combinação de dias seria melhor para você?",
    options: [
      { value: "mon_wed", label: "Segunda e quarta" },
      { value: "tue_thu", label: "Terça e quinta" },
      { value: "no_preference", label: "Não tenho preferência" },
      { value: "other", label: "Outro" },
    ],
    required: true,
    showWhen: temInteresseNaSemana,
    followUp: {
      kind: "text",
      when: "other",
      field: "preferred_weekday_other",
      label: "Quais dias?",
      placeholder: "Ex.: quarta e sexta",
      maxLength: 200,
    },
  },
  {
    id: "preferred_period",
    section: "semana",
    kind: "single",
    title: "Em qual período você teria maior disponibilidade para participar?",
    options: [
      { value: "morning", label: "Manhã" },
      { value: "afternoon", label: "Tarde" },
      { value: "evening", label: "Noite" },
      { value: "multiple", label: "Tenho disponibilidade em mais de um período" },
    ],
    required: true,
    showWhen: temInteresseNaSemana,
    followUp: {
      kind: "multi",
      when: "multiple",
      field: "available_periods",
      label: "Quais períodos?",
      options: [
        { value: "morning", label: "Manhã" },
        { value: "afternoon", label: "Tarde" },
        { value: "evening", label: "Noite" },
      ],
      min: 2,
    },
  },
  {
    id: "preferred_morning_time",
    section: "semana",
    kind: "single",
    title: "Caso os treinos fossem pela manhã, qual horário seria melhor?",
    options: [
      { value: "before_6", label: "Antes das 6h" },
      { value: "6_to_7", label: "Entre 6h e 7h" },
      { value: "7_to_8", label: "Entre 7h e 8h" },
      { value: "after_8", label: "Depois das 8h" },
    ],
    required: true,
    showWhen: (a) => periodosEfetivos(a).includes("morning"),
  },
  {
    id: "preferred_evening_time",
    section: "semana",
    kind: "single",
    title: "Caso os treinos fossem à noite, qual horário seria melhor?",
    options: [
      { value: "17_to_18", label: "Entre 17h e 18h" },
      { value: "18_to_19", label: "Entre 18h e 19h" },
      { value: "19_to_20", label: "Entre 19h e 20h" },
      { value: "after_20", label: "Depois das 20h" },
    ],
    required: true,
    showWhen: (a) => periodosEfetivos(a).includes("evening"),
  },
  {
    id: "expected_weekly_frequency",
    section: "semana",
    kind: "single",
    title: "Quantas vezes por semana você provavelmente participaria de um treino presencial?",
    options: [
      { value: "once", label: "1 vez" },
      { value: "twice", label: "2 vezes" },
      { value: "three_plus", label: "3 vezes ou mais" },
      { value: "depends_on_schedule", label: "Dependeria dos horários" },
    ],
    required: true,
    showWhen: temInteresseNaSemana,
  },

  // Estrutura: só para quem conhece o presencial.
  {
    id: "physical_structure_quality",
    section: "estrutura",
    kind: "rating",
    title: "Como você avalia a estrutura oferecida pela Somma nos encontros presenciais?",
    labels: QUALIDADE_A,
    required: true,
    showWhen: frequentaDomingo,
  },
  {
    id: "physical_structure_improvements",
    section: "estrutura",
    kind: "text",
    variant: "long",
    title: "O que você acredita que poderia melhorar na estrutura ou na experiência presencial?",
    maxLength: 2000,
    placeholder: "Tenda, hidratação, guarda-volumes, sinalização…",
    required: false,
    showWhen: frequentaDomingo,
  },

  // Avaliação final
  {
    id: "cost_benefit",
    section: "final",
    kind: "rating",
    title: "Considerando tudo que recebe atualmente, como você avalia o custo benefício da Assessoria Somma?",
    labels: QUALIDADE_O,
    required: true,
  },
  {
    id: "renewal_probability",
    section: "final",
    kind: "scale",
    title: "Se sua assinatura terminasse hoje, qual seria a chance de você renovar?",
    minLabel: "Nenhuma chance",
    maxLabel: "Com certeza",
    required: true,
  },
  {
    id: "what_is_excellent",
    section: "final",
    kind: "text",
    variant: "long",
    title: "O que a Assessoria Somma faz hoje que você considera excelente e não deveria mudar?",
    maxLength: 2000,
    placeholder: "Conte com suas palavras.",
    required: false,
  },
  {
    id: "what_needs_improvement",
    section: "final",
    kind: "text",
    variant: "long",
    title: "O que mais precisa melhorar na Assessoria Somma hoje?",
    maxLength: 2000,
    placeholder: "Seja direto, é assim que a gente melhora.",
    required: false,
  },
  {
    id: "one_change",
    section: "final",
    kind: "text",
    variant: "long",
    title: "Se você pudesse mudar ou criar uma única coisa dentro da Assessoria Somma, o que seria?",
    maxLength: 2000,
    placeholder: "Uma ideia, um pedido, um sonho.",
    required: false,
  },
];

export const QUESTION_BY_ID: ReadonlyMap<AnswerKey, Question> = new Map(
  QUESTIONS.map((q) => [q.id, q])
);
