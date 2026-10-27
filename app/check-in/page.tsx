'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Calendar, Check, ChevronRight, Clock, Loader2, Lock, MapPin, Users } from 'lucide-react'
import { Agenda } from './_components/Agenda'
import { BarraNav, Grupo, IconeQuadrado, Linha, Segmentado } from './_components/ios'
import { hojeEmBrasilia } from './agenda-novembro'

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
  /** LP própria do evento. Preenchida, o card leva para lá em vez de abrir o wizard. */
  lpUrl: string | null
  tipo: 'corrida' | 'personalizado'
  encerrado: boolean
  bloqueado: boolean
  dataEvento: string
  horarioInicio: string
}

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

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

/**
 * Normaliza a LP do evento e recusa o que não for http(s).
 *
 * O valor vem do banco (preenchido no admin) e acaba num `location.href` — sem
 * essa checagem, um `javascript:` gravado ali viraria execução de script. Aceita
 * caminho relativo ("/desafios-das-esteiras-evolve") além de URL completa.
 * Retorna null quando não dá para usar, e aí o card volta ao check-in normal.
 */
function lpSegura(url: string | null): string | null {
  if (!url || !url.trim()) return null
  const base = typeof window === 'undefined' ? 'https://sommaclub.com.br' : window.location.origin
  try {
    const u = new URL(url.trim(), base)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}

function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false
  const digito = (n: number) => {
    let soma = 0
    for (let i = 0; i < n; i++) soma += Number(cpf[i]) * (n + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10])
}

const validar = {
  nome: (v: string) => v.trim().split(/\s+/).length >= 2,
  telefone: (v: string) => v.length >= 10 && v.length <= 11,
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  cpf: cpfValido,
}

const AVISOS: Record<keyof typeof validar, string> = {
  nome: 'Escreva nome e sobrenome.',
  telefone: 'Confira o telefone com DDD.',
  email: 'Confira o e-mail.',
  cpf: 'Confira o CPF: os números não batem.',
}

const pelotons = [
  { id: '4km' as const, label: 'Ritmo Iniciante', description: "Alterna corrida e caminhada · 1' correndo, 2' caminhando", cor: '#30D158' },
  { id: '6km' as const, label: 'Ritmo Moderado', description: 'Ritmo constante · Pace aproximado de 6\'30"', cor: '#FFD60A' },
  { id: '8km' as const, label: 'Ritmo Avançado', description: 'Para corredores experientes · Pace aproximado de 5\'30"', cor: '#FF453A' },
]

