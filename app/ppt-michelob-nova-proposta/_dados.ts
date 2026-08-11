/**
 * Conteúdo da apresentação de formatos simplificados.
 *
 * Fica separado do layout para que o deck seja só composição visual: mexer em
 * texto, valor ou linha de tabela não exige abrir o arquivo de slides.
 */

import type { IconName } from "./_icons";

/* ── Slide 02 · Contexto ─────────────────────────────────────────────────── */

export const CONTEXTO_CARDS = [
  {
    n: "01",
    icon: "comunidade" as IconName,
    titulo: "Comunidade ativa todo sábado",
    texto: "Centenas de pessoas no mesmo ponto, por vontade própria, toda semana.",
  },
  {
    n: "02",
    icon: "tenda" as IconName,
    titulo: "Toolkit Michelob já disponível",
    texto: "Tenda, wind banners, bar, mesa de DJ e materiais que a marca já possui.",
  },
  {
    n: "03",
    icon: "escala" as IconName,
    titulo: "Dois formatos de entrada",
    texto: "De um Somma Day a um mês inteiro, no ritmo que a marca quiser assumir.",
  },
] as const;

/* ── Slide 03 · Toolkit ──────────────────────────────────────────────────── */

/**
 * Materiais que a marca já possui. As fotos são de ativações reais da
 * Michelob Ultra em Brasília e ficam em /public/michelob/toolkit.
 */
export const TOOLKIT = [
  { icon: "tenda" as IconName, nome: "Tenda", foto: "tenda" },
  { icon: "banner" as IconName, nome: "Wind banners", foto: "wind-banners" },
  { icon: "dj" as IconName, nome: "Mesa de DJ", foto: "dj" },
  { icon: "bar" as IconName, nome: "Balcão ou bar", foto: "balcao" },
  { icon: "bar" as IconName, nome: "Carrinho refrigerado", foto: "carrinho" },
  { icon: "cooler" as IconName, nome: "Caixa térmica", foto: "caixa-termica" },
  { icon: "arte" as IconName, nome: "Display de produto", foto: "display" },
  { icon: "trial" as IconName, nome: "Produto para trial", foto: "trial" },
  { icon: "brinde" as IconName, nome: "Brindes" },
] as const;

/* ── Slide 04 · Opção 1 ──────────────────────────────────────────────────── */

export const TAKEOVER_BLOCOS = [
  { rotulo: "Duração", valor: "Um sábado do mês" },
  { rotulo: "Formato", valor: "Somma Day" },
  { rotulo: "Objetivo", valor: "Testar presença da marca" },
  { rotulo: "Complexidade", valor: "Baixa" },
  { rotulo: "Opção mês", valor: "4 semanas", destaque: true },
] as const;

/** Destaque do Takeover: o mesmo formato esticado para um mês de ativação. */
export const TAKEOVER_MES = {
  titulo: "Um mês de ativação, se a marca quiser",
  texto:
    "O mesmo Somma Day Takeover pode virar um mês inteiro: quatro semanas seguidas, com desafios recorrentes, Ultra Pass, controle de frequência, conteúdo em todos os encontros e um evento final aberto.",
  duracao: "4 semanas",
} as const;

/* ── Slide 05 · Jornada do Takeover ──────────────────────────────────────── */

export const TAKEOVER_JORNADA = [
  {
    n: "1",
    icon: "checkin" as IconName,
    titulo: "Chegada e check-in",
    detalhe: "Check-in por QR Code, na entrada da ativação.",
  },
  {
    n: "2",
    icon: "corrida" as IconName,
    titulo: "Corrida temática",
    detalhe: "5K ou treino especial, com pacers e professores do Somma.",
  },
  {
    n: "3",
    icon: "desafio" as IconName,
    titulo: "Desafio simples",
    detalhe: "Perfect Pace Challenge ou desafio de participação.",
  },
  {
    n: "4",
    icon: "trial" as IconName,
    titulo: "Trial Michelob Ultra",
    detalhe: "Depois da atividade esportiva e exclusivo para maiores de 18 anos.",
  },
  {
    n: "5",
    icon: "musica" as IconName,
    titulo: "DJ e convivência",
    detalhe: "Música e área de encontro no pós-treino.",
  },
  {
    n: "6",
    icon: "brinde" as IconName,
    titulo: "Brindes e conteúdo",
    detalhe: "Distribuição de brindes, fotos e vídeos da ativação.",
  },
  {
    n: "7",
    icon: "relatorio" as IconName,
    titulo: "Relatório final",
    detalhe: "Presença, engajamento e leitura do sábado.",
  },
] as const;

