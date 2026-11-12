/**
 * Banco de mentira para rodar e testar a plataforma de eventos (evp_) sem tocar
 * em produção: Postgres de verdade (PGlite, em memória) com a migration real,
 * atrás do pedaço da API do Supabase que o site usa (RPC, aceites e Storage).
 *
 *   npm i --no-save @electric-sql/pglite
 *   node scripts/evp-local/servidor.cjs
 *
 * Rotas extras, só para teste:
 *   POST /__teste/sql   { sql, params }  roda SQL direto (preparar cenário)
 *   POST /__teste/falha { ligada }       faz toda RPC responder 500
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORTA = Number(process.env.PORTA || 54398);
const arquivos = new Map();
let falha = false;

async function main() {
  const { PGlite } = await import(process.env.PGLITE_PATH || "@electric-sql/pglite");
  const db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role;");
  await db.exec(`create table if not exists public.aceites_termos (
    id bigint generated always as identity primary key, tipo text, versao text, origem text, forma text,
    cpf_digits text, nome text, email text, evento_id text, ip text, user_agent text, criado_em timestamptz default now())`);
  // Base do clube, só com o que a identificação por CPF consulta.
  await db.exec(`create table if not exists public.cadastro_site (
    id uuid primary key default gen_random_uuid(), nome_completo text, email text, cpf text, data_nascimento text,
    whatsapp text, cep text, sexo text, data_de_cadastro timestamptz default now());
    create table if not exists public.checkins (
    id uuid primary key default gen_random_uuid(), nome_completo text, email text, telefone text, cpf text, sexo text,
    data_hora_checkin timestamptz default now())`);
  const pasta = path.join(__dirname, "../../supabase/migrations");
  for (const n of fs.readdirSync(pasta).filter((x) => x.includes("_evp_")).sort()) {
    await db.exec(fs.readFileSync(path.join(pasta, n), "utf8"));
  }

  const corpoDe = (req) =>
    new Promise((ok) => {
      const partes = [];
      req.on("data", (c) => partes.push(c));
      req.on("end", () => ok(Buffer.concat(partes)));
    });
  const json = (res, status, dados) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(dados === undefined ? "" : JSON.stringify(dados));
  };

  http
    .createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${PORTA}`);
      try {
        if (url.pathname === "/__teste/sql" && req.method === "POST") {
          const { sql, params } = JSON.parse((await corpoDe(req)).toString() || "{}");
          const r = await db.query(sql, params || []);
          return json(res, 200, { rows: r.rows });
        }
        if (url.pathname === "/__teste/falha" && req.method === "POST") {
          falha = Boolean(JSON.parse((await corpoDe(req)).toString() || "{}").ligada);
          return json(res, 200, { falha });
        }

        const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/([a-z_0-9]+)$/);
        if (rpc && req.method === "POST") {
          if (falha) return json(res, 500, { message: "banco fora do ar (teste)" });
          const args = JSON.parse((await corpoDe(req)).toString() || "{}");
          const nomes = Object.keys(args);
          const valores = nomes.map((n) => (args[n] !== null && typeof args[n] === "object" ? JSON.stringify(args[n]) : args[n]));
          try {
            const { rows } = await db.query(
              `select public.${rpc[1]}(${nomes.map((n, i) => `${n} => $${i + 1}`).join(", ")}) as r`,
              valores
            );
            return json(res, 200, rows[0]?.r ?? null);
          } catch (erro) {
            return json(res, 400, { message: erro.message, code: erro.code });
          }
        }

        if (url.pathname === "/rest/v1/aceites_termos" && req.method === "POST") {
          const linhas = JSON.parse((await corpoDe(req)).toString() || "[]");
          for (const l of Array.isArray(linhas) ? linhas : [linhas]) {
            await db.query(
              `insert into aceites_termos (tipo, versao, origem, forma, cpf_digits, nome, email, evento_id, ip, user_agent) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
              [l.tipo, l.versao, l.origem, l.forma, l.cpf_digits, l.nome, l.email, l.evento_id, l.ip, l.user_agent]
            );
          }
          return json(res, 201);
        }

        // cadastro_site e checkins: leitura com filtros simples, inserção e atualização por id.
        const tab = url.pathname.match(/^\/rest\/v1\/(cadastro_site|checkins)$/);
        if (tab) {
          const tabela = tab[1];
          const onde = [];
          const params = [];
          let ordem = "";
          let limite = "";
          for (const [k, v] of url.searchParams) {
            if (k === "select") continue;
            if (k === "limit") { limite = ` limit ${Number(v) || 1}`; continue; }
            if (k === "order") { const [col, dir] = v.split("."); ordem = ` order by ${col.replace(/[^a-z_]/g, "")} ${dir === "desc" ? "desc" : "asc"}`; continue; }
            const col = k.replace(/[^a-z_]/g, "");
            const [op, ...resto] = v.split(".");
            const val = resto.join(".");
            if (op === "eq") { params.push(val); onde.push(`${col}::text = $${params.length}`); }
            else if (op === "ilike") { params.push(val.replace(/\*/g, "%")); onde.push(`${col} ilike $${params.length}`); }
            else if (op === "in") {
              const itens = val.replace(/^\(|\)$/g, "").split(",").map((x) => x.replace(/^"|"$/g, ""));
              onde.push(`${col} in (${itens.map((x) => { params.push(x); return `$${params.length}`; }).join(",")})`);
            }
          }
          const filtro = onde.length ? ` where ${onde.join(" and ")}` : "";
          if (req.method === "GET") {
            const { rows } = await db.query(`select * from ${tabela}${filtro}${ordem}${limite}`, params);
            return json(res, 200, rows);
          }
          const corpo = JSON.parse((await corpoDe(req)).toString() || "{}");
          if (req.method === "POST") {
            const saida = [];
            for (const l of Array.isArray(corpo) ? corpo : [corpo]) {
              const cols = Object.keys(l);
              const { rows } = await db.query(`insert into ${tabela} (${cols.join(",")}) values (${cols.map((_, i) => `$${i + 1}`).join(",")}) returning *`, cols.map((c) => l[c]));
              saida.push(rows[0]);
            }
            return json(res, 201, saida);
          }
          if (req.method === "PATCH") {
            const cols = Object.keys(corpo);
            const base = params.length;
            await db.query(`update ${tabela} set ${cols.map((c, i) => `${c} = $${base + i + 1}`).join(", ")}${filtro}`, [...params, ...cols.map((c) => corpo[c])]);
            return json(res, 204);
          }
        }

        const obj = url.pathname.match(/^\/storage\/v1\/object\/(public\/)?(.+)$/);
        if (obj && req.method === "POST") {
          arquivos.set(obj[2], { corpo: await corpoDe(req), tipo: req.headers["content-type"] || "application/octet-stream" });
          return json(res, 200, { Key: obj[2] });
        }
        if (obj && req.method === "GET") {
          const a = arquivos.get(obj[2]);
          if (!a) return json(res, 404, { message: "não encontrado" });
          res.writeHead(200, { "Content-Type": a.tipo.includes("multipart") ? "image/png" : a.tipo });
          return res.end(a.corpo);
        }
        json(res, 404, { message: `rota não emulada: ${req.method} ${url.pathname}` });
      } catch (erro) {
        json(res, 500, { message: erro.message });
      }
    })
    .listen(PORTA, () => console.log(`Banco de mentira (evp) em http://localhost:${PORTA}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
