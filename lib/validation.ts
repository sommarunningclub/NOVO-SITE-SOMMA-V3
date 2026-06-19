import { z } from "zod";

// Formulário de cadastro (mesmos campos do formulário antigo):
// Nome, E-mail, CPF, Data de nascimento, CEP, WhatsApp, Sexo + aceites.
export const signupSchema = z.object({
  nome_completo: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo.")
    .max(120, "Nome muito longo."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  cpf: z
    .string()
    .trim()
    .refine((v) => isValidCpf(v), "CPF inválido."),
  data_nascimento: z
    .string()
    .trim()
    .refine((v) => isValidBirthDate(v), "Data de nascimento inválida."),
  cep: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length === 8, "CEP inválido."),
  whatsapp: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length >= 10, "WhatsApp inválido."),
  sexo: z.enum(["masculino", "feminino"], {
    message: "Selecione uma opção.",
  }),
  consent_lgpd: z.literal(true, {
    message: "É preciso aceitar o Termo de Consentimento de Dados (LGPD).",
  }),
  consent_imagem: z.literal(true, {
    message: "É preciso aceitar o Termo de Uso de Imagem.",
  }),
  // Honeypot anti-spam: deve vir vazio.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type SignupInput = z.infer<typeof signupSchema>;

// Máscara e validação de CPF (frontend + backend)
export function maskCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function isValidCpf(value: string): boolean {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (factor: number) => {
    let sum = 0;
    for (let i = 0; i < factor - 1; i++) sum += Number(cpf[i]) * (factor - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(10) === Number(cpf[9]) && calc(11) === Number(cpf[10]);
}

// Data de nascimento (DD/MM/AAAA)
export function maskDate(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function isValidBirthDate(value: string): boolean {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  if (year < 1900 || year > 2025) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

// Converte DD/MM/AAAA -> AAAA-MM-DD (para coluna date no banco)
export function brDateToISO(value: string): string | null {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

// CEP (00000-000)
export function maskCep(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

// Máscaras BR (frontend)
export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
