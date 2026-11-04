import { NextResponse, type NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { BUCKET_COMPROVANTES, COMPROVANTE_MAX_BYTES } from "@/lib/maratona-rio-2027/inscricao";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Comprovante do Pix da inscrição da Meia Maratona do Rio 2027.
 *
 * O arquivo sobe pelo servidor (nenhuma credencial de storage vai para o
 * navegador) para um bucket privado. Só anexa quem tem o `token` que a
 * inscrição devolveu: o id sozinho é sequencial. O tipo é conferido pela
 * assinatura do arquivo, não pelo Content-Type, que é forjável. Um novo
 * envio substitui o anterior.
 */

const TIPOS: { mime: string; ext: string; confere: (b: Uint8Array) => boolean }[] = [
  { mime: "image/jpeg", ext: "jpg", confere: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: "png", confere: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  {
    mime: "image/webp",
    ext: "webp",
    confere: (b) =>
      String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  },
  { mime: "application/pdf", ext: "pdf", confere: (b) => String.fromCharCode(...b.slice(0, 5)) === "%PDF-" },
];

function erro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status });
}

export async function POST(req: NextRequest) {
  const limite = await rateLimit(`rio27:comprovante:${clientIp(req)}`, 12, 600);
  if (!limite.ok) return erro("Muitos envios seguidos. Espere alguns minutos.", 429);

  const form = await req.formData().catch(() => null);
  if (!form) return erro("Envio inválido.", 400);

  const id = Number(form.get("id"));
  const token = form.get("token");
  const arquivo = form.get("arquivo");
  if (!Number.isSafeInteger(id) || id <= 0 || typeof token !== "string" || !/^[0-9a-f-]{36}$/i.test(token)) {
    return erro("Inscrição não encontrada. Recarregue a página.", 400);
  }
  if (!(arquivo instanceof File) || arquivo.size === 0) return erro("Escolha o arquivo do comprovante.", 400);
  if (arquivo.size > COMPROVANTE_MAX_BYTES) return erro("O arquivo precisa ter no máximo 4 MB.", 413);

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const tipo = TIPOS.find((t) => t.confere(bytes));
  if (!tipo) return erro("Formato não aceito. Envie uma foto, um print ou um PDF.", 415);

  const supabase = getServiceSupabase();
  if (!supabase) return erro("Serviço indisponível. Tente de novo em instantes.", 503);

  const { data: inscricao, error: erroBusca } = await supabase
    .from("maratona_rio_2027_inscricoes")
    .select("id, comprovante_path, status")
    .eq("id", id)
    .eq("token", token)
    .maybeSingle();
  if (erroBusca) {
    console.error("[maratona-rio-2027] Falha ao buscar inscrição do comprovante:", erroBusca.message);
    return erro("Não deu certo. Tente de novo.", 500);
  }
  if (!inscricao) return erro("Inscrição não encontrada. Recarregue a página.", 404);
  if (inscricao.status === "cancelado") return erro("Esta inscrição foi cancelada. Fale com o seu treinador.", 409);

  const caminho = `${id}/${Date.now()}.${tipo.ext}`;
  const { error: erroUpload } = await supabase.storage
    .from(BUCKET_COMPROVANTES)
    .upload(caminho, bytes, { contentType: tipo.mime, upsert: false });
  if (erroUpload) {
    console.error("[maratona-rio-2027] Falha no upload do comprovante:", erroUpload.message);
    return erro("Não deu para guardar o arquivo. Tente de novo.", 500);
  }

  const { error: erroUpdate } = await supabase
    .from("maratona_rio_2027_inscricoes")
    .update({ comprovante_path: caminho, comprovante_enviado_em: new Date().toISOString() })
    .eq("id", id);
  if (erroUpdate) {
    console.error("[maratona-rio-2027] Comprovante salvo mas não registrado:", erroUpdate.message);
    await supabase.storage.from(BUCKET_COMPROVANTES).remove([caminho]);
    return erro("Não deu certo. Tente de novo.", 500);
  }

  // O anterior só sai depois que o novo está registrado.
  if (inscricao.comprovante_path) {
    await supabase.storage.from(BUCKET_COMPROVANTES).remove([inscricao.comprovante_path]);
  }

  return NextResponse.json({ ok: true });
}
