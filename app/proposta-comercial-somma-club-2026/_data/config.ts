/**
 * Painel de configuração da apresentação comercial.
 * O time comercial altera aqui contatos, links e textos sem tocar nos componentes.
 */

export const CONFIG = {
  /** Contatos comerciais. */
  whatsapp: "5561995372477",
  email: "comercial@sommaclub.com.br",
  site: "sommaclub.com.br",
  instagram: "@somma.club",

  /** URL pública desta apresentação (para o botão "copiar link"). */
  url: "https://sommaclub.com.br/proposta-comercial-somma-club-2026",

  /** Período de referência dos dados digitais. */
  periodoDados: "28 de junho a 27 de julho de 2026",

  /** Marca. */
  logo: "/logo-somma.svg",
  primary: "#FF2C03",

  /** Observações comerciais globais (regras). */
  regras: [
    "Todos os valores são apresentados como “a partir de”.",
    "O orçamento final depende do escopo, duração, volume de entregas, produção, estrutura, equipe, exclusividade e complexidade.",
    "Custos de montagem, mobiliário, tendas, brindes, produtos, profissionais, equipamentos, licenças e operação especial não estão incluídos automaticamente.",
    "As entregas precisam estar descritas na proposta e no contrato.",
    "Não existe garantia de vendas ou conversão.",
  ],
} as const;

/** Mensagem base para os CTAs de contato via WhatsApp. */
export function whatsappLink(texto?: string): string {
  const base = `https://wa.me/${CONFIG.whatsapp}`;
  const msg =
    texto ??
    "Olá! Vi a apresentação comercial do Somma Club e quero conversar sobre uma parceria.";
  return `${base}?text=${encodeURIComponent(msg)}`;
}

export function emailLink(assunto = "Parceria comercial — Somma Club"): string {
  return `mailto:${CONFIG.email}?subject=${encodeURIComponent(assunto)}`;
}

/** Formata um número em reais no padrão brasileiro, sem centavos. */
export function brl(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
