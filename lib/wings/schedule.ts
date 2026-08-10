export type ScheduleTag =
  | 'montagem'
  | 'staff'
  | 'abertura'
  | 'competicao'
  | 'energia'
  | 'coffee'
  | 'premiacao'
  | 'desmontagem'

export interface ScheduleBlock {
  id: string
  timeStart: string
  timeEnd: string
  title: string
  description: string
  details: string[]
  tags: ScheduleTag[]
  isHighlight: boolean
  isPublic: boolean
}

export const WINGS_SCHEDULE: ScheduleBlock[] = [
  {
    id: 'montagem',
    timeStart: '06:00',
    timeEnd: '07:30',
    title: 'Montagem e Testes',
    description: 'Preparação completa da estrutura antes da chegada do público.',
    details: [
      'Montagem de palco, estrutura sonora e iluminação',
      'Teste de som e energia — DJ faz soundcheck',
      'Posicionamento de tendas, coffee break e Red Bull',
      'Instalação das 31 bandeiras das atléticas ao longo da pista',
    ],
    tags: ['montagem'],
    isHighlight: false,
    isPublic: false,
  },
  {
    id: 'credenciamento-staff',
    timeStart: '07:30',
    timeEnd: '08:00',
    title: 'Credenciamento de Staffs',
    description: 'Recebimento, identificação e alocação de toda a equipe operacional.',
    details: [
      'Distribuição de coletes e identificação por função',
      '1 staff alocado por equipe competidora',
      'Briefing rápido com coordenação — regras e dinâmicas da competição',
      'Definição de postos: pista, portões, coffee, som e palco',
    ],
    tags: ['staff'],
    isHighlight: false,
    isPublic: false,
  },
  {
    id: 'abertura',
    timeStart: '08:00',
    timeEnd: '08:40',
    title: 'Abertura dos Portões',
    description: 'Chegada dos participantes, recepção e ambientação na pista.',
    details: [
      'Portões abertos — DJ já tocando na abertura',
      'Distribuição de Red Bull na entrada',
      'Içamento das 31 bandeiras das atléticas na pista',
      'Alocação dos times nas raias e áreas de aquecimento',
      'Foto oficial das bandeiras com todas as atléticas reunidas',
    ],
    tags: ['abertura', 'energia'],
    isHighlight: true,
    isPublic: true,
  },
  {
    id: 'recepcao',
    timeStart: '08:40',
    timeEnd: '09:00',
    title: 'Recepção e Apresentação Geral',
    description: 'Abertura oficial do evento com apresentação de todas as atléticas.',
    details: [
      'Recepção oficial conduzida pela Atlética Halterada',
      'Apresentação das 31 atléticas participantes (UNB e CEUB)',
      'Explicação completa das dinâmicas da competição',
      'Apresentação dos parceiros: Somma Club, Red Bull e Wings for Life',
      'Explicação sobre a corrida Wings for Life e seus prêmios',
    ],
    tags: ['abertura'],
    isHighlight: true,
    isPublic: true,
  },
  {
    id: 'hack-energia',
    timeStart: '09:00',
    timeEnd: '09:15',
    title: 'Hack de Energia',
    description: 'Surpresa interna — não exibida no cronograma público para preservar o impacto.',
    details: [
      'Bloco mantido apenas no schedule operacional/staff',
      'Não deve aparecer na página pública',
    ],
    tags: ['energia'],
    isHighlight: true,
    isPublic: false,
  },
  {
    id: 'competicao',
    timeStart: '09:15',
    timeEnd: '10:30',
    title: 'Aquecimento + Competição — 2 revezamentos 4×100m',
    description:
      'O coração do evento. Cada equipe corre 2 provas (atletismo + dinâmica) — soma dos tempos define a classificação.',
    details: [
      'FORMATO: 4 atletas por equipe (2 masculinos + 2 femininas)',
      'PROVA 1 — REVEZAMENTO 4×100m ATLETISMO: corrida normal tradicional, 100m por atleta',
      'PROVA 2 — REVEZAMENTO 4×100m DINÂMICO: cada atleta em um estilo diferente',
      'MODALIDADE 1 — CORRIDA SALTADA: avança em saltos com os dois pés juntos',
      'MODALIDADE 2 — CORRIDA LATERAL ESQUERDA: percorre os 100m correndo de lado pra esquerda',
      'MODALIDADE 3 — CORRIDA DE COSTAS: pode olhar pra trás, proibido girar o tronco pra frente',
      'MODALIDADE 4 — CORRIDA LATERAL DIREITA: percorre os 100m correndo de lado pra direita',
      'RESULTADO: tempo combinado = atletismo + dinâmica (menor soma vence)',
      'CLASSIFICAÇÃO: as 8 menores somas combinadas avançam para a final',
      'FINAL: as 3 equipes com menor tempo total são premiadas',
      '4 equipes competem por bateria · 1 staff cronometrista por equipe',
      'Cronometragem oficial por staff · resultado afixado em placar ao vivo',
    ],
    tags: ['competicao'],
    isHighlight: true,
    isPublic: true,
  },
  {
    id: 'coffee-fitdance',
    timeStart: '10:30',
    timeEnd: '11:30',
    title: 'Coffee Break + Fit Dance',
    description: 'Intervalo com coffee liberado para todos e atividade de Fit Dance no palco.',
    details: [
      'Coffee break aberto para todos os participantes e staff',
      'Red Bull disponível nas estações',
      'Fit Dance no palco com participação geral e premiação surpresa',
      'DJ mantém o set durante todo o intervalo',
      'Momento de confraternização entre as atléticas',
    ],
    tags: ['coffee', 'energia'],
    isHighlight: true,
    isPublic: true,
  },
  {
    id: 'premiacao',
    timeStart: '11:30',
    timeEnd: '12:00',
    title: 'Premiações e Encerramento',
    description: 'Cerimônia de pódio, entrega de prêmios e engajamento para a corrida Wings for Life.',
    details: [
      'Cerimônia de pódio — Top 3 do Revezamento 4×100m',
      'Entrega de premiações às equipes vencedoras',
      'Apresentação dos prêmios da corrida Wings for Life',
      'Chamada de engajamento para a corrida Wings for Life World Run',
      'Foto oficial de encerramento com todas as atléticas',
      'Agradecimentos finais: Somma Club, Red Bull, Wings for Life',
    ],
    tags: ['premiacao'],
    isHighlight: true,
    isPublic: true,
  },
  {
    id: 'desmontagem',
    timeStart: '13:00',
    timeEnd: '14:00',
    title: 'Desmontagem',
    description: 'Recolhimento e desmontagem completa de toda a estrutura.',
    details: [
      'Recolhimento das 31 bandeiras das atléticas',
      'Desmontagem de palco, som e iluminação',
      'Limpeza e liberação do espaço no Centro Olímpico — CO UnB',
      'Toda equipe de staff permanece até a desmontagem total',
    ],
    tags: ['desmontagem'],
    isHighlight: false,
    isPublic: false,
  },
]

