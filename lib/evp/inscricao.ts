import "server-only";
import { createSignedToken, verifySignedToken } from "@/lib/auth/session-token";
import { SLUG } from "./config";
import { cifrarCpf, hmacCpf, novoCodigo, novoToken } from "./cripto";
import { lerIngresso, rpc } from "./db";
import { enviarConfirmacao, type MotivoEmail } from "./email";
import { normalizarBusca, type InscricaoDados } from "./schema";
import type { EventoPublico, InscricaoPublica, Vagas } from "./tipos";

// ─── Selo anti-robô ─────────────────────────────────────────────────────────
// O servidor entrega um selo assinado quando o formulário abre. A inscrição só
// passa com um selo válido e com alguns segundos de vida: preencher três etapas
// em menos tempo que isso não é gente.

const PROPOSITO_SELO = `evp-selo:${SLUG}`;
const SELO_VALIDADE_S = 3 * 3600;
const SELO_MINIMO_MS = 4000;

export function novoSelo(): string {
  return createSignedToken(PROPOSITO_SELO, { t: Date.now() }, SELO_VALIDADE_S);
}

export function conferirSelo(selo: string): "ok" | "invalido" | "rapido" {
  const p = verifySignedToken<{ t?: unknown }>(PROPOSITO_SELO, selo);
  if (!p || typeof p.t !== "number") return "invalido";
  return Date.now() - p.t < SELO_MINIMO_MS ? "rapido" : "ok";
}

// ─── Origem ─────────────────────────────────────────────────────────────────

type Origem = Partial<Record<"utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term" | "referrer", string | null>>;

const REDES: [RegExp, string][] = [
  [/instagram\./, "instagram"],
  [/(facebook|fb)\./, "facebook"],
  [/(whatsapp|wa\.me)/, "whatsapp"],
  [/google\./, "google"],
  [/(tiktok)\./, "tiktok"],
  [/(t\.co|twitter|x\.com)/, "x"],
  [/strava\./, "strava"],
  [/sommaclub\.com\.br/, "site-somma"],
];

/** Uma palavra por origem, para agrupar no painel. Nunca carrega dado pessoal. */
export function fonteDaOrigem(o: Origem | undefined | null): string {
  const limpa = (v: string) => v.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40);
  const source = o?.utm_source ? limpa(o.utm_source) : "";
  if (source) return source;
  const ref = (o?.referrer ?? "").toLowerCase();
  if (ref) {
    for (const [re, nome] of REDES) if (re.test(ref)) return nome;
    return limpa(ref.replace(/^www\./, "")) || "outro-site";
  }
  return "direto";
}

function limparOrigem(o: Origem | undefined | null): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const [k, v] of Object.entries(o ?? {})) {
    const t = typeof v === "string" ? v.trim().slice(0, 160) : "";
    if (t) saida[k] = t;
  }
  return saida;
}

// ─── Inscrição ──────────────────────────────────────────────────────────────

type RespostaBanco =
  | { ok: true; repetida: boolean; inscricao: InscricaoPublica; vagas?: Vagas }
  | { ok: false; motivo: "duplicada"; status: string; email: string }
  | { ok: false; motivo: "fechada" | "lotado"; vagas: Vagas }
  | { ok: false; motivo: "sem_evento" | "chave_em_uso" };

export type ResultadoInscricao = RespostaBanco;

export async function inscrever(
  dados: InscricaoDados,
  extra: { idempotencyKey: string; origem?: Origem | null }
): Promise<ResultadoInscricao> {
  const base = {
    nome: dados.nome,
    nome_busca: normalizarBusca(dados.nome),
    email: dados.email,
    telefone: dados.telefone,
    cpf_cifrado: cifrarCpf(dados.cpf),
    cpf_hmac: hmacCpf(SLUG, dados.cpf),
    cpf_final: dados.cpf.slice(-2),
    sexo: dados.sexo,
    distancia: dados.distancia,
    primeira_vez: dados.primeira_vez === "sim",
    aceite_marketing: dados.aceite_marketing === true,
    origem: limparOrigem(extra.origem),
    origem_fonte: fonteDaOrigem(extra.origem),
    idempotency_key: extra.idempotencyKey,
  };

  // O código curto é sorteado aqui. Colisão é rara (31^6); se acontecer, o
  // banco recusa pelo índice único e a gente sorteia outro.
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    try {
      return await rpc<RespostaBanco>("evp_inscrever", {
        p_slug: SLUG,
        p: { ...base, codigo: novoCodigo(), ticket_token: novoToken(), qr_token: novoToken() },
      });
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : "";
      if (!/evp_registrations_(codigo|ticket_token|qr_token)_key/.test(msg) || tentativa === 3) throw erro;
    }
  }
  throw new Error("Não foi possível gerar o código da inscrição");
}

export async function avisarPorEmail(
  inscricao: Pick<InscricaoPublica, "nome" | "email" | "codigo" | "ticket_token" | "distancia" | "status" | "posicao_fila">,
  evento: Pick<EventoPublico, "starts_at" | "ends_at" | "local_nome" | "endereco">,
  motivo: MotivoEmail
) {
  // O QR só existe para vaga confirmada; o identificador dele vem da ficha do ingresso.
  const qrToken = inscricao.status === "confirmada" ? ((await lerIngresso(inscricao.ticket_token))?.qr_token ?? null) : null;
  return enviarConfirmacao({
    qrToken,
    nome: inscricao.nome,
    email: inscricao.email,
    codigo: inscricao.codigo,
    ticketToken: inscricao.ticket_token,
    distancia: inscricao.distancia,
    status: inscricao.status,
    posicaoFila: inscricao.posicao_fila,
    evento,
    motivo,
  });
}

type Promovida = { id: string; nome: string; email: string; codigo: string; ticket_token: string };

/** Quem saiu da fila precisa saber. Chamado depois de cancelar ou aumentar a capacidade. */
export async function avisarPromovidas(promovidas: Promovida[] | undefined | null): Promise<number> {
  if (!promovidas?.length) return 0;
  let enviados = 0;
  for (const p of promovidas) {
    const ing = await rpc<(InscricaoPublica & { evento: EventoPublico }) | null>("evp_ingresso", {
      p_slug: SLUG,
      p_ticket_token: p.ticket_token,
    }).catch(() => null);
    if (!ing) continue;
    const r = await avisarPorEmail(ing, ing.evento, "promovida");
    if (r.ok) enviados++;
  }
  return enviados;
}
