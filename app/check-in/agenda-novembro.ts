/**
 * Agenda de novembro/2026 na vitrine do /check-in: os encontros que ainda vão
 * abrir check-in, cada um na identidade do carrossel de novembro (cores,
 * números e lâminas vêm de lá; as lâminas estão em public/check-in/novembro).
 *
 * É só vitrine: nada aqui deixa alguém se inscrever. Cada item some sozinho
 * quando a data passa ou quando a gestão cria o evento de verdade na mesma
 * data (aí o card real, com o check-in dele, toma o lugar).
 *
 * Textos só com o que o carrossel já promete. Sem travessão na copy.
 *
 * O 28/11 fica como surpresa até o Alex liberar: nem nome, nem parceiro, nem
 * local, nem lâmina no código (o bundle é público). Para revelar, trocar o item
 * por um com identidade própria, como os outros.
 */

export type IdentidadeAgenda = 'dex' | 'bora' | 'mu' | 'surpresa'

export type ItemAgenda = {
  /** yyyy-mm-dd */
  data: string
  identidade: IdentidadeAgenda
  /** Título do ingresso. O da BORA troca o nome pelo logo. */
  titulo: string
  subtitulo: string
  /** Vazio no evento surpresa. */
  local?: string
  /** Complemento do local (ponto de referência). */
  localDetalhe?: string
  /** Lâmina do carrossel, mostrada na folha de detalhes. Sem ela, o ingresso não abre folha. */
  lamina?: string
  /** O que esperar, em linhas curtas. */
  destaques: string[]
  /** Aviso legal ou de faixa etária. */
  aviso?: string
  selo?: string
}

const BASE = '/check-in/novembro'

export const AGENDA_NOVEMBRO: ItemAgenda[] = [
  {
    data: '2026-11-07',
    identidade: 'dex',
    titulo: 'Dexcomplica Love Run',
    subtitulo: 'ft. SOMMA Club',
    local: 'Parque da Cidade, Estacionamento 1',
    lamina: `${BASE}/lamina-07-11.jpg`,
    destaques: ['100% gratuito, vagas limitadas', 'After no Oscarito Bar', 'Produção MONU'],
  },
  {
    data: '2026-11-14',
    identidade: 'bora',
    titulo: 'SOMMA Club ft. BORA',
    subtitulo: 'Assessoria',
    local: 'Parque da Cidade, Estacionamento 10',
    lamina: `${BASE}/lamina-14-11.jpg`,
    destaques: ['Encontro com a BORA, a assessoria oficial do SOMMA'],
  },
  {
    data: '2026-11-21',
    identidade: 'mu',
    titulo: 'SOMMA Club ft. Michelob Ultra',
    subtitulo: 'Ultra Pass',
    local: 'Parque da Cidade, Estacionamento 8',
    lamina: `${BASE}/lamina-21-11.jpg`,
    destaques: [
      'Corrida, DJ, degustação, brindes e sorteios',
      'Apareceu, ganhou o selo: janeiro com cortesia',
    ],
    aviso: 'Evento para maiores de 18 anos. Beba com moderação.',
    selo: '+18',
  },
  {
    data: '2026-11-28',
    identidade: 'surpresa',
    titulo: 'Evento surpresa',
    subtitulo: 'Revelamos em breve',
    destaques: [],
  },
]

/** Fechamento do ano, fora dos ingressos de novembro. */
export const SOMMA_DAY = {
  data: '2026-12-05',
  lamina: `${BASE}/lamina-05-12.jpg`,
}

/** Hoje em Brasília, yyyy-mm-dd. Igual no servidor e no navegador. */
export function hojeEmBrasilia(agora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora)
}

/** Dias corridos entre duas datas yyyy-mm-dd. */
export function diasAte(data: string, hoje: string): number {
  const [a, b] = [data, hoje].map(d => {
    const [y, m, dia] = d.split('-').map(Number)
    return Date.UTC(y, m - 1, dia)
  })
  return Math.round((a - b) / 86_400_000)
}

export function textoContagem(dias: number): string {
  if (dias <= 0) return 'É hoje'
  if (dias === 1) return 'É amanhã'
  return `Faltam ${dias} dias`
}
