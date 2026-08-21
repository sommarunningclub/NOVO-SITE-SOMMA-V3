/**
 * Mantido como porta de entrada histórica do Desafio das Esteiras.
 *
 * A implementação virou compartilhada em `lib/rate-limit.ts`, que usa
 * Upstash/Redis quando configurado e cai para memória quando não. A assinatura
 * mudou de síncrona para `Promise` — quem importa daqui precisa de `await`.
 */
export { rateLimit, clientIp, type RateLimitResult } from "@/lib/rate-limit";
