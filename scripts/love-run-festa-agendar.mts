/**
 * Agenda no módulo de E-mail do admin (admin.sommaclub.com.br/?section=email) o
 * e-mail "Love Run + Dexcomplica 28/11" para todos os inscritos do evento.
 *
 *   npx tsx --conditions=react-server scripts/love-run-festa-agendar.mts           # só mostra os números
 *   npx tsx --conditions=react-server scripts/love-run-festa-agendar.mts --gravar  # cria ou atualiza a campanha
 *
 * Um destinatário por e-mail. Saem quem devolveu ou marcou spam nas campanhas
 * anteriores do Love Run e quem está em `descadastros_globais`. Rodar de novo
 * antes do horário atualiza a lista (inscrição nova entra), sem duplicar; depois
 * que a campanha sai de 'agendada', não mexe em nada.
 * O cron do admin promove a campanha a cada 5 minutos. Não imprime dado pessoal.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { ASSUNTO_FESTA, PREHEADER_FESTA, renderFesta } from "../lib/emails/dexcomplica-love-run-festa";

const EVENTO = "052dec12-4e69-4df8-a824-28937a80fd5e";
const NOME = "Love Run · Sábado + benefício Dexcomplica 28/11";
const QUANDO = "2026-11-05T20:00:00.000Z"; // 17h de Brasília

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")])
);
const sb = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

const pessoas = new Map<string, string>();
let inscricoes = 0;
for (let de = 0; ; de += 1000) {
  const { data, error } = await sb
    .from("evento_participantes")
    .select("email, nome_completo")
    .eq("evento_id", EVENTO)
    .neq("status", "cancelado")
    .order("criado_em")
    .range(de, de + 999);
  if (error) throw new Error(error.message);
  for (const p of data ?? []) {
    inscricoes++;
    if (norm(p.email) && !pessoas.has(norm(p.email))) pessoas.set(norm(p.email), p.nome_completo);
  }
  if ((data ?? []).length < 1000) break;
}

const { data: anteriores, error: e1 } = await sb.from("email_campaigns").select("id").ilike("nome", "Love Run%");
if (e1) throw new Error(e1.message);
const fora = new Set<string>();
for (let de = 0; ; de += 1000) {
  const { data, error } = await sb
    .from("email_campaign_recipients")
    .select("email")
    .in("campaign_id", (anteriores ?? []).map((c) => c.id))
    .in("status", ["bounce", "spam"])
    .order("email")
    .range(de, de + 999);
  if (error) throw new Error(error.message);
  for (const r of data ?? []) fora.add(norm(r.email));
  if ((data ?? []).length < 1000) break;
}
const devolvidos = [...pessoas.keys()].filter((e) => fora.has(e)).length;

const lista = [...pessoas.keys()];
const descadastrados = new Set<string>();
for (let i = 0; i < lista.length; i += 200) {
  const { data, error } = await sb.from("descadastros_globais").select("email").in("email", lista.slice(i, i + 200));
  if (error) throw new Error(error.message);
  for (const r of data ?? []) descadastrados.add(norm(r.email));
}

const individuais = [...pessoas.entries()]
  .filter(([email]) => !fora.has(email) && !descadastrados.has(email))
  .map(([email, nome]) => ({ email, nome }));

console.log(
  `inscrições: ${inscricoes} | e-mails únicos: ${pessoas.size} | devolveram/spam: ${devolvidos} | descadastrados: ${descadastrados.size} | vão receber: ${individuais.length}`
);
if (!process.argv.includes("--gravar")) process.exit(0);

const campos = {
  nome: NOME,
  status: "agendada",
  template_key: "html_custom",
  subject: ASSUNTO_FESTA,
  preheader: PREHEADER_FESTA,
  content: { html: renderFesta({ nome: "{{primeiro_nome}}" }) },
  audience: { bases: [], individuais },
  scheduled_at: QUANDO,
  total_recipients: 0,
  updated_at: new Date().toISOString(),
};
const { data: ja } = await sb.from("email_campaigns").select("id, status").eq("nome", NOME).maybeSingle();
if (ja && ja.status !== "agendada") {
  console.log(`Campanha já está '${ja.status}': nada a fazer.`);
  process.exit(0);
}
const { error } = ja
  ? await sb.from("email_campaigns").update(campos).eq("id", ja.id)
  : await sb.from("email_campaigns").insert(campos);
if (error) throw new Error(error.message);
console.log(`✓ ${ja ? "Atualizada" : "Agendada"} no admin para ${QUANDO}.`);
