/**
 * "Não vai poder ir? Passa sua vaga": como transferir o ingresso, para todas as inscrições ativas do Love Run.
 *
 *   npx tsx --conditions=react-server scripts/love-run-como-transferir.mts                 # só conta
 *   npx tsx --conditions=react-server scripts/love-run-como-transferir.mts --teste a@b.com # 1 teste
 *   npx tsx --conditions=react-server scripts/love-run-como-transferir.mts --enviar        # dispara
 *
 * Um e-mail por inscrição (cada uma tem o seu link de ingresso), então quem
 * inscreveu mais de uma pessoa com o mesmo e-mail recebe um por ingresso.
 * Guarda quem já recebeu em ~/.cache/love-run-como-transferir.json: rodar de novo
 * não manda em dobro e pega só quem se inscreveu depois. Imagens vão
 * anexadas (cid), sem depender do site. Lê o .env.local; não imprime dado
 * pessoal.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "../lib/dexcomplica-love-run/event.config";
import { urlIngresso } from "../lib/dexcomplica-love-run/ticket";
import { ASSUNTO_COMO_TRANSFERIR, renderComoTransferir, textoComoTransferir } from "../lib/emails/dexcomplica-love-run-como-transferir";

const EVENTO = "052dec12-4e69-4df8-a824-28937a80fd5e";
const LOG = join(homedir(), ".cache", "love-run-como-transferir.json");

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")])
);
const from = env.VIP_EMAIL_FROM || env.EMAIL_FROM;
const resend = new Resend(env.RESEND_API_KEY);
const sb = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function inline(html: string) {
  const anexos: { filename: string; content: Buffer; contentId: string }[] = [];
  const vistos = new Map<string, string>();
  const out = html.replace(new RegExp(`${SITE_URL}(/dexcomplica-love-run/[^"')\\s]+\\.(?:png|jpg))`, "g"), (_, caminho: string) => {
    if (!vistos.has(caminho)) {
      const cid = `lr-${vistos.size}`;
      vistos.set(caminho, cid);
      anexos.push({ filename: caminho.split("/").pop()!, content: readFileSync(join("public", caminho)), contentId: cid });
    }
    return `cid:${vistos.get(caminho)}`;
  });
  return { html: out, anexos };
}

async function mandar(para: string, nome: string, token: string, prefixo = "") {
  const url = urlIngresso(token);
  const { html, anexos } = inline(renderComoTransferir({ nome, urlIngresso: url }));
  const { error } = await resend.emails.send({
    from,
    to: para,
    subject: `${prefixo}${ASSUNTO_COMO_TRANSFERIR}`,
    html,
    text: textoComoTransferir({ nome, urlIngresso: url }),
    attachments: anexos,
    tags: [{ name: "campanha", value: "love-run-como-transferir" }],
  });
  return error ? error.message : null;
}

const args = process.argv.slice(2);

if (args[0] === "--teste") {
  const para = args[1];
  if (!para) throw new Error("Informe o e-mail de teste.");
  console.log((await mandar(para, "Alex Rodrigues", "previa_previa_previa_previa_previa_previa_x", "[TESTE] ")) ?? "✓ teste enviado");
  process.exit(0);
}

const linhas: { id: string; nome_completo: string; email: string | null; ticket_token: string }[] = [];
for (let de = 0; ; de += 1000) {
  const { data, error } = await sb
    .from("evento_participantes")
    .select("id, nome_completo, email, ticket_token")
    .eq("evento_id", EVENTO)
    .neq("status", "cancelado")
    .order("criado_em")
    .range(de, de + 999);
  if (error) throw new Error(error.message);
  linhas.push(...(data ?? []));
  if ((data ?? []).length < 1000) break;
}

const enviados: string[] = existsSync(LOG) ? JSON.parse(readFileSync(LOG, "utf8")) : [];
const alvo = linhas.filter((p) => p.email && !enviados.includes(p.id));
console.log(`Inscrições ativas: ${linhas.length}. A enviar agora: ${alvo.length}. Já enviados antes: ${enviados.length}.`);

if (!args.includes("--enviar")) {
  console.log("Simulação. Rode com --enviar para disparar.");
  process.exit(0);
}

mkdirSync(join(homedir(), ".cache"), { recursive: true });
let ok = 0, falhas = 0;
for (const p of alvo) {
  const erro = await mandar(p.email!, p.nome_completo, p.ticket_token);
  if (erro) {
    falhas++;
    console.log("✗ falha:", erro);
  } else {
    ok++;
    enviados.push(p.id);
    writeFileSync(LOG, JSON.stringify(enviados));
  }
  if ((ok + falhas) % 50 === 0) console.log(`... ${ok + falhas}/${alvo.length}`);
  await new Promise((r) => setTimeout(r, 650));
}
console.log(`Enviados: ${ok}. Falhas: ${falhas}.`);
