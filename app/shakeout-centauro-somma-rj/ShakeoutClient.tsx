'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Footprints, Snowflake, Coffee, Gift, Users, MapPin, Clock, CalendarDays,
  ArrowRight, Check, TrainFront, Trees, Waves, Home, HelpCircle, Ticket,
} from 'lucide-react'
import { CentauroLogo } from '@/components/shakeout/centauro-logo'
import { InteractiveMenu, type InteractiveMenuItem } from '@/components/ui/modern-mobile-menu'
import { CheckinJourney } from '@/components/shakeout/checkin-journey'
import { SiteFooter } from '@/components/site-footer'

const DopaMap = dynamic(() => import('@/components/shakeout/dopa-map').then((m) => m.DopaMap), {
  ssr: false,
  loading: () => <div className="h-full min-h-[20rem] w-full animate-pulse bg-[#0e0e0e]" />,
})

/* ── Assets ── */
const LOGO_SOMMA = '/Logo_Nova_Somma_Branca_Laranja.svg'
const LOGO_DOPA = 'https://seekdopa.com/cdn/shop/files/DOPA_Logo_Cinza_Original.png?v=1728398053&width=600'
const BG_HERO = '/marcos-vinicius-do-vale-yeEsrY5kzL8-unsplash.jpg'
const IMG_GIFT = 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=1000&q=80'

