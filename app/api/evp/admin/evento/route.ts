import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { exigir } from "@/lib/evp/auth";
import { CAMINHO, SLUG } from "@/lib/evp/config";
import { rpc } from "@/lib/evp/db";
import { avisarPromovidas } from "@/lib/evp/inscricao";

export const dynamic = "force-dynamic";

const texto = (max: number) => z.string().trim().max(max).nullable();
// Só http(s) ou caminho do próprio site: nada de javascript: em link ou imagem.
const url = z
  .string()
  .trim()
  .max(600)
  .refine((v) => v === "" || /^https?:\/\//i.test(v) || v.startsWith("/"), { message: "Use um endereço começando com https://" });

const corpoSchema = z
  .object({
    nome: z.string().trim().min(3).max(160),
    descricao: texto(600),
    starts_at: z.string().datetime({ offset: true }).nullable(),
    ends_at: z.string().datetime({ offset: true }).nullable(),
    local_nome: texto(160),
    endereco: texto(300),
    lat: z.number().min(-90).max(90).nullable(),
    lng: z.number().min(-180).max(180).nullable(),
    orientacoes_chegada: texto(1200),
    info_participacao: texto(1200),
    capacidade: z.number().int().min(0).max(100000).nullable(),
    valor_centavos: z.number().int().min(0).max(10_000_000).nullable(),
    inscricoes_status: z.enum(["em_breve", "aberta", "encerrada"]),
    ao_lotar: z.enum(["lista_espera", "encerrar"]),
    promover_automatico: z.boolean(),
    conteudo: z
      .object({
        hero_imagem: url.optional(),
        hero_descricao: z.string().trim().max(500).optional(),
        sobre_texto: z.string().trim().max(1500).optional(),
        link_prova: url.optional(),
        link_regulamento: url.optional(),
      })
      .strict(),
    contato: z
      .object({
        whatsapp: z.string().trim().max(40).optional(),
        email: z.string().trim().max(160).optional(),
        instagram: z.string().trim().max(120).optional(),
      })
      .strict(),
    programacao: z
      .array(z.object({ titulo: z.string().trim().max(160), descricao: texto(500), horario: texto(40) }))
      .max(20),
    profissionais: z
      .array(
        z.object({
          nome: z.string().trim().max(120),
          funcao: texto(120),
          descricao: texto(600),
          especialidade: texto(200),
          foto_url: url.nullable(),
          organizacao: z.enum(["bora", "somma"]),
        })
      )
      .max(20),
  })
  .partial();

const MOTIVOS: Record<string, string> = {
  fim_antes_do_inicio: "O horário de término precisa ser depois do início.",
  coordenadas_incompletas: "Informe latitude e longitude juntas, ou deixe as duas vazias.",
  sem_evento: "Evento não encontrado.",
};

/** Salva a configuração do evento. Só as chaves enviadas são alteradas. */
export async function PUT(req: NextRequest) {
  const { sessao, negado } = await exigir("admin");
  if (negado) return negado;
  const parsed = corpoSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const primeiro = parsed.error.issues[0];
    return NextResponse.json(
      { error: `Confira o campo "${primeiro?.path.join(" › ")}": ${primeiro?.message}` },
      { status: 422 }
    );
  }
  // Campos vazios de conteúdo e contato não precisam ir para o banco.
  const dados = { ...parsed.data } as Record<string, unknown>;
  for (const chave of ["conteudo", "contato"] as const) {
    if (dados[chave]) {
      dados[chave] = Object.fromEntries(Object.entries(dados[chave] as Record<string, string>).filter(([, v]) => v));
    }
  }

  try {
    const r = await rpc<{
      ok: boolean;
      motivo?: string;
      faltam?: string[];
      confirmadas?: number;
      promovidas?: Parameters<typeof avisarPromovidas>[0];
      vagas?: unknown;
    }>("evp_admin_salvar_evento", { p_slug: SLUG, p_staff: sessao.id, p: dados });

    if (!r.ok) {
      const error =
        r.motivo === "faltam"
          ? `Para abrir as inscrições ainda falta definir: ${(r.faltam ?? []).join(", ")}.`
          : r.motivo === "capacidade_menor"
            ? `A capacidade não pode ficar abaixo das ${r.confirmadas} inscrições já confirmadas. Cancele inscrições antes de reduzir.`
            : MOTIVOS[r.motivo ?? ""] ?? "Não foi possível salvar.";
      return NextResponse.json({ error, faltam: r.faltam ?? null }, { status: 409 });
    }
    // A landing page sai de cache: o que foi salvo aparece na próxima visita.
    revalidatePath(CAMINHO);
    const avisados = await avisarPromovidas(r.promovidas);
    return NextResponse.json({ ok: true, vagas: r.vagas, promovidas: r.promovidas?.length ?? 0, avisados });
  } catch (erro) {
    console.error("[evp] Salvar evento:", erro instanceof Error ? erro.message : erro);
    return NextResponse.json({ error: "Não foi possível salvar. Nada foi alterado." }, { status: 503 });
  }
}
