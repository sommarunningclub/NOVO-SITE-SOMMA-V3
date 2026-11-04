import type { MetaMetrica } from "./metricas";

/**
 * Instagram @somma.club · Insights.
 * Fonte: prints do Instagram Insights enviados pela SOMMA.
 * Período: últimos 30 dias, capturado em 04/11/2026.
 *
 * Para atualizar: troque os números e as datas abaixo. Os componentes
 * recalculam percentuais e destaques sozinhos.
 */
export const META_INSTAGRAM: MetaMetrica = {
  fonte: "Instagram Insights · @somma.club",
  periodo: "Últimos 30 dias",
  atualizadoEm: "2026-11-04",
  status: "verificado",
};

export interface MetricaInstagram {
  id: string;
  valor: number;
  /** Como o número aparece grande no slide. */
  destaque: string;
  rotulo: string;
  definicao: string;
}

export const INSTAGRAM_PRINCIPAIS: MetricaInstagram[] = [
  {
    id: "visualizacoes",
    valor: 415_032,
    destaque: "415 mil",
    rotulo: "Visualizações em 30 dias",
    definicao: "Total de exibições de conteúdo. Uma mesma pessoa pode gerar várias visualizações.",
  },
  {
    id: "visualizadores",
    valor: 44_484,
    destaque: "44,4 mil",
    rotulo: "Visualizadores",
    definicao: "Contas que viram ao menos um conteúdo no período, seguidoras ou não.",
  },
  {
    id: "seguidores",
    valor: 14_808,
    destaque: "14,8 mil",
    rotulo: "Seguidores",
    definicao: "Total de seguidores do perfil na data da captura.",
  },
  {
    id: "interacoes",
    valor: 7_441,
    destaque: "7,4 mil",
    rotulo: "Interações",
    definicao: "Curtidas, comentários, compartilhamentos, salvamentos e respostas no período.",
  },
];

export const INSTAGRAM_SECUNDARIAS: MetricaInstagram[] = [
  {
    id: "visitas",
    valor: 7_753,
    destaque: "7.753",
    rotulo: "Visitas ao perfil",
    definicao: "Vezes que o perfil foi aberto no período.",
  },
  {
    id: "link",
    valor: 975,
    destaque: "975",
    rotulo: "Toques no link da bio",
    definicao: "Cliques no link do perfil no período.",
  },
  {
    id: "novos",
    valor: 123,
    destaque: "+123",
    rotulo: "Novos seguidores líquidos",
    definicao: "Seguidores ganhos menos seguidores perdidos no período.",
  },
];

/** Visualizações por formato (valores arredondados pelo próprio Instagram). */
export const INSTAGRAM_FORMATOS = [
  { id: "stories", rotulo: "Stories", valor: 256_000, destaque: "256 mil" },
  { id: "posts", rotulo: "Posts", valor: 115_000, destaque: "115 mil" },
  { id: "reels", rotulo: "Reels", valor: 44_000, destaque: "44 mil" },
] as const;

/** Perfil dos SEGUIDORES (não dos participantes dos eventos). */
export const INSTAGRAM_PUBLICO = {
  sexo: [
    { id: "F", rotulo: "Mulheres", pct: 66.6 },
    { id: "M", rotulo: "Homens", pct: 33.4 },
  ],
  idade: [
    { faixa: "13–17", pct: 0.2 },
    { faixa: "18–24", pct: 13.6 },
    { faixa: "25–34", pct: 46.0 },
    { faixa: "35–44", pct: 27.5 },
    { faixa: "45–54", pct: 10.4 },
    { faixa: "55–64", pct: 2.0 },
    { faixa: "65+", pct: 0.3 },
  ],
  /** Faixas somadas no destaque do slide. */
  faixasNucleo: ["25–34", "35–44"],
  brasil: 99.3,
};
