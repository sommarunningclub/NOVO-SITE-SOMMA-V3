import { NextResponse } from 'next/server'
import { setInsiderSessionCookie } from '@/lib/auth/insider'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = getServiceSupabase()
    if (!supabase) return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 })

    const { cpf } = await req.json()
    if (!cpf) return NextResponse.json({ error: 'CPF obrigatório' }, { status: 400 })

    const cpfLimpo = String(cpf).replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
    }

    const { data: insiders, error } = await supabase
      .from('dados_insiders')
      .select('id, nome, cpf')

    if (error) {
      console.error('[insider/login] erro ao buscar insiders:', error)
      return NextResponse.json({ error: 'Erro ao consultar banco de dados.' }, { status: 500 })
    }

    const insider = insiders?.find(
      (i) => i.cpf && i.cpf.replace(/\D/g, '') === cpfLimpo
    )

    if (!insider) {
      return NextResponse.json({ error: 'CPF não encontrado. Acesso negado.' }, { status: 401 })
    }

    const session = { id: insider.id, nome: insider.nome }
    await setInsiderSessionCookie(session)

    return NextResponse.json({ success: true, insider: session })
  } catch (err) {
    console.error('[insider/login] erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
