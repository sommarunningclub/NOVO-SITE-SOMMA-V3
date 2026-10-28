/**
 * Convite para o grupo do WhatsApp (+ pedido de WhatsApp para quem ficou sem)
 * às inscrições do Love Run feitas antes de 28/10/2026 19h10 (deploy do grupo).
 *
 *   npx tsx --conditions=react-server scripts/love-run-convite-grupo.mts                 # só lista
 *   npx tsx --conditions=react-server scripts/love-run-convite-grupo.mts --teste a@b.com # 2 versões p/ teste
 *   npx tsx --conditions=react-server scripts/love-run-convite-grupo.mts --enviar        # dispara
 *
 * Público: inscritos antes do corte OU ainda sem telefone (não cancelados).
 * Guarda quem já recebeu em ~/.cache/love-run-convite-grupo.json: rodar de
 * novo não manda em dobro. Imagens vão anexadas (cid), sem depender do site.
 * Lê o .env.local; não imprime dado pessoal.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "../lib/dexcomplica-love-run/event.config";
import { urlIngresso } from "../lib/dexcomplica-love-run/ticket";
import { assuntoConviteGrupo, renderConviteGrupo, textoConviteGrupo } from "../lib/emails/dexcomplica-love-run-convite-grupo";

const EVENTO = "052dec12-4e69-4df8-a824-28937a80fd5e";
const CORTE = "2026-10-28T19:10:00Z";
const LOG = join(homedir(), ".cache", "love-run-convite-grupo.json");

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

async function mandar(para: string, nome: string, token: string, semTelefone: boolean, prefixo = "") {
  const url = urlIngresso(token);
  const { html, anexos } = inline(renderConviteGrupo({ nome, urlIngresso: url, semTelefone }));
  const { error } = await resend.emails.send({
    from,
    to: para,
    subject: `${prefixo}${assuntoConviteGrupo(semTelefone)}`,
    html,
    text: textoConviteGrupo({ nome, urlIngresso: url, semTelefone }),
    attachments: anexos,
    tags: [{ name: "campanha", value: "love-run-convite-grupo" }],
  });
  return error ? error.message : null;
}

const args = process.argv.slice(2);

if (args[0] === "--teste") {
  const para = args[1];
  if (!para) throw new Error("Informe o e-mail de teste.");
  const tk = "previa_previa_previa_previa_previa_previa_x";
  console.log(await mandar(para, "Alex Rodrigues", tk, true, "[TESTE 1/2] ") ?? "✓ versão sem telefone enviada");
  await new Promise((r) => setTimeout(r, 700));
  console.log(await mandar(para, "Alex Rodrigues", tk, false, "[TESTE 2/2] ") ?? "✓ versão com telefone enviada");
  process.exit(0);
}

const { data, error } = await sb
  .from("evento_participantes")
  .select("id, nome_completo, email, telefone, ticket_token, criado_em")
  .eq("evento_id", EVENTO)
  .neq("status", "cancelado")
  .order("criado_em");
if (error) throw new Error(error.message);

const enviados: string[] = existsSync(LOG) ? JSON.parse(readFileSync(LOG, "utf8")) : [];
const alvo = (data ?? []).filter((p) => p.email && (p.criado_em < CORTE || !p.telefone) && !enviados.includes(p.id));
const semTel = alvo.filter((p) => !p.telefone).length;
console.log(`Público: ${alvo.length} (${semTel} sem telefone, ${alvo.length - semTel} só o convite). Já enviados antes: ${enviados.length}.`);

if (!args.includes("--enviar")) {
  console.log("Simulação. Rode com --enviar para disparar.");
  process.exit(0);
}

mkdirSync(join(homedir(), ".cache"), { recursive: true });
let ok = 0, falhas = 0;
for (const p of alvo) {
  const erro = await mandar(p.email!, p.nome_completo, p.ticket_token, !p.telefone);
  if (erro) {
    falhas++;
    console.log("✗ falha:", erro);
  } else {
    ok++;
    enviados.push(p.id);
    writeFileSync(LOG, JSON.stringify(enviados));
  }
  await new Promise((r) => setTimeout(r, 650));
}
console.log(`Enviados: ${ok}. Falhas: ${falhas}.`);
