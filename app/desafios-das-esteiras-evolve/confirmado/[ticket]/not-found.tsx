import Link from "next/link";
import { EVENT_PATH } from "@/lib/desafio-esteiras/event.config";

export default function TicketNaoEncontrado() {
  return (
    <main className="dst-wrap flex min-h-[100svh] flex-col items-center justify-center py-16 text-center">
      <p className="dst-label mb-6 text-[color:var(--evolve)]">Ticket não encontrado</p>
      <h1 className="dst-display text-[clamp(2.2rem,10vw,5rem)]">
        ESTE LINK
        <br />
        NÃO EXISTE.
      </h1>
      <p className="mt-6 max-w-[46ch] text-[color:rgba(242,240,236,0.65)]">
        O link do ticket pode ter sido digitado errado ou a inscrição foi cancelada. Se você já se
        inscreveu e perdeu o link, fale com a organização.
      </p>
      <Link href={EVENT_PATH} className="dst-btn mt-9">
        Voltar para o evento
      </Link>
    </main>
  );
}
