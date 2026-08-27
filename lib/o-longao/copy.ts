import {
  EVENTO,
  FORMATO,
  PREMIACAO,
  PREMIACAO_POR_CATEGORIA,
  PREMIACAO_TOTAL,
  formataReais,
  rotuloPremio,
} from "./config";

/**
 * Toda a voz do O LONGÃO mora aqui.
 *
 * Nenhum componente da landing tem literal de copy relevante: mudou o tom,
 * muda-se neste arquivo. Regra da casa: direto, provocativo, brasileiro,
 * sem clichê de corrida ("supere seus limites" é proibido) e sem travessão.
 */

export const HERO = {
  titulo: ["O LONGÃO"],
  kicker: "Competição de revezamento em esteira",
  mote: EVENTO.mote,
  frase: EVENTO.frase,
  convocacao: EVENTO.convocacao,
  ctaPrimario: "INSCREVA SUA CREW",
  ctaSecundario: "ENTENDA O DESAFIO",
  relogio: "24:00:00",
  /** Rótulos da barra de crédito da primeira dobra. */
  rotuloRealizacao: "Realização",
  rotuloMaster: "Powered by",
  realizacao: "EVOLVE + SOMMA CLUB",
  master: "POWERED BY STAR TRAC",
} as const;

/**
 * O argumento do equipamento, na primeira dobra.
 *
 * A Star Trac não entra como logo carimbada: entra explicando por que uma
 * esteira comum não atravessa uma madrugada. É isso que transforma o
 * patrocínio em conteúdo, e é por isso que este bloco vive no hero e não só
 * na seção dedicada.
 */
export const HERO_MAQUINA = {
  rotulo: "A máquina",
  selo: "Equipamento oficial de competição",
  chamada: "Esteira comum não atravessa uma madrugada.",
  texto:
    "Star Trac é a infraestrutura oficial do Longão. Motor dimensionado para uso contínuo, plataforma estável em qualquer pace e telemetria alimentando o placar ao vivo.",
  cta: "Ver o equipamento",
  specs: [
    { rotulo: "Regime", valor: "24h direto" },
    { rotulo: "Por crew", valor: `${FORMATO.esteirasPorEquipe} esteira` },
    { rotulo: "Telemetria", valor: "Ao vivo" },
  ],
} as const;

/** Frases curtas que pontuam a página. Cada seção pesca a sua. */
export const FRASES = {
  seuLongao: "Seu longão acaba quando?",
  sabadoDomingo: "Começa no sábado. Termina no domingo.",
  madrugadaSepara: "A madrugada separa quem corre de quem compete.",
  trocaDecide: "Uma troca pode decidir 24 horas.",
  paceConfortavel: "Não existe pace confortável às 4h17 da manhã.",
  dormirEstrategia: "Dormir também faz parte da estratégia.",
  vcNaoPrecisa: "Você não precisa correr durante 24 horas. Sua crew precisa.",
  umParaOutroComeça: "Quando um para, outro começa.",
  relogioNaoPara: "O relógio nunca para.",
  melhorEquipe: "Não é sobre o melhor corredor. É sobre a melhor equipe.",
  brasiliaDorme: "Enquanto Brasília dorme, O Longão continua.",
} as const;

export const TICKER_ITENS = [
  "24 HORAS",
  "UMA ESTEIRA",
  "UMA EQUIPE",
  "O RELÓGIO NÃO PARA",
  "MAIOR DISTÂNCIA VENCE",
  "SÁBADO ATÉ DOMINGO",
  "BRASÍLIA, DF",
] as const;

export const PROVOCACAO = {
  pergunta: "Você chama isso de longão?",
  distancias: ["20 KM", "30 KM", "42 KM"],
  resposta: "24 HORAS",
  fecho: "Isso é O Longão.",
} as const;

export const CONCEITO = {
  kicker: "O CONCEITO",
  texto:
    "O Longão coloca crews do Distrito Federal frente a frente em uma competição de revezamento em esteira. Cada equipe recebe uma esteira. Um atleta corre por vez. As trocas são livres. O relógio não para. A distância continua acumulando.",
  fecho: "Depois de 24 horas, vence quem tiver ido mais longe.",
  pilares: ["UMA EQUIPE", "UMA ESTEIRA", "24 HORAS", "MAIOR DISTÂNCIA VENCE"],
} as const;

