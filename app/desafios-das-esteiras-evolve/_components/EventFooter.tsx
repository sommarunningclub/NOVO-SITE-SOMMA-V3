import Link from "next/link";
import { EVENT, PARTNERS, SITE_URL, UNITS } from "@/lib/desafio-esteiras/event.config";
import { Logos } from "./Logos";

export function EventFooter() {
  return (
    <footer className="border-t border-[color:var(--line)] bg-[color:var(--ink-2)]">
      <div className="dst-wrap py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logos className="h-6" />
            <p className="dst-display mt-6 text-[clamp(1.4rem,5vw,2.2rem)]">
              {EVENT.nome.toUpperCase()}
            </p>
            <p className="dst-label mt-3 text-[color:rgba(242,240,236,0.45)]">
              {EVENT.dataExtenso} · {EVENT.horaExtenso}
            </p>
          </div>

          <div className="md:col-span-4">
            <p className="dst-label mb-4 text-[color:rgba(242,240,236,0.4)]">Unidades participantes</p>
            <ul>
              {UNITS.map((u) => (
                <li key={u.id}>
                  <a
                    href={u.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-h-[44px] items-baseline gap-3 py-2 text-[0.95rem] text-[color:rgba(242,240,236,0.7)] transition-colors hover:text-[color:var(--somma)]"
                  >
                    <span className="dst-display dst-display-condensed">{u.curto}</span>
                    <span className="dst-label text-[color:rgba(242,240,236,0.35)]">
                      {u.cidade}/{u.uf}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="dst-label mb-4 text-[color:rgba(242,240,236,0.4)]">Realização</p>
            <ul className="text-[0.95rem]">
              <li>
                <a
                  href={PARTNERS.evolve.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] items-center text-[color:rgba(242,240,236,0.7)] transition-colors hover:text-[color:var(--evolve)]"
                >
                  Academia Evolve
                </a>
              </li>
              <li>
                <Link
                  href="/"
                  className="flex min-h-[44px] items-center text-[color:rgba(242,240,236,0.7)] transition-colors hover:text-[color:var(--somma)]"
                >
                  SOMMA Club
                </Link>
              </li>
              <li>
                <a
                  href={PARTNERS.somma.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] items-center text-[color:rgba(242,240,236,0.7)] transition-colors hover:text-[color:var(--somma)]"
                >
                  @sommaclub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[color:var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="dst-label text-[color:rgba(242,240,236,0.35)]">
            © {new Date().getFullYear()} SOMMA Club · Evolve
          </p>
          <Link
            href="/politica-de-privacidade"
            className="dst-label flex min-h-[44px] items-center text-[color:rgba(242,240,236,0.35)] transition-colors hover:text-[color:var(--paper)]"
          >
            Política de privacidade
          </Link>
        </div>

        <p className="sr-only">{SITE_URL}</p>
      </div>
    </footer>
  );
}
