// Validação de CPF sem API — algoritmo oficial dos dígitos verificadores.
// Identifica CPF falso (formato errado, todos dígitos iguais, ou DV inválido).
export function isValidCPF(value: string): boolean {
  const cpf = String(value || '').replace(/\D/g, '')
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false // 000.000.000-00, 111... etc.

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i)
  let d1 = (sum * 10) % 11
  if (d1 === 10) d1 = 0
  if (d1 !== parseInt(cpf[9], 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i)
  let d2 = (sum * 10) % 11
  if (d2 === 10) d2 = 0
  if (d2 !== parseInt(cpf[10], 10)) return false

  return true
}

// Formata progressivamente para 000.000.000-00 (uso em máscara de input)
export function formatCPF(value: string): string {
  const d = String(value || '').replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}