export default function CheckInPage() {
  const router = useRouter()
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loadingEventos, setLoadingEventos] = useState(true)
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null)
  const totalSteps = eventoSelecionado?.tipo === 'personalizado' ? 2 : 3
  const [step, setStep] = useState(1)
  const [direcao, setDirecao] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [tocados, setTocados] = useState<Partial<Record<keyof typeof validar, boolean>>>({})
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    peloton: '',
    nome: '',
    telefone: '',
    sexo: '',
    email: '',
    cpf: '',
  })
  const hoje = useMemo(() => hojeEmBrasilia(), [])

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
            local: e.local || 'Parque da Cidade, Brasília, DF',
            localUrl: e.local_url || null,
            lpUrl: e.lp_url || null,
            tipo: e.tipo || 'corrida',
            encerrado: e.checkin_status === 'encerrado',
            bloqueado: e.checkin_status === 'bloqueado',
            dataEvento: e.data_evento,
            // Vazio quando a gestão ainda não confirmou o horário: a linha some.
            horarioInicio: e.horario_inicio || '',
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
              local: e.local || 'Parque da Cidade, Brasília, DF',
              localUrl: null,
              // Histórico é só leitura, não leva a lugar nenhum.
              lpUrl: null,
              tipo: 'corrida',
              encerrado: e.checkin_status === 'encerrado',
              bloqueado: e.checkin_status === 'bloqueado',
              dataEvento: e.data_evento,
              horarioInicio: '',
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

  // O assistente entra no histórico do navegador: o "voltar" do celular (e o
  // gesto de arrastar da borda no iPhone) volta para a lista em vez de sair.
  useEffect(() => {
    const aoVoltar = () => {
      setEventoSelecionado(null)
      setStep(1)
      setError('')
    }
    window.addEventListener('popstate', aoVoltar)
    return () => window.removeEventListener('popstate', aoVoltar)
  }, [])

  const abrirEvento = (evento: Evento) => {
    setEventoSelecionado(evento)
    setStep(1)
    setDirecao(1)
    setError('')
    window.history.pushState({ ...window.history.state, checkinEvento: evento.id }, '')
    window.scrollTo(0, 0)
  }

  const irPara = (n: number) => {
    setDirecao(n > step ? 1 : -1)
    setStep(n)
    window.scrollTo(0, 0)
  }

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

  const dadosOk =
    validar.nome(formData.nome) &&
    validar.telefone(formData.telefone) &&
    validar.email(formData.email) &&
    validar.cpf(formData.cpf) &&
    !!formData.sexo

  const passoDados = eventoSelecionado?.tipo === 'personalizado' ? 2 : 3

  const canAdvance = () => {
    if (step === 1) return true
    if (step === passoDados) return dadosOk
    if (step === 2) return !!formData.peloton
    return false
  }

  const handleNext = () => {
    if (canAdvance() && step < totalSteps) irPara(step + 1)
  }

  const handlePrev = () => {
    if (step > 1) irPara(step - 1)
    else window.history.back()
  }

  const handleSubmit = async () => {
    if (!dadosOk || isLoading) {
      setTocados({ nome: true, telefone: true, email: true, cpf: true })
      setTentouEnviar(true)
      return
    }
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_completo: formData.nome.trim(),
          email: formData.email.trim(),
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

      const pelotao = pelotons.find(p => p.id === formData.peloton)
      const params = new URLSearchParams({
        data: eventoSelecionado?.dataFormatada || '',
        evento: eventoSelecionado?.titulo || '',
        horario: eventoSelecionado?.horarioInicio || '07:00',
        local: eventoSelecionado?.local || '',
        local_url: eventoSelecionado?.localUrl || '',
        descricao: eventoSelecionado?.descricao || '',
      })
      if (eventoSelecionado?.tipo !== 'personalizado' && pelotao) {
        params.set('pelotao', pelotao.id)
        params.set('pelotao_label', pelotao.label)
      }
      router.push(`/check-in/sucesso?${params.toString()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar formulário')
      console.error('[v0] Erro no check-in:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const eventosProximos = eventos.filter(e => !e.encerrado)
  const eventosPassados = eventos.filter(e => e.encerrado)
  const datasReais = useMemo(
    () => new Set(eventos.filter(e => !e.encerrado).map(e => e.dataEvento)),
    [eventos],
  )

  if (!eventoSelecionado) {
    return (
      <Lista
        carregando={loadingEventos}
        proximos={eventosProximos}
        passados={eventosPassados}
        hoje={hoje}
        datasReais={datasReais}
        onAbrir={abrirEvento}
      />
    )
  }

  const ev = eventoSelecionado
  const pelotaoEscolhido = pelotons.find(p => p.id === formData.peloton)
  const aviso = (campo: keyof typeof validar) =>
    tocados[campo] && !validar[campo](formData[campo]) ? AVISOS[campo] : null
  const avisos = (['nome', 'telefone', 'email', 'cpf'] as const).map(aviso).filter(Boolean)

  return (
    <main className="flex min-h-[100dvh] flex-col">
      <BarraNav
        voltar={{ rotulo: step === 1 ? 'Eventos' : 'Voltar', onClick: handlePrev }}
        titulo="Check-in"
        direita={<span aria-live="polite">{step} de {totalSteps}</span>}
        linha={false}
      />
      {/* Progresso, colado na barra */}
      <div className="sticky top-[calc(44px+var(--ck-topo))] z-30 h-[3px] bg-white/10" aria-hidden>
        <motion.div
          className="h-full bg-[var(--ck-tint)]"
          initial={false}
          animate={{ width: `${(step / totalSteps) * 100}%` }}
          transition={{ type: 'spring', damping: 30, stiffness: 260 }}
        />
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-x-hidden px-4 pt-5 sm:px-6 sm:pt-8">
        <AnimatePresence mode="wait" initial={false} custom={direcao}>
          <motion.div
            key={step}
            custom={direcao}
            initial={{ opacity: 0, x: direcao * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direcao * -28 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {/* PASSO 1: evento */}
            {step === 1 && (
              <>
                <TituloPasso passo={1} total={totalSteps} titulo="Confirme o evento" apoio="Confira os detalhes antes de continuar." />

                <div className="overflow-hidden rounded-[18px] bg-gradient-to-br from-[#FF2C03] via-[#FF4A12] to-[#FF8A1F] p-5 sm:p-7">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/80">Somma Running Club</p>
                  <h2 className="mt-1.5 text-[24px] font-bold leading-[1.1] tracking-[-0.03em] text-white sm:text-[30px]">{ev.titulo}</h2>
                  <p className="mt-2 text-[15px] leading-snug text-white/85">
                    Corra. Celebre. Repita. Uma manhã de movimento, energia e comunidade, com café no final pra recarregar as baterias.
                  </p>
                </div>

                <Grupo className="mt-5" rodape={ev.descricao}>
                  <Linha icone={<IconeQuadrado cor="#FF2C03"><Calendar /></IconeQuadrado>}>
                    <span className="block text-[13px] text-[var(--ck-sec)]">Data</span>
                    <span className="block text-[16px]">{ev.dataFormatada}</span>
                  </Linha>
                  {ev.horarioInicio ? (
                    <Linha icone={<IconeQuadrado cor="#FF9F0A"><Clock /></IconeQuadrado>}>
                      <span className="block text-[13px] text-[var(--ck-sec)]">Horário</span>
                      <span className="block text-[16px]">{formatarHorario(ev.horarioInicio)}</span>
                    </Linha>
                  ) : null}
                  {ev.localUrl ? (
                    <a href={ev.localUrl} target="_blank" rel="noopener noreferrer" className="block active:bg-white/10">
                      <Linha
                        icone={<IconeQuadrado cor="#30D158"><MapPin /></IconeQuadrado>}
                        direita={<ArrowUpRight className="h-[18px] w-[18px] text-[var(--ck-ter)]" />}
                      >
                        <span className="block text-[13px] text-[var(--ck-sec)]">Local · abrir no mapa</span>
                        <span className="block text-[16px]">{ev.local}</span>
                      </Linha>
                    </a>
                  ) : (
                    <Linha icone={<IconeQuadrado cor="#30D158"><MapPin /></IconeQuadrado>}>
                      <span className="block text-[13px] text-[var(--ck-sec)]">Local</span>
                      <span className="block text-[16px]">{ev.local}</span>
                    </Linha>
                  )}
                </Grupo>
              </>
            )}

            {/* PASSO 2: pelotão */}
            {step === 2 && ev.tipo !== 'personalizado' && (
              <>
                <TituloPasso passo={2} total={totalSteps} titulo="Escolha seu pelotão" apoio="A distância que mais combina com você hoje." />
                <div role="radiogroup" aria-label="Pelotão">
                  <Grupo rodape="Na dúvida, comece pelo mais leve. Dá para trocar de pelotão no próximo encontro.">
                    {pelotons.map(p => {
                      const ativo = formData.peloton === p.id
                      return (
                        <Linha
                          key={p.id}
                          onClick={() => setFormData(prev => ({ ...prev, peloton: p.id }))}
                          selecionada={ativo}
                          className="py-1"
                          icone={
                            <span
                              className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] text-[15px] font-bold text-black"
                              style={{ background: p.cor }}
                              aria-hidden
                            >
                              {p.id.replace('km', '')}
                              <span className="-mt-1 block text-[9px] font-semibold leading-none">km</span>
                            </span>
                          }
                          direita={
                            <Check
                              className={`h-5 w-5 shrink-0 text-[var(--ck-tint)] transition-opacity ${ativo ? 'opacity-100' : 'opacity-0'}`}
                              strokeWidth={3}
                            />
                          }
                        >
                          <span className="block text-[17px] font-medium">{p.label}</span>
                          <span className="mt-0.5 block text-[13px] leading-snug text-[var(--ck-sec)]">{p.description}</span>
                        </Linha>
                      )
                    })}
                  </Grupo>
                </div>
              </>
            )}

            {/* PASSO 3 (ou 2, nos eventos personalizados): dados */}
            {step === passoDados && (
              <>
                <TituloPasso passo={passoDados} total={totalSteps} titulo="Seus dados" apoio="Para confirmar sua vaga. Leva menos de um minuto." />
                <form
                  id="ck-form"
                  noValidate
                  onSubmit={e => {
                    e.preventDefault()
                    handleSubmit()
                  }}
                >
                  <Grupo
                    rodape={
                      avisos.length > 0 ? (
                        <span className="text-[#FF453A]" role="alert">{avisos[0]}</span>
                      ) : (
                        'Usamos o CPF para identificar sua presença no evento.'
                      )
                    }
                  >
                    <Campo
                      rotulo="Nome"
                      erro={!!aviso('nome')}
                      input={{
                        value: formData.nome,
                        onChange: e => setFormData(prev => ({ ...prev, nome: e.target.value })),
                        onBlur: () => setTocados(t => ({ ...t, nome: true })),
                        placeholder: 'Nome completo',
                        autoComplete: 'name',
                        autoCapitalize: 'words',
                        enterKeyHint: 'next',
                        name: 'name',
                      }}
                    />
                    <Campo
                      rotulo="Telefone"
                      erro={!!aviso('telefone')}
                      input={{
                        type: 'tel',
                        inputMode: 'tel',
                        value: formatPhone(formData.telefone),
                        onChange: e => setFormData(prev => ({ ...prev, telefone: e.target.value.replace(/\D/g, '').slice(0, 11) })),
                        onBlur: () => setTocados(t => ({ ...t, telefone: true })),
                        placeholder: '(61) 99999-9999',
                        autoComplete: 'tel-national',
                        enterKeyHint: 'next',
                        name: 'tel',
                      }}
                    />
                    <Campo
                      rotulo="E-mail"
                      erro={!!aviso('email')}
                      input={{
                        type: 'email',
                        inputMode: 'email',
                        value: formData.email,
                        onChange: e => setFormData(prev => ({ ...prev, email: e.target.value })),
                        onBlur: () => setTocados(t => ({ ...t, email: true })),
                        placeholder: 'voce@email.com',
                        autoComplete: 'email',
                        autoCapitalize: 'none',
                        autoCorrect: 'off',
                        spellCheck: false,
                        enterKeyHint: 'next',
                        name: 'email',
                      }}
                    />
                    <Campo
                      rotulo="CPF"
                      erro={!!aviso('cpf')}
                      input={{
                        inputMode: 'numeric',
                        value: formatCPF(formData.cpf),
                        onChange: e => setFormData(prev => ({ ...prev, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) })),
                        onBlur: () => setTocados(t => ({ ...t, cpf: true })),
                        placeholder: '000.000.000-00',
                        autoComplete: 'off',
                        enterKeyHint: 'done',
                        name: 'cpf',
                        className: 'tabular-nums',
                      }}
                    />
                  </Grupo>

                  <Grupo
                    className="mt-6"
                    titulo="Sexo"
                    rodape={
                      tentouEnviar && !formData.sexo ? (
                        <span className="text-[#FF453A]" role="alert">Escolha uma opção.</span>
                      ) : undefined
                    }
                  >
                    <div className="p-2">
                      <Segmentado
                        rotulo="Sexo"
                        valor={formData.sexo}
                        onChange={s => setFormData(prev => ({ ...prev, sexo: s }))}
                        opcoes={[
                          { valor: 'masculino', rotulo: 'Masculino' },
                          { valor: 'feminino', rotulo: 'Feminino' },
                        ]}
                      />
                    </div>
                  </Grupo>

                  {ev.tipo !== 'personalizado' && pelotaoEscolhido ? (
                    <Grupo className="mt-6" titulo="Resumo">
                      <Linha
                        icone={<IconeQuadrado cor={pelotaoEscolhido.cor}><Users className="text-black" /></IconeQuadrado>}
                        direita={
                          <button
                            type="button"
                            onClick={() => irPara(2)}
                            className="ck-toque shrink-0 text-[15px] text-[var(--ck-tint)]"
                          >
                            Alterar
                          </button>
                        }
                      >
                        <span className="block text-[16px]">
                          {pelotaoEscolhido.id.replace('km', ' km')} · {pelotaoEscolhido.label}
                        </span>
                        <span className="block truncate text-[13px] text-[var(--ck-sec)]">{ev.dataFormatada}</span>
                      </Linha>
                    </Grupo>
                  ) : null}

                  {error ? (
                    <div role="alert" className="mt-6 rounded-[12px] bg-[#FF453A]/15 px-4 py-3 text-[15px] leading-snug text-[#FF6961]">
                      {error}
                    </div>
                  ) : null}
                  {/* Enter no teclado envia */}
                  <button type="submit" hidden aria-hidden tabIndex={-1} />
                </form>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="ck-espaco-rodape" />
      </div>

      <div className="ck-rodape">
        <div className="mx-auto max-w-2xl">
          {step === passoDados ? (
            <button
              type="submit"
              form="ck-form"
              disabled={isLoading}
              aria-disabled={!dadosOk}
              className={`ck-toque flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] text-[17px] font-semibold transition-colors ${
                dadosOk ? 'bg-[var(--ck-tint)] text-white' : 'bg-white/10 text-white/40'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Enviando
                </>
              ) : (
                <>
                  Confirmar check-in <Check className="h-5 w-5" strokeWidth={2.6} />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance()}
              className="ck-toque flex h-[50px] w-full items-center justify-center gap-1 rounded-[14px] bg-[var(--ck-tint)] text-[17px] font-semibold text-white transition-colors disabled:bg-white/10 disabled:text-white/40"
            >
              {step === 1 ? 'Confirmar e continuar' : 'Continuar'} <ChevronRight className="h-5 w-5" strokeWidth={2.6} />
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

function TituloPasso({ passo, total, titulo, apoio }: { passo: number; total: number; titulo: string; apoio: string }) {
  return (
    <div className="mb-5 px-1 sm:mb-6">
      <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--ck-tint)]">
        Passo {passo} de {total}
      </p>
      <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-[-0.03em] sm:text-[34px]">{titulo}</h1>
      <p className="mt-1 text-[15px] text-[var(--ck-sec)]">{apoio}</p>
    </div>
  )
}

