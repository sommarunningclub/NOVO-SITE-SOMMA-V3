import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { verifySignedToken } from "@/lib/auth/session-token";
import { brDateToISO, isValidBirthDate } from "@/lib/validation";
import { normalizarSexo, variantesCpf } from "@/lib/cadastro/identificacao";

export const dynamic = "force-dynamic";

/**
 * Completa ou atualiza um cadastro já identificado.
 *
 * Esta rota não aceita CPF avulso: o CPF vem de dentro do token assinado que a
 * `/identificar` emitiu depois de a pessoa acertar o desafio. Assim, quem não
 * passou pela confirmação não consegue escrever no cadastro de ninguém, nem
 * trocando o corpo da requisição.
 *
 * Todos os campos são obrigatórios: o cadastro só é gravado inteiro.
 */

const schema = z.object({
  token: z.string().min(10, "Sessão expirada."),
  nome_completo: z.string().trim().min(3, "Informe seu nome completo.").max(120, "Nome muito longo."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  data_nascimento: z.string().trim().refine(isValidBirthDate, "Data de nascimento inválida."),
  whatsapp: z.string().trim().refine((v) => v.replace(/\D/g, "").length >= 10, "WhatsApp inválido."),
  cep: z.string().trim().refine((v) => v.replace(/\D/g, "").length === 8, "CEP inválido."),
  sexo: z.enum(["masculino", "feminino"], { message: "Selecione uma opção." }),
});

interface TokenCadastro extends Record<string, unknown> {
  cpf: string;
  id: string | null;
  origem: "cadastro" | "checkin";
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const cota = await rateLimit(`cadastro-atualizar:${ip}`, 20, 600);
    if (!cota.ok) {
      return NextResponse.json(
        { erro: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429, headers: { "Retry-After": String(cota.retryAfterSeconds) } }
      );
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { erro: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    const sessao = verifySignedToken<TokenCadastro>("cadastro-atualizar", parsed.data.token);
    if (!sessao?.cpf) {
      return NextResponse.json(
        { erro: "Sua sessão expirou. Confirme o CPF novamente." },
        { status: 401 }
      );
    }

    const variantes = variantesCpf(sessao.cpf);
    if (!variantes) {
      return NextResponse.json({ erro: "Sessão inválida." }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ erro: "Erro de configuração." }, { status: 500 });
    }

    const registro = {
      nome_completo: parsed.data.nome_completo,
      email: parsed.data.email,
      cpf: variantes.formatado,
      data_nascimento: brDateToISO(parsed.data.data_nascimento),
      whatsapp: parsed.data.whatsapp,
      cep: parsed.data.cep,
      sexo: normalizarSexo(parsed.data.sexo),
    };

    // O e-mail não pode colidir com o de outra pessoa. Como o CPF do token é a
    // identidade, qualquer linha com este e-mail e CPF diferente é conflito.
    const { data: mesmoEmail, error: erroEmail } = await supabase
      .from("cadastro_site")
      .select("id, cpf")
      .ilike("email", registro.email)
      .limit(2);

    if (erroEmail) {
      console.error("[cadastro-atualizar] erro ao checar e-mail:", erroEmail);
      return NextResponse.json({ erro: "Erro ao validar. Tente novamente." }, { status: 500 });
    }

    const conflito = (mesmoEmail ?? []).some((linha) => {
      const outro = String(linha.cpf ?? "").replace(/\D/g, "");
      return outro && outro !== variantes.digitos;
    });
    if (conflito) {
      return NextResponse.json(
        { erro: "Este e-mail já está em uso por outro cadastro." },
        { status: 409 }
      );
    }

    // Existe linha para este CPF? (o token diz de onde veio, mas o estado pode
    // ter mudado entre a identificação e o envio)
    const { data: existentes, error: erroBusca } = await supabase
      .from("cadastro_site")
      .select("id")
      .in("cpf", [variantes.digitos, variantes.formatado])
      .limit(1);

    if (erroBusca) {
      console.error("[cadastro-atualizar] erro ao buscar cadastro:", erroBusca);
      return NextResponse.json({ erro: "Erro ao salvar. Tente novamente." }, { status: 500 });
    }

    if (existentes && existentes.length > 0) {
      const { error } = await supabase
        .from("cadastro_site")
        .update(registro)
        .eq("id", existentes[0].id);

      if (error) {
        console.error("[cadastro-atualizar] erro ao atualizar:", error);
        return NextResponse.json({ erro: "Erro ao salvar. Tente novamente." }, { status: 500 });
      }
      return NextResponse.json({ ok: true, acao: "atualizado" });
    }

    // Quem veio de `checkins` ainda não tinha cadastro: cria agora.
    const { error } = await supabase
      .from("cadastro_site")
      .insert([{ ...registro, data_de_cadastro: new Date().toISOString() }]);

    if (error) {
      console.error("[cadastro-atualizar] erro ao inserir:", error);
      return NextResponse.json({ erro: "Erro ao salvar. Tente novamente." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, acao: "criado" });
  } catch (erro) {
    console.error("[cadastro-atualizar] erro interno:", erro);
    return NextResponse.json({ erro: "Erro interno." }, { status: 500 });
  }
}
