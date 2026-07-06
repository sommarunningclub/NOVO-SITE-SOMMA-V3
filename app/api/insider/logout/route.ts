import { NextResponse } from 'next/server'
import { clearInsiderSessionCookie } from '@/lib/auth/insider'

export async function POST() {
  await clearInsiderSessionCookie()
  return NextResponse.json({ success: true })
}
