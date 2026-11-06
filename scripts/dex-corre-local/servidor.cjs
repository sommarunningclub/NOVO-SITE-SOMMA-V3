/**
 * Banco de mentira para ver e testar o Vem Correr Comigo sem tocar em produção.
 *
 * Postgres real (PGlite, em memória) com a migration de verdade, atrás de um
 * pedaço da API do Supabase: RPC, leitura de eventos e Storage. Tudo some ao
 * desligar. Inscritos são fictícios (CPFs gerados, e-mails @exemplo.test).
 *
 *   npm i --no-save @electric-sql/pglite   (ou NODE_PATH para onde ele estiver)
 *   node scripts/dex-corre-local/servidor.cjs
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const PORTA = Number(process.env.PORTA || 54399);
const SLUG = "dexcomplica-love-run";

function gerarCpf(n) {
  const b = String(100000000 + n * 7919).slice(0, 9).split("").map(Number);
  const dv = (a) => { const s = a.reduce((t, d, i) => t + d * (a.length + 1 - i), 0) % 11; return s < 2 ? 0 : 11 - s; };
  const d1 = dv(b); const d2 = dv([...b, d1]);
  return [...b, d1, d2].join("");
}

const NOMES = [
  ["Ana Teste", "feminino", "4km"], ["Pedro Teste", "masculino", "4km"], ["Camila Teste", "feminino", "4km"], ["Rafael Teste", "masculino", "4km"],
  ["Julia Teste", "feminino", "6km"], ["Lucas Teste", "masculino", "6km"], ["Fernanda Teste", "feminino", "6km"], ["Bruno Teste", "masculino", "6km"],
  ["Bruna Teste", "feminino", "8km"], ["Diego Teste", "masculino", "8km"], ["Marina Teste", "feminino", "4km"], ["Thiago Teste", "masculino", "4km"],
  ["Larissa Teste", "feminino", "4km"], ["Gustavo Teste", "masculino", "6km"], ["Paula Teste", "feminino", "8km"], ["Felipe Teste", "masculino", "4km"],
];

async function main() {
  const { PGlite } = await import(process.env.PGLITE_PATH || "@electric-sql/pglite");
  const db = new PGlite();
  const raiz = path.resolve(__dirname, "../..");
  await db.exec(fs.readFileSync(path.join(__dirname, "base.sql"), "utf8"));
  const { rows: [ev] } = await db.query(
    `insert into eventos (titulo, slug, data_evento, checkin_status, pelotoes, capacidade) values ('Dexcomplica Love Run', $1, '2026-11-07', 'bloqueado', '{4km,6km,8km}', 700) returning id`, [SLUG]);
  await db.exec(fs.readFileSync(path.join(raiz, "supabase/migrations/20261106190000_dex_corre_comunidade.sql"), "utf8"));

  const inscritos = [];
  for (let i = 0; i < NOMES.length; i++) {
    const [nome, sexo, pelotao] = NOMES[i];
    const cpf = gerarCpf(i + 1);
    const email = `${nome.split(" ")[0].toLowerCase()}@exemplo.test`;
    const { rows: [c] } = await db.query(`insert into cadastro_site (cpf, nome, email, sexo) values ($1,$2,$3,$4) returning id`, [cpf, nome, email, sexo]);
    const { rows: [p] } = await db.query(
      `insert into evento_participantes (evento_id, pessoa_id, cpf, nome_completo, email, pelotao, ticket_code) values ($1,$2,$3,$4,$5,$6,$7) returning id`,
      [ev.id, c.id, cpf, nome, email, pelotao, `DLR-TESTE${i}`]);
    inscritos.push({ nome, sexo, pelotao, cpf, participacao: p.id, pessoa: Number(c.id) });
  }

  // Comunidade inicial, pelas mesmas funções que o site usa.
  const rpc = async (fn, a) => {
    const nomes = Object.keys(a);
    const { rows } = await db.query(`select public.${fn}(${nomes.map((n, i) => `${n} => $${i + 1}`).join(", ")}) as r`, nomes.map((n) => a[n]));
    return rows[0].r;
  };
  const perfil = (i, preferencia, extra = {}) => rpc("dex_corre_salvar_perfil", {
    p_slug: SLUG, p_participacao: inscritos[i].participacao, p_pessoa: inscritos[i].pessoa,
    p_dados: JSON.stringify({ preferencia, termos: true, ...extra }),
  });
  const quer = (i, alvo) => rpc("dex_corre_interesse", { p_slug: SLUG, p_participacao: inscritos[i].participacao, p_pessoa: inscritos[i].pessoa, p_alvo_perfil: alvo, p_alvo_grupo: null });
  const codigo = async (i) => (await db.query(`select codigo from dex_corre_perfis where participacao_id = $1`, [inscritos[i].participacao])).rows[0].codigo;
  if (!process.env.SEM_SEMENTE) {
    await perfil(1, 4, { instagram: "pedro.teste" });
    await perfil(2, 3, { instagram: "camila.teste", whatsapp: "61999990002", whatsapp_publico: true });
    await perfil(3, 2);
    await perfil(10, 4);
    await perfil(11, 4);
    await perfil(4, 4); await perfil(5, 4); await perfil(6, 4); await perfil(7, 4);
    await perfil(8, 4); await perfil(9, 2);
    await quer(10, await codigo(11));
    await quer(5, await codigo(4));
    const g = (await db.query(`select g.codigo from dex_corre_grupos g join dex_corre_membros m on m.grupo_id=g.id join dex_corre_perfis p on p.id=m.perfil_id where p.participacao_id=$1`, [inscritos[4].participacao])).rows[0].codigo;
    await rpc("dex_corre_interesse", { p_slug: SLUG, p_participacao: inscritos[6].participacao, p_pessoa: inscritos[6].pessoa, p_alvo_perfil: null, p_alvo_grupo: g });
    await rpc("dex_corre_interesse", { p_slug: SLUG, p_participacao: inscritos[7].participacao, p_pessoa: inscritos[7].pessoa, p_alvo_perfil: null, p_alvo_grupo: g });
  }

  const tipos = new Map();
  const assinatura = async (fn) => {
    if (!tipos.has(fn)) {
      const { rows } = await db.query(
        `select unnest(proargnames) as nome, unnest(string_to_array(oidvectortypes(proargtypes), ', ')) as tipo from pg_proc where proname = $1`, [fn]);
      tipos.set(fn, Object.fromEntries(rows.map((r) => [r.nome, r.tipo])));
    }
    return tipos.get(fn);
  };

  const arquivos = new Map();
  let fila = Promise.resolve();
  const emFila = (f) => (fila = fila.then(f, f));

  const servidor = http.createServer(async (req, res) => {
    const pedacos = []; for await (const c of req) pedacos.push(c);
    const corpo = Buffer.concat(pedacos);
    const url = new URL(req.url, "http://x");
    // O popup global do site consulta o Supabase pelo navegador.
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("access-control-allow-headers", "*");
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    const json = (s, v, h = {}) => { res.writeHead(s, { "content-type": "application/json", ...h }); res.end(v === undefined ? "" : JSON.stringify(v)); };
    try {
      if (url.pathname === "/inscritos") return json(200, inscritos.map(({ nome, cpf, pelotao, sexo }) => ({ nome, cpf, pelotao, sexo })));
      if (url.pathname === "/sql" && req.method === "POST") {
        const { q, p } = JSON.parse(corpo.toString());
        return json(200, await emFila(() => db.query(q, p || []).then((r) => r.rows)));
      }
      const m = url.pathname.match(/^\/rest\/v1\/rpc\/(\w+)$/);
      if (m) {
        const fn = m[1]; const args = corpo.length ? JSON.parse(corpo.toString()) : {};
        const sig = await assinatura(fn);
        const nomes = Object.keys(args);
        const valores = nomes.map((n) => {
          const v = args[n];
          if (v === null || v === undefined) return null;
          if (sig[n] === "jsonb") return JSON.stringify(v);
          if (sig[n] === "uuid[]") return `{${v.join(",")}}`;
          return v;
        });
        const sql = `select public.${fn}(${nomes.map((n, i) => `${n} => $${i + 1}::${sig[n] || "text"}`).join(", ")}) as r`;
        const { rows } = await emFila(() => db.query(sql, valores));
        return json(200, rows[0].r ?? null);
      }
      const t = url.pathname.match(/^\/rest\/v1\/(\w+)$/);
      if (t) {
        if (t[1] === "eventos") {
          const { rows } = await db.query(`select * from eventos where slug = $1`, [SLUG]);
          const objeto = (req.headers.accept || "").includes("vnd.pgrst.object");
          return json(200, objeto ? rows[0] : rows);
        }
        if (req.method === "HEAD" || t[1] === "evento_participantes") return json(200, [], { "content-range": `0-0/${inscritos.length}` });
        return json(200, []);
      }
      const s = url.pathname.match(/^\/storage\/v1\/object\/(?:authenticated\/)?([^/]+)\/(.+)$/);
      if (s) {
        const chave = `${s[1]}/${decodeURIComponent(s[2])}`;
        if (req.method === "POST" || req.method === "PUT") {
          arquivos.set(chave, { corpo, tipo: req.headers["content-type"] || "application/octet-stream" });
          return json(200, { Key: chave });
        }
        const a = arquivos.get(chave);
        if (!a) return json(404, { message: "not found" });
        res.writeHead(200, { "content-type": a.tipo }); return res.end(a.corpo);
      }
      const d = url.pathname.match(/^\/storage\/v1\/object\/([^/]+)$/);
      if (d && req.method === "DELETE") {
        for (const p of JSON.parse(corpo.toString()).prefixes || []) arquivos.delete(`${d[1]}/${p}`);
        return json(200, []);
      }
      json(404, { message: "rota não simulada" });
    } catch (e) {
      console.error("[banco local]", e.message);
      json(400, { message: e.message, code: e.code });
    }
  });
  servidor.listen(PORTA, () => console.log(`banco local pronto em http://localhost:${PORTA}`));
}
main().catch((e) => { console.error(e); process.exit(1); });
