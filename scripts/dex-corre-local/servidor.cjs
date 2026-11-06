/**
 * Banco de mentira para ver e testar o Vem Correr Comigo sem tocar em produção.
 *
 * Postgres (PGlite) com a migration de verdade, atrás de um pedaço da API do
 * Supabase: RPC, leitura de eventos e Storage. Dados e fotos ficam em disco
 * (`.dados` / `.arquivos`) para o perfil sobreviver a sair/entrar e reinícios.
 *
 *   npm i --no-save @electric-sql/pglite
 *   node scripts/dex-corre-local/servidor.cjs
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const PORTA = Number(process.env.PORTA || 54399);
const SLUG = "dexcomplica-love-run";
const PASTA = __dirname;
const DIR_DADOS = process.env.DEX_CORRE_DADOS || path.join(PASTA, ".dados");
const DIR_ARQUIVOS = process.env.DEX_CORRE_ARQUIVOS || path.join(PASTA, ".arquivos");

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

function garantirDir(d) { fs.mkdirSync(d, { recursive: true }); }

function salvarArquivo(chave, corpo, tipo) {
  const destino = path.join(DIR_ARQUIVOS, chave);
  garantirDir(path.dirname(destino));
  fs.writeFileSync(destino, corpo);
  fs.writeFileSync(`${destino}.tipo`, tipo || "application/octet-stream");
}

function lerArquivo(chave) {
  const destino = path.join(DIR_ARQUIVOS, chave);
  if (!fs.existsSync(destino)) return null;
  return {
    corpo: fs.readFileSync(destino),
    tipo: fs.existsSync(`${destino}.tipo`) ? fs.readFileSync(`${destino}.tipo`, "utf8") : "application/octet-stream",
  };
}

function apagarArquivo(chave) {
  const destino = path.join(DIR_ARQUIVOS, chave);
  try { fs.unlinkSync(destino); } catch { /* ok */ }
  try { fs.unlinkSync(`${destino}.tipo`); } catch { /* ok */ }
}