export const SELETIVA = {
  fase: "FASE 01",
  titulo: "A SELETIVA",
  intro:
    "Todas as crews inscritas participam de uma classificatória realizada em uma unidade Evolve. O objetivo é um só: acumular a maior distância possível em 120 minutos.",
  passos: [
    { rotulo: "EQUIPE", valor: "8 atletas", texto: "Todos os oito precisam correr. Ninguém assiste da grade." },
    { rotulo: "MÁQUINA", valor: "1 esteira Star Trac", texto: "A mesma para todo mundo. A diferença é quem pisa nela." },
    { rotulo: "TEMPO", valor: "2 horas", texto: "Cento e vinte minutos com o relógio correndo contra todas as crews." },
    { rotulo: "TROCAS", valor: "Livres", texto: "Troque quando quiser. Cada segundo de transição custa metros." },
  ],
  ranking:
    "Depois de todas as baterias, sai o ranking geral por distância. Classificam 4 equipes masculinas e 4 femininas.",
  numeros: [
    { valor: "8", rotulo: "ATLETAS" },
    { valor: "120", rotulo: "MINUTOS" },
    { valor: "1", rotulo: "ESTEIRA" },
    { valor: "∞", rotulo: "TROCAS" },
    { valor: "4 + 4", rotulo: "FINALISTAS" },
  ],
  fecho: "A seletiva decide quem merece chegar às 24 horas.",
} as const;

export const FINAL = {
  fase: "FASE 02",
  titulo: "ENTÃO COMEÇA O LONGÃO.",
  subtitulo: "Sábado começa. Domingo termina.",
  texto:
    "As quatro melhores crews masculinas e as quatro melhores femininas recebem uma esteira exclusiva. A partir da largada, é uma competição ininterrupta de 24 horas. Um corredor por vez. Trocas ilimitadas. Estratégia livre. O relógio nunca para.",
  fecho: "A MAIOR DISTÂNCIA VENCE.",
} as const;

export const ESTRATEGIA = {
  kicker: "A ESTRATÉGIA",
  intro: "Velocidade sozinha não atravessa uma madrugada. O Longão se ganha em quatro frentes.",
  pilares: [
    { titulo: "PACE", texto: "Quanto cada atleta consegue sustentar. Não no primeiro turno. No quarto." },
    { titulo: "TROCAS", texto: "Quando trocar pode decidir a prova. Segundos parados viram metros perdidos." },
    { titulo: "RECOVERY", texto: "Quem consegue voltar melhor. O segundo turno de cada atleta conta a verdade." },
    { titulo: "SONO", texto: "Quem estará inteiro quando chegar a madrugada. Escalar quem dorme é tática." },
  ],
  fecho: "O corredor mais rápido não necessariamente vence. A melhor equipe vence.",
} as const;

export const CATEGORIAS = {
  kicker: "CATEGORIAS",
  itens: [
    { titulo: "MASCULINO", vagas: `${FORMATO.finalistasPorCategoria} finalistas` },
    { titulo: "FEMININO", vagas: `${FORMATO.finalistasPorCategoria} finalistas` },
  ],
  nota: "As categorias competem separadamente. Uma mesma crew pode inscrever equipes nas duas.",
} as const;

export const PREMIO = {
  titulo: `${formataReais(PREMIACAO_TOTAL)} EM PREMIAÇÃO`,
  subtitulo: "Duas categorias. Um objetivo. Ir mais longe.",
  categorias: ["Masculino", "Feminino"],
  /**
   * A leitura que não pode ficar ambígua: os R$ 20.000 são de CADA categoria,
   * não um bolo dividido entre elas. A campeã masculina leva 20 mil e a
   * campeã feminina leva 20 mil.
   */
  destaquePorCategoria: `${formataReais(PREMIACAO_POR_CATEGORIA)} para a crew campeã de cada categoria`,
  linhaMasculino: `${formataReais(PREMIACAO_POR_CATEGORIA)} · CREW CAMPEÃ MASCULINA`,
  linhaFeminino: `${formataReais(PREMIACAO_POR_CATEGORIA)} · CREW CAMPEÃ FEMININA`,
  distribuicao: PREMIACAO.porCategoria.map((p) => ({
    posicao: `${p.posicao}º lugar`,
    valor: rotuloPremio(p.valor),
    surpresa: p.valor === null,
  })),
  surpresaTitulo: "2º E 3º LUGARES",
  surpresaTexto:
    "Também sobem no pódio com premiação, mas essa a gente não conta agora. Fica a surpresa para o dia.",
  total: formataReais(PREMIACAO_TOTAL),
  totalNota: `${formataReais(PREMIACAO_POR_CATEGORIA)} por categoria, somando ${formataReais(PREMIACAO_TOTAL)} em dinheiro`,
  nota: "A premiação é por equipe. O rateio é decisão da crew.",
} as const;

