'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, LogOut, Users, ClipboardList, CheckSquare,
  MessageCircle, Check, X, ShieldCheck, ChevronRight,
  ArrowLeft, Loader2, RefreshCw, Lock, ChevronDown,
  Trophy, Dices, Filter, Clock, Repeat, Plus, Eye, EyeOff, Shuffle,
} from 'lucide-react'
import { fisherYatesShuffle } from '@/lib/sorteio/utils'
import { LISTA_TREINAO_SPECIAL_DAY } from '@/lib/sorteio/lista-treinao-special-day'
import type { ParticipanteSorteio } from '@/lib/sorteio/types'
import SorteioMachine from '@/components/sorteio/SorteioMachine'
import GanhadorCard from '@/components/sorteio/GanhadorCard'
import SorteioHistorico from '@/components/sorteio/SorteioHistorico'
import type { Ganhador, Sorteio, EstatisticasSorteio } from '@/lib/sorteio/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Insider = { id: string; nome: string }

function insiderFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, credentials: 'include' })
}

type Membro = {
  id: number
  nome_completo: string
  email: string
  whatsapp: string
  cpf: string
  sexo: string
  data_nascimento: string
  cep: string
  data_de_cadastro: string
}

type Checkin = {
  id: string
  nome_completo: string
  email: string
  telefone: string
  cpf: string
  sexo: string
  pelotao: string
  nome_do_evento: string
  data_do_evento: string
  data_hora_checkin: string
  validacao_do_checkin: boolean
}

type EventoOption = {
  id: string
  titulo: string
  data_evento: string
  checkin_status: 'aberto' | 'bloqueado' | 'encerrado'
}

type Modulo = 'home' | 'membros' | 'checkins' | 'validar' | 'validar-shakeout' | 'validar-tfsports' | 'sorteio' | 'sorteio-lista' | 'transferencias'

type ShakeoutCheckin = {
  id: string
  nome_completo: string
  cpf: string
  email: string
  telefone: string
  uf: string
  sexo: string
  validacao_do_checkin: boolean
  validated_at: string | null
  data_de_cadastro: string
}

