'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { CheckCircle2, Share2, Camera, MapPin, Calendar, Clock } from 'lucide-react'

import { GENDER_LABEL, type RegistrationInput } from '@/lib/wings/validations'

const fontDisplay = { fontFamily: 'var(--font-bebas), sans-serif' }
const fontBody = { fontFamily: 'var(--font-dm-sans-wfl), sans-serif' }

const EVENT_INFO = {
  date: '02 / 05 / 2026',
  time: '08h – 12h',
  location: 'Pista de Atletismo — CO UnB',
  city: 'Brasília · DF',
  mapsUrl: 'https://maps.app.goo.gl/8hLYd9ULSM76Ffeh8',
}

type Props = {
  fullName: string
  registration: RegistrationInput
}

export default function WingsSuccessState({ fullName, registration }: Props) {
  const [institutionName, setInstitutionName] = useState<string>('—')
  const [atleticaName, setAtleticaName] = useState<string>('—')

  // Lookup nomes (instituição + atlética) pra mostrar no ticket
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/wings/institutions')
        .then(r => r.json())
        .catch(() => ({ institutions: [] })),
      fetch(`/api/wings/atleticas?institution_id=${registration.institution_id}`)
        .then(r => r.json())
        .catch(() => ({ atleticas: [] })),
    ]).then(([instJson, atlJson]) => {
      if (cancelled) return
      const inst = (instJson.institutions ?? []).find(
        (i: { id: string }) => i.id === registration.institution_id
      )
      const atl = (atlJson.atleticas ?? []).find(
        (a: { id: string }) => a.id === registration.atletica_id
      )
      if (inst) setInstitutionName(inst.name)
      if (atl) setAtleticaName(atl.name)
    })
    return () => {
      cancelled = true
    }
  }, [registration.institution_id, registration.atletica_id])

  const shareText = encodeURIComponent(
    `Tô dentro do Wings das Atléticas 2026! 🏃‍♀️🏃‍♂️ Atléticas Day — Wings For Life · 02/05/2026 na Pista de Atletismo CO UnB. Bora correr juntos! sommaclub.com.br/wings-das-atleticas-2026`
  )

  return (
    <div className="text-center" style={fontBody}>
      {/* Header de confirmação */}
      <div className="mx-auto w-16 h-16 bg-wfl-red/10 flex items-center justify-center mb-5">
        <CheckCircle2 className="w-9 h-9 text-wfl-red" />
      </div>
      <h3
        className="text-3xl sm:text-5xl text-wfl-navy uppercase leading-none"
        style={fontDisplay}
      >
        Inscrição confirmada!
      </h3>
      <p className="mt-3 text-sm sm:text-base text-wfl-dark/70 max-w-md mx-auto">
        {fullName ? `Bora, ${fullName.split(' ')[0]}! ` : ''}
        Tira um print desse ticket e guarda. No dia do evento ele será validado pela
        equipe pra você receber a pulseira.
      </p>

      {/* Aviso de print */}
      <div className="mt-5 inline-flex items-center gap-2 bg-wfl-yellow/30 border border-wfl-yellow text-wfl-navy text-xs sm:text-sm font-semibold px-3 py-2">
        <Camera className="w-4 h-4" />
        Salve este ticket no seu celular (print ou screenshot)
      </div>

      {/* Wrapper "ticket" — inspirado em ticket-system print animation */}
      <div className="ticket-system mt-8 mx-auto max-w-sm">
        {/* Impressora — barra que "imprime" o papel */}
        <div className="printer relative mx-auto h-5 w-[92%] border-[4px] border-wfl-navy rounded-lg bg-white shadow-md z-10" />

        {/* Wrapper com overflow hidden — esconde o recibo enquanto desce */}
        <div className="receipts-wrapper relative -mt-2.5 pb-3 overflow-hidden">
          <div className="receipts flex flex-col items-center w-full">

        {/* Recibo principal */}
        <div className="ticket-receipt mx-auto bg-white border-2 border-wfl-navy rounded-2xl shadow-2xl shadow-wfl-navy/20 px-5 sm:px-7 py-6 text-left w-[92%]">
          {/* Logo WFL + parceiros mini */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-dashed border-wfl-border">
            <Image
              src="/wflwr-logo-pos.CJlzM-_-.svg"
              alt="Wings for Life World Run"
              width={88}
              height={32}
              className="h-7 sm:h-8 w-auto"
            />
            <span className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-wfl-dark/50">
              Atléticas Day · 02
            </span>
          </div>

          {/* Rota / atlética */}
          <div className="mt-5 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] tracking-[0.2em] uppercase text-wfl-dark/50">
                Atlética
              </span>
              <h2
                className="mt-1 text-xl sm:text-3xl uppercase leading-none text-wfl-navy break-words"
                style={fontDisplay}
              >
                {atleticaName}
              </h2>
            </div>
            <span className="text-2xl sm:text-3xl text-wfl-red leading-none flex-shrink-0">→</span>
            <div className="text-right min-w-0 flex-1">
              <span className="text-[10px] tracking-[0.2em] uppercase text-wfl-dark/50">
                Instituição
              </span>
              <h2
                className="mt-1 text-xl sm:text-3xl uppercase leading-none text-wfl-navy break-words"
                style={fontDisplay}
              >
                {institutionName}
              </h2>
            </div>
          </div>

          {/* Detalhes em grid 2 col */}
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4">
            <div>
              <span className="text-[10px] tracking-[0.2em] uppercase text-wfl-dark/50">
                Participante
              </span>
              <p className="mt-1 font-semibold text-sm text-wfl-navy break-words">
                {fullName}
              </p>
            </div>
            <div>
              <span className="text-[10px] tracking-[0.2em] uppercase text-wfl-dark/50">
                Sexo
              </span>
              <p className="mt-1 font-semibold text-sm text-wfl-navy">
                {GENDER_LABEL[registration.gender]}
              </p>
            </div>
            <div>
              <span className="text-[10px] tracking-[0.2em] uppercase text-wfl-dark/50">
                <Calendar className="inline w-3 h-3 mr-1" /> Data
              </span>
              <p className="mt-1 font-semibold text-sm text-wfl-navy">{EVENT_INFO.date}</p>
            </div>
            <div>
              <span className="text-[10px] tracking-[0.2em] uppercase text-wfl-dark/50">
                <Clock className="inline w-3 h-3 mr-1" /> Horário
              </span>
              <p className="mt-1 font-semibold text-sm text-wfl-navy">{EVENT_INFO.time}</p>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] tracking-[0.2em] uppercase text-wfl-dark/50">
                <MapPin className="inline w-3 h-3 mr-1" /> Local
              </span>
              <p className="mt-1 font-semibold text-sm text-wfl-navy leading-tight">
                {EVENT_INFO.location}
                <span className="block text-xs text-wfl-dark/60 font-normal">
                  {EVENT_INFO.city}
                </span>
              </p>
              <a
                href={EVENT_INFO.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs font-semibold text-wfl-red hover:underline"
              >
                Abrir no Google Maps →
              </a>
            </div>
          </div>

          {/* Status check-in */}
          <div className="mt-5 bg-wfl-yellow/30 border border-wfl-yellow px-3 py-2 text-xs text-wfl-navy leading-snug">
            <strong className="font-bold">Check-in pendente.</strong> Será validado
            presencialmente no dia do evento. Apresente este código + um documento
            com foto.
          </div>
        </div>

          </div>
        </div>
      </div>

      {/* Parceiros */}
      <div className="mt-10">
        <p className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-wfl-dark/50">
          Realização
        </p>
        <div className="mt-4 bg-wfl-navy py-5 px-4 sm:px-8 mx-auto max-w-md">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Image
              src="/Logo_Nova_Somma_Branca_Laranja.svg"
              alt="Somma Running Club"
              width={120}
              height={40}
              className="h-9 sm:h-10 w-auto"
            />
            <Image
              src="/RED BULL_ED_LATA_FL_BRANCO_ABERTA.png"
              alt="Red Bull"
              width={40}
              height={80}
              className="h-12 sm:h-14 w-auto"
            />
            <Image
              src="/wflwr-logo-white.svg"
              alt="Wings for Life World Run"
              width={120}
              height={40}
              className="h-9 sm:h-10 w-auto"
            />
          </div>
        </div>
      </div>

      {/* Compartilhar */}
      <a
        href={`https://wa.me/?text=${shareText}`}
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-flex items-center gap-2 bg-wfl-red hover:bg-wfl-red/90 text-white px-6 py-3 text-sm font-bold tracking-[0.2em] uppercase transition-colors"
      >
        <Share2 className="w-4 h-4" /> Compartilhar no WhatsApp
      </a>

      {/* Animação de impressão — papel saindo da impressora */}
      <style jsx>{`
        .receipts {
          transform: translateY(-560px);
          animation: print 2.5s cubic-bezier(0.22, 0.61, 0.36, 1) 400ms forwards;
        }

        @keyframes print {
          0% {
            transform: translateY(-560px);
          }
          35% {
            transform: translateY(-440px);
          }
          70% {
            transform: translateY(-160px);
          }
          100% {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
