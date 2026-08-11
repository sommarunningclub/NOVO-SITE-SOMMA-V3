// Fonte única das vagas de /trabalhe-conosco-vagas.
//
// Para publicar uma vaga nova: adicione um objeto ao array com `ativa: true`.
// Para encerrar: troque para `ativa: false` — a vaga some da página, mas as
// candidaturas já recebidas continuam em `candidatos_vagas` pelo `slug`.
//
// O `slug` é gravado no banco: não renomeie o de uma vaga que já recebeu
// candidaturas, senão o histórico se separa em dois grupos.

export type Vaga = {
  slug: string;
  titulo: string;
  area: string;
  tipo: string;
  modelo: string;
  local: string;
  jornada: string;
  remuneracao: string;
  resumo: string;
  sobre: string;
  atividades: string[];
  requisitos: string[];
  diferenciais: string[];
  beneficios: string[];
  /** ISO (AAAA-MM-DD) — alimenta o JSON-LD de JobPosting. */
  publicadaEm: string;
  ativa: boolean;
};

export const VAGAS: Vaga[] = [
  {
    slug: "estagio-educacao-fisica",
    titulo: "Estagiário(a) de Educação Física",
    area: "Assessoria Somma",
    tipo: "Estágio",
    modelo: "Híbrido",
    local: "Brasília, DF",
    jornada: "Híbrido, com presença nos treinos",
    remuneracao: "Bolsa a combinar + benefícios",
    resumo:
      "Se você cursa Educação Física, gosta de corrida e quer aprender de verdade como se constrói um corredor, esta vaga é o seu laboratório.",
    sobre:
      "O Somma Club é o maior running club do Distrito Federal, e a Assessoria Somma é onde a corrida vira método: planilha, avaliação, acompanhamento e gente cuidando de gente. Você não vai ficar assistindo. Vai estar na pista, ao lado dos professores, entendendo por que cada treino existe.",
    atividades: [
      "Apoiar os professores na condução dos treinos presenciais: aquecimento, organização das séries e acompanhamento dos alunos.",
      "Ajudar a montar e ajustar planilhas de treino sob supervisão.",
      "Registrar presença, pace e evolução dos alunos nas ferramentas do clube.",
      "Acompanhar avaliações físicas e testes de performance.",
      "Dar suporte na operação de provas, shakeouts e eventos do Somma.",
      "Participar das reuniões técnicas e das trilhas de estudo do time.",
    ],
    requisitos: [
      "Cursando Educação Física (bacharelado).",
      "Disponibilidade para os treinos presenciais em Brasília, incluindo manhãs e fins de semana.",
      "Gostar de corrida. De preferência, correr.",
      "Boa comunicação e vontade genuína de cuidar de gente.",
      "Organização para registrar dados e responder rápido.",
    ],
    diferenciais: [
      "Já ter corrido provas de rua (5K, 10K, meia maratona).",
      "Noções de fisiologia do exercício e periodização de treino.",
      "Familiaridade com Strava, Garmin Connect ou plataformas similares.",
      "Experiência anterior com grupos de corrida, monitoria ou projetos de extensão.",
    ],
    beneficios: [
      "Bolsa-auxílio (valor a combinar na entrevista).",
      "Assessoria Somma gratuita durante todo o estágio.",
      "Kit de uniforme do clube.",
      "Mentoria direta com os professores do maior running club do DF.",
      "Certificado de estágio e carta de recomendação ao final.",
      "Uma comunidade inteira torcendo pela sua evolução.",
    ],
    publicadaEm: "2026-08-10",
    ativa: true,
  },
];

export const VAGAS_ATIVAS = VAGAS.filter((v) => v.ativa);

export function getVagaBySlug(slug: string): Vaga | undefined {
  return VAGAS.find((v) => v.slug === slug);
}
