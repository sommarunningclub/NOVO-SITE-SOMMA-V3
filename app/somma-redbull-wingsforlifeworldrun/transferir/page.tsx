'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Loader2, AlertCircle, Repeat, Lock } from 'lucide-react'
import TransferTicket from '@/components/events/catcher-run/TransferTicket'

const EVENTO = {
  id: 'f139b049-52c8-4028-9ddb-90cfa72af378',
  titulo: 'Catcher Run | Somma × Red Bull',
  dataFormatada: 'Domingo, 26 de abril de 2026',
  local: '106 Sul, Brasília DF',
  localUrl: 'https://www.google.com/maps/place//@-15.8139033,-47.8967623,230m',
}

const pelotons = [
  { id: '8km' as const, label: 'Ritmo Avançado', description: 'Pace aproximado 5\'30"', color: '#CC0000' },
  { id: '6km' as const, label: 'Ritmo Moderado', description: 'Pace aproximado 6\'30"', color: '#eab308' },
  { id: '4km' as const, label: 'Ritmo Iniciante', description: 'Corrida + caminhada', color: '#22c55e' },
]

type InscricaoEncontrada = {
  id: string
  nome_mascarado: string
  email_mascarado: string
  pelotao: string | null
  nome_do_evento: string
  data_do_evento: string
}

type NovoTitular = {
  peloton: '' | '4km' | '6km' | '8km'
  nome: string
  telefone: string
  sexo: '' | 'masculino' | 'feminino'
  email: string
  cpf: string
}

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
const formatCPF = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

const inputClass = 'w-full bg-[#0D0D0D] border-2 border-zinc-800 focus:border-[#F26522] text-white placeholder:text-zinc-600 px-4 py-3.5 text-sm outline-none transition-colors duration-200'
const labelClass = 'block text-xs text-zinc-500 font-medium uppercase tracking-widest mb-1.5'

