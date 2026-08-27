import { z } from "zod";
import { isValidCPF } from "@/lib/cpf";
import { checarCelularBR, normalizarTelefoneBR, TELEFONE_MSG } from "@/lib/telefone";
import { FORMATO } from "./config";
import { isNomeCompleto, normalizarNome } from "./nome";

export const onlyDigits = (v: string) => String(v ?? "").replace(/\D/g, "");

/** CPF normalizado: 11 dígitos, sem máscara. É a chave de unicidade do evento. */
export const cpfSchema = z
  .string()
  .transform(onlyDigits)
  .refine((v) => v.length === 11, { message: "CPF incompleto, precisa ter 11 dígitos" })
  .refine(isValidCPF, { message: "CPF inválido, confira os dígitos" });

/** Celular BR: DDD da Anatel + nono dígito + faixa 6 a 9. Fixo não passa. */
export const phoneSchema = z
  .string()
  .transform(normalizarTelefoneBR)
  .superRefine((v, ctx) => {
    const r = checarCelularBR(v);
    if (!r.ok) ctx.addIssue({ code: "custom", message: TELEFONE_MSG[r.motivo] });
  });

const IDADE_MIN = 14;
const IDADE_MAX = 100;

/** Mostra dd/mm/aaaa enquanto a pessoa digita. Aceita ISO na volta da validação. */
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
  .refine(
    (v) => {
      const [y, m, d] = v.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return false;
      const anos = (Date.now() - dt.getTime()) / (365.25 * 24 * 3600 * 1000);
      return anos >= IDADE_MIN && anos <= IDADE_MAX;
    },
    { message: `Data de nascimento inválida (idade entre ${IDADE_MIN} e ${IDADE_MAX} anos)` }
  );

export const nomeSchema = z
  .string()
  .transform(normalizarNome)
  .refine(isNomeCompleto, { message: "Escreva nome e sobrenome" });

export const emailSchema = z.string().trim().toLowerCase().email("E-mail inválido").max(160);

/** Instagram gravado sem @ e sem URL, só o handle. Campo opcional aceita vazio. */
export const instagramSchema = z
  .string()
  .trim()
  .transform((v) =>
    v
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/^@/, "")
      .replace(/\/+$/, "")
      .toLowerCase()
  )
  .refine((v) => v === "" || /^[a-z0-9._]{1,30}$/.test(v), { message: "Instagram inválido, use só o @usuario" });

export const CAMISETAS = ["PP", "P", "M", "G", "GG", "XG"] as const;
export const CATEGORIAS_INSCRICAO = ["masculino", "feminino", "ambas"] as const;
export type CategoriaInscricao = (typeof CATEGORIAS_INSCRICAO)[number];

export const atletaSchema = z.object({
  nome: nomeSchema,
  cpf: cpfSchema,
  nascimento: birthDateSchema,
  telefone: phoneSchema,
  email: emailSchema,
  instagram: instagramSchema.optional().default(""),
  camiseta: z.enum(CAMISETAS, { message: "Escolha o tamanho da camiseta" }),
  emergencia_nome: nomeSchema,
  emergencia_telefone: phoneSchema,
});

export type AtletaInput = z.input<typeof atletaSchema>;
export type Atleta = z.output<typeof atletaSchema>;

export const equipeSchema = z.object(
  {
    atletas: z
      .array(atletaSchema)
      .length(FORMATO.titulares, `A equipe precisa de exatamente ${FORMATO.titulares} atletas titulares`),
    reservas: z
      .array(atletaSchema)
      .max(FORMATO.reservasMax, `No máximo ${FORMATO.reservasMax} reservas por equipe`)
      .default([]),
  },
  { error: "Cadastre os atletas da equipe" }
);

/*
 * O segundo argumento dá a mensagem de quando o bloco INTEIRO falta.
 * Sem ele o zod responde "Invalid input: expected object, received undefined",
 * que é o texto que a pessoa veria na tela se o corpo chegasse incompleto.
 */
