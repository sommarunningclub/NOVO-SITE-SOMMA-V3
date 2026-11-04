'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock } from 'lucide-react'
import { Grupo, IconeQuadrado, Linha } from '../../_components/ios'

export function Login() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    if (!senha.trim() || enviando) return
    setEnviando(true)
    setErro('')
    try {
      const res = await fetch('/api/check-in-interno/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(json.error || 'Não deu para entrar.')
        setSenha('')
        return
      }
      router.refresh()
    } catch {
      setErro('Sem conexão. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-4 pb-[calc(24px+var(--ck-base))] pt-[calc(24px+var(--ck-topo))]">
      <div className="mb-6 px-1 text-center">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[16px] bg-[var(--ck-tint)]">
          <Lock className="h-7 w-7 text-white" />
        </span>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em]">Inscrição interna</h1>
        <p className="mt-1 text-[15px] text-[var(--ck-sec)]">Acesso da equipe SOMMA. Digite a senha para continuar.</p>
      </div>

      <form onSubmit={entrar}>
        <Grupo rodape={erro ? <span className="text-[#FF453A]" role="alert">{erro}</span> : undefined}>
          <Linha rotulo icone={<IconeQuadrado cor="#636366"><Lock /></IconeQuadrado>}>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              autoFocus
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Senha"
              aria-label="Senha"
              className="h-7 w-full bg-transparent text-[17px] text-white outline-none"
            />
          </Linha>
        </Grupo>

        <button
          type="submit"
          disabled={!senha.trim() || enviando}
          className="ck-toque mt-6 flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--ck-tint)] text-[17px] font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          Entrar
        </button>
      </form>
    </main>
  )
}
