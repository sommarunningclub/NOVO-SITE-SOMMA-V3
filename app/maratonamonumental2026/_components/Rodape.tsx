import { PROVA } from "@/lib/evp/config";
import type { EventoPublico } from "@/lib/evp/tipos";
import { Marcas } from "./Navegacao";

export function Rodape({ evento }: { evento: EventoPublico }) {
  const c = evento.contato;
  const whats = c.whatsapp?.replace(/\D/g, "");
  const links = [
    { href: evento.conteudo.link_prova || PROVA.site, rotulo: "Site oficial da prova" },
    { href: PROVA.percursos, rotulo: "Percursos oficiais" },
    { href: evento.conteudo.link_regulamento || PROVA.regulamento, rotulo: "Regulamento oficial (PDF)" },
  ];
  return (
    <footer className="mt-fim border-t border-[color:var(--mt-linha)]">
      <div className="mt-container grid gap-10 py-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Marcas altura={24} />
          <p className="mt-5 max-w-[26rem] text-[0.9rem] leading-relaxed text-[color:var(--mt-cinza)]">
            Meeting Técnico | Maratona Monumental de Brasília 2026. Realização: SOMMA Club e BORA Assessoria.
          </p>
        </div>
        <nav aria-label="Links oficiais da prova" className="lg:col-span-4">
          <p className="mt-rotulo">A prova</p>
          <ul className="mt-3 space-y-1">
            {links.map((l) => (
              <li key={l.rotulo}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-[0.95rem] underline decoration-[color:var(--mt-linha-forte)] underline-offset-4 hover:decoration-white">
                  {l.rotulo}<span className="mt-so-leitor">, abre em nova aba</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="lg:col-span-3">
          <p className="mt-rotulo">Contato</p>
          <ul className="mt-3 space-y-1 text-[0.95rem]">
            {whats && (
              <li><a className="inline-flex min-h-11 items-center underline underline-offset-4" href={`https://wa.me/${whats.startsWith("55") ? whats : `55${whats}`}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            )}
            {c.email && <li><a className="inline-flex min-h-11 items-center underline underline-offset-4" href={`mailto:${c.email}`}>{c.email}</a></li>}
            <li>
              <a className="inline-flex min-h-11 items-center underline underline-offset-4" href={c.instagram || "https://instagram.com/somma.club"} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
            <li><a className="inline-flex min-h-11 items-center underline underline-offset-4" href="/politica-de-privacidade">Política de privacidade</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[color:var(--mt-linha)]">
        <p className="mt-container py-6 text-[0.78rem] leading-relaxed text-[color:var(--mt-cinza-fraco)]">
          Este encontro não é um evento oficial da organização da Maratona Monumental de Brasília. Informações da
          prova nesta página vêm do regulamento e do site oficiais e podem ser alteradas pela organização.
        </p>
      </div>
    </footer>
  );
}
