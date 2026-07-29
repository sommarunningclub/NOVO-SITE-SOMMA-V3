import type { Metric, DigitalRow } from "../_types/commercial";

/** SEÇÃO 4 — O Somma em números (big numbers). */
export const BIG_NUMBERS: Metric[] = [
  { count: 14200, valor: "14,2 mil", label: "seguidores no Instagram", kicker: "Comunidade digital" },
  { count: 645600, valor: "645,6 mil", label: "visualizações nos últimos 30 dias", kicker: "Alcance de conteúdo" },
  { count: 58100, valor: "58,1 mil", label: "contas alcançadas nos últimos 30 dias", kicker: "Distribuição" },
  { count: 12800, valor: "12,8 mil", label: "interações nos últimos 30 dias", kicker: "Engajamento" },
  { count: 6000, valor: "6 mil+", label: "pessoas na base própria", kicker: "First-party" },
  { valor: "200–350", label: "participantes todos os sábados", kicker: "Presença física" },
  { valor: "1.400", prefixo: "até ", label: "participações presenciais por mês", kicker: "Recorrência" },
];

export const BIG_NUMBERS_NOTA =
  "Dados digitais referentes ao período de 28 de junho a 27 de julho de 2026. As participações mensais representam participações acumuladas e não necessariamente pessoas únicas.";

/** SEÇÃO 5 — Impacto digital (tabela indicador × resultado). */
export const DIGITAL_IMPACT: DigitalRow[] = [
  { indicador: "Visualizações", resultado: "645.589" },
  { indicador: "Contas alcançadas", resultado: "58.134" },
  { indicador: "Interações", resultado: "12.882" },
  { indicador: "Seguidores", resultado: "14.209" },
  { indicador: "Crescimento da base", resultado: "3,9%" },
  { indicador: "Novos seguidores", resultado: "Aproximadamente 1.300" },
  { indicador: "Seguidores líquidos", resultado: "534" },
  { indicador: "Conteúdos publicados", resultado: "300" },
];

/** Distribuição de origem das visualizações (seguidores × não seguidores). */
export const REACH_SPLIT = [
  { origem: "Seguidores", pct: 70, descricao: "Audiência fiel e recorrente" },
  { origem: "Ainda não seguem", pct: 30, descricao: "Descoberta e novos públicos" },
];

/** SEÇÃO 6 — Formatos de conteúdo. */
export const CONTENT_FORMATS = [
  {
    formato: "Stories",
    views: 358000,
    viewsLabel: "≈ 358 mil visualizações",
    papel: "Canal de frequência, relacionamento e presença diária.",
  },
  {
    formato: "Feed",
    views: 155000,
    viewsLabel: "≈ 155 mil visualizações",
    papel:
      "Canal para posicionamento, campanhas, comunicação institucional e consolidação de mensagens.",
  },
  {
    formato: "Reels",
    views: 131000,
    viewsLabel: "≈ 131 mil visualizações",
    papel: "Canal de descoberta, distribuição e alcance de novos públicos.",
  },
];

/** SEÇÃO 7 — Base própria. */
export const BASE_DADOS = ["Nome", "Telefone", "E-mail", "Sexo", "Data de nascimento", "Endereço"];

export const BASE_POSSIBILIDADES = [
  "Segmentação",
  "Convites",
  "Pesquisas",
  "Comunicação de benefícios",
  "Campanhas",
  "Ativações",
  "Relacionamento",
  "Mensuração",
];

export const BASE_AVISO =
  "O Somma Club opera as comunicações para os parceiros. Os dados pessoais da comunidade não são entregues ou disponibilizados diretamente às empresas.";

/** SEÇÃO 8 — Presença física. */
export const PRESENCA_FISICA = {
  sabado: "200 a 350 pessoas todo sábado",
  mes: "800 a 1.400 participações presenciais por mês",
  ano: "10.400 a 18.200 participações acumuladas por ano",
  destaque:
    "A força do Somma está na combinação entre audiência digital, base própria e presença física recorrente.",
};

/** SEÇÃO 9 — Ecossistema Somma Club. */
export const ECOSSISTEMA = [
  { nome: "Instagram", grupo: "Digital" },
  { nome: "Grupos de WhatsApp", grupo: "Relacionamento" },
  { nome: "Base própria", grupo: "Dados" },
  { nome: "E-mail marketing", grupo: "Dados" },
  { nome: "Encontros semanais", grupo: "Presencial" },
  { nome: "Somma Day", grupo: "Presencial" },
  { nome: "Eventos especiais", grupo: "Presencial" },
  { nome: "Assessoria esportiva", grupo: "Presencial" },
  { nome: "Site", grupo: "Tecnologia" },
  { nome: "Área de check-in", grupo: "Tecnologia" },
  { nome: "Agenda Somma Club", grupo: "Tecnologia" },
  { nome: "Landing pages", grupo: "Tecnologia" },
  { nome: "Campanhas", grupo: "Conteúdo" },
  { nome: "Desafios", grupo: "Conteúdo" },
  { nome: "Conteúdo da comunidade", grupo: "Conteúdo" },
];

/** SEÇÃO 20 — O que o Somma entrega. */
export const SOMMA_ENTREGA = [
  "Estratégia de branding",
  "Planejamento de ativação",
  "Acesso à comunidade",
  "Experiências presenciais",
  "Alcance digital",
  "Produção de conteúdo",
  "Experimentação",
  "Relacionamento",
  "Visibilidade",
  "Tecnologia",
  "Comunicação com a base",
  "Mensuração",
  "Relatórios",
];

/** SEÇÃO 22 — Como construímos uma parceria. */
export const PROCESSO = [
  { n: "01", titulo: "Diagnóstico", texto: "Entendimento dos objetivos da marca." },
  { n: "02", titulo: "Definição da oportunidade", texto: "Escolha das propriedades, canais e experiências." },
  { n: "03", titulo: "Planejamento", texto: "Construção do calendário e escopo." },
  { n: "04", titulo: "Execução", texto: "Realização das ações contratadas." },
  { n: "05", titulo: "Mensuração", texto: "Levantamento dos indicadores disponíveis." },
  { n: "06", titulo: "Evolução", texto: "Identificação de aprendizados e novas oportunidades." },
];
