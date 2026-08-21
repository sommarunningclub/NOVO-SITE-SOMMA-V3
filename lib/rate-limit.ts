import "server-only";

/**
 * Rate limit compartilhado do site.
 *
 * Duas implementações atrás da mesma assinatura:
 *
 * - **Upstash/Redis** quando `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`
 *   existem. É o único modo que vale para valer em serverless: o contador é
 *   global, então não adianta o atacante cair em outra instância da função.
 * - **Memória**, senão. Segura rajada de bot e formulário repetido dentro de uma
 *   instância, mas a Vercel roda várias — trate como amortecedor, não como
 *   barreira. O aviso sai uma vez por processo para não sumir no ruído do log.
 *
 * A janela é fixa (não deslizante): simples, previsível e suficiente para o que
 * protege aqui — login, checkout, upload e busca por CPF.
 */

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

// ─── Memória ────────────────────────────────────────────────────────────────
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

function memoryLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
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

// ─── Upstash ────────────────────────────────────────────────────────────────
function upstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

let avisouMemoria = false;

function avisarFallback() {
  if (avisouMemoria) return;
  avisouMemoria = true;
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN ausentes — usando contador em memória, " +
      "que não é compartilhado entre instâncias serverless."
  );
}

/**
 * INCR + EXPIRE numa ida só. `EXPIRE key ttl NX` só cria o prazo na primeira
 * requisição da janela, então a janela não se estende a cada acesso.
 */
async function upstashLimit(
  cfg: { url: string; token: string },
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const res = await fetch(`${cfg.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(windowSeconds), "NX"],
      ["TTL", key],
    ]),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Upstash ${res.status}`);

  const body = (await res.json()) as Array<{ result?: unknown; error?: string }>;
  const count = Number(body?.[0]?.result ?? 0);
  const ttl = Number(body?.[2]?.result ?? windowSeconds);
  if (!Number.isFinite(count) || count <= 0) throw new Error("Upstash: resposta inesperada");

  if (count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  }
  return { ok: true, remaining: limit - count, retryAfterSeconds: 0 };
}

/**
 * Consome uma unidade da cota de `key`. Nunca lança: se o Redis cair, a
 * chamada degrada para o contador em memória em vez de derrubar a rota.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const cfg = upstashConfig();
  if (!cfg) {
    avisarFallback();
    return memoryLimit(key, limit, windowSeconds);
  }
  try {
    return await upstashLimit(cfg, key, limit, windowSeconds);
  } catch (err) {
    console.error("[rate-limit] Upstash indisponível, caindo para memória:", err);
    return memoryLimit(key, limit, windowSeconds);
  }
}

/** IP do cliente atrás do proxy da Vercel. Nunca aceite IP vindo do corpo. */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0].trim();
    if (first) return first;
  }
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "desconhecido"
  );
}
