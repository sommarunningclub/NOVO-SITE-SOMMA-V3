'use client'

import { useEffect, useState } from 'react'
import { Users, X, Pencil } from 'lucide-react'

const COOKIE_JA_CADASTROU = 'wings_equipe_cadastrada'
const COOKIE_FECHOU = 'wings_cadastro_flutuante_fechado'

export default function WingsCadastroFlutuante() {
  const [visivel, setVisivel] = useState(false)
  const [escondido, setEscondido] = useState(true)
  const [jaCadastrou, setJaCadastrou] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return
    // Se user fechou manualmente nesta sessão, respeita
    if (sessionStorage.getItem(COOKIE_FECHOU) === '1') return

    // Detecta se já cadastrou (mas continua mostrando — só muda o texto)
    setJaCadastrou(document.cookie.includes(`${COOKIE_JA_CADASTROU}=`))
    setEscondido(false)

    function onScroll() {
      const scrolled = window.scrollY
      // Aparece já no hero (após 60px de scroll — basta o usuário começar a rolar)
      // Some quando o usuário está dentro da seção de cadastro
      const sec = document.getElementById('wings-cadastro-equipe')
      let dentroDaSecao = false
      if (sec) {
        const rect = sec.getBoundingClientRect()
        dentroDaSecao = rect.top < window.innerHeight * 0.7 && rect.bottom > 0
      }
      setVisivel(scrolled >= 60 && !dentroDaSecao)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function fechar(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    sessionStorage.setItem(COOKIE_FECHOU, '1')
    setEscondido(true)
  }

  function rolarParaCadastro() {
    document.getElementById('wings-cadastro-equipe')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (escondido) return null

  return (
    <button
      type="button"
      onClick={rolarParaCadastro}
      aria-label={jaCadastrou ? 'Editar minha equipe' : 'Cadastrar equipe competidora'}
      className={`fixed z-40 bottom-3 right-3 sm:bottom-8 sm:right-8 group transition-all duration-500 max-w-[calc(100vw-1.5rem)] ${
        visivel
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <span className="relative flex items-center gap-2 sm:gap-3 bg-[#ff2c03] hover:bg-[#e62800] text-white pl-3 pr-3 py-2.5 sm:pl-4 sm:pr-5 sm:py-3.5 shadow-2xl shadow-[#ff2c03]/40 border-2 border-white/15">
        {/* Pulse ring */}
        <span
          aria-hidden="true"
          className="absolute -inset-1 border-2 border-[#ff2c03] animate-ping opacity-40"
        />
        <span className="relative flex items-center gap-2 sm:gap-3">
          <span className="bg-wfl-yellow text-wfl-navy p-1.5 sm:p-2 flex items-center justify-center flex-shrink-0">
            {jaCadastrou ? (
              <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </span>
          <span
            className="font-bold tracking-wider uppercase text-[10px] sm:text-xs leading-tight text-left"
            style={{ fontFamily: 'var(--font-dm-sans-wfl), sans-serif' }}
          >
            {jaCadastrou ? (
              <>
                <span className="block text-wfl-yellow">Sua equipe</span>
                <span className="block">Editar dados →</span>
              </>
            ) : (
              <>
                <span className="block text-wfl-yellow">Sua atlética competindo?</span>
                <span className="block">Cadastrar equipe →</span>
              </>
            )}
          </span>
        </span>
        <span
          role="button"
          tabIndex={0}
          aria-label="Fechar"
          onClick={fechar}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              fechar(e as unknown as React.MouseEvent)
            }
          }}
          className="ml-1 sm:ml-2 w-7 h-7 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/20 transition-colors flex-shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </span>
      </span>
    </button>
  )
}