type TfSportsCheckin = {
  id: number
  nome_atleta: string
  documento: string
  genero: string | null
  tamanho_camiseta: string | null
  validacao_do_checkin: boolean
  validated_at: string | null
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatDate(d: string) {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function formatDateTime(d: string) {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

// ─── Dropdown de Eventos ──────────────────────────────────────────────────────

function EventoSelector({
  eventos,
  selectedId,
  onChange,
}: {
  eventos: EventoOption[]
  selectedId: string
  onChange: (id: string) => void
}) {
  const selected = eventos.find(e => e.id === selectedId)
  const statusLabel = (s: string) => s === 'aberto' ? 'Aberto' : s === 'encerrado' ? 'Encerrado' : 'Bloqueado'
  const statusColor = (s: string) => s === 'aberto' ? 'text-green-400' : s === 'encerrado' ? 'text-zinc-500' : 'text-yellow-400'

  return (
    <div className="relative">
      <select
        value={selectedId}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-zinc-900 border border-zinc-700 focus:border-[#ff2c03] text-white rounded-xl px-4 py-3 pr-10 text-sm outline-none transition-all cursor-pointer"
      >
        {eventos.map(e => (
          <option key={e.id} value={e.id}>
            {e.titulo} — {formatDate(e.data_evento)} ({statusLabel(e.checkin_status)})
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
      {selected && (
        <div className="flex items-center gap-2 mt-1.5 px-1">
          <span className={`text-xs font-medium ${statusColor(selected.checkin_status)}`}>
            {statusLabel(selected.checkin_status)}
          </span>
          <span className="text-zinc-600 text-xs">•</span>
          <span className="text-zinc-500 text-xs">{formatDate(selected.data_evento)}</span>
        </div>
      )}
    </div>
  )
}

// ─── Tela de Login ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (insider: Insider) => void }) {
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const res = await insiderFetch('/api/insider/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpf.replace(/\D/g, '') }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Acesso negado.'); return }
      onLogin(data.insider)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #1a0800 0%, #0d0300 40%, #000000 100%)' }}
    >
      {/* Ondas animadas — cor ajustada para #ff2c03 */}
      <style>{`
        .ocean {
          height: 160px;
          width: 100%;
          position: absolute;
          bottom: 0;
          left: 0;
          background: #110200;
        }
        .wave {
          background: url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/85486/wave.svg) repeat-x;
          position: absolute;
          top: -100px;
          width: 6400px;
          height: 120px;
          animation: wave 8s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite;
          transform: translate3d(0, 0, 0);
          /* azul padrão → #ff2c03: hue-rotate ~-140deg + saturate alto */
          filter: hue-rotate(200deg) saturate(10) brightness(0.75);
          opacity: 0.55;
        }
        .wave:nth-of-type(2) {
          top: -75px;
          animation: wave 8s cubic-bezier(0.36, 0.45, 0.63, 0.53) -0.125s infinite, swell 7s ease -1.25s infinite;
          filter: hue-rotate(200deg) saturate(8) brightness(0.5);
          opacity: 0.35;
        }
        @keyframes wave {
          0% { margin-left: 0; }
          100% { margin-left: -1600px; }
        }
        @keyframes swell {
          0%, 100% { transform: translate3d(0, -18px, 0); }
          50% { transform: translate3d(0, 6px, 0); }
        }
      `}</style>

      <div className="ocean">
        <div className="wave" />
        <div className="wave" />
      </div>

      {/* Card de login */}
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="https://cdn.shopify.com/s/files/1/0788/1932/8253/files/Logo_Nova_Somma_Branca_Laranja.svg?v=1772736456"
              alt="Somma Running Club"
              className="h-12 w-auto"
            />
          </div>
          <p className="text-[#ff2c03] text-xs font-semibold uppercase tracking-widest mb-1">Acesso Restrito</p>
          <h1 className="text-2xl font-bold text-white">Insider Connect</h1>
          <p className="text-zinc-500 text-sm mt-1">Painel de controle Somma Club</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 uppercase tracking-wide mb-1.5 font-medium">
              CPF do Insider
            </label>
            <input
              type="text"
              value={formatCPF(cpf)}
              onChange={e => setCpf(e.target.value.replace(/\D/g, ''))}
              placeholder="000.000.000-00"
              maxLength={14}
              autoFocus
              className="w-full bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-700 focus:border-[#ff2c03] text-white placeholder:text-zinc-600 rounded-xl px-4 py-3.5 text-sm outline-none transition-all font-mono"
            />
          </div>

          {erro && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/40 rounded-lg px-3.5 py-2.5">
              <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-xs">{erro}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || cpf.replace(/\D/g, '').length < 11}
            className="w-full bg-[#ff2c03] hover:bg-[#cc2402] disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-sm disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {loading ? 'Verificando...' : 'Acessar Painel'}
          </button>
        </form>
      </div>
    </main>
  )
}

// ─── Módulo: Membros ──────────────────────────────────────────────────────────

function ModuloMembros() {
  const [membros, setMembros] = useState<Membro[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [membroSelecionado, setMembroSelecionado] = useState<Membro | null>(null)
  const [msgWpp, setMsgWpp] = useState('')

  const buscarMembros = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await insiderFetch(`/api/insider/membros?busca=${encodeURIComponent(q)}`)
      const data = await res.json()
      setMembros(data.membros || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { buscarMembros('') }, [buscarMembros])

  useEffect(() => {
    const t = setTimeout(() => buscarMembros(busca), 400)
    return () => clearTimeout(t)
  }, [busca, buscarMembros])

  function abrirWhatsApp(membro: Membro) {
    if (!membro.whatsapp || !msgWpp.trim()) return
    const numero = membro.whatsapp.replace(/\D/g, '')
    const url = `https://wa.me/55${numero}?text=${encodeURIComponent(msgWpp)}`
    window.open(url, '_blank')
  }

  if (membroSelecionado) {
    return (
      <div className="space-y-4">
        <button onClick={() => setMembroSelecionado(null)} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar à lista
        </button>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
          <div>
            <p className="text-[#ff2c03] text-xs font-semibold uppercase tracking-widest mb-1">Membro</p>
            <h2 className="text-white text-xl font-bold">{membroSelecionado.nome_completo}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'E-mail', valor: membroSelecionado.email },
              { label: 'WhatsApp', valor: membroSelecionado.whatsapp },
              { label: 'CPF', valor: membroSelecionado.cpf },
              { label: 'Sexo', valor: membroSelecionado.sexo },
              { label: 'Data de Nascimento', valor: membroSelecionado.data_nascimento },
              { label: 'CEP', valor: membroSelecionado.cep },
              { label: 'Cadastro em', valor: membroSelecionado.data_de_cadastro },
            ].map(({ label, valor }) => (
              <div key={label} className="bg-zinc-800/50 rounded-xl p-3">
                <p className="text-zinc-500 text-xs mb-0.5">{label}</p>
                <p className="text-white text-sm font-medium">{valor || '—'}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2 font-medium">Enviar mensagem WhatsApp</p>
            <textarea
              value={msgWpp}
              onChange={e => setMsgWpp(e.target.value)}
              placeholder="Digite a mensagem para enviar..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-[#ff2c03] text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
            />
            <button
              onClick={() => abrirWhatsApp(membroSelecionado)}
              disabled={!membroSelecionado.whatsapp || !msgWpp.trim()}
              className="mt-2 w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail, CPF ou WhatsApp..."
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#ff2c03] text-white placeholder:text-zinc-600 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all"
          />
        </div>
        <button onClick={() => buscarMembros(busca)} className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="text-xs text-zinc-500">{membros.length} membro(s) encontrado(s)</div>

      <div className="space-y-2">
        {loading && membros.length === 0 ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : membros.map(m => (
          <button
            key={m.id}
            onClick={() => setMembroSelecionado(m)}
            className="w-full text-left bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-all group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{m.nome_completo}</p>
                <p className="text-zinc-500 text-xs mt-0.5 truncate">{m.email}</p>
                <div className="flex items-center gap-3 mt-1">
                  {m.whatsapp && <span className="text-zinc-600 text-xs">{m.whatsapp}</span>}
                  {m.sexo && <span className="text-zinc-600 text-xs capitalize">{m.sexo}</span>}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Módulo: Consultar Checkins ───────────────────────────────────────────────

function ModuloCheckins() {
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [eventos, setEventos] = useState<EventoOption[]>([])
  const [selectedEventoId, setSelectedEventoId] = useState('')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)

  const buscarCheckins = useCallback(async (q: string, eventoId?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('busca', q)
      if (eventoId) params.set('evento_id', eventoId)
      const res = await insiderFetch(`/api/insider/checkins?${params}`)
      const data = await res.json()
      setCheckins(data.checkins || [])
      if (data.eventos) setEventos(data.eventos)
      if (data.evento?.id && !eventoId) setSelectedEventoId(data.evento.id)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { buscarCheckins('') }, [buscarCheckins])

  useEffect(() => {
    const t = setTimeout(() => buscarCheckins(busca, selectedEventoId), 400)
    return () => clearTimeout(t)
  }, [busca, buscarCheckins, selectedEventoId])

  function handleEventoChange(id: string) {
    setSelectedEventoId(id)
    setBusca('')
    buscarCheckins('', id)
  }

  const validados = checkins.filter(c => c.validacao_do_checkin).length
  const pendentes = checkins.filter(c => !c.validacao_do_checkin).length

  return (
    <div className="space-y-4">
      {eventos.length > 0 && (
        <EventoSelector
          eventos={eventos}
          selectedId={selectedEventoId}
          onChange={handleEventoChange}
        />
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total', valor: checkins.length, cor: 'text-white' },
          { label: 'Validados', valor: validados, cor: 'text-green-400' },
          { label: 'Pendentes', valor: pendentes, cor: 'text-yellow-400' },
        ].map(({ label, valor, cor }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${cor}`}>{valor}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, CPF ou e-mail..."
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#ff2c03] text-white placeholder:text-zinc-600 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all"
          />
        </div>
        <button onClick={() => buscarCheckins(busca, selectedEventoId)} className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2">
        {loading && checkins.length === 0 ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : checkins.map(c => (
          <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-medium text-sm">{c.nome_completo}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.validacao_do_checkin ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                    {c.validacao_do_checkin ? 'Validado' : 'Pendente'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  <span className="text-zinc-500 text-xs">{c.email}</span>
                  <span className="text-zinc-500 text-xs">{c.telefone}</span>
                  <span className="text-zinc-600 text-xs font-mono">{c.cpf}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  {c.pelotao && (
                    <span className="text-xs bg-[#ff2c03]/10 text-[#ff2c03] px-2 py-0.5 rounded-full">{c.pelotao}</span>
                  )}
                  <span className="text-zinc-600 text-xs">{formatDateTime(c.data_hora_checkin)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Módulo: Validar Checkins ─────────────────────────────────────────────────

function ModuloValidar() {
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [eventos, setEventos] = useState<EventoOption[]>([])
  const [selectedEventoId, setSelectedEventoId] = useState('')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [validando, setValidando] = useState<string | null>(null)

  const buscarCheckins = useCallback(async (q: string, eventoId?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('busca', q)
      if (eventoId) params.set('evento_id', eventoId)
      const res = await insiderFetch(`/api/insider/validar?${params}`)
      const data = await res.json()
      setCheckins(data.checkins || [])
      if (data.eventos) setEventos(data.eventos)
      if (data.evento?.id && !eventoId) setSelectedEventoId(data.evento.id)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { buscarCheckins('') }, [buscarCheckins])

  useEffect(() => {
    const t = setTimeout(() => buscarCheckins(busca, selectedEventoId), 400)
    return () => clearTimeout(t)
  }, [busca, buscarCheckins, selectedEventoId])

  function handleEventoChange(id: string) {
    setSelectedEventoId(id)
    setBusca('')
    buscarCheckins('', id)
  }

  async function toggleValidacao(id: string, atual: boolean) {
    setValidando(id)
    try {
      await insiderFetch('/api/insider/validar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, validacao_do_checkin: !atual }),
      })
      setCheckins(prev =>
        prev.map(c => c.id === id ? { ...c, validacao_do_checkin: !atual } : c)
      )
    } finally {
      setValidando(null)
    }
  }

  const validados = checkins.filter(c => c.validacao_do_checkin).length

  return (
    <div className="space-y-4">
      {eventos.length > 0 && (
        <EventoSelector
          eventos={eventos}
          selectedId={selectedEventoId}
          onChange={handleEventoChange}
        />
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{checkins.length}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Total check-ins</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{validados}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Pulseiras liberadas</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou CPF..."
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#ff2c03] text-white placeholder:text-zinc-600 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all"
          />
        </div>
        <button onClick={() => buscarCheckins(busca, selectedEventoId)} className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2">
        {loading && checkins.length === 0 ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : checkins.map(c => (
          <div
            key={c.id}
            className={`border rounded-xl p-4 transition-all ${c.validacao_do_checkin ? 'bg-green-900/10 border-green-800/40' : 'bg-zinc-900 border-zinc-800'}`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleValidacao(c.id, c.validacao_do_checkin)}
                disabled={validando === c.id}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                  c.validacao_do_checkin
                    ? 'bg-green-500 hover:bg-red-500'
                    : 'bg-zinc-800 hover:bg-green-600'
                } disabled:opacity-50`}
              >
                {validando === c.id
                  ? <Loader2 className="w-4 h-4 animate-spin text-white" />
                  : c.validacao_do_checkin
                    ? <Check className="w-4 h-4 text-white" />
                    : <X className="w-4 h-4 text-zinc-400" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{c.nome_completo}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-zinc-500 text-xs font-mono">{c.cpf}</span>
                  {c.pelotao && <span className="text-xs text-[#ff2c03]">{c.pelotao}</span>}
                </div>
                <p className={`text-xs mt-0.5 font-medium ${c.validacao_do_checkin ? 'text-green-400' : 'text-zinc-500'}`}>
                  {c.validacao_do_checkin ? 'Pulseira liberada' : 'Aguardando validacao'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Módulo: Validar Check-in · Shake Out Centauro ────────────────────────────

function ModuloValidarShakeout() {
  const [checkins, setCheckins] = useState<ShakeoutCheckin[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [validando, setValidando] = useState<string | null>(null)

  const buscarCheckins = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('busca', q)
      const res = await insiderFetch(`/api/leads-shakeout-centauro/validar?${params}`)
      const data = await res.json()
      setCheckins(data.checkins || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { buscarCheckins('') }, [buscarCheckins])

  useEffect(() => {
    const t = setTimeout(() => buscarCheckins(busca), 400)
    return () => clearTimeout(t)
  }, [busca, buscarCheckins])

  async function toggleValidacao(id: string, atual: boolean) {
    setValidando(id)
    try {
      await insiderFetch('/api/leads-shakeout-centauro/validar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, validacao_do_checkin: !atual }),
      })
      setCheckins(prev => prev.map(c => c.id === id ? { ...c, validacao_do_checkin: !atual } : c))
    } finally {
      setValidando(null)
    }
  }

  const validados = checkins.filter(c => c.validacao_do_checkin).length

  return (
    <div className="space-y-4">
      <div className="bg-[#ff2c03]/10 border border-[#ff2c03]/30 rounded-xl p-3.5">
        <p className="text-[#ff2c03] text-xs font-semibold uppercase tracking-widest">Evento especial</p>
        <p className="text-white text-sm font-semibold mt-0.5">Shake Out Somma + Centauro</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{checkins.length}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Total inscritos</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{validados}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Entradas liberadas</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou CPF..."
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#ff2c03] text-white placeholder:text-zinc-600 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all"
          />
        </div>
        <button onClick={() => buscarCheckins(busca)} className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2">
        {loading && checkins.length === 0 ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : checkins.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm">Nenhum inscrito encontrado.</div>
        ) : checkins.map(c => (
          <div
            key={c.id}
            className={`border rounded-xl p-4 transition-all ${c.validacao_do_checkin ? 'bg-green-900/10 border-green-800/40' : 'bg-zinc-900 border-zinc-800'}`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleValidacao(c.id, c.validacao_do_checkin)}
                disabled={validando === c.id}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                  c.validacao_do_checkin ? 'bg-green-500 hover:bg-red-500' : 'bg-zinc-800 hover:bg-green-600'
                } disabled:opacity-50`}
              >
                {validando === c.id
                  ? <Loader2 className="w-4 h-4 animate-spin text-white" />
                  : c.validacao_do_checkin
                    ? <Check className="w-4 h-4 text-white" />
                    : <X className="w-4 h-4 text-zinc-400" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{c.nome_completo}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-zinc-500 text-xs font-mono">{c.cpf ? formatCPF(c.cpf) : '—'}</span>
                  {c.uf && <span className="text-xs text-[#ff2c03]">{c.uf}</span>}
                </div>
                <p className={`text-xs mt-0.5 font-medium ${c.validacao_do_checkin ? 'text-green-400' : 'text-zinc-500'}`}>
                  {c.validacao_do_checkin ? 'Entrada liberada' : 'Aguardando validação'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Módulo: Sorteio por Lista (só nomes) ─────────────────────────────────────

function parseNomes(texto: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of texto.split('\n')) {
    const n = raw.trim()
    if (!n) continue
    if (/^nome( do)?( atleta| completo)?$/i.test(n)) continue // ignora cabeçalho
    const key = n.toLowerCase()
    if (seen.has(key)) continue // remove duplicados (sorteio justo)
    seen.add(key)
    out.push(n)
  }
  return out
}

function ModuloSorteioLista() {
  const [texto, setTexto] = useState(LISTA_TREINAO_SPECIAL_DAY)
  const [qtd, setQtd] = useState(1)
  const [ganhadores, setGanhadores] = useState<string[]>([])
  const [sorteando, setSorteando] = useState(false)
  const [nomeAtual, setNomeAtual] = useState('')
  const [editando, setEditando] = useState(false)

  const nomes = parseNomes(texto)
  const max = Math.max(1, nomes.length)

  function sortear() {
    if (sorteando || nomes.length === 0) return
    const n = Math.max(1, Math.min(qtd || 1, nomes.length))
    setSorteando(true)
    setGanhadores([])
    const winners = fisherYatesShuffle(nomes).slice(0, n)
    const inicio = Date.now()
    const tick = () => {
      setNomeAtual(nomes[Math.floor(Math.random() * nomes.length)])
      if (Date.now() - inicio < 2500) {
        setTimeout(tick, 60)
      } else {
        setGanhadores(winners)
        setNomeAtual('')
        setSorteando(false)
      }
    }
    tick()
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#ff2c03]/10 border border-[#ff2c03]/30 rounded-xl p-3.5 flex items-center justify-between">
        <div>
          <p className="text-[#ff2c03] text-xs font-semibold uppercase tracking-widest">Sorteio por lista</p>
          <p className="text-white text-sm font-semibold mt-0.5">{nomes.length} nomes na disputa</p>
        </div>
        <Shuffle className="w-5 h-5 text-[#ff2c03]" />
      </div>

      {/* Editor da lista (colapsável) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
        <button
          onClick={() => setEditando(v => !v)}
          className="w-full flex items-center justify-between text-zinc-300 text-sm font-medium"
        >
          <span>Lista de nomes ({nomes.length})</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${editando ? 'rotate-180' : ''}`} />
        </button>
        {editando && (
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={10}
            spellCheck={false}
            placeholder="Um nome por linha..."
            className="mt-3 w-full bg-black border border-zinc-700 focus:border-[#ff2c03] text-white placeholder:text-zinc-600 rounded-lg px-3 py-2.5 text-sm outline-none transition-all resize-y font-mono leading-relaxed"
          />
        )}
      </div>

      {/* Controles */}
      <div className="flex items-end gap-3">
        <div>
          <label className="block text-zinc-500 text-xs mb-1.5">Qtd. ganhadores</label>
          <input
            type="number"
            min={1}
            max={max}
            value={qtd}
            onChange={e => setQtd(Math.max(1, Math.min(Number(e.target.value) || 1, max)))}
            disabled={sorteando}
            className="w-24 bg-zinc-900 border border-zinc-700 focus:border-[#ff2c03] text-white rounded-xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-50"
          />
        </div>
        <button
          onClick={sortear}
          disabled={sorteando || nomes.length === 0}
          className="flex-1 bg-[#ff2c03] hover:bg-[#cc2402] disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
        >
          {sorteando
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Sorteando...</>
            : <><Shuffle className="w-4 h-4" /> Sortear</>}
        </button>
      </div>

      {/* Resultado */}
      {sorteando ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-12 px-4 text-center">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">Sorteando...</p>
          <p className="text-2xl sm:text-3xl font-bold text-white break-words min-h-[2.5rem]">{nomeAtual || '—'}</p>
        </div>
      ) : ganhadores.length > 0 ? (
        <div className="space-y-2">
          <p className="text-green-400 text-xs font-semibold uppercase tracking-widest">
            {ganhadores.length > 1 ? `${ganhadores.length} ganhadores` : 'Ganhador'} 🎉
          </p>
          {ganhadores.map((g, i) => (
            <div key={i} className="bg-green-900/15 border border-green-700/40 rounded-2xl p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-white" />
              </span>
              <div className="min-w-0">
                {ganhadores.length > 1 && <p className="text-green-500/70 text-xs font-semibold">{i + 1}º</p>}
                <p className="text-white font-bold text-lg break-words">{g}</p>
              </div>
            </div>
          ))}
          <button
            onClick={sortear}
            className="w-full mt-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Sortear de novo
          </button>
        </div>
      ) : null}
    </div>
  )
}

// ─── Módulo: Validar Check-in · TF Sports (Treinão Special Day) ───────────────

function ModuloValidarTfSports() {
  const [checkins, setCheckins] = useState<TfSportsCheckin[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [validando, setValidando] = useState<number | null>(null)

  const buscarCheckins = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('busca', q)
      const res = await insiderFetch(`/api/tf-sports/validar?${params}`)
      const data = await res.json()
      setCheckins(data.checkins || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { buscarCheckins('') }, [buscarCheckins])

  useEffect(() => {
    const t = setTimeout(() => buscarCheckins(busca), 400)
    return () => clearTimeout(t)
  }, [busca, buscarCheckins])

  async function toggleValidacao(id: number, atual: boolean) {
    setValidando(id)
    try {
      const res = await insiderFetch('/api/tf-sports/validar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, validacao_do_checkin: !atual }),
      })
      // Só reflete na tela se o banco REALMENTE salvou (evita falso "liberado")
      if (res.ok) {
        setCheckins(prev => prev.map(c => c.id === id ? { ...c, validacao_do_checkin: !atual } : c))
      } else {
        alert('Não foi possível salvar a validação. Tente de novo.')
      }
    } finally {
      setValidando(null)
    }
  }

  const validados = checkins.filter(c => c.validacao_do_checkin).length

  return (
    <div className="space-y-4">
      <div className="bg-[#ff2c03]/10 border border-[#ff2c03]/30 rounded-xl p-3.5">
        <p className="text-[#ff2c03] text-xs font-semibold uppercase tracking-widest">Evento especial</p>
        <p className="text-white text-sm font-semibold mt-0.5">Treinão · Somma Special Day (TF Sports)</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{checkins.length}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Total inscritos</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{validados}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Entradas liberadas</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou CPF..."
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#ff2c03] text-white placeholder:text-zinc-600 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all"
          />
        </div>
        <button onClick={() => buscarCheckins(busca)} className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2">
        {loading && checkins.length === 0 ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : checkins.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm">Nenhum inscrito encontrado.</div>
        ) : checkins.map(c => (
          <div
            key={c.id}
            className={`border rounded-xl p-4 transition-all ${c.validacao_do_checkin ? 'bg-green-900/10 border-green-800/40' : 'bg-zinc-900 border-zinc-800'}`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleValidacao(c.id, c.validacao_do_checkin)}
                disabled={validando === c.id}
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                  c.validacao_do_checkin ? 'bg-green-500 hover:bg-red-500' : 'bg-zinc-800 hover:bg-green-600'
                } disabled:opacity-50`}
              >
                {validando === c.id
                  ? <Loader2 className="w-4 h-4 animate-spin text-white" />
                  : c.validacao_do_checkin
                    ? <Check className="w-4 h-4 text-white" />
                    : <X className="w-4 h-4 text-zinc-400" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{c.nome_atleta?.trim() || '—'}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-zinc-500 text-xs font-mono">{c.documento ? formatCPF(c.documento) : '—'}</span>
                  {c.tamanho_camiseta && <span className="text-xs text-[#ff2c03]">Camisa {c.tamanho_camiseta}</span>}
                </div>
                <p className={`text-xs mt-0.5 font-medium ${c.validacao_do_checkin ? 'text-green-400' : 'text-zinc-500'}`}>
                  {c.validacao_do_checkin ? 'Entrada liberada' : 'Aguardando validação'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Módulo: Transferências ──────────────────────────────────────────────────

type Transferencia = {
  id: string
  evento_id: string
  inscricao_original_id: string
  inscricao_nova_id: string
  cpf_origem: string
  cpf_destino: string
  email_origem: string
  email_destino: string
  nome_origem: string
  nome_destino: string
  origem: 'usuario' | 'admin'
  admin_user_id: string | null
  created_at: string
}

type CheckinBusca = {
  id: string
  nome_completo: string
  email: string
  cpf: string
  pelotao: string | null
  evento_id: string
  nome_do_evento: string
  data_do_evento: string
  status?: string
}

function ModuloTransferencias({ insiderNome }: { insiderNome: string }) {
  const [transferencias, setTransferencias] = useState<Transferencia[]>([])
  const [eventos, setEventos] = useState<EventoOption[]>([])
  const [selectedEventoId, setSelectedEventoId] = useState('')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [habilitada, setHabilitada] = useState<boolean | null>(null)
  const [togglando, setTogglando] = useState(false)
  const [encerrado, setEncerrado] = useState<boolean | null>(null)
  const [togglando_encerrado, setTogglando_encerrado] = useState(false)

  const carregarStatus = useCallback(async () => {
    if (!selectedEventoId) return
    try {
      const res = await insiderFetch(`/api/transferencias/status?evento_id=${selectedEventoId}`)
      const data = await res.json()
      setHabilitada(!!data.habilitada)
    } catch {
      setHabilitada(false)
    }
  }, [selectedEventoId])

  const carregarStatusEncerrado = useCallback(async () => {
    if (!selectedEventoId) return
    try {
      const res = await insiderFetch(`/api/eventos/status?evento_id=${selectedEventoId}`)
      const data = await res.json()
      setEncerrado(!!data.encerrado)
    } catch {
      setEncerrado(false)
    }
  }, [selectedEventoId])

  const toggleHabilitada = async () => {
    if (!selectedEventoId || habilitada === null) return
    setTogglando(true)
    try {
      const res = await insiderFetch('/api/transferencias/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evento_id: selectedEventoId, habilitada: !habilitada }),
      })
      const data = await res.json()
      if (res.ok) setHabilitada(!!data.habilitada)
    } catch (e) {
      console.error('[transferencias] erro toggle:', e)
    } finally {
      setTogglando(false)
    }
  }

  const toggleEncerrado = async () => {
    if (!selectedEventoId || encerrado === null) return
    setTogglando_encerrado(true)
    try {
      const res = await insiderFetch('/api/eventos/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evento_id: selectedEventoId, encerrado: !encerrado }),
      })
      const data = await res.json()
      if (res.ok) setEncerrado(!!data.encerrado)
    } catch (e) {
      console.error('[eventos] erro toggle encerrado:', e)
    } finally {
      setTogglando_encerrado(false)
    }
  }

  const carregarEventos = useCallback(async () => {
    try {
      const res = await insiderFetch('/api/insider/checkins?limit=1')
      const data = await res.json()
      if (data.eventos?.length) {
        setEventos(data.eventos)
        if (!selectedEventoId) setSelectedEventoId(data.evento?.id || data.eventos[0].id)
      }
    } catch (e) {
      console.error('[transferencias] erro eventos:', e)
    }
  }, [selectedEventoId])

  const carregarTransferencias = useCallback(async () => {
    if (!selectedEventoId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ evento_id: selectedEventoId })
      if (busca) params.set('busca', busca)
      const res = await insiderFetch(`/api/transferencias/listar?${params}`)
      const data = await res.json()
      setTransferencias(data.transferencias || [])
    } catch (e) {
      console.error('[transferencias] erro listar:', e)
    } finally {
      setLoading(false)
    }
  }, [selectedEventoId, busca])

  useEffect(() => { carregarEventos() }, [carregarEventos])
  useEffect(() => { carregarTransferencias() }, [carregarTransferencias])
  useEffect(() => { carregarStatus() }, [carregarStatus])
  useEffect(() => { carregarStatusEncerrado() }, [carregarStatusEncerrado])

  useEffect(() => {
    const t = setTimeout(() => carregarTransferencias(), 400)
    return () => clearTimeout(t)
  }, [busca, carregarTransferencias])

  return (
    <div className="space-y-4">
      {eventos.length > 0 && (
        <EventoSelector eventos={eventos} selectedId={selectedEventoId} onChange={setSelectedEventoId} />
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row items-center sm:justify-between gap-4">
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-white text-sm font-semibold">Status do Evento</p>
          <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">
            {encerrado === null
              ? 'Carregando...'
              : encerrado
              ? 'Evento Encerrado: página com overlay bloqueado.'
              : 'Evento Ativo: página visível normalmente.'}
          </p>
        </div>
        <div className="flex-shrink-0">
          <input
            id="toggle-encerrado"
            type="checkbox"
            className="toggle-onoff"
            checked={!!encerrado}
            disabled={togglando_encerrado || encerrado === null}
            onChange={toggleEncerrado}
          />
          <label htmlFor="toggle-encerrado" />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row items-center sm:justify-between gap-4">
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-white text-sm font-semibold">Transferências por usuário</p>
          <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">
            {habilitada === null
              ? 'Carregando...'
              : habilitada
              ? 'Liberado: usuários podem transferir pelo site.'
              : 'Bloqueado: opção fica oculta no site público.'}
          </p>
        </div>
        <div className="flex-shrink-0">
          <input
            id="toggle-transferencia"
            type="checkbox"
            className="toggle-onoff"
            checked={!!habilitada}
            disabled={togglando || habilitada === null}
            onChange={toggleHabilitada}
          />
          <label htmlFor="toggle-transferencia" />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, CPF ou e-mail"
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#ff2c03] text-white rounded-xl pl-10 pr-3 py-3 text-sm outline-none"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-3 bg-[#ff2c03] hover:bg-[#cc2402] text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Manual
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 text-[#ff2c03] animate-spin" />
        </div>
      ) : transferencias.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 text-sm">
          Nenhuma transferência registrada neste evento.
        </div>
      ) : (
        <div className="space-y-2">
          {transferencias.map(t => (
            <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  t.origem === 'admin'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    : 'bg-green-500/10 text-green-400 border border-green-500/30'
                }`}>
                  {t.origem === 'admin' ? 'Manual (Insider)' : 'Pelo usuário'}
                </span>
                <span className="text-zinc-600 text-xs">{formatDateTime(t.created_at)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-zinc-950/60 rounded-lg p-3 border border-zinc-800">
                  <p className="text-zinc-500 uppercase tracking-wider text-[10px] mb-1">De</p>
                  <p className="text-white font-semibold text-sm">{t.nome_origem}</p>
                  <p className="text-zinc-500 mt-0.5">{formatCPF(t.cpf_origem)}</p>
                  <p className="text-zinc-600 truncate">{t.email_origem}</p>
                </div>
                <div className="bg-zinc-950/60 rounded-lg p-3 border border-zinc-800">
                  <p className="text-zinc-500 uppercase tracking-wider text-[10px] mb-1">Para</p>
                  <p className="text-white font-semibold text-sm">{t.nome_destino}</p>
                  <p className="text-zinc-500 mt-0.5">{formatCPF(t.cpf_destino)}</p>
                  <p className="text-zinc-600 truncate">{t.email_destino}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ModalTransferenciaManual
          eventoId={selectedEventoId}
          insiderNome={insiderNome}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            carregarTransferencias()
          }}
        />
      )}
    </div>
  )
}

function ModalTransferenciaManual({
  eventoId,
  insiderNome,
  onClose,
  onSuccess,
}: {
  eventoId: string
  insiderNome: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<'buscar' | 'dados'>('buscar')
  const [buscaCpf, setBuscaCpf] = useState('')
  const [resultado, setResultado] = useState<CheckinBusca | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [novo, setNovo] = useState({
    nome: '', email: '', telefone: '', cpf: '', sexo: '' as '' | 'masculino' | 'feminino', peloton: '' as '' | '4km' | '6km' | '8km',
  })

  const buscar = async () => {
    const cpfLimpo = buscaCpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      setErro('CPF inválido.')
      return
    }
    setBuscando(true)
    setErro('')
    try {
      const res = await insiderFetch(`/api/insider/checkins?busca=${cpfLimpo}&evento_id=${eventoId}`)
      const data = await res.json()
      const ativa = (data.checkins || []).find((c: CheckinBusca) => {
        const cpfC = (c.cpf || '').replace(/\D/g, '')
        return cpfC === cpfLimpo && (!c.status || c.status === 'ativo')
      })
      if (!ativa) {
        setErro('Inscrição ativa não encontrada com este CPF.')
        return
      }
      setResultado(ativa)
      if (ativa.pelotao) {
        setNovo(p => ({ ...p, peloton: ativa.pelotao as NonNullable<typeof p.peloton> }))
      }
      setStep('dados')
    } catch {
      setErro('Erro ao buscar inscrição.')
    } finally {
      setBuscando(false)
    }
  }

  const confirmar = async () => {
    if (!resultado) return
    if (!novo.nome || !novo.email || !novo.telefone || !novo.cpf || !novo.sexo || !novo.peloton) {
      setErro('Preencha todos os campos.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      const res = await insiderFetch('/api/transferencias/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inscricao_original_id: resultado.id,
          evento_id: eventoId,
          admin_user_id: insiderNome,
          dados_novo: novo,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error || 'Erro ao registrar transferência.')
        return
      }
      onSuccess()
    } catch {
      setErro('Erro de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[#ff2c03] text-[10px] font-semibold uppercase tracking-widest">Transferência manual</p>
            <p className="text-white text-sm font-semibold mt-0.5">
              {step === 'buscar' ? 'Buscar inscrição' : 'Dados do novo titular'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {step === 'buscar' ? (
            <>
              <div>
                <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-1.5">CPF do titular atual</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatCPF(buscaCpf)}
                  onChange={e => setBuscaCpf(e.target.value.replace(/\D/g, ''))}
                  placeholder="000.000.000-00"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#ff2c03] text-white rounded-xl px-4 py-3 text-sm font-mono outline-none"
                />
              </div>

              {erro && (
                <div className="bg-red-900/20 border border-red-500/30 px-3 py-2 rounded-lg">
                  <p className="text-red-400 text-xs">{erro}</p>
                </div>
              )}

              <button
                onClick={buscar}
                disabled={buscando}
                className="w-full bg-[#ff2c03] hover:bg-[#cc2402] disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2"
              >
                {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Buscar
              </button>
            </>
          ) : resultado ? (
            <>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Inscrição encontrada</p>
                <p className="text-white text-sm font-semibold">{resultado.nome_completo}</p>
                <p className="text-zinc-500 text-xs">{formatCPF(resultado.cpf)} · {resultado.email}</p>
                <p className="text-zinc-600 text-xs mt-1">Pelotão atual: {resultado.pelotao || '—'}</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-1.5">Nome completo</label>
                  <input
                    type="text"
                    value={novo.nome}
                    onChange={e => setNovo(p => ({ ...p, nome: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#ff2c03] text-white rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-1.5">CPF</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatCPF(novo.cpf)}
                      onChange={e => setNovo(p => ({ ...p, cpf: e.target.value.replace(/\D/g, '') }))}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-1.5">Telefone</label>
                    <input
                      type="tel"
                      value={novo.telefone}
                      onChange={e => setNovo(p => ({ ...p, telefone: e.target.value }))}
                      placeholder="(61) 99999-9999"
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={novo.email}
                    onChange={e => setNovo(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-1.5">Sexo</label>
                    <select
                      value={novo.sexo}
                      onChange={e => setNovo(p => ({ ...p, sexo: e.target.value as typeof novo.sexo }))}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none"
                    >
                      <option value="">—</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-1.5">Pelotão</label>
                    <select
                      value={novo.peloton}
                      onChange={e => setNovo(p => ({ ...p, peloton: e.target.value as typeof novo.peloton }))}
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none"
                    >
                      <option value="">—</option>
                      <option value="4km">4km — Iniciante</option>
                      <option value="6km">6km — Moderado</option>
                      <option value="8km">8km — Avançado</option>
                    </select>
                  </div>
                </div>
              </div>

              {erro && (
                <div className="bg-red-900/20 border border-red-500/30 px-3 py-2 rounded-lg">
                  <p className="text-red-400 text-xs">{erro}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setStep('buscar'); setResultado(null); setErro('') }}
                  disabled={salvando}
                  className="px-4 py-3 border border-zinc-700 text-zinc-400 text-sm font-semibold rounded-xl disabled:opacity-50"
                >
                  Voltar
                </button>
                <button
                  onClick={confirmar}
                  disabled={salvando}
                  className="flex-1 bg-[#ff2c03] hover:bg-[#cc2402] disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  {salvando ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Check className="w-4 h-4" /> Confirmar transferência</>}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─── Módulo: Sorteio ─────────────────────────────────────────────────────────

function ModuloSorteio({ insiderNome }: { insiderNome: string }) {
  const [eventos, setEventos] = useState<EventoOption[]>([])
  const [selectedEventoId, setSelectedEventoId] = useState('')
  const [stats, setStats] = useState<EstatisticasSorteio | null>(null)
  const [loading, setLoading] = useState(false)

  // Filtros
  const [sexo, setSexo] = useState('todos')
  const [pelotao, setPelotao] = useState('todos')
  const [dataInscricao, setDataInscricao] = useState('todos')
  const [validacao, setValidacao] = useState('todos')
  const [quantidade, setQuantidade] = useState(1)
  const [titulo, setTitulo] = useState('')

  // Resultado
  const [ganhadores, setGanhadores] = useState<Ganhador[]>([])
  const [sorteando, setSorteando] = useState(false)
  const [nomesAnimacao, setNomesAnimacao] = useState<string[]>([])
  const [animacaoCompleta, setAnimacaoCompleta] = useState(false)

  // Preview de participantes
  const [mostrarPreview, setMostrarPreview] = useState(false)
  const [participantesPreview, setParticipantesPreview] = useState<ParticipanteSorteio[]>([])

  // Histórico
  const [historico, setHistorico] = useState<Sorteio[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)

  // Datas disponíveis para filtro
  const [datasDisponiveis, setDatasDisponiveis] = useState<string[]>([])

  // Buscar eventos no mount
  useEffect(() => {
    async function carregarEventos() {
      try {
        const res = await insiderFetch('/api/insider/checkins')
        const data = await res.json()
        if (data.eventos) setEventos(data.eventos)
        if (data.evento?.id) setSelectedEventoId(data.evento.id)
      } catch { /* silencioso */ }
    }
    carregarEventos()
  }, [])

  // Buscar participantes quando filtros mudam
  const buscarParticipantes = useCallback(async () => {
    if (!selectedEventoId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ evento_id: selectedEventoId })
      if (sexo !== 'todos') params.set('sexo', sexo)
      if (pelotao !== 'todos') params.set('pelotao', pelotao)
      if (dataInscricao !== 'todos') params.set('data_inscricao', dataInscricao)
      if (validacao !== 'todos') params.set('validacao', validacao)

      const res = await insiderFetch(`/api/sorteio/participantes?${params}`)
      const data = await res.json()
      if (data.stats) setStats(data.stats)
      if (data.participantes) {
        const datas = [...new Set(data.participantes.map((p: { data_hora_checkin: string }) =>
          new Date(p.data_hora_checkin).toISOString().split('T')[0]
        ))].sort() as string[]
        setDatasDisponiveis(datas)
        setParticipantesPreview(data.participantes)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedEventoId, sexo, pelotao, dataInscricao, validacao])

  useEffect(() => {
    buscarParticipantes()
  }, [buscarParticipantes])

  // Buscar histórico quando evento muda
  const buscarHistorico = useCallback(async () => {
    if (!selectedEventoId) return
    setLoadingHistorico(true)
    try {
      const res = await insiderFetch(`/api/sorteio/historico?evento_id=${selectedEventoId}`)
      const data = await res.json()
      if (data.sorteios) setHistorico(data.sorteios)
    } finally {
      setLoadingHistorico(false)
    }
  }, [selectedEventoId])

  useEffect(() => {
    buscarHistorico()
  }, [buscarHistorico])

  function handleEventoChange(id: string) {
    setSelectedEventoId(id)
    setSexo('todos')
    setPelotao('todos')
    setDataInscricao('todos')
    setValidacao('todos')
    setGanhadores([])
    setAnimacaoCompleta(false)
  }

  async function executarSorteio() {
    if (!selectedEventoId || !titulo.trim()) return

    setSorteando(true)
    setGanhadores([])
    setAnimacaoCompleta(false)

    try {
      const res = await insiderFetch('/api/sorteio/sortear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento_id: selectedEventoId,
          titulo: titulo.trim(),
          quantidade,
          filtros: {
            sexo: sexo !== 'todos' ? sexo : undefined,
            pelotao: pelotao !== 'todos' ? pelotao : undefined,
            data_inscricao: dataInscricao !== 'todos' ? dataInscricao : undefined,
            validacao: validacao !== 'todos' ? validacao : undefined,
          },
          criado_por: insiderNome,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Erro ao sortear')
        setSorteando(false)
        return
      }

      const ganhadoresResult: Ganhador[] = data.sorteio.ganhadores
      setGanhadores(ganhadoresResult)
      setNomesAnimacao(ganhadoresResult.map(g => g.checkin.nome_completo))
    } catch {
      alert('Erro ao executar sorteio')
      setSorteando(false)
    }
  }

  function handleAnimacaoCompleta() {
    setAnimacaoCompleta(true)
    setSorteando(false)
    buscarHistorico()
  }

  async function handleLimparHistorico() {
    if (!selectedEventoId) return
    await insiderFetch(`/api/sorteio/historico?evento_id=${selectedEventoId}`, { method: 'DELETE' })
    setHistorico([])
  }

  async function handleConfirmar(id: string) {
    await insiderFetch(`/api/sorteio/ganhadores/${id}/confirmar`, { method: 'PATCH' })
    setGanhadores(prev => prev.map(g => g.id === id ? { ...g, status: 'confirmado' as const } : g))
  }

  async function handleAusente(id: string) {
    await insiderFetch(`/api/sorteio/ganhadores/${id}/ausente`, { method: 'PATCH' })
    setGanhadores(prev => prev.map(g => g.id === id ? { ...g, status: 'ausente' as const } : g))
  }

  async function handleResorteio(id: string): Promise<Ganhador | null> {
    const res = await insiderFetch(`/api/sorteio/ganhadores/${id}/resorteio`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Erro no resorteio')
      return null
    }
    buscarHistorico()
    return data.ganhador
  }

  const selectClass = "w-full appearance-none bg-zinc-900 border border-zinc-700 focus:border-[#ff2c03] text-white rounded-xl px-4 py-3 text-sm outline-none transition-all cursor-pointer"

  return (
    <div className="space-y-4">
      {/* Animação Slot Machine */}
      {sorteando && nomesAnimacao.length > 0 && (
        <SorteioMachine nomes={nomesAnimacao} onComplete={handleAnimacaoCompleta} />
      )}

      {/* Seletor de Evento */}
      {eventos.length > 0 && (
        <EventoSelector
          eventos={eventos}
          selectedId={selectedEventoId}
          onChange={handleEventoChange}
        />
      )}

      {/* Estatísticas */}
      {stats && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total', valor: stats.total, cor: 'text-white' },
              { label: 'Masculino', valor: stats.masculino, cor: 'text-blue-400' },
              { label: 'Feminino', valor: stats.feminino, cor: 'text-pink-400' },
            ].map(({ label, valor, cor }) => (
              <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                <p className={`text-2xl font-bold ${cor}`}>{valor}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(stats.por_pelotao).map(([nome, valor]) => (
              <div key={nome} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[#ff2c03]">{valor}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{nome}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Validados', valor: stats.validados, cor: 'text-green-400' },
              { label: 'Pendentes', valor: stats.pendentes, cor: 'text-yellow-400' },
            ].map(({ label, valor, cor }) => (
              <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                <p className={`text-2xl font-bold ${cor}`}>{valor}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview de participantes */}
      {stats && stats.total > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setMostrarPreview(v => !v)}
            className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm text-white font-medium">
              {mostrarPreview ? <EyeOff className="w-4 h-4 text-zinc-400" /> : <Eye className="w-4 h-4 text-zinc-400" />}
              {mostrarPreview ? 'Ocultar' : 'Ver'} participantes elegíveis ({stats.total})
            </span>
            <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${mostrarPreview ? 'rotate-180' : ''}`} />
          </button>
          {mostrarPreview && (
            <div className="border-t border-zinc-800 px-4 pb-3 max-h-64 overflow-y-auto">
              {participantesPreview.slice(0, 50).map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-zinc-600 text-xs font-mono w-7 flex-shrink-0">#{p.numero}</span>
                    <span className="text-white text-xs truncate">{p.nome_completo}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {p.pelotao && <span className="text-[10px] text-[#ff2c03] bg-[#ff2c03]/10 px-1.5 py-0.5 rounded">{p.pelotao}</span>}
                    <span className="text-[10px] text-zinc-500 capitalize">{p.sexo?.charAt(0)?.toUpperCase() || '?'}</span>
                    {p.validacao_do_checkin && <ShieldCheck className="w-3 h-3 text-green-400" />}
                  </div>
                </div>
              ))}
              {participantesPreview.length > 50 && (
                <p className="text-zinc-600 text-xs text-center pt-2">+ {participantesPreview.length - 50} participantes não exibidos</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-[#ff2c03]" />
          <p className="text-white text-sm font-semibold">Filtros do Sorteio</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-zinc-500 text-xs mb-1 block">Sexo</label>
            <div className="relative">
              <select value={sexo} onChange={e => setSexo(e.target.value)} className={selectClass}>
                <option value="todos">Todos</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-zinc-500 text-xs mb-1 block">Pelotão</label>
            <div className="relative">
              <select value={pelotao} onChange={e => setPelotao(e.target.value)} className={selectClass}>
                <option value="todos">Todos</option>
                <option value="4km">4km</option>
                <option value="6km">6km</option>
                <option value="8km">8km</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-zinc-500 text-xs mb-1 block">Dia do Check-in</label>
            <div className="relative">
              <select value={dataInscricao} onChange={e => setDataInscricao(e.target.value)} className={selectClass}>
                <option value="todos">Todos os dias</option>
                {datasDisponiveis.map(d => (
                  <option key={d} value={d}>{new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-zinc-500 text-xs mb-1 block">Validação</label>
            <div className="relative">
              <select value={validacao} onChange={e => setValidacao(e.target.value)} className={selectClass}>
                <option value="todos">Todos</option>
                <option value="validados">Validados</option>
                <option value="pendentes">Pendentes</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
          <div>
            <label className="text-zinc-500 text-xs mb-1 block">Quantidade de ganhadores</label>
            <input
              type="number"
              min={1}
              max={stats?.total || 100}
              value={quantidade}
              onChange={e => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#ff2c03] text-white rounded-xl px-4 py-3 text-sm outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-zinc-500 text-xs mb-1 block">Descrição do prêmio</label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Camiseta Somma"
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#ff2c03] text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-all"
            />
          </div>
        </div>

        <button
          onClick={executarSorteio}
          disabled={sorteando || !titulo.trim() || !stats || stats.total === 0}
          className="w-full flex items-center justify-center gap-2 bg-[#ff2c03] hover:bg-[#ff2c03]/90 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider transition-all"
        >
          {sorteando ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Dices className="w-5 h-5" />
          )}
          {sorteando ? 'Sorteando...' : 'Sortear'}
        </button>
      </div>

      {/* Resultado */}
      {animacaoCompleta && ganhadores.length > 0 && (
        <div className="space-y-3">
          <p className="text-white text-sm font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#ff2c03]" />
            Ganhadores
          </p>
          {ganhadores.map(g => (
            <GanhadorCard
              key={g.id}
              ganhador={g}
              onConfirmar={handleConfirmar}
              onAusente={handleAusente}
              onResorteio={handleResorteio}
            />
          ))}
        </div>
      )}

      {/* Histórico */}
      <div className="pt-4 border-t border-zinc-800">
        <p className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-500" />
          Histórico de Sorteios
        </p>
        {loadingHistorico ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
        ) : (
          <SorteioHistorico sorteios={historico} onLimparHistorico={handleLimparHistorico} />
        )}
      </div>
    </div>
  )
}

// ─── Painel Principal ─────────────────────────────────────────────────────────

function Painel({ insider, onLogout }: { insider: Insider; onLogout: () => void }) {
  const [modulo, setModulo] = useState<Modulo>('home')

  const modulos = [
    {
      id: 'membros' as Modulo,
      titulo: 'Buscar Membros',
      descricao: 'Consulte e visualize todos os membros cadastrados no Somma Club',
      icone: Users,
    },
    {
      id: 'checkins' as Modulo,
      titulo: 'Consultar CPF Check-in',
      descricao: 'Veja todos os check-ins do evento selecionado',
      icone: ClipboardList,
    },
    {
      id: 'validar' as Modulo,
      titulo: 'Validar Check-in',
      descricao: 'Libere pulseiras validando o check-in dos participantes',
      icone: CheckSquare,
    },
    {
      id: 'validar-shakeout' as Modulo,
      titulo: 'Validar Check-in · Shake Out',
      descricao: 'Libere a entrada do evento Shake Out Somma + Centauro',
      icone: ShieldCheck,
    },
    {
      id: 'validar-tfsports' as Modulo,
      titulo: 'Validar Check-in · TF Sports',
      descricao: 'Libere a entrada do Treinão do Somma Special Day',
      icone: ShieldCheck,
    },
    {
      id: 'sorteio' as Modulo,
      titulo: 'Sorteio',
      descricao: 'Realize sorteios entre os participantes do evento',
      icone: Dices,
    },
    {
      id: 'sorteio-lista' as Modulo,
      titulo: 'Sorteio por Lista',
      descricao: 'Cole uma lista de nomes e sorteie os ganhadores',
      icone: Shuffle,
    },
    {
      id: 'transferencias' as Modulo,
      titulo: 'Transferências',
      descricao: 'Veja o histórico e registre transferências manuais',
      icone: Repeat,
    },
  ]

  const moduloAtual = modulos.find(m => m.id === modulo)

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black/95 backdrop-blur-sm sticky top-0 z-50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {modulo !== 'home' && (
              <button onClick={() => setModulo('home')} className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                <ArrowLeft className="w-4 h-4 text-zinc-400" />
              </button>
            )}
            <div>
              <p className="text-[#ff2c03] text-xs font-semibold uppercase tracking-widest leading-none">Insider Connect</p>
              <p className="text-white text-sm font-semibold">
                {modulo === 'home' ? `Olá, ${insider.nome.split(' ')[0]}` : moduloAtual?.titulo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => location.reload()}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-xs transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar
            </button>
            <div className="w-px h-4 bg-zinc-800" />
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-xs transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {modulo === 'home' ? (
          <div className="space-y-3">
            <p className="text-zinc-500 text-sm mb-6">Selecione um módulo para continuar</p>
            {modulos.map(m => {
              const Icone = m.icone
              return (
                <button
                  key={m.id}
                  onClick={() => setModulo(m.id)}
                  className="w-full text-left bg-zinc-900 border border-zinc-800 hover:border-[#ff2c03]/40 hover:bg-zinc-800/50 rounded-2xl p-5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#ff2c03]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#ff2c03]/20 transition-colors">
                      <Icone className="w-5 h-5 text-[#ff2c03]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{m.titulo}</p>
                      <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{m.descricao}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
                  </div>
                </button>
              )
            })}
          </div>
        ) : modulo === 'membros' ? (
          <ModuloMembros />
        ) : modulo === 'checkins' ? (
          <ModuloCheckins />
        ) : modulo === 'validar' ? (
          <ModuloValidar />
        ) : modulo === 'validar-shakeout' ? (
          <ModuloValidarShakeout />
        ) : modulo === 'validar-tfsports' ? (
          <ModuloValidarTfSports />
        ) : modulo === 'sorteio-lista' ? (
          <ModuloSorteioLista />
        ) : modulo === 'transferencias' ? (
          <ModuloTransferencias insiderNome={insider.nome} />
        ) : (
          <ModuloSorteio insiderNome={insider.nome} />
        )}
      </div>
    </main>
  )
}

// ─── Export Principal ─────────────────────────────────────────────────────────

export default function InsiderConect() {
  const [insider, setInsider] = useState<Insider | null>(null)
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    insiderFetch('/api/insider/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.insider) setInsider(data.insider)
      })
      .catch(() => {})
      .finally(() => setCarregado(true))
  }, [])

  const handleLogin = (insiderData: Insider) => {
    setInsider(insiderData)
  }

  const handleLogout = async () => {
    await insiderFetch('/api/insider/logout', { method: 'POST' })
    setInsider(null)
  }

  if (!carregado) return null

  return insider
    ? <Painel insider={insider} onLogout={handleLogout} />
    : <LoginScreen onLogin={handleLogin} />
}
