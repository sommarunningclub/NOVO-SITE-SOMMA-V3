import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { isValidCPF } from '@/lib/cpf'
import { filtroValor } from '@/lib/postgrest-filtro'
import { clientIp, rateLimit } from '@/lib/rate-limit'

const ORIGEM = 'shakeout-centauro-somma-rj'
const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
const SEXOS = ['masculino', 'feminino', 'outro', 'prefiro-nao-dizer']

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request)
    const limite = await rateLimit(`shakeout:lead:${ip}`, 10, 600)
    if (!limite.ok) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde alguns minutos.' },
        { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } }
      )
    }

    const body = await request.json()
    const nome_completo = String(body.nome_completo ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const telefone = String(body.telefone ?? '').trim()
    const uf = String(body.uf ?? '').trim().toUpperCase()
    const sexo = String(body.sexo ?? '').trim().toLowerCase()
    const cpfDigits = String(body.cpf ?? '').replace(/\D/g, '')
    const conhecia_somma = Boolean(body.conhecia_somma)
    const aceite_lgpd = Boolean(body.aceite_lgpd)
    const aceite_comunicacoes = Boolean(body.aceite_comunicacoes)

    // Validação
    if (!nome_completo || !email || !telefone || !uf || !sexo || !cpfDigits) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 })
    }
    if (!SEXOS.includes(sexo)) {
      return NextResponse.json({ error: 'Sexo inválido.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
    }
    if (!UFS.includes(uf)) {
      return NextResponse.json({ error: 'UF inválida.' }, { status: 400 })
    }
    if (!isValidCPF(cpfDigits)) {
      return NextResponse.json({ error: 'CPF inválido. Confira os números digitados.' }, { status: 400 })
    }
    if (!aceite_lgpd) {
      return NextResponse.json({ error: 'É necessário aceitar os termos da LGPD.' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      console.error('[shakeout] Variáveis de ambiente Supabase não configuradas')
      return NextResponse.json({ error: 'Erro ao configurar banco de dados' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, serviceKey)

    // Inscrições encerradas? (admin pode bloquear)
    const { data: cfg } = await supabase.from('config_shakeout').select('inscricoes_abertas').eq('id', 1).maybeSingle()
    if (cfg && cfg.inscricoes_abertas === false) {
      return NextResponse.json({ error: 'As inscrições estão encerradas no momento.' }, { status: 403 })
    }

    // Bloqueia duplicidade de CPF OU e-mail nesta ativação
    const { data: existing, error: checkError } = await supabase
      .from('leads_shakeout_centauro')
      .select('cpf, email')
      .eq('origem', ORIGEM)
      .or(`cpf.eq.${filtroValor(cpfDigits)},email.eq.${filtroValor(email)}`)
      .limit(5)

    if (checkError) {
      console.error('[shakeout] Erro ao verificar check-in existente:', checkError)
      return NextResponse.json({ error: 'Erro ao validar check-in.' }, { status: 500 })
    }
    if (existing && existing.length > 0) {
      const cpfDup = existing.some((r) => r.cpf === cpfDigits)
      return NextResponse.json(
        { error: cpfDup ? 'Este CPF já está inscrito neste evento.' : 'Este e-mail já está inscrito neste evento.' },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('leads_shakeout_centauro')
      .insert([
        {
          nome_completo,
          email,
          telefone,
          uf,
          sexo,
          cpf: cpfDigits,
          conhecia_somma,
          aceite_lgpd,
          aceite_comunicacoes,
          status: 'confirmado',
          origem: ORIGEM,
        },
      ])

    if (error) {
      console.error('[shakeout] Erro ao inserir check-in:', error)
      return NextResponse.json({ error: 'Não foi possível confirmar sua presença.' }, { status: 400 })
    }

    // Resposta mínima: devolver a linha era ecoar CPF, e-mail e telefone.
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[shakeout] Erro na API de check-in:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
