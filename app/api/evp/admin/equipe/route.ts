import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { exigir } from "@/lib/evp/auth";
import { SLUG } from "@/lib/evp/config";
import { rpc } from "@/lib/evp/db";
import { gerarHash } from "@/lib/evp/senha";

export const dynamic = "force-dynamic";

const corpoSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(3, "Informe o nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(160),
  papel: z.enum(["admin", "operador"]),
  ativo: z.boolean().default(true),
  senha: z.string().min(10, "A senha precisa de pelo menos 10 caracteres").max(200).optional().or(z.literal("")),
});

const MOTIVOS: Record<string, string> = {
  email_em_uso: "Já existe uma conta com este e-mail.",
  sem_senha: "Defina uma senha para a conta nova.",
  conta_mestra: "A conta da senha mestra não é editável por aqui.",
  nao_encontrado: "Conta não encontrada.",
};

/** Cria ou edita uma conta da equipe. A senha vai para o banco só como hash (scrypt). */
export async function POST(req: NextRequest) {
  const { sessao, negado } = await exigir("admin");
  if (negado) return negado;
  const parsed = corpoSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 422 });
  }
  const { senha, ...dados } = parsed.data;
  if (dados.id === sessao.id && (!dados.ativo || dados.papel !== "admin")) {
    return NextResponse.json({ error: "Você não pode tirar o próprio acesso de admin." }, { status: 409 });
  }
  try {
    const r = await rpc<{ ok: boolean; motivo?: string }>("evp_admin_staff_salvar", {
      p_slug: SLUG,
      p_staff: sessao.id,
      p: { ...dados, senha_hash: senha ? await gerarHash(senha) : "" },
    });
    if (!r.ok) return NextResponse.json({ error: MOTIVOS[r.motivo ?? ""] ?? "Não foi possível salvar." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar." }, { status: 503 });
  }
}
