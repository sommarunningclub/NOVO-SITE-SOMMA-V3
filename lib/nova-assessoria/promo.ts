/**
 * Venda da BORA nos links de professor (sommaclub.com.br/<slug>).
 *
 * Desde 04/11/2026 a assinatura é feita no checkout da BORA na Runy, não mais
 * no Asaas do SOMMA. A página mostra os planos e, enquanto a promo do mês
 * vale, o cupom do professor para a pessoa usar lá.
 *
 * Promo nova = trocar `PROMO` (nome, validade, preços) e os cupons. Depois de
 * `validaAte` a página mostra os planos com o preço cheio e sem cupom, sozinha
 * (o layout dos links revalida de hora em hora).
 */

export const CHECKOUT_BORA_URL = "https://www.runyapp.com/checkout/bora-assessoria/QWWHTEAK";

export interface PlanoBora {
  nome: string;
  /** Preço cheio do ciclo. */
  cheio: number;
  /** Preço do ciclo com a promo. */
  promo: number;
  /** 1 no Mensal, que é recorrente. */
  parcelas: number;
}

export const PROMO = {
  nome: "Plano Somma Especial",
  desconto: 20,
  /** Último instante da promo, no horário de Brasília. */
  validaAte: "2026-11-14T23:59:59-03:00",
  validaAteTexto: "14/11/2026",
  planos: [
    { nome: "Anual", cheio: 2820, promo: 2256, parcelas: 12 },
    { nome: "Semestral", cheio: 1500, promo: 1200, parcelas: 6 },
    { nome: "Mensal", cheio: 280, promo: 224, parcelas: 1 },
  ] satisfies PlanoBora[],
};

/** Cupom de cada professor na promo, pelo slug do link. */
const CUPONS: Record<string, string> = {
  alexandre: "ALEXANDRE20",
  joseph: "JOSEPH20",
  mateus: "MATEUS20",
  "gabriel-brito": "GABRIEL20",
};

export function promoValendo(agora = new Date()): boolean {
  return agora.getTime() <= new Date(PROMO.validaAte).getTime();
}

export function cupomDoProfessor(slug: string): string | null {
  return CUPONS[slug] ?? null;
}

export function reais(valor: number): string {
  return `R$ ${valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`;
}
