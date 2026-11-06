/**
 * Mesmo caminho da LP (dataLayer do GTM), com o prefixo pedido para esta
 * experiência. Nunca sobe dado pessoal: o filtro descarta chaves suspeitas e
 * as telas só passam comportamento (filtro usado, tamanho do grupo).
 */
export type EventoCorre =
  | "access_started"
  | "access_verified"
  | "profile_created"
  | "profile_updated"
  | "directory_viewed"
  | "filter_used"
  | "invitation_sent"
  | "invitation_accepted"
  | "group_joined"
  | "group_completed"
  | "group_shared"
  | "profile_shared"
  | "whatsapp_clicked";

type Props = Record<string, string | number | boolean | null>;
const PROIBIDOS = ["cpf", "email", "e-mail", "telefone", "whatsapp", "nome", "token", "instagram", "codigo"];

export function rastrearCorre(nome: EventoCorre, props: Props = {}) {
  if (typeof window === "undefined") return;
  const limpo: Props = {};
  for (const [chave, valor] of Object.entries(props)) {
    if (PROIBIDOS.some((p) => chave.toLowerCase().includes(p))) continue;
    limpo[chave] = valor;
  }
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ event: `dexcomplica_${nome}`, ...limpo });
}
