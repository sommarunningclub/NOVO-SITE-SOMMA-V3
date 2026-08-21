import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { BUCKET_FOTOS, TABLE, fotoUrl } from "@/lib/desafio-esteiras/db";
import { clientIp, rateLimit } from "@/lib/desafio-esteiras/rate-limit";
import {
  FOTO_MAX_BYTES,
  detectarImagem,
  lerTokenEdicao,
  nomeArquivoFoto,
  removerFoto,
} from "@/lib/desafio-esteiras/perfil";

export const dynamic = "force-dynamic";

/**
 * Upload da foto de perfil.
 *
 * O arquivo sobe pelo servidor, não direto do browser: assim nenhuma
 * credencial de storage vai para o cliente, e o tipo/tamanho são conferidos
 * antes de qualquer byte chegar ao bucket. O tipo é detectado pela assinatura
 * do arquivo, não pelo `Content-Type` que o cliente diz — esse é forjável.
 *
 * Aceita dois donos:
 *  - `token` de edição (a pessoa acessou o cadastro com CPF + nascimento);
 *  - `ticket_token` (recém-inscrito, que ainda está no fluxo de inscrição).
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limite = await rateLimit(`dst:foto:${ip}`, 10, 600);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitos envios. Aguarde alguns minutos." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const arquivo = form.get("foto");
  const token = form.get("token");
  const ticketToken = form.get("ticket_token");

  if (!(arquivo instanceof File)) {
    return NextResponse.json({ error: "Selecione uma imagem." }, { status: 400 });
  }
  if (arquivo.size === 0) {
    return NextResponse.json({ error: "O arquivo está vazio." }, { status: 400 });
  }
  if (arquivo.size > FOTO_MAX_BYTES) {
    return NextResponse.json(
      { error: "A imagem precisa ter no máximo 3 MB." },
      { status: 413 }
    );
  }

  const buffer = new Uint8Array(await arquivo.arrayBuffer());
  const mime = detectarImagem(buffer);
  if (!mime) {
    return NextResponse.json(
      { error: "Formato não aceito. Envie uma foto em JPG, PNG ou WEBP." },
      { status: 415 }
    );
  }

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

  // Descobre de quem é a foto.
  let id: string | null = lerTokenEdicao(typeof token === "string" ? token : null);

  if (!id && typeof ticketToken === "string" && ticketToken.length >= 20) {
    const { data } = await supabase
      .from(TABLE)
      .select("id")
      .eq("ticket_token", ticketToken)
      .neq("status", "cancelled")
      .maybeSingle();
    id = (data as { id: string } | null)?.id ?? null;
  }

  if (!id) {
    return NextResponse.json(
      { error: "Não foi possível identificar sua inscrição. Recarregue a página e tente de novo." },
      { status: 401 }
    );
  }

  const { data: atual } = await supabase.from(TABLE).select("foto_path").eq("id", id).maybeSingle();
  const anterior = (atual as { foto_path: string | null } | null)?.foto_path ?? null;

  const path = nomeArquivoFoto(mime);
  const { error: erroUpload } = await supabase.storage
    .from(BUCKET_FOTOS)
    .upload(path, buffer, { contentType: mime, upsert: false });

  if (erroUpload) {
    console.error("[desafio-esteiras] upload da foto falhou:", erroUpload.message);
    return NextResponse.json({ error: "Não foi possível enviar a foto." }, { status: 500 });
  }

  const { error: erroUpdate } = await supabase
    .from(TABLE)
    .update({ foto_path: path, atualizado_em: new Date().toISOString() })
    .eq("id", id);

  if (erroUpdate) {
    // Não deixa arquivo órfão no bucket se o vínculo falhou.
    await removerFoto(path);
    console.error("[desafio-esteiras] vínculo da foto falhou:", erroUpdate.message);
    return NextResponse.json({ error: "Não foi possível salvar a foto." }, { status: 500 });
  }

  // Só apaga a antiga depois que a nova está registrada.
  if (anterior && anterior !== path) await removerFoto(anterior);

  return NextResponse.json({ ok: true, foto_url: fotoUrl(path) });
}
