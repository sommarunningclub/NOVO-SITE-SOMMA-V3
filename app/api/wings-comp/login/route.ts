import { NextRequest, NextResponse } from 'next/server'
import { safeCompare } from '@/lib/auth/session-token'
import {
  clearWingsAdminSessionCookie,
  setWingsAdminSessionCookie,
} from '@/lib/wings-cronometragem/auth'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Entrada do staff da cronometragem do Wings.
 *
 * `isStaffAuthorized()` já existia e já era exigido nas rotas de atléticas,
 * atletas, runs e config — mas nada no projeto emitia o cookie que ela lê, o
 * que deixava o painel inteiro inacessível. Esta rota fecha o circuito: troca
 * `WINGS_ADMIN_KEY` pelo cookie assinado, com comparação de tempo constante e
 * cota por IP.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request)
  const limite = await rateLimit(`wings:login:${ip}`, 10, 600)
  if (!limite.ok) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } }
    )
  }

  const esperada = process.env.WINGS_ADMIN_KEY
  if (!esperada) {
    return NextResponse.json(
      { error: 'Acesso não configurado. Defina WINGS_ADMIN_KEY.' },
      { status: 503 }
    )
  }

  const { chave } = await request.json().catch(() => ({ chave: '' }))
  if (!chave || !safeCompare(String(chave), esperada)) {
    return NextResponse.json({ error: 'Chave inválida.' }, { status: 401 })
  }

  await setWingsAdminSessionCookie()
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  await clearWingsAdminSessionCookie()
  return NextResponse.json({ ok: true })
}
