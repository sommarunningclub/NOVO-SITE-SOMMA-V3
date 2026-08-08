'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, RefreshCw, Copy, Check, Ticket, Gift, User, MapPin,
  Mail, Phone, Cake, Shirt, Sparkles,
} from 'lucide-react'

export type PerfilInsider = {
  id: string
  nome: string
  cpf: string | null
  email: string | null
  telefone: string | null
  data_nascimento: string | null
  sexo: string | null
  foto_url: string | null
  tamanho_camisa: string | null
  ativo: boolean | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  evolve: string | null
  assessoria_somma: string | null
  dopahmina: string | null
  cupom_loja_somma: string | null
  big_box: string | null
  tex_barbearia: string | null
  estamina_recovery: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return ((partes[0]?.[0] || '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}

function formatDataNascimento(d: string | null) {
  if (!d) return null
  // Vem como YYYY-MM-DD (date puro): monta local pra não perder um dia no fuso.
  const [ano, mes, dia] = d.split('-').map(Number)
  if (!ano || !mes || !dia) return null
  const hoje = new Date()
  let idade = hoje.getFullYear() - ano
  if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) idade--
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano} · ${idade} anos`
}

function montarEndereco(p: PerfilInsider) {
  const linha1 = [p.logradouro, p.numero, p.complemento].filter(Boolean).join(', ')
  const linha2 = [p.bairro, [p.cidade, p.estado].filter(Boolean).join(' - ')].filter(Boolean).join(' · ')
  const linhas = [linha1, linha2, p.cep ? `CEP ${p.cep}` : null].filter(Boolean) as string[]
  return linhas.length ? linhas : null
}

// ─── Blocos ───────────────────────────────────────────────────────────────────

function Secao({ titulo, icone: Icone, children }: {
  titulo: string
  icone: typeof User
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <p className="text-white text-sm font-semibold flex items-center gap-2">
        <Icone className="w-4 h-4 text-[#ff2c03]" />
        {titulo}
      </p>
      {children}
    </section>
  )
}

function Campo({ icone: Icone, rotulo, valor }: {
  icone: typeof User
  rotulo: string
  valor: string | null
}) {
  if (!valor) return null
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-zinc-800 last:border-0">
      <Icone className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-zinc-500 text-[11px] uppercase tracking-wider">{rotulo}</p>
        <p className="text-white text-sm break-words">{valor}</p>
      </div>
    </div>
  )
}

function CupomCard({ parceiro, codigo }: { parceiro: string; codigo: string }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* clipboard indisponível — o código segue visível na tela */
    }
  }

  return (
    <button
      onClick={copiar}
      className="w-full text-left bg-zinc-900 border border-zinc-800 hover:border-[#ff2c03]/40 rounded-2xl p-4 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#ff2c03]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#ff2c03]/20 transition-colors">
          <Ticket className="w-4 h-4 text-[#ff2c03]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-zinc-500 text-[11px] uppercase tracking-wider">{parceiro}</p>
          <p className="text-white font-mono font-semibold text-sm tracking-wide break-all">{codigo}</p>
        </div>
        {copiado ? (
          <span className="flex items-center gap-1 text-green-400 text-xs flex-shrink-0">
            <Check className="w-3.5 h-3.5" /> Copiado
          </span>
        ) : (
          <Copy className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
        )}
      </div>
    </button>
  )
}

function BeneficioCard({ parceiro, descricao }: { parceiro: string; descricao: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <Gift className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="min-w-0">
          <p className="text-zinc-500 text-[11px] uppercase tracking-wider">{parceiro}</p>
          <p className="text-white text-sm leading-relaxed break-words">{descricao}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PerfilInsiderView() {
  const [perfil, setPerfil] = useState<PerfilInsider | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro('')
    try {
      const res = await fetch('/api/insider/perfil', { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Não foi possível carregar o perfil.')
      setPerfil(data.perfil)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar o perfil.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (erro || !perfil) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-zinc-400 text-sm">{erro || 'Perfil não encontrado.'}</p>
        <button
          onClick={carregar}
          className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-[#ff2c03]/40 text-white text-sm rounded-xl px-4 py-2.5 transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
      </div>
    )
  }

  const cupons = [
    { parceiro: 'Loja Somma', codigo: perfil.cupom_loja_somma },
    { parceiro: 'Big Box', codigo: perfil.big_box },
  ].filter((c): c is { parceiro: string; codigo: string } => Boolean(c.codigo))

  const beneficios = [
    { parceiro: 'Tex Barbearia', descricao: perfil.tex_barbearia },
    { parceiro: 'Estamina Recovery', descricao: perfil.estamina_recovery },
    { parceiro: 'Dopahmina', descricao: perfil.dopahmina },
  ].filter((b): b is { parceiro: string; descricao: string } => Boolean(b.descricao))

  const status = [
    { rotulo: 'Evolve', valor: perfil.evolve },
    { rotulo: 'Assessoria Somma', valor: perfil.assessoria_somma },
  ].filter((s): s is { rotulo: string; valor: string } => Boolean(s.valor))

  const endereco = montarEndereco(perfil)

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        {perfil.foto_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={perfil.foto_url}
            alt={perfil.nome}
            className="w-16 h-16 rounded-2xl object-cover border border-zinc-800 flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-[#ff2c03]/10 border border-[#ff2c03]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[#ff2c03] font-semibold text-lg">{iniciais(perfil.nome)}</span>
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-white font-semibold text-lg leading-tight break-words">{perfil.nome}</h2>
          {perfil.email && <p className="text-zinc-500 text-xs mt-1 break-all">{perfil.email}</p>}
          <span
            className={`inline-flex items-center gap-1.5 mt-2 text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full ${
              perfil.ativo
                ? 'bg-[#ff2c03]/10 text-[#ff2c03]'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            {perfil.ativo ? 'Insider ativo' : 'Insider inativo'}
          </span>
        </div>
      </div>

      {/* Benefícios */}
      {(cupons.length > 0 || beneficios.length > 0 || status.length > 0) && (
        <Secao titulo="Seus benefícios" icone={Gift}>
          {status.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {status.map(s => (
                <span
                  key={s.rotulo}
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-full px-3 py-1.5"
                >
                  {s.rotulo}: <span className="text-white font-medium">{s.valor}</span>
                </span>
              ))}
            </div>
          )}
          {cupons.map(c => <CupomCard key={c.parceiro} {...c} />)}
          {beneficios.map(b => <BeneficioCard key={b.parceiro} {...b} />)}
        </Secao>
      )}

      {/* Dados pessoais */}
      <Secao titulo="Dados pessoais" icone={User}>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl">
          <Campo icone={User} rotulo="CPF" valor={perfil.cpf} />
          <Campo icone={Mail} rotulo="E-mail" valor={perfil.email} />
          <Campo icone={Phone} rotulo="Telefone" valor={perfil.telefone} />
          <Campo icone={Cake} rotulo="Nascimento" valor={formatDataNascimento(perfil.data_nascimento)} />
          <Campo icone={User} rotulo="Sexo" valor={perfil.sexo} />
          <Campo icone={Shirt} rotulo="Tamanho de camisa" valor={perfil.tamanho_camisa} />
        </div>
      </Secao>

      {/* Endereço */}
      {endereco && (
        <Secao titulo="Endereço" icone={MapPin}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 space-y-0.5">
            {endereco.map(linha => (
              <p key={linha} className="text-white text-sm break-words">{linha}</p>
            ))}
          </div>
        </Secao>
      )}

      <p className="text-zinc-600 text-xs text-center pb-2">
        Precisa corrigir algum dado? Fale com a equipe Somma.
      </p>
    </div>
  )
}
