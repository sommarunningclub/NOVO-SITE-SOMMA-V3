/**
 * Leva para o módulo de E-mail do admin (admin.sommaclub.com.br/?section=email)
 * os e-mails do Love Run que saíram pelo site, e não pelas campanhas da gestão:
 *   - "É treinão, não é prova" (script love-run-treinao.mts, 02/11/2026)
 *   - "Não vai poder ir? Passa sua vaga" (script love-run-como-transferir.mts)
 *   - a confirmação de inscrição com o ingresso (automática, a cada inscrição)
 *
 *   npx tsx --conditions=react-server scripts/love-run-campanhas-admin.mts           # só mostra os números
 *   npx tsx --conditions=react-server scripts/love-run-campanhas-admin.mts --gravar  # grava/atualiza no admin
 *   npx tsx --conditions=react-server scripts/love-run-campanhas-admin.mts --agendar-lembrete  # cria o lembrete da transferência
 *
 * --agendar-lembrete: cria no admin a campanha "lembrete" da transferência,
 * 'agendada' para 24 h depois do último e-mail do 1º envio, para os mesmos
 * destinatários menos quem devolveu. Quem abriu ou clicou o 1º sai na hora do
 * disparo (`excluir_abertos_de`, resolvido pelo cron do admin com as aberturas
 * que o webhook registra). Como a campanha é a mesma para todos, o link do
 * ingresso vira o "Acessar meu ingresso" da LP (CPF + e-mail).
 *
 * Cada campanha entra como 'enviada' (o disparador da gestão só envia
 * 'enviando', então nada sai de novo). Um destinatário por e-mail, como a
 * tabela exige, com o status atual na Resend e o `resend_email_id`: daqui em
 * diante o webhook da Resend no admin atualiza aberturas e cliques sozinho.
 * A confirmação é um retrato: inscrições novas só entram rodando de novo.
 * Rodar de novo atualiza as mesmas campanhas (procura pelo nome), sem duplicar.
 * Lê o .env.local; não imprime dado pessoal.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { EVENTO_URL } from "../lib/dexcomplica-love-run/event.config";
import { qrSvg } from "../lib/dexcomplica-love-run/ticket";
import { ASSUNTO_TREINAO, renderTreinao } from "../lib/emails/dexcomplica-love-run-treinao";
import { ASSUNTO_COMO_TRANSFERIR, ASSUNTO_LEMBRETE_TRANSFERIR, renderComoTransferir } from "../lib/emails/dexcomplica-love-run-como-transferir";
import { assunto as assuntoIngresso, renderIngressoEmail } from "../lib/emails/dexcomplica-love-run-ingresso";

const EVENTO = "052dec12-4e69-4df8-a824-28937a80fd5e";
const DESDE = "2026-10-27";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")])
);
const sb = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface EmailResend {
  id: string;
  to: string[] | string;
  subject: string;
  created_at: string;
  last_event: string;
}

async function emailsDaResend(): Promise<EmailResend[]> {
  const todos: EmailResend[] = [];
  let after: string | null = null;
  for (let i = 0; i < 500; i++) {
    const r = await fetch(`https://api.resend.com/emails?limit=100${after ? `&after=${after}` : ""}`, {
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "User-Agent": "curl/8.7.1" },
    });
    if (!r.ok) throw new Error(`Resend ${r.status}`);
    const j = (await r.json()) as { data?: EmailResend[]; has_more?: boolean };
    const d = j.data ?? [];
    todos.push(...d);
    if (!d.length || !j.has_more || d[d.length - 1].created_at < DESDE) break;
    after = d[d.length - 1].id;
  }
  return todos.filter((e) => e.created_at >= DESDE);
}

/** Último evento da Resend → status do admin (o CHECK da tabela não tem 'suprimido' nem 'atrasado'). */
const STATUS: Record<string, string> = {
  sent: "enviado",
  queued: "enviado",
  delivery_delayed: "enviado",
  delivered: "entregue",
  opened: "aberto",
  clicked: "clicado",
  bounced: "bounce",
  complained: "spam",
  failed: "falha",
  suppressed: "falha",
  canceled: "falha",
};
const RANK = ["falha", "bounce", "spam", "enviado", "entregue", "aberto", "clicado"];
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

const pessoas = new Map<string, string>();
for (let de = 0; ; de += 1000) {
  const { data, error } = await sb
    .from("evento_participantes")
    .select("email, nome_completo")
    .eq("evento_id", EVENTO)
    .neq("status", "cancelado")
    .order("criado_em")
    .range(de, de + 999);
  if (error) throw new Error(error.message);
  for (const p of data ?? []) if (!pessoas.has(norm(p.email))) pessoas.set(norm(p.email), p.nome_completo);
  if ((data ?? []).length < 1000) break;
}

const resend = await emailsDaResend();
const exemplo = "previa_previa_previa_previa_previa_previa_x";

const CAMPANHAS = [
  {
    nome: "Love Run · É treinão, não é prova",
    subject: ASSUNTO_TREINAO,
    preheader: "Sem kit, sem número de peito, sem cronômetro. É todo mundo correndo junto, de graça.",
    html: renderTreinao({ nome: "{{primeiro_nome}}", urlIngresso: EVENTO_URL }),
  },
  {
    nome: "Love Run · Como transferir o ingresso",
    subject: ASSUNTO_COMO_TRANSFERIR,
    preheader: "Em 4 passos, direto pelo site, até as 06h30 do sábado.",
    html: renderComoTransferir({ nome: "{{primeiro_nome}}", urlIngresso: EVENTO_URL }),
  },
  {
    nome: "Love Run · Confirmação de inscrição (automático)",
    subject: assuntoIngresso(false),
    preheader: null,
    html: renderIngressoEmail({
      nome: "{{primeiro_nome}}",
      ticketCode: "DLR-XXXXXX",
      url: EVENTO_URL,
      pelotao: "6km",
      qrSrc: `data:image/svg+xml;utf8,${encodeURIComponent(await qrSvg(exemplo))}`,
    }),
  },
];

