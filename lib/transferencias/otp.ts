import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import {
  createSignedToken,
  getAuthSecret,
  verifySignedToken,
} from "@/lib/auth/session-token";
import { getEmailFrom, getResendClient } from "@/lib/resend";

/**
 * Segundo fator da transferência de inscrição.
 *
 * CPF e e-mail não são segredo: circulam em ficha de inscrição, aparecem em
 * grupo de WhatsApp e vazam em qualquer lista. Só com eles, tomar a vaga de
 * alguém era preencher um formulário. O código enviado por e-mail prova o que
 * faltava: que quem pede a transferência tem acesso à caixa do titular.
 *
 * Sem tabela nova: o desafio viaja num token HMAC devolvido ao navegador, e
 * dentro dele vai apenas o HASH do código. O token sozinho não revela o código,
 * e o código sozinho não vale sem o token — só quem recebeu o e-mail tem as
 * duas metades.
 */

const PURPOSE_DESAFIO = "transferencia-otp";
const PURPOSE_AUTORIZACAO = "transferencia";
const VALIDADE_DESAFIO = 60 * 15; // 15 min para achar o e-mail e digitar
const VALIDADE_AUTORIZACAO = 60 * 20; // 20 min para concluir o formulário

export interface DadosTransferencia {
  inscricaoId: string;
  eventoId: string;
  cpfOrigem: string;
  emailOrigem: string;
}

function hashCodigo(codigo: string): string {
  return createHmac("sha256", getAuthSecret()).update(`otp:${codigo}`).digest("base64url");
}

export function gerarCodigo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function criarDesafio(dados: DadosTransferencia, codigo: string): string {
  return createSignedToken(
    PURPOSE_DESAFIO,
    { ...dados, codigoHash: hashCodigo(codigo) },
    VALIDADE_DESAFIO
  );
}

export function conferirDesafio(
  token: string | null | undefined,
  codigo: string
): DadosTransferencia | null {
  const payload = verifySignedToken<Record<string, unknown>>(PURPOSE_DESAFIO, token);
  if (!payload) return null;

  const esperado = Buffer.from(String(payload.codigoHash ?? ""));
  const recebido = Buffer.from(hashCodigo(codigo));
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return null;

  return {
    inscricaoId: String(payload.inscricaoId ?? ""),
    eventoId: String(payload.eventoId ?? ""),
    cpfOrigem: String(payload.cpfOrigem ?? ""),
    emailOrigem: String(payload.emailOrigem ?? ""),
  };
}

/** Crachá que a tela guarda entre o código e o envio do formulário. */
export function criarAutorizacao(dados: DadosTransferencia): string {
  return createSignedToken(PURPOSE_AUTORIZACAO, { ...dados }, VALIDADE_AUTORIZACAO);
}

export function lerAutorizacao(token: string | null | undefined): DadosTransferencia | null {
  const payload = verifySignedToken<Record<string, unknown>>(PURPOSE_AUTORIZACAO, token);
  if (!payload?.inscricaoId) return null;
  return {
    inscricaoId: String(payload.inscricaoId),
    eventoId: String(payload.eventoId ?? ""),
    cpfOrigem: String(payload.cpfOrigem ?? ""),
    emailOrigem: String(payload.emailOrigem ?? ""),
  };
}

export async function enviarCodigo(
  email: string,
  codigo: string,
  nomeEvento: string
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResendClient();
  const from = getEmailFrom();
  if (!resend || !from) {
    console.error("[transferencias/otp] Resend não configurado — código não enviado.");
    return { ok: false, error: "Envio de e-mail indisponível no momento." };
  }

  const html = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000;padding:32px 0;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#0a0a0a;border:1px solid #1f1f1f;border-radius:16px;">
      <tr><td style="padding:32px 32px 8px 32px;font-family:Helvetica,Arial,sans-serif;color:#ffffff;font-size:20px;font-weight:600;">
        Código para transferir sua inscrição
      </td></tr>
      <tr><td style="padding:0 32px 16px 32px;font-family:Helvetica,Arial,sans-serif;color:#a1a1a1;font-size:14px;line-height:22px;">
        Alguém pediu a transferência da sua inscrição em <strong style="color:#ffffff;">${nomeEvento}</strong>. Use o código abaixo para confirmar. Ele vale por 15 minutos.
      </td></tr>
      <tr><td align="center" style="padding:8px 32px 24px 32px;">
        <div style="display:inline-block;font-family:'Courier New',Courier,monospace;font-size:34px;letter-spacing:10px;color:#ff4f2d;background:#160604;border:1px solid #3a1109;border-radius:12px;padding:16px 24px;">${codigo}</div>
      </td></tr>
      <tr><td style="padding:0 32px 32px 32px;font-family:Helvetica,Arial,sans-serif;color:#6b6b6b;font-size:12px;line-height:20px;">
        Se não foi você quem pediu, ignore este e-mail: sem o código, a transferência não acontece.
      </td></tr>
    </table>
  </td></tr>
</table>`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: `Código de transferência: ${codigo}`,
      html,
    });
    if (error) {
      console.error("[transferencias/otp] Resend recusou o envio:", error);
      return { ok: false, error: "Não foi possível enviar o código." };
    }
    return { ok: true };
  } catch (err) {
    console.error("[transferencias/otp] Erro ao enviar código:", err);
    return { ok: false, error: "Não foi possível enviar o código." };
  }
}
