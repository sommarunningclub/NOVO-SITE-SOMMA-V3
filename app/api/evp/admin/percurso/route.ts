import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { exigir } from "@/lib/evp/auth";
import { CAMINHO, DISTANCIAS_BASE, SLUG, type DistanciaBase } from "@/lib/evp/config";
import { rpc } from "@/lib/evp/db";
import { lerArquivoDePercurso } from "@/lib/evp/percurso";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const ehDistancia = (v: unknown): v is DistanciaBase => DISTANCIAS_BASE.includes(v as DistanciaBase);

/**
 * Recebe o arquivo oficial de um percurso (GPX, KML ou GeoJSON), lê a geometria
 * e guarda EM VALIDAÇÃO, com um relatório. Nada vai para a página aqui: publicar
 * é o PATCH abaixo, depois que alguém conferiu o traçado contra o mapa oficial.
 */
export async function POST(req: NextRequest) {
  const { sessao, negado } = await exigir("admin");
  if (negado) return negado;
  try {
    const form = await req.formData();
    const distancia = form.get("distancia");
    const arquivo = form.get("arquivo");
    const fonte = String(form.get("fonte") ?? "").trim().slice(0, 200);
    if (!ehDistancia(distancia)) return NextResponse.json({ error: "Escolha a distância do percurso." }, { status: 422 });
    if (!(arquivo instanceof File)) return NextResponse.json({ error: "Anexe o arquivo do percurso." }, { status: 422 });
    if (arquivo.size > MAX_BYTES) return NextResponse.json({ error: "Arquivo acima de 8 MB." }, { status: 413 });
    if (!fonte) {
      return NextResponse.json(
        { error: "Informe a origem do arquivo (por exemplo: enviado pela organização da prova em tal data)." },
        { status: 422 }
      );
    }

    const lido = lerArquivoDePercurso(arquivo.name, await arquivo.text(), distancia);
    if (!lido.ok) return NextResponse.json({ error: lido.erro }, { status: 422 });
    if (lido.relatorio.bloqueios.length) {
      return NextResponse.json({ error: lido.relatorio.bloqueios.join(" "), relatorio: lido.relatorio }, { status: 422 });
    }

    await rpc("evp_admin_percurso_salvar", {
      p_slug: SLUG,
      p_staff: sessao.id,
      p_distancia: distancia,
      p: {
        coordenadas: lido.coordenadas,
        comprimento_m: lido.relatorio.comprimento_m,
        pontos: lido.relatorio.pontos,
        arquivo_nome: arquivo.name.slice(0, 160),
        formato: lido.formato,
        fonte,
        relatorio: lido.relatorio,
      },
    });
    return NextResponse.json({ ok: true, relatorio: lido.relatorio });
  } catch (erro) {
    console.error("[evp] Percurso:", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "Não foi possível processar o arquivo." }, { status: 503 });
  }
}

/** PATCH { distancia, acao: publicar | despublicar | remover } */
export async function PATCH(req: NextRequest) {
  const { sessao, negado } = await exigir("admin");
  if (negado) return negado;
  const corpo = await req.json().catch(() => ({}));
  if (!ehDistancia(corpo?.distancia)) return NextResponse.json({ error: "Distância inválida." }, { status: 422 });
  if (!["publicar", "despublicar", "remover"].includes(corpo?.acao)) {
    return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  }
  if (corpo.acao === "publicar" && corpo.conferido !== true) {
    return NextResponse.json({ error: "Confirme que o traçado foi conferido com o mapa oficial." }, { status: 422 });
  }
  try {
    const r = await rpc<{ ok: boolean }>("evp_admin_percurso_acao", {
      p_slug: SLUG,
      p_staff: sessao.id,
      p_distancia: corpo.distancia,
      p_acao: corpo.acao,
    });
    if (!r.ok) return NextResponse.json({ error: "Percurso não encontrado." }, { status: 404 });
    revalidatePath(CAMINHO);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível concluir." }, { status: 503 });
  }
}
