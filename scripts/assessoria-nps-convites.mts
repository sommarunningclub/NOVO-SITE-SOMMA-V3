/**
 * Links pessoais do NPS da Assessoria.
 *
 *   npx tsx scripts/assessoria-nps-convites.mts                     simula: só conta
 *   npx tsx scripts/assessoria-nps-convites.mts --gerar --saida c.csv   grava o que falta e exporta
 *   ... --base http://localhost:3000                                troca o domínio dos links
 *
 * Alunos: `professor_clients` com status active, o mesmo vínculo aluno-professor
 * da gestão. Um convite por aluno por rodada (unique campaign_id +
 * student_asaas_id): rodar de novo cria só os que faltam e NUNCA troca o link
 * de quem já recebeu.
 *
 * O CSV tem nome, professor e link pessoal. É dado pessoal: não versionar, não
 * colar em grupo. O link vale só para a rodada ativa.
 *
 * Precisa de SUPABASE_SERVICE_ROLE_KEY no .env.local.
 */
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { separarNomeCompleto } from "../lib/assessoria-nps/nome";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* variáveis podem vir do ambiente */
}

const args = process.argv.slice(2);
const opcao = (nome: string) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : undefined;
};
const gerar = args.includes("--gerar");
const saida = opcao("--saida");
const base = (opcao("--base") ?? "https://sommaclub.com.br").replace(/\/+$/, "");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !chave) {
  console.error("Faltam SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
if (gerar && !saida) {
  console.error("Use --saida <arquivo.csv>: os links são pessoais e não devem ir para o terminal.");
  process.exit(1);
}

const sb = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: campanha, error: erroCampanha } = await sb
  .from("nps_assessoria_campaigns")
  .select("id, slug")
  .eq("status", "active")
  .maybeSingle();
if (erroCampanha || !campanha) {
  console.error("Nenhuma campanha ativa em nps_assessoria_campaigns.", erroCampanha?.message ?? "");
  process.exit(1);
}

interface LinhaAluno {
  asaas_customer_id: string;
  customer_name: string | null;
  professor_id: string | null;
  linked_at: string | null;
  professors: { name: string | null } | { name: string | null }[] | null;
}

const { data: linhas, error: erroAlunos } = await sb
  .from("professor_clients")
  .select("asaas_customer_id, customer_name, professor_id, linked_at, professors(name)")
  .eq("status", "active")
  .not("asaas_customer_id", "is", null);
if (erroAlunos || !linhas) {
  console.error("Falha ao ler professor_clients:", erroAlunos?.message);
  process.exit(1);
}

// Um aluno, um convite: se aparece com dois professores, vale o vínculo mais recente.
const porAluno = new Map<string, LinhaAluno>();
for (const l of linhas as unknown as LinhaAluno[]) {
  if (!l.customer_name?.trim()) continue;
  const atual = porAluno.get(l.asaas_customer_id);
  if (!atual || (l.linked_at ?? "") > (atual.linked_at ?? "")) porAluno.set(l.asaas_customer_id, l);
}

const { data: existentes, error: erroExistentes } = await sb
  .from("nps_assessoria_invites")
  .select("student_asaas_id")
  .eq("campaign_id", campanha.id);
if (erroExistentes) {
  console.error("Falha ao ler convites:", erroExistentes.message);
  process.exit(1);
}
const jaTem = new Set((existentes ?? []).map((e) => e.student_asaas_id as string));
const faltam = [...porAluno.values()].filter((a) => !jaTem.has(a.asaas_customer_id));

console.log(`Campanha ${campanha.slug}`);
console.log(`  alunos ativos ........ ${porAluno.size}`);
console.log(`  já com convite ....... ${jaTem.size}`);
console.log(`  convites a criar ..... ${faltam.length}`);

if (!gerar) {
  console.log("\nSimulação. Para gravar e exportar: --gerar --saida convites.csv");
  process.exit(0);
}

if (faltam.length) {
  const novos = faltam.map((a) => {
    const { first, last } = separarNomeCompleto(a.customer_name ?? "");
    const prof = Array.isArray(a.professors) ? a.professors[0] : a.professors;
    return {
      campaign_id: campanha.id,
      token: randomBytes(24).toString("base64url"),
      student_asaas_id: a.asaas_customer_id,
      first_name: first,
      last_name: last || "-",
      professor_id: a.professor_id,
      professor_name: prof?.name?.trim() || null,
    };
  });
  const { error } = await sb
    .from("nps_assessoria_invites")
    .upsert(novos, { onConflict: "campaign_id,student_asaas_id", ignoreDuplicates: true });
  if (error) {
    console.error("Falha ao gravar convites:", error.message);
    process.exit(1);
  }
}

const { data: convites, error: erroConvites } = await sb
  .from("nps_assessoria_invites")
  .select("first_name, last_name, professor_name, token, opened_at")
  .eq("campaign_id", campanha.id)
  .order("professor_name")
  .order("first_name");
if (erroConvites || !convites) {
  console.error("Falha ao exportar convites:", erroConvites?.message);
  process.exit(1);
}

const celula = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const csv = [
  ["nome", "sobrenome", "professor", "abriu_em", "link"].join(";"),
  ...convites.map((c) =>
    [c.first_name, c.last_name, c.professor_name, c.opened_at, `${base}/assessoria/nps/convite/${c.token}`]
      .map(celula)
      .join(";")
  ),
].join("\n");

writeFileSync(saida as string, `${csv}\n`, "utf8");
console.log(`\n${convites.length} links exportados para ${saida}.`);
