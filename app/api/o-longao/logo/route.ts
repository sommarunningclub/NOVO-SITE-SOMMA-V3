import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { BUCKET_LOGOS, TB, logoUrl } from "@/lib/o-longao/db";

export const dynamic = "force-dynamic";

/** 3 MB: cabe qualquer logo de crew e não vira vetor de abuso do bucket. */
const MAX_BYTES = 3 * 1024 * 1024;

type MimeImagem = "image/jpeg" | "image/png" | "image/webp";

const EXTENSAO: Record<MimeImagem, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/**
 * Tipo pela assinatura do arquivo, nunca pelo `Content-Type` que o cliente
 * declara: aquele é texto livre e forjável, os magic bytes não.
 */
function detectarImagem(bytes: Uint8Array): MimeImagem | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Upload da logo da crew.
 *
 * O arquivo sobe pelo servidor: nenhuma credencial de storage vai ao browser e
 * o tipo/tamanho são conferidos antes de qualquer byte tocar o bucket. A
 * autorização é o `crew_token`, o segredo opaco entregue no fim da inscrição.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limite = await rateLimit(`lgo:logo:${ip}`, 10, 600);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitos envios. Aguarde alguns minutos e tente de novo." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSeconds) } }
    );
  }

  /*
    O teto é conferido pelo cabeçalho ANTES de `formData()`, porque essa
    chamada materializa o multipart inteiro na memória: sem esta guarda, um
    corpo de 300 MB seria alocado só para depois ser recusado por tamanho,
    e dez requisições por janela bastariam para derrubar a função.

    A margem cobre o overhead das fronteiras do multipart. O `arquivo.size`
    continua sendo checado depois: este cabeçalho vem do cliente e serve para
    recusar cedo, não para autorizar.
  */
  const declarado = Number(request.headers.get("content-length") ?? 0);
  if (declarado > MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "A imagem precisa ter no máximo 3 MB." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const arquivo = form.get("logo");
  const tokenRaw = form.get("crew_token");
  const crewToken = typeof tokenRaw === "string" ? tokenRaw.trim() : "";

  if (!crewToken) {
    return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
  }
  if (!(arquivo instanceof File)) {
    return NextResponse.json({ error: "Selecione a logo da crew." }, { status: 400 });
  }
  if (arquivo.size === 0) {
    return NextResponse.json({ error: "O arquivo está vazio." }, { status: 400 });
  }
  if (arquivo.size > MAX_BYTES) {
    return NextResponse.json({ error: "A imagem precisa ter no máximo 3 MB." }, { status: 400 });
  }

  const buffer = new Uint8Array(await arquivo.arrayBuffer());
  const mime = detectarImagem(buffer);
  if (!mime) {
    return NextResponse.json(
      { error: "Formato não aceito. Envie a logo em JPG, PNG ou WEBP." },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  // Erro genérico de propósito: token inválido e token inexistente respondem
  // igual, para não virar oráculo de tokens válidos.
  const { data: crewRow, error: erroBusca } = await supabase
    .from(TB.crews)
    .select("id, logo_path")
    .eq("crew_token", crewToken)
    .maybeSingle();

  if (erroBusca) {
    console.error("[o-longao] busca da crew por token:", erroBusca.message);
    return NextResponse.json({ error: "Não foi possível enviar a logo." }, { status: 500 });
  }

  const crew = crewRow as { id: string; logo_path: string | null } | null;
  if (!crew) {
    return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
  }

  const anterior = crew.logo_path;
  const path = `${randomBytes(16).toString("hex")}${EXTENSAO[mime]}`;

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET_LOGOS)
    .upload(path, buffer, { contentType: mime, upsert: false });

  if (erroUpload) {
    console.error("[o-longao] upload da logo:", erroUpload.message);
    return NextResponse.json({ error: "Não foi possível enviar a logo." }, { status: 500 });
  }

  const { error: erroUpdate } = await supabase
    .from(TB.crews)
    .update({ logo_path: path })
    .eq("id", crew.id);

  if (erroUpdate) {
    // Vínculo falhou: não deixa arquivo órfão no bucket.
    await supabase.storage.from(BUCKET_LOGOS).remove([path]);
    console.error("[o-longao] vínculo da logo:", erroUpdate.message);
    return NextResponse.json({ error: "Não foi possível salvar a logo." }, { status: 500 });
  }

  // Só apaga a antiga depois que a nova já está registrada.
  if (anterior && anterior !== path) {
    const { error: erroRemocao } = await supabase.storage.from(BUCKET_LOGOS).remove([anterior]);
    if (erroRemocao) console.error("[o-longao] remoção da logo antiga:", erroRemocao.message);
  }

  return NextResponse.json({ ok: true, logo_url: logoUrl(path) });
}