function Campo({
  rotulo,
  erro,
  input,
}: {
  rotulo: string
  erro: boolean
  input: React.InputHTMLAttributes<HTMLInputElement>
}) {
  return (
    <Linha rotulo>
      <span className="flex items-center gap-3">
        <span className={`w-[76px] shrink-0 text-[17px] ${erro ? 'text-[#FF453A]' : ''}`}>{rotulo}</span>
        <input
          {...input}
          aria-invalid={erro || undefined}
          className={`h-7 min-w-0 flex-1 bg-transparent text-white outline-none ${input.className ?? ''}`}
        />
      </span>
    </Linha>
  )
}

/* ------------------------------ lista ------------------------------ */

function Lista({
  carregando,
  proximos,
  passados,
  hoje,
  datasReais,
  onAbrir,
}: {
  carregando: boolean
  proximos: Evento[]
  passados: Evento[]
  hoje: string
  datasReais: Set<string>
  onAbrir: (e: Evento) => void
}) {
  // Título grande que, ao sair da tela, passa para a barra (como no iOS).
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const [compacto, setCompacto] = useState(false)
  useEffect(() => {
    const el = tituloRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setCompacto(!e.isIntersecting), {
      rootMargin: '-56px 0px 0px 0px',
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const [verHistorico, setVerHistorico] = useState(false)
  const historicoVisivel = verHistorico ? passados : passados.slice(0, 3)

  return (
    <main className="flex min-h-[100dvh] flex-col">
      <BarraNav voltar={{ rotulo: 'Site', href: '/' }} titulo="Check-in" tituloVisivel={compacto} linha={compacto} />

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-[calc(40px+var(--ck-base))] sm:px-6">
        <div className="pb-2 pt-1 sm:pt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo_Nova_Somma_Branca_Laranja.svg" alt="SOMMA Club" className="mb-3 h-6 w-auto sm:h-7" />
          <h1 ref={tituloRef} className="text-[34px] font-bold leading-[1.1] tracking-[-0.035em] sm:text-[44px]">
            Check-in
          </h1>
          <p className="mt-1 text-[15px] text-[var(--ck-sec)] sm:text-[17px]">
            Confirme sua presença nos encontros do SOMMA.
          </p>
        </div>

        {/* Abertos agora */}
        <section aria-labelledby="ck-abertos" className="mt-5">
          <h2 id="ck-abertos" className="mb-3 px-1 text-[22px] font-bold tracking-[-0.03em] sm:text-[26px]">
            {proximos.length > 1 ? 'Próximos encontros' : 'Próximo encontro'}
          </h2>
          {carregando ? (
            <div className="ck-esqueleto h-[248px] rounded-[22px]" aria-label="Carregando eventos" role="status" />
          ) : proximos.length > 0 ? (
            <div className="flex flex-col gap-3">
              {proximos.map((e, i) => (
                <CartaoEvento key={e.id} evento={e} onAbrir={onAbrir} indice={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] bg-[var(--ck-cel)] px-5 py-8 text-center">
              <Calendar className="mx-auto h-8 w-8 text-[var(--ck-ter)]" />
              <p className="mt-3 text-[17px] font-semibold">Nenhum check-in aberto agora</p>
              <p className="mt-1 text-[15px] text-[var(--ck-sec)]">Dá uma olhada no que vem por aí.</p>
            </div>
          )}
        </section>

        {carregando ? (
          <div className="mt-9 space-y-2.5" aria-hidden>
            <div className="ck-esqueleto h-6 w-52 rounded-md" />
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="ck-esqueleto h-[96px] rounded-[18px]" />
            ))}
          </div>
        ) : (
          <Agenda hoje={hoje} datasReais={datasReais} />
        )}

        {!carregando && passados.length > 0 ? (
          <Grupo
            className="mt-10"
            titulo="Já aconteceram"
            rodape={
              passados.length > 3 ? (
                <button type="button" onClick={() => setVerHistorico(v => !v)} className="text-[var(--ck-tint)]">
                  {verHistorico ? 'Mostrar menos' : `Ver todos (${passados.length})`}
                </button>
              ) : undefined
            }
          >
            {historicoVisivel.map(e => {
              const [, m, d] = e.dataEvento.split('-').map(Number)
              return (
                <Linha
                  key={e.id}
                  icone={
                    <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[9px] bg-[var(--ck-cel-2)] text-center leading-none" aria-hidden>
                      <span>
                        <span className="block text-[9px] font-semibold uppercase text-[var(--ck-sec)]">{MESES_CURTOS[m - 1]}</span>
                        <span className="block text-[16px] font-semibold">{String(d).padStart(2, '0')}</span>
                      </span>
                    </span>
                  }
                  direita={<span className="shrink-0 text-[13px] text-[var(--ck-ter)]">Encerrado</span>}
                >
                  <span className="block truncate text-[16px]">{e.titulo}</span>
                  <span className="block truncate text-[13px] text-[var(--ck-sec)]">{e.local}</span>
                </Linha>
              )
            })}
          </Grupo>
        ) : null}
      </div>
    </main>
  )
}

/** Card de evento real (vem da gestão), no formato de widget. */
function CartaoEvento({ evento, onAbrir, indice }: { evento: Evento; onAbrir: (e: Evento) => void; indice: number }) {
  // Evento com LP própria não passa pelo wizard: o destino é a LP, e por isso
  // o status de check-in (inclusive "bloqueado") não vale para ele: quem
  // controla inscrição ali é a própria página.
  const lp = lpSegura(evento.lpUrl)
  const travado = !lp && evento.bloqueado
  const [, m, d] = evento.dataEvento.split('-').map(Number)

  const acao = useCallback(() => {
    if (lp) window.location.href = lp
    else if (!evento.bloqueado) onAbrir(evento)
  }, [lp, evento, onAbrir])

  return (
    <article
      className={`ck-sobe overflow-hidden rounded-[22px] bg-[var(--ck-cel)] ${travado ? '' : 'cursor-pointer'}`}
      style={{ animationDelay: `${indice * 60}ms` }}
      onClick={acao}
    >
      <div
        className={`relative p-4 sm:p-5 ${
          travado ? 'bg-[var(--ck-cel-2)]' : 'bg-gradient-to-br from-[#FF2C03] via-[#FF4A12] to-[#FF8A1F]'
        }`}
      >
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
            travado ? 'bg-white/10 text-[var(--ck-sec)]' : 'bg-black/20 text-white'
          }`}
        >
          {travado ? (
            <>
              <Lock className="h-3 w-3" /> Check-in em breve
            </>
          ) : lp ? (
            <>Página do evento</>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              Check-in aberto
            </>
          )}
        </span>
        <div className="mt-3 flex items-center gap-3.5">
          <div className="grid h-[60px] w-[54px] shrink-0 place-items-center rounded-[12px] bg-white text-center leading-none shadow-[0_6px_16px_rgba(0,0,0,0.18)]" aria-hidden>
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[#FF2C03]">{MESES_CURTOS[m - 1]}</span>
              <span className="mt-0.5 block text-[26px] font-bold tracking-[-0.04em] text-black">{String(d).padStart(2, '0')}</span>
            </span>
          </div>
          <h3 className={`text-[20px] font-bold leading-[1.15] tracking-[-0.03em] sm:text-[24px] ${travado ? 'text-white/80' : 'text-white'}`}>
            {evento.titulo}
          </h3>
        </div>
      </div>

      <div className="px-4 pt-1 sm:px-5">
        {evento.descricao ? (
          <p className="pb-1 pt-3 text-[15px] leading-snug text-[var(--ck-sec)]">{evento.descricao}</p>
        ) : null}
        <ul className="divide-y divide-[var(--ck-sep)] text-[15px]">
          <li className="flex items-center gap-2.5 py-2.5">
            <Calendar className="h-4 w-4 shrink-0 text-[var(--ck-sec)]" /> {evento.dataFormatada}
          </li>
          {evento.horarioInicio ? (
            <li className="flex items-center gap-2.5 py-2.5">
              <Clock className="h-4 w-4 shrink-0 text-[var(--ck-sec)]" /> {formatarHorario(evento.horarioInicio)}
            </li>
          ) : null}
          <li className="flex items-center gap-2.5 py-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-[var(--ck-sec)]" />
            {evento.localUrl ? (
              <a
                href={evento.localUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="min-w-0 truncate underline decoration-white/30 underline-offset-2"
              >
                {evento.local}
              </a>
            ) : (
              <span className="min-w-0 truncate">{evento.local}</span>
            )}
          </li>
        </ul>
      </div>

      <div className="p-4 pt-2 sm:p-5 sm:pt-2">
        {travado ? (
          <button
            type="button"
            disabled
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-white/10 text-[17px] font-semibold text-white/40"
          >
            <Lock className="h-4 w-4" /> Check-in indisponível no momento
          </button>
        ) : (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              acao()
            }}
            className="ck-toque flex h-[50px] w-full items-center justify-center gap-1 rounded-[14px] bg-white text-[17px] font-semibold text-black outline-none focus-visible:ring-2 focus-visible:ring-[var(--ck-tint)]"
          >
            {lp ? 'Ver o evento' : 'Fazer check-in'} <ChevronRight className="h-5 w-5" strokeWidth={2.6} />
          </button>
        )}
      </div>
    </article>
  )
}
