'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Calendar, Check, CircleAlert, Loader2, LogOut, Ticket } from 'lucide-react'
import { Grupo, IconeQuadrado, Linha, Segmentado } from '../../_components/ios'
import type { EventoInterno } from '@/lib/check-in-interno/eventos'

type Sexo = '' | 'masculino' | 'feminino'

type Pessoa = { nome: string; telefone: string; email: string; cpf: string; sexo: Sexo }

type Resultado =
  | {
      tipo: 'ok'
      nome: string
      evento: string
      pelotao: string | null
      emailEnviado?: boolean
      ingressoUrl?: string
      ticketCode?: string
    }
  | { tipo: 'ja'; mensagem: string; ingressoUrl?: string; ticketCode?: string }

const VAZIO: Pessoa = { nome: '', telefone: '', email: '', cpf: '', sexo: '' }

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const PUBLICO: Record<EventoInterno['publico'], { rotulo: string; cor: string }> = {
  aberto: { rotulo: 'Público aberto', cor: '#30D158' },
  fechado: { rotulo: 'Público fechado', cor: '#FF9F0A' },
  oculto: { rotulo: 'Oculto no site', cor: '#8E8E93' },
}

function rotuloPelotao(p: string): string {
  const km = p.trim().match(/^(\d+(?:[.,]\d+)?)\s*km$/i)
  return km ? `${km[1].replace('.', ',')} km` : p.trim()
}

