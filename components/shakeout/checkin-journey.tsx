'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, ArrowLeft, CheckCircle2, Instagram, Printer, Ticket, Lock } from 'lucide-react'
import { CentauroLogo } from '@/components/shakeout/centauro-logo'
import { isValidCPF, formatCPF } from '@/lib/cpf'

const LOGO_SOMMA = '/Logo_Nova_Somma_Branca_Laranja.svg'
const LOGO_DOPA = 'https://seekdopa.com/cdn/shop/files/DOPA_Logo_Cinza_Original.png?v=1728398053&width=600'
const IG = {
  somma: 'https://www.instagram.com/somma.club/',
  dopa: 'https://www.instagram.com/seekdopa/',
  centauro: 'https://www.instagram.com/centauroesporte/',
}
const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] }
function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  const w = window as DataLayerWindow
  if (w.dataLayer) w.dataLayer.push({ event, ...params })
}

// text-base (16px) no mobile evita o zoom automático do iOS ao focar o campo
const INPUT =
  'w-full rounded-md bg-[#0c0c0c] px-4 py-3 text-base sm:text-sm text-white placeholder:text-[#666] border border-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#FF2C03] focus:border-transparent transition'

type Form = {
  nome_completo: string
  cpf: string
  email: string
  telefone: string
  uf: string
  sexo: string
  conhecia_somma: string
  aceite_lgpd: boolean
  aceite_comunicacoes: boolean
}

const EMPTY: Form = {
  nome_completo: '', cpf: '', email: '', telefone: '', uf: '', sexo: '',
  conhecia_somma: '', aceite_lgpd: false, aceite_comunicacoes: false,
}

const SEXOS = [
  { v: 'masculino', label: 'Masculino' },
  { v: 'feminino', label: 'Feminino' },
  { v: 'outro', label: 'Outro' },
  { v: 'prefiro-nao-dizer', label: 'Prefiro não dizer' },
]

const STEPS = ['Identificação', 'Contato', 'Confirmação']

