/** SEÇÃO 15 — Patrocínios recorrentes (tabela detalhada com totais). */
export interface SponsorshipPlan {
  id: string;
  nome: string;
  duracao: string;
  mensal: string;
  total: string;
  objetivo: string;
  entregas: string[];
  destaque?: boolean;
}

export const SPONSORSHIP_PLANS: SponsorshipPlan[] = [
  {
    id: "patrocinio-3-meses",
    nome: "Patrocínio por três meses",
    duracao: "Três meses",
    mensal: "A partir de R$ 12.000 / mês",
    total: "A partir de R$ 36.000",
    objetivo: "Lançamentos, campanhas sazonais e projetos com duração definida.",
    entregas: [
      "Mídia digital",
      "Ativações presenciais",
      "Agenda Somma Club",
      "Comunicação com a base",
      "Mídia no site",
      "Benefícios, conteúdo e relatórios",
    ],
  },
  {
    id: "patrocinio-6-meses",
    nome: "Patrocínio por seis meses",
    duracao: "Seis meses",
    mensal: "A partir de R$ 10.000 / mês",
    total: "A partir de R$ 60.000",
    objetivo: "Construção de recorrência, reconhecimento e relacionamento contínuo.",
    entregas: [
      "Calendário semestral",
      "Ativações e conteúdo",
      "Mídia e presença física",
      "Agenda e benefícios",
      "Relatórios periódicos",
    ],
    destaque: true,
  },
  {
    id: "patrocinio-12-meses",
    nome: "Patrocínio por doze meses",
    duracao: "Doze meses",
    mensal: "A partir de R$ 8.000 / mês",
    total: "A partir de R$ 96.000",
    objetivo: "Presença contínua e construção de marca no longo prazo.",
    entregas: [
      "Calendário anual",
      "Presença institucional",
      "Campanhas digitais e ativações",
      "Conteúdo colaborativo",
      "Agenda, site e benefícios",
      "Relatórios e planejamento periódico",
    ],
  },
];

export const SPONSORSHIP_NOTA =
  "Os valores mensais reduzidos estão condicionados à contratação integral do período.";
