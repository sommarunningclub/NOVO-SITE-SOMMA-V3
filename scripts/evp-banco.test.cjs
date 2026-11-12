/**
 * Regras de banco da plataforma de eventos (evp_) num Postgres real (PGlite, em
 * memória), com a migration de verdade. Não usa rede nem o banco de produção.
 *
 *   npm i --no-save @electric-sql/pglite && node scripts/evp-banco.test.cjs
 *
 * O PGlite tem uma conexão só. A disputa pela última vaga é testada disparando
 * as chamadas ao mesmo tempo e conferindo o resultado; a garantia entre
 * conexões vem do `for update` na linha do evento, conferido aqui pelo texto
 * da função. Disputa real entre conexões só um Postgres de servidor mostra.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SLUG = "maratonamonumental2026";
let ok = 0;
let ruim = 0;
const t = (nome, cond, extra) => {
  if (cond) { ok++; console.log("  ✓", nome); }
  else { ruim++; console.log("  ✗", nome, extra === undefined ? "" : JSON.stringify(extra)); }
};

(async () => {
  const { PGlite } = await import(process.env.PGLITE_PATH || "@electric-sql/pglite");
  const db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role;");
  const pasta = path.join(__dirname, "../supabase/migrations");
  const sql = fs.readdirSync(pasta).filter((n) => n.includes("_evp_")).sort().map((n) => fs.readFileSync(path.join(pasta, n), "utf8")).join("\n");
  await db.exec(sql);
  await db.exec(sql); // pode reexecutar

  const call = async (fn, args) => {
    const k = Object.keys(args);
    const { rows } = await db.query(
      `select public.${fn}(${k.map((x, i) => `${x} => $${i + 1}`).join(", ")}) as r`,
      k.map((x) => (args[x] !== null && typeof args[x] === "object" ? JSON.stringify(args[x]) : args[x]))
    );
    return rows[0].r;
  };

  let n = 0;
  const pessoa = (extra = {}) => {
    n++;
    return {
      codigo: `MT-${String(n).padStart(6, "0")}`,
      ticket_token: crypto.randomBytes(16).toString("hex"),
      qr_token: crypto.randomBytes(16).toString("hex"),
      nome: `Pessoa ${n}`,
      nome_busca: `pessoa ${n}`,
      email: `p${n}@exemplo.test`,
      telefone: "61999990000",
      cpf_cifrado: "v1.x.y.z",
      cpf_hmac: `hmac-${n}`,
      cpf_final: "00",
      sexo: n % 2 ? "feminino" : "masculino",
      distancia: "21k",
      primeira_vez: true,
      aceite_marketing: false,
      origem: {},
      origem_fonte: "direto",
      idempotency_key: crypto.randomUUID(),
      ...extra,
    };
  };
  const inscrever = (p) => call("evp_inscrever", { p_slug: SLUG, p });
  const salvar = (staff, p) => call("evp_admin_salvar_evento", { p_slug: SLUG, p_staff: staff, p });
  const vagas = async () => (await call("evp_evento_publico", { p_slug: SLUG })).vagas;

  console.log("\nEvento novo");
  const pub0 = await call("evp_evento_publico", { p_slug: SLUG });
  t("evento semeado sem data, local, capacidade nem valor",
    pub0 && pub0.starts_at === null && pub0.local_nome === null && pub0.vagas.capacidade === null && pub0.valor_centavos === null, pub0);
  t("programação com 6 momentos e nenhum horário",
    pub0.programacao.length === 6 && pub0.programacao.every((m) => m.horario === null));
  t("inscrições nascem em breve", pub0.vagas.modo === "em_breve");
  t("nenhum profissional inventado", pub0.profissionais.length === 0);
  t("nenhum percurso publicado", pub0.percursos.length === 0);
  t("inscrição com evento em breve é recusada", (await inscrever(pessoa())).motivo === "fechada");

  const mestre = await call("evp_staff_mestre", { p_slug: SLUG });
  const mestre2 = await call("evp_staff_mestre", { p_slug: SLUG });
  t("conta mestra é criada uma vez só", mestre.id === mestre2.id && mestre.papel === "admin");

  console.log("\nAbertura das inscrições");
  const semDados = await salvar(mestre.id, { inscricoes_status: "aberta" });
  t("abrir sem data, local, capacidade e valor é recusado",
    semDados.ok === false && semDados.motivo === "faltam" && semDados.faltam.length === 5, semDados);
  const aberto = await salvar(mestre.id, {
    starts_at: "2026-11-18T22:30:00Z", local_nome: "Local de teste", endereco: "Endereço de teste",
    capacidade: 3, valor_centavos: 0, inscricoes_status: "aberta", ao_lotar: "lista_espera",
  });
  t("abre com tudo configurado", aberto.ok === true && aberto.vagas.modo === "aberta" && aberto.vagas.vagas_livres === 3, aberto);

  console.log("\nInscrição");
  const p1 = pessoa();
  const r1 = await inscrever(p1);
  t("inscrição válida é confirmada", r1.ok && r1.inscricao.status === "confirmada" && r1.vagas.vagas_livres === 2, r1);
  const r1b = await inscrever(p1);
  t("reenvio com a mesma chave devolve a mesma inscrição", r1b.ok && r1b.repetida && r1b.inscricao.id === r1.inscricao.id);
  t("reenvio não consome vaga", (await vagas()).confirmadas === 1);
  const dup = await inscrever({ ...pessoa(), cpf_hmac: p1.cpf_hmac });
  t("mesmo CPF não se inscreve duas vezes", dup.ok === false && dup.motivo === "duplicada", dup);
  const roubo = await inscrever({ ...pessoa(), idempotency_key: p1.idempotency_key });
  t("chave de outra pessoa não devolve a inscrição dela", roubo.ok === false && roubo.motivo === "chave_em_uso", roubo);

  console.log("\nÚltima vaga");
  await inscrever(pessoa());
  t("resta uma vaga", (await vagas()).vagas_livres === 1);
  const [a, b] = await Promise.all([inscrever(pessoa()), inscrever(pessoa())]);
  const status = [a.inscricao.status, b.inscricao.status].sort();
  t("duas inscrições disputando a última vaga: uma confirma, a outra vai para a fila",
    status[0] === "confirmada" && status[1] === "lista_espera", status);
  const v1 = await vagas();
  t("confirmadas nunca passam da capacidade", v1.confirmadas === 3 && v1.vagas_livres === 0 && v1.fila === 1, v1);
  t("página passa a mostrar lista de espera", v1.modo === "lista_espera");
  t("toda função que decide vaga trava a linha do evento",
    ["evp_inscrever", "evp_admin_cancelar", "evp_admin_promover_fila", "evp_admin_salvar_evento"].every((fn) => {
      const corpo = sql.slice(sql.indexOf(`function public.${fn}(`));
      return /from public\.evp_events where slug = p_slug for update/.test(corpo.slice(0, corpo.indexOf("end $$")));
    }));

  console.log("\nLista de espera");
  const e2 = await inscrever(pessoa());
  t("lotado com lista de espera: entra na fila na posição certa",
    e2.inscricao.status === "lista_espera" && e2.inscricao.posicao_fila === 2, e2);
  const naFila = a.inscricao.status === "lista_espera" ? a : b;
  const confirmado = a.inscricao.status === "confirmada" ? a : b;
  const ing = await call("evp_ingresso", { p_slug: SLUG, p_ticket_token: naFila.inscricao.ticket_token });
  t("ingresso de quem está na fila diz lista de espera e a posição", ing.status === "lista_espera" && ing.posicao_fila === 1, ing);
  t("token de ingresso inexistente não devolve nada", (await call("evp_ingresso", { p_slug: SLUG, p_ticket_token: "nao-existe" })) === null);

  console.log("\nCancelamento e liberação de vaga");
  const canc = await call("evp_admin_cancelar", { p_slug: SLUG, p_staff: mestre.id, p_id: confirmado.inscricao.id, p_motivo: "pediu" });
  t("cancelar promove o primeiro da fila",
    canc.ok && canc.promovidas.length === 1 && canc.promovidas[0].id === naFila.inscricao.id, canc);
  const v2 = await vagas();
  t("vagas seguem cheias e a fila anda", v2.confirmadas === 3 && v2.fila === 1, v2);
  t("cancelar duas vezes é recusado",
    (await call("evp_admin_cancelar", { p_slug: SLUG, p_staff: mestre.id, p_id: confirmado.inscricao.id, p_motivo: "" })).motivo === "ja_cancelada");
  const volta = await inscrever({ ...pessoa(), cpf_hmac: `hmac-volta` });
  t("quem chega com fila ativa vai para o fim da fila", volta.inscricao.status === "lista_espera" && volta.inscricao.posicao_fila === 2, volta);
  const maior = await salvar(mestre.id, { capacidade: 5 });
  t("aumentar a capacidade promove a fila", maior.ok && maior.promovidas.length === 2 && maior.vagas.fila === 0, maior);
  t("capacidade abaixo das confirmadas é recusada", (await salvar(mestre.id, { capacidade: 2 })).motivo === "capacidade_menor");

  console.log("\nEvento lotado sem lista de espera");
  await salvar(mestre.id, { ao_lotar: "encerrar" });
  const lot = await inscrever(pessoa());
  t("lotado e sem lista de espera: recusa", lot.ok === false && lot.motivo === "lotado", lot);
  t("página mostra esgotada", (await vagas()).modo === "esgotada");
  await salvar(mestre.id, { inscricoes_status: "encerrada" });
  t("encerramento manual recusa inscrição", (await inscrever(pessoa())).motivo === "fechada");
  await salvar(mestre.id, { inscricoes_status: "aberta", ao_lotar: "lista_espera" });

  console.log("\nCredenciamento");
  await call("evp_admin_staff_salvar", { p_slug: SLUG, p_staff: mestre.id, p: { nome: "Operadora", email: "Op@Exemplo.test", papel: "operador", senha_hash: "hash" } });
  const login = await call("evp_staff_login", { p_slug: SLUG, p_email: " op@exemplo.test " });
  t("operador criado, e-mail normalizado", login && login.papel === "operador" && login.senha_hash === "hash", login);
  t("e-mail repetido na equipe é recusado",
    (await call("evp_admin_staff_salvar", { p_slug: SLUG, p_staff: mestre.id, p: { nome: "Outra", email: "op@exemplo.test", papel: "admin", senha_hash: "h" } })).motivo === "email_em_uso");
  const ck = await call("evp_checkin", { p_slug: SLUG, p_staff: login.id, p_qr_token: p1.qr_token, p_registration: null, p_via: "qr" });
  t("check-in válido", ck.ok && ck.presentes === 1 && ck.inscricao.nome === p1.nome, ck);
  const ck2 = await call("evp_checkin", { p_slug: SLUG, p_staff: mestre.id, p_qr_token: p1.qr_token, p_registration: null, p_via: "qr" });
  t("check-in duplicado é bloqueado e diz quem fez", ck2.ok === false && ck2.motivo === "duplicado" && ck2.operador === "Operadora", ck2);
  const ck3 = await call("evp_checkin", { p_slug: SLUG, p_staff: login.id, p_qr_token: "qr-falso", p_registration: null, p_via: "qr" });
  t("QR Code inválido", ck3.ok === false && ck3.motivo === "invalido", ck3);
  const ck4 = await call("evp_checkin", { p_slug: SLUG, p_staff: login.id, p_qr_token: confirmado.inscricao && (await db.query(`select qr_token from evp_registrations where id = $1`, [confirmado.inscricao.id])).rows[0].qr_token, p_registration: null, p_via: "qr" });
  t("inscrição cancelada não entra", ck4.ok === false && ck4.motivo === "cancelada", ck4);
  await call("evp_admin_staff_salvar", { p_slug: SLUG, p_staff: mestre.id, p: { id: login.id, nome: "Operadora", email: "op@exemplo.test", papel: "operador", ativo: false } });
  const ck5 = await call("evp_checkin", { p_slug: SLUG, p_staff: login.id, p_qr_token: p1.qr_token, p_registration: null, p_via: "qr" });
  t("operador desativado não registra check-in", ck5.ok === false && ck5.motivo === "sem_permissao", ck5);
  const ck6 = await call("evp_checkin", { p_slug: SLUG, p_staff: crypto.randomUUID(), p_qr_token: p1.qr_token, p_registration: null, p_via: "qr" });
  t("operador desconhecido não registra check-in", ck6.motivo === "sem_permissao");
  const busca = await call("evp_checkin_buscar", { p_slug: SLUG, p_termo: p1.nome_busca, p_cpf_hmac: null });
  t("busca por nome acha e não traz e-mail nem telefone",
    busca.length >= 1 && busca.every((x) => !("email" in x) && !("telefone" in x)), busca);
  t("busca com curinga não devolve a lista inteira",
    (await call("evp_checkin_buscar", { p_slug: SLUG, p_termo: "%%", p_cpf_hmac: null })).length === 0);
  t("busca por CPF (HMAC) acha a pessoa",
    (await call("evp_checkin_buscar", { p_slug: SLUG, p_termo: "", p_cpf_hmac: p1.cpf_hmac }))[0]?.nome === p1.nome);
  const desf = await call("evp_checkin_desfazer", { p_slug: SLUG, p_staff: mestre.id, p_registration: r1.inscricao.id });
  const ck7 = await call("evp_checkin", { p_slug: SLUG, p_staff: mestre.id, p_qr_token: null, p_registration: r1.inscricao.id, p_via: "manual" });
  t("check-in desfeito pode ser refeito, e o histórico guarda os dois", desf.ok && ck7.ok, { desf, ck7 });

  console.log("\nPainel e histórico");
  await call("evp_registrar_funil", { p_slug: SLUG, p_origem: "instagram", p_tipo: "visita" });
  await call("evp_registrar_funil", { p_slug: SLUG, p_origem: "instagram", p_tipo: "visita" });
  await call("evp_registrar_funil", { p_slug: SLUG, p_origem: "instagram", p_tipo: "inicio_form" });
  const painel = await call("evp_admin_painel", { p_slug: SLUG });
  t("painel: números batem com as tabelas",
    painel.confirmadas === 5 && painel.presentes === 1 && painel.funil.visitas === 2 && painel.funil.inicios_form === 1 && painel.por_distancia["21k"] === 5, painel);
  const ficha = await call("evp_admin_participante", { p_slug: SLUG, p_id: r1.inscricao.id });
  t("ficha traz os dois check-ins e o histórico", ficha.checkins.length === 2 && ficha.historico.length >= 4, ficha);
  const edit = await call("evp_admin_editar_participante", { p_slug: SLUG, p_staff: mestre.id, p_id: r1.inscricao.id, p: { distancia: "42k", nome: p1.nome } });
  t("edição registra só o campo que mudou", edit.ok && edit.mudou.length === 1 && edit.mudou[0] === "distancia", edit);
  const lista = await call("evp_admin_participantes", { p_slug: SLUG });
  t("lista do painel não carrega CPF cifrado nem HMAC",
    lista.length > 0 && lista.every((x) => !("cpf_cifrado" in x) && !("cpf_hmac" in x)));
  const aud = await call("evp_admin_auditoria", { p_slug: SLUG, p_limite: 200 });
  t("auditoria guarda quem fez", aud.some((x) => x.acao === "checkin" && x.quem === "Operadora") && aud.some((x) => x.acao === "inscricao_cancelada"));

  console.log("\nPercursos");
  const linha = { coordenadas: [[-47.86, -15.79], [-47.87, -15.8]], comprimento_m: 1500, pontos: 2, arquivo_nome: "t.gpx", formato: "gpx", fonte: "teste", relatorio: {} };
  await call("evp_admin_percurso_salvar", { p_slug: SLUG, p_staff: mestre.id, p_distancia: "5k", p: linha });
  t("percurso enviado não aparece na página antes de publicar", (await call("evp_evento_publico", { p_slug: SLUG })).percursos.length === 0);
  await call("evp_admin_percurso_acao", { p_slug: SLUG, p_staff: mestre.id, p_distancia: "5k", p_acao: "publicar" });
  t("percurso publicado aparece", (await call("evp_evento_publico", { p_slug: SLUG })).percursos[0]?.distancia === "5k");
  await call("evp_admin_percurso_salvar", { p_slug: SLUG, p_staff: mestre.id, p_distancia: "5k", p: linha });
  t("arquivo novo volta para validação", (await call("evp_evento_publico", { p_slug: SLUG })).percursos.length === 0);

  console.log("\nSegurança");
  const { rows: rls } = await db.query(`select count(*)::int n from pg_class c join pg_namespace s on s.oid = c.relnamespace where s.nspname = 'public' and c.relname like 'evp\\_%' and c.relkind = 'r' and not c.relrowsecurity`);
  t("todas as tabelas com RLS ligada", rls[0].n === 0);
  const { rows: pol } = await db.query(`select count(*)::int n from pg_policies where tablename like 'evp\\_%'`);
  t("nenhuma política aberta para anon ou authenticated", pol[0].n === 0);
  const { rows: fx } = await db.query(`select count(*)::int n from pg_proc p join pg_namespace s on s.oid = p.pronamespace where s.nspname = 'public' and p.proname like 'evp\\_%' and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))`);
  t("nenhuma função executável por anon ou authenticated", fx[0].n === 0);
  const { rows: tb } = await db.query(`select count(*)::int n from information_schema.role_table_grants where table_name like 'evp\\_%' and grantee in ('anon', 'authenticated', 'PUBLIC')`);
  t("nenhuma tabela com permissão para anon ou authenticated", tb[0].n === 0);

  console.log(`\n${ok} passaram, ${ruim} falharam`);
  process.exit(ruim ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
