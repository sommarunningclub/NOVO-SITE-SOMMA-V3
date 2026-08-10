import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/wings/supabase'
import { isStaffAuthorized } from '@/lib/wings-cronometragem/auth'

export async function GET() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('wings_comp_config')
    .select('*')
    .eq('id', 'singleton')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ config: data })
}

export async function PATCH(req: NextRequest) {
  if (!(await isStaffAuthorized())) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const update: Record<string, unknown> = {}
  if ('final_liberada' in (body ?? {})) {
    update.final_liberada = !!body.final_liberada
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada a atualizar.' }, { status: 400 })
  }
  update.updated_at = new Date().toISOString()
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('wings_comp_config')
    .update(update)
    .eq('id', 'singleton')
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ config: data })
}
