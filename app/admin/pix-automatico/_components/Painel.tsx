"use client"

import { useState } from "react"
import { Loader2, Copy, Check, Lock, Plus, AlertCircle } from "lucide-react"

type Token = {
  codigo: string
  criado_em: string
  expira_em: string
  usado_em?: string | null
  usado_por_nome?: string | null
  observacao?: string | null
  criado_por?: string | null
}

function formatarData(valor?: string | null) {
  if (!valor) return "-"
  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function situacao(t: Token) {
  if (t.usado_em) return { texto: "Usado", cor: "text-white/40" }
  if (new Date(t.expira_em) <= new Date()) return { texto: "Expirado", cor: "text-white/30" }
  return { texto: "Disponível", cor: "text-[#32bcad]" }
}

export function PixAutomaticoTokensPainel() {
  const [secret, setSecret] = useState("")
  const [autenticado, setAutenticado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const [observacao, setObservacao] = useState("")
  const [copiado, setCopiado] = useState<string | null>(null)

  const carregarTokens = async (chave: string) => {
    const res = await fetch("/api/pix-automatico/tokens", { headers: { "x-admin-secret": chave } })
    if (!res.ok) throw new Error(res.status === 401 ? "Senha incorreta" : "Erro ao carregar")
    const data = await res.json()
    setTokens(data.tokens ?? [])
  }

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregando(true)
    setErro(null)
    try {
      await carregarTokens(secret)
      setAutenticado(true)
    } catch (err: any) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  const gerar = async () => {
    setCarregando(true)
    setErro(null)
    try {
      const res = await fetch("/api/pix-automatico/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ observacao: observacao.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao gerar código")
      setObservacao("")
      await carregarTokens(secret)
    } catch (err: any) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  const copiar = async (codigo: string) => {
    await navigator.clipboard.writeText(codigo)
    setCopiado(codigo)
    setTimeout(() => setCopiado(null), 2500)
  }

  const inputClass =
    "w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg text-base sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#32bcad] transition-all"

  if (!autenticado) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center px-4">
        <form onSubmit={entrar} className="max-w-sm w-full space-y-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#32bcad]/10 border border-[#32bcad]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-[#32bcad]" strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-light text-white">Liberação do Pix Automático</h1>
            <p className="text-sm text-white/40 mt-1">Acesso restrito</p>
          </div>
          <input
            type="password"
            value={secret}
            onChange={(e) => { setSecret(e.target.value); setErro(null) }}
            placeholder="Senha do admin"
            className={inputClass}
            autoFocus
          />
          {erro && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{erro}
            </p>
          )}
          <button
            type="submit"
            disabled={carregando || !secret}
            className="w-full py-3 bg-[#32bcad] hover:bg-[#2aa89b] disabled:opacity-40 text-black font-semibold rounded-lg transition-colors flex items-center justify-center"
          >
            {carregando ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar"}
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-light">Liberação do Pix Automático</h1>
          <p className="text-sm text-white/40 mt-1">
            Cada código libera um checkout e vale por 24 horas.
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Gerar novo código</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), gerar())}
              placeholder="Para quem é (opcional): nome ou telefone"
              className={inputClass}
            />
            <button
              type="button"
              onClick={gerar}
              disabled={carregando}
              className="px-5 py-3 bg-[#32bcad] hover:bg-[#2aa89b] disabled:opacity-40 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Gerar
            </button>
          </div>
          {erro && (
            <p className="text-xs text-red-400 flex items-center gap-1 mt-3">
              <AlertCircle className="w-3 h-3" />{erro}
            </p>
          )}
        </div>

        <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Últimos códigos</p>
        <div className="space-y-2">
          {tokens.length === 0 && (
            <p className="text-sm text-white/30 py-8 text-center">Nenhum código gerado ainda.</p>
          )}
          {tokens.map((t) => {
            const st = situacao(t)
            const disponivel = st.texto === "Disponível"
            return (
              <div
                key={t.codigo}
                className={`border rounded-xl p-4 flex items-center gap-4 ${
                  disponivel ? "border-[#32bcad]/30 bg-[#32bcad]/5" : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div className="flex-grow min-w-0">
                  <p className="font-mono text-lg tracking-wider text-white">{t.codigo}</p>
                  <p className="text-xs text-white/40 mt-1">
                    <span className={st.cor}>{st.texto}</span>
                    {disponivel && ` · expira ${formatarData(t.expira_em)}`}
                    {t.usado_em && ` · em ${formatarData(t.usado_em)}`}
                    {t.observacao && ` · ${t.observacao}`}
                  </p>
                </div>
                {disponivel && (
                  <button
                    type="button"
                    onClick={() => copiar(t.codigo)}
                    className="px-3 py-2 flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm transition-colors flex-shrink-0"
                  >
                    {copiado === t.codigo ? (
                      <><Check className="w-4 h-4 text-[#32bcad]" />Copiado</>
                    ) : (
                      <><Copy className="w-4 h-4" />Copiar</>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
