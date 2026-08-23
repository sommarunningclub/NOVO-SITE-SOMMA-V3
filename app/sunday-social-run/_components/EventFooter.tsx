import Link from "next/link";
import { SOMMA } from "@/lib/somma-data";
import { COPY, EVENT, EVENT_CAPACITY, TICKET_PRICE } from "@/lib/sunday-social-run/event.config";
import { Assinatura, LogoStrava } from "./Logos";

/**
 * Rodapé do evento — HTML puro, sem client component.
 * Fecha a experiência devolvendo a pessoa para os canais reais do SOMMA.
 */
export function EventFooter() {
  // Página estática: o ano é fixado no build, e o build acontece a cada deploy.
  const ano = new Date().getFullYear();

  return (
    <footer className="ris-dark relative border-t border-[color:var(--line)] py-12 md:py-16">
      <div className="ris-wrap">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="ris-display text-[clamp(1.6rem,5vw,2.6rem)] leading-none">{EVENT.nome}</div>
            <p className="ris-lead mt-2 text-[1.3rem]">{COPY.final.fecho}</p>
            <Assinatura tom="mono" tamanho="sm" className="mt-5" />
            <p className="mt-4 max-w-[34ch] text-[0.88rem] leading-relaxed opacity-60">
              {EVENT_CAPACITY} vagas, R$ {TICKET_PRICE}, domingo pela manhã em {EVENT.cidade}.
            </p>
          </div>

          <div className="md:col-span-3">
            <div className="ris-label opacity-45">Experiência</div>
            <ul className="mt-4 space-y-2.5 text-[0.9rem]">
              <li><a href="#cem" className="inline-flex min-h-[40px] items-center opacity-75 transition-opacity hover:opacity-100">100 vagas</a></li>
              <li><a href="#hype" className="inline-flex min-h-[40px] items-center opacity-75 transition-opacity hover:opacity-100">Hype On Club</a></li>
              <li><a href="#domingo" className="inline-flex min-h-[40px] items-center opacity-75 transition-opacity hover:opacity-100">Programação</a></li>
              <li><a href="#after-pace" className="inline-flex min-h-[40px] items-center opacity-75 transition-opacity hover:opacity-100">O after</a></li>
              <li><a href="#spot" className="inline-flex min-h-[40px] items-center opacity-75 transition-opacity hover:opacity-100">Vagas</a></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="ris-label opacity-45">SOMMA Club</div>
            <ul className="mt-4 space-y-2.5 text-[0.9rem]">
              <li>
                <a href={SOMMA.links.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center opacity-75 transition-opacity hover:opacity-100">
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={SOMMA.links.strava}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center gap-2 opacity-75 transition-opacity hover:opacity-100"
                >
                  <LogoStrava cor="currentColor" className="h-[14px] w-auto" />
                  Strava
                </a>
              </li>
              <li>
                <Link href="/" className="inline-flex min-h-[40px] items-center opacity-75 transition-opacity hover:opacity-100">
                  sommaclub.com.br
                </Link>
              </li>
              <li>
                <Link href="/seja-parceiro" className="inline-flex min-h-[40px] items-center opacity-75 transition-opacity hover:opacity-100">
                  Seja parceiro
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[color:var(--line)] pt-6 md:flex-row md:items-center md:justify-between">
          <p className="ris-label opacity-40">
            © {ano} SOMMA Club · Venda de ingressos exclusivamente pela Hype On Club
          </p>
          <Link href="/politica-de-privacidade" className="ris-label opacity-40 hover:opacity-70">
            Política de privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
