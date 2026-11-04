'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Check, CircleAlert, Loader2, Lock, LogOut, Ticket } from 'lucide-react'
import { Grupo, IconeQuadrado, Linha, Segmentado } from '../../_components/ios'
import type { EventoInterno, SituacaoLink } from '@/lib/check-in-interno/eventos'

type Sexo = '' | 'masculino' | 'feminino'

type Pessoa = { nome: string; telefone: string; email: string; cpf: string; sexo: Sexo }

type Resultado =
  | {
      tipo: 'ok'
      nome: string
      pelotao: string | null
      emailEnviado?: boolean
      ingressoUrl?: string
      ticketCode?: string
    }
  | { tipo: 'ja'; mensagem: string; ingressoUrl?: string; ticketCode?: string }

const VAZIO: Pessoa = { nome: '', telefone: '', email: '', cpf: '', sexo: '' }

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

const MENSAGEM_TRAVADO: Record<Exclude<SituacaoLink['motivo'], 'ok'>, (total: number) => string> = {
  esgotado: total => `As ${total} vagas deste link foram usadas. O link está encerrado e não aceita mais inscrições.`,
  passou: () => 'O evento já passou. O link está encerrado.',
  sem_evento: () => 'Não encontramos o evento. Tente de novo em instantes.',
}

export function Formulario({
  evento,
  usadas: usadasInicial,
  total,
  motivo: motivoInicial,
  erro: erroCarga,
}: {
  evento: EventoInterno | null
  usadas: number
  total: number
  motivo: SituacaoLink['motivo']
  erro?: string
}) {
  const router = useRouter()
  const [usadas, setUsadas] = useState(usadasInicial)
  const [motivo, setMotivo] = useState(motivoInicial)
  const [pelotao, setPelotao] = useState('')
  const [pessoa, setPessoa] = useState<Pessoa>(VAZIO)
  const [campos, setCampos] = useState<Record<string, string>>({})
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const restantes = Math.max(0, total - usadas)
  const travado = motivo !== 'ok' || !evento

  const pronto =
    !travado &&
    !!pelotao &&
    pessoa.nome.trim().length > 0 &&
    pessoa.telefone.length >= 10 &&
    pessoa.email.trim().length > 0 &&
    pessoa.cpf.length === 11 &&
    !!pessoa.sexo

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
    if (!pronto || enviando) return
    setEnviando(true)
    setErro('')
    setCampos({})
    setResultado(null)
    try {
      const res = await fetch('/api/check-in-interno/inscrever', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pelotao, ...pessoa }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.status === 401) {
        router.refresh()
        return
      }
      if (res.status === 410 && json.encerrado) {
        if (typeof json.usadas === 'number') setUsadas(json.usadas)
        setMotivo(json.motivo ?? 'esgotado')
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
        pelotao: json.pelotao ?? null,
        emailEnviado: json.email_enviado,
        ingressoUrl: json.ingresso_url,
        ticketCode: json.ticket_code,
      })
      if (typeof json.usadas === 'number') {
        setUsadas(json.usadas)
        if (json.usadas >= total) setMotivo('esgotado')
      }
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
        </div>
        <button
          type="button"
          onClick={sair}
          className="ck-toque mt-1 flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--ck-cel)] px-3 text-[14px] text-[var(--ck-sec)]"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>

      {evento ? (
        <div className="overflow-hidden rounded-[18px] bg-gradient-to-br from-[#FF2C03] via-[#FF4A12] to-[#FF8A1F] p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/80">{evento.dataFormatada}</p>
          <h2 className="mt-1.5 text-[24px] font-bold leading-[1.1] tracking-[-0.03em] text-white">{evento.titulo}</h2>
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-white">
              <span className="text-[15px] font-semibold">
                {travado ? 'Link encerrado' : `Restam ${restantes} de ${total} vagas`}
              </span>
              <span className="text-[13px] tabular-nums text-white/80">
                {usadas}/{total} usadas
              </span>
            </div>
            <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-black/25" aria-hidden>
              <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, (usadas / total) * 100)}%` }} />
            </div>
          </div>
        </div>
      ) : null}

      {resultado ? (
        <div className="mt-5">
          <CartaoResultado resultado={resultado} onFechar={() => setResultado(null)} />
        </div>
      ) : null}

      {travado ? (
        <div className="mt-6 flex items-start gap-3 rounded-[14px] bg-[var(--ck-cel)] p-4" role="status">
          <IconeQuadrado cor="#636366">
            <Lock />
          </IconeQuadrado>
          <div>
            <p className="text-[16px] font-semibold">Formulário bloqueado</p>
            <p className="mt-0.5 text-[14px] text-[var(--ck-sec)]">
              {motivo !== 'ok' ? MENSAGEM_TRAVADO[motivo](total) : MENSAGEM_TRAVADO.sem_evento(total)}
              {erroCarga ? ` (${erroCarga})` : ''}
            </p>
          </div>
        </div>
      ) : evento ? (
        <form onSubmit={enviar} noValidate className="mt-6">
          <Grupo
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
            A pessoa recebe o ingresso por e-mail e entra na lista de check-in da gestão.
          </p>
        </form>
      ) : null}
    </main>
  )
}

function CartaoResultado({ resultado, onFechar }: { resultado: Resultado; onFechar: () => void }) {
  const ok = resultado.tipo === 'ok'
  return (
    <div className={`rounded-[14px] p-4 ${ok ? 'bg-[#30D158]/15' : 'bg-[#FF9F0A]/15'}`} role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <IconeQuadrado cor={ok ? '#30D158' : '#FF9F0A'}>{ok ? <Check /> : <CircleAlert />}</IconeQuadrado>
        <div className="min-w-0 flex-1">
          {resultado.tipo === 'ok' ? (
            <>
              <p className="text-[16px] font-semibold">{resultado.nome} está dentro.</p>
              {resultado.pelotao ? (
                <p className="mt-0.5 text-[14px] text-[var(--ck-sec)]">Pelotão {rotuloPelotao(resultado.pelotao)}</p>
              ) : null}
              <p className="mt-1 text-[14px] text-[var(--ck-sec)]">
                {resultado.emailEnviado
                  ? 'O ingresso foi enviado por e-mail.'
                  : 'O e-mail do ingresso não saiu: mande o link abaixo para a pessoa.'}
              </p>
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
