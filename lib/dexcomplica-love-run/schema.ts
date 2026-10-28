import { z } from "zod";
import { isValidCPF } from "@/lib/cpf";

export const soDigitos = (v: unknown) => String(v ?? "").replace(/\D/g, "");

export const cpfSchema = z
  .string({ message: "Informe seu CPF" })
  .transform(soDigitos)
  .refine((v) => v.length === 11, { message: "CPF incompleto: são 11 dígitos" })
  .refine(isValidCPF, { message: "CPF inválido: confira os números" });

export const nomeSchema = z
  .string({ message: "Informe seu nome completo" })
  .trim()
  .min(5, "Informe seu nome completo")
  .max(120, "Nome muito longo")
  .refine((v) => v.split(/\s+/).filter((p) => p.length >= 2).length >= 2, {
    message: "Escreva nome e sobrenome",
  })
  .refine((v) => !/[0-9<>{}[\]\\/@]/.test(v), { message: "Use apenas letras no nome" });

export const emailSchema = z
  .string({ message: "Informe seu e-mail" })
  .trim()
  .toLowerCase()
  .max(160, "E-mail muito longo")
  .email("E-mail inválido");

/** Mesmos valores do /check-in e de `cadastro_site.sexo`. */
export const SEXOS = ["feminino", "masculino"] as const;
export const SEXO_ROTULO: Record<(typeof SEXOS)[number], string> = {
  feminino: "Feminino",
  masculino: "Masculino",
};
export const sexoSchema = z.enum(SEXOS, { message: "Escolha uma opção" });

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
 * O pelotão é texto aqui; quem confere se ele existe é a rota, contra
 * `eventos.pelotoes`, porque a lista vem da gestão e muda sem deploy.
 */
export const inscricaoSchema = z.object({
  nome: nomeSchema,
  email: emailSchema,
  cpf: cpfSchema,
  sexo: sexoSchema,
  pelotao: z.string({ message: "Escolha seu pelotão" }).trim().min(1, "Escolha seu pelotão").max(40),
  marketing: z.boolean().optional().default(false),
  utm: utmSchema.optional(),
});

export const recuperarSchema = z.object({ cpf: cpfSchema });

export type InscricaoInput = z.input<typeof inscricaoSchema>;
export type Inscricao = z.output<typeof inscricaoSchema>;

/** 000.000.000-00 enquanto digita. */
export function mascararCpf(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function camposComErro(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const issue of issues) {
    const campo = String(issue.path[0] ?? "form");
    if (!campos[campo]) campos[campo] = issue.message;
  }
  return campos;
}

/**
 * Erros comuns de domínio (em 28/10/2026 entrou um "@gmaill.com" e o ingresso
 * não chegou). Só sugere: quem decide é a pessoa.
 */
const DOMINIOS_ERRADOS: Record<string, string> = {
  "gmaill.com": "gmail.com", "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmal.com": "gmail.com",
  "gamil.com": "gmail.com", "gnail.com": "gmail.com", "gmail.co": "gmail.com", "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com", "gmail.om": "gmail.com", "gmail.com.br": "gmail.com", "gmeil.com": "gmail.com",
  "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com", "hotmal.com": "hotmail.com", "hotmil.com": "hotmail.com",
  "hotnail.com": "hotmail.com", "hotmail.con": "hotmail.com", "hotmail.co": "hotmail.com", "hotmaill.com": "hotmail.com",
  "outlok.com": "outlook.com", "outllok.com": "outlook.com", "outlook.con": "outlook.com", "outloo.com": "outlook.com",
  "yaho.com": "yahoo.com", "yahoo.con": "yahoo.com", "yahooo.com": "yahoo.com", "yahoo.com.b": "yahoo.com.br",
  "iclod.com": "icloud.com", "icoud.com": "icloud.com", "icloud.con": "icloud.com", "icloud.co": "icloud.com",
};

export function sugestaoEmail(email: string): string | null {
  const v = String(email ?? "").trim().toLowerCase();
  const m = v.match(/^([^@\s]+)@([^@\s]+)$/);
  if (!m) return null;
  const certo = DOMINIOS_ERRADOS[m[2]] ?? (m[2].endsWith(".con") ? m[2].slice(0, -4) + ".com" : null);
  return certo ? `${m[1]}@${certo}` : null;
}
