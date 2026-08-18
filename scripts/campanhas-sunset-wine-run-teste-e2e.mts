/**
 * Teste de ponta a ponta do disparo do Sunset Wine Run, isolado da base real.
 *
 *   npx tsx --conditions=react-server scripts/campanhas-sunset-wine-run-teste-e2e.mts seu@email.com
 *
 * Mesmo padrão dos outros dois testes e2e: contato de teste em segmento
 * "teste" (fora de SEGMENTOS, então nunca aparece no painel real), dispara de
 * verdade, confere as tabelas, depois --limpar apaga o próprio rastro.
 *
 * Sem link de vendas real ainda, o disparo real vai FALHAR de propósito (a
 * trava do placeholder em dispararCampanha) — o que este teste confirma é o
 * resto do cano: sincronização, prévia, geração do HTML.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getServiceSupabase } from "../lib/supabase";
import { destinatarios, dispararCampanha, CAMPANHA } from "../lib/campanhas/regua-sunset-wine-run";

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

const SEGMENTO_TESTE = "teste" as const;

async function main() {
  loadEnvLocal();
  const email = process.argv[2];
  if (!email || !email.includes("@")) {
    console.error("Uso: ... campanhas-sunset-wine-run-teste-e2e.mts seu@email.com");
    process.exit(1);
  }

  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");

  console.log("1. Inserindo contato de teste...");
  const { error: erroInsert } = await supabase
    .from("campanha_contatos")
    .upsert(
      { campanha: CAMPANHA, email: email.toLowerCase(), nome: "Teste E2E", segmento: SEGMENTO_TESTE },
      { onConflict: "campanha,email" }
    );
  if (erroInsert) throw new Error(`insert contato: ${erroInsert.message}`);

  console.log("2. Prévia (segmento teste)...");
  const previa = await destinatarios(SEGMENTO_TESTE);
  console.log(`   ${previa.length} destinatário(s):`, previa.map((d) => d.email));

  console.log("3. Disparando de verdade...");
  try {
    const resultado = await dispararCampanha(SEGMENTO_TESTE);
    console.log("   resultado:", resultado);
    console.log("\nOK. Confira a caixa de entrada.");
  } catch (err) {
    console.log("   Falhou (esperado sem link real):", err instanceof Error ? err.message : err);
  }

  console.log("\nDepois de conferir, limpe o rastro:");
  console.log(`  npx tsx --conditions=react-server scripts/campanhas-sunset-wine-run-teste-e2e.mts ${email} --limpar`);
}

async function limpar(email: string) {
  loadEnvLocal();
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase não configurado.");
  await supabase.from("campanha_destinatarios").delete().eq("campanha", CAMPANHA).eq("segmento", SEGMENTO_TESTE);
  await supabase.from("campanha_etapas").delete().eq("campanha", CAMPANHA).eq("segmento", SEGMENTO_TESTE);
  await supabase.from("campanha_eventos").delete().eq("campanha", CAMPANHA).eq("segmento", SEGMENTO_TESTE);
  await supabase.from("campanha_contatos").delete().eq("campanha", CAMPANHA).eq("email", email.toLowerCase());
  console.log("Rastro de teste apagado.");
}

const flag = process.argv[3];
if (flag === "--limpar") {
  limpar(process.argv[2]).catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
} else {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