/* ── Slide 06 · Entregas do Somma no Takeover ────────────────────────────── */

export const TAKEOVER_SOMMA = [
  { frente: "Estratégia", entrega: "Conceito da ativação e planejamento" },
  { frente: "Landing page", entrega: "Página do evento, inscrição e confirmação de presença" },
  { frente: "Check-in", entrega: "QR Code na chegada e lista de presença em tempo real" },
  { frente: "Comunidade", entrega: "Chamada do evento, divulgação para a base e mobilização" },
  { frente: "Mídia e influenciadores", entrega: "Canais do Somma e perfis da nossa base" },
  { frente: "Operação esportiva", entrega: "Percurso, professores, pacers e largada" },
  { frente: "Conteúdo", entrega: "Cobertura, fotos, vídeos e recap" },
  { frente: "Insiders", entrega: "Apoio na mobilização e presença no dia" },
  { frente: "Dados", entrega: "Relatório de presença e engajamento" },
  { frente: "Coordenação", entrega: "Integração com agência e equipe Michelob" },
] as const;

/* ── Slide 07 · Responsabilidades da Michelob no Takeover ────────────────── */

export const TAKEOVER_MICHELOB = [
  { frente: "Toolkit", responsabilidade: "Transporte, montagem e desmontagem" },
  { frente: "Trial", responsabilidade: "Produto, gelo, copos, caixas térmicas e equipe" },
  { frente: "DJ", responsabilidade: "Contratação, equipamento e operação" },
  { frente: "Brindes", responsabilidade: "Itens, quantidades e logística" },
  { frente: "Identidade", responsabilidade: "Aprovação visual e materiais oficiais" },
  { frente: "Jurídico", responsabilidade: "Consumo responsável e regras da marca" },
] as const;

/* ── Slide 08 · Opção 2 ──────────────────────────────────────────────────── */

export const MES_BLOCOS = [
  { rotulo: "Duração", valor: "4 semanas" },
  { rotulo: "Formato", valor: "Mês de ativação" },
  { rotulo: "Objetivo", valor: "Criar frequência e vínculo" },
  { rotulo: "Setup", valor: "Até 2 semanas" },
  { rotulo: "Evento final", valor: "Domingo, aberto" },
  { rotulo: "Recomendação", valor: "Melhor custo-benefício", destaque: true },
] as const;

/* ── Slide 09 · Jornada do mês de ativação ───────────────────────────────── */

export const MES_JORNADA = [
  {
    sabado: "Semana 1",
    ativacao: "Ultra Opening Run",
    experiencia: "Sábado. Lançamento da parceria, corrida temática, DJ, trial e brindes",
  },
  {
    sabado: "Semana 2",
    ativacao: "Perfect Pace Challenge",
    experiencia: "Sábado. Vence quem termina mais próximo do tempo previsto",
  },
  {
    sabado: "Semana 3",
    ativacao: "Ultra Crew Relay",
    experiencia: "Sábado. Revezamento curto entre equipes, torcida e premiação",
  },
  {
    sabado: "Semana 4",
    ativacao: "Somma Day x Michelob Ultra",
    experiencia:
      "Domingo, no Parque da Cidade, estacionamento 9. Evento final aberto, limitado a mil pessoas",
    marco: true,
  },
] as const;

/** Condições operacionais do mês: prazo de setup e desenho do evento final. */
export const MES_CONDICOES = [
  {
    icon: "escala" as IconName,
    titulo: "Até 2 semanas de setup",
    texto:
      "Prazo para montar a campanha e alinhar tudo com a marca antes da primeira semana. Pode ser menos, mas duas semanas dão folga para aprovações, produção e divulgação.",
  },
  {
    icon: "comunidade" as IconName,
    titulo: "Evento final no Parque da Cidade",
    texto:
      "A quarta semana fecha em um domingo, no estacionamento 9 do Parque da Cidade, com o evento aberto ao público e limitado a mil pessoas.",
  },
] as const;

/* ── Slide 10 · Ultra Pass ───────────────────────────────────────────────── */

export const ULTRA_PASS = [
  { frequencia: "1 semana", beneficio: "Participação em sorteio ou brinde inicial" },
  { frequencia: "2 semanas", beneficio: "Brinde intermediário" },
  { frequencia: "3 semanas", beneficio: "Concorrência a prêmio especial" },
  {
    frequencia: "4 semanas",
    beneficio: "Brinde premium ou experiência exclusiva no evento final",
    marco: true,
  },
] as const;