export const QUEM_PARTICIPA = {
  kicker: "QUEM PODE PARTICIPAR",
  perfis: [
    "Crew de corrida",
    "Assessoria esportiva",
    "Running club",
    "Clube esportivo",
    "Grupo organizado de corredores",
  ],
  texto: "Cada equipe representa uma comunidade. O título pertence à crew.",
} as const;

export const EQUIPE = {
  kicker: "MONTE SUA EQUIPE",
  itens: [
    { valor: "8", rotulo: "TITULARES", texto: "Os oito que assinam a distância." },
    { valor: "2", rotulo: "RESERVAS", texto: "Até dois. Lesão e imprevisto não podem tirar a crew da prova." },
    { valor: "1", rotulo: "CAPITÃO", texto: "Quem decide a escala, as trocas e quem encara a madrugada." },
    { valor: "M/F", rotulo: "CATEGORIA", texto: "Masculina ou feminina. Ou as duas, com duas equipes." },
  ],
} as const;

export const ARENA = {
  kicker: "A ARENA",
  titulo: "Não é uma academia. É um grid de largada.",
  texto:
    "A Evolve vira o palco do Longão: esteiras Star Trac alinhadas, um box por crew e a prova inteira acontecendo na frente de quem veio ver.",
  itens: [
    "Esteiras Star Trac",
    "Boxes das crews",
    "Área de recovery",
    "Leaderboard ao vivo",
    "Telões",
    "Narrador",
    "DJ",
    "Torcida",
    "Área de atletas",
    "Hidratação",
    "Conteúdo ao vivo",
  ],
} as const;

export const STAR_TRAC = {
  kicker: "POWERED BY",
  titulo: "24 HORAS EXIGEM OUTRO NÍVEL DE EQUIPAMENTO.",
  texto:
    "A Star Trac é a infraestrutura oficial de competição do Longão. Cada crew corre as 24 horas inteiras sobre uma única máquina, e a máquina não pode ser a variável. Motor dimensionado para uso contínuo, plataforma estável em qualquer pace e telemetria que alimenta o placar em tempo real.",
  slots: [
    { rotulo: "MODELO", valor: "A anunciar" },
    { rotulo: "USO CONTÍNUO", valor: "24 horas por equipe" },
    { rotulo: "TELEMETRIA", valor: "Distância, pace e trocas ao vivo" },
    { rotulo: "MÁQUINAS NA ARENA", valor: "8 + reservas" },
  ],
} as const;

export const DIGITAL = {
  kicker: "EXPERIÊNCIA DIGITAL BY SOMMA",
  titulo: "A prova inteira, em dados, ao vivo.",
  texto:
    "Toda a camada digital do Longão é criada pelo Somma Club. Durante as 24 horas, qualquer pessoa acompanha a disputa em tempo real, de dentro da arena ou de casa.",
  metricas: [
    "Ranking ao vivo",
    "Distância de cada crew",
    "Atleta em pista",
    "Velocidade atual",
    "Número de trocas",
    "Parciais por hora",
    "Projeção de quilometragem",
    "Diferença para o líder",
    "Performance individual",
  ],
  demoAviso: "DEMONSTRAÇÃO",
  demoNota: "Dados ilustrativos. O placar real será conectado aos dados do evento.",
} as const;

/** Dados fictícios do painel simulado. Nunca apresentar como reais. */
export const DEMO_DASHBOARD = {
  lider: {
    posicao: "1º",
    crew: "CREW A",
    km: "287.4 KM",
    gap: "+3.2 KM",
    pace: "PACE ATUAL 4:05",
    atleta: "ATLETA 07",
    trocas: "18 TROCAS",
  },
  leaderboard: [
    { pos: 1, crew: "CREW ALPHA", km: "312,8 KM" },
    { pos: 2, crew: "CREW BRAVO", km: "309,4 KM" },
    { pos: 3, crew: "CREW CHARLIE", km: "301,7 KM" },
    { pos: 4, crew: "CREW DELTA", km: "298,2 KM" },
  ],
} as const;

export const CREWS_GRID = {
  kicker: "AS CREWS",
  titulo: "O grid está aberto.",
  vazio: "As primeiras crews inscritas aparecem aqui. A sua pode abrir o grid.",
} as const;

