/**
 * Fluxos essenciais do Meeting Técnico, de ponta a ponta, pelas rotas do site.
 * Roda contra o site local ligado ao banco de mentira:
 *
 *   scripts/evp-local/iniciar.sh        (em um terminal)
 *   node scripts/evp-e2e.mjs            (em outro)
 *
 * Nunca aponte para produção: o teste cria e cancela inscrições.
 */
const SITE = process.env.SITE || "http://localhost:3120";
const BANCO = process.env.BANCO || "http://localhost:54398";
const SENHA = process.env.EVP_ADMIN_SENHA || "senha-local-de-teste";
if (!/localhost|127\.0\.0\.1/.test(SITE) || !/localhost|127\.0\.0\.1/.test(BANCO)) {
  console.error("Este teste só roda contra localhost.");
  process.exit(1);
}

let ok = 0;
let ruim = 0;
const t = (nome, cond, extra) => {
  if (cond) { ok++; console.log("  ✓", nome); }
  else { ruim++; console.log("  ✗", nome, extra === undefined ? "" : JSON.stringify(extra).slice(0, 400)); }
};
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

let ipN = 0;
// Cada chamada com um IP: o limite por IP não entra no caminho do teste.
const ip = () => `10.${(ipN >> 16) & 255}.${(ipN >> 8) & 255}.${ipN++ & 255}`;

async function api(caminho, { metodo = "GET", corpo, cookie, bruto } = {}) {
  const r = await fetch(`${SITE}${caminho}`, {
    method: metodo,
    headers: { ...(corpo && !bruto ? { "Content-Type": "application/json" } : {}), "x-forwarded-for": ip(), ...(cookie ? { cookie } : {}) },
    body: bruto ?? (corpo ? JSON.stringify(corpo) : undefined),
    redirect: "manual",
  });
  const texto = await r.text();
  let j = null;
  try { j = JSON.parse(texto); } catch { /* não é JSON */ }
  return { status: r.status, j, texto, cookie: r.headers.get("set-cookie")?.split(";")[0] ?? null };
}
const sql = async (s, params = []) =>
  (await (await fetch(`${BANCO}/__teste/sql`, { method: "POST", body: JSON.stringify({ sql: s, params }) })).json()).rows;

function cpf(n) {
  const b = String(100000000 + n * 7919).slice(0, 9).split("").map(Number);
  const dv = (a) => { const s = a.reduce((acc, d, i) => acc + d * (a.length + 1 - i), 0) % 11; return s < 2 ? 0 : 11 - s; };
  const d1 = dv(b);
  return [...b, d1, dv([...b, d1])].join("");
}

let n = 0;
let selo = "";
const pessoa = (extra = {}) => {
  n++;
  return {
    nome: `Pessoa Teste ${["Um", "Dois", "Tres", "Quatro", "Cinco", "Seis", "Sete", "Oito", "Nove", "Dez", "Onze", "Doze"][n % 12]}`,
    email: `pessoa${n}@exemplo.test`,
    telefone: "(61) 99876-5432",
    cpf: cpf(n),
    sexo: n % 2 ? "feminino" : "masculino",
    distancia: "21k",
    primeira_vez: "sim",
    aceite_termos: true,
    aceite_imagem: true,
    aceite_marketing: false,
    idempotency_key: crypto.randomUUID(),
    selo,
    site: "",
    origem: { utm_source: "instagram", utm_campaign: "teste" },
    ...extra,
  };
};
const inscrever = (p) => api("/api/evp/inscricao", { metodo: "POST", corpo: p });