function mascaraTelefone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function mascaraCpf(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

export function Formulario({ eventos, erro: erroCarga }: { eventos: EventoInterno[]; erro?: string }) {
  const router = useRouter()
  const [eventoId, setEventoId] = useState(eventos.length === 1 ? eventos[0].id : '')
  const [pelotao, setPelotao] = useState('')
  const [pessoa, setPessoa] = useState<Pessoa>(VAZIO)
  const [campos, setCampos] = useState<Record<string, string>>({})
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const evento = eventos.find(e => e.id === eventoId) ?? null
  const precisaPelotao = evento?.tipo !== 'personalizado'

  const pronto =
    !!evento &&
    (!precisaPelotao || !!pelotao) &&
    pessoa.nome.trim().length > 0 &&
    pessoa.telefone.length >= 10 &&
    pessoa.email.trim().length > 0 &&
    pessoa.cpf.length === 11 &&
    !!pessoa.sexo

  function escolherEvento(id: string) {
    setEventoId(id)
    const ev = eventos.find(e => e.id === id)
    if (ev && !ev.pelotoes.includes(pelotao)) setPelotao('')
    setResultado(null)
  }

  function mudar<K extends keyof Pessoa>(campo: K, valor: Pessoa[K]) {
    setPessoa(p => ({ ...p, [campo]: valor }))
    setCampos(c => {
      if (!c[campo]) return c
      const { [campo]: _, ...resto } = c
      return resto
    })
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!pronto || enviando || !evento) return
    setEnviando(true)
    setErro('')
    setCampos({})
    setResultado(null)
    try {
      const res = await fetch('/api/check-in-interno/inscrever', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evento_id: evento.id, pelotao, ...pessoa }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.status === 401) {
        router.refresh()
        return
      }
      if (res.status === 409 && json.ja_inscrito) {
        setResultado({ tipo: 'ja', mensagem: json.error, ingressoUrl: json.ingresso_url, ticketCode: json.ticket_code })
        return
      }
      if (!res.ok) {
        setErro(json.error || 'Não deu para salvar. Tente de novo.')
        if (json.campos) setCampos(json.campos)
        return
      }
      setResultado({
        tipo: 'ok',
        nome: json.nome,
        evento: json.evento,
        pelotao: json.pelotao ?? null,
        emailEnviado: json.email_enviado,
        ingressoUrl: json.ingresso_url,
        ticketCode: json.ticket_code,
      })
      setPessoa(VAZIO)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setErro('Sem conexão. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  async function sair() {
    await fetch('/api/check-in-interno/login', { method: 'DELETE' }).catch(() => null)
    router.refresh()
  }

  const avisoDados = campos.nome || campos.telefone || campos.email || campos.cpf

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-[calc(40px+var(--ck-base))] pt-[calc(20px+var(--ck-topo))] sm:px-6 sm:pt-10">
      <div className="mb-6 flex items-start justify-between gap-4 px-1">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--ck-tint)]">Equipe SOMMA</p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-[-0.03em] sm:text-[34px]">Inscrição interna</h1>
          <p className="mt-1 text-[15px] text-[var(--ck-sec)]">
            Coloque convidados dentro do evento, mesmo com a inscrição pública fechada.
          </p>
        </div>
        <button
          type="button"
          onClick={sair}
          className="ck-toque mt-1 flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--ck-cel)] px-3 text-[14px] text-[var(--ck-sec)]"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>

      {resultado ? <CartaoResultado resultado={resultado} onFechar={() => setResultado(null)} /> : null}

      {erroCarga ? (
        <p className="mb-5 rounded-[12px] bg-[#FF453A]/15 px-4 py-3 text-[15px] text-[#FF453A]">
          Não deu para carregar os eventos: {erroCarga}
        </p>
      ) : null}

      {eventos.length === 0 && !erroCarga ? (
        <Grupo>
          <Linha icone={<IconeQuadrado cor="#636366"><Calendar /></IconeQuadrado>}>
            <span className="block text-[16px]">Nenhum evento de hoje em diante.</span>
            <span className="block text-[13px] text-[var(--ck-sec)]">Crie o evento na gestão e recarregue a página.</span>
          </Linha>
        </Grupo>
      ) : null}

      {eventos.length > 0 ? (
        <form onSubmit={enviar} noValidate>
          <Grupo titulo="Evento">
            {eventos.map(ev => {
              const [, m, d] = ev.data.split('-').map(Number)
              const st = PUBLICO[ev.publico]
              const ativo = ev.id === eventoId
              return (
                <Linha
                  key={ev.id}
                  onClick={() => escolherEvento(ev.id)}
                  selecionada={ativo}
                  icone={
                    <span className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-[10px] bg-[var(--ck-cel-2)] text-center leading-none">
                      <span>
                        <span className="block text-[18px] font-bold tabular-nums">{String(d).padStart(2, '0')}</span>
                        <span className="block text-[11px] uppercase text-[var(--ck-sec)]">{MESES[m - 1]}</span>
                      </span>
                    </span>
                  }
                  direita={
                    ativo ? <Check className="h-5 w-5 shrink-0 text-[var(--ck-tint)]" strokeWidth={2.6} /> : null
                  }
                >
                  <span className="block text-[16px] font-medium">{ev.titulo}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[var(--ck-sec)]">
                    <span className="h-2 w-2 rounded-full" style={{ background: st.cor }} aria-hidden />
                    {st.rotulo}
                    {ev.comIngresso ? ' · gera ingresso' : ''}
                  </span>
                </Linha>
              )
            })}
          </Grupo>

          {evento && precisaPelotao ? (
            <Grupo
              className="mt-6"
              titulo="Pelotão"
              rodape={campos.pelotao ? <span className="text-[#FF453A]" role="alert">{campos.pelotao}</span> : undefined}
            >
              <div className="p-2">
                <Segmentado
                  rotulo="Pelotão"
                  valor={pelotao}
                  onChange={setPelotao}
                  opcoes={evento.pelotoes.map(p => ({ valor: p, rotulo: rotuloPelotao(p) }))}
                />
              </div>
            </Grupo>
          ) : null}

          <Grupo
            className="mt-6"
            titulo="Dados da pessoa"
            rodape={avisoDados ? <span className="text-[#FF453A]" role="alert">{avisoDados}</span> : undefined}
          >
            <Campo
              rotulo="Nome"
              erro={!!campos.nome}
              input={{
                value: pessoa.nome,
                onChange: e => mudar('nome', e.target.value),
                placeholder: 'Nome completo',
                autoComplete: 'off',
                autoCapitalize: 'words',
              }}
            />
            <Campo
              rotulo="WhatsApp"
              erro={!!campos.telefone}
              input={{
                type: 'tel',
                inputMode: 'tel',
                value: mascaraTelefone(pessoa.telefone),
                onChange: e => mudar('telefone', e.target.value.replace(/\D/g, '').slice(0, 11)),
                placeholder: '(61) 99999-9999',
                autoComplete: 'off',
              }}
            />
            <Campo
              rotulo="E-mail"
              erro={!!campos.email}
              input={{
                type: 'email',
                inputMode: 'email',
                value: pessoa.email,
                onChange: e => mudar('email', e.target.value),
                placeholder: 'pessoa@email.com',
                autoComplete: 'off',
                autoCapitalize: 'none',
                autoCorrect: 'off',
                spellCheck: false,
              }}
            />
            <Campo
              rotulo="CPF"
              erro={!!campos.cpf}
              input={{
                inputMode: 'numeric',
                value: mascaraCpf(pessoa.cpf),
                onChange: e => mudar('cpf', e.target.value.replace(/\D/g, '').slice(0, 11)),
                placeholder: '000.000.000-00',
                autoComplete: 'off',
                className: 'tabular-nums',
              }}
            />
          </Grupo>

          <Grupo
            className="mt-6"
            titulo="Sexo"
            rodape={campos.sexo ? <span className="text-[#FF453A]" role="alert">{campos.sexo}</span> : undefined}
          >
            <div className="p-2">
              <Segmentado
                rotulo="Sexo"
                valor={pessoa.sexo}
                onChange={s => mudar('sexo', s)}
                opcoes={[
                  { valor: 'masculino', rotulo: 'Masculino' },
                  { valor: 'feminino', rotulo: 'Feminino' },
                ]}
              />
            </div>
          </Grupo>

          {erro ? (
            <p className="mt-5 px-4 text-[15px] text-[#FF453A]" role="alert">
              {erro}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!pronto || enviando}
            className="ck-toque mt-6 flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--ck-tint)] text-[17px] font-semibold text-white transition-opacity disabled:opacity-40"
          >
            {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Inscrever no evento
          </button>
          <p className="mt-2 px-4 text-center text-[13px] text-[var(--ck-sec)]">
            A pessoa entra na lista de check-in da gestão, como numa inscrição pelo site.
          </p>
        </form>
      ) : null}
    </main>
  )
}

