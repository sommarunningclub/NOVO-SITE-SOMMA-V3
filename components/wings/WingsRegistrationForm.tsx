'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, AlertCircle } from 'lucide-react'

import { registrationSchema, type RegistrationInput } from '@/lib/wings/validations'
import WingsAtleticaSelect from './WingsAtleticaSelect'
import WingsSuccessState from './WingsSuccessState'

const fontDisplay = { fontFamily: 'var(--font-bebas), sans-serif' }
const fontBody = { fontFamily: 'var(--font-dm-sans-wfl), sans-serif' }

function formatPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

const inputBase =
  'w-full bg-white border-2 px-3.5 sm:px-4 py-3.5 text-base sm:text-sm text-wfl-dark placeholder:text-wfl-dark/40 outline-none transition-colors focus:border-wfl-red'

const labelClass =
  'block text-xs font-semibold tracking-[0.2em] uppercase text-wfl-dark/70 mb-1.5'

const errorClass = 'mt-1 text-xs text-wfl-red font-medium'

const genderOptions: { value: RegistrationInput['gender']; label: string }[] = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'NB', label: 'Não-binário' },
  { value: 'PNR', label: 'Prefiro não responder' },
]

type Institution = { id: string; name: string }

export default function WingsRegistrationForm() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState<{
    token: string
    fullName: string
    registration: RegistrationInput
  } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      cpf: '',
      gender: undefined,
      institution_id: '',
      atletica_id: '',
    },
  })

  useEffect(() => {
    fetch('/api/wings/institutions')
      .then(r => r.json())
      .then(j => setInstitutions(j.institutions ?? []))
      .catch(() => setInstitutions([]))
  }, [])

  const institutionId = watch('institution_id')

  // Reset atletica quando muda instituição
  useEffect(() => {
    setValue('atletica_id', '', { shouldValidate: false })
  }, [institutionId, setValue])

  const onSubmit = async (values: RegistrationInput) => {
    setServerError('')
    try {
      const res = await fetch('/api/wings/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error || 'Erro ao enviar inscrição.')
        return
      }
      setSuccess({ token: json.token, fullName: values.full_name, registration: values })
    } catch {
      setServerError('Erro de conexão. Tente novamente.')
    }
  }

  if (success) {
    return (
      <WingsSuccessState
        fullName={success.fullName}
        registration={success.registration}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5" style={fontBody}>
      {/* Nome */}
      <div>
        <label className={labelClass} htmlFor="full_name">
          Nome completo <span className="text-wfl-red">*</span>
        </label>
        <input
          id="full_name"
          type="text"
          placeholder="Ex: Maria Silva"
          aria-invalid={!!errors.full_name}
          className={`${inputBase} ${errors.full_name ? 'border-wfl-red' : 'border-wfl-border'}`}
          {...register('full_name')}
        />
        {errors.full_name && <p className={errorClass}>{errors.full_name.message}</p>}
      </div>

      {/* Telefone + CPF */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="phone">
            Telefone <span className="text-wfl-red">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            placeholder="(61) 99999-9999"
            aria-invalid={!!errors.phone}
            className={`${inputBase} ${errors.phone ? 'border-wfl-red' : 'border-wfl-border'}`}
            value={formatPhone(watch('phone') || '')}
            onChange={e => setValue('phone', formatPhone(e.target.value), { shouldValidate: true })}
          />
          {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="cpf">
            CPF <span className="text-wfl-red">*</span>
          </label>
          <input
            id="cpf"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            aria-invalid={!!errors.cpf}
            className={`${inputBase} font-mono ${errors.cpf ? 'border-wfl-red' : 'border-wfl-border'}`}
            value={formatCPF(watch('cpf') || '')}
            onChange={e => setValue('cpf', formatCPF(e.target.value), { shouldValidate: true })}
          />
          {errors.cpf && <p className={errorClass}>{errors.cpf.message}</p>}
        </div>
      </div>

      {/* Sexo */}
      <div>
        <label className={labelClass} htmlFor="gender">
          Sexo <span className="text-wfl-red">*</span>
        </label>
        <select
          id="gender"
          aria-invalid={!!errors.gender}
          className={`${inputBase} ${errors.gender ? 'border-wfl-red' : 'border-wfl-border'}`}
          {...register('gender')}
        >
          <option value="">Selecione...</option>
          {genderOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.gender && <p className={errorClass}>{errors.gender.message}</p>}
      </div>

      {/* Instituição + Atlética */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="institution_id">
            Instituição <span className="text-wfl-red">*</span>
          </label>
          <select
            id="institution_id"
            aria-invalid={!!errors.institution_id}
            className={`${inputBase} ${errors.institution_id ? 'border-wfl-red' : 'border-wfl-border'}`}
            {...register('institution_id')}
          >
            <option value="">Selecione...</option>
            {institutions.map(i => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          {errors.institution_id && <p className={errorClass}>{errors.institution_id.message}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="atletica_id">
            Atlética <span className="text-wfl-red">*</span>
          </label>
          <WingsAtleticaSelect
            institutionId={institutionId || undefined}
            value={watch('atletica_id') || ''}
            onChange={v => setValue('atletica_id', v, { shouldValidate: true })}
            invalid={!!errors.atletica_id}
          />
          {errors.atletica_id && <p className={errorClass}>{errors.atletica_id.message}</p>}
        </div>
      </div>

      {/* Erro server */}
      {serverError && (
        <div className="flex items-start gap-2 bg-wfl-red/10 border border-wfl-red/30 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-wfl-red flex-shrink-0 mt-0.5" />
          <p className="text-sm text-wfl-red font-medium">{serverError}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-wfl-red hover:bg-wfl-red/90 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 sm:py-5 text-base sm:text-lg font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-colors"
        style={fontDisplay}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Enviando...
          </>
        ) : (
          'Confirmar inscrição'
        )}
      </button>

      <p className="text-center text-xs text-wfl-dark/50">
        Inscrição gratuita · Vagas ilimitadas · 02 de maio de 2026
      </p>
    </form>
  )
}
