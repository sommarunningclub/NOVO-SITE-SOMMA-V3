// Utilitários de formatação de tempo para cronometragem do revezamento.
// Tempos sempre armazenados em milissegundos no banco.

export function msParaDisplay(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0
  const totalSegundos = Math.floor(ms / 1000)
  const minutos = Math.floor(totalSegundos / 60)
  const segundos = totalSegundos % 60
  const milis = Math.floor(ms % 1000)
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}.${String(milis).padStart(3, '0')}`
}

// Aceita formatos flexíveis para staff cronometrar rápido:
//   "MM:SS.ms" / "M:SS.ms" / "SS.ms" / "SS"
//   "MM:SS:ms" (separador ":" no lugar do ".")
//   Dígitos puros: "MMSSmmm" (7), "MSSmmm" (6), "SSmmm" (5), "Smmm" (4),
//                  "SSm" (3 → segundos+décimo*100), "SS" (2), "S" (1)
// Retorna ms ou NaN se inválido.
export function displayParaMs(str: string): number {
  if (!str) return NaN
  let limpo = str.trim().replace(',', '.')
  if (!limpo) return NaN

  // Normaliza segundo separador ":" como ponto decimal — "01:23:456" → "01:23.456"
  const dois = limpo.match(/^(\d{1,2}):(\d{1,2}):(\d{1,3})$/)
  if (dois) limpo = `${dois[1]}:${dois[2]}.${dois[3]}`

  // Caso "MM:SS.ms" ou "M:SS.ms"
  const matchCompleto = limpo.match(/^(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?$/)
  if (matchCompleto) {
    const m = parseInt(matchCompleto[1], 10)
    const s = parseInt(matchCompleto[2], 10)
    const ms = matchCompleto[3] ? parseInt(matchCompleto[3].padEnd(3, '0'), 10) : 0
    if (s >= 60) return NaN
    return m * 60_000 + s * 1000 + ms
  }

  // Caso "SS.ms" ou "SS"
  const matchSeg = limpo.match(/^(\d{1,3})(?:\.(\d{1,3}))?$/)
  if (matchSeg) {
    const s = parseInt(matchSeg[1], 10)
    const ms = matchSeg[2] ? parseInt(matchSeg[2].padEnd(3, '0'), 10) : 0
    return s * 1000 + ms
  }

  // Dígitos puros — interpreta pelo comprimento (MMSSmmm, SSmmm, etc.)
  const soDigitos = limpo.match(/^(\d{1,7})$/)
  if (soDigitos) {
    const d = soDigitos[1]
    let m = 0, s = 0, ms = 0
    if (d.length <= 2) {
      // "S" ou "SS" → segundos
      s = parseInt(d, 10)
    } else if (d.length === 3) {
      // "SSm" → SS segundos + m décimos*100
      s = parseInt(d.slice(0, 2), 10)
      ms = parseInt(d.slice(2), 10) * 100
    } else if (d.length === 4) {
      // "Smmm" → S segundos + mmm milis  (ex.: 9456 = 9.456s)
      s = parseInt(d.slice(0, 1), 10)
      ms = parseInt(d.slice(1), 10)
    } else if (d.length === 5) {
      // "SSmmm" → SS segundos + mmm milis  (ex.: 12345 = 12.345s)
      s = parseInt(d.slice(0, 2), 10)
      ms = parseInt(d.slice(2), 10)
    } else if (d.length === 6) {
      // "MSSmmm" → M minuto + SS + mmm
      m = parseInt(d.slice(0, 1), 10)
      s = parseInt(d.slice(1, 3), 10)
      ms = parseInt(d.slice(3), 10)
    } else {
      // "MMSSmmm" → MM + SS + mmm  (ex.: 0107356 = 01:07.356)
      m = parseInt(d.slice(0, 2), 10)
      s = parseInt(d.slice(2, 4), 10)
      ms = parseInt(d.slice(4), 10)
    }
    if (s >= 60) return NaN
    return m * 60_000 + s * 1000 + ms
  }

  return NaN
}

export function segundosParaMs(s: number): number {
  return Math.round(s * 1000)
}

export const MODALIDADES = [
  { num: 1, nome: 'Corrida saltada' },
  { num: 2, nome: 'Corrida lateral esquerda' },
  { num: 3, nome: 'Corrida de costas' },
  { num: 4, nome: 'Corrida lateral direita' },
] as const

export type Modalidade = 1 | 2 | 3 | 4
export type Fase = 'classificatoria' | 'final'
export type Sexo = 'M' | 'F'
export type TipoProva = 'normal' | 'dinamico'

export const TIPO_PROVA_LABEL: Record<TipoProva, string> = {
  normal: 'Atletismo normal',
  dinamico: 'Dinâmica',
}
