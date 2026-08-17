import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { EVENTOS_DE_ENGAJAMENTO } from "@/lib/campanhas/regua";

export const dynamic = "force-dynamic";

/**
 * Webhook de eventos do Resend.
 *
 * É a peça que torna a régua possível. O Resend não expõe quem abriu um e-mail:
 * não existe endpoint de destinatários nem de estatística por broadcast ou por
 * envio transacional. O que existe é este webhook.
 *
 * A régua manda e-mail transacional (`batch.send`), não broadcast — a conta
 * Resend tem teto de contatos armazenados no plano Marketing, e broadcast exige
 * importar todo mundo como Contact antes de mandar. Sem broadcast não existe
 * `broadcast_id` no evento, então a correlação é por `tags`: todo envio da régua
 * carrega `campanha`/`etapa`/`segmento`, e a Resend ecoa essas tags de volta no
 * payload do evento. Sem esta rota de pé no momento do disparo, a etapa 2 não
 * tem como saber quem não abriu a etapa 1, e a régua inteira cai.
 *
 * Consequência que vale dizer em voz alta: abertura que acontece com esta rota
 * fora do ar não volta. O Resend reentrega quando não recebe 2xx, mas isso só
 * cobre falha dele, não janela em que o endpoint não existia.
 *
 * A rota sempre responde 200 quando a assinatura é válida, mesmo que o evento
 * não interesse. Responder erro faria o Resend reentregar para sempre um evento
 * que a gente conscientemente ignora.
 */

/**
 * Verificação de assinatura no padrão Svix, que é o que o Resend usa.
 *
 * Feita à mão em vez de instalar o pacote `svix`: são três cabeçalhos e um HMAC,
 * e a dependência traria um cliente inteiro de webhook para usar uma função.
 *
 * O segredo vem como `whsec_<base64>`; o que entra no HMAC é o base64 decodado,
 * não a string com o prefixo. A mensagem assinada é `id.timestamp.corpo`, com o
 * corpo EXATAMENTE como chegou, por isso lemos texto cru e não `req.json()`.
 */
function assinaturaValida(
  corpo: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  segredo: string
): boolean {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return false;

  // Janela de tolerância: barra reenvio de um payload capturado dias atrás.
  const idadeSegundos = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(idadeSegundos) || idadeSegundos > 300) return false;

  const chave = Buffer.from(segredo.replace(/^whsec_/, ""), "base64");
  const esperado = createHmac("sha256", chave)
    .update(`${id}.${timestamp}.${corpo}`)
    .digest("base64");

  /* O cabeçalho pode trazer várias assinaturas separadas por espaço, cada uma
     como `v1,<base64>`: é assim que uma rotação de segredo não derruba o
     webhook. Basta uma bater. */
  return signature.split(" ").some((parte) => {
    const valor = parte.split(",")[1];
    if (!valor) return false;
    try {
      const a = Buffer.from(valor, "base64");
      const b = Buffer.from(esperado, "base64");
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

interface PayloadResend {
  type?: string;
  created_at?: string;
  data?: {
    broadcast_id?: string;
    email_id?: string;
    to?: string[];
    created_at?: string;
    tags?: Record<string, string>;
  };
}

export async function POST(request: NextRequest) {
  const segredo = process.env.RESEND_WEBHOOK_SECRET;
  if (!segredo) {
    console.error("[webhook/resend] RESEND_WEBHOOK_SECRET ausente.");
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });
  }

  const corpo = await request.text();
  const ok = assinaturaValida(
    corpo,
    {
      id: request.headers.get("svix-id"),
      timestamp: request.headers.get("svix-timestamp"),
      signature: request.headers.get("svix-signature"),
    },
    segredo
  );
  if (!ok) {
    console.warn("[webhook/resend] Assinatura inválida.");
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let payload: PayloadResend;
  try {
    payload = JSON.parse(corpo) as PayloadResend;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  // "email.opened" → "opened". O tipo cru vira o que a régua consulta.
  const tipo = String(payload.type ?? "").replace(/^email\./, "");
  const destinos = payload.data?.to ?? [];
  const tags = payload.data?.tags ?? {};

  const campanha = tags.campanha;
  const etapa = Number(tags.etapa);
  const segmento = tags.segmento;
  /* As três tags só existem em e-mail que a régua mandou (linkOferta/tags em
     lib/campanhas/regua.ts). Sem elas o evento é de outra coisa no domínio —
     ticket, boas-vindas, o e-mail de contato de outra rota — e guardar tudo
     encheria a tabela com linhas que nenhuma consulta lê. */
  const daRegua = Boolean(campanha && segmento && Number.isInteger(etapa) && etapa >= 1);

  const interessa =
    EVENTOS_DE_ENGAJAMENTO.includes(tipo as (typeof EVENTOS_DE_ENGAJAMENTO)[number]) && daRegua;

  if (!interessa || destinos.length === 0) {
    return NextResponse.json({ ok: true, ignorado: true });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    // 500 de propósito: aqui o evento importava e não foi guardado, então
    // queremos que o Resend reentregue.
    console.error("[webhook/resend] Supabase não configurado.");
    return NextResponse.json({ error: "Persistência indisponível." }, { status: 500 });
  }

  const linhas = destinos.map((email) => ({
    email: email.trim().toLowerCase(),
    campanha,
    etapa,
    segmento,
    email_id: payload.data?.email_id ?? null,
    tipo,
    ocorrido_em: payload.created_at ?? payload.data?.created_at ?? new Date().toISOString(),
  }));

  /* `ignoreDuplicates` na UNIQUE (campanha, etapa, segmento, email, tipo) é o
     que torna a rota idempotente: a segunda abertura da mesma pessoa, e a
     reentrega do mesmo evento, não viram linha nova nem erro. */
  const { error } = await supabase
    .from("campanha_eventos")
    .upsert(linhas, { onConflict: "campanha,etapa,segmento,email,tipo", ignoreDuplicates: true });

  if (error) {
    console.error("[webhook/resend] Erro ao gravar evento:", error);
    return NextResponse.json({ error: "Falha ao gravar." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, gravados: linhas.length });
}
