import "server-only";
import { randomBytes } from "crypto";
import { createSignedToken, verifySignedToken } from "@/lib/auth/session-token";
import { getServiceSupabase } from "@/lib/supabase";
import { BUCKET_FOTOS } from "./db";

/* ── Sessão de edição ────────────────────────────────────────────────────── */

const PURPOSE = "desafio-esteiras-edicao";
/** 20 min: tempo de sobra para ajustar os dados, curto o bastante para não virar acesso permanente. */
const TTL = 60 * 20;

/**
 * Token curto que autoriza editar UMA inscrição.
 *
 * Emitido só depois de conferir CPF + data de nascimento. Assim a rota de
 * escrita nunca aceita CPF avulso, e o acesso expira sozinho — diferente de
 * deixar o CPF valendo como credencial permanente.
 */
export function criarTokenEdicao(id: string): string {
  return createSignedToken(PURPOSE, { id }, TTL);
}

export function lerTokenEdicao(token: string | null | undefined): string | null {
  const payload = verifySignedToken<{ id: string }>(PURPOSE, token);
  return payload?.id ?? null;
}

/* ── Foto de perfil ──────────────────────────────────────────────────────── */

export const FOTO_MAX_BYTES = 3 * 1024 * 1024; // 3 MB
export const FOTO_TIPOS = ["image/jpeg", "image/png", "image/webp"] as const;

const EXTENSAO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Verificação do conteúdo, não do rótulo.
 *
 * `file.type` vem do cliente e é trivial de forjar. Lemos os primeiros bytes e
 * conferimos a assinatura do formato — um .php renomeado para .jpg não passa.
 */
export function detectarImagem(bytes: Uint8Array): (typeof FOTO_TIPOS)[number] | null {
  if (bytes.length < 12) return null;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((b, i) => bytes[i] === b)) return "image/png";
  // WEBP: "RIFF" .... "WEBP"
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  return null;
}

/** Nome imprevisível: a URL da foto é pública e não deve revelar quem é o dono. */
export function nomeArquivoFoto(mime: string): string {
  return `${randomBytes(16).toString("hex")}.${EXTENSAO[mime] ?? "jpg"}`;
}

export async function removerFoto(path: string): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) return;
  const { error } = await supabase.storage.from(BUCKET_FOTOS).remove([path]);
  if (error) console.warn("[desafio-esteiras] não removeu a foto antiga:", error.message);
}
