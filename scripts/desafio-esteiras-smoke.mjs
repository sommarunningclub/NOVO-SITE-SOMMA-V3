/**
 * Smoke test do Desafio das Esteiras — ponta a ponta.
 *
 *   node scripts/desafio-esteiras-smoke.mjs [baseUrl]
 *
 * Padrão: http://localhost:3000
 *
 * Os testes marcados como `precisaBanco` só passam depois de rodar
 * scripts/desafio-esteiras-migration.sql no Supabase. Os demais validam
 * validação, rate limit, honeypot e as guardas de autenticação — e passam
 * mesmo sem a tabela criada.
 *
 * Para exercitar o admin, exporte DESAFIO_ESTEIRAS_ADMIN_PASSWORD (a mesma do
 * ambiente do servidor) antes de rodar.
 */

const BASE = process.argv[2] ?? "http://localhost:3000";
const SENHA_ADMIN = process.env.DESAFIO_ESTEIRAS_ADMIN_PASSWORD ?? "";

let passou = 0;
let falhou = 0;
let pulou = 0;

function ok(nome, condicao, detalhe = "") {
  if (condicao) {
    passou++;
    console.log(`  ✓ ${nome}`);
  } else {
    falhou++;
    console.log(`  ✗ ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
  }
}

function skip(nome, motivo) {
  pulou++;
  console.log(`  – ${nome} (${motivo})`);
}

function secao(titulo) {
  console.log(`\n${titulo}`);
}

/** CPF sintético válido (dígitos verificadores calculados) para não colidir com gente real. */
function cpfValido(base9) {
  const d = String(base9).padStart(9, "0").slice(0, 9).split("").map(Number);
  const dv = (nums, pesoInicial) => {
    let soma = 0;
    nums.forEach((n, i) => (soma += n * (pesoInicial - i)));
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = dv(d, 10);
  const d2 = dv([...d, d1], 11);
  return [...d, d1, d2].join("");
}

const json = async (res) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

function novaInscricao(overrides = {}) {
  return {
    unit_id: "vicente-pires",
    full_name: "Participante De Teste",
    cpf: cpfValido(Math.floor(Math.random() * 1e9)),
    birth_date: "1995-04-12",
    email: `teste+${Date.now()}@example.com`,
    phone: "61999998888",
    sexo: "feminino",
    participacao: "competidor",
    aceite_termos: true,
    utm_source: "smoke",
    utm_medium: "script",
    utm_campaign: "teste-automatizado",
    ...overrides,
  };
}

async function main() {
  console.log(`Smoke test — ${BASE}\n${"─".repeat(60)}`);

  // ── Páginas ───────────────────────────────────────────────────────────────
  secao("Páginas");
  for (const [rota, esperado] of [
    ["/desafios-das-esteiras-evolve", 200],
    ["/desafios-das-esteiras-evolve/inscricao", 200],
    ["/desafios-das-esteiras-evolve/inscricao?unidade=vicente-pires", 200],
    ["/desafios-das-esteiras-evolve/confirmado/token-que-nao-existe-1234567890", 404],
    ["/admin/desafio-das-esteiras", 200],
    ["/admin/desafio-das-esteiras/checkin", 200],
  ]) {
    const res = await fetch(`${BASE}${rota}`, { redirect: "manual" });
    ok(`${rota} → ${esperado}`, res.status === esperado, `recebeu ${res.status}`);
  }

  const home = await fetch(`${BASE}/desafios-das-esteiras-evolve`).then((r) => r.text());
  ok("headline no HTML", home.includes("DAS ESTEIRAS"));
  ok("as 4 unidades no HTML", ["Vicente Pires", "Luziânia", "Alameda", "Samambaia"].every((u) => home.includes(u)));
  ok("dados estruturados de Event", home.includes("SportsEvent"));

  // ── Stats ─────────────────────────────────────────────────────────────────
  secao("Contadores públicos");
  const stats = await fetch(`${BASE}/api/desafio-esteiras/stats`).then(json);
  ok("stats responde com total numérico", typeof stats.total === "number");
  ok("stats traz as 4 unidades", Array.isArray(stats.unidades) && stats.unidades.length === 4);
  const bancoOk = stats.disponivel === true;
  if (!bancoOk) {
    console.log("\n  ⚠ Banco indisponível (rode scripts/desafio-esteiras-migration.sql).");
    console.log("    Os testes de inscrição/ticket/check-in serão pulados.\n");
  }

  // ── Validação ─────────────────────────────────────────────────────────────
  secao("Validação da inscrição");
  const casos = [
    ["CPF inválido", { cpf: "11111111111" }, "cpf"],
    ["nome sem sobrenome", { full_name: "Fulano" }, "full_name"],
    ["e-mail inválido", { email: "nao-e-email" }, "email"],
    ["telefone curto", { phone: "1234" }, "phone"],
    ["unidade inexistente", { unit_id: "asa-norte" }, "unit_id"],
    ["sem aceite dos termos", { aceite_termos: false }, "aceite_termos"],
    ["data de nascimento futura", { birth_date: "2030-01-01" }, "birth_date"],
    ["categoria ausente", { sexo: undefined }, "sexo"],
    ["participação ausente", { participacao: undefined }, "participacao"],
  ];
  for (const [nome, override, campo] of casos) {
    const res = await fetch(`${BASE}/api/desafio-esteiras/inscricao`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}` },
      body: JSON.stringify(novaInscricao(override)),
    });
    const body = await json(res);
    ok(`recusa ${nome}`, res.status === 400, `status ${res.status} / campo ${body.campo}`);
    if (res.status === 400 && campo) {
      ok(`  aponta o campo "${campo}"`, body.campo === campo, `apontou "${body.campo}"`);
    }
  }

  // ── Honeypot ──────────────────────────────────────────────────────────────
  secao("Anti-spam");
  const hp = await fetch(`${BASE}/api/desafio-esteiras/inscricao`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "10.9.9.9" },
    body: JSON.stringify({ ...novaInscricao(), website: "http://spam.example" }),
  });
  const hpBody = await json(hp);
  ok("honeypot responde 200 sem criar ticket", hp.status === 200 && hpBody.ticket_token === null);

  // rate limit: 5 por IP a cada 10 min
  const ipRate = "10.7.7.7";
  let bateu429 = false;
  for (let i = 0; i < 8; i++) {
    const r = await fetch(`${BASE}/api/desafio-esteiras/inscricao`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ipRate },
      body: JSON.stringify(novaInscricao({ cpf: "11111111111" })),
    });
    if (r.status === 429) {
      bateu429 = true;
      break;
    }
  }
  ok("rate limit dispara 429 por IP", bateu429);

  // ── Fluxo completo ────────────────────────────────────────────────────────
  secao("Inscrição, ticket e duplicidade");
  let ticket = null;
  if (!bancoOk) {
    skip("inscrição válida cria ticket", "sem banco");
    skip("CPF duplicado é recusado", "sem banco");
    skip("página do ticket abre", "sem banco");
    skip("QR Code é gerado", "sem banco");
    skip("arquivo .ics é gerado", "sem banco");
  } else {
    const dados = novaInscricao({ cpf: cpfValido(Date.now() % 1e9) });
    const res = await fetch(`${BASE}/api/desafio-esteiras/inscricao`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.1.1.1" },
      body: JSON.stringify(dados),
    });
    const body = await json(res);
    ok("inscrição válida cria ticket", res.status === 200 && Boolean(body.ticket_token), JSON.stringify(body));
    ok("código do ticket no formato DST-VP-XXXXXX", /^DST-VP-[2-9A-Z]{6}$/.test(body.ticket_code ?? ""), body.ticket_code);
    ticket = body;

    const dup = await fetch(`${BASE}/api/desafio-esteiras/inscricao`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.1.1.2" },
      body: JSON.stringify({ ...dados, email: `outro+${Date.now()}@example.com` }),
    });
    const dupBody = await json(dup);
    ok("CPF duplicado é recusado com 409", dup.status === 409 && dupBody.ja_inscrito === true);
    ok("duplicado devolve o ticket já existente", dupBody.ticket_token === body.ticket_token);

    const pagina = await fetch(`${BASE}/desafios-das-esteiras-evolve/confirmado/${body.ticket_token}`);
    const html = await pagina.text();
    ok("página do ticket abre", pagina.status === 200);
    ok("mostra 'VOCÊ ESTÁ'", html.includes("VOCÊ ESTÁ"));
    ok("mostra o código do ticket", html.includes(body.ticket_code));
    ok("QR Code renderizado como SVG inline", html.includes("<svg") && html.includes("shape-rendering"));
    ok("não vaza CPF na página", !html.includes(dados.cpf));

    const ics = await fetch(`${BASE}/api/desafio-esteiras/calendario/${body.ticket_token}`);
    const icsTexto = await ics.text();
    ok("arquivo .ics é gerado", ics.status === 200 && icsTexto.startsWith("BEGIN:VCALENDAR"));
    ok(".ics tem a data correta", icsTexto.includes("DTSTART:20260819T220000Z"));
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  secao("Operação e check-in");
  const semAuth = await fetch(`${BASE}/api/desafio-esteiras/admin/dashboard`);
  ok("dashboard exige sessão", semAuth.status === 401);

  const checkinSemAuth = await fetch(`${BASE}/api/desafio-esteiras/admin/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: "DST-VP-ABC123" }),
  });
  ok("check-in exige sessão", checkinSemAuth.status === 401);

  const senhaErrada = await fetch(`${BASE}/api/desafio-esteiras/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "10.4.4.4" },
    body: JSON.stringify({ senha: "senha-obviamente-errada" }),
  });
  ok("senha errada devolve 401 ou 503", [401, 503].includes(senhaErrada.status), `status ${senhaErrada.status}`);

  if (!SENHA_ADMIN) {
    skip("login do admin", "defina DESAFIO_ESTEIRAS_ADMIN_PASSWORD");
    skip("check-in valida ticket", "sem senha de admin");
    skip("segundo check-in é recusado", "sem senha de admin");
  } else {
    const login = await fetch(`${BASE}/api/desafio-esteiras/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.5.5.5" },
      body: JSON.stringify({ senha: SENHA_ADMIN }),
    });
    const cookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";
    ok("login do admin devolve cookie", login.status === 200 && cookie.startsWith("dst_op="));

    if (!bancoOk) {
      skip("dashboard responde autenticado", "sem banco");
    } else {
      const dash = await fetch(`${BASE}/api/desafio-esteiras/admin/dashboard`, { headers: { cookie } });
      const dashBody = await json(dash);
      ok("dashboard responde autenticado", dash.status === 200 && typeof dashBody.total === "number");
      ok("dashboard traz as unidades", Array.isArray(dashBody.porUnidade));
    }

    if (!ticket?.ticket_token) {
      skip("check-in valida ticket", "sem ticket criado");
      skip("segundo check-in é recusado", "sem ticket criado");
    } else {
      const busca = await fetch(
        `${BASE}/api/desafio-esteiras/admin/buscar?q=${encodeURIComponent(ticket.ticket_code)}`,
        { headers: { cookie } }
      ).then(json);
      ok("busca encontra por código do ticket", busca.resultados?.[0]?.ticket_code === ticket.ticket_code);
      ok("busca mascara o CPF", /^\d{3}\.\*{3}\.\*{3}-\d{2}$/.test(busca.resultados?.[0]?.cpf_mascarado ?? ""));

      const v1 = await fetch(`${BASE}/api/desafio-esteiras/admin/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ value: ticket.ticket_token }),
      });
      const v1Body = await json(v1);
      ok("check-in valida o ticket", v1.status === 200 && v1Body.resultado === "validado");
      ok("check-in grava o horário", Boolean(v1Body.checked_in_at));

      const v2 = await fetch(`${BASE}/api/desafio-esteiras/admin/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ value: ticket.ticket_token }),
      });
      const v2Body = await json(v2);
      ok("segundo check-in é recusado", v2.status === 409 && v2Body.resultado === "ja_utilizado");
      ok("recusa informa o horário da 1ª validação", v2Body.checked_in_at === v1Body.checked_in_at);

      const inexistente = await fetch(`${BASE}/api/desafio-esteiras/admin/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ value: "DST-VP-ZZZZZZ" }),
      });
      ok("ticket inexistente devolve 404", inexistente.status === 404);
    }
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`${passou} passaram · ${falhou} falharam · ${pulou} pulados`);
  process.exit(falhou > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("\nErro no smoke test:", e.message);
  process.exit(1);
});
