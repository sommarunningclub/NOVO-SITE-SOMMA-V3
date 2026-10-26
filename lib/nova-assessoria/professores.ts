import { BIOS, type Bio } from "./bios";

/**
 * Professores BORA no SOMMA Club.
 *
 * Desde 26/10/2026 a BORA é a assessoria oficial do SOMMA Club e o site não
 * vende mais planos: quem tem interesse deixa nome e WhatsApp e cai na
 * conversa de um destes professores. Em /assessoria o professor sai de um
 * rodízio; no link de cada um (sommaclub.com.br/<slug>), é sempre ele.
 *
 * A ordem do rodízio vale no banco (`nova_assessoria_rodizio.ordem`), não
 * aqui: é lá que a fila anda. A ordem desta lista é só a de exibição, e foi
 * escolhida igual à da fila.
 */
export interface ProfessorBora {
  /** Chave no banco e no link (sommaclub.com.br/<slug>). */
  slug: string;
  /** Nome exato em `professores_curriculo_assessoria`, e a chave das bios. */
  nome: string;
  /** Como aparece no título da página e nos botões. */
  primeiroNome: string;
  apelido?: string;
  /** Só dígitos, com DDI, pronto para o wa.me. */
  whatsapp: string;
  instagram: string;
  foto: string;
  bio: Bio | null;
}

function professor(dados: Omit<ProfessorBora, "bio">): ProfessorBora {
  return { ...dados, bio: BIOS[dados.nome] ?? null };
}

export const PROFESSORES_BORA: ProfessorBora[] = [
  professor({
    slug: "joseph",
    nome: "Joseph Pereira",
    primeiroNome: "Joseph",
    apelido: "JôJô",
    whatsapp: "556181927935",
    instagram: "https://www.instagram.com/joseph.pcunha/",
    foto: "/bora/professores/jojo.jpg",
  }),
  professor({
    slug: "alexandre",
    nome: "Alexandre Alves",
    primeiroNome: "Alexandre",
    whatsapp: "556191780334",
    instagram: "https://www.instagram.com/alexandrealvesz5/",
    foto: "/bora/professores/alexandre-alves.jpg",
  }),
  professor({
    slug: "mateus",
    nome: "Mateus Fonseca",
    primeiroNome: "Mateus",
    whatsapp: "556185988482",
    instagram: "https://www.instagram.com/matfonsecaa/",
    foto: "/bora/professores/mateus.jpg",
  }),
  professor({
    slug: "gabriel-brito",
    nome: "Gabriel Brito",
    primeiroNome: "Gabriel",
    whatsapp: "556184186316",
    instagram: "https://www.instagram.com/gabrielnrun/",
    foto: "/bora/professores/gabriel-brito.jpg",
  }),
];

export function professorPorSlug(slug: string | null | undefined): ProfessorBora | null {
  return PROFESSORES_BORA.find((p) => p.slug === slug) ?? null;
}

/** Páginas que registram visita e contato: a de /assessoria e uma por professor. */
export type PaginaBora = "assessoria" | `bio-${string}`;

export function paginaValida(pagina: unknown): pagina is PaginaBora {
  if (pagina === "assessoria") return true;
  if (typeof pagina !== "string" || !pagina.startsWith("bio-")) return false;
  return professorPorSlug(pagina.slice(4)) !== null;
}

/** Link do WhatsApp com a mensagem já escrita, para a pessoa só apertar enviar. */
export function linkDoWhatsapp(professor: ProfessorBora, nome: string): string {
  const primeiro = nome.trim().split(/\s+/)[0] || nome.trim();
  const texto =
    `Olá, ${professor.primeiroNome}! Aqui é ${primeiro}. ` +
    `Vim pelo site do SOMMA Club e tenho interesse na BORA Assessoria.`;
  return `https://wa.me/${professor.whatsapp}?text=${encodeURIComponent(texto)}`;
}
