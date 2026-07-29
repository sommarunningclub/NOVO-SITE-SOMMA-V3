import type { Chapter } from "../_types/commercial";

/**
 * Capítulos da navegação. Cada um aponta para o id da âncora (primeira seção
 * do capítulo). A ordem define a barra de progresso e a navegação por teclado.
 */
export const CHAPTERS: Chapter[] = [
  { id: "visao-geral", label: "Visão geral", anchor: "capa" },
  { id: "comunidade", label: "Comunidade", anchor: "numeros" },
  { id: "alcance", label: "Alcance", anchor: "impacto-digital" },
  { id: "ecossistema", label: "Ecossistema", anchor: "ecossistema" },
  { id: "ativacoes", label: "Ativações", anchor: "ativacoes" },
  { id: "midia", label: "Mídia", anchor: "midia-instagram" },
  { id: "patrocinios", label: "Patrocínios", anchor: "patrocinios" },
  { id: "investimentos", label: "Investimentos", anchor: "investimentos" },
  { id: "contato", label: "Contato", anchor: "contato" },
];

/** Posicionamento comercial · três pilares (SEÇÃO 3). */
export const PILARES = [
  {
    titulo: "Branding",
    texto: "Construção de marca, presença e lembrança dentro do universo wellness.",
  },
  {
    titulo: "Experiência",
    texto: "Experimentação, ativações e pontos de contato reais com a comunidade.",
  },
  {
    titulo: "Comunidade",
    texto: "Relacionamento recorrente com um público engajado por corrida, saúde e lifestyle.",
  },
];

export const POSICIONAMENTO_OBS =
  "O desempenho comercial de uma campanha também depende da oferta, produto, preço, atendimento, posicionamento e capacidade de conversão da empresa parceira.";

/** Objetivos e faixas do formulário (SEÇÃO 23). */
export const FORM_OBJETIVOS = [
  "Branding",
  "Lançamento",
  "Experimentação",
  "Relacionamento",
  "Presença presencial",
  "Alcance digital",
  "Patrocínio",
  "Exclusividade",
];

export const FORM_FAIXAS = [
  "Até R$ 5.000",
  "De R$ 5.000 a R$ 10.000",
  "De R$ 10.000 a R$ 20.000",
  "De R$ 20.000 a R$ 50.000",
  "Acima de R$ 50.000",
  "Ainda não definido",
];
