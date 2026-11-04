// Gera o retrato agregado da comunidade usado em /institucional/painel.
//
// Só LÊ o Supabase (service role do .env.local) e grava um JSON com contagens
// agregadas. Nenhum CPF, nome, e-mail ou telefone sai daqui: o arquivo gerado
// vai para o repositório público e para o navegador de quem abre o painel.
//
// Uso (da raiz do projeto):
//   node scripts/institucional/gerar-snapshot.mjs
//
// Saída: app/institucional/_data/comunidade.snapshot.json
// As definições de cada métrica estão em app/institucional/README.md.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const SAIDA = path.join(RAIZ, "app/institucional/_data/comunidade.snapshot.json");

// Abaixo disso a contagem vira null ("menos de N") para não expor grupos pequenos.
const MIN_CELULA = 5;
// Retenção e coortes só entram com pelo menos tantas pessoas elegíveis.
const MIN_ELEGIVEIS = 30;

function lerEnv() {
  const arq = path.join(RAIZ, ".env.local");
  const linhas = fs.readFileSync(arq, "utf8").split("\n");
  const env = {};
  for (const l of linhas) {
    if (!l.includes("=") || l.trim().startsWith("#")) continue;
    const i = l.indexOf("=");
    env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
  return env;
}

const env = lerEnv();
const sb = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function todas(tabela, colunas) {
  let out = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await sb.from(tabela).select(colunas).range(de, de + 999);
    if (error) throw new Error(`${tabela}: ${error.message}`);
    out = out.concat(data);
    if (data.length < 1000) break;
  }
  return out;
}

const DIA = 86_400_000;
const hojeBrt = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
const dataMs = (d) => Date.parse(`${d}T12:00:00Z`);
const cpfDigitos = (c) => {
  const d = String(c ?? "").replace(/\D/g, "");
  return d.length === 11 ? d : null;
};
const normSexo = (s) => {
  const v = String(s ?? "").trim().toLowerCase();
  if (v === "feminino" || v === "f") return "F";
  if (v === "masculino" || v === "m") return "M";
  return null;
};
function limparTitulo(t) {
  return String(t ?? "")
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
function nascimento(v) {
  if (!v) return null;
  let a, m, d;
  let x = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (x) [a, m, d] = [x[1], x[2], x[3]];
  else if ((x = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v))) [d, m, a] = [x[1], x[2], x[3]];
  else return null;
  const ms = Date.parse(`${a}-${m}-${d}T12:00:00Z`);
  if (Number.isNaN(ms) || Number(m) > 12 || Number(d) > 31) return null;
  return ms;
}

console.log("Lendo eventos, check-ins e cadastros…");
const [eventos, checkins, cadastros] = await Promise.all([
  todas("eventos", "id,titulo,data_evento,tipo"),
  todas("checkins", "cpf,sexo,evento_id,data_do_evento,transferido_para_id"),
  todas("cadastro_site", "cpf_digits,data_nascimento,sexo"),
]);

// Eventos que já aconteceram (o corte é o último evento até hoje).
const evPorId = new Map();
for (const e of eventos) {
  if (!e.data_evento || e.data_evento >= hojeBrt) continue;
  evPorId.set(e.id, e);
}

const qualidade = {
  registrosBrutos: checkins.length,
  semEventoRealizado: 0,
  semCpfValido: 0,
  transferidos: 0,
  duplicados: 0,
  validos: 0,
};

// Pessoa → eventos (dedupe evento+CPF) e sexo declarado.
const pessoas = new Map(); // cpf -> { eventos:Set, sexo }
const vistos = new Set();
for (const r of checkins) {
  if (!evPorId.has(r.evento_id)) {
    qualidade.semEventoRealizado++;
    continue;
  }
  if (r.transferido_para_id) {
    qualidade.transferidos++;
    continue;
  }
  const cpf = cpfDigitos(r.cpf);
  if (!cpf) {
    qualidade.semCpfValido++;
    continue;
  }
  const chave = `${r.evento_id}|${cpf}`;
  if (vistos.has(chave)) {
    qualidade.duplicados++;
    continue;
  }
  vistos.add(chave);
  qualidade.validos++;
  let p = pessoas.get(cpf);
  if (!p) pessoas.set(cpf, (p = { eventos: new Set(), sexo: null }));
  p.eventos.add(r.evento_id);
  const s = normSexo(r.sexo);
  if (s) p.sexo = s;
}

// Complementa sexo e idade com o cadastro do site.
const cad = new Map();
for (const c of cadastros) if (c.cpf_digits) cad.set(c.cpf_digits, c);

// Eventos em ordem cronológica, com índice e categoria.
const listaEventos = [...evPorId.values()]
  .filter((e) => [...pessoas.values()].some((p) => p.eventos.has(e.id)))
  .sort((a, b) => (a.data_evento < b.data_evento ? -1 : a.data_evento > b.data_evento ? 1 : 0));
