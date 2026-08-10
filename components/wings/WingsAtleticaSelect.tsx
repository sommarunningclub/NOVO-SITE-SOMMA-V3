'use client'

import { useEffect, useState } from 'react'

type Option = { id: string; name: string }

type Props = {
  institutionId: string | undefined
  value: string
  onChange: (atleticaId: string) => void
  invalid?: boolean
  className?: string
}

export default function WingsAtleticaSelect({
  institutionId,
  value,
  onChange,
  invalid,
  className,
}: Props) {
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!institutionId) {
      setOptions([])
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/wings/atleticas?institution_id=${institutionId}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        setOptions(json.atleticas ?? [])
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [institutionId])

  const disabled = !institutionId || loading

  return (
    <select
      disabled={disabled}
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-invalid={invalid}
      className={`w-full bg-white border-2 px-4 py-3.5 text-sm text-wfl-dark outline-none transition-colors disabled:bg-wfl-card/50 disabled:text-wfl-dark/40 disabled:cursor-not-allowed focus:border-wfl-red ${
        invalid ? 'border-wfl-red' : 'border-wfl-border'
      } ${className ?? ''}`}
    >
      <option value="">
        {!institutionId
          ? 'Selecione a instituição primeiro'
          : loading
            ? 'Carregando...'
            : 'Selecione sua atlética'}
      </option>
      {options.map(o => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  )
}
