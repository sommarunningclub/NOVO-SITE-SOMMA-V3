// Espelho de somma-site-assessoria-esportiva/lib/asaas/client.ts (translateStatus + sets).
export type AsaasPaymentStatus =
  | "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE"
  | "REFUNDED" | "RECEIVED_IN_CASH" | "REFUND_REQUESTED"
  | "REFUND_IN_PROGRESS" | "CHARGEBACK_REQUESTED" | "CHARGEBACK_DISPUTE"
  | "AWAITING_CHARGEBACK_REVERSAL" | "DUNNING_REQUESTED" | "DUNNING_RECEIVED"
  | "AWAITING_RISK_ANALYSIS";

// Eventos de cobrança do Asaas (origem: app/api/webhook/asaas/route.ts).
export const PAYMENT_EVENTS = new Set([
  "PAYMENT_CREATED",
  "PAYMENT_UPDATED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "PAYMENT_REFUND_IN_PROGRESS",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_AWAITING_RISK_ANALYSIS",
  "PAYMENT_APPROVED_BY_RISK_ANALYSIS",
  "PAYMENT_REPROVED_BY_RISK_ANALYSIS",
  "PAYMENT_DUNNING_REQUESTED",
  "PAYMENT_DUNNING_RECEIVED",
]);

export const RECEBIDAS = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

export function translateStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Aguardando pagamento",
    RECEIVED: "Recebida",
    CONFIRMED: "Confirmada",
    OVERDUE: "Vencida",
    REFUNDED: "Estornada",
    RECEIVED_IN_CASH: "Recebida em dinheiro",
    REFUND_REQUESTED: "Estorno solicitado",
    REFUND_IN_PROGRESS: "Estorno em andamento",
    CHARGEBACK_REQUESTED: "Chargeback solicitado",
    DUNNING_REQUESTED: "Em negativação",
    DUNNING_RECEIVED: "Negativação recebida",
    AWAITING_RISK_ANALYSIS: "Aguardando análise de risco",
  };
  return map[status] ?? status;
}