async function main() {
  const { PGlite } = await import(process.env.PGLITE_PATH || "@electric-sql/pglite");
  garantirDir(DIR_DADOS);
  garantirDir(DIR_ARQUIVOS);
  const db = new PGlite(DIR_DADOS);
  const raiz = path.resolve(__dirname, "../..");

  const temEvento = async () => {
    try {
      const { rows } = await db.query(`select id from eventos where slug = $1`, [SLUG]);
      return rows[0] || null;
    } catch {
      return null;
    }
  };

  let ev = await temEvento();
  const primeiraVez = !ev;

  if (primeiraVez) {
    await db.exec(fs.readFileSync(path.join(__dirname, "base.sql"), "utf8"));
    const { rows: [criado] } = await db.query(
      `insert into eventos (titulo, slug, data_evento, checkin_status, pelotoes, capacidade) values ('Dexcomplica Love Run', $1, '2026-11-07', 'bloqueado', '{4km,6km,8km}', 700) returning id`,
      [SLUG]
    );
    ev = criado;
  }

  const pasta = path.join(raiz, "supabase/migrations");
  for (const f of fs.readdirSync(pasta).filter((n) => n.includes("_dex_corre_")).sort()) {
    await db.exec(fs.readFileSync(path.join(pasta, f), "utf8"));
  }
  ev = (await temEvento()) || ev;

  const inscritos = [];
  const { rows: existentes } = await db.query(
    `select ep.id as participacao, ep.pessoa_id as pessoa, ep.cpf, ep.nome_completo as nome, ep.pelotao, c.sexo
     from evento_participantes ep
     left join cadastro_site c on c.id = ep.pessoa_id
     where ep.evento_id = $1 and ep.ticket_code like 'DLR-TESTE%'
     order by ep.ticket_code`,
    [ev.id]
  );

  if (existentes.length) {
    for (const r of existentes) {
      inscritos.push({
        nome: r.nome, sexo: r.sexo, pelotao: r.pelotao, cpf: r.cpf,
        participacao: r.participacao, pessoa: Number(r.pessoa),
      });
    }
  } else {
    for (let i = 0; i < NOMES.length; i++) {
      const [nome, sexo, pelotao] = NOMES[i];
      const cpf = gerarCpf(i + 1);
      const email = `${nome.split(" ")[0].toLowerCase()}@exemplo.test`;
      const { rows: [c] } = await db.query(`insert into cadastro_site (cpf, nome_completo, email, sexo) values ($1,$2,$3,$4) returning id`, [cpf, nome, email, sexo]);
      const { rows: [p] } = await db.query(
        `insert into evento_participantes (evento_id, pessoa_id, cpf, nome_completo, email, pelotao, ticket_code) values ($1,$2,$3,$4,$5,$6,$7) returning id`,
        [ev.id, c.id, cpf, nome, email, pelotao, `DLR-TESTE${i}`]
      );
      inscritos.push({ nome, sexo, pelotao, cpf, participacao: p.id, pessoa: Number(c.id) });
    }
  }

  const rpc = async (fn, a) => {
    const nomes = Object.keys(a);
    const { rows } = await db.query(
      `select public.${fn}(${nomes.map((n, i) => `${n} => $${i + 1}`).join(", ")}) as r`,
      nomes.map((n) => a[n])
    );
    return rows[0].r;
  };
  const perfil = (i, preferencia, extra = {}) => rpc("dex_corre_salvar_perfil", {
    p_slug: SLUG, p_participacao: inscritos[i].participacao, p_pessoa: inscritos[i].pessoa,
    p_dados: JSON.stringify({ preferencia, termos: true, ...extra }),
  });
  const quer = (i, alvo) => rpc("dex_corre_interesse", {
    p_slug: SLUG, p_participacao: inscritos[i].participacao, p_pessoa: inscritos[i].pessoa,
    p_alvo_perfil: alvo, p_alvo_grupo: null,
  });
  const codigo = async (i) =>
    (await db.query(`select codigo from dex_corre_perfis where participacao_id = $1`, [inscritos[i].participacao])).rows[0].codigo;

  const jpegFake = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z",
    "base64"
  );
  const fotoPara = async (i) => {
    const part = inscritos[i].participacao;
    const caminho = `${part}/seed.jpg`;
    salvarArquivo(`dex-corre-fotos/${caminho}`, jpegFake, "image/jpeg");
    await db.query(
      `update dex_corre_perfis set foto_path = $1, foto_versao = greatest(foto_versao, 1) where participacao_id = $2 and ativo`,
      [caminho, part]
    );
  };

  // Insiders de teste (CPFs válidos). Quem não está na lista do evento entra por aqui.
  const { rows: [{ n: nIns }] } = await db.query(`select count(*)::int n from dados_insiders`);
  if (nIns === 0) {
    await db.query(
      `insert into dados_insiders (nome, cpf, email, sexo, ativo) values
        ('Insider Teste', '39053344705', 'insider@exemplo.test', 'feminino', true),
        ('Insider Dois', '15360946070', 'insider2@exemplo.test', 'masculino', true)`
    );
    console.log("insiders locais: 390.533.447-05 e 153.609.460-70");
  }

  const { rows: [{ n: nPerfis }] } = await db.query(
    `select count(*)::int n from dex_corre_perfis where evento_id = $1 and ativo`,
    [ev.id]
  );

  if (!process.env.SEM_SEMENTE && nPerfis === 0) {
    await perfil(1, 4, { instagram: "pedro.teste" });
    await perfil(2, 3, { instagram: "camila.teste", whatsapp: "61999990002", whatsapp_publico: true });
    await perfil(3, 2);
    await perfil(10, 4);
    await perfil(11, 4);
    await perfil(4, 4, { instagram: "julia.teste" });
    await perfil(5, 4, { instagram: "lucas.teste" });
    await perfil(6, 4, { instagram: "fernanda.teste" });
    await perfil(7, 4, { instagram: "bruno.teste" });
    await perfil(8, 4); await perfil(9, 2);
    for (const i of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) await fotoPara(i);
    await quer(10, await codigo(11));
    await quer(5, await codigo(4));
    const g = (await db.query(
      `select g.codigo from dex_corre_grupos g
       join dex_corre_membros m on m.grupo_id=g.id
       join dex_corre_perfis p on p.id=m.perfil_id
       where p.participacao_id=$1`,
      [inscritos[4].participacao]
    )).rows[0].codigo;
    await rpc("dex_corre_interesse", {
      p_slug: SLUG, p_participacao: inscritos[6].participacao, p_pessoa: inscritos[6].pessoa,
      p_alvo_perfil: null, p_alvo_grupo: g,
    });
    await rpc("dex_corre_interesse", {
      p_slug: SLUG, p_participacao: inscritos[7].participacao, p_pessoa: inscritos[7].pessoa,
      p_alvo_perfil: null, p_alvo_grupo: g,
    });

    try {
      const recado = (i, d) => rpc("dex_corre_correio_publicar", {
        p_slug: SLUG, p_participacao: inscritos[i].participacao, p_pessoa: inscritos[i].pessoa,
        p_dados: JSON.stringify(d),
      });
      await recado(2, {
        para: "Moço do pelotão de 4 km",
        mensagem: "Você correu do meu lado no último treino e agora meu coração não baixa a frequência.",
        identificado: true, mostrar_instagram: true,
      });
      await recado(5, { para: "Julia", mensagem: "Se o corre terminar no Oscarito, a primeira água é por minha conta.", identificado: false });
    } catch (e) {
      console.warn("[banco local] correio semente:", e.message);
    }
  }

  const tipos = new Map();
  const assinatura = async (fn) => {
    if (!tipos.has(fn)) {
      const { rows } = await db.query(
        `select unnest(proargnames) as nome, unnest(string_to_array(oidvectortypes(proargtypes), ', ')) as tipo from pg_proc where proname = $1`,
        [fn]
      );
      tipos.set(fn, Object.fromEntries(rows.map((r) => [r.nome, r.tipo])));
    }
    return tipos.get(fn);
  };

  let fila = Promise.resolve();
  const emFila = (f) => (fila = fila.then(f, f));

  const servidor = http.createServer(async (req, res) => {
    const pedacos = []; for await (const c of req) pedacos.push(c);
    const corpo = Buffer.concat(pedacos);
    const url = new URL(req.url, "http://x");
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("access-control-allow-headers", "*");
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    const json = (s, v, h = {}) => {
      res.writeHead(s, { "content-type": "application/json", ...h });
      res.end(v === undefined ? "" : JSON.stringify(v));
    };
    try {
      if (url.pathname === "/inscritos") {
        return json(200, inscritos.map(({ nome, cpf, pelotao, sexo }) => ({ nome, cpf, pelotao, sexo })));
      }
      if (url.pathname === "/sql" && req.method === "POST") {
        const { q, p } = JSON.parse(corpo.toString());
        return json(200, await emFila(() => db.query(q, p || []).then((r) => r.rows)));
      }
      const m = url.pathname.match(/^\/rest\/v1\/rpc\/(\w+)$/);
      if (m) {
        const fn = m[1];
        const args = corpo.length ? JSON.parse(corpo.toString()) : {};
        if (fn === "dex_corre_entrar" && !process.env.SEM_VISITANTE) {
          await emFila(async () => {
            const cpf = String(args.p_cpf || "").replace(/\D/g, "");
            const { rows } = await db.query(
              `select 1 from evento_participantes where regexp_replace(coalesce(cpf,''), '\\D', '', 'g') = $1`,
              [cpf]
            );
            if (rows.length) return;
            // Insider: a própria função dex_corre_entrar provisiona a vaga.
            const { rows: ins } = await db.query(
              `select 1 from dados_insiders where ativo and regexp_replace(coalesce(cpf,''), '\\D', '', 'g') = $1`,
              [cpf]
            );
            if (ins.length) return;
            const { rows: [c] } = await db.query(
              `insert into cadastro_site (cpf, nome_completo, email, sexo) values ($1, 'Visitante Local', 'visitante@exemplo.test', 'masculino') returning id`,
              [cpf]
            );
            await db.query(
              `insert into evento_participantes (evento_id, pessoa_id, cpf, nome_completo, email, pelotao, ticket_code)
               values ($1,$2,$3,'Visitante Local','visitante@exemplo.test','4km','DLR-VISITA')`,
              [ev.id, c.id, cpf]
            );
          });
        }
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
        if (req.method === "HEAD" || t[1] === "evento_participantes") {
          return json(200, [], { "content-range": `0-0/${inscritos.length}` });
        }
        return json(200, []);
      }
      const s = url.pathname.match(/^\/storage\/v1\/object\/(?:authenticated\/)?([^/]+)\/(.+)$/);
      if (s) {
        const chave = `${s[1]}/${decodeURIComponent(s[2])}`;
        if (req.method === "POST" || req.method === "PUT") {
          salvarArquivo(chave, corpo, req.headers["content-type"] || "application/octet-stream");
          return json(200, { Key: chave });
        }
        const a = lerArquivo(chave);
        if (!a) return json(404, { message: "not found" });
        res.writeHead(200, { "content-type": a.tipo });
        return res.end(a.corpo);
      }
      const d = url.pathname.match(/^\/storage\/v1\/object\/([^/]+)$/);
      if (d && req.method === "DELETE") {
        const body = JSON.parse(corpo.toString());
        const caminhos = Array.isArray(body) ? body : (body.prefixes || []);
        for (const p of caminhos) apagarArquivo(`${d[1]}/${p}`);
        return json(200, []);
      }
      json(404, { message: "rota não simulada" });
    } catch (e) {
      console.error("[banco local]", e.message);
      json(400, { message: e.message, code: e.code });
    }
  });

  servidor.listen(PORTA, () => {
    console.log(`banco local pronto em http://localhost:${PORTA} (${primeiraVez ? "novo" : "persistente"}: ${DIR_DADOS})`);
  });
}
main().catch((e) => { console.error(e); process.exit(1); });
