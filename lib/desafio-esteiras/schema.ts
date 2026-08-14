import { z } from "zod";
import { isValidCPF } from "@/lib/cpf";
import { checarCelularBR, normalizarTelefoneBR, TELEFONE_MSG } from "@/lib/telefone";
import { UNIT_IDS } from "./event.config";
import { isNomeCompleto, normalizarNome } from "./nome";

export const onlyDigits = (v: string) => String(v ?? "").replace(/\D/g, "");

/** CPF normalizado: 11 dígitos, sem máscara. É a chave de unicidade do evento. */
export const cpfSchema = z
  .string()
  .transform(onlyDigits)
  .refine((v) => v.length === 11, { message: "CPF incompleto — precisa ter 11 dígitos" })
  .refine(isValidCPF, { message: "CPF inválido — confira os dígitos" });

/**
 * Celular BR: DDD da Anatel + nono dígito + faixa 6–9.
 * O campo é WhatsApp — fixo e número inventado não passam.
 */
export const phoneSchema = z
  .string()
  .transform(normalizarTelefoneBR)
  .superRefine((v, ctx) => {
    const r = checarCelularBR(v);
    if (!r.ok) {
      ctx.addIssue({ code: "custom", message: TELEFONE_MSG[r.motivo] });
    }
  });

const HOJE_MIN_IDADE = 12; // guarda-corpo: menores de 12 não conseguem se inscrever sozinhos

/** Mostra dd/mm/aaaa enquanto a pessoa digita. Também aceita ISO (yyyy-mm-dd) na volta da validação. */
export function formatBirthDate(raw: string): string {
  const trimmed = String(raw ?? "").trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const d = onlyDigits(trimmed).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Converte dd/mm/aaaa (ou dígitos) para yyyy-mm-dd. ISO já no formato passa direto. */
export function toISODate(raw: string): string {
  const trimmed = String(raw ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = onlyDigits(trimmed);
  if (d.length !== 8) return trimmed;
  return `${d.slice(4, 8)}-${d.slice(2, 4)}-${d.slice(0, 2)}`;
}

export const birthDateSchema = z
  .string()
  .transform(toISODate)
  .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), { message: "Data de nascimento inválida" })
  .refine((v) => {
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return false;
    const anos = (Date.now() - dt.getTime()) / (365.25 * 24 * 3600 * 1000);
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

export const sexoSchema = z.enum(["masculino", "feminino"], {
  message: "Escolha a categoria em que vai disputar",
});

export const participacaoSchema = z.enum(["competidor", "espectador"], {
  message: "Diga se vai competir ou assistir",
});

export const registrationSchema = z.object({
  unit_id: z.enum(UNIT_IDS as [string, ...string[]], {
    message: "Escolha uma unidade",
  }),
  sexo: sexoSchema,
  participacao: participacaoSchema,
  full_name: z
    .string()
    .transform(normalizarNome)
    .refine(isNomeCompleto, "Informe nome e sobrenome"),
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

/**
 * Cadastro feito pelo painel. O aceite de termos e o honeypot são da LP —
 * aqui quem grava é o operador, então esses campos não entram.
 */
export const adminInscricaoSchema = registrationSchema.omit({
  aceite_termos: true,
  website: true,
});
export type AdminInscricaoPayload = z.output<typeof adminInscricaoSchema>;

/** Etapa 2 isolada — usada pela validação em tempo real do formulário. */
export const step2Schema = registrationSchema.pick({
  full_name: true,
  cpf: true,
  birth_date: true,
  email: true,
  phone: true,
  sexo: true,
  participacao: true,
});

/**
 * Acesso ao próprio cadastro.
 *
 * CPF sozinho não serve como prova de identidade — ele circula em nota fiscal,
 * cadastro de loja e vazamento. Exigir a data de nascimento junto transforma
 * "quem descobriu um CPF" em "quem conhece a pessoa", sem pedir senha nem
 * e-mail de confirmação.
 */
export const acessoCadastroSchema = z.object({
  cpf: cpfSchema,
  birth_date: z.string().transform(toISODate).refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), {
    message: "Data de nascimento inválida",
  }),
});

/** Campos que o participante pode alterar sozinho. CPF e nascimento são as chaves — não mudam. */
export const edicaoCadastroSchema = z.object({
  full_name: registrationSchema.shape.full_name,
  email: registrationSchema.shape.email,
  phone: phoneSchema,
  unit_id: registrationSchema.shape.unit_id,
  sexo: sexoSchema,
  participacao: participacaoSchema,
  /** `true` remove a foto atual; o upload de uma nova passa por rota própria. */
  remover_foto: z.boolean().optional(),
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