export const FAQ: readonly { p: string; r: string }[] = [
  {
    p: "Quem pode participar?",
    r: "Crews de corrida, assessorias esportivas, running clubs, clubes esportivos e grupos organizados de corredores do Distrito Federal e região. A inscrição é sempre por equipe, nunca individual.",
  },
  {
    p: "Quantos atletas cada equipe precisa ter?",
    r: `${FORMATO.titulares} titulares, além de 1 capitão (que pode ser um dos atletas) e 1 responsável pela inscrição.`,
  },
  {
    p: "Posso cadastrar reservas?",
    r: `Sim, até ${FORMATO.reservasMax} por equipe. Reserva entra no lugar de titular em caso de lesão ou imprevisto, conforme o regulamento.`,
  },
  {
    p: "Posso competir em mais de uma crew?",
    r: "Não. Cada CPF corre por uma única equipe na edição. A mesma crew, porém, pode inscrever uma equipe masculina e uma feminina, com atletas diferentes.",
  },
  {
    p: "Como funciona a seletiva?",
    r: "Baterias classificatórias em uma unidade Evolve: cada equipe recebe uma esteira Star Trac e tem 2 horas para acumular a maior distância possível, com trocas livres. Ao final de todas as baterias sai o ranking geral.",
  },
  {
    p: "Quanto tempo dura a seletiva?",
    r: `${FORMATO.seletivaMinutos} minutos por equipe, direto, sem pausa no relógio.`,
  },
  {
    p: "Todos os atletas precisam correr?",
    r: "Na seletiva, sim: os 8 titulares precisam passar pela esteira. Na final de 24 horas a escala é livre, mas só atletas inscritos podem correr.",
  },
  {
    p: "Quantas crews passam para a final?",
    r: `${FORMATO.finalistasPorCategoria} equipes masculinas e ${FORMATO.finalistasPorCategoria} femininas, pelas maiores distâncias da seletiva.`,
  },
  {
    p: "Como funciona a final?",
    r: "Sábado às 9h a prova larga. Cada crew tem uma esteira exclusiva, um corredor por vez, trocas ilimitadas. Domingo às 9h a esteira trava e vence quem acumulou a maior distância.",
  },
  {
    p: "A esteira pode parar?",
    r: "Pode, mas o relógio não. Durante uma troca ou uma pausa da equipe a esteira fica vazia e a distância simplesmente para de acumular. Cada segundo parado é quilometragem que não volta.",
  },
  {
    p: "Quantas trocas posso fazer?",
    r: "Quantas a estratégia da crew mandar. Não existe limite.",
  },
  {
    p: "Existe tempo mínimo por corredor?",
    r: "Na final, não. O regulamento define apenas critérios de segurança. Na seletiva, a única exigência é que todos os 8 corram.",
  },
  {
    p: "Quem recebe a premiação?",
    r: "A equipe, por meio do responsável ou capitão indicado na inscrição. O rateio interno é decisão da crew.",
  },
  {
    p: "A premiação é individual?",
    r: `Não, é por equipe. A crew campeã de cada categoria leva ${formataReais(PREMIACAO_POR_CATEGORIA)}: são ${formataReais(PREMIACAO_POR_CATEGORIA)} para a campeã masculina e ${formataReais(PREMIACAO_POR_CATEGORIA)} para a campeã feminina, somando ${PREMIO.total}. O rateio dentro da crew é decisão dela.`,
  },
  {
    p: "Quando acontece a seletiva?",
    r: `A janela prevista é ${EVENTO.seletiva.janela}. A data exata será anunciada às crews inscritas e no Instagram do Somma Club.`,
  },
  {
    p: "Quando acontece a final?",
    r: `${EVENTO.final.janela}, de um sábado às ${EVENTO.final.largada} até o domingo às ${EVENTO.final.chegada}. Data exata em anúncio.`,
  },
  {
    p: "Onde acontecerá o evento?",
    r: `Em ${EVENTO.cidade}. Seletiva e final acontecem em unidade Evolve, com a arena da final a ser anunciada.`,
  },
];

export const CTA_FINAL = {
  kicker: "INSCRIÇÕES ABERTAS",
  titulo: ["INSCREVA", "SUA CREW"],
  texto: "O grid é limitado e a seletiva decide tudo. Coloque sua comunidade na disputa.",
  cta: "INSCREVA SUA CREW",
} as const;

export const CONFIRMACAO = {
  titulo: "VOCÊ ESTÁ NO LONGÃO.",
  subtitulo: "SUA CREW ESTÁ NA DISPUTA.",
  compartilhar: "COMPARTILHAR INSCRIÇÃO",
  proximosPassos: [
    "Confira o e-mail de confirmação enviado ao responsável.",
    "A organização valida os dados da crew e aprova a inscrição.",
    "A data e a bateria da seletiva chegam por e-mail e WhatsApp.",
    "Prepare a escala: 2 horas, 8 atletas, 1 esteira.",
  ],
} as const;
