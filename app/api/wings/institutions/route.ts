import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/wings/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('institutions')
    .select('id, name')
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ institutions: data ?? [] })
}