export function CheckinJourney() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Form>(EMPTY)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [ticket, setTicket] = useState('')
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    fetch('/api/leads-shakeout-centauro/config')
      .then((r) => r.json())
      .then((d) => setClosed(d?.inscricoes_abertas === false))
      .catch(() => {})
  }, [])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErr('')
  }

  const validateStep = (): string => {
    if (step === 0) {
      if (form.nome_completo.trim().length < 3) return 'Informe seu nome completo.'
      if (!isValidCPF(form.cpf)) return 'CPF inválido. Confira os números digitados.'
    }
    if (step === 1) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'E-mail inválido.'
      if (form.telefone.replace(/\D/g, '').length < 10) return 'Telefone (WhatsApp) inválido.'
      if (!form.uf) return 'Selecione seu estado (UF).'
      if (!form.sexo) return 'Selecione o sexo.'
    }
    if (step === 2) {
      if (!form.conhecia_somma) return 'Responda se já conhecia o Somma Club.'
      if (!form.aceite_lgpd) return 'É preciso aceitar os termos da LGPD.'
    }
    return ''
  }

  const next = () => {
    const e = validateStep()
    if (e) return setErr(e)
    setErr('')
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  const back = () => { setErr(''); setStep((s) => Math.max(s - 1, 0)) }

  const submit = async () => {
    const e = validateStep()
    if (e) return setErr(e)
    setLoading(true)
    setErr('')
    try {
      const res = await fetch('/api/leads-shakeout-centauro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: form.nome_completo,
          cpf: form.cpf.replace(/\D/g, ''),
          email: form.email,
          telefone: form.telefone,
          uf: form.uf,
          sexo: form.sexo,
          conhecia_somma: form.conhecia_somma === 'sim',
          aceite_lgpd: form.aceite_lgpd,
          aceite_comunicacoes: form.aceite_comunicacoes,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Não foi possível confirmar sua presença.')
      }
      track('shakeout_checkin', { status: 'sucesso' })
      setTicket('SHK-' + Date.now().toString(36).toUpperCase().slice(-6))
      setLoading(false)
      setPrinting(true)
      // delay de 4s com loading -> depois mostra o ticket no mesmo lugar (sem mexer no scroll)
      setTimeout(() => {
        setPrinting(false)
        setDone(true)
      }, 4000)
    } catch (e2) {
      track('shakeout_checkin', { status: 'erro' })
      setErr(e2 instanceof Error ? e2.message : 'Erro ao enviar.')
      setLoading(false)
    }
  }

  /* ===================== TICKET (sucesso) ===================== */
  if (done) {
    return (
      <div className="mt-8">
        {/* logos das 3 marcas */}
        <div className="mb-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-6">
          <img src={LOGO_DOPA} alt="Casa Dopa" className="h-4 w-auto [filter:brightness(0)_invert(1)] sm:h-5" />
          <span className="text-white/20">|</span>
          <CentauroLogo className="h-3.5 w-auto text-white sm:h-4" />
          <span className="text-white/20">|</span>
          <img src={LOGO_SOMMA} alt="Somma Club" className="h-6 w-auto sm:h-7" />
        </div>

        <div className="mb-5 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[#FF2C03] sm:h-11 sm:w-11" aria-hidden />
          <h3 className="text-2xl uppercase sm:text-3xl">Presença confirmada!</h3>
          <p className="mx-auto mt-3 flex max-w-xs items-start justify-center gap-2 text-sm leading-relaxed text-[#A1A1A1] sm:max-w-sm">
            <Printer className="mt-0.5 h-4 w-4 shrink-0 text-[#FF2C03]" aria-hidden />
            <span>Tire um print ou salve este ticket — você vai apresentá-lo na entrada do evento.</span>
          </p>
        </div>

        {/* TICKET */}
        <div id="shakeout-ticket" className="overflow-hidden rounded-2xl border border-[#FF2C03]/40 bg-[#0e0e0e]">
          <div className="flex items-center justify-between gap-3 bg-[#FF2C03] px-4 py-3 text-black sm:px-5">
            <span className="flex items-center gap-2 font-[family-name:var(--font-display)] text-base uppercase sm:text-lg">
              <Ticket className="h-5 w-5 shrink-0" aria-hidden /> Shake Out Rio
            </span>
            <span className="font-mono text-xs font-bold">{ticket}</span>
          </div>

          <div className="grid grid-cols-1 gap-px bg-[#2A2A2A] sm:grid-cols-3">
            {[
              { k: 'DATA', v: '04/06 · QUI' },
              { k: 'HORÁRIO', v: '08H00 · conc. 07H30' },
              { k: 'LOCAL', v: 'Casa Dopa · Copacabana' },
            ].map((i) => (
              <div key={i.k} className="bg-[#0e0e0e] px-4 py-3.5 sm:px-5 sm:py-4">
                <p className="text-[10px] uppercase tracking-widest text-[#FF2C03]">{i.k}</p>
                <p className="mt-1 text-sm text-white">{i.v}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-[#2A2A2A] px-4 py-5 sm:px-5">
            <p className="mb-3 text-[10px] uppercase tracking-widest text-[#A1A1A1]">Seus dados confirmados</p>
            <dl className="space-y-1.5">
              {[
                ['Nome', form.nome_completo, false],
                ['CPF', formatCPF(form.cpf), false],
                ['E-mail', form.email, true],
                ['WhatsApp', form.telefone, false],
                ['UF', form.uf, false],
                ['Sexo', SEXOS.find((s) => s.v === form.sexo)?.label ?? '—', false],
                ['Status', 'Confirmado ✓', false],
              ].map(([k, v, brk]) => (
                <div key={k as string} className="flex items-baseline justify-between gap-4 border-b border-[#1c1c1c] py-1.5 text-sm">
                  <dt className="shrink-0 text-[#A1A1A1]">{k}</dt>
                  <dd className={`text-right font-medium text-white ${brk ? 'break-all' : ''}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <button
          onClick={() => { track('shakeout_cta_click', { cta: 'imprimir_ticket' }); window.print() }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-[#FF2C03] py-4 text-sm font-bold tracking-wider text-white transition hover:bg-[#ff4d35]"
        >
          <Printer className="h-4 w-4" aria-hidden /> IMPRIMIR / SALVAR TICKET
        </button>

        {/* seguir as 3 marcas */}
        <div className="mt-10">
          <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.25em] text-[#FF2C03]">Siga e fique por dentro</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { nome: 'Somma Club', handle: '@somma.club', url: IG.somma },
              { nome: 'Casa Dopa', handle: '@seekdopa', url: IG.dopa },
              { nome: 'Centauro', handle: '@centauroesporte', url: IG.centauro },
            ].map((m) => (
              <a key={m.handle} href={m.url} target="_blank" rel="noopener noreferrer"
                onClick={() => track('shakeout_cta_click', { cta: 'seguir', perfil: m.handle })}
                className="flex items-center gap-3 rounded-xl border border-[#2A2A2A] bg-[#0e0e0e] px-4 py-3.5 transition hover:border-[#FF2C03]/60 hover:bg-[#151515] active:bg-[#151515]">
                <Instagram className="h-5 w-5 shrink-0 text-[#FF2C03]" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">{m.nome}</span>
                  <span className="block truncate text-xs text-[#A1A1A1]">{m.handle}</span>
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* isola o ticket na impressão */}
        <style>{`@media print {
          body * { visibility: hidden !important; }
          #shakeout-ticket, #shakeout-ticket * { visibility: visible !important; }
          #shakeout-ticket { position: absolute; left: 0; top: 0; width: 100%; }
        }`}</style>
      </div>
    )
  }

  /* ===================== LOADING (delay 4s) ===================== */
  if (printing) {
    return (
      <div className="mt-8 flex min-h-[16rem] flex-col items-center justify-center rounded-2xl border border-[#2A2A2A] bg-[#0e0e0e] px-6 py-12 text-center">
        {/* spinner */}
        <span className="h-12 w-12 animate-spin rounded-full border-4 border-[#2A2A2A] border-t-[#FF2C03]" aria-hidden />
        <p className="mt-6 font-[family-name:var(--font-display)] text-2xl uppercase text-white">Aguarde…</p>
        <p className="mt-2 text-sm text-[#A1A1A1]">Estamos criando sua inscrição.</p>
      </div>
    )
  }

  /* ===================== INSCRIÇÕES ENCERRADAS ===================== */
  if (closed) {
    return (
      <div className="mt-8 rounded-2xl border border-[#2A2A2A] bg-[#0e0e0e] p-8 text-center">
        <Lock className="mx-auto mb-4 h-10 w-10 text-[#FF2C03]" aria-hidden />
        <h3 className="text-3xl uppercase">Vagas encerradas</h3>
        <p className="mt-2 text-sm text-[#A1A1A1]">
          As inscrições para o Shake Out Rio estão encerradas no momento. Siga o
          {' '}<a href={IG.somma} target="_blank" rel="noopener noreferrer" className="text-[#FF2C03] underline">@somma.club</a>{' '}
          para novidades.
        </p>
      </div>
    )
  }

  /* ===================== JORNADA (form) ===================== */
  return (
    <div className="mt-8">
      {/* progresso */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1 rounded-full transition-colors ${i <= step ? 'bg-[#FF2C03]' : 'bg-[#2A2A2A]'}`} />
            <p className={`mt-2 text-[10px] uppercase tracking-widest ${i === step ? 'text-[#FF2C03]' : 'text-[#666]'}`}>
              {i + 1}. {label}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {step === 0 && (
          <>
            <input value={form.nome_completo} onChange={(e) => set('nome_completo', e.target.value)} type="text" className={INPUT} placeholder="Nome completo" aria-label="Nome completo" />
            <input
              value={form.cpf}
              onChange={(e) => set('cpf', formatCPF(e.target.value))}
              inputMode="numeric"
              maxLength={14}
              className={INPUT}
              placeholder="CPF (000.000.000-00)"
              aria-label="CPF"
            />
          </>
        )}

        {step === 1 && (
          <>
            <input value={form.email} onChange={(e) => set('email', e.target.value)} type="email" className={INPUT} placeholder="E-mail" aria-label="E-mail" />
            <input value={form.telefone} onChange={(e) => set('telefone', e.target.value)} type="tel" className={INPUT} placeholder="Telefone (WhatsApp)" aria-label="Telefone WhatsApp" />
            <select value={form.uf} onChange={(e) => set('uf', e.target.value)} className={`${INPUT} appearance-none`} aria-label="Estado (UF)">
              <option value="" disabled>Estado (UF)</option>
              {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
            <select value={form.sexo} onChange={(e) => set('sexo', e.target.value)} className={`${INPUT} appearance-none`} aria-label="Sexo">
              <option value="" disabled>Sexo</option>
              {SEXOS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
            </select>
          </>
        )}

        {step === 2 && (
          <>
            <select value={form.conhecia_somma} onChange={(e) => set('conhecia_somma', e.target.value)} className={`${INPUT} appearance-none`} aria-label="Você já conhecia o Somma Club?">
              <option value="" disabled>Você já conhecia o Somma Club?</option>
              <option value="sim">Sim, já conhecia</option>
              <option value="nao">Não, conheci agora</option>
            </select>

            {/* destaque seguir o Somma */}
            <a href={IG.somma} target="_blank" rel="noopener noreferrer"
              onClick={() => track('shakeout_cta_click', { cta: 'seguir_somma_checkin' })}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#FF2C03] bg-[#FF2C03]/10 px-4 py-4 transition hover:bg-[#FF2C03]/20">
              <span className="flex items-center gap-3">
                <Instagram className="h-6 w-6 text-[#FF2C03]" aria-hidden />
                <span>
                  <span className="block text-sm font-bold text-white">Siga o Somma Club</span>
                  <span className="block text-sm text-[#FF2C03]">@somma.club</span>
                </span>
              </span>
              <ArrowRight className="h-5 w-5 text-[#FF2C03]" aria-hidden />
            </a>

            <label className="flex cursor-pointer items-start gap-2.5 pt-1">
              <input type="checkbox" checked={form.aceite_lgpd} onChange={(e) => set('aceite_lgpd', e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#FF2C03]" />
              <span className="text-xs leading-relaxed text-[#A1A1A1]">
                Li e aceito os termos da <strong className="text-white">LGPD</strong> e autorizo o tratamento dos meus dados para este evento. <span className="text-[#FF2C03]">*</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5">
              <input type="checkbox" checked={form.aceite_comunicacoes} onChange={(e) => set('aceite_comunicacoes', e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#FF2C03]" />
              <span className="text-xs leading-relaxed text-[#A1A1A1]">Quero receber novidades e conteúdos do Somma Club.</span>
            </label>
          </>
        )}

        {err && (
          <div className="rounded-md border border-red-900 bg-red-950/30 px-4 py-3">
            <p className="text-sm text-red-400">{err}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          {step > 0 && (
            <button type="button" onClick={back} disabled={loading}
              className="flex items-center gap-2 rounded-md border border-[#2A2A2A] px-5 py-4 text-sm font-bold tracking-wider text-white transition hover:border-white/40 disabled:opacity-50">
              <ArrowLeft className="h-4 w-4" aria-hidden /> VOLTAR
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next}
              className="group flex flex-1 items-center justify-center gap-2 rounded-md bg-[#FF2C03] py-4 text-sm font-bold tracking-wider text-white transition hover:bg-[#ff4d35]">
              CONTINUAR <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={loading}
              className="group flex flex-1 items-center justify-center gap-2 rounded-md bg-[#FF2C03] py-4 text-sm font-bold tracking-wider text-white transition hover:bg-[#ff4d35] disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'CONFIRMANDO...' : 'CONFIRMAR PRESENÇA'}
              {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
