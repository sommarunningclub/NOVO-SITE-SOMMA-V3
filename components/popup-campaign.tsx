'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Pop-up de campanha, gerenciado pelo painel admin (módulo Pop-ups).
 *
 * Lê a tabela `popups` do Supabase com a chave anon. A policy de RLS
 * "Public can read active popups" já filtra no servidor por `is_active`,
 * `start_date` e `end_date` — então o que chega aqui é o que está no ar.
 * O filtro por página e a regra de frequência são client-side, porque
 * dependem da rota atual e do storage do navegador.
 *
 * Substitui o `public/popup-sdk.js` previsto na spec original: como este site
 * é Next.js e já tem as variáveis do Supabase, um componente evita embutir a
 * chave anon num arquivo estático versionado.
 */

interface Popup {
  id: string
  title: string
  image_url: string
  redirect_link: string
  pages: string[]
  frequency: 'uma_vez' | 'sessao' | 'sempre'
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** Chave de sessão usada para atribuir os cliques. */
function getSessionId(): string {
  const KEY = 'popup_session_id'
  let id = sessionStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(KEY, id)
  }
  return id
}

/** `uma_vez` grava no localStorage, `sessao` no sessionStorage, `sempre` não grava. */
function jaFoiVisto(p: Popup): boolean {
  if (p.frequency === 'sempre') return false
  if (p.frequency === 'uma_vez') return localStorage.getItem(`popup_shown_${p.id}`) === '1'
  return sessionStorage.getItem(`popup_session_${p.id}`) === '1'
}

function marcarVisto(p: Popup): void {
  if (p.frequency === 'uma_vez') localStorage.setItem(`popup_shown_${p.id}`, '1')
  else if (p.frequency === 'sessao') sessionStorage.setItem(`popup_session_${p.id}`, '1')
}

/** Compara a rota atual com a lista de páginas do pop-up, ignorando barra final. */
function valeParaEstaPagina(p: Popup, pathname: string): boolean {
  if (!Array.isArray(p.pages) || p.pages.length === 0) return false
  const atual = pathname.replace(/\/+$/, '') || '/'
  return p.pages.some((pagina) => (String(pagina).replace(/\/+$/, '') || '/') === atual)
}

export function PopupCampaign() {
  const [fila, setFila] = useState<Popup[]>([])
  const [visivel, setVisivel] = useState(false)

  const atual = fila[0]

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return

    let cancelado = false

    async function carregar() {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/popups?select=id,title,image_url,redirect_link,pages,frequency`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY as string,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          },
        )
        if (!res.ok) return

        const dados = (await res.json()) as Popup[]
        if (cancelado || !Array.isArray(dados)) return

        const elegiveis = dados.filter(
          (p) => p.image_url && valeParaEstaPagina(p, window.location.pathname) && !jaFoiVisto(p),
        )
        if (elegiveis.length === 0) return

        setFila(elegiveis)
        // Pequeno atraso para o pop-up não competir com a primeira pintura.
        setTimeout(() => !cancelado && setVisivel(true), 900)
      } catch {
        // Falha ao buscar não pode quebrar a página — o pop-up é acessório.
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [])

  const fechar = useCallback(() => {
    if (atual) marcarVisto(atual)
    setVisivel(false)
    // Mostra o próximo da fila, se houver.
    setTimeout(() => {
      setFila((f) => f.slice(1))
      setVisivel((v) => (v ? v : false))
    }, 220)
  }, [atual])

  useEffect(() => {
    // Reabre para o próximo da fila depois que o anterior saiu.
    if (!visivel && fila.length > 0) {
      const t = setTimeout(() => setVisivel(true), 300)
      return () => clearTimeout(t)
    }
  }, [fila, visivel])

  useEffect(() => {
    if (!visivel) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && fechar()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [visivel, fechar])

  const clicar = useCallback(() => {
    if (!atual) return

    // Registra o clique sem segurar o redirecionamento — se falhar, o usuário
    // ainda vai para o destino.
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      fetch(`${SUPABASE_URL}/rest/v1/popup_clicks`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          popup_id: atual.id,
          user_session_id: getSessionId(),
          page: window.location.pathname,
          device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
        }),
        keepalive: true,
      }).catch(() => {})
    }

    marcarVisto(atual)
    if (atual.redirect_link) window.open(atual.redirect_link, '_blank', 'noopener,noreferrer')
    fechar()
  }, [atual, fechar])

  if (!atual || !visivel) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={atual.title}
      onClick={fechar}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0,0,0,0.7)',
        animation: 'somma-popup-fade 200ms ease-out',
      }}
    >
      <style>{`
        @keyframes somma-popup-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes somma-popup-scale { from { transform: scale(.92); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          borderRadius: 12,
          overflow: 'hidden',
          background: '#fff',
          animation: 'somma-popup-scale 200ms ease-out',
        }}
      >
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: 'rgba(0,0,0,.55)',
            color: '#fff',
            fontSize: 18,
            lineHeight: '32px',
            padding: 0,
          }}
        >
          ×
        </button>

        {atual.redirect_link ? (
          <button
            type="button"
            onClick={clicar}
            style={{ display: 'block', border: 'none', padding: 0, background: 'none', cursor: 'pointer', width: '100%' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={atual.image_url} alt={atual.title} style={{ display: 'block', width: '100%', height: 'auto' }} />
          </button>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={atual.image_url} alt={atual.title} style={{ display: 'block', width: '100%', height: 'auto' }} />
        )}
      </div>
    </div>
  )
}
