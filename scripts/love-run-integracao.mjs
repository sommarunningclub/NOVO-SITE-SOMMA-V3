/**
 * Teste de integração do Dexcomplica Love Run contra o banco real, num
 * EVENTO DE TESTE OCULTO (nunca no evento oficial).
 *
 *   node scripts/love-run-integracao.mjs preparar   # cria o evento de teste (oculto no /check-in)
 *   node scripts/love-run-integracao.mjs testar     # roda o fluxo HTTP contra o servidor local
 *   node scripts/love-run-integracao.mjs limpar     # apaga evento, inscrições, check-ins e cadastros de teste
 *
 * Evento de teste manual (para clicar no formulário):
 *   SLUG=teste-love-run-manual CAPACIDADE=50 PELOTOES="Teste A,Teste B" node scripts/love-run-integracao.mjs preparar
 *
 * O servidor local precisa estar apontado para o evento de teste e SEM Resend
 * (os e-mails de teste são @teste.invalid e não podem sair):
 *
 *   LOVE_RUN_EVENTO_SLUG=teste-dexcomplica-love-run RESEND_API_KEY= npx next dev -p 3108
 *   BASE=http://localhost:3108 node scripts/love-run-integracao.mjs testar
 *
 * Requer a migration 20261027120000_dexcomplica_love_run.sql aplicada
 * (coluna eventos.capacidade). Lê o .env.local; não imprime segredo.
 */
import { readFileSync } from "node:fs";
import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const SLUG = process.env.SLUG ?? "teste-dexcomplica-love-run";
const DOMINIO = "teste.invalid";
const CAPACIDADE = Number(process.env.CAPACIDADE ?? 3);
const PELOTOES = (process.env.PELOTOES ?? "teste-a,teste-b").split(",");
const BASE = process.env.BASE ?? "http://localhost:3108";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")])
);
const sb = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let ok = 0, bad = 0;
const t = (n, c, d = "") => (c ? (ok++, console.log("  ✓", n)) : (bad++, console.log("  ✗", n, d)));

