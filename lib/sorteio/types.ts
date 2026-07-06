// lib/sorteio/types.ts

export type FiltrosSorteio = {
  evento_id: string
  sexo?: 'masculino' | 'feminino'
  pelotao?: '4km' | '6km' | '8km'
  data_inscricao?: string
  validacao?: 'todos' | 'validados' | 'pendentes'
}

export type ParticipanteSorteio = {
  id: string
  nome_completo: string
  email: string
  telefone: string
  cpf: string
  sexo: string
  pelotao: string
  data_hora_checkin: string
  validacao_do_checkin: boolean
  numero: number
}

export type EstatisticasSorteio = {
  total: number
  masculino: number
  feminino: number
  por_pelotao: Record<string, number>
  validados: number
  pendentes: number
}

export type Ganhador = {
  id: string
  sorteio_id: string
  checkin_id: string
  posicao: number
  numero_sorteado: number
  status: 'pendente' | 'confirmado' | 'ausente'
  confirmado_em: string | null
  substituido_por: string | null
  created_at: string
  checkin: {
    nome_completo: string
    email: string
    telefone: string
    cpf: string
    sexo: string
    pelotao: string
  }
  substituto?: Ganhador
}

export type Sorteio = {
  id: string
  evento_id: string
  titulo: string
  filtros_aplicados: FiltrosSorteio
  total_elegiveis: number
  created_at: string
  criado_por: string
  audit_hash: string | null
  ganhadores: Ganhador[]
}
