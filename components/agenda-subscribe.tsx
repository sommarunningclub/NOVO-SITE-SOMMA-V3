"use client";

import { CalendarPlus, Download, ExternalLink } from "lucide-react";

// Agenda Oficial do Somma — reusa a infra do projeto agenda-somma-club
// (feeds ICS em https://agenda.sommaclub.com.br/api/calendar/<slug>.ics).
const AGENDA_BASE = "https://agenda.sommaclub.com.br";
const SLUG = "somma"; // encontros, treinos, corridas e ativações oficiais (grátis)

const icsHttps = `${AGENDA_BASE}/api/calendar/${SLUG}.ics`;
const webcal = `webcal://agenda.sommaclub.com.br/api/calendar/${SLUG}.ics`;
const googleUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`;
const outlookUrl = `https://outlook.office.com/calendar/0/addfromweb?url=${encodeURIComponent(
  icsHttps
)}&name=${encodeURIComponent("Agenda Somma Club")}`;

const OPTIONS = [
  { label: "Google Agenda", href: googleUrl, icon: CalendarPlus },
  { label: "Apple / iPhone", href: webcal, icon: CalendarPlus },
  { label: "Outlook", href: outlookUrl, icon: CalendarPlus },
  { label: "Baixar .ics", href: icsHttps, icon: Download },
];

export function AgendaSubscribe() {
  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <CalendarPlus className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
            Agenda Oficial do Somma
          </h2>
          <p className="mt-0.5 text-xs text-white/50">
            Encontros grátis + principais corridas do DF, direto no seu calendário.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {OPTIONS.map((o) => (
          <a
            key={o.label}
            href={o.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white transition-colors hover:border-primary hover:bg-white/5"
          >
            <o.icon className="h-4 w-4 text-primary" />
            {o.label}
          </a>
        ))}
      </div>

      <a
        href={`${AGENDA_BASE}/agenda`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Ver agenda completa e corridas do DF
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