const gravar = process.argv.includes("--gravar");

for (const c of CAMPANHAS) {
  const envios = resend.filter((e) => e.subject === c.subject);
  const porEmail = new Map<string, { id: string; status: string; sent_at: string; erro: string | null }>();
  for (const e of envios) {
    for (const to of ([] as string[]).concat(e.to)) {
      const email = norm(to);
      if (!pessoas.has(email)) continue; // só inscritos do evento (fica fora teste e envio para outro evento)
      const status = STATUS[e.last_event] ?? "enviado";
      const atual = porEmail.get(email);
      if (!atual || RANK.indexOf(status) > RANK.indexOf(atual.status)) {
        porEmail.set(email, {
          id: e.id,
          status,
          sent_at: e.created_at,
          erro: e.last_event === "suppressed" ? "suprimido pela Resend (devolução anterior)" : null,
        });
      }
    }
  }

  const contagem: Record<string, number> = {};
  for (const r of porEmail.values()) contagem[r.status] = (contagem[r.status] ?? 0) + 1;
  const datas = envios.map((e) => e.created_at).sort();
  console.log(`\n${c.nome}\n  e-mails enviados: ${envios.length} | destinatários (1 por endereço): ${porEmail.size}\n  status: ${JSON.stringify(contagem)}`);
  if (!gravar || !porEmail.size) continue;

  const campos = {
    nome: c.nome,
    status: "enviada",
    template_key: "html_custom",
    subject: c.subject,
    preheader: c.preheader,
    content: { html: c.html },
    audience: { bases: [] },
    started_at: datas[0],
    finished_at: datas[datas.length - 1],
    total_recipients: porEmail.size,
    updated_at: new Date().toISOString(),
  };
  const { data: existente } = await sb.from("email_campaigns").select("id").eq("nome", c.nome).maybeSingle();
  const { data: camp, error: e1 } = existente
    ? await sb.from("email_campaigns").update(campos).eq("id", existente.id).select("id").single()
    : await sb.from("email_campaigns").insert(campos).select("id").single();
  if (e1 || !camp) throw new Error(e1?.message ?? "campanha não gravada");

  const linhas = [...porEmail.entries()].map(([email, r]) => ({
    campaign_id: camp.id,
    email,
    nome: pessoas.get(email) ?? null,
    source_base: "love_run",
    resend_email_id: r.id,
    status: r.status,
    error: r.erro,
    sent_at: r.sent_at,
  }));
  for (let i = 0; i < linhas.length; i += 500) {
    const { error } = await sb.from("email_campaign_recipients").upsert(linhas.slice(i, i + 500), { onConflict: "campaign_id,email" });
    if (error) throw new Error(error.message);
  }
  console.log(`  ✓ gravada no admin (${existente ? "atualizada" : "nova"})`);
}

if (process.argv.includes("--agendar-lembrete")) {
  const NOME = "Love Run · Como transferir o ingresso (lembrete, quem não abriu)";
  const { data: primeiro } = await sb
    .from("email_campaigns")
    .select("id, finished_at")
    .eq("nome", "Love Run · Como transferir o ingresso")
    .maybeSingle();
  if (!primeiro?.finished_at) throw new Error("Grave o 1º envio no admin antes (--gravar).");
  const { data: ja } = await sb.from("email_campaigns").select("id, status, scheduled_at").eq("nome", NOME).maybeSingle();
  if (ja) {
    console.log(`\nLembrete já existe no admin: ${ja.status}, ${ja.scheduled_at}. Nada a fazer.`);
    process.exit(0);
  }
  const { data: dest, error: e0 } = await sb
    .from("email_campaign_recipients")
    .select("email, nome, status")
    .eq("campaign_id", primeiro.id);
  if (e0 || !dest) throw new Error(e0?.message ?? "sem destinatários");
  const individuais = dest.filter((r) => !["bounce", "spam", "falha"].includes(r.status)).map((r) => ({ email: r.email, nome: r.nome }));
  const quando = new Date(new Date(primeiro.finished_at).getTime() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await sb.from("email_campaigns").insert({
    nome: NOME,
    status: "agendada",
    template_key: "html_custom",
    subject: ASSUNTO_LEMBRETE_TRANSFERIR,
    preheader: "Em 4 passos, direto pelo site, até as 06h30 do sábado.",
    content: { html: renderComoTransferir({ nome: "{{primeiro_nome}}", urlIngresso: `${EVENTO_URL}#meu-ingresso` }) },
    audience: { bases: [], individuais, excluir_abertos_de: [primeiro.id] },
    scheduled_at: quando,
    total_recipients: 0,
  });
  if (error) throw new Error(error.message);
  const abriram = dest.filter((r) => ["aberto", "clicado"].includes(r.status)).length;
  console.log(`\n✓ Lembrete agendado no admin para ${quando}: ${individuais.length} na lista, ${abriram} já abriram e saem no disparo.`);
}
