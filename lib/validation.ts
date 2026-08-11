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

// Formulário "Seja Parceiro" (/seja-parceiro): alimenta `candidatos_parceiros`
// e cria o lead no Kanban do CRM da gestão (`crm_leads`).
export const partnerSchema = z
  .object({
    nome: z.string().trim().min(3, "Informe seu nome completo.").max(120, "Nome muito longo."),
    email: z.string().trim().toLowerCase().email("E-mail inválido."),
    telefone: z
      .string()
      .trim()
      .refine((v) => v.replace(/\D/g, "").length >= 10, "Telefone inválido."),
    tipo_documento: z.enum(["cpf", "cnpj"], { message: "Selecione CPF ou CNPJ." }),
    documento: z.string().trim().min(1, "Informe o número do documento."),
    nome_da_empresa: z
      .string()
      .trim()
      .min(2, "Informe o nome da empresa.")
      .max(160, "Nome da empresa muito longo."),
    instagram: z.string().trim().min(2, "Informe o Instagram."),
    descricao: z
      .string()
      .trim()
      .min(50, "Descreva a parceria em pelo menos 50 caracteres.")
      .max(2000, "Descrição muito longa."),
    // Preenchidos automaticamente pela consulta de CNPJ — opcionais.
    razao_social: z.string().trim().max(200).nullish(),
    nome_fantasia: z.string().trim().max(200).nullish(),
    atividade_principal: z.string().trim().max(300).nullish(),
    // Honeypot anti-spam. Aceita qualquer valor no schema de propósito: quem
    // decide é a rota, que responde 200 silenciosamente quando vem preenchido
    // (rejeitar aqui devolveria um 400 e entregaria a armadilha ao bot).
    website: z.string().optional(),
  })
  .refine(
    (d) =>
      d.tipo_documento === "cpf"
        ? isValidCpf(d.documento)
        : // CNPJ: apenas o comprimento. Não validamos dígito verificador porque o
          // CNPJ alfanumérico (2026+) quebraria o cálculo numérico tradicional.
          d.documento.replace(/\D/g, "").length === 14,
    { message: "Documento inválido.", path: ["documento"] }
  );

export type PartnerInput = z.infer<typeof partnerSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Candidatura a vaga (/trabalhe-conosco-vagas) → tabela `candidatos_vagas`
// ─────────────────────────────────────────────────────────────────────────────

export const SEMESTRES = [
  "1º semestre",
  "2º semestre",
  "3º semestre",
  "4º semestre",
  "5º semestre",
  "6º semestre",
  "7º semestre",
  "8º semestre",
  "9º semestre",
  "10º semestre",
] as const;

// Limites do currículo. Compartilhados: o client barra antes de subir e a rota
// revalida — o check do client é conveniência, não segurança.
export const CURRICULO_MAX_BYTES = 5 * 1024 * 1024;
export const CURRICULO_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
export const CURRICULO_ACCEPT = ".pdf,.doc,.docx";

export const vagaCandidaturaSchema = z.object({
  vaga_slug: z.string().trim().min(1, "Vaga inválida.").max(80),
  vaga_titulo: z.string().trim().min(1, "Vaga inválida.").max(160),
  nome: z.string().trim().min(3, "Informe seu nome completo.").max(120, "Nome muito longo."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  telefone: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Telefone inválido."),
  data_nascimento: z
    .string()
    .trim()
    .refine((v) => isValidBirthDate(v), "Data de nascimento inválida.")
    // Estágio exige vínculo com instituição de ensino superior; abaixo de 16 o
    // cadastro seria de menor aprendiz, que não é o caso desta vaga.
    .refine((v) => isAtLeastYearsOld(v, 16), "É preciso ter ao menos 16 anos."),
  cep: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length === 8, "CEP inválido."),
  // Preenchidos pela BrasilAPI. Opcionais de propósito: se a API estiver fora,
  // o candidato ainda consegue enviar a candidatura.
  logradouro: z.string().trim().max(200).optional().or(z.literal("")),
  bairro: z.string().trim().max(120).optional().or(z.literal("")),
  cidade: z.string().trim().max(120).optional().or(z.literal("")),
  estado: z.string().trim().max(2).optional().or(z.literal("")),
  complemento: z.string().trim().max(160, "Complemento muito longo.").optional().or(z.literal("")),
  instituicao: z
    .string()
    .trim()
    .min(2, "Informe a faculdade ou instituição.")
    .max(160, "Nome da instituição muito longo."),
  semestre: z.enum(SEMESTRES, { message: "Selecione o semestre." }),
  indicado: z.boolean(),
  indicado_por: z.string().trim().max(120, "Nome muito longo.").optional().or(z.literal("")),
  consent_lgpd: z.literal(true, {
    message: "É preciso autorizar o uso dos seus dados para o processo seletivo.",
  }),
  // Honeypot anti-spam. Aceita qualquer valor aqui de propósito: quem decide é a
  // rota, que responde 200 silenciosamente quando vem preenchido.
  website: z.string().optional(),
}).refine((d) => !d.indicado || Boolean(d.indicado_por?.trim()), {
  message: "Informe quem indicou você.",
  path: ["indicado_por"],
});

export type VagaCandidaturaInput = z.infer<typeof vagaCandidaturaSchema>;

// Idade mínima a partir de DD/MM/AAAA.
export function isAtLeastYearsOld(value: string, years: number): boolean {
  const iso = brDateToISO(value);
  if (!iso) return false;
  const birth = new Date(`${iso}T00:00:00`);
  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - years);
  return birth <= limite;
}

// Valida o arquivo do currículo. Retorna a mensagem de erro ou null.
export function validateCurriculo(file: File | null): string | null {
  if (!file || file.size === 0) return "Anexe seu currículo em PDF, DOC ou DOCX.";
  if (file.size > CURRICULO_MAX_BYTES) return "O currículo deve ter no máximo 5MB.";

  const mimeOk = (CURRICULO_MIME_TYPES as readonly string[]).includes(file.type);
  // Alguns navegadores/SOs entregam type vazio; nesse caso caímos na extensão.
  const extOk = /\.(pdf|doc|docx)$/i.test(file.name);
  if (!mimeOk && !extOk) return "Formato não aceito. Envie PDF, DOC ou DOCX.";

  return null;
}

// Marcas de acento que sobram após normalize("NFD"). Construído por escape para
// não depender de caracteres invisíveis no código-fonte.
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

// Nome de arquivo seguro para o Storage: sem acento, espaço ou caractere solto.
export function slugifyFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "pdf";

  const safeBase =
    base
      .normalize("NFD")
      .replace(COMBINING_MARKS, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .toLowerCase() || "curriculo";

  return `${safeBase}.${ext.replace(/[^a-z0-9]/g, "") || "pdf"}`;
}

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

// CNPJ (00.000.000/0000-00)
export function maskCnpj(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
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
