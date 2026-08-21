import { NextRequest, NextResponse } from "next/server";
import { processarDescadastro } from "@/lib/campanhas/descadastro";

export const dynamic = "force-dynamic";

/**
 * Duas formas de chegar aqui, e as duas precisam funcionar sozinhas:
 *
 *   GET  → a pessoa clicou o link "Descadastrar" no rodapé do e-mail. Processa
 *          na hora e mostra uma página simples confirmando.
 *   POST → o "One-Click Unsubscribe" do Gmail/Yahoo (RFC 8058): o próprio
 *          cliente de e-mail dispara este POST sem abrir nada, então a resposta
 *          não pode depender de o GET ter rodado antes.
 */

function pagina(titulo: string, texto: string): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${titulo}</title><style>body{font-family:Arial,Helvetica,sans-serif;background:#08080a;color:#f2f0ec;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px;}main{max-width:420px;text-align:center;}h1{font-size:1.4rem;margin-bottom:12px;}p{color:rgba(242,240,236,0.7);line-height:1.5;}</style></head><body><main><h1>${titulo}</h1><p>${texto}</p></main></body></html>`;
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  const resultado = await processarDescadastro(token);

  const html = resultado.ok
    ? pagina("Você foi descadastrado.", "Não vai mais receber e-mails desta campanha.")
    : pagina("Não foi possível processar.", resultado.erro ?? "Link inválido.");

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

/** Sem corpo de resposta relevante: o cliente de e-mail não renderiza nada. */
export async function POST(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  const resultado = await processarDescadastro(token);
  return NextResponse.json({ ok: resultado.ok }, { status: resultado.ok ? 200 : 400 });
}
