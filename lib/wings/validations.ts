import { z } from 'zod'

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(cleaned[10])
}

export const registrationSchema = z.object({
  full_name: z.string().trim().min(3, 'Nome completo obrigatório'),
  phone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Telefone inválido'),
  cpf: z.string().refine(validateCPF, 'CPF inválido'),
  gender: z.enum(['M', 'F', 'NB', 'PNR'], { error: 'Selecione o sexo' }),
  institution_id: z.string().uuid('Selecione a instituição'),
  atletica_id: z.string().uuid('Selecione sua atlética'),
})

export type RegistrationInput = z.infer<typeof registrationSchema>

export const GENDER_LABEL: Record<RegistrationInput['gender'], string> = {
  M: 'Masculino',
  F: 'Feminino',
  NB: 'Não-binário',
  PNR: 'Prefiro não responder',
}

export const CHECKIN_STATUS_LABEL = {
  pending: 'Pendente',
  checked_in: 'Check-in feito',
  no_show: 'Não compareceu',
} as const

export type CheckinStatus = keyof typeof CHECKIN_STATUS_LABEL