const corte = listaEventos.at(-1).data_evento;
const corteMs = dataMs(corte);
const inicio = listaEventos[0].data_evento;
const idx = new Map(listaEventos.map((e, i) => [e.id, i]));
const categoria = (e) => {
  const sabado = new Date(dataMs(e.data_evento)).getUTCDay() === 6;
  return sabado && e.tipo === "corrida" ? "sabado" : "especial";
};

// Linha do tempo de cada pessoa (índices de eventos em ordem).
const P = [];
for (const [cpf, p] of pessoas) {
  const evs = [...p.eventos].map((id) => idx.get(id)).sort((a, b) => a - b);
  const c = cad.get(cpf);
  const sexo = p.sexo ?? normSexo(c?.sexo);
  const nasc = nascimento(c?.data_nascimento);
  let idade = null;
  if (nasc) {
    const anos = Math.floor((corteMs - nasc) / (365.2425 * DIA));
    if (anos >= 10 && anos <= 95) idade = anos;
  }
  P.push({ evs, sexo, idade });
}

const faixaIdade = (i) =>
  i == null ? null : i < 18 ? "até 17" : i < 25 ? "18–24" : i < 35 ? "25–34" : i < 45 ? "35–44" : i < 55 ? "45–54" : "55+";
const FAIXAS = ["até 17", "18–24", "25–34", "35–44", "45–54", "55+"];
const FREQ = [
  { rotulo: "1", min: 1, max: 1 },
  { rotulo: "2", min: 2, max: 2 },
  { rotulo: "3", min: 3, max: 3 },
  { rotulo: "4–5", min: 4, max: 5 },
  { rotulo: "6–9", min: 6, max: 9 },
  { rotulo: "10+", min: 10, max: Infinity },
];
const suprimir = (n) => (n < MIN_CELULA ? null : n);
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);

const filtroSexo = { todos: () => true, F: (p) => p.sexo === "F", M: (p) => p.sexo === "M" };
const filtroTipo = {
  todos: () => true,
  sabado: (i) => categoria(listaEventos[i]) === "sabado",
  especial: (i) => categoria(listaEventos[i]) === "especial",
};
const JANELAS = { "30d": 30, "90d": 90, "180d": 180, tudo: null };

function resumo(janelaDias, sexoK, tipoK) {
  const desde = janelaDias == null ? -Infinity : corteMs - (janelaDias - 1) * DIA;
  const naJanela = (i) => dataMs(listaEventos[i].data_evento) >= desde && filtroTipo[tipoK](i);
  const evsJanela = listaEventos.map((_, i) => i).filter(naJanela);
  let participacoes = 0;
  let pessoasN = 0;
  let estreantes = 0;
  let recorrentes = 0;
  const freq = FREQ.map(() => 0);
  const sexo = { F: 0, M: 0, nd: 0 };
  const idades = Object.fromEntries(FAIXAS.map((f) => [f, 0]));
  let semIdade = 0;
  for (const p of P) {
    if (!filtroSexo[sexoK](p)) continue;
    const meus = p.evs.filter(naJanela);
    if (!meus.length) continue;
    pessoasN++;
    participacoes += meus.length;
    // Estreante: a primeira participação registrada da pessoa caiu neste recorte.
    if (naJanela(p.evs[0])) estreantes++;
    if (meus.length >= 2) recorrentes++;
    freq[FREQ.findIndex((f) => meus.length >= f.min && meus.length <= f.max)]++;
    sexo[p.sexo ?? "nd"]++;
    const fx = faixaIdade(p.idade);
    if (fx) idades[fx]++;
    else semIdade++;
  }
  return {
    eventos: evsJanela.length,
    participacoes,
    pessoas: pessoasN,
    mediaPorEvento: evsJanela.length ? Math.round(participacoes / evsJanela.length) : 0,
    estreantes,
    recorrentes,
    umaVez: pessoasN - recorrentes,
    taxaRecorrencia: pct(recorrentes, pessoasN),
    mediaEventosPorPessoa: pessoasN ? Math.round((participacoes / pessoasN) * 100) / 100 : 0,
    frequencia: FREQ.map((f, i) => ({ rotulo: f.rotulo, pessoas: freq[i] })),
    sexo: { F: suprimir(sexo.F), M: suprimir(sexo.M), naoInformado: suprimir(sexo.nd) },
    idade: {
      faixas: FAIXAS.map((f) => ({ faixa: f, pessoas: suprimir(idades[f]) })),
      semDado: semIdade,
    },
  };
}

const resumos = {};
for (const [jk, jd] of Object.entries(JANELAS))
  for (const sk of Object.keys(filtroSexo))
    for (const tk of Object.keys(filtroTipo)) resumos[`${jk}|${sk}|${tk}`] = resumo(jd, sk, tk);

