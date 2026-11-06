import { z } from "zod";
import { soDigitos } from "@/lib/dexcomplica-love-run/schema";

/** Regras e textos sem dependência de servidor: tela e rota usam os mesmos. */

export const CAMINHO_CORRE = "/dexcomplica/vem-correr-comigo";
export const API_CORRE = "/api/dexcomplica-love-run/corre";
export const FOTO_MAX_BYTES = 2 * 1024 * 1024;

/** Aceita "@usuario", "usuario" e o link do perfil. */
export function normalizarInstagram(v: string): string {
  return v
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "")
    .toLowerCase();
}

/** Tira o 55 de quem colou o número completo. */
export function normalizarWhatsapp(v: string): string {
  const d = soDigitos(v);
  return d.length >= 12 && d.startsWith("55") ? d.slice(2) : d;
}

export const perfilSchema = z.object({
  preferencia: z.union([z.literal(2), z.literal(3), z.literal(4)], { message: "Escolha como você quer descomplicar" }),
  instagram: z
    .string()
    .optional()
    .transform((v) => normalizarInstagram(v ?? ""))
    .refine((v) => v === "" || /^[a-z0-9._]{1,30}$/.test(v), { message: "Confira seu Instagram" }),
  whatsapp: z
    .string()
    .optional()
    .transform((v) => normalizarWhatsapp(v ?? ""))
    .refine((v) => v === "" || /^[1-9][0-9]{9,10}$/.test(v), { message: "Confira o número com DDD" }),
  whatsapp_publico: z.boolean().optional().default(false),
  genero: z.enum(["masculino", "feminino", "outro"]).optional(),
  termos: z.boolean().optional(),
});

export const OPCOES_GRUPO = [
  { valor: 2, nome: "Dupla", frase: "Quero encontrar uma pessoa para descomplicar comigo.", detalhe: "Até 2 pessoas. A conexão só acontece com aprovação." },
  { valor: 3, nome: "Trio", frase: "Quero descomplicar com até mais duas pessoas.", detalhe: "Até 3 pessoas. Quem for compatível e quiser pode entrar direto." },
  { valor: 4, nome: "Quarteto", frase: "Quero correr de 4.", detalhe: "Até 4 pessoas. Quem for compatível e quiser pode entrar direto." },
] as const;

export const nomePreferencia = (n: number) => OPCOES_GRUPO.find((o) => o.valor === n)?.nome ?? "";

export const MENSAGENS = {
  perfilCriado: "Pronto! Agora é só descomplicar.",
  semGrupo: "Seu próximo corre pode começar com uma conexão.",
  conviteEnviado: "Convite enviado! Agora é só esperar.",
  conviteRecebido: "Alguém quer descomplicar com você.",
  grupoCompleto: "Esse grupo já está completo.",
  distancia: "Essa galera vai correr outra distância.",
  semResultado: "Ainda não encontramos ninguém com esses filtros.",
  rede: "Não conseguimos concluir agora. Tente novamente.",
  fotoObrigatoria: "A foto é obrigatória. Faz parte da brincadeira!",
} as const;

const ERROS: Record<string, string> = {
  distancia: MENSAGENS.distancia,
  grupo_completo: MENSAGENS.grupoCompleto,
  ja_em_grupo: "Você já está em um grupo. Saia dele antes de entrar em outro.",
  composicao: "Esse grupo não tem vaga compatível com a composição do evento.",
  preferencia: "Esse grupo já passou do tamanho que você escolheu.",
  preferencia_grupo: "Seu grupo atual é maior do que essa opção. Saia do grupo antes de mudar.",
  perfil_indisponivel: "Essa pessoa não está mais disponível.",
  grupo_indisponivel: "Esse grupo não existe mais.",
  convite_invalido: "Esse convite não vale mais.",
  proprio: "Esse é o seu perfil.",
  nao_encontrado: "Não encontramos esse link.",
  texto: "Escreva para quem é e a mensagem, com até 280 caracteres.",
  contato_no_texto: "Não coloque telefone nem documento no recado.",
  limite_recados: "Você já mandou muitos recados. Tente de novo mais tarde.",
  formato: "Use uma foto em JPEG, PNG ou WebP.",
  tamanho: "Essa foto é grande demais. Escolha outra.",
  sem_foto: MENSAGENS.fotoObrigatoria,
  mensagem_invalida: "Essa mensagem não dá mais para alterar.",
};

export const mensagemDeErro = (codigo?: string) => (codigo && ERROS[codigo]) || MENSAGENS.rede;

export const linkInstagram = (u: string) => `https://instagram.com/${u}`;
export const linkWhatsapp = (n: string) => `https://wa.me/55${n}`;
