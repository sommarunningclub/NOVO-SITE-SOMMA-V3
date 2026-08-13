import { z } from "zod";
import { isValidCPF } from "@/lib/cpf";
import { UNIT_IDS } from "./event.config";

export const onlyDigits = (v: string) => String(v ?? "").replace(/\D/g, "");

/** CPF normalizado: 11 dígitos, sem máscara. É a chave de unicidade do evento. */
export const cpfSchema = z
  .string()
  .transform(onlyDigits)
  .refine((v) => v.length === 11, { message: "CPF precisa ter 11 dígitos" })
  .refine(isValidCPF, { message: "CPF inválido" });

/** Telefone BR normalizado: 10 ou 11 dígitos (DDD + número), sem +55. */
export const phoneSchema = z
  .string()
  .transform((v) => {
    let d = onlyDigits(v);
    if (d.startsWith("55") && d.length > 11) d = d.slice(2);
    return d;
  })
  .refine((v) => v.length === 10 || v.length === 11, {
    message: "Telefone precisa ter DDD + número",
  });

const HOJE_MIN_IDADE = 12; // guarda-corpo: menores de 12 não conseguem se inscrever sozinhos

export const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida")
  .refine((v) => {
    const d = new Date(`${v}T12:00:00Z`);
    if (Number.isNaN(d.getTime())) return false;
    const anos = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
    return anos >= HOJE_MIN_IDADE && anos <= 100;
  }, "Data de nascimento inválida");

export const utmSchema = z
  .object({
    utm_source: z.string().max(120).optional().nullable(),
    utm_medium: z.string().max(120).optional().nullable(),
    utm_campaign: z.string().max(160).optional().nullable(),
    utm_content: z.string().max(160).optional().nullable(),
    utm_term: z.string().max(160).optional().nullable(),
    referral: z.string().max(200).optional().nullable(),
  })
  .partial();

export const registrationSchema = z.object({
  unit_id: z.enum(UNIT_IDS as [string, ...string[]], {
    message: "Escolha uma unidade",
  }),
  full_name: z
    .string()
    .trim()
    .min(5, "Informe seu nome completo")
    .max(120)
    .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, "Informe nome e sobrenome"),
  cpf: cpfSchema,
  birth_date: birthDateSchema,
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(160),
  phone: phoneSchema,
  aceite_termos: z.literal(true, { message: "É necessário aceitar os termos" }),
  ...utmSchema.shape,
  /**
   * Honeypot anti-spam. Aceita qualquer valor no schema de propósito: quem
   * preenche é tratado no handler com um 200 silencioso, sem gravar nada. Se
   * recusássemos aqui com 400, o bot aprenderia qual campo o denunciou.
   */
  website: z.string().max(200).optional(),
});

export type RegistrationInput = z.input<typeof registrationSchema>;
export type RegistrationPayload = z.output<typeof registrationSchema>;

/** Etapa 2 isolada — usada pela validação em tempo real do formulário. */
export const step2Schema = registrationSchema.pick({
  full_name: true,
  cpf: true,
  birth_date: true,
  email: true,
  phone: true,
});

export const checkinSchema = z.object({
  /** aceita o token do QR ou o ticket_code digitado */
  value: z.string().trim().min(4).max(200),
});

export function formatPhone(digits: string): string {
  const d = onlyDigits(digits);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}
