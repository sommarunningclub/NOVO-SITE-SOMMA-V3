import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// `eventos` é dado PÚBLICO (RLS permite leitura anon). Usar a anon key desacopla
// a listagem da service-role — o check-in aberto na gestão sempre aparece no site.
export async function GET() {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ proximo_evento: null, historico: [] }, { status: 200 })
    }
    const today = new Date().toISOString().split('T')[0]

    // Próximos eventos (futuros ou abertos/bloqueados, excluindo encerrados e ocultos)
    const { data: upcoming, error: upErr } = await supabase
      .from('eventos')
      .select('id, titulo, data_evento, horario_inicio, local, local_url, tipo, checkin_status, pelotoes, descricao')
      .or(`data_evento.gt.${today},checkin_status.eq.aberto,checkin_status.eq.bloqueado`)
      .neq('checkin_status', 'encerrado')
      .eq('oculto_no_checkin_publico', false)
      .order('data_evento', { ascending: true })
      .limit(10)

    if (upErr) {
      console.error('[site] Erro ao buscar próximos eventos:', upErr)
    }

    const upcomingIds = (upcoming || []).map(e => e.id)

    // Histórico (últimos 30 dias, apenas encerrados)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: historico, error: histErr } = await supabase
      .from('eventos')
      .select('id, titulo, data_evento, local, checkin_status')
      .eq('checkin_status', 'encerrado')
      .eq('oculto_no_checkin_publico', false)
      .gte('data_evento', thirtyDaysAgo)
      .not('id', 'in', `(${upcomingIds.join(',')})`)
      .order('data_evento', { ascending: false })
      .limit(10)

    if (histErr) {
      console.error('[site] Erro ao buscar histórico:', histErr)
    }

    return NextResponse.json({
      proximos_eventos: upcoming || [],
      proximo_evento: upcoming?.[0] || null,
      historico: historico || [],
    })
  } catch (error) {
    console.error('[site] Erro em GET /api/eventos:', error)
    return NextResponse.json(
      { proximo_evento: null, historico: [] },
      { status: 500 }
    )
  }
}