const ENDERECO = 'Rua Piragibe Frota Aguiar, 7, Copacabana, Rio de Janeiro'
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ENDERECO)}`

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] }
function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  const w = window as DataLayerWindow
  if (w.dataLayer) w.dataLayer.push({ event, ...params })
}

const NAV = [
  { label: 'O EVENTO', href: '#experiencia' },
  { label: 'PROGRAMAÇÃO', href: '#sobre' },
  { label: 'LOCALIZAÇÃO', href: '#localizacao' },
  { label: 'FAQ', href: '#faq' },
]

// menu inferior animado (mobile) — máx. 5 itens
const MOBILE_NAV: (InteractiveMenuItem & { href: string })[] = [
  { label: 'Início', icon: Home, href: '#topo' },
  { label: 'Evento', icon: Footprints, href: '#experiencia' },
  { label: 'Local', icon: MapPin, href: '#localizacao' },
  { label: 'FAQ', icon: HelpCircle, href: '#faq' },
  { label: 'Check-in', icon: Ticket, href: '#checkin' },
]

const EXPERIENCIAS = [
  { icon: Footprints, titulo: 'CORRIDA', desc: '6km em ritmo leve para ativação pré-prova pelas ruas do Rio.' },
  { icon: Snowflake, titulo: 'RECOVERY', bullets: ['Banheira de gelo', 'Botas de compressão', 'Massagem Fast'] },
  { icon: Coffee, titulo: 'COFFEE BREAK', desc: 'Espaço de convivência e networking com corredores de todo o Brasil.' },
  { icon: Gift, titulo: 'SORTEIOS', desc: 'Brindes exclusivos para participantes durante o evento.' },
  { icon: Users, titulo: 'COMUNIDADE', desc: 'Encontros que fortalecem laços e movimentam o running.' },
]

const CASA_DOPA_ITENS = [
  'Pop Up Store Exclusiva', 'Ativações de marcas',
  'Recovery Zone', 'After da Meia Maratona',
  'Shake Out Runs', 'Encontros da comunidade',
]

const TRANSPORTE = [
  { icon: TrainFront, tempo: '5 MIN', local: 'Do metrô General Osório' },
  { icon: Trees, tempo: '8 MIN', local: 'Da Praça General Osório' },
  { icon: Waves, tempo: '12 MIN', local: 'Do Posto 5 Copacabana' },
]

const FAQ = [
  { q: 'Preciso ser membro do Somma Club?', a: 'Não. O evento é aberto a todos os corredores. Basta fazer seu check-in.' },
  { q: 'Tem algum custo?', a: 'A participação é gratuita. As vagas são limitadas e garantidas por ordem de check-in.' },
  { q: 'Que horas devo chegar?', a: 'A concentração começa às 07h30 e a corrida sai às 08h00, na Casa Dopa Rio.' },
  { q: 'O que devo levar?', a: 'Roupa de corrida, tênis e disposição. O recovery e o coffee break ficam por nossa conta.' },
]

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#FF2C03]">{children}</p>
)

export function ShakeoutClient() {
  const rootRef = useRef<HTMLElement>(null)
  const lenisRef = useRef<Lenis | null>(null)

  /* ── Lenis (scroll suave) + GSAP (reveals + parallax) ── */
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 42,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        })
      })
      // parallax da imagem da hero
      gsap.to('[data-hero-bg]', {
        yPercent: 22,
        ease: 'none',
        scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
      })
    }, rootRef)

    return () => {
      ctx.revert()
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (lenisRef.current) {
      e.preventDefault()
      lenisRef.current.scrollTo(href, { offset: -72 })
    }
  }

  const goTo = (href: string) => {
    if (lenisRef.current) lenisRef.current.scrollTo(href, { offset: -72 })
    else document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main
      ref={rootRef}
      className="min-h-screen overflow-x-hidden bg-black pb-24 font-[family-name:var(--font-body)] text-white antialiased lg:pb-0 [&_h1]:font-[family-name:var(--font-display)] [&_h2]:font-[family-name:var(--font-display)] [&_h3]:font-[family-name:var(--font-display)]"
    >
      {/* ===== HEADER ===== */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-6 md:py-4">
          <a href="#topo" onClick={(e) => handleNav(e, '#topo')} aria-label="Somma Club">
            <img src={LOGO_SOMMA} alt="Somma Club" className="h-7 w-auto md:h-8" />
          </a>
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={(e) => handleNav(e, n.href)} className="text-xs font-semibold tracking-widest text-white/70 transition hover:text-white">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="#checkin"
              onClick={(e) => { track('shakeout_cta_click', { cta: 'header_checkin' }); handleNav(e, '#checkin') }}
              className="rounded-md bg-[#FF2C03] px-4 py-2.5 text-xs font-bold tracking-wider text-white transition hover:bg-[#ff4d35]"
            >
              FAZER CHECK-IN
            </a>
          </div>
        </div>
      </header>

      {/* ===== MENU INFERIOR ANIMADO (mobile) ===== */}
      <div className="shk-menu-wrap fixed bottom-4 left-1/2 z-50 -translate-x-1/2 lg:hidden">
        <InteractiveMenu
          items={MOBILE_NAV.map(({ label, icon }) => ({ label, icon }))}
          accentColor="#FF2C03"
          onItemClick={(i) => goTo(MOBILE_NAV[i].href)}
        />
      </div>

      {/* ===== HERO ===== */}
      <section id="topo" data-hero className="relative isolate flex min-h-[100svh] items-center overflow-hidden">
        <img data-hero-bg src={BG_HERO} alt="Rio de Janeiro" aria-hidden className="absolute inset-0 -z-20 h-[120%] w-full object-cover grayscale" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(0,0,0,0.96)_0%,rgba(0,0,0,0.86)_38%,rgba(0,0,0,0.4)_100%)]" />
        <div className="mx-auto w-full max-w-7xl px-5 pt-28 pb-20 md:px-6">
          <div className="max-w-2xl">
            {/* Collab lockup: Centauro ✕ Somma Club */}
            <div data-reveal className="mb-8 flex items-center gap-4 md:gap-6">
              <CentauroLogo className="h-7 w-auto text-white sm:h-9 md:h-11" />
              <span className="font-[family-name:var(--font-display)] text-3xl font-light leading-none text-[#FF2C03] md:text-5xl" aria-hidden>✕</span>
              <img src={LOGO_SOMMA} alt="Somma Club" className="h-11 w-auto sm:h-14 md:h-16" />
            </div>
            <div data-reveal><Eyebrow>04 DE JUNHO • RIO DE JANEIRO</Eyebrow></div>
            <h1 data-reveal className="-skew-x-6 text-[3.25rem] uppercase leading-[0.85] tracking-tight sm:text-7xl md:text-8xl">
              Shake Out
              <br />
              <span className="text-[#FF2C03]">Rio</span>
            </h1>
            <p data-reveal className="mt-6 max-w-md text-base leading-relaxed text-[#A1A1A1] md:text-lg">
              6km de corrida, recovery <span className="font-semibold text-white">gratuito</span>, coffee break e
              sorteios exclusivos para você chegar ainda melhor na sua prova.
            </p>

            <div data-reveal className="mt-9 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:gap-x-8">
              {[
                { icon: CalendarDays, top: '04/06', bottom: 'QUINTA-FEIRA' },
                { icon: Clock, top: '08H00', bottom: 'CONCENTRAÇÃO 07H30' },
                { icon: MapPin, top: 'CASA DOPA RIO', bottom: 'Rua Piragibe Frota Aguiar, 7\nCopacabana, Rio de Janeiro' },
              ].map(({ icon: Icon, top, bottom }) => (
                <div key={top} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#FF2C03]" aria-hidden />
                  <div>
                    <p className="font-bold leading-tight text-[#FF2C03]">{top}</p>
                    <p className="whitespace-pre-line text-xs leading-snug text-[#A1A1A1]">{bottom}</p>
                  </div>
                </div>
              ))}
            </div>

            <a
              data-reveal
              href="#checkin"
              onClick={(e) => { track('shakeout_cta_click', { cta: 'hero_garantir_vaga' }); handleNav(e, '#checkin') }}
              className="group mt-10 inline-flex items-center gap-3 rounded-md bg-[#FF2C03] px-8 py-4 text-sm font-bold tracking-wider text-white transition hover:bg-[#ff4d35] focus:outline-none focus:ring-2 focus:ring-[#FF2C03] focus:ring-offset-2 focus:ring-offset-black"
            >
              GARANTIR MINHA VAGA
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
            </a>
            <p data-reveal className="mt-4 text-xs font-semibold tracking-[0.25em] text-[#A1A1A1]">VAGAS LIMITADAS</p>
          </div>
        </div>
      </section>

      {/* ===== MARQUEE imersivo ===== */}
      <div className="overflow-hidden border-y border-[#1c1c1c] bg-[#FF2C03] py-3">
        <div className="flex w-max animate-[shakeout-marquee_22s_linear_infinite] gap-8 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex items-center gap-8 font-[family-name:var(--font-display)] text-lg uppercase tracking-wide text-black">
              {['Shake Out Rio', '04.06', 'Casa Dopa', 'Copacabana', '6KM', 'Somma + Centauro', 'Vagas Limitadas'].flatMap((t, j) => [
                <span key={`${i}-${j}`}>{t}</span>,
                <span key={`${i}-${j}-dot`} className="text-black/50">✦</span>,
              ])}
            </span>
          ))}
        </div>
      </div>
      <style>{`@keyframes shakeout-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>

      {/* ===== EXPERIÊNCIA ===== */}
      <section id="experiencia" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20 md:px-6 md:py-28">
        <div data-reveal><Eyebrow>Experiência completa</Eyebrow></div>
        <h2 data-reveal className="max-w-2xl text-4xl uppercase leading-[0.95] md:text-5xl">Tudo o que preparamos para você</h2>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {EXPERIENCIAS.map(({ icon: Icon, titulo, desc, bullets }) => (
            <div key={titulo} data-reveal className="rounded-xl border border-[#2A2A2A] bg-[#0e0e0e] p-6 transition hover:-translate-y-1 hover:border-[#FF2C03]/50 hover:bg-[#151515]">
              <Icon className="mb-5 h-7 w-7 text-[#FF2C03]" aria-hidden />
              <h3 className="text-xl uppercase tracking-wide">{titulo}</h3>
              {bullets ? (
                <ul className="mt-3 space-y-1.5 text-sm text-[#A1A1A1]">{bullets.map((b) => <li key={b}>• {b}</li>)}</ul>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-[#A1A1A1]">{desc}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ===== CASA DOPA ===== */}
      <section id="sobre" className="scroll-mt-20 border-y border-[#1c1c1c] bg-[#060606]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 py-20 md:px-6 md:py-28 lg:grid-cols-2">
          <div data-reveal className="flex min-h-[18rem] items-center justify-center rounded-2xl border border-[#2A2A2A] bg-[#0e0e0e] p-10 md:min-h-[26rem] md:p-16">
            <img src={LOGO_DOPA} alt="Casa Dopa Rio" className="w-full max-w-xs [filter:brightness(0)_invert(1)] md:max-w-md" />
          </div>
          <div>
            <div data-reveal><Eyebrow>Semana da Maratona do Rio</Eyebrow></div>
            <h2 data-reveal className="text-4xl uppercase leading-[0.95] md:text-5xl">Conheça a<br />Casa Dopa Rio</h2>
            <p data-reveal className="mt-6 max-w-md text-[#A1A1A1]">
              Durante a semana da Maratona do Rio, a Casa Dopa será um dos principais pontos de encontro dos
              corredores. A Centauro convidou o Somma para liderar uma experiência especial dentro dessa programação.
            </p>
            <ul data-reveal className="mt-8 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {CASA_DOPA_ITENS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#FF2C03]">
                    <Check className="h-3 w-3 text-[#FF2C03]" aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== LOCALIZAÇÃO ===== */}
      <section id="localizacao" className="scroll-mt-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
          <div className="px-5 py-20 md:px-6 md:py-28 lg:pr-12">
            <div data-reveal><Eyebrow>Localização</Eyebrow></div>
            <h2 data-reveal className="text-4xl uppercase md:text-5xl">Casa Dopa Rio</h2>
            <p data-reveal className="mt-4 text-[#A1A1A1]">Rua Piragibe Frota Aguiar, 7<br />Copacabana • Rio de Janeiro</p>
            <div data-reveal className="mt-8 flex flex-wrap gap-x-10 gap-y-6">
              {TRANSPORTE.map(({ icon: Icon, tempo, local }) => (
                <div key={local} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#FF2C03]" aria-hidden />
                  <div>
                    <p className="font-bold leading-tight text-[#FF2C03]">{tempo}</p>
                    <p className="max-w-[8rem] text-xs leading-snug text-[#A1A1A1]">{local}</p>
                  </div>
                </div>
              ))}
            </div>
            <a
              data-reveal
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('shakeout_cta_click', { cta: 'abrir_mapa' })}
              className="group mt-10 inline-flex items-center gap-3 rounded-md border border-white/30 px-7 py-3.5 text-sm font-bold tracking-wider transition hover:border-[#FF2C03] hover:text-[#FF2C03]"
            >
              VER NO MAPA
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
            </a>
          </div>
          <div className="relative min-h-[22rem] border-t border-[#1c1c1c] lg:min-h-0 lg:border-l lg:border-t-0">
            <DopaMap />
          </div>
        </div>
      </section>

      {/* ===== CHECK-IN + SORTEIOS ===== */}
      <section className="border-t border-[#1c1c1c] bg-[#060606]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 py-20 md:px-6 md:py-28 lg:grid-cols-2">
          {/* Check-in */}
          <div id="checkin" className="scroll-mt-20">
            <div data-reveal><Eyebrow>Check-in</Eyebrow></div>
            <h2 data-reveal className="text-4xl uppercase md:text-5xl">Faça seu check-in</h2>
            <p data-reveal className="mt-3 max-w-md text-sm text-[#A1A1A1]">
              Preencha seus dados para confirmar sua participação e garantir sua vaga no evento.
            </p>

            <div data-reveal>
              <CheckinJourney />
            </div>
          </div>

          {/* Sorteios */}
          <div data-reveal className="relative flex flex-col justify-center overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#0e0e0e] p-8 md:p-10">
            <img src={IMG_GIFT} alt="" aria-hidden className="pointer-events-none absolute -right-10 bottom-0 w-56 opacity-80 [mask-image:linear-gradient(to_left,black,transparent)] md:w-80" />
            <div className="relative max-w-sm">
              <Eyebrow>Sorteios exclusivos</Eyebrow>
              <h2 className="text-4xl uppercase leading-[0.95] md:text-5xl">Participe dos sorteios</h2>
              <p className="mt-5 text-[#A1A1A1]">
                Todos os participantes confirmados e presentes no evento concorrerão a brindes exclusivos
                oferecidos pela Centauro.
              </p>
              <CentauroLogo className="mt-8 h-5 w-auto text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-20 md:px-6 md:py-28">
        <div data-reveal><Eyebrow>FAQ</Eyebrow></div>
        <h2 data-reveal className="text-4xl uppercase md:text-5xl">Perguntas frequentes</h2>
        <div data-reveal className="mt-10 divide-y divide-[#1c1c1c] border-y border-[#1c1c1c]">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {q}
                <span className="text-2xl text-[#FF2C03] transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[#A1A1A1]">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ===== FOOTER ORIGINAL DO SITE ===== */}
      <SiteFooter />
    </main>
  )
}