export const ULTRA_PASS_NOTA =
  "A régua roda ao longo das quatro semanas do mês de ativação, com a maior premiação no evento final de domingo.";

/* ── Slide 11 · Desafios ─────────────────────────────────────────────────── */

export const DESAFIOS = [
  {
    n: "01",
    icon: "desafio" as IconName,
    nome: "Perfect Pace Challenge",
    texto: "O participante informa o tempo previsto e vence quem chegar mais próximo.",
  },
  {
    n: "02",
    icon: "revezamento" as IconName,
    nome: "Ultra Crew Relay",
    texto: "Revezamento rápido em equipes, com torcida e premiação.",
  },
  {
    n: "03",
    icon: "comunidade" as IconName,
    nome: "Social Check-in Challenge",
    texto: "Ganha ponto quem leva amigos, participa, faz check-in e gera conteúdo.",
  },
] as const;

/* ── Slide 12 · Trial e convivência ──────────────────────────────────────── */

export const CONVIVENCIA = [
  { icon: "trial" as IconName, nome: "Trial Michelob Ultra" },
  { icon: "musica" as IconName, nome: "DJ" },
  { icon: "cooler" as IconName, nome: "Caixa térmica" },
  { icon: "tenda" as IconName, nome: "Área de convivência" },
  { icon: "brinde" as IconName, nome: "Brindes" },
  { icon: "foto" as IconName, nome: "Fotos" },
  { icon: "conteudo" as IconName, nome: "Conteúdo" },
  { icon: "responsavel" as IconName, nome: "Consumo responsável" },
] as const;

/* ── Slide 13 · Comparativo ──────────────────────────────────────────────── */

export const COMPARATIVO = [
  { criterio: "Duração", takeover: "Um sábado do mês", mes: "4 semanas" },
  { criterio: "Objetivo", takeover: "Testar ativação", mes: "Criar recorrência" },
  { criterio: "Complexidade", takeover: "Baixa", mes: "Média" },
  { criterio: "Setup até o evento", takeover: "Curto", mes: "Até 2 semanas" },
  { criterio: "Presença da marca", takeover: "Pontual", mes: "Recorrente" },
  { criterio: "Conteúdo", takeover: "1 cobertura", mes: "4 momentos de conteúdo" },
  { criterio: "Dados", takeover: "Check-in do dia", mes: "Frequência e evolução" },
  { criterio: "Brindes", takeover: "Entrega pontual", mes: "Entrega progressiva" },
  {
    criterio: "Evento final",
    takeover: "O próprio Somma Day",
    mes: "Domingo no Parque da Cidade, estacionamento 9, até mil pessoas",
  },
  { criterio: "Melhor uso", takeover: "Entrada rápida", mes: "Melhor custo-benefício" },
  {
    criterio: "Investimento Somma",
    takeover: "R$ 15.000,00",
    mes: "R$ 50.000,00",
    valor: true,
  },
  { criterio: "Impostos", takeover: "Inclusos", mes: "Inclusos" },
  {
    criterio: "Liberação da marca em espaço público",
    takeover: "R$ 2.000,00 à parte, via despachante",
    mes: "Incluso no investimento",
  },
  {
    criterio: "Pagamento",
    takeover: "A combinar no fechamento",
    mes: "50% no fechamento do contrato e 50% até 15 dias após a última semana",
  },
] as const;

/* ── Slide 14 · Investimentos ────────────────────────────────────────────── */

export const INVESTIMENTOS = [
  {
    nome: "Somma Day Takeover",
    duracao: "Um sábado do mês",
    escopo:
      "Estratégia da ativação, landing page do evento, check-in por QR Code, chamada e divulgação nos canais do Somma, influenciadores da nossa base, corrida temática, mobilização da comunidade, operação esportiva, professores e pacers, 1 desafio esportivo, gestão dos insiders, cobertura de conteúdo, integração com o toolkit Michelob e relatório final.",
  },
  {
    nome: "Somma Day Takeover · Mês",
    duracao: "4 semanas",
    escopo:
      "Conceito e planejamento do mês, landing page e inscrição, check-ins por QR Code, chamada do evento, mídia nos canais do Somma e influenciadores da base, mobilização recorrente da comunidade, operação esportiva em 4 encontros, Ultra Opening Run, Perfect Pace Challenge, Ultra Crew Relay, Ultra Pass, mecânica de frequência, gestão de insiders, comunicação e CRM, cobertura nas 4 semanas, evento final de domingo no Parque da Cidade e relatório consolidado.",
    selo: "Recomendado",
    destaque: true,
  },
] as const;

