import "server-only";

/**
 * Rate limit em memória, por instância da função.
 *
 * Suficiente para o volume desta LP: freia rajada de bot e formulário
 * repetido, e o custo real de duplicidade já é protegido pelo índice UNIQUE
 * do CPF no banco. Se um dia o tráfego justificar, trocar por Upstash/Redis
 * sem mudar a assinatura desta função.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // limpeza preguiçosa: só quando o mapa cresce demais
  if (buckets.size > MAX_KEYS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  current.count += 1;
  if (current.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  return { ok: true, remaining: limit - current.count, retryAfterSeconds: 0 };
}

/** IP do cliente atrás do proxy da Vercel. */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "desconhecido";
}
