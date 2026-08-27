import {
  atletaSchema,
  capitaoSchema,
  crewSchema,
  responsavelSchema,
} from "@/lib/o-longao/schema";
import { FORMATO } from "@/lib/o-longao/config";
import { categoriasAtivas, atletaTemDado, ROTULO_CATEGORIA, type FormValues } from "./tipos";

/**
 * Validação por etapa.
 *
 * O `inscricaoSchema` inteiro só faz sentido no envio: ele exige as duas
 * equipes completas e não sabe em que etapa a pessoa está. Aqui as peças do
 * mesmo schema (crewSchema, atletaSchema, ...) são aplicadas ao pedaço que a
 * etapa cobre, então a regra é uma só, e o servidor revalida tudo de novo com
 * o schema completo. Nenhuma regra é reescrita, só recortada.
 *
 * Erros saem como um mapa de caminho pontilhado ("equipes.masculino.atletas.3.cpf")
 * porque é assim que a UI encontra o campo e o wizard sabe para qual etapa voltar.
 */
export type Erros = Record<string, string>;

function coletar(
  resultado: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } },
  prefixo: string,
  destino: Erros
): void {
  if (resultado.success || !resultado.error) return;
  for (const issue of resultado.error.issues) {
    const caminho = [prefixo, ...issue.path.map(String)].filter(Boolean).join(".");
    // primeira mensagem por campo vence: a mais específica costuma vir antes
    if (!destino[caminho]) destino[caminho] = issue.message;
  }
}

export function validarCrew(v: FormValues): Erros {
  const erros: Erros = {};
  coletar(crewSchema.safeParse(v.crew), "crew", erros);
  return erros;
}

export function validarResponsavel(v: FormValues): Erros {
  const erros: Erros = {};
  coletar(responsavelSchema.safeParse(v.responsavel), "responsavel", erros);
  coletar(capitaoSchema.safeParse(v.capitao), "capitao", erros);
  return erros;
}

/** Titulares: os 8 de cada equipe ativa, mais a checagem de CPF repetido. */
export function validarAtletas(v: FormValues): Erros {
  const erros: Erros = {};
  for (const categoria of categoriasAtivas(v.crew.categoria)) {
    const atletas = v.equipes[categoria].atletas;

    /*
      A contagem é checada aqui e não só no servidor. `normalizarRascunho`
      garante o tamanho na entrada, mas se um estado curto escapasse, o
      formulário desenharia menos cartões, deixaria avançar, e o 400 do
      servidor devolveria a pessoa a uma etapa sem nenhum jeito de cadastrar
      o atleta que falta. Melhor barrar antes, com a mensagem certa.
    */
    if (atletas.length !== FORMATO.titulares) {
      erros[`equipes.${categoria}.atletas`] =
        `A equipe precisa de exatamente ${FORMATO.titulares} atletas titulares`;
    }

    atletas.forEach((atleta, i) => {
      coletar(atletaSchema.safeParse(atleta), `equipes.${categoria}.atletas.${i}`, erros);
    });
  }
  Object.assign(erros, validarCpfsRepetidos(v));
  return erros;
}

/** Reservas: opcionais, mas a que foi começada precisa estar completa. */
export function validarReservas(v: FormValues): Erros {
  const erros: Erros = {};
  for (const categoria of categoriasAtivas(v.crew.categoria)) {
    const reservas = v.equipes[categoria].reservas;
    if (reservas.length > FORMATO.reservasMax) {
      erros[`equipes.${categoria}.reservas`] = `No máximo ${FORMATO.reservasMax} reservas por equipe`;
    }
    reservas.forEach((reserva, i) => {
      if (!atletaTemDado(reserva)) {
        erros[`equipes.${categoria}.reservas.${i}.nome`] =
          "Preencha os dados da reserva ou remova o cartão";
        return;
      }
      coletar(atletaSchema.safeParse(reserva), `equipes.${categoria}.reservas.${i}`, erros);
    });
  }
  Object.assign(erros, validarCpfsRepetidos(v));
  return erros;
}

/**
 * Um CPF corre por uma única equipe. O banco garante isso com índice único;
 * aqui a checagem existe para a pessoa descobrir antes de enviar, e não
 * depois de preencher 80 campos.
 */
export function validarCpfsRepetidos(v: FormValues): Erros {
  const erros: Erros = {};
  const vistos = new Map<string, string>();

  for (const categoria of categoriasAtivas(v.crew.categoria)) {
    for (const grupo of ["atletas", "reservas"] as const) {
      v.equipes[categoria][grupo].forEach((atleta, i) => {
        const digitos = atleta.cpf.replace(/\D/g, "");
        if (digitos.length !== 11) return;
        const caminho = `equipes.${categoria}.${grupo}.${i}.cpf`;
        const anterior = vistos.get(digitos);
        if (anterior) {
          erros[caminho] = "Este CPF já aparece em outro atleta da inscrição";
        } else {
          vistos.set(digitos, caminho);
        }
      });
    }
  }
  return erros;
}

export function validarAceites(v: FormValues): Erros {
  const erros: Erros = {};
  if (!v.aceite_regulamento) erros.aceite_regulamento = "É necessário aceitar o regulamento";
  if (!v.aceite_imagem) erros.aceite_imagem = "É necessário autorizar o uso de imagem";
  if (!v.aceite_veracidade) erros.aceite_veracidade = "É necessário confirmar a veracidade dos dados";
  return erros;
}

/** Valida a etapa pedida. A 5 revalida tudo, porque é ela que envia. */
export function validarEtapa(etapa: number, v: FormValues): Erros {
  switch (etapa) {
    case 1:
      return validarCrew(v);
    case 2:
      return validarResponsavel(v);
    case 3:
      return validarAtletas(v);
    case 4:
      return validarReservas(v);
    case 5:
      return {
        ...validarCrew(v),
        ...validarResponsavel(v),
        ...validarAtletas(v),
        ...validarReservas(v),
        ...validarAceites(v),
      };
    default:
      return {};
  }
}

/** Em que etapa mora um caminho de erro. Usado para levar a pessoa até ele. */
export function etapaDoCampo(caminho: string): number {
  if (caminho.startsWith("crew")) return 1;
  if (caminho.startsWith("responsavel") || caminho.startsWith("capitao")) return 2;
  if (caminho.includes(".reservas.")) return 4;
  if (caminho.startsWith("equipes")) return 3;
  return 5;
}

/** Quantos titulares de uma equipe já passam no schema. Alimenta o contador. */
export function contarCompletos(v: FormValues, categoria: keyof FormValues["equipes"]): number {
  return v.equipes[categoria].atletas.filter((a) => atletaSchema.safeParse(a).success).length;
}

export function rotuloCategoria(categoria: keyof FormValues["equipes"]): string {
  return ROTULO_CATEGORIA[categoria];
}
