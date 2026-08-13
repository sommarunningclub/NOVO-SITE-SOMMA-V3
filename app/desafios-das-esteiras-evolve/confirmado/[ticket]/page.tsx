import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTicketByToken } from "@/lib/desafio-esteiras/db";
import { ticketQrSvg } from "@/lib/desafio-esteiras/qr";
import { EVENT, EVENT_PATH, getUnit } from "@/lib/desafio-esteiras/event.config";
import { TicketCard } from "../../_components/TicketCard";
import { Logos } from "../../_components/Logos";
import { Confirmacao } from "./Confirmacao";
import { TicketActions } from "./TicketActions";

/** A URL do ticket é privada: nunca deve ser indexada nem pré-renderizada. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seu ticket | Desafio das Esteiras",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ConfirmadoPage({
  params,
}: {
  params: Promise<{ ticket: string }>;
}) {
  const { ticket: token } = await params;
  const ticket = await getTicketByToken(token);

  if (!ticket) notFound();

  const unit = getUnit(ticket.unit_id);
  const qrSvg = await ticketQrSvg(ticket.ticket_token);
  const jaValidado = ticket.status === "checked_in";

  return (
    <main className="dst-grain relative min-h-[100svh] overflow-hidden py-8 md:py-14">
      <div
        className="dst-glow left-1/2 top-0 h-[50vh] w-[70vw] -translate-x-1/2 -translate-y-1/3"
        style={{ background: "var(--somma)", opacity: 0.22 }}
      />

      <div className="dst-wrap relative">
        <div className="flex items-center justify-between gap-4 border-b border-[color:var(--line)] pb-5">
          <Link href={EVENT_PATH} aria-label="Desafio das Esteiras">
            <Logos className="h-5" />
          </Link>
          <span className="dst-label text-[color:rgba(242,240,236,0.45)]">
            {EVENT.dataLabel} · {EVENT.horaLabel}
          </span>
        </div>

        <div className="mt-10 grid gap-12 md:mt-14 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-6 lg:col-span-5">
            <Confirmacao
              titulo={`Sua inscrição no Desafio das Esteiras está confirmada na ${
                unit?.nome ?? "sua unidade"
              }, dia ${EVENT.dataExtenso}, às ${EVENT.horaExtenso}.`}
            >
              <TicketCard ticket={ticket} qrSvg={qrSvg} />
            </Confirmacao>
          </div>

          <div className="md:col-span-6 md:pt-4 lg:col-span-6 lg:col-start-7">
            {/* Estado do ticket */}
            <div
              className="dst-panel flex items-center gap-4 p-5"
              style={{ borderColor: jaValidado ? "var(--line)" : "rgba(255,44,4,0.5)" }}
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
                style={{ background: jaValidado ? "rgba(242,240,236,0.12)" : "var(--somma)" }}
                aria-hidden
              >
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <path
                    d="M1.5 7.2 6.2 12 16.5 1.5"
                    stroke={jaValidado ? "rgba(242,240,236,0.6)" : "#08080a"}
                    strokeWidth="2.6"
                    strokeLinecap="square"
                  />
                </svg>
              </span>
              <div>
                <p className="dst-label" style={{ color: jaValidado ? "rgba(242,240,236,0.6)" : "var(--somma)" }}>
                  {jaValidado ? "CHECK-IN REALIZADO" : "TICKET CONFIRMADO"}
                </p>
                <p className="mt-1.5 text-[0.88rem] text-[color:rgba(242,240,236,0.6)]">
                  {jaValidado && ticket.checked_in_at
                    ? `Validado em ${new Date(ticket.checked_in_at).toLocaleString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Apresente este ticket no dia do evento para validar sua entrada."}
                </p>
              </div>
            </div>

            <TicketActions
              token={ticket.ticket_token}
              unitId={ticket.unit_id}
              ticketCode={ticket.ticket_code}
            />

            {/* Detalhes */}
            <dl className="mt-10 divide-y divide-[color:var(--line)] border-t border-[color:var(--line)]">
              {[
                { k: "Participante", v: ticket.full_name },
                { k: "Unidade", v: unit?.nome ?? ticket.unit_id },
                { k: "Endereço", v: unit?.endereco ?? "Não informado" },
                { k: "Data", v: EVENT.dataExtenso },
                { k: "Horário", v: EVENT.horaExtenso },
                { k: "Código do ticket", v: ticket.ticket_code },
              ].map((linha) => (
                <div key={linha.k} className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-6">
                  <dt className="dst-label w-36 shrink-0 pt-0.5 text-[color:rgba(242,240,236,0.4)]">
                    {linha.k}
                  </dt>
                  <dd className="text-[0.98rem] leading-relaxed">{linha.v}</dd>
                </div>
              ))}
            </dl>

            <div className="dst-panel mt-8 p-5">
              <p className="dst-label mb-2.5 text-[color:var(--somma)]">Guarde este link</p>
              <p className="text-[0.88rem] leading-relaxed text-[color:rgba(242,240,236,0.65)]">
                Esta página é o seu ticket. Salve o link nos favoritos ou tire um print. Você acessa
                de novo a qualquer momento até o dia do evento.
              </p>
            </div>

            <Link href={EVENT_PATH} className="dst-label mt-8 inline-block underline underline-offset-4">
              ← Voltar para o evento
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
