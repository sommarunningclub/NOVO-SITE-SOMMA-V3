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
  { rotulo: "Investimento Somma", valor: "R$ 35.000,00", apoio: "Menor · impostos inclusos" },
  {
    rotulo: "Opção mês",
    valor: "4 sábados",
    apoio: "R$ 80.000,00 · impostos inclusos",
    destaque: true,
  },
] as const;

/** Destaque do Takeover: o mesmo formato esticado para um mês de ativação. */
export const TAKEOVER_MES = {
  titulo: "Um mês de ativação, se a marca quiser",
  texto:
    "O mesmo Somma Day Takeover pode virar um mês inteiro: quatro sábados seguidos, com desafios recorrentes, Ultra Pass, controle de frequência e conteúdo em todos os encontros.",
  duracao: "4 sábados",
  valor: "R$ 80.000,00",
  nota: "Impostos inclusos",
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
  { rotulo: "Duração", valor: "8 sábados" },
  { rotulo: "Formato", valor: "Temporada recorrente" },
  { rotulo: "Objetivo", valor: "Criar frequência e vínculo" },
  { rotulo: "Complexidade", valor: "Média" },
  {
    rotulo: "Investimento Somma",
    valor: "R$ 140.000,00",
    apoio: "Temporada completa · impostos inclusos",
  },
  { rotulo: "Recomendação", valor: "Melhor custo por sábado", destaque: true },
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
    experiencia: "Maior ativação do primeiro ciclo, DJ, trial, brindes e conteúdo",
    marco: true,
  },
  {
    sabado: "Sábado 5",
    ativacao: "Social Check-in Challenge",
    experiencia: "Pontos para quem leva amigos, faz check-in e gera conteúdo",
  },
  {
    sabado: "Sábado 6",
    ativacao: "Perfect Pace Challenge",
    experiencia: "Segunda edição do desafio de pace, agora valendo ranking da temporada",
  },
  {
    sabado: "Sábado 7",
    ativacao: "Ultra Crew Relay",
    experiencia: "Revezamento final entre as crews, torcida e premiação",
  },
  {
    sabado: "Sábado 8",
    ativacao: "Somma Day x Michelob Ultra",
    experiencia: "Encerramento da temporada, premiação do Ultra Pass e recap da parceria",
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

export const ULTRA_PASS_NOTA =
  "No mês de ativação a régua roda uma vez. Na temporada de 8 sábados ela se repete a cada ciclo de 4, com premiação maior no Somma Day de encerramento.";

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
  { criterio: "Duração", takeover: "1 sábado", mes: "4 sábados", series: "8 sábados" },
  {
    criterio: "Objetivo",
    takeover: "Testar ativação",
    mes: "Criar recorrência",
    series: "Virar plataforma",
  },
  { criterio: "Complexidade", takeover: "Baixa", mes: "Média", series: "Média a alta" },
  { criterio: "Presença da marca", takeover: "Pontual", mes: "Recorrente", series: "Contínua" },
  {
    criterio: "Conteúdo",
    takeover: "1 cobertura",
    mes: "4 coberturas",
    series: "8 coberturas",
  },
  {
    criterio: "Dados",
    takeover: "Check-in do dia",
    mes: "Frequência e evolução",
    series: "Frequência, ranking e dashboards",
  },
  {
    criterio: "Brindes",
    takeover: "Entrega pontual",
    mes: "Entrega progressiva",
    series: "Entrega progressiva na temporada",
  },
  {
    criterio: "Melhor uso",
    takeover: "Entrada rápida",
    mes: "Melhor custo-benefício",
    series: "Melhor custo por sábado",
  },
  {
    criterio: "Investimento Somma",
    takeover: "R$ 35.000,00",
    mes: "R$ 80.000,00",
    series: "R$ 140.000,00",
    valor: true,
  },
] as const;

/* ── Slide 14 · Investimentos ────────────────────────────────────────────── */

