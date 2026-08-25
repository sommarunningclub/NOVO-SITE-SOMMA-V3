import "server-only";
import { getServiceSupabase } from "@/lib/supabase";

/**
 * IDENTIFICAÇÃO POR CPF NA INSCRIÇÃO DA HOME
 *
 * O CPF diz quem a pessoa afirma ser; ele sozinho não prova nada. Listas de CPF
 * circulam aos milhares, e a base do clube guarda nome, e-mail e telefone de
 * mais de seis mil pessoas. Por isso o CPF só abre a porta até a pergunta de
 * confirmação: nenhum dado pessoal sai daqui antes de a pessoa acertar um
 * segundo fator que só ela saberia.
 *
 * O segundo fator é escolhido pelo que existe no registro:
 * — data de nascimento, quando o cadastro tem (4.566 dos 6.361);
 * — os 4 últimos dígitos do WhatsApp, para o resto e para quem só aparece em
 *   `checkins`, tabela que não guarda data de nascimento.
 *
 * O WhatsApp está preenchido em 100% de `cadastro_site`, então sempre há um
 * desafio possível.
 */

/** Ordem das colunas de `cadastro_site`, que é a ordem em que perguntamos. */
export const CAMPOS_ORDEM = [
  "nome_completo",
  "email",
  "cpf",
  "data_nascimento",
  "whatsapp",
  "cep",
  "sexo",
] as const;

export type CampoCadastro = (typeof CAMPOS_ORDEM)[number];

/** O que precisa estar preenchido para o cadastro ser considerado completo. */
export const CAMPOS_OBRIGATORIOS: CampoCadastro[] = [
  "nome_completo",
  "email",
  "cpf",
  "data_nascimento",
  "whatsapp",
  "cep",
  "sexo",
];

export interface RegistroCadastro {
  id: string;
  nome_completo: string | null;
  email: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  whatsapp: string | null;
  cep: string | null;
  sexo: string | null;
}

export type Origem = "cadastro" | "checkin" | "nenhuma";

export interface Identificacao {
  origem: Origem;
  registro: RegistroCadastro | null;
  /** Só existe quando a pessoa veio de `checkins` e ainda não tem cadastro. */
  doCheckin?: Partial<RegistroCadastro>;
}

/** Dígitos e a forma pontuada: a base tem CPF gravado dos dois jeitos. */
export function variantesCpf(cpf: string): { digitos: string; formatado: string } | null {
  const digitos = String(cpf).replace(/\D/g, "");
  if (digitos.length !== 11) return null;
  return {
    digitos,
    formatado: digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
  };
}

/**
 * Procura a pessoa nas duas bases: primeiro no cadastro do site, depois nos
 * check-ins de evento. Quem já apareceu num sábado não deveria ser tratado
 * como estranho.
 */
export async function identificar(cpf: string): Promise<Identificacao> {
  const variantes = variantesCpf(cpf);
  if (!variantes) return { origem: "nenhuma", registro: null };

  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado");

  const chaves = [variantes.digitos, variantes.formatado];

  const { data: cadastros, error: erroCadastro } = await supabase
    .from("cadastro_site")
    .select("id, nome_completo, email, cpf, data_nascimento, whatsapp, cep, sexo")
    .in("cpf", chaves)
    .limit(1);

  if (erroCadastro) throw erroCadastro;

  if (cadastros && cadastros.length > 0) {
    return { origem: "cadastro", registro: cadastros[0] as RegistroCadastro };
  }

  // Sem cadastro: o check-in mais recente é a melhor fonte que temos.
  const { data: checkins, error: erroCheckin } = await supabase
    .from("checkins")
    .select("nome_completo, email, telefone, sexo, data_hora_checkin")
    .in("cpf", chaves)
    .order("data_hora_checkin", { ascending: false })
    .limit(1);

  if (erroCheckin) throw erroCheckin;

  if (checkins && checkins.length > 0) {
    const c = checkins[0] as {
      nome_completo: string | null;
      email: string | null;
      telefone: string | null;
      sexo: string | null;
    };
    return {
      origem: "checkin",
      registro: null,
      doCheckin: {
        nome_completo: c.nome_completo,
        email: c.email,
        whatsapp: c.telefone,
        sexo: normalizarSexo(c.sexo),
        cpf: variantes.formatado,
      },
    };
  }

  return { origem: "nenhuma", registro: null };
}

/** `checkins` grava sexo em formatos variados; o cadastro só aceita dois. */
export function normalizarSexo(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const v = valor.trim().toLowerCase();
  if (v.startsWith("m")) return "masculino";
  if (v.startsWith("f")) return "feminino";
  return null;
}

export type TipoDesafio = "nascimento" | "whatsapp";

/** Qual pergunta de confirmação este registro permite fazer. */
export function escolherDesafio(dados: Partial<RegistroCadastro>): TipoDesafio | null {
  if (dados.data_nascimento) return "nascimento";
  if (dados.whatsapp) return "whatsapp";
  return null;
}

/** Compara datas sem depender do formato de gravação (ISO ou dd/mm/aaaa). */
function mesmaData(a: string, b: string): boolean {
  const so = (v: string) => v.replace(/\D/g, "");
  const dA = so(a);
  const dB = so(b);
  if (dA.length !== 8 || dB.length !== 8) return false;
  // ISO vem aaaammdd; a digitação vem ddmmaaaa
  const invertido = `${dA.slice(4, 8)}${dA.slice(2, 4)}${dA.slice(0, 2)}`;
  return dA === dB || invertido === dB || dA === `${dB.slice(4, 8)}${dB.slice(2, 4)}${dB.slice(0, 2)}`;
}

/**
 * Confere a resposta do segundo fator.
 *
 * Comparação simples de igualdade: os valores comparados são curtos e o custo
 * de uma diferença de tempo aqui é desprezível perto do rate limit por CPF,
 * que é a defesa de verdade contra tentativa em massa.
 */
export function conferirDesafio(
  tipo: TipoDesafio,
  dados: Partial<RegistroCadastro>,
  resposta: string
): boolean {
  const limpa = String(resposta ?? "").trim();
  if (!limpa) return false;

  if (tipo === "nascimento") {
    if (!dados.data_nascimento) return false;
    return mesmaData(dados.data_nascimento, limpa);
  }

  if (!dados.whatsapp) return false;
  const zap = dados.whatsapp.replace(/\D/g, "");
  const digitados = limpa.replace(/\D/g, "");
  if (digitados.length !== 4 || zap.length < 4) return false;
  return zap.slice(-4) === digitados;
}

/** Campos obrigatórios ainda vazios, na ordem das colunas da tabela. */
export function camposFaltantes(dados: Partial<RegistroCadastro>): CampoCadastro[] {
  return CAMPOS_OBRIGATORIOS.filter((campo) => {
    const valor = dados[campo];
    return valor === null || valor === undefined || String(valor).trim() === "";
  });
}

/** Rótulo curto do campo, para a interface e para as mensagens de erro. */
export const ROTULOS: Record<CampoCadastro, string> = {
  nome_completo: "Nome completo",
  email: "E-mail",
  cpf: "CPF",
  data_nascimento: "Data de nascimento",
  whatsapp: "WhatsApp",
  cep: "CEP",
  sexo: "Sexo",
};