async function eventoTeste() {
  const { data, error } = await sb.from("eventos").select("*").eq("slug", SLUG).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

function cpfValido() {
  const n = Array.from({ length: 9 }, () => randomInt(10));
  if (new Set(n).size === 1) return cpfValido();
  const dv = (arr) => {
    const s = arr.reduce((acc, d, i) => acc + d * (arr.length + 1 - i), 0);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  n.push(dv(n));
  n.push(dv(n));
  return n.join("");
}

/** CPF válido que ninguém da base usa: o teste nunca encosta em pessoa real. */
async function cpfLivre() {
  for (;;) {
    const c = cpfValido();
    const { data } = await sb.from("cadastro_site").select("id").eq("cpf_digits", c).maybeSingle();
    if (!data) return c;
  }
}

async function preparar() {
  const atual = await eventoTeste();
  const linha = {
    titulo: "[TESTE] Dexcomplica Love Run (apagar)",
    descricao: "Evento de teste automático. Oculto no /check-in.",
    data_evento: "2026-11-07",
    horario_inicio: null,
    local: "TESTE",
    tipo: "corrida",
    checkin_status: "aberto",
    pelotoes: PELOTOES,
    slug: SLUG,
    oculto_no_checkin_publico: true,
    evento_encerrado: false,
    capacidade: CAPACIDADE,
  };
  const { error } = atual
    ? await sb.from("eventos").update(linha).eq("id", atual.id)
    : await sb.from("eventos").insert(linha);
  if (error) throw new Error(error.message);
  const ev = await eventoTeste();
  console.log(`Evento de teste pronto: ${ev.id} (oculto, ${CAPACIDADE} vagas, pelotões ${ev.pelotoes.join("/")})`);
}

async function limpar() {
  const ev = await eventoTeste();
  if (!ev) return console.log("Nada a limpar.");
  const { data: parts } = await sb.from("evento_participantes").select("pessoa_id").eq("evento_id", ev.id);
  const pessoas = [...new Set((parts ?? []).map((p) => p.pessoa_id))];
  await sb.from("checkins").delete().eq("evento_id", ev.id);
  await sb.from("evento_participantes").delete().eq("evento_id", ev.id);
  // Só apaga cadastro criado pelo teste (e-mail @teste.invalid) e sem outra participação.
  let apagados = 0;
  for (const id of pessoas) {
    const { data: p } = await sb.from("cadastro_site").select("id, email").eq("id", id).maybeSingle();
    if (!p?.email?.endsWith(`@${DOMINIO}`)) continue;
    const { count } = await sb.from("evento_participantes").select("id", { count: "exact", head: true }).eq("pessoa_id", id);
    if (count) continue;
    const { error } = await sb.from("cadastro_site").delete().eq("id", id);
    if (!error) apagados++;
  }
  await sb.from("eventos").delete().eq("id", ev.id);
  console.log(`Limpo: evento, ${parts?.length ?? 0} inscrição(ões), check-ins e ${apagados} cadastro(s) de teste.`);
}

const post = (rota, corpo, ip) =>
  fetch(`${BASE}/api/dexcomplica-love-run/${rota}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip ?? `10.9.${randomInt(255)}.${randomInt(255)}` },
    body: JSON.stringify(corpo),
  }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => ({})) }));

/** Nome só com letras (a validação recusa número): 1 → "Teste Love Run Ab", 12 → "Teste Love Run Abc". */
const sufixo = (n) => "Ab" + "cdefghijklmnopqrstuvwxyz".slice(0, n % 24);
const pessoa = (cpf, n, extra = {}) => ({
  nome: `Teste Love Run ${sufixo(n)}`,
  email: `love-run-${n}-${cpf.slice(-4)}@${DOMINIO}`,
  cpf,
  telefone: `6199${String(1000000 + n * 7919).slice(-7)}`,
  sexo: n % 2 ? "feminino" : "masculino",
  pelotao: "teste-a",
  ...extra,
});

async function linhas(eventoId, cpf) {
  const [{ data: p }, { data: c }] = await Promise.all([
    sb.from("evento_participantes").select("*").eq("evento_id", eventoId).eq("cpf", cpf),
    sb.from("checkins").select("*").eq("evento_id", eventoId).eq("cpf", cpf),
  ]);
  return { p: p ?? [], c: c ?? [] };
}

async function testar() {
  const ev = await eventoTeste();
  if (!ev) throw new Error("Rode `preparar` antes.");
  if (ev.capacidade !== CAPACIDADE) throw new Error("A coluna eventos.capacidade não existe ou o evento foi alterado.");
  const { count: antes } = await sb.from("evento_participantes").select("id", { count: "exact", head: true }).eq("evento_id", ev.id);
  if (antes) throw new Error("O evento de teste já tem inscrições: rode `limpar` e `preparar`.");

  console.log("Página");
  const lp = await fetch(`${BASE}/dexcomplica`).then((r) => r.text());
  t("LP aponta para o evento de teste e mostra o formulário", lp.includes("Garantir minha vaga") && lp.includes("teste-a"));

  console.log("Validação");
  const A = await cpfLivre(), B = await cpfLivre();
  let r = await post("inscricao", pessoa(A, 1, { cpf: "123.456.789-00" }));
  t("CPF inválido → 422 com campo cpf", r.status === 422 && r.json.campos?.cpf, r);
  r = await post("inscricao", { cpf: A });
  t("campos incompletos → 422", r.status === 422 && r.json.campos?.nome && r.json.campos?.email && r.json.campos?.sexo, r);
  r = await post("inscricao", pessoa(A, 1, { pelotao: "42km-inventado" }));
  t("pelotão fora da lista da gestão → 422", r.status === 422 && r.json.campos?.pelotao, r);
  t("nada foi gravado pelas tentativas inválidas", (await linhas(ev.id, A)).p.length === 0);

  console.log("Inscrição");
  r = await post("inscricao", pessoa(A, 1, { marketing: true }));
  t("inscrição válida → 201 com ingresso", r.status === 201 && r.json.ok && /^\/dexcomplica\/ingresso\/[A-Za-z0-9_-]{43}\?novo=1$/.test(r.json.ingresso_url), r);
  t("sem Resend, a resposta NÃO diz que o e-mail saiu", r.json.email_enviado === false, r.json);
  const urlA = r.json.ingresso_url?.split("?")[0];
  const tokenA = urlA?.split("/").pop();
  let l = await linhas(ev.id, A);
  t("1 linha em evento_participantes, status inscrito", l.p.length === 1 && l.p[0].status === "inscrito");
  t("código no formato DLR-XXXXXX", /^DLR-[2-9A-HJ-NP-Z]{6}$/.test(l.p[0]?.ticket_code ?? ""), l.p[0]?.ticket_code);
  t("sexo e opt-in no metadata", l.p[0]?.metadata?.sexo === "feminino" && l.p[0]?.metadata?.marketing_optin === true);
  t("telefone gravado na inscrição e na lista da gestão", /^\d{11}$/.test(l.p[0]?.telefone ?? "") && l.c[0]?.telefone === l.p[0]?.telefone);
  t("espelhada em checkins (lista da gestão), pendente", l.c.length === 1 && l.c[0].validacao_do_checkin === false && l.c[0].pelotao === "teste-a");
  const { data: cad } = await sb.from("cadastro_site").select("id, sexo, email").eq("cpf_digits", A).maybeSingle();
  t("pessoa criada em cadastro_site", cad && cad.id === l.p[0].pessoa_id && cad.sexo === "feminino");
  const codigoA = l.p[0].ticket_code;

  console.log("Duplicidade");
  r = await post("inscricao", pessoa(A, 1));
  t("mesmo CPF + mesmo e-mail → mesmo ingresso (200)", r.status === 200 && r.json.ja_inscrito && r.json.ingresso_url === urlA, r);
  r = await post("inscricao", pessoa(A, 1, { email: `outra-pessoa@${DOMINIO}`, pelotao: "teste-b" }));
  t("mesmo CPF + outro e-mail → não entrega o ingresso", r.status === 200 && r.json.ja_inscrito && !r.json.ingresso_url, r);
  l = await linhas(ev.id, A);
  t("continua 1 inscrição e 1 check-in; pelotão não foi trocado", l.p.length === 1 && l.c.length === 1 && l.p[0].pelotao === "teste-a");

  const simult = await Promise.all(Array.from({ length: 5 }, () => post("inscricao", pessoa(B, 2))));
  const ingressosB = new Set(simult.map((x) => x.json.ingresso_url?.split("?")[0]).filter(Boolean));
  l = await linhas(ev.id, B);
  t("5 envios simultâneos do mesmo CPF → 1 inscrição", l.p.length === 1 && l.c.length <= 1, l.p.length);
  t("…e todos recebem o mesmo ingresso", simult.every((x) => x.json.ok) && ingressosB.size === 1, simult.map((x) => x.status));
  // O espelho em checkins também corre em paralelo: confere a lista depois que tudo terminou.
  t("…e 1 linha na lista de check-in", (await linhas(ev.id, B)).c.length === 1);

  console.log("Vagas (teto 3, já com 2)");
  const cpfs = await Promise.all(Array.from({ length: 6 }, () => cpfLivre()));
  const corrida = await Promise.all(cpfs.map((c, i) => post("inscricao", pessoa(c, 10 + i))));
  const criadas = corrida.filter((x) => x.status === 201).length;
  const esgotadas = corrida.filter((x) => x.status === 409 && x.json.estado === "esgotado").length;
  const { count: total } = await sb.from("evento_participantes").select("id", { count: "exact", head: true }).eq("evento_id", ev.id).neq("status", "cancelado");
  t("6 inscrições simultâneas → só 1 entra", criadas === 1 && esgotadas === 5, corrida.map((x) => x.status));
  t("banco fechou exatamente no teto", total === CAPACIDADE, total);
  r = await post("inscricao", pessoa(A, 1));
  t("quem já estava recupera o ingresso mesmo esgotado", r.status === 200 && r.json.ingresso_url === urlA, r);
  const lpEsgotada = await fetch(`${BASE}/dexcomplica`, { cache: "no-store" }).then((x) => x.text());
  // Em `next dev` não há cache de ISR: a página reflete o banco na hora.
  t("LP passa a mostrar esgotado", lpEsgotada.includes("As vagas acabaram") && !lpEsgotada.includes("Garantir minha vaga"));

  console.log("Ingresso");
  const pag = await fetch(`${BASE}${urlA}`);
  const html = await pag.text();
  t("página do ingresso abre (200) com nome e código", pag.status === 200 && html.includes(`Teste Love Run ${sufixo(1)}`) && html.includes(codigoA));
  t("não expõe CPF na página", !html.includes(A) && !html.includes(`${A.slice(0, 3)}.${A.slice(3, 6)}`));
  t("noindex + sem referrer", html.includes("noindex") && html.includes('name="referrer" content="no-referrer"'));
  const falso = await fetch(`${BASE}/dexcomplica/ingresso/${"x".repeat(43)}`);
  t("token inexistente → 404", falso.status === 404);

  console.log("Recuperação");
  const r1 = await post("recuperar", { cpf: A });
  const r2 = await post("recuperar", { cpf: await cpfLivre() });
  t("CPF inscrito e não inscrito recebem a MESMA resposta", r1.status === 200 && r2.status === 200 && r1.json.mensagem === r2.json.mensagem);
  t("resposta não traz ingresso nem e-mail", !JSON.stringify(r1.json).includes(tokenA) && !JSON.stringify(r1.json).includes(DOMINIO));
  t("CPF inválido → 422", (await post("recuperar", { cpf: "123" })).status === 422);

  console.log(`\nTokens para o teste do leitor da gestão:\n  TOKEN_A=${tokenA}\n  CODIGO_B=${(await linhas(ev.id, B)).p[0]?.ticket_code}\n  EVENTO_TESTE=${ev.id}`);
  console.log(`\n${ok} ok, ${bad} falha(s)`);
  process.exit(bad ? 1 : 0);
}

const cmd = process.argv[2];
const acoes = { preparar, limpar, testar };
if (!acoes[cmd]) {
  console.log("Uso: node scripts/love-run-integracao.mjs preparar|testar|limpar");
  process.exit(1);
}
acoes[cmd]().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
