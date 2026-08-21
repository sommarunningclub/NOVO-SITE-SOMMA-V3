/**
 * Monta os segmentos da campanha Evolve a partir da base.
 *
 *   npx tsx --conditions=react-server scripts/evolve-fortalecimento-segmento.mts --contar
 *   npx tsx --conditions=react-server scripts/evolve-fortalecimento-segmento.mts --escrever <pasta>
 *
 * `--contar` só informa os tamanhos e não grava nada. `--escrever` gera
 * `segmento-cadastro-site.json` e `segmento-checkins.json` na pasta indicada, no
 * formato que o script de broadcast espera.
 *
 * Dedup em duas camadas, e a ordem importa:
 *
 *   1. dentro de cada tabela, por e-mail em minúsculas (a base tem o mesmo
 *      endereço repetido em check-ins de eventos diferentes);
 *   2. entre as duas, `cadastro_site` ganha. Quem está nas duas listas recebe UM
 *      e-mail, contado como cadastro_site. Sem isto, milhares de pessoas
 *      receberiam a mesma oferta duas vezes, o que queima domínio e reputação
 *      mais rápido do que qualquer ganho de alcance.
 *
 * Os arquivos gerados contêm e-mail e nome da base. Não versionar: gere numa
 * pasta fora do repositório, use e apague.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

interface Contato {
  email: string;
  nome?: string | null;
}

/** Endereço plausível. Não valida entrega, só descarta lixo óbvio da base. */
const EMAIL_OK = /^[^\s@,;]+@[^\s@,;.]+\.[a-z]{2,}$/i;

/**
 * O PostgREST devolve no máximo 1000 linhas por chamada. Sem paginar, o
 * segmento sairia truncado em 1000 e o disparo pareceria completo.
 */
async function puxarTudo(
  supabase: ReturnType<typeof createClient>,
  tabela: string
): Promise<Contato[]> {
  const passo = 1000;
  const linhas: Contato[] = [];
  for (let inicio = 0; ; inicio += passo) {
    const { data, error } = await supabase
      .from(tabela)
      .select("email, nome_completo")
      .range(inicio, inicio + passo - 1);
    if (error) throw new Error(`${tabela}: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const r of data as Array<{ email: unknown; nome_completo: unknown }>) {
      linhas.push({
        email: String(r.email ?? "").trim(),
        nome: typeof r.nome_completo === "string" ? r.nome_completo : null,
      });
    }
    process.stdout.write(`  ${tabela}: ${linhas.length}\r`);
    if (data.length < passo) break;
  }
  return linhas;
}

/** Primeira ocorrência ganha, comparando por e-mail em minúsculas. */
function dedup(linhas: Contato[], jaVistos = new Set<string>()) {
  const saida: Contato[] = [];
  let invalidos = 0;
  let repetidos = 0;
  for (const c of linhas) {
    if (!EMAIL_OK.test(c.email)) { invalidos++; continue; }
    const chave = c.email.toLowerCase();
    if (jaVistos.has(chave)) { repetidos++; continue; }
    jaVistos.add(chave);
    saida.push({ email: c.email.toLowerCase(), nome: c.nome });
  }
  return { saida, invalidos, repetidos, jaVistos };
}

async function main() {
  loadEnvLocal();

  const contar = process.argv.includes("--contar");
  const idxEscrever = process.argv.indexOf("--escrever");
  const pasta = idxEscrever >= 0 ? process.argv[idxEscrever + 1] : null;

  if (!contar && !pasta) {
    console.error("Uso: ... --contar   |   ... --escrever <pasta>");
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Supabase não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const brutoCadastro = await puxarTudo(supabase, "cadastro_site");
  const brutoCheckins = await puxarTudo(supabase, "checkins");

  // cadastro_site primeiro: é quem fica com o contato quando o e-mail está nas duas.
  const cadastro = dedup(brutoCadastro);
  const checkins = dedup(brutoCheckins, cadastro.jaVistos);

  const linha = (rot: string, bruto: number, r: ReturnType<typeof dedup>) =>
    console.log(
      `${rot.padEnd(14)} bruto ${String(bruto).padStart(6)}` +
        ` · válidos ${String(r.saida.length).padStart(6)}` +
        ` · repetidos ${String(r.repetidos).padStart(5)}` +
        ` · inválidos ${String(r.invalidos).padStart(4)}`
    );

  console.log("");
  linha("cadastro_site", brutoCadastro.length, cadastro);
  linha("checkins", brutoCheckins.length, checkins);
  console.log(`${"".padEnd(14)}${"".padEnd(7)}${"".padEnd(6)}   TOTAL A RECEBER: ${cadastro.saida.length + checkins.saida.length}`);
  console.log(
    `\nO cruzamento tirou ${checkins.repetidos} endereço(s) de checkins que já estavam em cadastro_site.`
  );

  if (!pasta) {
    console.log("\n[--contar] Nada foi gravado.");
    return;
  }

  mkdirSync(pasta, { recursive: true });
  const a = join(pasta, "segmento-cadastro-site.json");
  const b = join(pasta, "segmento-checkins.json");
  writeFileSync(a, JSON.stringify(cadastro.saida, null, 2));
  writeFileSync(b, JSON.stringify(checkins.saida, null, 2));
  console.log(`\n${a}  (${cadastro.saida.length})`);
  console.log(`${b}  (${checkins.saida.length})`);
  console.log("\nContêm dados da base. Use e apague; não versionar.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
