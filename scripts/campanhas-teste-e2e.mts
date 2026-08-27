/**
 * Teste de ponta a ponta do envio transacional, isolado da base real.
 *
 *   npx tsx --conditions=react-server scripts/campanhas-teste-e2e.mts seu@email.com
 *
 * Insere UM contato de teste (segmento "teste", fora de SEGMENTOS, então nunca
 * aparece no painel nem é varrido por sincronizarBase) e dispara a etapa 1 real
 * via dispararEtapa — o mesmo código que vai rodar para os 6.875 da base.
 * No fim, apaga o próprio rastro.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getServiceSupabase } from "../lib/supabase";
import { dispararEtapa, destinatariosDaEtapa, CAMPANHA } from "../lib/campanhas/regua";

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
    console.error("Uso: ... campanhas-teste-e2e.mts seu@email.com");
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

  console.log("2. Prévia da etapa 1 (segmento teste)...");
  const previa = await destinatariosDaEtapa(1, SEGMENTO_TESTE);
  console.log(`   ${previa.length} destinatário(s):`, previa.map((d) => d.email));

  console.log("3. Disparando etapa 1 de verdade (batch.send)...");
  const resultado = await dispararEtapa({ etapa: 1, segmento: SEGMENTO_TESTE });
  console.log("   resultado:", resultado);

  console.log("4. Conferindo campanha_destinatarios...");
  const { data: dest } = await supabase
    .from("campanha_destinatarios")
    .select("*")
    .eq("campanha", CAMPANHA)
    .eq("etapa", 1)
    .eq("segmento", SEGMENTO_TESTE);
  console.log("   ", dest);

  console.log("5. Conferindo campanha_etapas...");
  const { data: etapa } = await supabase
    .from("campanha_etapas")
    .select("*")
    .eq("campanha", CAMPANHA)
    .eq("etapa", 1)
    .eq("segmento", SEGMENTO_TESTE)
    .maybeSingle();
  console.log("   ", etapa);

  console.log("\nOK. Confira a caixa de entrada:");
  console.log("  - assunto/corpo corretos");
  console.log("  - link 'Descadastrar' no rodapé funciona (abre a página de confirmação)");
  console.log("\nDepois de conferir, rode com --limpar para apagar o rastro de teste:");
  console.log(`  npx tsx --conditions=react-server scripts/campanhas-teste-e2e.mts ${email} --limpar`);
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