export const crewSchema = z.object(
  {
    nome: z.string().trim().min(2, "Dê um nome à crew").max(80),
    instagram: instagramSchema.refine((v) => v !== "", { message: "Informe o Instagram da crew" }),
    cidade: z.string().trim().min(2, "Informe a cidade").max(80),
    categoria: z.enum(CATEGORIAS_INSCRICAO, { message: "Escolha a categoria" }),
  },
  { error: "Preencha os dados da crew" }
);

export const responsavelSchema = z.object(
  {
    nome: nomeSchema,
    cpf: cpfSchema,
    telefone: phoneSchema,
    whatsapp: phoneSchema,
    email: emailSchema,
  },
  { error: "Preencha os dados do responsável" }
);

export const capitaoSchema = z.object(
  {
    nome: nomeSchema,
    telefone: phoneSchema,
    email: emailSchema,
  },
  { error: "Preencha os dados do capitão" }
);

const utmSchema = {
  utm_source: z.string().max(120).optional(),
  utm_medium: z.string().max(120).optional(),
  utm_campaign: z.string().max(120).optional(),
  utm_term: z.string().max(120).optional(),
  utm_content: z.string().max(120).optional(),
  referral: z.string().max(300).optional(),
};

/**
 * A inscrição completa. Categoria "ambas" exige as duas equipes; as demais,
 * exatamente a sua. CPF não se repete dentro da inscrição: cada atleta corre
 * por uma única equipe (a unicidade entre crews é o índice do banco).
 */
export const inscricaoSchema = z
  .object({
    crew: crewSchema,
    responsavel: responsavelSchema,
    capitao: capitaoSchema,
    equipes: z.object(
      {
        masculino: equipeSchema.optional(),
        feminino: equipeSchema.optional(),
      },
      { error: "Cadastre a equipe" }
    ),
    aceite_regulamento: z.literal(true, { message: "É necessário aceitar o regulamento" }),
    aceite_imagem: z.literal(true, { message: "É necessário autorizar o uso de imagem" }),
    aceite_veracidade: z.literal(true, { message: "É necessário confirmar a veracidade dos dados" }),
    ...utmSchema,
    /** Honeypot: humano não vê, bot preenche. Passa no schema de propósito. */
    website: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    const quer = data.crew.categoria;
    const temM = Boolean(data.equipes.masculino);
    const temF = Boolean(data.equipes.feminino);

    if ((quer === "masculino" || quer === "ambas") && !temM) {
      ctx.addIssue({ code: "custom", path: ["equipes", "masculino"], message: "Cadastre a equipe masculina" });
    }
    if ((quer === "feminino" || quer === "ambas") && !temF) {
      ctx.addIssue({ code: "custom", path: ["equipes", "feminino"], message: "Cadastre a equipe feminina" });
    }
    if (quer === "masculino" && temF) {
      ctx.addIssue({ code: "custom", path: ["equipes", "feminino"], message: "Categoria masculina não leva equipe feminina" });
    }
    if (quer === "feminino" && temM) {
      ctx.addIssue({ code: "custom", path: ["equipes", "masculino"], message: "Categoria feminina não leva equipe masculina" });
    }

    const cpfs = new Map<string, string>();
    const grupos: Array<[string, Atleta[] | undefined]> = [
      ["equipes.masculino.atletas", data.equipes.masculino?.atletas],
      ["equipes.masculino.reservas", data.equipes.masculino?.reservas],
      ["equipes.feminino.atletas", data.equipes.feminino?.atletas],
      ["equipes.feminino.reservas", data.equipes.feminino?.reservas],
    ];
    for (const [caminho, lista] of grupos) {
      (lista ?? []).forEach((a, i) => {
        const onde = `${caminho}.${i}`;
        const antes = cpfs.get(a.cpf);
        if (antes) {
          ctx.addIssue({
            code: "custom",
            path: [...caminho.split("."), i, "cpf"],
            message: "Este CPF já aparece em outro atleta da inscrição",
          });
        } else {
          cpfs.set(a.cpf, onde);
        }
      });
    }
  });

export type InscricaoInput = z.input<typeof inscricaoSchema>;
export type Inscricao = z.output<typeof inscricaoSchema>;
