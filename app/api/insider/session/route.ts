import { NextResponse } from 'next/server'
import { getInsiderSession } from '@/lib/auth/insider'

export const dynamic = 'force-dynamic'

export async function GET() {
  const insider = await getInsiderSession()
  if (!insider) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({ authenticated: true, insider })
}