function CartaoResultado({ resultado, onFechar }: { resultado: Resultado; onFechar: () => void }) {
  const ok = resultado.tipo === 'ok'
  return (
    <div
      className={`mb-6 rounded-[14px] p-4 ${ok ? 'bg-[#30D158]/15' : 'bg-[#FF9F0A]/15'}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <IconeQuadrado cor={ok ? '#30D158' : '#FF9F0A'}>{ok ? <Check /> : <CircleAlert />}</IconeQuadrado>
        <div className="min-w-0 flex-1">
          {resultado.tipo === 'ok' ? (
            <>
              <p className="text-[16px] font-semibold">{resultado.nome} está dentro.</p>
              <p className="mt-0.5 text-[14px] text-[var(--ck-sec)]">
                {resultado.evento}
                {resultado.pelotao ? ` · ${rotuloPelotao(resultado.pelotao)}` : ''}
              </p>
              {resultado.ingressoUrl ? (
                <p className="mt-1 text-[14px] text-[var(--ck-sec)]">
                  {resultado.emailEnviado
                    ? 'O ingresso foi enviado por e-mail.'
                    : 'O e-mail do ingresso não saiu: mande o link abaixo para a pessoa.'}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-[16px] font-semibold">{resultado.mensagem}</p>
          )}
          {resultado.ingressoUrl ? (
            <a
              href={resultado.ingressoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[14px]"
            >
              <Ticket className="h-4 w-4" />
              Ver ingresso{resultado.ticketCode ? ` ${resultado.ticketCode}` : ''}
              <ArrowUpRight className="h-4 w-4 text-[var(--ck-sec)]" />
            </a>
          ) : null}
        </div>
        <button type="button" onClick={onFechar} className="text-[14px] text-[var(--ck-sec)]">
          Fechar
        </button>
      </div>
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
        <span className={`w-[84px] shrink-0 text-[17px] ${erro ? 'text-[#FF453A]' : ''}`}>{rotulo}</span>
        <input
          {...input}
          aria-invalid={erro || undefined}
          className={`h-7 min-w-0 flex-1 bg-transparent text-white outline-none ${input.className ?? ''}`}
        />
      </span>
    </Linha>
  )
}