export const INVESTIMENTO_OBS =
  "Os valores de cada formato estão na tabela comparativa. Toolkit, produto, DJ, brindes, transporte, montagem, equipe de trial, mídia paga e estruturas adicionais são responsabilidade da Michelob ou agência.";

/* ── Slide 15 · O que está incluído no fee ───────────────────────────────── */

export const ESCOPO_FEE = [
  { frente: "Estratégia e conceito", takeover: "Sim", mes: "Sim" },
  { frente: "Planejamento da campanha", takeover: "1 ativação", mes: "4 ativações" },
  { frente: "Landing page do evento", takeover: "Sim", mes: "Sim" },
  { frente: "Inscrição e confirmação de presença", takeover: "Sim", mes: "Sim" },
  { frente: "Mobilização da comunidade Somma", takeover: "Sim", mes: "Sim" },
  { frente: "Chamada e divulgação do evento", takeover: "Sim", mes: "Recorrente" },
  { frente: "Mídia nos canais Somma", takeover: "Sim", mes: "Sim" },
  { frente: "Influenciadores da base Somma", takeover: "Sim", mes: "Recorrente" },
  { frente: "Comunicação e CRM", takeover: "Básico", mes: "Recorrente" },
  { frente: "Corrida temática", takeover: "Sim", mes: "Sim" },
  { frente: "Operação esportiva", takeover: "1 sábado", mes: "4 semanas" },
  { frente: "Professores e pacers Somma", takeover: "Sim", mes: "Sim" },
  { frente: "Check-in por QR Code", takeover: "Sim", mes: "Sim" },
  { frente: "Ultra Pass", takeover: "Não", mes: "Sim" },
  { frente: "Controle de recorrência", takeover: "Não", mes: "Sim" },
  { frente: "Perfect Pace Challenge", takeover: "1 desafio possível", mes: "Sim" },
  { frente: "Crew Relay", takeover: "Opcional", mes: "Sim" },
  { frente: "Outros desafios esportivos", takeover: "1", mes: "3 a 4" },
  { frente: "Gestão de insiders", takeover: "Ativação pontual", mes: "Recorrente" },
  { frente: "Conteúdo", takeover: "1 cobertura", mes: "4 coberturas" },
  { frente: "Reels e vídeos curtos", takeover: "Sim", mes: "Sim" },
  { frente: "Dados de participantes", takeover: "Sim", mes: "Sim" },
  { frente: "Dados de frequência", takeover: "Não", mes: "Sim" },
  { frente: "Relatório final", takeover: "Simples", mes: "Consolidado" },
  { frente: "Somma Day patrocinado", takeover: "Sim, se escolhido", mes: "1" },
  { frente: "Evento final aberto ao público", takeover: "Não", mes: "Domingo, até mil pessoas" },
  { frente: "Liberação da marca em espaço público", takeover: "À parte", mes: "Incluso" },
  { frente: "Possibilidade de evolução", takeover: "Baixa", mes: "Alta" },
] as const;

/* ── Slide 16 · O que fica com a Michelob ────────────────────────────────── */

export const MICHELOB_ESCOPO = [
  {
    frente: "Toolkit",
    responsabilidade: "Tenda, wind banners, balcão, caixa térmica, mesa de DJ e demais materiais",
  },
  { frente: "Produto", responsabilidade: "Michelob Ultra para trial" },
  { frente: "Operação do trial", responsabilidade: "Gelo, copos, refrigeração e equipe" },
  { frente: "DJ", responsabilidade: "Cachê, equipamento e operação" },
  {
    frente: "Brindes",
    responsabilidade: "Meias, viseiras, corta-vento, pochetes, bolsas e demais produtos",
  },
  { frente: "Logística", responsabilidade: "Transporte, montagem e desmontagem" },
  {
    frente: "Estrutura adicional",
    responsabilidade: "Som, energia, mobiliário ou estrutura extraordinária",
  },
  { frente: "Mídia paga", responsabilidade: "Investimento em impulsionamento, caso desejado" },
  {
    frente: "Jurídico e marca",
    responsabilidade: "Aprovações, diretrizes e regras de experimentação",
  },
] as const;
