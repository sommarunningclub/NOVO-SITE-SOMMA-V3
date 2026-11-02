/**
 * "Não vai poder ir? Passa sua vaga": como transferir o ingresso, para todas as inscrições ativas do Love Run.
 *
 *   npx tsx --conditions=react-server scripts/love-run-como-transferir.mts                 # só conta
 *   npx tsx --conditions=react-server scripts/love-run-como-transferir.mts --teste a@b.com # 1 teste
 *   npx tsx --conditions=react-server scripts/love-run-como-transferir.mts --enviar        # dispara
 *
 *   npx tsx --conditions=react-server scripts/love-run-como-transferir.mts --lembrete     # 2º envio, só p/ quem não abriu
 *
 * O 2º envio (lembrete, assunto diferente) só roda 24 h depois do 1º e só
 * para quem recebeu e não abriu nem clicou: quem devolveu ou foi suprimido
 * fica fora, e quem transferiu a vaga depois também (o e-mail mudou). Não
 * sai depois do prazo da transferência. É chamado pelo launchd do Mac
 * (scripts/love-run-lembrete-launchd.sh).
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
import { SITE_URL, prazoTransferenciaPassou } from "../lib/dexcomplica-love-run/event.config";
import { urlIngresso } from "../lib/dexcomplica-love-run/ticket";
import { ASSUNTO_COMO_TRANSFERIR, renderComoTransferir, textoComoTransferir } from "../lib/emails/dexcomplica-love-run-como-transferir";

const EVENTO = "052dec12-4e69-4df8-a824-28937a80fd5e";
const LOG = join(homedir(), ".cache", "love-run-como-transferir.json");
const LOG_LEMBRETE = join(homedir(), ".cache", "love-run-como-transferir-lembrete.json");
const ASSUNTO_LEMBRETE = "Lembrete: não vai poder ir ao Love Run? Dá para passar sua vaga";
const DIA_MS = 24 * 60 * 60 * 1000;

/** participante → e-mail na Resend e quando saiu. */
type Log = Record<string, { resend: string; em: string }>;
const lerLog = (f: string): Log => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : {});

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

async function mandar(para: string, nome: string, token: string, assunto = ASSUNTO_COMO_TRANSFERIR, tag = "love-run-como-transferir") {
  const url = urlIngresso(token);
  const { html, anexos } = inline(renderComoTransferir({ nome, urlIngresso: url }));
  const { data, error } = await resend.emails.send({
    from,
    to: para,
    subject: assunto,
    html,
    text: textoComoTransferir({ nome, urlIngresso: url }),
    attachments: anexos,
    tags: [{ name: "campanha", value: tag }],
  });
  return error ? { erro: error.message } : { id: data?.id ?? "" };
}

/** Status atual na Resend de cada e-mail do 1º envio (lista paginada; o que não vier, busca um a um). */
async function statusNaResend(ids: Set<string>, desde: string) {
  const out = new Map<string, { last_event: string; to: string }>();
  const h = { Authorization: `Bearer ${env.RESEND_API_KEY}`, "User-Agent": "curl/8.7.1" };
  let after: string | null = null;
  for (let i = 0; i < 500; i++) {
    const r = await fetch(`https://api.resend.com/emails?limit=100${after ? `&after=${after}` : ""}`, { headers: h });
    if (!r.ok) throw new Error(`Resend ${r.status}`);
    const j = (await r.json()) as { data?: { id: string; to: string[] | string; created_at: string; last_event: string }[]; has_more?: boolean };
    const d = j.data ?? [];
    for (const e of d) if (ids.has(e.id)) out.set(e.id, { last_event: e.last_event, to: String(([] as string[]).concat(e.to)[0] ?? "") });
    if (!d.length || !j.has_more || d[d.length - 1].created_at < desde) break;
    after = d[d.length - 1].id;
  }
  for (const id of ids) {
    if (out.has(id)) continue;
    const r = await fetch(`https://api.resend.com/emails/${id}`, { headers: h });
    if (r.ok) {
      const e = (await r.json()) as { to: string[] | string; last_event: string };
      out.set(id, { last_event: e.last_event, to: String(([] as string[]).concat(e.to)[0] ?? "") });
    }
    await new Promise((res) => setTimeout(res, 550));
  }
  return out;
}

const args = process.argv.slice(2);

if (args[0] === "--teste") {
  const para = args[1];
  if (!para) throw new Error("Informe o e-mail de teste.");
  const r = await mandar(para, "Alex Rodrigues", "previa_previa_previa_previa_previa_previa_x", `[TESTE] ${ASSUNTO_COMO_TRANSFERIR}`);
  console.log("erro" in r ? r.erro : "✓ teste enviado");
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

const lembrete = args.includes("--lembrete");
const primeiro = lerLog(LOG);
const arquivo = lembrete ? LOG_LEMBRETE : LOG;
const enviados = lembrete ? lerLog(LOG_LEMBRETE) : primeiro;
let alvo = linhas.filter((p) => p.email && !enviados[p.id]);

if (lembrete) {
  const datas = Object.values(primeiro).map((r) => r.em).sort();
  if (!datas.length) throw new Error("O 1º envio não tem registro: nada a lembrar.");
  const libera = new Date(new Date(datas[datas.length - 1]).getTime() + DIA_MS);
  if (Date.now() < libera.getTime()) {
    console.log(`Ainda não deu 24 h do 1º envio. Libera em ${libera.toISOString()}.`);
    process.exit(0);
  }
  if (prazoTransferenciaPassou()) {
    console.log("O prazo da transferência já passou: lembrete cancelado.");
    process.exit(0);
  }
  const status = await statusNaResend(new Set(Object.values(primeiro).map((r) => r.resend)), datas[0]);
  const resumo: Record<string, number> = {};
  for (const r of Object.values(primeiro)) {
    const ev = status.get(r.resend)?.last_event ?? "desconhecido";
    resumo[ev] = (resumo[ev] ?? 0) + 1;
  }
  console.log("1º envio na Resend agora:", JSON.stringify(resumo));
  const naoAbriu = new Set(["sent", "queued", "delivered", "delivery_delayed"]);
  alvo = alvo.filter((p) => {
    const r = primeiro[p.id];
    if (!r) return false;
    const st = status.get(r.resend);
    if (!st || !naoAbriu.has(st.last_event)) return false;
    return st.to.trim().toLowerCase() === p.email!.trim().toLowerCase();
  });
}

console.log(`${lembrete ? "Lembrete" : "1º envio"}: inscrições ativas ${linhas.length}, a enviar agora ${alvo.length}, já enviados antes ${Object.keys(enviados).length}.`);

if (!args.includes("--enviar")) {
  console.log("Simulação. Rode com --enviar para disparar.");
  process.exit(0);
}

mkdirSync(join(homedir(), ".cache"), { recursive: true });
let ok = 0, falhas = 0;
for (const p of alvo) {
  const r = lembrete
    ? await mandar(p.email!, p.nome_completo, p.ticket_token, ASSUNTO_LEMBRETE, "love-run-como-transferir-lembrete")
    : await mandar(p.email!, p.nome_completo, p.ticket_token);
  if ("erro" in r) {
    falhas++;
    console.log("✗ falha:", r.erro);
  } else {
    ok++;
    enviados[p.id] = { resend: r.id, em: new Date().toISOString() };
    writeFileSync(arquivo, JSON.stringify(enviados));
  }
  if ((ok + falhas) % 50 === 0) console.log(`... ${ok + falhas}/${alvo.length}`);
  await new Promise((res) => setTimeout(res, 650));
}
console.log(`Enviados: ${ok}. Falhas: ${falhas}.`);
