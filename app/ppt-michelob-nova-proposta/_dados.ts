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
    titulo: "Ativações escaláveis por investimento",
    texto: "Do sábado único à temporada, no ritmo que a marca quiser assumir.",
  },
] as const;

/* ── Slide 03 · Toolkit ──────────────────────────────────────────────────── */

export const TOOLKIT = [
  { icon: "tenda" as IconName, nome: "Tenda" },
  { icon: "banner" as IconName, nome: "Wind banners" },
  { icon: "cooler" as IconName, nome: "Caixa térmica" },
  { icon: "dj" as IconName, nome: "Mesa de DJ" },
  { icon: "bar" as IconName, nome: "Balcão ou bar" },
  { icon: "brinde" as IconName, nome: "Brindes" },
  { icon: "trial" as IconName, nome: "Produto para trial" },
  { icon: "arte" as IconName, nome: "Materiais visuais da marca" },
] as const;

/* ── Slide 04 · Opção 1 ──────────────────────────────────────────────────── */

export const TAKEOVER_BLOCOS = [
  { rotulo: "Duração", valor: "1 sábado" },
  { rotulo: "Formato", valor: "Ativação pontual" },
  { rotulo: "Objetivo", valor: "Testar presença da marca" },
  { rotulo: "Complexidade", valor: "Baixa" },
  { rotulo: "Investimento", valor: "Menor" },
] as const;

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
  { frente: "Comunidade", entrega: "Divulgação para a base e mobilização" },
  { frente: "Operação esportiva", entrega: "Percurso, professores, pacers e check-in" },
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

export const SERIES_BLOCOS = [
  { rotulo: "Duração", valor: "4 sábados" },
  { rotulo: "Formato", valor: "Série recorrente" },
  { rotulo: "Objetivo", valor: "Criar frequência e vínculo" },
  { rotulo: "Complexidade", valor: "Média" },
  { rotulo: "Investimento", valor: "Intermediário" },
  { rotulo: "Recomendação", valor: "Melhor custo-benefício", destaque: true },
] as const;

/* ── Slide 09 · Jornada da Saturday Series ───────────────────────────────── */

export const SERIES_JORNADA = [
  {
    sabado: "Sábado 1",
    ativacao: "Ultra Opening Run",
    experiencia: "Lançamento da parceria, corrida temática, DJ, trial e brindes",
  },
  {
    sabado: "Sábado 2",
    ativacao: "Perfect Pace Challenge",
    experiencia: "Vence quem termina mais próximo do tempo previsto",
  },
  {
    sabado: "Sábado 3",
    ativacao: "Ultra Crew Relay",
    experiencia: "Revezamento curto entre equipes, torcida e premiação",
  },
  {
    sabado: "Sábado 4",
    ativacao: "Somma Day x Michelob Ultra",
    experiencia: "Maior ativação, DJ, trial, brindes, conteúdo e encerramento",
    marco: true,
  },
] as const;

/* ── Slide 10 · Ultra Pass ───────────────────────────────────────────────── */

export const ULTRA_PASS = [
  { frequencia: "1 sábado", beneficio: "Participação em sorteio ou brinde inicial" },
  { frequencia: "2 sábados", beneficio: "Brinde intermediário" },
  { frequencia: "3 sábados", beneficio: "Concorrência a prêmio especial" },
  {
    frequencia: "4 sábados",
    beneficio: "Brinde premium ou experiência exclusiva no Somma Day",
    marco: true,
  },
] as const;

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
  { criterio: "Duração", takeover: "1 sábado", series: "4 sábados" },
  { criterio: "Objetivo", takeover: "Testar ativação", series: "Criar recorrência" },
  { criterio: "Complexidade", takeover: "Baixa", series: "Média" },
  { criterio: "Presença da marca", takeover: "Pontual", series: "Recorrente" },
  { criterio: "Conteúdo", takeover: "1 cobertura", series: "4 momentos de conteúdo" },
  { criterio: "Dados", takeover: "Check-in do dia", series: "Frequência e evolução" },
  { criterio: "Brindes", takeover: "Entrega pontual", series: "Entrega progressiva" },
  { criterio: "Melhor uso", takeover: "Entrada rápida", series: "Melhor custo-benefício" },
] as const;

/* ── Slide 14 · Investimentos ────────────────────────────────────────────── */

export const INVESTIMENTOS = [
  {
    nome: "Somma Day Takeover",
    duracao: "1 sábado",
    escopo: "Corrida temática, ativação do toolkit, trial, DJ, conteúdo e relatório",
    valor: "R$ 35.000,00",
    nota: "Impostos inclusos",
  },
  {
    nome: "Michelob Ultra Saturday Series",
    duracao: "4 sábados",
    escopo: "Recorrência, desafios, Ultra Pass, conteúdo, check-ins e Somma Day final",
    valor: "R$ 80.000,00",
    nota: "Impostos inclusos",
    selo: "Recomendado",
    destaque: true,
  },
  {
    nome: "Michelob Ultra Season",
    duracao: "8 sábados",
    escopo: "Temporada estendida entre agosto e setembro",
    valor: "R$ 140.000,00",
    nota: "Impostos inclusos",
    selo: "Upgrade futuro",
  },
] as const;

export const INVESTIMENTO_OBS =
  "Os valores se referem às entregas do Somma. Toolkit, produto, DJ, brindes, transporte, montagem, equipe de trial, mídia e estruturas adicionais são responsabilidade da Michelob ou agência.";

/* ── Slide 15 · O que está incluído no fee ───────────────────────────────── */

export const ESCOPO_FEE = [
  { frente: "Estratégia", takeover: "Sim", series: "Sim" },
  { frente: "Mobilização da comunidade", takeover: "Sim", series: "Sim" },
  { frente: "Operação esportiva", takeover: "Sim", series: "Sim" },
  { frente: "Check-in QR Code", takeover: "Sim", series: "Sim" },
  { frente: "Ultra Pass", takeover: "Não", series: "Sim" },
  { frente: "Desafios esportivos", takeover: "1 desafio", series: "3 a 4 desafios" },
  { frente: "Insiders", takeover: "Apoio no dia", series: "Mobilização recorrente" },
  { frente: "Conteúdo", takeover: "1 cobertura", series: "4 coberturas leves" },
  { frente: "Relatório", takeover: "Relatório simples", series: "Relatório consolidado" },
  { frente: "Coordenação", takeover: "Sim", series: "Sim" },
] as const;

/* ── Slide 16 · O que fica com a Michelob ────────────────────────────────── */

export const MICHELOB_ESCOPO = [
  {
    frente: "Toolkit",
    responsabilidade: "Tenda, wind banner, caixa térmica, balcão, mesa de DJ e demais materiais",
  },
  { frente: "Trial", responsabilidade: "Produto, gelo, copos, equipe e operação" },
  { frente: "DJ", responsabilidade: "Contratação, equipamento e operador" },
  { frente: "Brindes", responsabilidade: "Produção, quantidade e logística" },
  { frente: "Transporte", responsabilidade: "Levar e retirar materiais" },
  { frente: "Montagem", responsabilidade: "Equipe responsável pela montagem e desmontagem" },
  { frente: "Mídia paga", responsabilidade: "Verba e gestão, se houver" },
  { frente: "Jurídico", responsabilidade: "Regras de uso da marca e consumo responsável" },
  { frente: "Aprovações", responsabilidade: "Peças, briefing, comunicação e materiais" },
] as const;
