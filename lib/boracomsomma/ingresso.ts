import "server-only";
import QRCode from "qrcode";
import { createSignedToken, verifySignedToken } from "@/lib/auth/session-token";
import { getServiceSupabase } from "@/lib/supabase";
import { buscarEvento, type EventoBora } from "./evento";

/**
 * Ingresso do BORA com SOMMA.
 *
 * Não há tabela nova: o ingresso é o próprio check-in em `checkins`. O link da
 * página de obrigado carrega um token assinado (HMAC, mesmo segredo do resto do
 * site) com o id do check-in; sem o token ninguém chega ao ingresso de outra
 * pessoa. Para quem perdeu o link, /api/boracomsomma/ingresso devolve o token
 * com CPF + e-mail iguais aos do check-in.
 */

const PROPOSITO = "boracomsomma:ingresso";
const VALIDADE_S = 120 * 24 * 3600;

export function criarTokenIngresso(checkinId: string): string {
  return createSignedToken(PROPOSITO, { id: checkinId }, VALIDADE_S);
}

export function idDoToken(token: string | null | undefined): string | null {
  const p = verifySignedToken<{ id?: unknown }>(PROPOSITO, token);
  return p && typeof p.id === "string" && /^[0-9a-f-]{36}$/i.test(p.id) ? p.id : null;
}

/** Código curto, para a equipe conferir no dia. */
export function codigoDoIngresso(checkinId: string): string {
  return `BCS-${checkinId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export type Ingresso = {
  id: string;
  codigo: string;
  nome: string;
  primeiroNome: string;
  pelotao: string | null;
  evento: EventoBora;
  /** SVG do QR (conteúdo: BORACOMSOMMA:<id do check-in>). */
  qrSvg: string;
};

export async function lerIngresso(token: string | null | undefined): Promise<Ingresso | null> {
  const id = idDoToken(token);
  if (!id) return null;
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const [{ data, error }, evento] = await Promise.all([
    supabase.from("checkins").select("id, nome_completo, pelotao, evento_id").eq("id", id).maybeSingle(),
    buscarEvento({ servidor: true }),
  ]);
  if (error) {
    console.error("[boracomsomma] Falha ao ler o ingresso:", error.message);
    return null;
  }
  if (!data || !evento.id || data.evento_id !== evento.id) return null;
  const nome = String(data.nome_completo || "").trim();
  const qrSvg = await QRCode.toString(`BORACOMSOMMA:${data.id}`, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#00000000" },
  });
  return {
    id: data.id,
    codigo: codigoDoIngresso(data.id),
    nome,
    primeiroNome: nome.split(/\s+/)[0] || nome,
    pelotao: data.pelotao || null,
    evento,
    qrSvg,
  };
}

/** PNG do QR para a imagem do ingresso (o ImageResponse não desenha SVG inline). */
export async function qrPng(checkinId: string): Promise<string> {
  return QRCode.toDataURL(`BORACOMSOMMA:${checkinId}`, {
    margin: 0,
    width: 360,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#CEFF00" },
  });
}

/** O mesmo QR em PNG binário, para ir como anexo inline no e-mail. */
export async function qrPngBuffer(checkinId: string): Promise<Buffer> {
  return QRCode.toBuffer(`BORACOMSOMMA:${checkinId}`, {
    margin: 0,
    width: 360,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#CEFF00" },
  });
}
