import Image from "next/image";
import Link from "next/link";
import { EVENT_PATH, LINKS, SITE_URL } from "@/lib/o-longao/config";
import { HERO } from "@/lib/o-longao/copy";
import { StarTracLogo } from "./StarTracLogo";

/**
 * Rodapé do evento. Server Component sem motion: aqui a página já terminou
 * de falar, sobram os créditos e os caminhos de saída.
 */
export function EventFooter() {
  return (
    <footer className="relative bg-[color:var(--noite)]">
      <div className="lgo-hairline" aria-hidden />

      <div className="lgo-wrap py-14 md:py-20">
        <div className="max-w-[520px]">
          <p className="lgo-display text-[clamp(2rem,7vw,3.2rem)]">{HERO.titulo[0]}</p>
          <p className="lgo-mono mt-4 text-[0.9rem] text-[color:rgba(242,240,236,0.55)]">
            {HERO.mote}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 md:mt-16 md:grid-cols-4 md:gap-x-8">
          <div>
            <p className="lgo-label mb-5 text-[color:rgba(242,240,236,0.4)]">Realização</p>
            {/* Ordem oficial da realização: Evolve primeiro, Somma Club depois. */}
            <ul className="space-y-1">
              <li className="flex min-h-[44px] items-center opacity-80">
                <Image src="/evolve-logo.svg" alt="Evolve" width={104} height={27} />
              </li>
              <li>
                <a
                  href={SITE_URL}
                  className="flex min-h-[44px] items-center opacity-80 transition-opacity hover:opacity-100"
                >
                  <Image src="/logo-somma.svg" alt="SOMMA Club" width={112} height={30} />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="lgo-label mb-5 text-[color:rgba(242,240,236,0.4)]">Powered by</p>
            <p className="flex min-h-[44px] items-center">
              <StarTracLogo altura={22} />
            </p>
          </div>

          <div>
            <p className="lgo-label mb-5 text-[color:rgba(242,240,236,0.4)]">Navegue</p>
            <ul>
              <li>
                <Link href={LINKS.regulamento} className={LINK_CLS}>
                  Regulamento
                </Link>
              </li>
              <li>
                <Link href={LINKS.inscricao} className={LINK_CLS}>
                  Inscrição
                </Link>
              </li>
              <li>
                {/* Âncora com o path do evento: o rodapé também vive nas
                    rotas internas (/inscricao, /regulamento). */}
                <Link href={`${EVENT_PATH}#faq`} className={LINK_CLS}>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="lgo-label mb-5 text-[color:rgba(242,240,236,0.4)]">Contato</p>
            <ul>
              <li>
                <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer" className={LINK_CLS}>
                  Instagram
                </a>
              </li>
              <li>
                <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className={LINK_CLS}>
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${LINKS.email}`} className={`${LINK_CLS} break-all`}>
                  {LINKS.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-[color:var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Ano fixo de propósito: é a edição do evento, não a data do build. */}
          <p className="lgo-label text-[color:rgba(242,240,236,0.35)]">© 2026 SOMMA Club</p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <Link
              href="/politica-de-privacidade"
              className="lgo-label flex min-h-[44px] items-center text-[color:rgba(242,240,236,0.35)] transition-colors hover:text-[color:var(--papel)]"
            >
              Política de privacidade
            </Link>
            <Link
              href={LINKS.regulamento}
              className="lgo-label flex min-h-[44px] items-center text-[color:rgba(242,240,236,0.35)] transition-colors hover:text-[color:var(--papel)]"
            >
              Termos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

const LINK_CLS =
  "flex min-h-[44px] items-center text-[0.95rem] text-[color:rgba(242,240,236,0.7)] transition-colors hover:text-[color:var(--somma)]";