export const TAG_LABEL: Record<ScheduleTag, string> = {
  montagem: 'Montagem',
  staff: 'Staff',
  abertura: 'Abertura',
  competicao: 'Competição',
  energia: 'Energia',
  coffee: 'Coffee',
  premiacao: 'Premiação',
  desmontagem: 'Desmontagem',
}

export const TAG_CLASSES: Record<ScheduleTag, string> = {
  competicao: 'bg-wfl-red text-white',
  energia: 'bg-wfl-yellow text-wfl-navy',
  coffee: 'bg-[#7B4F2E] text-white',
  abertura: 'bg-wfl-navy text-white',
  premiacao: 'bg-[#1a1a1a] text-wfl-yellow',
  montagem: 'bg-wfl-border text-wfl-dark',
  staff: 'bg-wfl-border text-wfl-dark',
  desmontagem: 'bg-wfl-border text-wfl-dark',
}

/**
 * Identifica detalhes formatados como "PALAVRA — descrição"
 * para renderizar como sub-cabeçalho destacado.
 */
export function parseDetail(detail: string): { heading: string | null; body: string } {
  const match = detail.match(/^([A-ZÀ-Ú0-9 ]+?)\s—\s(.+)$/)
  if (!match) return { heading: null, body: detail }
  return { heading: match[1].trim(), body: match[2].trim() }
}
