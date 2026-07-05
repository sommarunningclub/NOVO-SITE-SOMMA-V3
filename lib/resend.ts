import { Resend } from "resend";

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export function getEmailFrom(): string | null {
  return process.env.VIP_EMAIL_FROM || process.env.EMAIL_FROM || null;
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && getEmailFrom());
}
