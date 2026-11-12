import { z } from "zod";
import { isValidCPF } from "@/lib/cpf";
import { checarCelularBR, normalizarTelefoneBR, TELEFONE_MSG } from "@/lib/telefone";
import { DISTANCIAS_INSCRICAO } from "./config";

/**
 * Validação da inscrição. O mesmo schema roda no formulário (para avisar na
 * hora) e no servidor (que é quem decide). Pode ser importado no cliente.
 */

export const soDigitos = (v: unknown) => String(v ?? "").replace(/\D/g, "");

export const SEXOS = ["feminino", "masculino"] as const;
export const SEXO_ROTULO: Record<(typeof SEXOS)[number], string> = {
  feminino: "Feminino",
  masculino: "Masculino",
};

const nome = z
  .string({ message: "Informe seu nome completo" })
  .trim()
  .min(5, "Informe seu nome completo")
  .max(120, "Nome muito longo")
  .refine((v) => v.split(/\s+/).filter((p) => p.length >= 2).length >= 2, { message: "Escreva nome e sobrenome" })
  .refine((v) => !/[0-9<>{}[\]\\/@]/.test(v), { message: "Use apenas letras no nome" });

const email = z
  .string({ message: "Informe seu e-mail" })
  .trim()
  .toLowerCase()
  .max(160, "E-mail muito longo")
  .email("E-mail inválido: confira o endereço");

const telefone = z
  .string({ message: "Informe seu WhatsApp com DDD" })
  .transform(normalizarTelefoneBR)
  .superRefine((v, ctx) => {
    const r = checarCelularBR(v);
    if (!r.ok) ctx.addIssue({ code: "custom", message: TELEFONE_MSG[r.motivo] });
  });

const cpf = z
  .string({ message: "Informe seu CPF" })
  .transform(soDigitos)
  .refine((v) => v.length === 11, { message: "CPF incompleto: são 11 dígitos" })
  .refine(isValidCPF, { message: "CPF inválido: confira os números" });

export const etapa1Schema = z.object({
  nome,
  email,
  telefone,
  cpf,
  sexo: z.enum(SEXOS, { message: "Escolha uma opção" }),
});

export const etapa2Schema = z.object({
  distancia: z.enum(DISTANCIAS_INSCRICAO, { message: "Escolha a distância que você vai correr" }),
  primeira_vez: z.enum(["sim", "nao"], { message: "Conte se é a sua primeira vez nessa distância" }),
});

export const etapa3Schema = z.object({
  aceite_termos: z.literal(true, { message: "Para se inscrever, aceite os termos de participação e de dados" }),
  aceite_imagem: z.literal(true, { message: "Para se inscrever, aceite o Termo de Uso de Imagem" }),
  aceite_marketing: z.boolean().optional().default(false),
});

export const inscricaoSchema = etapa1Schema.extend(etapa2Schema.shape).extend(etapa3Schema.shape);
export type InscricaoForm = z.input<typeof inscricaoSchema>;
export type InscricaoDados = z.output<typeof inscricaoSchema>;

const texto = (max: number) => z.string().trim().max(max).nullish();

export const origemSchema = z
  .object({
    utm_source: texto(120),
    utm_medium: texto(120),
    utm_campaign: texto(160),
    utm_content: texto(160),
    utm_term: texto(160),
    referrer: texto(120),
  })
  .partial();

/** Corpo que o servidor aceita no POST da inscrição. */
export const corpoInscricaoSchema = inscricaoSchema.extend({
  idempotency_key: z.string().uuid({ message: "Recarregue a página e tente de novo" }),
  /** Selo emitido pelo servidor quando o formulário abre (anti-robô). */
  selo: z.string().min(10).max(400),
  /** Campo isca: gente não vê, robô preenche. */
  site: z.string().max(0).optional().or(z.literal("")),
  origem: origemSchema.optional(),
});

/** { campo: mensagem } a partir dos erros do Zod. */
export function camposComErro(issues: z.core.$ZodIssue[]): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const i of issues) {
    const campo = String(i.path[0] ?? "");
    if (campo && !saida[campo]) saida[campo] = i.message;
  }
  return saida;
}

export function mascararTelefone(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** ***.***.***-12: o que qualquer tela mostra do CPF. */
export function cpfMascarado(final: string): string {
  return `***.***.***-${final}`;
}

/** j***@dominio.com: para avisar onde está a confirmação sem expor o e-mail. */
export function emailMascarado(v: string): string {
  const [usuario, dominio] = v.split("@");
  if (!usuario || !dominio) return "seu e-mail";
  return `${usuario.slice(0, 1)}${"*".repeat(Math.max(usuario.length - 1, 2))}@${dominio}`;
}

/** Minúsculas e sem acento: é o que a busca do credenciamento compara. */
export function normalizarBusca(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
