import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ inscricoes_abertas: true })
    const supabase = createClient(url, key)
    const { data } = await supabase.from('config_shakeout').select('inscricoes_abertas').eq('id', 1).maybeSingle()
    return NextResponse.json({ inscricoes_abertas: data?.inscricoes_abertas ?? true })
  } catch {
    return NextResponse.json({ inscricoes_abertas: true })
  }
}
