import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/wings/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const institutionId = req.nextUrl.searchParams.get('institution_id')
  if (!institutionId) {
    return NextResponse.json({ error: 'institution_id obrigatório' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('atleticas')
    .select('id, name')
    .eq('institution_id', institutionId)
    .eq('is_active', true)
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ atleticas: data ?? [] })
}
