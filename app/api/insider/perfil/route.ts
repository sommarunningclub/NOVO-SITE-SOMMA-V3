import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireInsiderAuth } from '@/lib/auth/insider'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

const CAMPOS = [
  'id', 'nome', 'cpf', 'email', 'telefone', 'data_nascimento', 'sexo',
  'foto_url', 'tamanho_camisa', 'ativo',
  'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado',
  'evolve', 'assessoria_somma', 'dopahmina', 'cupom_loja_somma', 'big_box',
  'tex_barbearia', 'estamina_recovery',
].join(', ')

// Mostra só o miolo do CPF: a tela é usada em evento, com gente por perto.
function mascararCPF(cpf: string | null): string | null {
  if (!cpf) return null
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return cpf
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`
}

export async function GET() {
  const auth = await requireInsiderAuth()
  if (!auth.ok) return auth.response

  try {
    const { data, error } = await supabase
      .from('dados_insiders')
      .select(CAMPOS)
      .eq('id', auth.insider.id)
      .maybeSingle()

    if (error) {
      console.error('[insider/perfil] erro ao buscar perfil:', error)
      return NextResponse.json({ error: 'Erro ao consultar banco de dados.' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })
    }

    // O parser de tipos do supabase-js não infere a lista de colunas montada
    // dinamicamente, então normalizamos aqui.
    const perfil = data as unknown as Record<string, unknown>
    return NextResponse.json({
      perfil: { ...perfil, cpf: mascararCPF(perfil.cpf as string | null) },
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
