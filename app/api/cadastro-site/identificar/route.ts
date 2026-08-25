import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createSignedToken } from "@/lib/auth/session-token";
import {
  camposFaltantes,
  conferirDesafio,
  escolherDesafio,
  identificar,
  variantesCpf,
  type RegistroCadastro,
  type TipoDesafio,
} from "@/lib/cadastro/identificacao";

export const dynamic = "force-dynamic";

/**
 * Identificação da pessoa na inscrição da home, em dois tempos.
 *
 * Tempo 1 (só o CPF) responde apenas se existe alguém e qual pergunta de
 * confirmação será feita. Nenhum nome, e-mail ou telefone sai daqui: com CPF
 * sozinho, esta rota não passa de um oráculo booleano, igual à `verify-cpf`.
 *
 * Tempo 2 (CPF + resposta do desafio) é o que abre o cadastro. Acertando, a
 * resposta traz os dados e um token curto e assinado que autoriza a
 * atualização — sem ele, `/atualizar` não aceita nada.
 *
 * O relógio é fixo nos dois tempos para "achei" e "não achei" saírem
 * indistinguíveis, e a cota por CPF impede varredura de datas de nascimento.
 */

const ATRASO_MS = 320;

/**
 * Existe segredo para assinar o token?
 *
 * A checagem é feita aqui, com as mesmas variáveis que `getAuthSecret` aceita,
 * em vez de importar um helper: assim esta rota funciona tanto na versão de
 * `session-token` que está em produção quanto na que endurece o segredo e
 * remove o encaixe na chave do banco. Uma coisa a menos para quebrar no dia
 * em que essa mudança for publicada.
 */
function temSegredoDeAssinatura(): boolean {
  return Boolean(
    process.env.AUTH_SECRET ||
      process.env.INSIDER_SESSION_SECRET ||
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
const TOKEN_VALIDADE_S = 900; // 15 minutos para completar o cadastro

async function responder(inicio: number, corpo: Record<string, unknown>, status = 200) {
  const resta = ATRASO_MS - (Date.now() - inicio);
  if (resta > 0) await new Promise((r) => setTimeout(r, resta));
  return NextResponse.json(corpo, { status });
}

/** Dica do desafio: o suficiente para lembrar, nunca a resposta. */
function dicaDe(tipo: TipoDesafio, dados: Partial<RegistroCadastro>): string {
  if (tipo === "nascimento") return "";
  const zap = (dados.whatsapp ?? "").replace(/\D/g, "");
  const ddd = zap.length >= 10 ? zap.slice(zap.length - 11, zap.length - 9) || zap.slice(0, 2) : "";
  return ddd ? `Número com DDD ${ddd}` : "";
}

export async function POST(request: NextRequest) {
  const inicio = Date.now();

  try {
    const ip = clientIp(request);
    const cota = await rateLimit(`identificar:${ip}`, 30, 600);
    if (!cota.ok) {
      return NextResponse.json(
        { erro: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(cota.retryAfterSeconds) } }
      );
    }

    const body = (await request.json()) as { cpf?: string; resposta?: string };
    const variantes = variantesCpf(body.cpf ?? "");
    if (!variantes) {
      return responder(inicio, { erro: "CPF inválido." }, 400);
    }

    const achado = await identificar(variantes.digitos);
    const dados: Partial<RegistroCadastro> =
      achado.origem === "cadastro" ? (achado.registro as RegistroCadastro) : achado.doCheckin ?? {};

    // ── Tempo 1: existe alguém com este CPF? ────────────────────────────────
    if (body.resposta === undefined) {
      if (achado.origem === "nenhuma") {
        return responder(inicio, { situacao: "novo" });
      }

      const desafio = escolherDesafio(dados);
      if (!desafio) {
        // Registro velho sem nascimento e sem telefone: não há como confirmar
        // que é a pessoa, então segue como cadastro novo.
        return responder(inicio, { situacao: "novo" });
      }

      return responder(inicio, {
        situacao: "confirmar",
        desafio,
        dica: dicaDe(desafio, dados),
      });
    }

    // ── Tempo 2: a resposta do desafio confere? ─────────────────────────────
    const cotaCpf = await rateLimit(`identificar-cpf:${variantes.digitos}`, 6, 900);
    if (!cotaCpf.ok) {
      return NextResponse.json(
        { erro: "Muitas tentativas para este CPF. Tente de novo mais tarde." },
        { status: 429, headers: { "Retry-After": String(cotaCpf.retryAfterSeconds) } }
      );
    }

    if (achado.origem === "nenhuma") {
      return responder(inicio, { erro: "Não conseguimos confirmar. Confira os dados." }, 401);
    }

    const desafio = escolherDesafio(dados);
    if (!desafio || !conferirDesafio(desafio, dados, body.resposta)) {
      return responder(inicio, { erro: "Não conseguimos confirmar. Confira os dados." }, 401);
    }

    const faltando = camposFaltantes({ ...dados, cpf: variantes.formatado });

    /*
     * O token é o que autoriza escrever no cadastro, e ele depende de
     * AUTH_SECRET. Sem o segredo não emitimos token nenhum — mas também não
     * travamos a pessoa: ela é reconhecida e segue para o grupo, só sem a
     * opção de editar os dados. Preso ninguém fica por causa de uma variável
     * de ambiente ausente.
     */
    const token = temSegredoDeAssinatura()
      ? createSignedToken(
          "cadastro-atualizar",
          {
            cpf: variantes.digitos,
            id: achado.origem === "cadastro" ? achado.registro?.id : null,
            origem: achado.origem,
          },
          TOKEN_VALIDADE_S
        )
      : null;

    if (!token) {
      console.warn("[identificar] AUTH_SECRET ausente: edição de cadastro desativada.");
      return responder(inicio, {
        situacao: "completo",
        origem: achado.origem,
        token: null,
        faltando: [],
        dados: { nome_completo: dados.nome_completo ?? "", email: "", cpf: variantes.formatado,
                 data_nascimento: "", whatsapp: "", cep: "", sexo: "" },
      });
    }

    return responder(inicio, {
      situacao: faltando.length === 0 ? "completo" : "incompleto",
      origem: achado.origem,
      token,
      faltando,
      dados: {
        nome_completo: dados.nome_completo ?? "",
        email: dados.email ?? "",
        cpf: variantes.formatado,
        data_nascimento: dados.data_nascimento ?? "",
        whatsapp: dados.whatsapp ?? "",
        cep: dados.cep ?? "",
        sexo: dados.sexo ?? "",
      },
    });
  } catch (erro) {
    console.error("[identificar] erro:", erro);
    return responder(inicio, { erro: "Erro ao consultar. Tente novamente." }, 500);
  }
}
