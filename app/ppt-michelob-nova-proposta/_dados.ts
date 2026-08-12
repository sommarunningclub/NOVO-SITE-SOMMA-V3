import type { IconName } from "./_icons";

/* ══════════════════════════════════════════════════════════════════════════
   Conteúdo da proposta Somma Club × Michelob Ultra.

   A proposta em jogo é a que a agência desenhou com a gente: duas ativações,
   nos Somma Days de 29 de agosto e 26 de setembro, por R$ 15.000. O valor de
   tabela (R$ 15.000 por sábado) continua visível no deck, porque é ele que
   sustenta a renovação: o que a marca recebe agora é uma condição de entrada,
   não o preço do formato.

   O mês de ativação segue no deck como próximo passo, não como alternativa
   concorrente.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Slide 02 · Contexto ─────────────────────────────────────────────────── */

export const CONTEXTO_CARDS = [
  {
    n: "01",
    icon: "corrida" as IconName,
    titulo: "O sábado já existe",
    texto:
      "Todo sábado, 7h, o Somma reúne a comunidade no mesmo ponto. A marca não precisa criar público: precisa ocupar um ritual que já acontece.",
  },
  {
    n: "02",
    icon: "tenda" as IconName,
    titulo: "O material já existe",
    texto:
      "Tenda, wind banners, balcão, caixa térmica e mesa de DJ já são da Michelob. A ativação usa o toolkit que está parado, sem produção nova.",
  },
  {
    n: "03",
    icon: "comunidade" as IconName,
    titulo: "A prova é rápida",
    texto:
      "Duas datas bastam para medir presença, experimentação e conteúdo, e para decidir com dado se a parceria escala.",
  },
] as const;

/* ── Slide 03 · Toolkit ──────────────────────────────────────────────────── */

export const TOOLKIT = [
  { icon: "tenda" as IconName, nome: "Tenda", foto: "tenda" },
  { icon: "banner" as IconName, nome: "Wind banners", foto: "wind-banners" },
  { icon: "bar" as IconName, nome: "Balcão", foto: "balcao" },
  { icon: "cooler" as IconName, nome: "Caixa térmica", foto: "caixa-termica" },
  { icon: "dj" as IconName, nome: "Mesa de DJ", foto: "dj" },
  { icon: "trial" as IconName, nome: "Trial", foto: "trial" },
  { icon: "escala" as IconName, nome: "Display", foto: "display" },
  { icon: "brinde" as IconName, nome: "Carrinho", foto: "carrinho" },
  { icon: "responsavel" as IconName, nome: "Equipe", foto: "equipe" },
] as const;

/* ── Slide 04 · A proposta ───────────────────────────────────────────────── */

export const PROPOSTA_BLOCOS = [
  { rotulo: "Formato", valor: "2 Somma Days" },
  { rotulo: "Datas", valor: "29/08 e 26/09" },
  { rotulo: "Objetivo", valor: "Abrir a parceria" },
  { rotulo: "Investimento", valor: "R$ 15.000", apoio: "pelas duas datas", destaque: true },
] as const;

/** As duas datas, do jeito que entram na tela da proposta. */
export const CAPITULOS = [
  {
    n: "01",
    rotulo: "Capítulo 1",
    data: "29 de agosto",
    diaSemana: "Sábado · Somma Day",
    titulo: "Ultra Opening Run",
    resumo:
      "A estreia da marca no sábado do Somma: corrida temática, toolkit montado, trial no pós-treino e conteúdo.",
  },
  {
    n: "02",
    rotulo: "Capítulo 2",
    data: "26 de setembro",
    diaSemana: "Sábado · Somma Day",
    titulo: "Ultra Return",
    resumo:
      "O retorno, com desafio, ranking de quem veio nas duas datas e o fechamento da temporada em conteúdo e relatório.",
    marco: true,
  },
] as const;

export const PROPOSTA_NOTA =
  "As duas ativações acontecem no Somma Day, o último sábado de cada mês, quando a comunidade tem o maior público do mês.";

/* ── Slide 05 · Capítulo 1 ───────────────────────────────────────────────── */

