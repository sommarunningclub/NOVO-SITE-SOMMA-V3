// lib/sorteio/utils.ts

export function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const randomBuffer = new Uint32Array(1)
    crypto.getRandomValues(randomBuffer)
    const j = randomBuffer[0] % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function formatDateTime(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export function descricaoFiltros(filtros: Record<string, unknown>): string {
  const partes: string[] = []
  if (filtros.sexo && filtros.sexo !== 'todos') {
    partes.push(filtros.sexo === 'masculino' ? 'Masculino' : 'Feminino')
  }
  if (filtros.pelotao) partes.push(`${filtros.pelotao}`)
  if (filtros.validacao === 'validados') partes.push('Validados')
  if (filtros.validacao === 'pendentes') partes.push('Pendentes')
  if (filtros.data_inscricao) partes.push(`Dia ${formatDate(filtros.data_inscricao as string)}`)
  return partes.length > 0 ? partes.join(' · ') : 'Sem filtros'
}

/**
 * Gera hash SHA-256 da lista de IDs dos candidatos + ganhadores + timestamp.
 * Serve como prova de auditoria do sorteio — qualquer adulteração muda o hash.
 */
export async function gerarHashAuditoria(payload: {
  candidatoIds: string[]
  ganhadorIds: string[]
  timestamp: string
  eventoId: string
}): Promise<string> {
  const texto = JSON.stringify(payload)
  const encoder = new TextEncoder()
  const data = encoder.encode(texto)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export type SorteioCSVRow = {
  posicao: number
  nome: string
  email: string
  telefone: string
  cpf: string
  sexo: string
  pelotao: string
  status: string
  numero_sorteado: number
}

export function exportarCSV(rows: SorteioCSVRow[], nomeArquivo: string) {
  const cabecalho = ['Posição', 'Nome', 'Email', 'Telefone', 'CPF', 'Sexo', 'Pelotão', 'Status', 'Número Sorteado']
  const linhas = rows.map(r => [
    r.posicao,
    `"${r.nome}"`,
    r.email,
    r.telefone,
    r.cpf,
    r.sexo,
    r.pelotao,
    r.status,
    r.numero_sorteado,
  ].join(','))
  const csv = [cabecalho.join(','), ...linhas].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${nomeArquivo}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
