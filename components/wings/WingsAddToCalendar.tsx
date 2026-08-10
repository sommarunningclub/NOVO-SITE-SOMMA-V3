'use client'

import { useState } from 'react'
import { CalendarPlus, ChevronDown } from 'lucide-react'

// Logo Google Calendar (oficial, multi-cor)
function GoogleCalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <path fill="#fff" d="M148.882 43.618 100 36.353 51.118 43.618 43.618 100l7.5 56.382L100 163.647l48.882-7.265 7.265-56.382z" />
      <path fill="#1a73e8" d="M65.211 125.276c-3.687-2.49-6.241-6.128-7.642-10.937l8.456-3.484c.781 2.974 2.146 5.279 4.094 6.914 1.937 1.635 4.292 2.443 7.044 2.443 2.813 0 5.231-.854 7.252-2.563 2.021-1.708 3.036-3.886 3.036-6.519 0-2.694-1.062-4.896-3.187-6.604s-4.792-2.563-7.979-2.563h-4.885v-8.371h4.385c2.745 0 5.058-.74 6.94-2.224 1.882-1.484 2.823-3.51 2.823-6.087 0-2.292-.838-4.115-2.516-5.479s-3.797-2.052-6.373-2.052c-2.516 0-4.516.667-6 2.005s-2.563 2.984-3.234 4.927l-8.37-3.484c1.115-3.161 3.161-5.953 6.156-8.371s6.823-3.625 11.476-3.625c3.443 0 6.542.661 9.291 1.99 2.75 1.328 4.911 3.172 6.476 5.526 1.563 2.354 2.344 5 2.344 7.937 0 2.984-.719 5.515-2.156 7.589-1.437 2.073-3.208 3.661-5.302 4.766v.5c2.776 1.156 5.039 2.927 6.797 5.302 1.756 2.375 2.635 5.218 2.635 8.526 0 3.307-.838 6.26-2.516 8.853s-3.995 4.635-6.943 6.122c-2.952 1.49-6.271 2.245-9.953 2.245-4.27.011-8.213-1.224-11.811-3.711zm51.397-41.586-9.281 6.713-4.641-7.042 16.661-12.021h6.382v56.69h-9.121z" />
      <path fill="#ea4335" d="M148.882 200 200 148.882l-25.559-11.382-25.559 11.382-11.382 25.559z" />
      <path fill="#34a853" d="M30.118 174.441 51.118 200h97.764v-51.118H51.118z" />
      <path fill="#4285f4" d="M14.823 0C6.609 0 0 6.609 0 14.823v134.059L25.559 160.265l25.559-11.383V51.118h97.764L160.265 25.559 148.882 0z" />
      <path fill="#188038" d="M0 148.882v36.295C0 193.391 6.609 200 14.823 200h36.295v-51.118z" />
      <path fill="#fbbc04" d="M148.882 51.118v97.764H200V51.118L174.441 39.736z" />
      <path fill="#1967d2" d="M200 51.118V14.823C200 6.609 193.391 0 185.176 0h-36.294v51.118z" />
    </svg>
  )
}

// Logo Apple Calendar (estilo macOS — quadrado branco com listra superior vermelha)
function AppleCalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="2" y="2" width="60" height="60" rx="12" fill="#fff" stroke="#d1d5db" strokeWidth="1" />
      <rect x="2" y="2" width="60" height="14" rx="12" fill="#ff3b30" />
      <rect x="2" y="10" width="60" height="6" fill="#ff3b30" />
      <text x="32" y="11" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700" fontFamily="-apple-system, system-ui, sans-serif">MAIO</text>
      <text x="32" y="50" textAnchor="middle" fill="#1c1c1e" fontSize="28" fontWeight="600" fontFamily="-apple-system, system-ui, sans-serif">02</text>
    </svg>
  )
}

// Logo genérica Android (robô verde)
function AndroidIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#3DDC84" d="M17.523 15.34a1 1 0 1 1 0-2 1 1 0 0 1 0 2m-11.046 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2m11.4-6.05 1.998-3.46a.42.42 0 0 0-.154-.567.42.42 0 0 0-.567.154L17.13 8.92a13.13 13.13 0 0 0-10.26 0L4.846 5.42a.42.42 0 0 0-.567-.154.42.42 0 0 0-.154.567l1.998 3.46C2.69 11.054.917 14.103.5 17.65h23c-.417-3.547-2.19-6.595-5.623-8.36" />
    </svg>
  )
}

