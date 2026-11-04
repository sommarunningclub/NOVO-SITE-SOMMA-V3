/**
 * Contatos verificados no próprio projeto:
 * WhatsApp e Instagram em lib/somma-data.ts; e-mail comercial em
 * app/proposta-comercial-somma-club-2026/_data/config.ts.
 */
export const CONTATO = {
  whatsapp: "5561995372477",
  whatsappExibicao: "(61) 99537-2477",
  email: "comercial@sommaclub.com.br",
  instagram: "@somma.club",
  instagramUrl: "https://instagram.com/somma.club",
  site: "sommaclub.com.br",
  encontro: "Todo sábado, 7h · Parque da Cidade, Estacionamento 10 · Brasília",
};

export function linkWhatsapp(): string {
  const msg = "Olá! Vi a apresentação institucional da SOMMA Club e quero conversar sobre uma parceria.";
  return `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(msg)}`;
}

export function linkEmail(): string {
  return `mailto:${CONTATO.email}?subject=${encodeURIComponent("Parceria com a SOMMA Club")}`;
}
