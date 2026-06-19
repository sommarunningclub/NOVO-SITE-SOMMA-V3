'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Check, MapPin, Clock, Calendar, Lock, ChevronRight, Loader2 } from 'lucide-react'

type FormData = {
  peloton: '' | '4km' | '6km' | '8km'
  nome: string
  telefone: string
  sexo: '' | 'masculino' | 'feminino'
  email: string
  cpf: string
}

type Evento = {
  id: string
  data: string
  dataFormatada: string
  titulo: string
  descricao: string | null
  local: string
  localUrl: string | null
  tipo: 'corrida' | 'personalizado'
  encerrado: boolean
  bloqueado: boolean
  dataEvento: string
  horarioInicio: string
}

function formatarData(dataStr: string): string {
  const [year, month, day] = dataStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  return `${dias[date.getDay()]}, ${String(day).padStart(2, '0')} de ${meses[month - 1]} de ${year}`
}

function formatarHorario(horario: string): string {
  const [h, m] = horario.split(':')
  return `A partir das ${h}h${m === '00' ? '00' : m}`
}

export default function CheckInPage() {
  const router = useRouter()
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loadingEventos, setLoadingEventos] = useState(true)
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null)
  const totalSteps = eventoSelecionado?.tipo === 'personalizado' ? 2 : 3
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<FormData>({
    peloton: '',
    nome: '',
    telefone: '',
    sexo: '',
    email: '',
    cpf: '',
  })

  useEffect(() => {
    async function fetchEventos() {
      try {
        const res = await fetch('/api/eventos')
        const data = await res.json()

        const lista: Evento[] = []

        // Próximos eventos
        const proximos = data.proximos_eventos || (data.proximo_evento ? [data.proximo_evento] : [])
        for (const e of proximos) {
          lista.push({
            id: e.id,
            data: e.data_evento,
            dataFormatada: formatarData(e.data_evento),
            titulo: e.titulo,
            descricao: e.descricao || null,
            local: e.local || 'Parque da Cidade — Brasília, DF',
            localUrl: e.local_url || null,
            tipo: e.tipo || 'corrida',
            encerrado: e.checkin_status === 'encerrado',
            bloqueado: e.checkin_status === 'bloqueado',
            dataEvento: e.data_evento,
            horarioInicio: e.horario_inicio || '07:00',
          })
        }

        // Histórico
        if (data.historico) {
          for (const e of data.historico) {
            lista.push({
              id: e.id,
              data: e.data_evento,
              dataFormatada: formatarData(e.data_evento),
              titulo: e.titulo,
              descricao: null,
              local: e.local || 'Parque da Cidade — Brasília, DF',
              localUrl: null,
              tipo: 'corrida',
              encerrado: e.checkin_status === 'encerrado',
              bloqueado: e.checkin_status === 'bloqueado',
              dataEvento: e.data_evento,
              horarioInicio: '07:00',
            })
          }
        }

        setEventos(lista)
      } catch (err) {
        console.error('[site] Erro ao buscar eventos:', err)
      } finally {
        setLoadingEventos(false)
      }
    }

    fetchEventos()
  }, [])

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11)
    if (cleaned.length <= 2) return cleaned
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11)
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`
  }

  const canAdvance = () => {
    if (step === 1) return true
    if (eventoSelecionado?.tipo === 'personalizado') {
      if (step === 2) return !!(formData.nome && formData.telefone && formData.sexo && formData.email && formData.cpf)
    } else {
      if (step === 2) return !!formData.peloton
      if (step === 3) return !!(formData.nome && formData.telefone && formData.sexo && formData.email && formData.cpf)
    }
    return false
  }

  const handleNext = () => {
    if (canAdvance() && step < totalSteps) setStep(step + 1)
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_completo: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          cpf: formData.cpf,
          sexo: formData.sexo,
          pelotao: eventoSelecionado?.tipo === 'personalizado' ? null : formData.peloton,
          data_do_evento: eventoSelecionado?.dataEvento || '',
          nome_do_evento: eventoSelecionado?.titulo || '',
          evento_id: eventoSelecionado?.id || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 409) {
          setError(errorData.error || 'Você já está inscrito neste evento.')
          return
        }
        throw new Error(errorData.error || 'Erro ao salvar check-in')
      }

      const params = new URLSearchParams({
        data: eventoSelecionado?.dataFormatada || '',
        evento: eventoSelecionado?.titulo || '',
        horario: eventoSelecionado?.horarioInicio || '07:00',
        local: eventoSelecionado?.local || '',
        local_url: eventoSelecionado?.localUrl || '',
        descricao: eventoSelecionado?.descricao || '',
      })
      router.push(`/check-in/sucesso?${params.toString()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar formulário')
      console.error('[v0] Erro no check-in:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const pelotons = [
    {
      id: '4km' as const,
      label: 'Ritmo Iniciante',
      description: 'Alterna corrida e caminhada \u2022 1\' correndo, 2\' caminhando',
      icon: '\uD83D\uDFE2',
      pace: 'Ritmo leve',
    },
    {
      id: '6km' as const,
      label: 'Ritmo Moderado',
      description: 'Ritmo constante \u2022 Pace aproximado de 6\'30"',
      icon: '\uD83D\uDFE1',
      pace: 'Ritmo moderado',
    },
    {
      id: '8km' as const,
      label: 'Ritmo Avançado',
      description: 'Para corredores experientes \u2022 Pace aproximado de 5\'30"',
      icon: '\uD83D\uDD34',
      pace: 'Ritmo intenso',
    },
  ]

  const eventosProximos = eventos.filter(e => !e.encerrado)
  const eventosPassados = eventos.filter(e => e.encerrado)

  // Loading state
  if (loadingEventos) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col">
        <header className="border-b border-zinc-800 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-50 bg-black/95 backdrop-blur-sm">
          <a href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs sm:text-sm">
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Voltar ao site
          </a>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">Carregando eventos...</p>
          </div>
        </div>
      </main>
    )
  }

  // Event list
  if (!eventoSelecionado) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col">
        <header className="border-b border-zinc-800 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-50 bg-black/95 backdrop-blur-sm">
          <a href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs sm:text-sm">
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Voltar ao site
          </a>
        </header>

        <div className="flex-1 px-3 sm:px-4 py-8 sm:py-14 max-w-2xl mx-auto w-full">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-2 sm:mb-3">Somma Running Club</p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight text-balance">
              Faça seu <span className="text-primary">Check-in</span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-2 sm:mt-3">
              Selecione o evento para confirmar sua presença
            </p>
          </div>

          {/* Próximos eventos */}
          {eventosProximos.length > 0 && (
            <div className="mb-8 space-y-3">
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-3">
                {eventosProximos.length === 1 ? 'Proximo evento' : 'Proximos eventos'}
              </p>
              {eventosProximos.map(evento => {
                const isCatcherRun = evento.id === 'f139b049-52c8-4028-9ddb-90cfa72af378'
                return (
                <div
                  key={evento.id}
                  onClick={() => {
                    if (isCatcherRun) {
                      return
                    } else if (!evento.bloqueado) {
                      setEventoSelecionado(evento)
                    }
                  }}
                  className={`w-full text-left rounded-xl border-2 bg-zinc-900 overflow-hidden transition-all duration-200 ${
                    isCatcherRun
                      ? 'border-zinc-700 cursor-not-allowed opacity-70'
                      : evento.bloqueado
                      ? 'border-zinc-700 cursor-not-allowed opacity-70'
                      : 'border-primary hover:bg-zinc-800 cursor-pointer group'
                  }`}
                >
                  <div className={`px-4 sm:px-6 py-2 flex items-center justify-between ${isCatcherRun ? 'bg-zinc-700' : evento.bloqueado ? 'bg-zinc-700' : 'bg-primary'}`}>
                    {isCatcherRun ? (
                      <>
                        <span className="text-zinc-300 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5">
                          <Lock className="w-3 h-3" /> Inscrições encerradas
                        </span>
                        <Lock className="w-3.5 h-3.5 text-zinc-400" />
                      </>
                    ) : evento.bloqueado ? (
                      <>
                        <span className="text-zinc-300 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5">
                          <Lock className="w-3 h-3" /> Check-in em breve
                        </span>
                        <Lock className="w-3.5 h-3.5 text-zinc-400" />
                      </>
                    ) : (
                      <>
                        <span className="text-white text-xs font-semibold uppercase tracking-widest">Check-in aberto</span>
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      </>
                    )}
                  </div>
                  <div className="p-4 sm:p-6">
                    {isCatcherRun && (
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div>
                          <h3 className="text-white font-bold text-base sm:text-lg mb-1.5">{evento.titulo}</h3>
                          <span className="inline-flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                            <Lock className="w-2.5 h-2.5" />
                            Inscrições encerradas
                          </span>
                        </div>
                        <img
                          src="https://cdn.shopify.com/s/files/1/0788/1932/8253/files/RED_BULL_ED_MOLHADO_LATA_IR_ABERTA_ILUSTRADA_1.png?v=1776108610"
                          alt="Red Bull"
                          className="h-20 w-auto object-contain flex-shrink-0 -mt-2 -mr-1 opacity-40 grayscale"
                        />
                      </div>
                    )}

                    {!isCatcherRun && <h3 className="text-white font-bold text-base sm:text-lg mb-3">{evento.titulo}</h3>}
                    {evento.descricao && (
                      <p className="text-zinc-400 text-xs sm:text-sm mb-3 leading-relaxed">{evento.descricao}</p>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
                        <Calendar className={`w-3.5 h-3.5 flex-shrink-0 ${evento.bloqueado ? 'text-zinc-500' : 'text-primary'}`} />
                        {evento.dataFormatada}
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
                        <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${evento.bloqueado ? 'text-zinc-500' : 'text-primary'}`} />
                        {formatarHorario(evento.horarioInicio)}
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
                        <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${evento.bloqueado ? 'text-zinc-500' : 'text-primary'}`} />
                        {evento.localUrl ? (
                          <a
                            href={evento.localUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="hover:text-orange-400 underline underline-offset-2 transition-colors"
                          >
                            {evento.local}
                          </a>
                        ) : (
                          evento.local
                        )}
                      </div>
                    </div>
                    {isCatcherRun ? (
                      <div className="mt-4 flex items-center justify-end gap-1.5 text-zinc-500 text-xs font-semibold">
                        <Lock className="w-3 h-3" /> Inscrições encerradas
                      </div>
                    ) : evento.bloqueado ? (
                      <div className="mt-4 flex items-center justify-end gap-1.5 text-zinc-500 text-xs font-semibold">
                        <Lock className="w-3 h-3" /> Check-in indisponível no momento
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center justify-end gap-1 text-primary text-xs font-semibold group-hover:gap-2 transition-all">
                        Fazer check-in <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
          )}

          {/* Nenhum evento disponível */}
          {eventosProximos.length === 0 && eventosPassados.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 text-sm">Nenhum evento disponível no momento</p>
              <p className="text-zinc-600 text-xs mt-1">Fique de olho nas nossas redes sociais</p>
            </div>
          )}

          {/* Eventos passados */}
          {eventosPassados.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest mb-3">Historico de eventos</p>
              <div className="space-y-2.5">
                {eventosPassados.map(evento => (
                  <div
                    key={evento.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5 opacity-60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center gap-1 text-zinc-500 text-xs font-medium bg-zinc-800 px-2 py-0.5 rounded-full">
                            <Lock className="w-2.5 h-2.5" /> Encerrado
                          </span>
                        </div>
                        <p className="text-white font-semibold text-sm">{evento.titulo}</p>
                        <p className="text-zinc-500 text-xs mt-1">{evento.dataFormatada}</p>
                        <p className="text-zinc-600 text-xs">{evento.local}</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-zinc-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-50 bg-black/95 backdrop-blur-sm">
        <button
          onClick={() => { setEventoSelecionado(null); setStep(1) }}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs sm:text-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Voltar aos eventos
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-12">
        <div className="w-full max-w-2xl">

          {/* Logo + Título */}
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-2 sm:mb-3">Somma Running Club</p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight text-balance">
              Faça seu <span className="text-primary">Check-in</span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-2 sm:mt-3">
              Confirme sua presença em {totalSteps} passos simples
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-1 sm:gap-2 mb-8 sm:mb-10">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="flex-1 flex items-center gap-1 sm:gap-2">
                <div
                  className={`h-1 sm:h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    i + 1 <= step ? 'bg-primary' : 'bg-zinc-800'
                  }`}
                />
              </div>
            ))}
            <span className="text-xs text-zinc-500 whitespace-nowrap ml-2">{step}/{totalSteps}</span>
          </div>

          {/* STEP 1: Evento */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-400">
              <div className="mb-6 sm:mb-8">
                <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-1 sm:mb-2">Passo 1</p>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Confirme o evento</h2>
                <p className="text-zinc-400 text-xs sm:text-sm">Verifique os detalhes antes de continuar</p>
              </div>

              <div className="rounded-xl sm:rounded-2xl border-2 border-primary bg-zinc-900 overflow-hidden">
                {/* Banner */}
                <div className="bg-gradient-to-br from-primary-hover to-orange-400 p-5 sm:p-8 text-center">
                  <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-2">Somma Running Club</p>
                  <h3 className="text-lg sm:text-2xl font-bold leading-tight mb-1 text-white">Corra. Celebre. Repita.</h3>
                  <p className="text-white/80 text-xs sm:text-sm">Uma manhã de movimento, energia e comunidade — com café no final pra recarregar as baterias</p>
                </div>

                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-3 text-xs sm:text-sm">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-zinc-400 text-xs">Data</p>
                      <p className="text-white font-medium text-sm sm:text-base">{eventoSelecionado.dataFormatada}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs sm:text-sm">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-zinc-400 text-xs">Horário</p>
                      <p className="text-white font-medium text-sm sm:text-base">{formatarHorario(eventoSelecionado.horarioInicio)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs sm:text-sm">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-zinc-400 text-xs">Local</p>
                      {eventoSelecionado.localUrl ? (
                        <a
                          href={eventoSelecionado.localUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-medium text-sm sm:text-base hover:text-orange-400 underline underline-offset-2 transition-colors"
                        >
                          {eventoSelecionado.local}
                        </a>
                      ) : (
                        <p className="text-white font-medium text-sm sm:text-base">{eventoSelecionado.local}</p>
                      )}
                    </div>
                  </div>

                  {eventoSelecionado.descricao && (
                    <div className="pt-3 border-t border-zinc-800 mt-3">
                      <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">{eventoSelecionado.descricao}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 sm:mt-8">
                <button
                  onClick={handleNext}
                  className="w-full bg-primary hover:bg-orange-400 active:bg-primary-hover text-white font-semibold py-3 sm:py-4 rounded-xl sm:rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 text-sm sm:text-base touch-none"
                >
                  Confirmar e continuar <ArrowRight className="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Pelotão */}
          {step === 2 && eventoSelecionado?.tipo !== 'personalizado' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-400">
              <div className="mb-6 sm:mb-8">
                <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-1 sm:mb-2">Passo 2</p>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Escolha seu pelotão</h2>
                <p className="text-zinc-400 text-xs sm:text-sm">Selecione a distância que mais combina com você</p>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                {pelotons.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setFormData(prev => ({ ...prev, peloton: p.id }))}
                    className={`w-full text-left rounded-lg sm:rounded-2xl border-2 p-4 sm:p-5 transition-all duration-200 ${
                      formData.peloton === p.id
                        ? 'border-primary bg-primary/10'
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-base sm:text-xl font-bold transition-all flex-shrink-0 ${
                          formData.peloton === p.id ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {p.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm sm:text-base">{p.label}</p>
                          <p className="text-zinc-400 text-xs mt-0.5 line-clamp-2">{p.description}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        formData.peloton === p.id ? 'border-primary bg-primary' : 'border-zinc-600'
                      }`}>
                        {formData.peloton === p.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 sm:gap-3 mt-6 sm:mt-8">
                <button
                  onClick={handlePrev}
                  className="flex-1 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold py-3 sm:py-4 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-xs sm:text-sm touch-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Voltar
                </button>
                <button
                  onClick={handleNext}
                  disabled={!formData.peloton}
                  className="flex-1 bg-primary hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3 sm:py-4 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 disabled:cursor-not-allowed text-xs sm:text-sm touch-none"
                >
                  Continuar <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Dados pessoais */}
          {((step === 3 && eventoSelecionado?.tipo !== 'personalizado') || (step === 2 && eventoSelecionado?.tipo === 'personalizado')) && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-400">
              <div className="mb-6 sm:mb-8">
                <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-1 sm:mb-2">
                  Passo {eventoSelecionado?.tipo === 'personalizado' ? 2 : 3}
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Seus dados</h2>
                <p className="text-zinc-400 text-xs sm:text-sm">Precisamos de algumas informações para confirmar sua vaga</p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1.5 sm:mb-2">
                    Nome completo <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: João Silva Santos"
                    autoFocus
                    className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-primary text-white placeholder:text-zinc-600 rounded-lg sm:rounded-xl px-3.5 sm:px-5 py-3 sm:py-4 text-sm outline-none transition-all duration-200"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1.5 sm:mb-2">
                    Telefone <span className="text-primary">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formatPhone(formData.telefone)}
                    onChange={e => setFormData(prev => ({ ...prev, telefone: e.target.value.replace(/\D/g, '') }))}
                    placeholder="(61) 99999-9999"
                    className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-primary text-white placeholder:text-zinc-600 rounded-lg sm:rounded-xl px-3.5 sm:px-5 py-3 sm:py-4 text-sm outline-none transition-all duration-200"
                  />
                </div>

                {/* Sexo */}
                <div>
                  <label className="block text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1.5 sm:mb-2">
                    Sexo <span className="text-primary">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {(['masculino', 'feminino'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, sexo: s }))}
                        className={`py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 font-semibold text-xs sm:text-sm capitalize transition-all duration-200 ${
                          formData.sexo === s
                            ? 'border-primary bg-primary/10 text-orange-400'
                            : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1.5 sm:mb-2">
                    E-mail <span className="text-primary">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-primary text-white placeholder:text-zinc-600 rounded-lg sm:rounded-xl px-3.5 sm:px-5 py-3 sm:py-4 text-sm outline-none transition-all duration-200"
                  />
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1.5 sm:mb-2">
                    CPF <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={formatCPF(formData.cpf)}
                    onChange={e => setFormData(prev => ({ ...prev, cpf: e.target.value.replace(/\D/g, '') }))}
                    placeholder="000.000.000-00"
                    className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-primary text-white placeholder:text-zinc-600 rounded-lg sm:rounded-xl px-3.5 sm:px-5 py-3 sm:py-4 text-sm outline-none transition-all duration-200 font-mono"
                  />
                </div>
              </div>

              {/* Resumo pelotão */}
              {eventoSelecionado?.tipo !== 'personalizado' && (
                <div className="mt-5 sm:mt-6 flex items-center gap-3 bg-zinc-900 rounded-lg sm:rounded-xl px-3.5 sm:px-5 py-3 sm:py-4 border border-zinc-800">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                    {formData.peloton.replace('km', '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500">Pelotão selecionado</p>
                    <p className="text-white font-semibold text-xs sm:text-sm">{formData.peloton} — {eventoSelecionado.dataFormatada}</p>
                  </div>
                </div>
              )}

              {/* Erro */}
              {error && (
                <div className="mt-4 sm:mt-6 bg-red-900/20 border border-red-500 rounded-lg sm:rounded-xl px-3.5 sm:px-5 py-3 sm:py-4">
                  <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-2 sm:gap-3 mt-6 sm:mt-8">
                <button
                  onClick={handlePrev}
                  disabled={isLoading}
                  className="flex-1 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold py-3 sm:py-4 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm touch-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canAdvance() || isLoading}
                  className="flex-1 bg-primary hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3 sm:py-4 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 disabled:cursor-not-allowed text-xs sm:text-sm touch-none"
                >
                  {isLoading ? 'Enviando...' : 'Confirmar'} {!isLoading && <Check className="w-4 h-4 sm:w-4 sm:h-4" />}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}
