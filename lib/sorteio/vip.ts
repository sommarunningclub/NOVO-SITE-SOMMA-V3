// lib/sorteio/vip.ts
// Cruzamento do público do sorteio (check-ins) com a lista VIP do Na Praia.
// A chave é o CPF em dígitos: a lista VIP guarda formatado, os check-ins variam.

import type { SupabaseClient } from '@supabase/supabase-js'

export type FiltroVip = 'todos' | 'somente' | 'excluir'

const PAGINA = 1000

function soDigitos(valor: string | null | undefined) {
  return (valor || '').replace(/\D/g, '')
}

export function normalizarFiltroVip(valor: unknown): FiltroVip {
  return valor === 'somente' || valor === 'excluir' ? valor : 'todos'
}

/** Lê todos os CPFs da lista VIP, paginando (o PostgREST devolve no máximo 1000 por vez). */
export async function carregarCpfsVip(supabase: SupabaseClient): Promise<Set<string>> {
  const cpfs = new Set<string>()

  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await supabase
      .from('napraia_lista_vip')
      .select('cpf')
      .range(inicio, inicio + PAGINA - 1)

    if (error) throw new Error(`Lista VIP: ${error.message}`)

    for (const linha of data || []) {
      const cpf = soDigitos(linha.cpf as string | null)
      if (cpf.length === 11) cpfs.add(cpf)
    }

    if (!data || data.length < PAGINA) break
  }

  return cpfs
}

export function ehVip(cpf: string | null | undefined, cpfsVip: Set<string>) {
  const normalizado = soDigitos(cpf)
  return normalizado.length === 11 && cpfsVip.has(normalizado)
}

export function aplicarFiltroVip<T extends { cpf: string | null }>(
  lista: T[],
  filtro: FiltroVip,
  cpfsVip: Set<string>,
): T[] {
  if (filtro === 'todos') return lista
  return lista.filter(p => ehVip(p.cpf, cpfsVip) === (filtro === 'somente'))
}
