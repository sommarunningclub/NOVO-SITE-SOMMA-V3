"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

/** O cupom em destaque, com um toque para copiar antes de ir ao checkout. */
export function CupomDoProfessor({ cupom, primeiroNome }: { cupom: string; primeiroNome: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(cupom)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Sem permissão de área de transferência (alguns navegadores de app): o código continua visível.
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border-2 border-dashed border-bora/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Cupom do {primeiroNome}</p>
        <p className="mt-1 font-bora text-4xl font-black italic tracking-wide text-bora sm:text-5xl">{cupom}</p>
      </div>
      <button
        type="button"
        onClick={copiar}
        className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-bora px-6 py-3 font-bora text-sm font-bold uppercase tracking-wide text-bora transition-colors hover:bg-bora hover:text-black"
      >
        {copiado ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        {copiado ? "Copiado" : "Copiar cupom"}
      </button>
    </div>
  )
}
