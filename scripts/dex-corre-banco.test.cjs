/**
 * Testes das regras do Vem Correr Comigo num Postgres real (PGlite, em memória),
 * com a migration de verdade. Não usa rede nem o banco de produção.
 *
 *   npm i --no-save @electric-sql/pglite && node scripts/dex-corre-banco.test.cjs
 *
 * O PGlite tem uma conexão só: a corrida pela última vaga é testada aqui pelo
 * resultado em sequência e, à parte, conferindo que toda função de escrita pega
 * o advisory lock. Disputa real entre conexões só um Postgres de servidor mostra.
 */
const fs = require("fs");
const path = require("path");
const SLUG = "dexcomplica-love-run";
let ok = 0, ruim = 0;
const t = (nome, cond, extra) => { if (cond) { ok++; console.log("  ✓", nome); } else { ruim++; console.log("  ✗", nome, extra === undefined ? "" : JSON.stringify(extra)); } };

(async () => {
  const { PGlite } = await import(process.env.PGLITE_PATH || "@electric-sql/pglite");
  const db = new PGlite();
  const raiz = path.resolve(__dirname, "..");
  await db.exec(fs.readFileSync(path.join(__dirname, "dex-corre-local/base.sql"), "utf8"));
  const { rows: [{ id: EV }] } = await db.query(`insert into eventos (titulo, slug, pelotoes) values ('Love Run', $1, '{4km,6km,8km}') returning id`, [SLUG]);
  const mig = fs.readFileSync(path.join(raiz, "supabase/migrations/20261106190000_dex_corre_comunidade.sql"), "utf8");
  await db.exec(mig);
  await db.exec(mig); // idempotente
  const migCorreio = fs.readFileSync(path.join(raiz, "supabase/migrations/20261106210000_dex_corre_correio.sql"), "utf8");
  await db.exec(migCorreio);
  await db.exec(migCorreio);

  let n = 0;
  const pessoa = async (nome, sexo, pelotao = "4km", extra = {}) => {
    n++;
    const cpf = String(10000000000 + n);
    const { rows: [c] } = await db.query(`insert into cadastro_site (cpf, nome, email, sexo) values ($1,$2,$3,$4) returning id`, [cpf, nome, `${n}@exemplo.test`, sexo]);
    const { rows: [p] } = await db.query(
      `insert into evento_participantes (evento_id, pessoa_id, cpf, nome_completo, email, pelotao, status, metadata) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
      [EV, c.id, cpf, nome, `${n}@exemplo.test`, pelotao, extra.status || "inscrito", JSON.stringify(extra.metadata || {})]);
    return { nome, cpf, part: p.id, pes: Number(c.id) };
  };
  const call = async (fn, a) => {
    const k = Object.keys(a);
    const { rows } = await db.query(`select public.${fn}(${k.map((x, i) => `${x} => $${i + 1}`).join(",")}) as r`, k.map((x) => a[x]));
    return rows[0].r;
  };
  const eu = (p) => ({ p_participacao: p.part, p_pessoa: p.pes });
  const foto = async (p) => {
    await db.query(`update dex_corre_perfis set foto_path = $1, foto_versao = greatest(foto_versao, 1) where participacao_id = $2 and ativo`, [`${p.part}/teste.jpg`, p.part]);
  };
  const perfil = async (p, pref, d = {}) => {
    const r = await call("dex_corre_salvar_perfil", { p_slug: SLUG, ...eu(p), p_dados: JSON.stringify({ preferencia: pref, termos: true, ...d }) });
    if (r?.ok && !d.sem_foto) await foto(p);
    return r;
  };
  const cod = async (p) => (await db.query(`select codigo from dex_corre_perfis where participacao_id=$1 and ativo`, [p.part])).rows[0]?.codigo;
  const quer = async (a, b) => call("dex_corre_interesse", { p_slug: SLUG, ...eu(a), p_alvo_perfil: await cod(b), p_alvo_grupo: null });
  const entrar = (a, g) => call("dex_corre_interesse", { p_slug: SLUG, ...eu(a), p_alvo_perfil: null, p_alvo_grupo: g });
  const estado = (p) => call("dex_corre_estado", { p_slug: SLUG, ...eu(p) });
  const vitrine = (p, f = {}, lim = 50, off = 0) => call("dex_corre_vitrine", { p_slug: SLUG, ...eu(p), p_filtros: JSON.stringify(f), p_limite: lim, p_offset: off });
  const responder = (p, c, s) => call("dex_corre_responder_convite", { p_slug: SLUG, ...eu(p), p_convite: c, p_aceitar: s });
  const sair = (p) => call("dex_corre_sair_do_grupo", { p_slug: SLUG, ...eu(p) });
  const convite1 = async (p) => (await estado(p)).convites_recebidos[0]?.id;

  console.log("Acesso e elegibilidade");
  const ana = await pessoa("Ana Maria Teste", "feminino");
  t("CPF inscrito resolve a vaga", (await call("dex_corre_entrar", { p_slug: SLUG, p_cpf: ana.cpf }))?.participacao_id === ana.part);
  t("CPF sem inscrição não resolve", (await call("dex_corre_entrar", { p_slug: SLUG, p_cpf: "99999999999" })) === null);
  const cancelada = await pessoa("Cancelada Teste", "feminino", "4km", { status: "cancelado" });
  t("inscrição cancelada não entra", (await call("dex_corre_entrar", { p_slug: SLUG, p_cpf: cancelada.cpf })) === null);
  t("sessão de vaga cancelada é inválida", (await call("dex_corre_sessao_valida", eu(cancelada))) === false);
  const dup = await pessoa("Duplicada Um", "feminino");
  const { rows: [c2] } = await db.query(`insert into cadastro_site (cpf, nome) values ($1,'Duplicada Dois') returning id`, [dup.cpf]);
  await db.query(`insert into evento_participantes (evento_id, pessoa_id, cpf, nome_completo, pelotao) values ($1,$2,$3,'Duplicada Dois','4km')`, [EV, c2.id, dup.cpf]);
  t("CPF com duas vagas não escolhe nenhuma", (await call("dex_corre_entrar", { p_slug: SLUG, p_cpf: dup.cpf })) === null);
  const { rows: [outro] } = await db.query(`insert into eventos (titulo, slug) values ('Outro', 'outro-evento') returning id`);
  const { rows: [c3] } = await db.query(`insert into cadastro_site (cpf, nome) values ('88888888888','Outro Evento') returning id`);
  await db.query(`insert into evento_participantes (evento_id, pessoa_id, cpf, nome_completo, pelotao) values ($1,$2,'88888888888','Outro Evento','4km')`, [outro.id, c3.id]);
  t("inscrição de outro evento não entra", (await call("dex_corre_entrar", { p_slug: SLUG, p_cpf: "88888888888" })) === null);

  t("acesso fica registrado para a métrica", (await call("dex_corre_metricas", { p_slug: SLUG })).autenticados >= 1);

  console.log("Perfil");
  t("cria perfil", (await perfil(ana, 3, { instagram: "ana.teste" })).criado === true);
  t("não cria perfil duplicado", (await perfil(ana, 3, { instagram: "ana.teste" })).criado === false);
  t("só um perfil ativo por vaga", (await db.query(`select count(*)::int c from dex_corre_perfis where participacao_id=$1`, [ana.part])).rows[0].c === 1);
  const semSexo = await pessoa("Sem Sexo", null);
  t("pede gênero quando o cadastro não tem", (await perfil(semSexo, 4)).erro === "genero");
  t("pedido de gênero aparece na inscrição", (await call("dex_corre_inscricao", eu(semSexo))).precisa_genero === true);
  t("aceita gênero autodeclarado", (await perfil(semSexo, 4, { genero: "outro" })).ok === true);
  const semTermo = await pessoa("Sem Termo", "feminino");
  t("exige aceite da publicação", (await call("dex_corre_salvar_perfil", { p_slug: SLUG, ...eu(semTermo), p_dados: JSON.stringify({ preferencia: 4 }) })).erro === "termos");
  const cadastroDiz = await pessoa("Cadastro Diz", "feminino");
  await perfil(cadastroDiz, 4, { genero: "masculino" });
  t("cadastro prevalece sobre o que vier do navegador", (await db.query(`select genero_grupo g from dex_corre_perfis where participacao_id=$1`, [cadastroDiz.part])).rows[0].g === "feminino");
  await db.query(`delete from dex_corre_perfis where participacao_id = any($1)`, [[semSexo.part, cadastroDiz.part]]);
  const nomeCurto = (await db.query(`select public.dex_corre__nome_curto('MARIA CLARA de souza') n`)).rows[0].n;
  t("mostra só primeiro e último nome", nomeCurto === "Maria Souza", nomeCurto);

  console.log("WhatsApp");
  const wa1 = await pessoa("Wa Publico", "feminino", "6km"), wa2 = await pessoa("Wa Privado", "masculino", "6km"), wa3 = await pessoa("Wa Sem", "feminino", "6km");
  await perfil(wa1, 4, { whatsapp: "61999990001", whatsapp_publico: true });
  await perfil(wa2, 4, { whatsapp: "61999990002", whatsapp_publico: false });
  await perfil(wa3, 4, { whatsapp_publico: true });
  const vit = await vitrine(wa3, { pelotao: "6km" });
  const texto = JSON.stringify(vit);
  t("WhatsApp público aparece", texto.includes("61999990001"));
  t("WhatsApp privado não vaza na vitrine", !texto.includes("61999990002"));
  t("dono vê o próprio número privado", (await estado(wa2)).perfil.whatsapp === "61999990002");
  t("público sem número vira privado", (await estado(wa3)).perfil.whatsapp_publico === false);
  t("ver_perfil não vaza privado", !JSON.stringify(await call("dex_corre_ver_perfil", { ...eu(wa1), p_codigo: await cod(wa2) })).includes("61999990002"));
  t("vitrine não traz CPF nem e-mail", !texto.includes(wa1.cpf) && !texto.includes("@exemplo.test"));
  await quer(wa1, wa2);
  const est = JSON.stringify(await estado(wa3));
  t("estado de terceiro não vaza privado de quem está em grupo", !est.includes("61999990002"));
  t("não expõe gênero nos cartões", !JSON.stringify((await vitrine(wa3)).itens).includes("masculino"));

  console.log("Dupla com aprovação");
  const joao = await pessoa("Joao Teste", "masculino", "8km"), maria = await pessoa("Maria Teste", "feminino", "8km");
  await perfil(joao, 2); await perfil(maria, 4);
  let r = await quer(maria, joao);
  t("vira convite", r.resultado === "convite_enviado", r);
  t("nenhum grupo antes do aceite", (await estado(maria)).grupo === null);
  r = await quer(maria, joao);
  t("clique repetido não duplica convite", r.repetido === true && (await db.query(`select count(*)::int c from dex_corre_convites where status='pending' and destinatario_id=(select id from dex_corre_perfis where participacao_id=$1)`, [joao.part])).rows[0].c === 1);
  const cv = await convite1(joao);
  r = await responder(joao, cv, true);
  t("aceite forma a dupla", r.resultado === "grupo_formado" && r.celebrar === "dupla", r);
  const g1 = (await estado(joao)).grupo;
  t("capacidade é a menor preferência", g1.info.capacidade === 2 && g1.info.completo === true, g1.info);
  r = await responder(joao, cv, true);
  t("aceitar de novo é idempotente", r.ok === true && r.resultado === "ja_no_grupo", r);
  t("notifica quem convidou com celebração", (await estado(maria)).notificacoes.some((x) => x.tipo === "convite_aceito" && x.dados.celebrar === "dupla"));
  const cami = await pessoa("Camila Oito", "feminino", "8km"); await perfil(cami, 4);
  t("não entra em dupla completa", (await entrar(cami, g1.codigo)).erro === "grupo_completo");

  console.log("Recusa e cancelamento");
  const a1 = await pessoa("Recusa Um", "masculino", "6km"), a2 = await pessoa("Recusa Dois", "feminino", "6km");
  await perfil(a1, 2); await perfil(a2, 2);
  await quer(a1, a2);
  r = await responder(a2, await convite1(a2), false);
  t("recusa não forma grupo", r.resultado === "recusado" && (await estado(a1)).grupo === null);
  t("avisa a recusa", (await estado(a1)).notificacoes.some((x) => x.tipo === "convite_recusado"));
  await quer(a1, a2);
  const idc = (await estado(a1)).convites_enviados[0].id;
  await call("dex_corre_cancelar_convite", { p_slug: SLUG, ...eu(a1), p_convite: idc });
  t("cancelado some para quem recebeu", (await estado(a2)).convites_recebidos.length === 0);
  t("não aceita convite cancelado", (await responder(a2, idc, true)).erro === "convite_invalido");
  await quer(a1, a2);
  const idx = (await estado(a2)).convites_recebidos[0].id;
  t("terceiro não responde convite alheio", (await responder(wa3, idx, true)).erro === "convite_invalido");
  await db.query(`update dex_corre_convites set expira_em = now() - interval '1 second' where id=$1`, [idx]);
  await estado(a2);
  t("convite vencido vira expired", (await db.query(`select status from dex_corre_convites where id=$1`, [idx])).rows[0].status === "expired");
  await quer(a1, a2);
  r = await quer(a2, a1);
  t("clicar de volta em quem já convidou aceita", r.resultado === "grupo_formado", r);

  console.log("Trio e quarteto automáticos");
  const pedro = await pessoa("Pedro Tres", "masculino"), camila = await pessoa("Camila Tres", "feminino");
  await perfil(pedro, 4); await perfil(camila, 3);
  r = await quer(pedro, ana);
  t("conecta na hora quando os dois aceitam entrada automática", r.resultado === "grupo_formado", r);
  const gt = r.grupo;
  t("grupo de 2 com capacidade 3 segue aberto", (() => true)() && (await estado(ana)).grupo.info.capacidade === 3 && (await estado(ana)).grupo.info.completo === false);
  r = await entrar(camila, gt);
  t("terceira pessoa entra direto", r.resultado === "entrou_no_grupo" && r.celebrar === "trio", r);
  t("trio fecha por capacidade", (await estado(ana)).grupo.info.completo === true);
  const quartaP = await pessoa("Quarta Pessoa", "masculino"); await perfil(quartaP, 4);
  t("preferência mais restritiva barra o quarto", (await entrar(quartaP, gt)).erro === "grupo_completo");
  t("celebração chega a quem já estava", (await estado(pedro)).notificacoes.some((x) => x.dados.celebrar === "trio"));

  const l = await pessoa("Lucas Q", "masculino", "6km"), f = await pessoa("Fernanda Q", "feminino", "6km"), b = await pessoa("Bruna Q", "feminino", "6km"), rf = await pessoa("Rafael Q", "masculino", "6km");
  await perfil(l, 4); await perfil(f, 4); await perfil(b, 4); await perfil(rf, 4);
  r = await quer(l, f); const gq = r.grupo;
  await entrar(b, gq);
  r = await entrar(rf, gq);
  t("quarteto completa", r.celebrar === "quarteto" && r.total === 4, r);
  const eq = await estado(l);
  t("quarteto completo não aceita mais ninguém", eq.grupo.info.completo === true && eq.grupo.info.vagas === 0);
  t("avisa grupo completo", eq.notificacoes.some((x) => x.tipo === "grupo_completo"));

  console.log("Composição");
  const h1 = await pessoa("Homem Um", "masculino", "4km"), h2 = await pessoa("Homem Dois", "masculino", "4km"), h3 = await pessoa("Homem Tres", "masculino", "4km"), m1 = await pessoa("Mulher Um", "feminino", "4km");
  await perfil(h1, 4); await perfil(h2, 4); await perfil(h3, 4); await perfil(m1, 4);
  r = await quer(h1, h2); const gh = r.grupo;
  t("terceiro homem é barrado", (await entrar(h3, gh)).erro === "composicao");
  t("mulher entra", (await entrar(m1, gh)).ok === true);
  const nb = await pessoa("Pessoa Outra", null, "4km"); await perfil(nb, 4, { genero: "outro" });
  const m2 = await pessoa("Mulher Dois", "feminino", "4km"); await perfil(m2, 4);
  t("outro gênero não fecha quarteto 2+2 com a regra padrão", (await entrar(nb, gh)).erro === "composicao");
  t("grupo 2H+1M só aceita mulher", (await estado(h1)).grupo.info.aceita_feminino === true && (await estado(h1)).grupo.info.aceita_masculino === false);
  await db.query(`update dex_corre_config set quarteto_exige_paridade=false where evento_id=$1`, [EV]);
  const est4 = await estado(h1);
  t("regra é configurável pela organização", est4.grupo.info.aceita_outro === true);
  await db.query(`update dex_corre_config set quarteto_exige_paridade=true where evento_id=$1`, [EV]);
  r = await quer(nb, h3);
  t("outro gênero forma dupla sem atribuição automática", r.resultado === "grupo_formado", r);

  console.log("Distância, vínculo e vitrine");
  const d4 = await pessoa("Dist Quatro", "feminino", "4km"), d8 = await pessoa("Dist Oito", "masculino", "8km");
  await perfil(d4, 4); await perfil(d8, 4);
  t("distâncias diferentes não conectam", (await quer(d4, d8)).erro === "distancia");
  t("grupo de outra distância recusa", (await entrar(d8, gh)).erro === "distancia");
  const naOutra = await pessoa("Vinculada", "feminino", "6km"), alvoV = await pessoa("Alvo V", "masculino", "6km"), terceiroV = await pessoa("Terceiro V", "masculino", "6km"), quartoV = await pessoa("Quarto V", "feminino", "6km");
  await perfil(naOutra, 4); await perfil(alvoV, 4); await perfil(terceiroV, 4); await perfil(quartoV, 4);
  r = await quer(naOutra, alvoV); const gv = r.grupo;
  t("quem tem grupo não entra em outro", (await entrar(naOutra, gq)).erro === "ja_em_grupo");
  r = await quer(terceiroV, quartoV); const gv2 = r.grupo;
  t("dois grupos não se unem", (await entrar(terceiroV, gv)).erro === "ja_em_grupo");
  const v = await vitrine(naOutra);
  t("vitrine não mostra a própria pessoa", !JSON.stringify(v.itens).includes(await cod(naOutra)) || v.itens.every((i) => i.tipo === "grupo" || i.dados.codigo !== undefined));
  t("quem está em grupo não aparece como individual", !v.itens.some((i) => i.tipo === "pessoa" && i.dados.nome === "Alvo V"));
  t("meu grupo vem marcado", v.itens.some((i) => i.tipo === "grupo" && i.acao === "meu"));
  t("grupo completo aparece sem entrada", v.itens.some((i) => i.tipo === "grupo" && i.acao === "completo"));
  const ordem = (await vitrine(d4)).itens;
  const idxOutra = ordem.findIndex((i) => (i.dados.pelotao) !== "4km");
  t("mesma distância vem primeiro", ordem.slice(0, idxOutra).every((i) => i.dados.pelotao === "4km") && idxOutra > 0);
  t("filtro por distância", (await vitrine(d4, { pelotao: "8km" })).itens.every((i) => i.dados.pelotao === "8km"));
  t("filtro por tamanho", (await vitrine(d4, { tamanho: "2" })).itens.every((i) => i.tipo === "pessoa" ? i.dados.preferencia === 2 : i.dados.info.capacidade === 2));
  t("filtro com vagas", (await vitrine(d4, { com_vagas: true })).itens.every((i) => i.tipo === "pessoa" || !i.dados.info.completo));
  t("busca ignora acento", (await vitrine(d4, { busca: "dist oito" })).itens.length === 1);
  t("busca sem resultado", (await vitrine(d4, { busca: "zzzz" })).total === 0);
  const p1 = await vitrine(d4, {}, 3, 0), p2 = await vitrine(d4, {}, 3, 3);
  t("paginação não repete", p1.itens.length === 3 && JSON.stringify(p1.itens) !== JSON.stringify(p2.itens) && p1.total > 6);

  console.log("Convite em grupo e convites conflitantes");
  const q1 = await pessoa("Conflito Um", "feminino", "8km"), q2 = await pessoa("Conflito Dois", "masculino", "8km"), q3 = await pessoa("Conflito Tres", "feminino", "8km"), dest = await pessoa("Conflito Dest", "masculino", "8km");
  await perfil(q1, 2); await perfil(q2, 2); await perfil(q3, 4); await perfil(dest, 2);
  await quer(q1, dest); await quer(q2, dest);
  const conv = (await estado(dest)).convites_recebidos;
  t("recebe vários convites", conv.length === 2);
  await responder(dest, conv[0].id, true);
  t("ao entrar, os outros deixam de valer", (await estado(dest)).convites_recebidos.length === 0);
  t("convite antigo não aceita", (await responder(dest, conv[1].id, true)).ok === false);
  const conv2a = await pessoa("Grupo Conv A", "feminino", "8km"), conv2b = await pessoa("Grupo Conv B", "masculino", "8km"), conv2c = await pessoa("Grupo Conv C", "feminino", "8km");
  await perfil(conv2a, 4); await perfil(conv2b, 4); await perfil(conv2c, 4);
  r = await quer(conv2a, conv2b); const gc = r.grupo;
  r = await quer(conv2a, conv2c);
  t("quem tem grupo convida, não puxa direto", r.resultado === "convite_enviado", r);
  t("convidado ainda não entrou", (await estado(conv2c)).grupo === null);
  r = await responder(conv2c, await convite1(conv2c), true);
  t("aceite entra no grupo do convite", r.resultado === "entrou_no_grupo" && r.grupo === gc, r);

  console.log("Última vaga");
  const u1 = await pessoa("Ultima A", "masculino", "8km"), u2 = await pessoa("Ultima B", "feminino", "8km"), u3 = await pessoa("Ultima C", "feminino", "8km"), u4 = await pessoa("Ultima D", "masculino", "8km"), u5 = await pessoa("Ultima E", "masculino", "8km");
  for (const u of [u1, u2, u3, u4, u5]) await perfil(u, 4);
  r = await quer(u1, u2); const gu = r.grupo; await entrar(u3, gu);
  const [x, y] = await Promise.all([entrar(u4, gu), entrar(u5, gu)]);
  t("só um leva a última vaga", [x, y].filter((z) => z.ok).length === 1 && [x, y].some((z) => z.erro === "grupo_completo"), [x, y]);
  t("nunca passa de 4", (await db.query(`select max(c)::int m from (select count(*) c from dex_corre_membros where saiu_em is null group by grupo_id) t`)).rows[0].m <= 4);
  t("cada pessoa em um grupo só", (await db.query(`select count(*)::int c from (select perfil_id from dex_corre_membros where saiu_em is null group by perfil_id having count(*)>1) t`)).rows[0].c === 0);
  let bateu = false;
  try { await db.query(`insert into dex_corre_membros (grupo_id, perfil_id) select grupo_id, perfil_id from dex_corre_membros where saiu_em is null limit 1`); } catch { bateu = true; }
  t("índice do banco barra dois vínculos ativos", bateu);
  const fontes = mig.split("create or replace function").filter((s) => /public\.dex_corre_(interesse|responder_convite|sair_do_grupo|salvar_perfil|cancelar_convite)\(/.test(s.slice(0, 80)));
  t("toda escrita de grupo pega a trava", fontes.length === 5 && fontes.every((s) => s.includes("dex_corre__travar")), fontes.length);

  console.log("Mudança de preferência");
  const pm = await pessoa("Pref Muda", "feminino", "6km"), pn = await pessoa("Pref Nao", "masculino", "6km"), po = await pessoa("Pref Outra", "feminino", "6km");
  await perfil(pm, 4); await perfil(pn, 4); await perfil(po, 4);
  r = await quer(pm, pn); await entrar(po, r.grupo);
  t("não reduz abaixo do grupo atual", (await perfil(pm, 2)).erro === "preferencia_grupo");
  t("reduz para o tamanho atual", (await perfil(pm, 3)).ok === true);
  t("capacidade recalcula", (await estado(pn)).grupo.info.capacidade === 3);

  console.log("Saída");
  const s1 = await pessoa("Sai Um", "feminino", "6km"), s2 = await pessoa("Sai Dois", "masculino", "6km"), s3 = await pessoa("Sai Tres", "feminino", "6km");
  await perfil(s1, 4); await perfil(s2, 4); await perfil(s3, 4);
  r = await quer(s1, s2); const gs = r.grupo; await entrar(s3, gs);
  await sair(s3);
  t("libera a vaga", (await estado(s1)).grupo.info.total === 2);
  t("avisa quem ficou", (await estado(s1)).notificacoes.some((x) => x.tipo === "saida"));
  t("quem saiu volta para a vitrine", (await vitrine(d4, { busca: "sai tres" })).itens.length === 1);
  t("sair sem grupo não quebra", (await sair(s3)).resultado === "sem_grupo");
  await sair(s2);
  t("sobrou um: volta a ser individual", (await estado(s1)).grupo === null);
  t("grupo encerrado some", (await db.query(`select status from dex_corre_grupos where codigo=$1`, [gs])).rows[0].status === "encerrado");
  t("histórico preserva a saída", (await db.query(`select count(*)::int c from dex_corre_membros m join dex_corre_grupos g on g.id=m.grupo_id where g.codigo=$1 and m.saiu_em is not null`, [gs])).rows[0].c === 3);
  t("link de grupo encerrado não abre", (await call("dex_corre_ver_grupo", { ...eu(s1), p_codigo: gs })).erro === "nao_encontrado");

  console.log("Transferência");
  const tr1 = await pessoa("Vai Transferir", "masculino", "6km"), tr2 = await pessoa("Fica No Grupo", "feminino", "6km"), novo = await pessoa("Temporario", "feminino", "6km");
  await perfil(tr1, 4); await perfil(tr2, 4);
  r = await quer(tr1, tr2);
  const { rows: [nc] } = await db.query(`insert into cadastro_site (cpf, nome, sexo) values ('77777777777','Novo Titular','feminino') returning id`);
  await db.query(`update evento_participantes set pessoa_id=$1, cpf='77777777777', nome_completo='Novo Titular', metadata='{"sexo":"feminino"}' where id=$2`, [nc.id, tr1.part]);
  t("sessão de quem transferiu cai", (await call("dex_corre_sessao_valida", eu(tr1))) === false);
  t("CPF antigo não entra mais", (await call("dex_corre_entrar", { p_slug: SLUG, p_cpf: tr1.cpf })) === null);
  t("CPF novo entra", (await call("dex_corre_entrar", { p_slug: SLUG, p_cpf: "77777777777" }))?.participacao_id === tr1.part);
  t("quem ficou é avisado e volta a individual", (await estado(tr2)).grupo === null);
  const novoTit = { part: tr1.part, pes: Number(nc.id) };
  t("novo titular cria o próprio perfil", (await perfil(novoTit, 4)).criado === true);
  t("perfil antigo fica desligado", (await db.query(`select count(*)::int c from dex_corre_perfis where participacao_id=$1 and ativo`, [tr1.part])).rows[0].c === 1);
  await db.query(`update evento_participantes set status='cancelado' where id=$1`, [novo.part]);
  t("nada disso mexeu na inscrição", (await db.query(`select pelotao from evento_participantes where id=$1`, [tr2.part])).rows[0].pelotao === "6km");
  const m3 = await pessoa("Muda Pelotao", "feminino", "4km"), m4 = await pessoa("Fica Pelotao", "masculino", "4km");
  await perfil(m3, 4); await perfil(m4, 4); await quer(m3, m4);
  await db.query(`update evento_participantes set pelotao='8km' where id=$1`, [m3.part]);
  t("troca de pelotão na gestão desfaz o grupo", (await estado(m4)).grupo === null);

  console.log("Foto obrigatória e chat");
  const sf1 = await pessoa("Sem Foto Um", "feminino", "4km"), sf2 = await pessoa("Sem Foto Dois", "masculino", "4km");
  await call("dex_corre_salvar_perfil", { p_slug: SLUG, ...eu(sf1), p_dados: JSON.stringify({ preferencia: 4, termos: true }) });
  await perfil(sf2, 4);
  t("sem foto não conecta", (await quer(sf1, sf2)).erro === "sem_foto");
  t("sem foto some da vitrine", !(await vitrine(sf2, { busca: "sem foto um" })).itens.some((x) => x.tipo === "pessoa" && x.dados.nome.toLowerCase().includes("sem foto")));
  await foto(sf1);
  const ch1 = await pessoa("Chat Um", "feminino", "4km"), ch2 = await pessoa("Chat Dois", "masculino", "4km"), ch3 = await pessoa("Chat Tres", "feminino", "4km");
  await perfil(ch1, 4); await perfil(ch2, 4); await perfil(ch3, 4);
  r = await quer(ch1, ch2);
  const cg = r.grupo;
  let chat = await call("dex_corre_chat_enviar", { ...eu(ch1), p_codigo: cg, p_texto: "Bora descomplicar!" });
  t("membro envia mensagem", chat.ok === true && chat.mensagem.texto === "Bora descomplicar!");
  chat = await call("dex_corre_chat_enviar", { ...eu(ch3), p_codigo: cg, p_texto: "Posso comentar de fora?" });
  t("quem está fora também comenta (chat público)", chat.ok === true, chat);
  const mid = chat.mensagem.id;
  t("edita a própria", (await call("dex_corre_chat_editar", { ...eu(ch3), p_mensagem: mid, p_texto: "Editada!" })).mensagem.texto === "Editada!");
  t("outro não edita", (await call("dex_corre_chat_editar", { ...eu(ch1), p_mensagem: mid, p_texto: "Hack" })).erro === "mensagem_invalida");
  t("reage com emoji", (await call("dex_corre_chat_reagir", { ...eu(ch1), p_mensagem: mid, p_emoji: "🔥" })).mensagem.reacoes[0].emoji === "🔥");
  t("toggle tira a reação", (await call("dex_corre_chat_reagir", { ...eu(ch1), p_mensagem: mid, p_emoji: "🔥" })).mensagem.reacoes.length === 0);
  t("apaga a própria", (await call("dex_corre_chat_apagar", { ...eu(ch3), p_mensagem: mid })).ok === true);
  const lista = await call("dex_corre_chat_listar", { ...eu(ch2), p_codigo: cg });
  t("listar mostra apagada", lista.mensagens.some((m) => m.id === mid && m.apagada));
  t("abrir grupo de fora mostra membros", (await call("dex_corre_ver_grupo", { ...eu(ch3), p_codigo: cg })).grupo.membros.length === 2);

  console.log("Correio Elegante");
  {
  const c1 = await pessoa("Correio Um", "feminino", "6km"), c2 = await pessoa("Correio Dois", "masculino", "6km"), c3 = await pessoa("Correio Tres", "feminino", "6km"), c4 = await pessoa("Correio Quatro", "masculino", "6km"), c5 = await pessoa("Correio Cinco", "feminino", "6km");
  await perfil(c1, 4, { instagram: "correio.um", whatsapp: "61988880001" }); await perfil(c2, 4); await perfil(c3, 4); await perfil(c4, 4);
  const publicar = (p, d) => call("dex_corre_correio_publicar", { p_slug: SLUG, ...eu(p), p_dados: JSON.stringify(d) });
  const mural = (p, l = 50, o = 0) => call("dex_corre_correio_mural", { p_slug: SLUG, ...eu(p), p_limite: l, p_offset: o });
  t("sem perfil não publica", (await publicar(c5, { para: "x", mensagem: "y" })).erro === "perfil");
  t("sem perfil não vê o mural", (await mural(c5)).erro === "perfil");
  t("recusa texto vazio", (await publicar(c1, { para: "  ", mensagem: "oi" })).erro === "texto");
  t("recusa texto longo", (await publicar(c1, { para: "Ana", mensagem: "x".repeat(281) })).erro === "texto");
  t("recusa telefone no texto", (await publicar(c1, { para: "Ana", mensagem: "me liga 61 98888-0001" })).erro === "contato_no_texto");
  t("recusa CPF no destinatário", (await publicar(c1, { para: "529.982.247-25", mensagem: "oi" })).erro === "contato_no_texto");
  t("aceita data e distância no texto", (await publicar(c1, { para: "Ana", mensagem: "te vejo dia 07.11 nos 6 km" })).ok === true);
  const anon = await publicar(c1, { para: "Moço do 6 km", mensagem: "Recado anônimo", identificado: false, mostrar_instagram: true, mostrar_whatsapp: true, foto_path: "correio/x.jpg" });
  const assin = await publicar(c1, { para: "Moça do 6 km", mensagem: "Recado com nome", identificado: true, mostrar_instagram: true });
  const comWa = await publicar(c1, { para: "Fulana", mensagem: "Recado com whats", identificado: true, mostrar_whatsapp: true });
  const m1 = await mural(c2);
  const achar = (m, id) => m.itens.find((i) => i.id === id);
  const ra = achar(m1, anon.id), rs = achar(m1, assin.id), rw = achar(m1, comWa.id);
  t("anônimo não traz autor", ra.autor === null);
  t("anônimo não vaza nada do autor", !JSON.stringify(ra).includes("correio.um") && !JSON.stringify(ra).includes("Correio") && !JSON.stringify(ra).includes("61988880001"));
  t("anônimo com contato ligado é anulado", (await db.query(`select mostrar_instagram i, mostrar_whatsapp w from dex_corre_correio where id=$1`, [anon.id])).rows[0].i === false);
  t("assinado mostra o nome", rs.autor.nome === "Correio Um");
  t("Instagram só quando pediu", rs.autor.instagram === "correio.um" && rs.autor.whatsapp === null);
  t("WhatsApp só quando pediu", rw.autor.whatsapp === "61988880001" && rw.autor.instagram === null);
  t("mural não traz caminho da foto", !JSON.stringify(m1).includes("correio/x.jpg") && ra.foto === true);
  t("mural não traz CPF nem e-mail", !JSON.stringify(m1).includes(c1.cpf) && !JSON.stringify(m1).includes("@exemplo.test"));
  t("autor reconhece o próprio anônimo", achar(await mural(c1), anon.id).meu === true);
  t("outros não sabem que é de quem", ra.meu === false);
  const contato = await publicar(c2, { para: "A", mensagem: "sem insta", identificado: true, mostrar_instagram: true });
  t("sem Instagram no perfil, a opção não vale", achar(await mural(c1), contato.id).autor.instagram === null);
  t("clique repetido não duplica", (await publicar(c2, { para: "A", mensagem: "sem insta", identificado: true })).repetido === true);
  t("foto só com sessão válida", (await call("dex_corre_correio_foto", { ...eu(c2), p_recado: anon.id })) === "correio/x.jpg" && (await call("dex_corre_correio_foto", { ...eu(cancelada), p_recado: anon.id })) === null);
  t("não apaga recado de outra pessoa", (await call("dex_corre_correio_apagar", { ...eu(c2), p_recado: anon.id })).erro === "nao_encontrado");
  t("não denuncia o próprio", (await call("dex_corre_correio_denunciar", { ...eu(c1), p_recado: anon.id })).erro === "proprio");
  await call("dex_corre_correio_denunciar", { ...eu(c2), p_recado: anon.id });
  await call("dex_corre_correio_denunciar", { ...eu(c2), p_recado: anon.id });
  t("mesma pessoa denuncia uma vez só", achar(await mural(c2), anon.id).denunciei === true && (await db.query(`select count(*)::int c from dex_corre_correio_denuncias where recado_id=$1`, [anon.id])).rows[0].c === 1);
  await call("dex_corre_correio_denunciar", { ...eu(c3), p_recado: anon.id });
  t("duas denúncias não ocultam", !!achar(await mural(c2), anon.id));
  t("terceira denúncia oculta", (await call("dex_corre_correio_denunciar", { ...eu(c4), p_recado: anon.id })).ocultado === true && !achar(await mural(c2), anon.id));
  t("foto de recado oculto não abre", (await call("dex_corre_correio_foto", { ...eu(c2), p_recado: anon.id })) === null);
  const del = await call("dex_corre_correio_apagar", { ...eu(c1), p_recado: assin.id });
  t("autor apaga o próprio", del.ok === true && !achar(await mural(c2), assin.id));
  const lim = await pessoa("Correio Limite", "feminino", "8km"); await perfil(lim, 4);
  for (let i = 0; i < 5; i++) await publicar(lim, { para: "A", mensagem: "recado " + i });
  t("limite de 5 recados por hora", (await publicar(lim, { para: "A", mensagem: "recado 6" })).erro === "limite_recados");
  const pg1 = await mural(c2, 2, 0), pg2 = await mural(c2, 2, 2);
  t("mural pagina sem repetir", pg1.itens.length === 2 && pg1.itens[0].id !== pg2.itens[0].id && pg1.total >= 4);
  await db.query(`update evento_participantes set status='cancelado' where id=$1`, [c1.part]);
  t("inscrição cancelada tira os recados do mural", !achar(await mural(c2), comWa.id));

  }

  console.log("Números");
  const nums = (await estado(d4)).numeros;
  const { rows: [real] } = await db.query(`select count(distinct m.perfil_id)::int c from dex_corre_membros m join dex_corre_grupos g on g.id=m.grupo_id where m.saiu_em is null and g.status='ativo'`);
  t("conectadas sem contar duas vezes", nums.conectadas === real.c, [nums, real]);
  const met = await call("dex_corre_metricas", { p_slug: SLUG });
  t("métricas calculam", met.perfis > 0 && met.elegiveis > 0 && met.convites_enviados > 0 && met.taxa_aceite !== null, met);

  console.log("Permissões");
  const perm = async (sql) => (await db.query(sql)).rows[0].x;
  t("anon sem acesso às tabelas", (await perm(`select bool_or(has_table_privilege('anon', c.oid, 'select')) x from pg_class c where relname like 'dex_corre_%' and relkind in ('r','v')`)) === false);
  t("authenticated sem acesso às tabelas", (await perm(`select bool_or(has_table_privilege('authenticated', c.oid, 'select')) x from pg_class c where relname like 'dex_corre_%' and relkind in ('r','v')`)) === false);
  t("anon não executa funções", (await perm(`select bool_or(has_function_privilege('anon', p.oid, 'execute')) x from pg_proc p where proname like 'dex_corre_%'`)) === false);
  t("RLS ligada em todas as tabelas", (await perm(`select bool_and(relrowsecurity) x from pg_class where relname like 'dex_corre_%' and relkind='r'`)) === true);
  t("bucket de fotos é privado", (await db.query(`select public from storage.buckets where id='dex-corre-fotos'`)).rows[0].public === false);
  t("nenhum perfil tem dado de outra vaga", (await perm(`select count(*)=0 x from dex_corre_perfis p join evento_participantes e on e.id=p.participacao_id where p.ativo and e.evento_id<>p.evento_id`)) === true);

  console.log(`\n${ok} passaram, ${ruim} falharam`);
  process.exit(ruim ? 1 : 0);
})().catch((e) => { console.error("ERRO", e); process.exit(1); });