export const INVESTIMENTOS = [
  {
    nome: "Somma Day Takeover",
    duracao: "1 sábado",
    escopo:
      "Estratégia da ativação, corrida temática, mobilização da comunidade, operação esportiva, professores e pacers, check-in por QR Code, 1 desafio esportivo, gestão dos insiders, comunicação com participantes, cobertura de conteúdo, integração com o toolkit Michelob e relatório final.",
    valor: "R$ 35.000,00",
    nota: "Impostos inclusos",
  },
  {
    nome: "Somma Day Takeover · Mês",
    duracao: "4 sábados",
    escopo:
      "Conceito e planejamento da série, mobilização recorrente da comunidade, operação esportiva em 4 encontros, Ultra Opening Run, Perfect Pace Challenge, Ultra Crew Relay, Somma Day x Michelob, Ultra Pass, check-ins por QR Code, mecânica de frequência, gestão de insiders, comunicação e CRM, cobertura nos 4 encontros, dados de recorrência e relatório consolidado.",
    valor: "R$ 80.000,00",
    nota: "Impostos inclusos",
    selo: "Melhor custo-benefício",
  },
  {
    nome: "Michelob Ultra Saturday Series",
    duracao: "8 sábados",
    escopo:
      "Estratégia de temporada, calendário completo de agosto e setembro, 8 ativações esportivas, 2 Somma Days, desafios recorrentes, Ultra Pass, ranking e mecânica de frequência, mobilização contínua da comunidade, CRM, operação esportiva, insiders e embaixadores, produção recorrente de conteúdo, dashboards de acompanhamento e relatório completo da temporada.",
    valor: "R$ 140.000,00",
    nota: "Impostos inclusos",
    selo: "Recomendado",
    destaque: true,
  },
] as const;

export const INVESTIMENTO_OBS =
  "Os valores se referem às entregas do Somma. Toolkit, produto, DJ, brindes, transporte, montagem, equipe de trial, mídia e estruturas adicionais são responsabilidade da Michelob ou agência.";

/* ── Slide 15 · O que está incluído no fee ───────────────────────────────── */

export const ESCOPO_FEE = [
  { frente: "Estratégia e conceito", takeover: "Sim", mes: "Sim", series: "Sim" },
  {
    frente: "Planejamento da campanha",
    takeover: "1 ativação",
    mes: "4 ativações",
    series: "8 ativações",
  },
  { frente: "Mobilização da comunidade Somma", takeover: "Sim", mes: "Sim", series: "Sim" },
  { frente: "Divulgação nos canais Somma", takeover: "Sim", mes: "Sim", series: "Sim" },
  { frente: "Comunicação e CRM", takeover: "Básico", mes: "Recorrente", series: "Contínuo" },
  { frente: "Corrida temática", takeover: "Sim", mes: "Sim", series: "Sim" },
  { frente: "Operação esportiva", takeover: "1 sábado", mes: "4 sábados", series: "8 sábados" },
  { frente: "Professores e pacers Somma", takeover: "Sim", mes: "Sim", series: "Sim" },
  { frente: "Check-in por QR Code", takeover: "Sim", mes: "Sim", series: "Sim" },
  { frente: "Ultra Pass", takeover: "Não", mes: "Sim", series: "Sim" },
  { frente: "Controle de recorrência", takeover: "Não", mes: "Sim", series: "Sim" },
  {
    frente: "Perfect Pace Challenge",
    takeover: "1 desafio possível",
    mes: "Sim",
    series: "Recorrente",
  },
  { frente: "Crew Relay", takeover: "Opcional", mes: "Sim", series: "Sim" },
  {
    frente: "Outros desafios esportivos",
    takeover: "1",
    mes: "3 a 4",
    series: "Calendário completo",
  },
  {
    frente: "Gestão de insiders",
    takeover: "Ativação pontual",
    mes: "Recorrente",
    series: "Temporada completa",
  },
  { frente: "Conteúdo", takeover: "1 cobertura", mes: "4 coberturas", series: "8 coberturas" },
  { frente: "Reels e vídeos curtos", takeover: "Sim", mes: "Sim", series: "Sim" },
  { frente: "Dados de participantes", takeover: "Sim", mes: "Sim", series: "Sim" },
  { frente: "Dados de frequência", takeover: "Não", mes: "Sim", series: "Sim" },
  { frente: "Relatório final", takeover: "Simples", mes: "Consolidado", series: "Completo" },
  { frente: "Somma Day patrocinado", takeover: "Sim, se escolhido", mes: "1", series: "2" },
  {
    frente: "Possibilidade de evolução",
    takeover: "Baixa",
    mes: "Alta",
    series: "Plataforma recorrente",
  },
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
