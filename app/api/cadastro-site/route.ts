import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { signupSchema, brDateToISO } from "@/lib/validation";

// Espelha o padrão do site atual (app/api/cadastro-site → tabela `cadastro_site`):
// grava nome, email, cpf (formatado) e whatsapp, com dedup por CPF.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    // Honeypot: se preenchido, é bot. Responde 200 silenciosamente sem gravar.
    if (parsed.data.website) {
      return NextResponse.json({ success: true });
    }

    const { nome_completo, email, whatsapp, cep, sexo } = parsed.data;
    const dataNascimentoISO = brDateToISO(parsed.data.data_nascimento);

    // Normaliza CPF (apenas dígitos) e gera versão formatada (igual ao site atual).
    const cpfDigits = parsed.data.cpf.replace(/\D/g, "");
    const cpfFormatted = cpfDigits.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1.$2.$3-$4"
    );

    const supabase = getServiceSupabase();
    if (!supabase) {
      console.warn(
        "[cadastro-site] Supabase não configurado (.env.local). Lead não persistido:",
        { nome_completo, email, whatsapp }
      );
      return NextResponse.json({ success: true, persisted: false });
    }

    // Dedup por CPF (compara contra dígitos e formatado).
    const { data: existing, error: checkError } = await supabase
      .from("cadastro_site")
      .select("id")
      .in("cpf", [cpfDigits, cpfFormatted])
      .limit(1);

    if (checkError) {
      console.error("[cadastro-site] Erro ao verificar CPF:", checkError);
      return NextResponse.json(
        { error: "Erro ao validar cadastro. Tente novamente." },
        { status: 500 }
      );
    }
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "Este CPF já está cadastrado em nossa base." },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("cadastro_site")
      .insert([
        {
          nome_completo,
          email,
          cpf: cpfFormatted,
          whatsapp,
          cep,
          data_nascimento: dataNascimentoISO,
          sexo,
          data_de_cadastro:
            new Date()
              .toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" })
              .replace(" ", "T") + "-03:00",
        },
      ])
      .select();

    if (error) {
      console.error("[cadastro-site] Erro ao inserir:", error);
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json(
          { error: "Este CPF já está cadastrado em nossa base." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Não foi possível concluir sua inscrição agora. Tente novamente." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, persisted: true, data });
  } catch (err) {
    console.error("[cadastro-site] Erro interno:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