// Por evento (aditivo: dá para somar num intervalo personalizado).
const porEvento = listaEventos.map((e, i) => {
  const out = { participacoes: 0, estreantes: 0, recorrentes: 0, voltaram: 0, F: 0, M: 0 };
  const porSexo = { F: { participacoes: 0, estreantes: 0 }, M: { participacoes: 0, estreantes: 0 } };
  for (const p of P) {
    if (!p.evs.includes(i)) continue;
    out.participacoes++;
    const estreia = p.evs[0] === i;
    if (estreia) out.estreantes++;
    else out.recorrentes++;
    if (p.evs.some((j) => j > i)) out.voltaram++;
    if (p.sexo) {
      out[p.sexo]++;
      porSexo[p.sexo].participacoes++;
      if (estreia) porSexo[p.sexo].estreantes++;
    }
  }
  const posteriores = listaEventos.length - 1 - i;
  return {
    id: e.id.slice(0, 8),
    titulo: limparTitulo(e.titulo),
    data: e.data_evento,
    categoria: categoria(e),
    participacoes: out.participacoes,
    estreantes: out.estreantes,
    recorrentes: out.recorrentes,
    porSexo,
    // Só faz sentido quando houve eventos depois deste.
    voltaramDepois: posteriores > 0 ? pct(out.voltaram, out.participacoes) : null,
    eventosDepois: posteriores,
  };
});

// Retenção N dias: dos que estrearam até (corte − N), quantos voltaram em até N dias.
function retencao(dias, sexoK) {
  let eleg = 0;
  let volt = 0;
  for (const p of P) {
    if (!filtroSexo[sexoK](p)) continue;
    const t0 = dataMs(listaEventos[p.evs[0]].data_evento);
    if (t0 > corteMs - dias * DIA) continue;
    eleg++;
    if (p.evs.slice(1).some((j) => dataMs(listaEventos[j].data_evento) - t0 <= dias * DIA)) volt++;
  }
  return { dias, elegiveis: eleg, taxa: eleg >= MIN_ELEGIVEIS ? pct(volt, eleg) : null };
}

// Coortes mensais pela estreia: % da coorte presente em cada mês seguinte.
const mesDe = (i) => listaEventos[i].data_evento.slice(0, 7);
const meses = [...new Set(listaEventos.map((_, i) => mesDe(i)))].sort();
function coortes(sexoK) {
  return meses.map((m, mi) => {
    const membros = P.filter((p) => filtroSexo[sexoK](p) && mesDe(p.evs[0]) === m);
    const n = membros.length;
    const celulas = meses.slice(mi).map((m2, k) => {
      if (k === 0) return 100;
      const ativos = membros.filter((p) => p.evs.some((j) => mesDe(j) === m2)).length;
      return n >= MIN_ELEGIVEIS ? pct(ativos, n) : null;
    });
    return { mes: m, pessoas: n, celulas };
  });
}

// Tendência mensal: participações, pessoas e estreantes por mês.
function tendencia(sexoK) {
  return meses.map((m) => {
    let part = 0;
    let pes = 0;
    let est = 0;
    for (const p of P) {
      if (!filtroSexo[sexoK](p)) continue;
      const n = p.evs.filter((j) => mesDe(j) === m).length;
      if (!n) continue;
      part += n;
      pes++;
      if (mesDe(p.evs[0]) === m) est++;
    }
    return { mes: m, participacoes: part, pessoas: pes, estreantes: est };
  });
}

const porSexo = {};
for (const sk of Object.keys(filtroSexo))
  porSexo[sk] = {
    retencao: [30, 90, 180].map((d) => retencao(d, sk)),
    coortes: coortes(sk),
    tendencia: tendencia(sk),
  };

// Encontros de sábado: faixa típica de confirmações (para o slide do ecossistema).
const sabados = porEvento.filter((e) => e.categoria === "sabado").map((e) => e.participacoes).sort((a, b) => a - b);
const quantil = (arr, q) => arr[Math.min(arr.length - 1, Math.max(0, Math.round(q * (arr.length - 1))))];

const snapshot = {
  fonte: "real",
  geradoEm: new Date().toISOString(),
  historico: { inicio, corte },
  base: {
    cadastros: cadastros.length,
    // União de quem se cadastrou no site com quem confirmou presença em algum
    // evento (há CPFs com check-in que nunca passaram pelo cadastro).
    pessoasNaBase: new Set([...cad.keys(), ...pessoas.keys()]).size + cadastros.filter((c) => !c.cpf_digits).length,
    pessoasComParticipacao: P.length,
    participantesForaDoCadastro: [...pessoas.keys()].filter((c) => !cad.has(c)).length,
  },
  sabados: {
    eventos: sabados.length,
    mediana: quantil(sabados, 0.5),
    p25: quantil(sabados, 0.25),
    p75: quantil(sabados, 0.75),
    maximo: sabados.at(-1),
  },
  qualidade,
  privacidade: { minimoCelula: MIN_CELULA, minimoElegiveis: MIN_ELEGIVEIS },
  eventos: porEvento,
  resumos,
  porSexo,
};

fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
fs.writeFileSync(SAIDA, JSON.stringify(snapshot, null, 1) + "\n");
const r = resumos["tudo|todos|todos"];
console.log(
  `OK ${SAIDA}\n  histórico ${inicio} → ${corte} · ${porEvento.length} eventos · ${r.pessoas} pessoas · ${r.participacoes} participações`,
);
console.log("  qualidade", qualidade);
console.log("  sábados", snapshot.sabados);
console.log("  retenção", porSexo.todos.retencao);
