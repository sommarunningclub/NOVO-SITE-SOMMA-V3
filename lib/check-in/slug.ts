/**
 * Slug público do check-in: vira o segmento em `/check-in/{slug}`.
 *
 * A gestão pode gravar `eventos.slug` (minúsculo, estável). Quando está vazio,
 * o site gera a partir do título — "Somma - Edição HALLOWEEN 🎃👻" vira
 * `Somma-Edição-HALLOWEEN`, que no browser aparece percent-encoded.
 */

const RESERVADOS = new Set(['sucesso'])

export function slugifyEventoTitulo(titulo: string): string {
  const slug = titulo
    .normalize('NFC')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\uFE0F\u200D]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!slug) return 'evento'
  if (RESERVADOS.has(slug.toLowerCase())) return `${slug}-evento`
  return slug
}

export function slugDoEvento(evento: { slug?: string | null; titulo: string }): string {
  const gravado = evento.slug?.trim()
  if (gravado) return gravado
  return slugifyEventoTitulo(evento.titulo)
}

export function decodificaSlug(valor: string): string {
  try {
    return decodeURIComponent(valor).normalize('NFC')
  } catch {
    return valor.normalize('NFC')
  }
}

export function slugsIguais(a: string, b: string): boolean {
  return decodificaSlug(a).toLowerCase() === decodificaSlug(b).toLowerCase()
}

export function caminhoCheckIn(evento: { slug?: string | null; titulo: string }): string {
  return `/check-in/${slugDoEvento(evento)}`
}