const fontDisplay = { fontFamily: 'var(--font-bebas), sans-serif' }
const fontBody = { fontFamily: 'var(--font-dm-sans-wfl), sans-serif' }

const EVENT = {
  title: 'Wings das Atléticas 2026 — Atléticas Day — Wings For Life',
  description:
    'Atléticas Day — Wings For Life. Encontro das atléticas da UnB e CEUB na Pista de Atletismo do Centro Olímpico CO UnB. Programação completa em https://sommaclub.com.br/wings-das-atleticas-2026',
  location: 'Pista de Atletismo — Centro Olímpico CO UnB, Brasília, DF',
  // 02/05/2026 — concentração 08h, encerramento ~12h (BRT = UTC-3)
  startUtc: '20260502T110000Z', // 08:00 BRT
  endUtc: '20260502T150000Z', // 12:00 BRT
  startLocal: new Date('2026-05-02T08:00:00-03:00'),
  endLocal: new Date('2026-05-02T12:00:00-03:00'),
}

function googleCalendarUrl() {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: EVENT.title,
    dates: `${EVENT.startUtc}/${EVENT.endUtc}`,
    details: EVENT.description,
    location: EVENT.location,
  })
  return `https://www.google.com/calendar/render?${params.toString()}`
}

function buildIcs() {
  const dtStamp =
    new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const escape = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Somma Club//Wings das Atleticas 2026//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:wings-das-atleticas-2026@sommaclub.com.br`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${EVENT.startUtc}`,
    `DTEND:${EVENT.endUtc}`,
    `SUMMARY:${escape(EVENT.title)}`,
    `DESCRIPTION:${escape(EVENT.description)}`,
    `LOCATION:${escape(EVENT.location)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function downloadIcs() {
  const ics = buildIcs()
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'wings-das-atleticas-2026.ics'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function WingsAddToCalendar() {
  const [open, setOpen] = useState(false)

  return (
    <section className="bg-wfl-card py-10 sm:py-16 px-4 sm:px-8" style={fontBody}>
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-[10px] sm:text-sm font-semibold tracking-[0.3em] uppercase text-wfl-red">
          Não esqueça
        </p>
        <h2
          className="mt-2 text-3xl sm:text-5xl uppercase leading-none text-wfl-navy"
          style={fontDisplay}
        >
          Adicione na sua agenda
        </h2>
        <p className="mt-2 sm:mt-3 text-sm sm:text-base text-wfl-dark/70 max-w-md mx-auto">
          Salve a data — 02 de maio de 2026, das 08h às 12h. Disponível para Google
          Calendar, Apple Calendar e Outlook.
        </p>

        <div className="relative mt-6 sm:mt-8 inline-block w-full sm:w-auto max-w-sm">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 bg-wfl-navy hover:bg-wfl-navy/90 text-white px-5 py-3.5 sm:px-6 sm:py-4 text-xs sm:text-sm font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-colors"
          >
            <CalendarPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            Adicionar à agenda
            <ChevronDown
              className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>

          {open && (
            <div
              role="menu"
              className="absolute z-10 left-1/2 -translate-x-1/2 mt-2 w-[min(18rem,calc(100vw-2rem))] bg-white border border-wfl-border shadow-xl text-left"
            >
              <a
                role="menuitem"
                href={googleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-wfl-card transition-colors"
              >
                <GoogleCalendarIcon className="w-9 h-9 flex-shrink-0" />
                <span className="text-sm">
                  <span className="block font-semibold text-wfl-navy">Google Calendar</span>
                  <span className="block text-xs text-wfl-dark/60">Abre em nova aba</span>
                </span>
              </a>

              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  downloadIcs()
                  setOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-wfl-card transition-colors text-left border-t border-wfl-border"
              >
                <AppleCalendarIcon className="w-9 h-9 flex-shrink-0" />
                <span className="text-sm">
                  <span className="block font-semibold text-wfl-navy">Apple Calendar</span>
                  <span className="block text-xs text-wfl-dark/60">Baixa arquivo .ics</span>
                </span>
              </button>

              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  downloadIcs()
                  setOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-wfl-card transition-colors text-left border-t border-wfl-border"
              >
                <span
                  aria-hidden="true"
                  className="w-9 h-9 bg-[#3DDC84] flex items-center justify-center flex-shrink-0 rounded"
                >
                  <AndroidIcon className="w-6 h-6" />
                </span>
                <span className="text-sm">
                  <span className="block font-semibold text-wfl-navy">Outros (Android, Outlook)</span>
                  <span className="block text-xs text-wfl-dark/60">Baixa arquivo .ics</span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
