import { z } from "zod";
import { isValidCPF } from "@/lib/cpf";
import { checarCelularBR, normalizarTelefoneBR, TELEFONE_MSG } from "@/lib/telefone";
import { PELOTOES } from "./event.config";

export const soDigitos = (v: string) => String(v ?? "").replace(/\D/g, "");

/** 11 dígitos, sem máscara. É a chave que liga a inscrição à pessoa na base. */
export const cpfSchema = z
  .string()
  .transform(soDigitos)
  .refine((v) => v.length === 11, { message: "CPF incompleto — precisa ter 11 dígitos" })
  .refine(isValidCPF, { message: "CPF inválido — confira os dígitos" });

export const telefoneSchema = z
  .string()
  .transform(normalizarTelefoneBR)
  .superRefine((v, ctx) => {
    const r = checarCelularBR(v);
    if (!r.ok) ctx.addIssue({ code: "custom", message: TELEFONE_MSG[r.motivo] });
  });

export const nomeSchema = z
  .string()
  .trim()
  .min(5, "Escreva seu nome completo")
  .max(120, "Nome muito longo")
  .refine((v) => v.split(/\s+/).filter((p) => p.length >= 2).length >= 2, {
    message: "Escreva nome e sobrenome",
  });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("E-mail inválido")
  .max(160);

/** dd/mm/aaaa (o que a pessoa digita) → aaaa-mm-dd (o que a base guarda). */
export function paraISO(raw: string): string {
  const t = String(raw ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const d = soDigitos(t);
  if (d.length !== 8) return t;
  return `${d.slice(4, 8)}-${d.slice(2, 4)}-${d.slice(0, 2)}`;
}

export function formatarNascimento(raw: string): string {
  const iso = String(raw ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const d = soDigitos(raw).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

const IDADE_MINIMA = 12;

export const nascimentoSchema = z
  .string()
  .transform(paraISO)
  .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), "Data de nascimento inválida")
  .refine((v) => {
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return false;
    const anos = (Date.now() - dt.getTime()) / (365.25 * 24 * 3600 * 1000);
    return anos >= IDADE_MINIMA && anos <= 100;
  }, `Precisa ter ao menos ${IDADE_MINIMA} anos`);

export const sexoSchema = z.enum(["masculino", "feminino"], {
  message: "Escolha uma opção",
});

export const pelotaoSchema = z.enum(PELOTOES, { message: "Escolha seu pelotão" });

/** Etapa 1 do fluxo: só o CPF. É ele que decide se pedimos cadastro ou não. */
export const identificacaoSchema = z.object({ cpf: cpfSchema });

export const utmSchema = z
  .object({
    utm_source: z.string().max(120).nullish(),
    utm_medium: z.string().max(120).nullish(),
    utm_campaign: z.string().max(160).nullish(),
    utm_content: z.string().max(160).nullish(),
    utm_term: z.string().max(160).nullish(),
    referral: z.string().max(200).nullish(),
  })
  .partial();

/**
 * O que o formulário manda na etapa final. Os dados pessoais são opcionais
 * AQUI de propósito: quem já está na base do Somma não redigita nada, e a rota
 * completa os campos a partir do cadastro antes de validar o conjunto.
 */
export const envioSchema = z.object({
  cpf: cpfSchema,
  pelotao: pelotaoSchema,
  nome: z.string().optional(),
  email: z.string().optional(),
  telefone: z.string().optional(),
  nascimento: z.string().optional(),
  parceiro: z.string().trim().max(60).nullish(),
  utm: utmSchema.optional(),
});

/**
 * O conjunto final, já mesclado com o que existe em `cadastro_site`. É este
 * que decide se a inscrição entra — validar só o que veio do formulário
 * deixaria passar cadastro antigo incompleto.
 */
export const inscricaoSchema = z.object({
  nome: nomeSchema,
  cpf: cpfSchema,
  email: emailSchema,
  telefone: telefoneSchema,
  nascimento: nascimentoSchema,
  pelotao: pelotaoSchema,
  parceiro: z.string().trim().max(60).nullish(),
  utm: utmSchema.optional(),
});

/** Campos que o cadastro precisa ter para a inscrição valer. */
export const CAMPOS_OBRIGATORIOS = ["nome", "email", "telefone", "nascimento"] as const;
export type CampoObrigatorio = (typeof CAMPOS_OBRIGATORIOS)[number];

export type EnvioInput = z.input<typeof envioSchema>;
export type Inscricao = z.output<typeof inscricaoSchema>;
