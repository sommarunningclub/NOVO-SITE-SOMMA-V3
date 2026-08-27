import { FORMATO } from "@/lib/o-longao/config";
import type { Categoria } from "@/lib/o-longao/config";
import type { CategoriaInscricao } from "@/lib/o-longao/schema";

/**
 * Forma do formulário na tela.
 *
 * De propósito NÃO é o `z.input` do `inscricaoSchema`: no formulário as duas
 * equipes existem sempre (o react-hook-form precisa de campos estáveis para
 * não perder valor quando a pessoa troca de categoria e volta atrás), e só na
 * hora do envio a equipe que não vale é descartada. Tudo é string porque é
 * isso que um input devolve; a conversão fica com o zod.
 */

export interface AtletaForm {
  nome: string;
  cpf: string;
  nascimento: string;
  telefone: string;
  email: string;
  instagram: string;
  camiseta: string;
  emergencia_nome: string;
  emergencia_telefone: string;
}

export interface EquipeForm {
  atletas: AtletaForm[];
  reservas: AtletaForm[];
}

export interface FormValues {
  crew: {
    nome: string;
    instagram: string;
    cidade: string;
    /** "" enquanto a pessoa não escolheu: o zod recusa e a mensagem aparece. */
    categoria: CategoriaInscricao | "";
  };
  responsavel: {
    nome: string;
    cpf: string;
    telefone: string;
    whatsapp: string;
    email: string;
  };
  capitao: {
    nome: string;
    telefone: string;
    email: string;
  };
  /** Atalho de UI: copia o responsável para o capitão e trava os campos. */
  capitaoEhResponsavel: boolean;
  equipes: Record<Categoria, EquipeForm>;
  aceite_regulamento: boolean;
  aceite_imagem: boolean;
  aceite_veracidade: boolean;
}

export function atletaVazio(): AtletaForm {
  return {
    nome: "",
    cpf: "",
    nascimento: "",
    telefone: "",
    email: "",
    instagram: "",
    camiseta: "",
    emergencia_nome: "",
    emergencia_telefone: "",
  };
}

function equipeVazia(): EquipeForm {
  return {
    atletas: Array.from({ length: FORMATO.titulares }, atletaVazio),
    reservas: [],
  };
}

export function valoresIniciais(): FormValues {
  return {
    crew: { nome: "", instagram: "", cidade: "Brasília", categoria: "" },
    responsavel: { nome: "", cpf: "", telefone: "", whatsapp: "", email: "" },
    capitao: { nome: "", telefone: "", email: "" },
    capitaoEhResponsavel: false,
    equipes: { masculino: equipeVazia(), feminino: equipeVazia() },
    aceite_regulamento: false,
    aceite_imagem: false,
    aceite_veracidade: false,
  };
}

/**
 * Devolve um `FormValues` íntegro a partir de um rascunho salvo.
 *
 * O que sai do localStorage não é confiável: pode ter vindo de uma versão
 * anterior do formulário, de outra aba a meio caminho, ou de storage editado.
 * Um espalhamento raso deixaria passar `equipes` sem a chave `feminino` (o
 * render quebra ao acessar `.atletas`) ou uma equipe com menos de 8 posições
 * (o formulário desenharia 3 cartões e o servidor recusaria a inscrição, sem
 * que a tela oferecesse um jeito de adicionar o resto).
 *
 * Aqui cada camada é reconstruída sobre o estado inicial: campo que falta
 * volta vazio, equipe curta é completada até os titulares, e sobra é cortada.
 */
export function normalizarRascunho(bruto: unknown): FormValues {
  const base = valoresIniciais();
  if (!bruto || typeof bruto !== "object") return base;
  const v = bruto as Partial<FormValues>;

  const texto = (valor: unknown, padrao = "") =>
    typeof valor === "string" ? valor : padrao;

  const atleta = (valor: unknown): AtletaForm => {
    const a = (valor ?? {}) as Partial<AtletaForm>;
    return {
      nome: texto(a.nome),
      cpf: texto(a.cpf),
      nascimento: texto(a.nascimento),
      telefone: texto(a.telefone),
      email: texto(a.email),
      instagram: texto(a.instagram),
      camiseta: texto(a.camiseta),
      emergencia_nome: texto(a.emergencia_nome),
      emergencia_telefone: texto(a.emergencia_telefone),
    };
  };

  const equipe = (valor: unknown): EquipeForm => {
    const e = (valor ?? {}) as Partial<EquipeForm>;
    const salvos = Array.isArray(e.atletas) ? e.atletas : [];
    return {
      // sempre exatamente `titulares`: completa o que falta, descarta o excesso
      atletas: Array.from({ length: FORMATO.titulares }, (_, i) => atleta(salvos[i])),
      reservas: (Array.isArray(e.reservas) ? e.reservas : [])
        .slice(0, FORMATO.reservasMax)
        .map(atleta),
    };
  };

  const categoria = (["masculino", "feminino", "ambas"] as const).find(
    (c) => c === v.crew?.categoria
  );

  return {
    crew: {
      nome: texto(v.crew?.nome),
      instagram: texto(v.crew?.instagram),
      cidade: texto(v.crew?.cidade, base.crew.cidade),
      categoria: categoria ?? "",
    },
    responsavel: {
      nome: texto(v.responsavel?.nome),
      cpf: texto(v.responsavel?.cpf),
      telefone: texto(v.responsavel?.telefone),
      whatsapp: texto(v.responsavel?.whatsapp),
      email: texto(v.responsavel?.email),
    },
    capitao: {
      nome: texto(v.capitao?.nome),
      telefone: texto(v.capitao?.telefone),
      email: texto(v.capitao?.email),
    },
    capitaoEhResponsavel: v.capitaoEhResponsavel === true,
    equipes: {
      masculino: equipe(v.equipes?.masculino),
      feminino: equipe(v.equipes?.feminino),
    },
    // os aceites nunca são restaurados: consentimento se dá na hora, não se herda
    aceite_regulamento: false,
    aceite_imagem: false,
    aceite_veracidade: false,
  };
}

/** Quais equipes a categoria escolhida exige. Sem escolha, nenhuma. */
export function categoriasAtivas(categoria: FormValues["crew"]["categoria"]): Categoria[] {
  if (categoria === "ambas") return ["masculino", "feminino"];
  if (categoria === "masculino" || categoria === "feminino") return [categoria];
  return [];
}

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  masculino: "EQUIPE MASCULINA",
  feminino: "EQUIPE FEMININA",
};

/** Um atleta "começou a ser preenchido"? Usado para validar reservas parciais. */
export function atletaTemDado(a: AtletaForm): boolean {
  return Object.entries(a).some(([chave, valor]) => chave !== "instagram" && valor.trim() !== "");
}

export const ETAPAS = [
  { n: 1, titulo: "SUA CREW" },
  { n: 2, titulo: "RESPONSÁVEL" },
  { n: 3, titulo: "ATLETAS" },
  { n: 4, titulo: "RESERVAS" },
  { n: 5, titulo: "REVISÃO" },
  { n: 6, titulo: "CONFIRMAÇÃO" },
] as const;

export const RASCUNHO_KEY = "lgo_inscricao_v1";