export const CAPITULO_1 = [
  {
    n: "1",
    icon: "checkin" as IconName,
    titulo: "Chegada e check-in",
    detalhe: "Check-in por QR Code na entrada, com lista de presença em tempo real.",
  },
  {
    n: "2",
    icon: "corrida" as IconName,
    titulo: "Corrida temática",
    detalhe: "5K ou treino especial, com pacers e professores do Somma.",
  },
  {
    n: "3",
    icon: "trial" as IconName,
    titulo: "Trial e convivência",
    detalhe: "Experimentação depois da atividade, com DJ e área de encontro.",
  },
  {
    n: "4",
    icon: "conteudo" as IconName,
    titulo: "Conteúdo e primeiro selo",
    detalhe: "Cobertura do dia e o primeiro selo do Ultra Pass Pocket carimbado.",
  },
] as const;

/* ── Slide 06 · Capítulo 2 ───────────────────────────────────────────────── */

export const CAPITULO_2 = [
  {
    n: "1",
    icon: "checkin" as IconName,
    titulo: "Volta da tropa",
    detalhe: "Mesmo check-in, agora medindo quem voltou depois de agosto.",
  },
  {
    n: "2",
    icon: "desafio" as IconName,
    titulo: "Perfect Pace Challenge",
    detalhe: "O participante estima o próprio tempo e vence quem chega mais perto.",
  },
  {
    n: "3",
    icon: "brinde" as IconName,
    titulo: "Pass completo",
    detalhe: "Quem tem os dois selos retira o brinde premium e entra no sorteio final.",
  },
  {
    n: "4",
    icon: "relatorio" as IconName,
    titulo: "Recap e relatório",
    detalhe: "Fechamento em conteúdo e relatório consolidado das duas datas.",
  },
] as const;

/* ── Slide 07 · Ultra Pass Pocket ────────────────────────────────────────── */

export const POCKET_JORNADA = [
  {
    n: "1",
    icon: "conteudo" as IconName,
    titulo: "Inscrição na landing page",
    detalhe: "Uma página para a temporada inteira, com nome, e-mail e telefone.",
  },
  {
    n: "2",
    icon: "arte" as IconName,
    titulo: "Recebe o pass",
    detalhe: "Passaporte digital com QR Code único, aberto no navegador. Sem app e sem senha.",
  },
  {
    n: "3",
    icon: "checkin" as IconName,
    titulo: "Carimba no sábado",
    detalhe: "A equipe lê o QR Code na chegada e o selo daquela data entra na hora.",
  },
  {
    n: "4",
    icon: "brinde" as IconName,
    titulo: "Completa e retira",
    detalhe: "Dois selos fecham o pass e liberam o prêmio no dia 26 de setembro.",
  },
] as const;

/** Régua curta: duas datas, dois degraus. */
export const POCKET_REGUA = [
  {
    selos: 1,
    frequencia: "1 selo",
    rotulo: "29 de agosto",
    curto: "29/08",
    beneficio: "Brinde de entrada e participação no sorteio do dia",
  },
  {
    selos: 2,
    frequencia: "2 selos",
    rotulo: "26 de setembro",
    curto: "26/09",
    beneficio: "Pass completo: brinde premium e sorteio da experiência da temporada",
    marco: true,
  },
] as const;

export const POCKET_NOTA =
  "Versão reduzida do Ultra Pass, desenhada para duas datas. É o que transforma dois eventos soltos em temporada e dá à marca a leitura de quem voltou.";

/* ── Slide 08 · Trial e convivência ──────────────────────────────────────── */

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

/* ── Slide 09 · Entregas do Somma ────────────────────────────────────────── */

export const ENTREGAS_SOMMA = [
  {
    frente: "Estratégia e coordenação",
    entrega: "Conceito da temporada, planejamento das duas datas e integração com agência e equipe Michelob",
  },
  { frente: "Landing page", entrega: "Uma página para a temporada, com inscrição e confirmação de presença" },
  { frente: "Check-in", entrega: "QR Code na chegada e lista de presença em tempo real nas duas datas" },
  { frente: "Ultra Pass Pocket", entrega: "Passaporte digital de dois selos e controle de quem voltou" },
  {
    frente: "Comunidade",
    entrega: "Chamada dos eventos, divulgação para a base, mobilização e presença dos insiders nos dois dias",
  },
  { frente: "Mídia e influenciadores", entrega: "Canais do Somma e perfis da nossa base" },
  { frente: "Operação esportiva", entrega: "Percurso, professores, pacers e largada nas duas datas" },
  { frente: "Desafio", entrega: "Perfect Pace Challenge no capítulo 2" },
  { frente: "Conteúdo", entrega: "Cobertura das duas datas, fotos, vídeos e recap da temporada" },
  { frente: "Dados", entrega: "Relatório consolidado de presença, retorno e engajamento" },
] as const;

