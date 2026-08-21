/**
 * Avisa todos os candidatos de uma vaga encerrada que ela já foi preenchida.
 *
 *   npx tsx --conditions=react-server scripts/vaga-encerrada-broadcast.mts <slug> [--enviar]
 *
 * Exemplo:
 *   npx tsx --conditions=react-server scripts/vaga-encerrada-broadcast.mts estagio-educacao-fisica --enviar
 *
 * SEM --enviar o script só lista os candidatos e simula, sem tocar em nada.
 * Dedup por e-mail: se a mesma pessoa se candidatou mais de uma vez, recebe um
 * único aviso.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { sendVagaEncerradaEmail } from "../lib/emails/vaga-encerrada";
import { getVagaBySlug } from "../app/trabalhe-conosco-vagas/_vagas";

function loadEnvLocal() {
  const text = readFileSync(resolve(".env.local"), "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  loadEnvLocal();

  const slug = process.argv[2];
  const enviar = process.argv.includes("--enviar");

  if (!slug) {
    console.error("Uso: ... scripts/vaga-encerrada-broadcast.mts <slug> [--enviar]");
    process.exit(1);
  }

  const vaga = getVagaBySlug(slug);
  if (!vaga) {
    console.error(`Vaga "${slug}" não encontrada em _vagas.ts.`);
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes em .env.local.");
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const candidatos: { nome: string; email: string }[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("candidatos_vagas")
      .select("nome, email")
      .eq("vaga_slug", slug)
      .range(from, from + pageSize - 1);
    if (error) {
      console.error("Erro ao consultar candidatos_vagas:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    candidatos.push(...data);
    if (data.length < pageSize) break;
  }

  const porEmail = new Map<string, string>();
  for (const c of candidatos) {
    const email = (c.email || "").trim().toLowerCase();
    if (email && !porEmail.has(email)) porEmail.set(email, c.nome || email);
  }

  console.log(`Vaga:        ${vaga.titulo} (${slug})`);
  console.log(`Candidaturas: ${candidatos.length}`);
  console.log(`Destinatários únicos: ${porEmail.size}`);

  if (!enviar) {
    console.log("\n[simulação] Nada foi enviado. Repita com --enviar para valer.");
    for (const [email, nome] of porEmail) console.log(`  - ${nome} <${email}>`);
    return;
  }

  let enviados = 0;
  const falhas: string[] = [];
  for (const [email, nome] of porEmail) {
    const result = await sendVagaEncerradaEmail({ nome, email, vaga_titulo: vaga.titulo });
    if (result.ok) {
      enviados++;
    } else {
      falhas.push(`${email}: ${JSON.stringify(result.error)}`);
      console.warn(`  falha em ${email}:`, result.error);
    }
    await espera(550);
  }

  console.log(`\nEnviados: ${enviados}/${porEmail.size} (falhas: ${falhas.length})`);
  if (falhas.length) console.log(falhas.join("\n"));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
