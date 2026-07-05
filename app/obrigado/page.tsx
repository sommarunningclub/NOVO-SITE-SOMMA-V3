"use client";

import Link from "next/link";
import { MessageCircle, PartyPopper } from "lucide-react";
import { AgendaSubscribe } from "@/components/agenda-subscribe";

// Mesma lógica do site atual: distribui aleatoriamente entre os grupos de WhatsApp.
const WHATSAPP_GROUPS = [
  "https://chat.whatsapp.com/HqEzvY8SbSvImtGaw3UkEk?mode=gi_t",
  "https://chat.whatsapp.com/B5MSnH8DoasDVfgMlbuAng?mode=gi_t",
];

export default function ObrigadoPage() {
  const entrarNoGrupo = () => {
    const link = WHATSAPP_GROUPS[Math.floor(Math.random() * WHATSAPP_GROUPS.length)];
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink p-6 text-white">
      <div className="w-full max-w-md text-center">
        {/* Ícone */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-2xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary">
              <PartyPopper className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Inscrição confirmada</p>
        <h1 className="mt-3 text-4xl font-bold">Bem-vindo ao Somma!</h1>
        <p className="mt-3 leading-relaxed text-white/60">
          Você agora faz parte da comunidade. Entre no grupo do WhatsApp para receber os avisos dos
          encontros, dicas e viver o Somma de perto.
        </p>

        {/* Próximos passos */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/80">Próximos passos</h2>
          <ul className="space-y-3 text-sm">
            {["Entre no grupo do WhatsApp", "Apresente-se à comunidade", "Apareça no próximo encontro de sábado, 7h"].map(
              (t, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-white/80">{t}</span>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Agenda Oficial do Somma (assinatura de calendário) */}
        <AgendaSubscribe />

        {/* WhatsApp (grupo aleatório) */}
        <button
          type="button"
          onClick={entrarNoGrupo}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-5 w-5" />
          Entrar no grupo do WhatsApp
        </button>

        <Link
          href="/"
          className="mt-3 block w-full rounded-full border border-white/20 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
        >
          Voltar ao site
        </Link>

        <p className="mt-8 text-xs text-white/40">Qualquer dúvida, fale com a gente no WhatsApp da comunidade.</p>
      </div>
    </main>
  );
}