/* ── Slide 10 · O que fica com a Michelob ────────────────────────────────── */

export const MICHELOB_ESCOPO = [
  {
    frente: "Toolkit",
    responsabilidade: "Tenda, wind banners, balcão, caixa térmica, mesa de DJ e demais materiais",
  },
  { frente: "Produto", responsabilidade: "Michelob Ultra para trial nas duas datas" },
  { frente: "Operação do trial", responsabilidade: "Gelo, copos, refrigeração e equipe" },
  { frente: "DJ", responsabilidade: "Cachê, equipamento e operação" },
  {
    frente: "Brindes",
    responsabilidade: "Itens do Ultra Pass Pocket, meias, viseiras, corta-vento, pochetes e bolsas",
  },
  { frente: "Logística", responsabilidade: "Transporte, montagem e desmontagem nas duas datas" },
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

/* ── Slide 11 · Condição comercial ───────────────────────────────────────── */

export const CONDICAO = {
  tabela: "R$ 30.000",
  tabelaNota: "valor de tabela: R$ 15.000 por Somma Day",
  proposta: "R$ 15.000",
  propostaNota: "pelas duas datas, impostos inclusos",
  selo: "Condição de entrada",
  texto:
    "A Michelob paga por uma ativação e recebe duas. A condição vale para esta temporada, nas datas de 29 de agosto e 26 de setembro, e existe para a marca entrar com risco baixo e decidir a continuidade com dado na mão.",
} as const;

export const CONDICAO_INCLUSO = [
  "Escopo completo do Somma nas duas datas",
  "Impostos",
  "Liberação da marca em espaço público",
  "Landing page única da temporada",
  "Ultra Pass Pocket e check-in por QR Code",
  "Relatório consolidado das duas datas",
] as const;

/** O que continua com a marca. A liberação saiu daqui: quem arca é o Somma. */
export const CONDICAO_MICHELOB = [
  {
    icon: "tenda" as IconName,
    titulo: "Toolkit, produto, DJ e brindes",
    texto:
      "Transporte, montagem, desmontagem, produto para o trial, equipe de trial, DJ, brindes, mídia paga e estruturas adicionais seguem com a Michelob ou a agência.",
  },
] as const;

/** Datas que travam a operação. Hoje é 12 de agosto. */
export const PRAZOS = [
  {
    n: "01",
    data: "19 de agosto",
    titulo: "Aceite da proposta",
    texto: "Prazo para o dia 29 acontecer com divulgação, inscrição e produção em pé.",
    marco: true,
  },
  {
    n: "02",
    data: "Logo após o aceite",
    titulo: "Entrada da liberação",
    texto:
      "O Somma dá entrada no despachante para as duas datas, e o prazo do órgão é o mais lento da operação.",
  },
  {
    n: "03",
    data: "29 de agosto",
    titulo: "Capítulo 1",
    texto: "Ultra Opening Run no Somma Day de agosto.",
  },
  {
    n: "04",
    data: "26 de setembro",
    titulo: "Capítulo 2",
    texto: "Ultra Return e fechamento da temporada.",
  },
] as const;

export const PAGAMENTO =
  "Proposta de pagamento: 50% no fechamento do contrato e 50% até 15 dias após o capítulo 2. Se o aceite passar de 19 de agosto, a temporada corre para 26 de setembro e 31 de outubro, mantendo o mesmo formato e a mesma condição.";

/* ── Slide 12 · Escopo do fee ────────────────────────────────────────────── */

export const ESCOPO_FEE = [
  { frente: "Estratégia, conceito e planejamento", capitulos: "2 ativações", mes: "4 ativações" },
  { frente: "Landing page com inscrição e confirmação", capitulos: "Sim", mes: "Sim" },
  { frente: "Chamada, divulgação e mobilização da comunidade", capitulos: "2 datas", mes: "Recorrente" },
  { frente: "Mídia nos canais Somma e influenciadores da base", capitulos: "Sim", mes: "Recorrente" },
  { frente: "Comunicação e CRM", capitulos: "Básico", mes: "Recorrente" },
  {
    frente: "Operação esportiva com professores e pacers",
    capitulos: "2 sábados",
    mes: "4 semanas",
  },
  { frente: "Check-in por QR Code", capitulos: "Sim", mes: "Sim" },
  { frente: "Passaporte digital", capitulos: "Pocket, 2 selos", mes: "Ultra Pass, 4 selos" },
  { frente: "Leitura de recorrência", capitulos: "Entre as 2 datas", mes: "4 semanas" },
  { frente: "Desafios esportivos", capitulos: "Perfect Pace", mes: "Perfect Pace, Relay e outros" },
  { frente: "Gestão de insiders", capitulos: "2 ativações", mes: "Recorrente" },
  { frente: "Conteúdo, reels e vídeos curtos", capitulos: "2 coberturas", mes: "4 coberturas" },
  { frente: "Dados de participantes e frequência", capitulos: "Sim", mes: "Sim" },
  { frente: "Relatório", capitulos: "Consolidado das 2 datas", mes: "Consolidado do mês" },
  { frente: "Somma Day patrocinado", capitulos: "2", mes: "1" },
  { frente: "Evento final aberto ao público", capitulos: "Não", mes: "Domingo, até mil pessoas" },
  { frente: "Liberação em espaço público", capitulos: "Incluso", mes: "Incluso" },
] as const;

/* ── Slide 13 · Evolução: o mês de ativação ──────────────────────────────── */

export const MES_BLOCOS = [
  { rotulo: "Duração", valor: "4 semanas" },
  { rotulo: "Formato", valor: "Mês de ativação" },
  { rotulo: "Evento final", valor: "Domingo, aberto" },
  { rotulo: "Investimento", valor: "R$ 50.000", apoio: "impostos e liberação inclusos" },
] as const;

export const MES_JORNADA = [
  {
    sabado: "Semana 1",
    ativacao: "Ultra Opening Run",
    experiencia: "Sábado. Lançamento da campanha, corrida temática, DJ, trial e brindes",
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

export const MES_CONDICOES = [
  {
    icon: "escala" as IconName,
    titulo: "Até 2 semanas de setup",
    texto:
      "Prazo para montar a campanha e alinhar tudo com a marca antes da primeira semana, com folga para aprovações, produção e divulgação.",
  },
  {
    icon: "comunidade" as IconName,
    titulo: "Evento final no Parque da Cidade",
    texto:
      "A quarta semana fecha em um domingo, no estacionamento 9, com evento aberto ao público e limitado a mil pessoas.",
  },
] as const;

export const MES_PONTE =
  "É o passo natural depois da temporada de dois capítulos: mesma mecânica, quatro semanas seguidas e um evento aberto de fechamento.";

/* ── Slide 14 · Recomendação ─────────────────────────────────────────────── */

export const RECOMENDACAO = {
  titulo: "Começar pelos dois capítulos",
  texto:
    "Duas datas dão à marca o que uma corrida isolada não dá: presença repetida, leitura de quem voltou e conteúdo em dois momentos. É investimento baixo para uma decisão que hoje ainda não tem dado por trás.",
  frase:
    "Não é aparecer em um treino. É ocupar dois Somma Days e sair com a resposta de quanto essa parceria vale.",
} as const;

export const RECOMENDACAO_PROVAS = [
  { icon: "comunidade" as IconName, titulo: "Presença", texto: "Público dos dois maiores sábados do bimestre." },
  { icon: "escala" as IconName, titulo: "Retorno", texto: "Quantos voltaram de agosto para setembro." },
  { icon: "trial" as IconName, titulo: "Experimentação", texto: "Trial medido nas duas datas." },
  { icon: "conteudo" as IconName, titulo: "Conteúdo", texto: "Duas coberturas e um recap de temporada." },
] as const;
