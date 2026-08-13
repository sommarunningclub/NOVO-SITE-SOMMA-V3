import { EVENT, getUnit } from "@/lib/desafio-esteiras/event.config";
import type { PublicTicket } from "@/lib/desafio-esteiras/db";
import { Logos } from "./Logos";

/**
 * A credencial.
 *
 * Linguagem de boarding pass / race bib: cabeçalho da parceria, corpo com os
 * dados do participante, picote com entalhes laterais e o canhoto com o QR.
 * Nada de aparência de cupom — o número do ticket é tratado como identidade.
 */
export function TicketCard({ ticket, qrSvg }: { ticket: PublicTicket; qrSvg: string }) {
  const unit = getUnit(ticket.unit_id);
  const usado = ticket.status === "checked_in";

  return (
    <article
      className="relative mx-auto w-full max-w-[440px] overflow-hidden bg-[color:var(--paper)] text-[color:var(--ink)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
      aria-label={`Ticket ${ticket.ticket_code}`}
    >
      {/* Cabeçalho */}
      <header
        className="relative flex items-center justify-between gap-4 px-6 py-4"
        style={{ background: "var(--ink)" }}
      >
        <Logos className="h-4" />
        <span className="dst-label text-[0.5rem] text-[color:rgba(242,240,236,0.5)]">
          CREDENCIAL
        </span>
      </header>

      <div className="h-[3px] w-full" style={{ background: "var(--energia)" }} />

      {/* Corpo */}
      <div className="px-6 pb-7 pt-6">
        <p className="dst-label text-[color:var(--evolve)]">{EVENT.realizacao}</p>
        <h2 className="dst-display mt-2.5 text-[clamp(1.7rem,7vw,2.4rem)] leading-[0.85]">
          DESAFIO
          <br />
          DAS ESTEIRAS
        </h2>

        <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-[color:rgba(8,8,10,0.14)] py-4">
          <div>
            <dt className="dst-label text-[0.5rem] opacity-50">Data</dt>
            <dd className="dst-num mt-1.5 text-[0.95rem] font-bold">{EVENT.dataCurta}</dd>
          </div>
          <div>
            <dt className="dst-label text-[0.5rem] opacity-50">Início</dt>
            <dd className="dst-num mt-1.5 text-[0.95rem] font-bold">{EVENT.horaLabel}</dd>
          </div>
          <div>
            <dt className="dst-label text-[0.5rem] opacity-50">Status</dt>
            <dd
              className="dst-label mt-2 text-[0.55rem]"
              style={{ color: usado ? "rgba(8,8,10,0.5)" : "var(--somma)" }}
            >
              {usado ? "UTILIZADO" : "CONFIRMADO"}
            </dd>
          </div>
        </dl>

        <div className="mt-5">
          <p className="dst-label text-[0.5rem] opacity-50">Unidade</p>
          <p className="dst-display mt-1.5 text-[1.15rem]">{unit?.nome ?? ticket.unit_id}</p>
          {unit && (
            <p className="mt-1.5 text-[0.78rem] leading-relaxed opacity-65">{unit.endereco}</p>
          )}
        </div>

        <div className="mt-5">
          <p className="dst-label text-[0.5rem] opacity-50">Participante</p>
          <p className="dst-display mt-1.5 break-words text-[1.15rem] uppercase">
            {ticket.full_name}
          </p>
        </div>
      </div>

      {/* Picote */}
      <div className="relative">
        <span className="dst-notch -left-[13px]" style={{ background: "var(--ink)" }} />
        <span className="dst-notch -right-[13px]" style={{ background: "var(--ink)" }} />
        <div
          aria-hidden
          className="mx-5 h-px"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(8,8,10,0.35) 0 6px, transparent 6px 12px)",
          }}
        />
      </div>

      {/* Canhoto com o QR */}
      <div className="flex items-center gap-5 px-6 pb-7 pt-6">
        <div
          className="relative h-[124px] w-[124px] shrink-0 bg-[color:var(--paper)] p-1"
          style={{ outline: "1px solid rgba(8,8,10,0.16)" }}
        >
          <div
            className="h-full w-full"
            aria-hidden
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          {usado && (
            <span
              className="dst-label absolute inset-0 grid place-items-center bg-[rgba(242,240,236,0.88)] text-[0.55rem]"
              style={{ color: "var(--evolve)" }}
            >
              UTILIZADO
            </span>
          )}
        </div>

        <div className="min-w-0">
          <p className="dst-label text-[0.5rem] opacity-50">Ticket</p>
          <p className="dst-num mt-1.5 break-all text-[1.15rem] font-bold leading-tight">
            {ticket.ticket_code}
          </p>
          <p className="mt-3 text-[0.72rem] leading-relaxed opacity-60">
            Apresente este QR Code na recepção da sua unidade para validar a entrada.
          </p>
        </div>
      </div>

      {/* Faixa inferior */}
      <div
        className="dst-label flex items-center justify-between px-6 py-3 text-[0.5rem]"
        style={{ background: "var(--ink)", color: "rgba(242,240,236,0.55)" }}
      >
        <span>4 UNIDADES · 1 DESAFIO</span>
        <span className="dst-num">{EVENT.dataLabel}</span>
      </div>
    </article>
  );
}
