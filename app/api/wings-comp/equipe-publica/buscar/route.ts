import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/wings/supabase'

// GET /api/wings-comp/equipe-publica/buscar?q=HAL
// Busca por sigla (exata, case-insensitive) ou parte do nome.
// Retorna lista de matches com atletas pra usuário escolher e editar.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (q.length < 2) {
    return NextResponse.json({ error: 'Digite ao menos 2 caracteres.' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Busca: sigla exata case-insensitive OU nome contendo a string
  const { data, error } = await supabase
    .from('wings_comp_atleticas')
    .select('id, nome, sigla, cor, foto_url')
    .or(`sigla.ilike.${q},nome.ilike.%${q}%`)
    .order('nome', { ascending: true })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Hidrata atletas de cada equipe
  const equipes = data ?? []
  if (equipes.length === 0) return NextResponse.json({ equipes: [] })

  const ids = equipes.map(e => e.id)
  const { data: atletas } = await supabase
    .from('wings_comp_atletas')
    .select('id, atletica_id, nome, sexo, modalidade')
    .in('atletica_id', ids)

  const atletasPorAtletica = new Map<string, NonNullable<typeof atletas>>()
  for (const a of atletas ?? []) {
    const arr = atletasPorAtletica.get(a.atletica_id) ?? []
    arr.push(a)
    atletasPorAtletica.set(a.atletica_id, arr)
  }

  return NextResponse.json({
    equipes: equipes.map(e => ({
      ...e,
      atletas: (atletasPorAtletica.get(e.id) ?? []).slice().sort((x, y) => x.modalidade - y.modalidade),
    })),
  })
}
