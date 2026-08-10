import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/wings/supabase'

// Versão pública do upload — sem auth (usado no cadastro público de equipes).
// Mesmas regras de validação que o /upload-foto autenticado.
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const BUCKET = 'wings-equipes'

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'Formulário inválido.' }, { status: 400 })
  }
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo "file" obrigatório.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Imagem maior que 5 MB.' }, { status: 400 })
  }
  if (!ALLOWED.includes(file.type.toLowerCase())) {
    return NextResponse.json({ error: 'Formato não suportado. Use JPG, PNG ou WEBP.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const key = `equipes/publico-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`

  const supabase = getServiceClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(key, buffer, {
    contentType: file.type,
    upsert: false,
  })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(key)
  return NextResponse.json({ url: pub.publicUrl, key })
}