console.log("\nPágina sem local configurado");
const pg = await api("/maratonamonumental2026");
t("landing page responde 200", pg.status === 200, pg.status);
t("mostra local em definição e inscrições em breve", /Local em definição/.test(pg.texto) && /Em breve/.test(pg.texto));
t("não declara evento ao buscador sem data e local", !/"@type":"Event","name":"Meeting/.test(pg.texto));
t("títulos da campanha presentes", /Meeting/.test(pg.texto) && /Você treinou para a prova/.test(pg.texto));
t("agenda.ics não existe sem data", (await api("/maratonamonumental2026/agenda.ics")).status === 404);

console.log("\nAnti-robô");
selo = (await api("/api/evp/selo", { metodo: "POST", corpo: {} })).j?.selo;
t("servidor emite o selo do formulário", typeof selo === "string" && selo.length > 20);
const rapido = await inscrever(pessoa());
t("envio em menos de 4 s é recusado", rapido.status === 400 && rapido.j?.renovar_selo === true, rapido.j);
t("selo forjado é recusado", (await inscrever(pessoa({ selo: "abc.def-forjado-123456" }))).status === 400);
await espera(4300);
const isca = await inscrever(pessoa({ site: "http://spam" }));
t("isca preenchida: responde ok e não grava nada", isca.status === 201 && isca.j?.ticket_url === null && (await sql("select count(*)::int n from evp_registrations"))[0].n === 0, isca.j);

console.log("\nEvento ainda fechado");
const fech = await inscrever(pessoa());
t("inscrição com evento em breve é recusada", fech.status === 409 && fech.j?.fechada === true, fech.j);

console.log("\nAcesso da equipe");
t("painel sem sessão: 401", (await api("/api/evp/admin/dados?secao=painel")).status === 401);
t("check-in sem sessão: 401", (await api("/api/evp/checkin", { metodo: "POST", corpo: { qr: "x" } })).status === 401);
t("senha mestra errada: 401", (await api("/api/evp/equipe/login", { metodo: "POST", corpo: { email: "", senha: "errada" } })).status === 401);
const login = await api("/api/evp/equipe/login", { metodo: "POST", corpo: { email: "", senha: SENHA } });
const admin = login.cookie;
t("senha mestra entra como admin", login.status === 200 && Boolean(admin), login.j);
t("cookie adulterado: 401", (await api("/api/evp/admin/dados?secao=painel", { cookie: `${admin}x` })).status === 401);
const novoOp = await api("/api/evp/admin/equipe", { metodo: "POST", cookie: admin, corpo: { nome: "Operadora Teste", email: "op@exemplo.test", papel: "operador", ativo: true, senha: "senha-da-operadora" } });
t("admin cria operador", novoOp.status === 200, novoOp.j);
t("senha do operador fica só como hash", /^scrypt\$/.test((await sql("select senha_hash from evp_staff where email = 'op@exemplo.test'"))[0].senha_hash));
t("operador com senha errada: 401", (await api("/api/evp/equipe/login", { metodo: "POST", corpo: { email: "op@exemplo.test", senha: "outra-senha-qualquer" } })).status === 401);
const loginOp = await api("/api/evp/equipe/login", { metodo: "POST", corpo: { email: "op@exemplo.test", senha: "senha-da-operadora" } });
const op = loginOp.cookie;
t("operador entra", loginOp.status === 200 && Boolean(op));
t("operador sem permissão no painel: 403", (await api("/api/evp/admin/dados?secao=participantes", { cookie: op })).status === 403);
t("operador sem permissão para exportar: 403", (await api("/api/evp/admin/exportar", { cookie: op })).status === 403);
t("operador sem permissão para editar evento: 403", (await api("/api/evp/admin/evento", { metodo: "PUT", cookie: op, corpo: { capacidade: 999 } })).status === 403);
t("página do painel não mostra dados ao operador", /não tem acesso ao painel/.test((await api("/maratonamonumental2026/admin", { cookie: op })).texto));

console.log("\nAbertura pelo painel");
const semDados = await api("/api/evp/admin/evento", { metodo: "PUT", cookie: admin, corpo: { inscricoes_status: "aberta" } });
t("abrir inscrições sem data, local, capacidade e valor é recusado", semDados.status === 409 && /falta definir/.test(semDados.j?.error ?? ""), semDados.j);
const abre = await api("/api/evp/admin/evento", {
  metodo: "PUT", cookie: admin,
  corpo: { starts_at: "2026-11-18T22:30:00.000Z", ends_at: "2026-11-19T00:30:00.000Z", local_nome: "Espaço de Teste", endereco: "Rua de Teste, 100, Brasília", capacidade: 3, valor_centavos: 0, inscricoes_status: "aberta", ao_lotar: "lista_espera", promover_automatico: true },
});
t("abre com tudo configurado", abre.status === 200 && abre.j?.vagas?.modo === "aberta", abre.j);
const vg = await api("/api/evp/evento");
t("vagas públicas vêm do banco", vg.j?.vagas?.vagas_livres === 3 && vg.j?.vagas?.capacidade === 3, vg.j);
const pg2 = await api("/maratonamonumental2026");
t("página atualiza sozinha com local e data", /Espaço de Teste/.test(pg2.texto) && /18 de novembro/.test(pg2.texto));
t("dados estruturados aparecem com data e local confirmados", /"@type":"Event"/.test(pg2.texto));
const ics = await api("/maratonamonumental2026/agenda.ics");
t("agenda.ics com o horário certo em UTC", ics.status === 200 && /DTSTART:20261118T223000Z/.test(ics.texto));

console.log("\nValidação");
const cpfRuim = await inscrever(pessoa({ cpf: "123.456.789-00" }));
t("CPF inválido: 422 no campo cpf", cpfRuim.status === 422 && Boolean(cpfRuim.j?.campos?.cpf), cpfRuim.j);
const cpfIgual = await inscrever(pessoa({ cpf: "111.111.111-11" }));
t("CPF de dígitos repetidos: 422", cpfIgual.status === 422 && Boolean(cpfIgual.j?.campos?.cpf));
const emailRuim = await inscrever(pessoa({ email: "sem-arroba.com" }));
t("e-mail inválido: 422 no campo email", emailRuim.status === 422 && Boolean(emailRuim.j?.campos?.email), emailRuim.j);
const semAceite = await inscrever(pessoa({ aceite_termos: false }));
t("sem aceite dos termos: 422", semAceite.status === 422 && Boolean(semAceite.j?.campos?.aceite_termos));
t("distância fora da lista: 422", (await inscrever(pessoa({ distancia: "100k" }))).status === 422);
t("nada foi gravado pelas tentativas inválidas", (await sql("select count(*)::int n from evp_registrations"))[0].n === 0);

console.log("\nInscrição válida");
const p1 = pessoa({ distancia: "10k+42k", aceite_marketing: true });
const r1 = await inscrever(p1);
t("inscrição válida: 201 confirmada", r1.status === 201 && r1.j?.status === "confirmada" && /^MT-[2-9A-Z]{6}$/.test(r1.j?.codigo ?? ""), r1.j);
const linha = (await sql("select * from evp_registrations where codigo = $1", [r1.j.codigo]))[0];
t("combinação do Desafio Monumental gravada", linha.distancia === "10k+42k");
t("CPF não fica em claro no banco", !JSON.stringify(linha).includes(p1.cpf) && linha.cpf_cifrado.startsWith("v1.") && linha.cpf_final === p1.cpf.slice(-2));
t("telefone normalizado e origem registrada", linha.telefone === "61998765432" && linha.origem_fonte === "instagram");
t("consentimento de comunicação separado do aceite obrigatório", linha.aceite_marketing === true);
t("aceites de dados e de imagem gravados", (await sql("select count(*)::int n from aceites_termos where cpf_digits = $1", [p1.cpf]))[0].n === 2);
const r1b = await inscrever(p1);
t("reenvio da mesma requisição não duplica", r1b.status === 200 && r1b.j?.ticket_token === r1.j.ticket_token && (await sql("select count(*)::int n from evp_registrations"))[0].n === 1, r1b.j);
const dup = await inscrever(pessoa({ cpf: p1.cpf }));
t("inscrição duplicada: 409 com e-mail mascarado", dup.status === 409 && dup.j?.ja_inscrito === true && /\*/.test(dup.j?.email ?? "") && !dup.j.email.includes("pessoa"), dup.j);
t("resposta da duplicada não entrega o ingresso", !JSON.stringify(dup.j).includes(r1.j.ticket_token));

console.log("\nConfirmação e ingresso");
const conf = await api(`/maratonamonumental2026/obrigado?t=${r1.j.ticket_token}`);
t("página de confirmação com o nome e o código", conf.status === 200 && conf.texto.includes(p1.nome) && conf.texto.includes(r1.j.codigo));
t("mensagem de confirmação", /foi confirmada/.test(conf.texto) && /noindex/.test(conf.texto));
t("ingresso não mostra CPF", !conf.texto.includes(p1.cpf) && !conf.texto.includes(p1.cpf.slice(0, 9)));
t("QR Code não carrega CPF, e-mail nem o token da página", linha.qr_token !== linha.ticket_token && !linha.qr_token.includes(p1.cpf));
t("token inventado não abre ingresso", /Ingresso não encontrado/.test((await api("/maratonamonumental2026/obrigado?t=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")).texto));

console.log("\nÚltima vaga e lista de espera");
await inscrever(pessoa());
t("resta uma vaga", (await api("/api/evp/evento")).j.vagas.vagas_livres === 1);
const [a, b] = await Promise.all([inscrever(pessoa()), inscrever(pessoa())]);
const st = [a.j?.status, b.j?.status].sort();
t("duas inscrições concorrentes pela última vaga: uma confirma, a outra entra na fila", st[0] === "confirmada" && st[1] === "lista_espera", st);
const v = (await api("/api/evp/evento")).j.vagas;
t("confirmadas não passam da capacidade", v.confirmadas === 3 && v.vagas_livres === 0 && v.fila === 1 && v.modo === "lista_espera", v);
const naFila = a.j.status === "lista_espera" ? a.j : b.j;
const dentro = a.j.status === "confirmada" ? a.j : b.j;
const confFila = await api(`/maratonamonumental2026/obrigado?t=${naFila.ticket_token}`);
t("confirmação diferencia lista de espera", /lista de espera/.test(confFila.texto) && !/foi confirmada/.test(confFila.texto));
const e2 = await inscrever(pessoa());
t("evento lotado com lista de espera: entra na posição 2", e2.status === 201 && e2.j?.status === "lista_espera" && e2.j?.posicao_fila === 2, e2.j);
await api("/api/evp/admin/evento", { metodo: "PUT", cookie: admin, corpo: { ao_lotar: "encerrar" } });
const lot = await inscrever(pessoa());
t("evento lotado sem lista de espera: 409 lotado", lot.status === 409 && lot.j?.lotado === true, lot.j);
await api("/api/evp/admin/evento", { metodo: "PUT", cookie: admin, corpo: { ao_lotar: "lista_espera" } });

console.log("\nCheck-in");
const qr = (id) => sql("select qr_token, id from evp_registrations where codigo = $1", [id]).then((r) => r[0]);
const q1 = await qr(r1.j.codigo);
const ck = await api("/api/evp/checkin", { metodo: "POST", cookie: op, corpo: { qr: `SOMMA-EVP:${q1.qr_token}` } });
t("check-in válido pelo operador", ck.status === 200 && ck.j?.ok && ck.j.presentes === 1 && ck.j.inscricao.nome === p1.nome, ck.j);
const ck2 = await api("/api/evp/checkin", { metodo: "POST", cookie: admin, corpo: { qr: `SOMMA-EVP:${q1.qr_token}` } });
t("check-in duplicado: 409 com horário e operador", ck2.status === 409 && ck2.j?.motivo === "duplicado" && ck2.j.operador === "Operadora Teste" && Boolean(ck2.j.feito_em), ck2.j);
const ck3 = await api("/api/evp/checkin", { metodo: "POST", cookie: op, corpo: { qr: "SOMMA-EVP:token-que-nao-existe" } });
t("QR Code inválido: 404", ck3.status === 404 && ck3.j?.motivo === "invalido", ck3.j);
const ck4 = await api("/api/evp/checkin", { metodo: "POST", cookie: op, corpo: { qr: `https://site-qualquer.com/${p1.cpf}` } });
t("QR de outra origem: 404", ck4.status === 404);
const qFila = await qr(naFila.codigo);
const ck5 = await api("/api/evp/checkin", { metodo: "POST", cookie: op, corpo: { qr: `SOMMA-EVP:${qFila.qr_token}` } });
t("quem está na lista de espera não entra", ck5.status === 409 && ck5.j?.motivo === "lista_espera", ck5.j);
const busca = await api(`/api/evp/checkin/buscar?q=${encodeURIComponent("pessoa teste")}`, { cookie: op });
t("busca manual por nome, sem e-mail nem telefone", busca.j?.resultados?.length >= 3 && busca.j.resultados.every((x) => !x.email && !x.telefone && x.cpf_final.length === 2), busca.j);
const buscaCpf = await api(`/api/evp/checkin/buscar?q=${p1.cpf}`, { cookie: op });
t("busca manual por CPF completo", buscaCpf.j?.resultados?.length === 1 && buscaCpf.j.resultados[0].nome === p1.nome);
const qDentro = await qr(dentro.codigo);
const ck6 = await api("/api/evp/checkin", { metodo: "POST", cookie: op, corpo: { id: qDentro.id } });
t("check-in manual pela busca", ck6.status === 200 && ck6.j?.presentes === 2, ck6.j);
const resumo = await api("/api/evp/checkin", { cookie: op });
t("contagem de presentes", resumo.j?.presentes === 2 && resumo.j?.confirmadas === 3 && resumo.j.ultimos[0].operador === "Operadora Teste", resumo.j);

console.log("\nCancelamento e liberação de vaga");
const canc = await api("/api/evp/admin/participante", { metodo: "POST", cookie: admin, corpo: { id: q1.id, acao: "cancelar", motivo: "Pediu para sair" } });
t("cancelamento libera a vaga e promove o primeiro da fila", canc.status === 200 && canc.j?.promovidas === 1, canc.j);
t("promovido passa a confirmado", (await sql("select status from evp_registrations where codigo = $1", [naFila.codigo]))[0].status === "confirmada");
const ck7 = await api("/api/evp/checkin", { metodo: "POST", cookie: op, corpo: { qr: `SOMMA-EVP:${q1.qr_token}` } });
t("ingresso cancelado não entra", ck7.status === 409 && ck7.j?.motivo === "cancelada", ck7.j);
t("página do ingresso cancelado avisa", /Inscrição cancelada/.test((await api(`/maratonamonumental2026/obrigado?t=${r1.j.ticket_token}`)).texto));
const volta = await inscrever({ ...pessoa(), cpf: p1.cpf });
t("quem cancelou pode se inscrever de novo (vai para a fila)", volta.status === 201 && volta.j?.status === "lista_espera", volta.j);
const menos = await api("/api/evp/admin/evento", { metodo: "PUT", cookie: admin, corpo: { capacidade: 1 } });
t("capacidade abaixo das confirmadas é recusada", menos.status === 409 && /confirmadas/.test(menos.j?.error ?? ""), menos.j);
const mais = await api("/api/evp/admin/evento", { metodo: "PUT", cookie: admin, corpo: { capacidade: 6 } });
t("aumentar a capacidade esvazia a fila", mais.status === 200 && mais.j?.vagas?.fila === 0 && mais.j.promovidas === 2, mais.j);

console.log("\nPainel");
const painel = (await api("/api/evp/admin/dados?secao=painel", { cookie: admin })).j?.dados;
const real = (await sql("select count(*) filter (where status = 'confirmada')::int c, count(*) filter (where status = 'cancelada')::int x from evp_registrations"))[0];
t("indicadores iguais ao banco", painel?.confirmadas === real.c && painel?.canceladas === real.x && painel?.presentes === 1, { painel, real });
t("origem das inscrições e funil", painel?.por_origem?.some((o) => o.origem === "instagram" && o.inscricoes >= 5) && painel?.funil?.inicios_form >= 1, painel?.por_origem);
const lista = (await api("/api/evp/admin/dados?secao=participantes", { cookie: admin })).j?.dados;
t("lista do painel sem CPF inteiro", lista?.length === real.c + real.x && !JSON.stringify(lista).includes(p1.cpf) && !("cpf_cifrado" in lista[0]));
const csv = await api("/api/evp/admin/exportar", { cookie: admin });
t("CSV exporta com CPF mascarado", csv.status === 200 && csv.texto.includes("***.***.***-") && !csv.texto.includes(p1.cpf) && csv.texto.includes(p1.nome));
const novoId = (await sql("select id from evp_registrations where status = 'confirmada' and cpf_final = $1 order by created_at desc limit 1", [p1.cpf.slice(-2)]))[0].id;
const rev = await api("/api/evp/admin/participante", { metodo: "POST", cookie: admin, corpo: { id: novoId, acao: "revelar_cpf" } });
t("admin revela o CPF (decifra) e fica registrado", rev.status === 200 && rev.j?.cpf === p1.cpf && (await sql("select count(*)::int n from evp_audit_logs where acao = 'cpf_revelado'"))[0].n === 1, rev.j);
t("operador não revela CPF", (await api("/api/evp/admin/participante", { metodo: "POST", cookie: op, corpo: { id: novoId, acao: "revelar_cpf" } })).status === 403);
const ed = await api("/api/evp/admin/participante", { metodo: "POST", cookie: admin, corpo: { id: novoId, acao: "editar", dados: { nome: "Pessoa Editada Silva", email: "editada@exemplo.test", telefone: "61998765432", sexo: "feminino", distancia: "5k", primeira_vez: false } } });
t("edição controlada", ed.status === 200 && ed.j?.mudou?.includes("nome") && ed.j.mudou.includes("distancia"), ed.j);
const ficha = (await api(`/api/evp/admin/participante?id=${qDentro.id}`, { cookie: admin })).j?.dados;
t("ficha com histórico de check-in e sem CPF cifrado", ficha?.checkins?.length === 1 && ficha.checkins[0].operador === "Operadora Teste" && !("cpf_cifrado" in ficha), ficha);
const reenv = await api("/api/evp/admin/participante", { metodo: "POST", cookie: admin, corpo: { id: novoId, acao: "reenviar" } });
t("reenvio sem e-mail configurado avisa em vez de fingir", reenv.status === 503 && /não está configurado/.test(reenv.j?.error ?? ""), reenv.j);
const aud = (await api("/api/evp/admin/dados?secao=auditoria", { cookie: admin })).j?.dados;
t("histórico de alterações", ["checkin", "inscricao_cancelada", "evento_editado", "participantes_exportados", "inscricao_editada"].every((x) => aud?.some((l) => l.acao === x)));
const reenvPub = await api("/api/evp/reenviar", { metodo: "POST", corpo: { cpf: cpf(9999) } });
t("reenvio público responde igual para CPF sem inscrição", reenvPub.status === 200 && /Se este CPF tiver inscrição/.test(reenvPub.j?.mensagem ?? ""));

console.log("\nPercursos");
const gpx = (pts) => `<?xml version="1.0"?><gpx><trk><trkseg>${pts.map(([la, lo]) => `<trkpt lat="${la}" lon="${lo}"></trkpt>`).join("")}</trkseg></trk></gpx>`;
// Linha de ida e volta de ~5 km na Esplanada, só para exercitar o leitor.
const ida = Array.from({ length: 60 }, (_, i) => [-15.7989, -47.8642 - (i * 0.0235) / 59]);
const pts5 = [...ida, ...ida.slice().reverse()];
const enviar = async (distancia, conteudo, nome, fonte = "Arquivo de teste") => {
  const f = new FormData();
  f.set("distancia", distancia);
  f.set("fonte", fonte);
  f.set("arquivo", new Blob([conteudo]), nome);
  return api("/api/evp/admin/percurso", { metodo: "POST", cookie: admin, bruto: f });
};
const up = await enviar("5k", gpx(pts5), "percurso-5k.gpx");
t("GPX lido, medido e guardado em validação", up.status === 200 && Math.abs(up.j?.relatorio?.diferenca_pct) < 3 && up.j.relatorio.dentro_do_df, up.j);
t("percurso em validação não vai para a página", !(await api("/maratonamonumental2026")).texto.includes('"comprimento_m"'));
t("arquivo da distância errada é barrado", (await enviar("42k", gpx(pts5), "x.gpx")).status === 422);
t("arquivo fora do DF é barrado", (await enviar("5k", gpx(pts5.map(([la, lo]) => [la + 8, lo])), "x.gpx")).status === 422);
t("arquivo sem geometria é barrado", (await enviar("5k", "isto não é um mapa", "mapa.pdf")).status === 422);
t("publicar sem conferência é recusado", (await api("/api/evp/admin/percurso", { metodo: "PATCH", cookie: admin, corpo: { distancia: "5k", acao: "publicar" } })).status === 422);
const pub = await api("/api/evp/admin/percurso", { metodo: "PATCH", cookie: admin, corpo: { distancia: "5k", acao: "publicar", conferido: true } });
t("publica depois de conferido", pub.status === 200, pub.j);
t("operador não envia percurso", (await api("/api/evp/admin/percurso", { metodo: "PATCH", cookie: op, corpo: { distancia: "5k", acao: "remover" } })).status === 403);

console.log("\nConta desativada e banco fora do ar");
const opId = (await sql("select id from evp_staff where email = 'op@exemplo.test'"))[0].id;
await api("/api/evp/admin/equipe", { metodo: "POST", cookie: admin, corpo: { id: opId, nome: "Operadora Teste", email: "op@exemplo.test", papel: "operador", ativo: false } });
t("operador desativado perde o acesso na hora, com o mesmo cookie", (await api("/api/evp/checkin", { cookie: op })).status === 401);
await fetch(`${BANCO}/__teste/falha`, { method: "POST", body: JSON.stringify({ ligada: true }) });
const fora = await inscrever(pessoa());
t("banco fora do ar: 503 com aviso de que nada foi registrado", fora.status === 503 && /Nada foi registrado/.test(fora.j?.error ?? ""), fora.j);
await fetch(`${BANCO}/__teste/falha`, { method: "POST", body: JSON.stringify({ ligada: false }) });
t("sair derruba a sessão", (await api("/api/evp/equipe/login", { metodo: "DELETE", cookie: admin })).cookie === "evp_equipe=");

console.log(`\n${ok} passaram, ${ruim} falharam`);
process.exit(ruim ? 1 : 0);
