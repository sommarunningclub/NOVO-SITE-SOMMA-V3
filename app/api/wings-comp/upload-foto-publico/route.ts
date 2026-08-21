import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/wings/supabase'
import { EXTENSAO_IMAGEM, detectarImagem } from '@/lib/imagem'
import { clientIp, rateLimit } from '@/lib/rate-limit'

// Versão pública do upload — sem auth (usado no cadastro público de equipes).
//
// O que mudou: o formato passou a ser decidido pelos BYTES do arquivo, não pelo
// `Content-Type` nem pela extensão do nome, que vêm do cliente. O bucket é
// público, então aceitar o rótulo do cliente permitia hospedar HTML ou script
// num domínio da Somma. O nome do arquivo também é gerado aqui, sem nada vindo
// de fora, e existe cota por IP para o bucket não virar hospedagem grátis.
const MAX_BYTES = 5 * 1024 * 1024
const BUCKET = 'wings-equipes'

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const limite = await rateLimit(`wings:upload:${ip}`, 10, 600)
  if (!limite.ok) {
    return NextResponse.json(
      { error: 'Muitos envios. Aguarde alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(limite.retryAfterSeconds) } }
    )
  }

  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'Formulário inválido.' }, { status: 400 })
  }
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo "file" obrigatório.' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'O arquivo está vazio.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Imagem maior que 5 MB.' }, { status: 413 })
  }

  const buffer = new Uint8Array(await file.arrayBuffer())
  const mime = detectarImagem(buffer)
  if (!mime) {
    return NextResponse.json(
      { error: 'Formato não suportado. Use JPG, PNG, WEBP ou HEIC.' },
      { status: 415 }
    )
  }

  const aleatorio = crypto.randomUUID().replace(/-/g, '')
  const key = `equipes/publico-${aleatorio}.${EXTENSAO_IMAGEM[mime]}`

  const supabase = getServiceClient()
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(key, buffer, {
    contentType: mime,
    upsert: false,
  })
  if (upErr) {
    console.error('[wings/upload-foto-publico] falha no upload:', upErr.message)
    return NextResponse.json({ error: 'Não foi possível enviar a imagem.' }, { status: 500 })
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(key)
  return NextResponse.json({ url: pub.publicUrl, key })
}
