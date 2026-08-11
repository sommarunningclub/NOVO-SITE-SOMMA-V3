import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import {
  brDateToISO,
  slugifyFileName,
  vagaCandidaturaSchema,
  validateCurriculo,
} from "@/lib/validation";
import { sendCandidaturaEmails } from "@/lib/emails/vaga-candidatura";
import { getVagaBySlug } from "@/app/trabalhe-conosco-vagas/_vagas";

const BUCKET = "curriculos";
const SIGNED_URL_TTL = 60 * 60 * 24 * 30; // 30 dias

// Candidatura a vaga (/trabalhe-conosco-vagas).
// Recebe multipart/form-data: os campos do formulário + o arquivo do currículo.
// Grava o arquivo no bucket privado `curriculos` e a ficha em `candidatos_vagas`.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const raw = Object.fromEntries(
      Array.from(formData.entries()).filter(([, v]) => typeof v === "string")
    ) as Record<string, string>;

    const parsed = vagaCandidaturaSchema.safeParse({
      ...raw,
      // FormData só carrega string: booleano chega como "true"/"false", e a
      // string "false" é truthy — sem esta conversão toda candidatura entraria
      // como indicada.
      consent_lgpd: raw.consent_lgpd === "true",
      indicado: raw.indicado === "true",
    });

    if (!parsed.success) {
      console.error(
        "[trabalhe-conosco] Payload rejeitado:",
        parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
      );
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    // Honeypot: se preenchido, é bot. Responde 200 sem gravar nada.
    if (parsed.data.website) {
      return NextResponse.json({ success: true });
    }

    // A vaga precisa existir e estar aberta — impede candidatura a slug forjado
    // ou a uma vaga já encerrada por quem deixou a aba aberta.
    const vaga = getVagaBySlug(parsed.data.vaga_slug);
    if (!vaga || !vaga.ativa) {
      return NextResponse.json(
        { error: "Esta vaga não está mais aberta para candidaturas." },
        { status: 410 }
      );
    }

    const curriculo = formData.get("curriculo");
    if (!(curriculo instanceof File)) {
      return NextResponse.json({ error: "Anexe seu currículo." }, { status: 400 });
    }

    const curriculoError = validateCurriculo(curriculo);
    if (curriculoError) {
      return NextResponse.json({ error: curriculoError }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Serviço indisponível no momento. Tente novamente em instantes." },
        { status: 503 }
      );
    }

    const {
      nome,
      email,
      telefone,
      data_nascimento,
      cep,
      logradouro,
      bairro,
      cidade,
      estado,
      complemento,
      instituicao,
      semestre,
      indicado,
      indicado_por,
    } = parsed.data;

    // 1. Currículo → bucket privado. Se falhar, a candidatura não é gravada:
    // uma ficha sem currículo não serve para a triagem.
    const nomeArquivo = slugifyFileName(curriculo.name);
    const path = `${vaga.slug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${nomeArquivo}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, Buffer.from(await curriculo.arrayBuffer()), {
        contentType: curriculo.type || "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("[trabalhe-conosco] Falha ao subir currículo:", uploadError);
      return NextResponse.json(
        { error: "Não conseguimos enviar seu currículo. Tente novamente." },
        { status: 500 }
      );
    }

    // 2. Ficha → banco. Horário de Brasília, no formato usado no resto do site.
    const criadoEm =
      new Date()
        .toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" })
        .replace(" ", "T") + "-03:00";

    const { data, error } = await supabase
      .from("candidatos_vagas")
      .insert([
        {
          vaga_slug: vaga.slug,
          vaga_titulo: vaga.titulo,
          nome,
          email,
          telefone,
          data_nascimento: brDateToISO(data_nascimento),
          cep: cep.replace(/\D/g, ""),
          logradouro: logradouro || null,
          bairro: bairro || null,
          cidade: cidade || null,
          estado: estado || null,
          complemento: complemento || null,
          instituicao,
          semestre,
          indicado,
          // O CHECK do banco proíbe `indicado_por` sem indicação — normalizamos
          // aqui para não depender só do que o cliente mandou.
          indicado_por: indicado ? indicado_por?.trim() || null : null,
          curriculo_path: path,
          curriculo_nome: nomeArquivo,
          criado_em: criadoEm,
          origem: "site",
        },
      ])
      .select("id");

    if (error) {
      // Órfão evitado: sem a ficha, o arquivo não serve para nada.
      await supabase.storage.from(BUCKET).remove([path]);
      console.error("[trabalhe-conosco] Erro ao inserir em candidatos_vagas:", error);
      return NextResponse.json(
        { error: "Não foi possível salvar sua candidatura. Tente novamente." },
        { status: 500 }
      );
    }

    // 3. E-mails. A partir daqui nada invalida a candidatura — ela já está salva.
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL);

    const enderecoCompleto = [
      logradouro,
      complemento,
      bairro,
      [cidade, estado].filter(Boolean).join(" - "),
    ]
      .filter(Boolean)
      .join(", ");

    await sendCandidaturaEmails({
      nome,
      email,
      telefone,
      data_nascimento,
      cep,
      endereco: enderecoCompleto,
      instituicao,
      semestre,
      indicacao: indicado
        ? `Sim, por ${indicado_por?.trim() || "(não informou)"}`
        : "Não",
      vaga_titulo: vaga.titulo,
      curriculo_url: signed?.signedUrl ?? null,
      curriculo_nome: nomeArquivo,
    });

    return NextResponse.json({ success: true, id: data?.[0]?.id ?? null });
  } catch (error) {
    console.error("[trabalhe-conosco] Erro inesperado:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