export default function TransferirPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [autorizado, setAutorizado] = useState(false)

  const [origem, setOrigem] = useState({ cpf: '', email: '' })
  // Segundo fator: CPF e e-mail identificam, o código enviado ao e-mail do
  // titular é o que autoriza. `desafio` e `autorizacao` são tokens assinados
  // pelo servidor — a tela só os carrega de um passo para o outro.
  const [desafio, setDesafio] = useState<string | null>(null)
  const [emailMascarado, setEmailMascarado] = useState('')
  const [codigo, setCodigo] = useState('')
  const [autorizacao, setAutorizacao] = useState<string | null>(null)
  const [inscricao, setInscricao] = useState<InscricaoEncontrada | null>(null)
  const [novo, setNovo] = useState<NovoTitular>({
    peloton: '',
    nome: '',
    telefone: '',
    sexo: '',
    email: '',
    cpf: '',
  })
  const [sucesso, setSucesso] = useState<{ nome: string; cpf: string; pelotao: string } | null>(null)
  const [habilitada, setHabilitada] = useState<boolean | null>(null)

  useEffect(() => {
    fetch(`/api/transferencias/status?evento_id=${EVENTO.id}&t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setHabilitada(!!d.habilitada))
      .catch(() => setHabilitada(false))
  }, [])

  const totalSteps = 4

  const validarTitular = async () => {
    if (origem.cpf.replace(/\D/g, '').length !== 11 || !origem.email.includes('@')) {
      setError('Preencha CPF e e-mail válidos.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/transferencias/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento_id: EVENTO.id,
          cpf: origem.cpf,
          email: origem.email,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Inscrição não encontrada.')
        return
      }
      setDesafio(json.desafio)
      setEmailMascarado(json.email_mascarado || '')
      setCodigo('')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const confirmarCodigo = async () => {
    if (codigo.replace(/\D/g, '').length !== 6) {
      setError('Digite os 6 dígitos do código.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/transferencias/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento_id: EVENTO.id,
          cpf: origem.cpf,
          email: origem.email,
          codigo,
          desafio,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Código inválido.')
        return
      }
      setAutorizacao(json.autorizacao)
      setInscricao(json.inscricao)
      if (json.inscricao?.pelotao) {
        setNovo(p => ({ ...p, peloton: json.inscricao.pelotao }))
      }
      setStep(2)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const confirmarTransferencia = async () => {
    if (!inscricao) return
    if (!autorizado) {
      setError('Confirme a autorização para continuar.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/transferencias/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autorizacao,
          dados_novo: {
            nome: novo.nome,
            email: novo.email,
            telefone: novo.telefone,
            cpf: novo.cpf,
            sexo: novo.sexo,
            pelotao: novo.peloton,
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Erro ao transferir.')
        return
      }
      setSucesso({
        nome: json.nova_inscricao.nome_completo,
        cpf: json.nova_inscricao.cpf,
        pelotao: json.nova_inscricao.pelotao || '',
      })
      setStep(4)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const dadosNovoCompletos =
    !!novo.peloton &&
    novo.nome.trim().length >= 3 &&
    novo.telefone.replace(/\D/g, '').length >= 10 &&
    novo.email.includes('@') &&
    novo.cpf.replace(/\D/g, '').length === 11 &&
    !!novo.sexo

  if (step === 4 && sucesso) {
    return (
      <TransferTicket
        nomeDestino={sucesso.nome}
        cpfDestino={sucesso.cpf}
        pelotao={sucesso.pelotao}
        data={EVENTO.dataFormatada}
        local={EVENTO.local}
        localUrl={EVENTO.localUrl}
      />
    )
  }

  if (habilitada === null) {
    return (
      <main className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#F26522] animate-spin" />
      </main>
    )
  }

  if (habilitada === false) {
    return (
      <main className="min-h-screen bg-[#080808] text-white flex flex-col" style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}>
        <header className="border-b border-zinc-900 px-4 py-4">
          <a href="/somma-redbull-wingsforlifeworldrun" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para o evento
          </a>
        </header>
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md text-center">
            <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-6 h-6 text-zinc-500" />
            </div>
            <p className="text-zinc-500 text-xs uppercase tracking-[0.3em] mb-3">Indisponível</p>
            <h1
              className="text-3xl sm:text-4xl font-black uppercase text-white leading-tight mb-3"
              style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
            >
              Transferências
              <br />
              <span className="italic text-zinc-400">não estão abertas</span>
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Este recurso não está disponível no momento. Fique de olho nos canais oficiais do Somma Running Club para atualizações.
            </p>
            <a
              href="/somma-redbull-wingsforlifeworldrun"
              className="inline-block mt-6 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold text-xs uppercase tracking-wider px-6 py-3 transition-colors"
            >
              Voltar ao evento
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}>
      <header className="border-b border-zinc-900 px-4 py-4">
        <a href="/somma-redbull-wingsforlifeworldrun" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para o evento
        </a>
      </header>

      <div className="max-w-xl mx-auto px-4 py-12 sm:py-16">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Repeat className="w-4 h-4 text-[#F26522]" />
            <p className="text-[#F26522] text-xs uppercase tracking-[0.3em]">Transferir inscrição</p>
          </div>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-white leading-tight mb-3"
            style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
          >
            Passe sua vaga
            <br />
            <span className="italic text-zinc-400">para outra pessoa</span>
          </h1>
          <p className="text-zinc-500 text-sm">
            Autentique sua inscrição atual e cadastre o novo titular. Disponível até 06h30 do dia do evento.
          </p>
        </div>

        <div className="flex items-center gap-1.5 mb-8">
          {Array.from({ length: totalSteps - 1 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 transition-all duration-500"
              style={{ background: i + 1 <= step ? '#F26522' : '#27272a' }}
            />
          ))}
          <span className="text-xs text-zinc-600 ml-2 whitespace-nowrap">
            {Math.min(step, totalSteps - 1)}/{totalSteps - 1}
          </span>
        </div>

        <div className="bg-[#111111] border border-zinc-800 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                <p className="text-xs text-[#F26522] font-semibold uppercase tracking-[0.25em] mb-1">Passo 1</p>
                <h3 className="text-2xl sm:text-3xl font-black uppercase text-white mb-1" style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}>
                  Identifique sua inscrição
                </h3>
                <p className="text-zinc-500 text-xs mb-6">
                  {desafio
                    ? `Enviamos um código de 6 dígitos para ${emailMascarado}`
                    : 'Informe CPF e e-mail usados no check-in'}
                </p>

                <div className={`space-y-3 mb-5 ${desafio ? 'hidden' : ''}`}>
                  <div>
                    <label className={labelClass}>CPF <span className="text-[#F26522]">*</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCPF(origem.cpf)}
                      onChange={e => setOrigem(p => ({ ...p, cpf: e.target.value.replace(/\D/g, '') }))}
                      placeholder="000.000.000-00"
                      className={`${inputClass} font-mono`}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className={labelClass}>E-mail <span className="text-[#F26522]">*</span></label>
                    <input
                      type="email"
                      value={origem.email}
                      onChange={e => setOrigem(p => ({ ...p, email: e.target.value }))}
                      placeholder="seuemail@exemplo.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                {desafio && (
                  <div className="mb-5">
                    <label className={labelClass}>Código do e-mail <span className="text-[#F26522]">*</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={codigo}
                      onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                      className={`${inputClass} font-mono text-center text-xl tracking-[0.5em]`}
                    />
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 bg-red-900/20 border border-red-500/30 px-4 py-3 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={desafio ? confirmarCodigo : validarTitular}
                  disabled={loading}
                  className="w-full bg-[#F26522] hover:bg-[#CC0000] disabled:opacity-60 text-white font-black text-base uppercase tracking-wider py-4 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : desafio ? (
                    <>Confirmar código <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>Buscar minha inscrição <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                {desafio && (
                  <button
                    onClick={() => { setDesafio(null); setCodigo(''); setError('') }}
                    className="w-full mt-3 text-zinc-500 hover:text-zinc-300 text-xs uppercase tracking-widest py-2 transition-colors cursor-pointer"
                  >
                    Corrigir CPF ou e-mail
                  </button>
                )}
              </motion.div>
            )}

            {step === 2 && inscricao && (
              <motion.div key="step2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                <p className="text-xs text-[#F26522] font-semibold uppercase tracking-[0.25em] mb-1">Passo 2</p>
                <h3 className="text-2xl sm:text-3xl font-black uppercase text-white mb-1" style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}>
                  Inscrição encontrada
                </h3>
                <p className="text-zinc-500 text-xs mb-6">Confirme que é esta que você quer transferir</p>

                <div className="bg-[#0D0D0D] border border-zinc-800 divide-y divide-zinc-800 mb-6">
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-zinc-500 text-xs uppercase tracking-wide">Titular</span>
                    <span className="text-white text-sm font-semibold">{inscricao.nome_mascarado}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-zinc-500 text-xs uppercase tracking-wide">E-mail</span>
                    <span className="text-white text-sm">{inscricao.email_mascarado}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-zinc-500 text-xs uppercase tracking-wide">Pelotão</span>
                    <span className="text-white text-sm font-semibold">{inscricao.pelotao || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-zinc-500 text-xs uppercase tracking-wide">Evento</span>
                    <span className="text-white text-sm text-right">{inscricao.nome_do_evento}</span>
                  </div>
                </div>

                <div className="bg-amber-900/10 border border-amber-500/20 px-4 py-3 mb-6">
                  <p className="text-amber-400 text-xs leading-relaxed">
                    <strong className="uppercase tracking-wider">Atenção:</strong> ao confirmar, sua inscrição será
                    transferida e você perderá o acesso à vaga. Esta ação é irreversível.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStep(1)
                      setInscricao(null)
                      setDesafio(null)
                      setAutorizacao(null)
                      setCodigo('')
                      setError('')
                    }}
                    className="border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white font-black text-sm uppercase px-6 py-4 flex items-center justify-center cursor-pointer"
                    style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setStep(3); setError('') }}
                    className="flex-1 bg-[#F26522] hover:bg-[#CC0000] text-white font-black text-base uppercase tracking-wider py-4 flex items-center justify-center gap-2 cursor-pointer"
                    style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
                  >
                    Continuar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && inscricao && (
              <motion.div key="step3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                <p className="text-xs text-[#F26522] font-semibold uppercase tracking-[0.25em] mb-1">Passo 3</p>
                <h3 className="text-2xl sm:text-3xl font-black uppercase text-white mb-1" style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}>
                  Dados do novo titular
                </h3>
                <p className="text-zinc-500 text-xs mb-6">Quem vai receber a vaga</p>

                <div className="mb-5">
                  <label className={labelClass}>Pelotão <span className="text-[#F26522]">*</span></label>
                  <div className="flex flex-col gap-2">
                    {pelotons.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setNovo(prev => ({ ...prev, peloton: p.id }))}
                        className={`w-full text-left border-2 p-3 transition-all cursor-pointer ${
                          novo.peloton === p.id ? 'border-[#F26522] bg-[#F26522]/8' : 'border-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 flex items-center justify-center font-black text-xs flex-shrink-0"
                              style={{
                                background: novo.peloton === p.id ? '#F26522' : '#1a1a1a',
                                color: novo.peloton === p.id ? '#fff' : '#71717a',
                                fontFamily: 'var(--font-barlow-condensed, sans-serif)',
                              }}
                            >
                              {p.id}
                            </div>
                            <div>
                              <p className="text-white font-semibold text-sm">{p.label}</p>
                              <p className="text-zinc-500 text-xs">{p.description}</p>
                            </div>
                          </div>
                          {novo.peloton === p.id && <Check className="w-4 h-4 text-[#F26522]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <div>
                    <label className={labelClass}>Nome completo <span className="text-[#F26522]">*</span></label>
                    <input
                      type="text"
                      value={novo.nome}
                      onChange={e => setNovo(p => ({ ...p, nome: e.target.value }))}
                      placeholder="Ex: Maria Silva Santos"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Telefone <span className="text-[#F26522]">*</span></label>
                      <input
                        type="tel"
                        value={formatPhone(novo.telefone)}
                        onChange={e => setNovo(p => ({ ...p, telefone: e.target.value.replace(/\D/g, '') }))}
                        placeholder="(61) 99999-9999"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>CPF <span className="text-[#F26522]">*</span></label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatCPF(novo.cpf)}
                        onChange={e => setNovo(p => ({ ...p, cpf: e.target.value.replace(/\D/g, '') }))}
                        placeholder="000.000.000-00"
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Sexo <span className="text-[#F26522]">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['masculino', 'feminino'] as const).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNovo(p => ({ ...p, sexo: s }))}
                          className={`py-3 border-2 font-semibold text-xs sm:text-sm capitalize transition-all cursor-pointer ${
                            novo.sexo === s ? 'border-[#F26522] bg-[#F26522]/10 text-[#F26522]' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>E-mail <span className="text-[#F26522]">*</span></label>
                    <input
                      type="email"
                      value={novo.email}
                      onChange={e => setNovo(p => ({ ...p, email: e.target.value }))}
                      placeholder="seuemail@exemplo.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 mb-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autorizado}
                    onChange={e => setAutorizado(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#F26522] flex-shrink-0"
                  />
                  <span className="text-zinc-400 text-xs leading-relaxed">
                    Confirmo que tenho autorização da pessoa para transferir esta vaga e que os dados
                    informados estão corretos.
                  </span>
                </label>

                {error && (
                  <div className="flex items-start gap-2 bg-red-900/20 border border-red-500/30 px-4 py-3 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep(2); setError('') }}
                    disabled={loading}
                    className="border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white font-black text-sm uppercase px-6 py-4 flex items-center justify-center disabled:opacity-50 cursor-pointer"
                    style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={confirmarTransferencia}
                    disabled={!dadosNovoCompletos || !autorizado || loading}
                    className="flex-1 bg-[#F26522] hover:bg-[#CC0000] disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black text-sm sm:text-base uppercase tracking-wider py-4 flex items-center justify-center gap-2 disabled:cursor-not-allowed cursor-pointer"
                    style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Transferindo...</> : <><Check className="w-4 h-4" /> Confirmar transferência</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}
