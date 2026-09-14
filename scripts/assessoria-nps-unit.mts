/**
 * Testes das regras do NPS da Assessoria: sem banco, sem rede, sem framework.
 *
 *   npx tsx scripts/assessoria-nps-unit.mts
 *
 * Cobre o que quebra em silêncio: pergunta condicional que deveria virar NULL,
 * obrigatória que passa vazia, período resolvido errado, NPS mal classificado,
 * nome que casa com o aluno errado, e valor do código que não existe no CHECK
 * do banco (o envio passaria no navegador e morreria no insert).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calcularNps,
  categoriaNps,
  limparTexto,
  perguntasVisiveis,
  prepararRespostas,
  secoesVisiveis,
  sequenciaDeTelas,
} from "../lib/assessoria-nps/logic";
import {
  EVENING_TIME,
  MESSAGE_VOLUME,
  MORNING_TIME,
  NEEDS_FEEDBACK,
  PERIODS,
  PREFERRED_PERIOD,
  QUESTIONS,
  SUNDAY_FREQUENCY,
  WEEKDAY_COMBINATION,
  WEEKDAY_INTEREST,
  WEEKLY_FREQUENCY,
  WHATSAPP_CONTENT,
  type Draft,
} from "../lib/assessoria-nps/survey";
import { capitalizarNome, erroNoNome, nomeCasaCom, normalizarParaBusca, separarNomeCompleto } from "../lib/assessoria-nps/nome";
import { envioSchema } from "../lib/assessoria-nps/schema";

let passou = 0;
const falhas: string[] = [];

function caso(nome: string, fn: () => void) {
  try {
    fn();
    passou++;
  } catch (e) {
    falhas.push(`✗ ${nome}\n   ${(e as Error).message.split("\n").join("\n   ")}`);
  }
}

/** Aluno que vai aos domingos e quer treino de manhã e à noite. */
function completo(): Draft {
  return {
    nps_score: 9,
    nps_reason: "  Professores atentos  ",
    overall_quality: 5,
    expectation_delivery: 4,
    teacher_followup: 4,
    teacher_understands_goals: 5,
    teacher_whatsapp_access: 4,
    teacher_support_quality: 5,
    teacher_communication_quality: 5,
    training_quality: 5,
    training_level_fit: 4,
    training_goal_alignment: 4,
    perceived_progress: 5,
    needs_more_feedback: "sometimes",
    whatsapp_group_quality: 4,
    whatsapp_connection: 4,
    whatsapp_message_volume: "high",
    whatsapp_information_clarity: 3,
    whatsapp_content_preferences: ["other", "running_tips", "running_tips"],
    whatsapp_content_other: "Playlists",
    community_climate: 5,
    community_belonging: 5,
    community_interaction: 4,
    community_one_word: "Família",
    sunday_frequency: "almost_every_sunday",
    sunday_support_quality: 5,
    sunday_value: 5,
    sunday_improvements: "",
    weekday_training_interest: "yes",
    preferred_weekday_combination: "tue_thu",
    preferred_period: "multiple",
    available_periods: ["evening", "morning"],
    preferred_morning_time: "6_to_7",
    preferred_evening_time: "19_to_20",
    expected_weekly_frequency: "twice",
    physical_structure_quality: 4,
    physical_structure_improvements: null,
    cost_benefit: 4,
    renewal_probability: 9,
    what_is_excellent: "Treino de domingo",
    what_needs_improvement: "",
    one_change: "App próprio",
  };
}

function preparar(d: Draft) {
  const r = prepararRespostas(d);
  if (!r.ok) throw new Error(`esperava ok, veio erro em ${r.erro.field}: ${r.erro.message}`);
  return r.respostas;
}

function erroEm(d: Draft): string {
  const r = prepararRespostas(d);
  if (r.ok) throw new Error("esperava erro, veio ok");
  return r.erro.field;
}

// ─── Caminho completo ───────────────────────────────────────────────────────
caso("resposta completa passa e normaliza", () => {
  const r = preparar(completo());
  assert.equal(r.nps_reason, "Professores atentos");
  assert.deepEqual(r.whatsapp_content_preferences, ["running_tips", "other"]);
  assert.equal(r.whatsapp_content_other, "Playlists");
  assert.deepEqual(r.available_periods, ["morning", "evening"]);
  assert.equal(r.sunday_improvements, null, "texto vazio vira NULL");
  assert.equal(r.what_needs_improvement, null);
});

caso("antes de responder domingo e semana, o progresso já conta 10 etapas", () => {
  assert.equal(secoesVisiveis({}).length, 10);
  const soNps: Draft = { nps_score: 8 };
  assert.ok(perguntasVisiveis(soNps).some((q) => q.id === "physical_structure_quality"));
  assert.equal(erroEm(soNps), "overall_quality", "a obrigatória seguinte continua cobrada");
});

caso("sequência completa tem identificação + 40 perguntas", () => {
  assert.equal(sequenciaDeTelas(completo()).length, 41);
  assert.equal(secoesVisiveis(completo()).length, 10);
});

// ─── Domingos ───────────────────────────────────────────────────────────────
caso("quem nunca vai ao domingo não avalia domingo nem estrutura", () => {
  const d: Draft = { ...completo(), sunday_frequency: "never" };
  const ids = perguntasVisiveis(d).map((q) => q.id);
  for (const escondida of [
    "sunday_support_quality",
    "sunday_value",
    "sunday_improvements",
    "physical_structure_quality",
    "physical_structure_improvements",
  ]) {
    assert.ok(!ids.includes(escondida as never), `${escondida} deveria estar escondida`);
  }
  assert.ok(!secoesVisiveis(d).some((s) => s.id === "estrutura"), "seção Estrutura some");
  const r = preparar(d);
  assert.equal(r.sunday_support_quality, null, "valor antigo do rascunho vira NULL");
  assert.equal(r.sunday_value, null);
  assert.equal(r.physical_structure_quality, null);
});

caso("quem vai ao domingo precisa avaliar o suporte", () => {
  assert.equal(erroEm({ ...completo(), sunday_support_quality: null }), "sunday_support_quality");
  assert.equal(erroEm({ ...completo(), physical_structure_quality: undefined }), "physical_structure_quality");
});

// ─── Semana ─────────────────────────────────────────────────────────────────
caso("sem interesse na semana: nada de dia, período ou horário", () => {
  const d: Draft = { ...completo(), weekday_training_interest: "no" };
  const r = preparar(d);
  assert.equal(r.preferred_weekday_combination, null);
  assert.equal(r.preferred_period, null);
  assert.equal(r.available_periods, null);
  assert.equal(r.preferred_morning_time, null);
  assert.equal(r.preferred_evening_time, null);
  assert.equal(r.expected_weekly_frequency, null);
  assert.ok(secoesVisiveis(d).some((s) => s.id === "semana"), "a pergunta de interesse continua");
});

caso("'talvez' abre as perguntas de dia e horário", () => {
  const d: Draft = { ...completo(), weekday_training_interest: "maybe" };
  assert.ok(perguntasVisiveis(d).some((q) => q.id === "preferred_period"));
});

caso("manhã: pede horário da manhã e descarta o da noite", () => {
  const d: Draft = { ...completo(), preferred_period: "morning" };
  const r = preparar(d);
  assert.deepEqual(r.available_periods, ["morning"]);
  assert.equal(r.preferred_morning_time, "6_to_7");
  assert.equal(r.preferred_evening_time, null, "horário da noite do rascunho vira NULL");
  assert.equal(erroEm({ ...d, preferred_morning_time: null }), "preferred_morning_time");
});

caso("noite: pede só o horário da noite", () => {
  const d: Draft = { ...completo(), preferred_period: "evening", preferred_morning_time: null };
  const r = preparar(d);
  assert.deepEqual(r.available_periods, ["evening"]);
  assert.equal(r.preferred_morning_time, null);
  assert.equal(r.preferred_evening_time, "19_to_20");
});

caso("tarde: nenhum horário perguntado", () => {
  const d: Draft = { ...completo(), preferred_period: "afternoon", preferred_morning_time: null, preferred_evening_time: null };
  const ids = perguntasVisiveis(d).map((q) => q.id);
  assert.ok(!ids.includes("preferred_morning_time") && !ids.includes("preferred_evening_time"));
  assert.deepEqual(preparar(d).available_periods, ["afternoon"]);
});

caso("mais de um período exige ao menos dois marcados", () => {
  assert.equal(erroEm({ ...completo(), available_periods: ["morning"] }), "available_periods");
  assert.equal(erroEm({ ...completo(), available_periods: [] }), "available_periods");
});

caso("tarde + noite pergunta só o horário da noite", () => {
  const d: Draft = { ...completo(), available_periods: ["afternoon", "evening"] };
  const r = preparar(d);
  assert.deepEqual(r.available_periods, ["afternoon", "evening"]);
  assert.equal(r.preferred_morning_time, null);
});

caso("'Outro' nos dias guarda o texto; trocar de alternativa descarta", () => {
  const outro = preparar({ ...completo(), preferred_weekday_combination: "other", preferred_weekday_other: " quarta e sexta " });
  assert.equal(outro.preferred_weekday_other, "quarta e sexta");
  const trocou = preparar({ ...completo(), preferred_weekday_combination: "mon_wed", preferred_weekday_other: "quarta e sexta" });
  assert.equal(trocou.preferred_weekday_other, null);
});

// ─── WhatsApp ───────────────────────────────────────────────────────────────
caso("múltipla escolha exige ao menos uma e descarta 'Outro' desmarcado", () => {
  assert.equal(erroEm({ ...completo(), whatsapp_content_preferences: [] }), "whatsapp_content_preferences");
  const r = preparar({ ...completo(), whatsapp_content_preferences: ["race_info"] });
  assert.equal(r.whatsapp_content_other, null);
});

// ─── Obrigatórias e valores inválidos ───────────────────────────────────────
caso("NPS é obrigatório; motivo é opcional", () => {
  assert.equal(erroEm({ ...completo(), nps_score: null }), "nps_score");
  assert.equal(preparar({ ...completo(), nps_reason: "" }).nps_reason, null);
});

caso("valor fora da lista ou da faixa é recusado", () => {
  assert.equal(erroEm({ ...completo(), overall_quality: 6 }), "overall_quality");
  assert.equal(erroEm({ ...completo(), renewal_probability: 4.5 }), "renewal_probability");
  assert.equal(erroEm({ ...completo(), needs_more_feedback: "talvez" as never }), "needs_more_feedback");
});

caso("texto acima do limite é recusado", () => {
  assert.equal(erroEm({ ...completo(), community_one_word: "x".repeat(41) }), "community_one_word");
});

caso("limparTexto tira controle, mantém quebra de linha", () => {
  assert.equal(limparTexto("  a b\r\n\n\n\nc  "), "ab\n\nc");
  assert.equal(limparTexto("   "), null);
});

// ─── NPS ────────────────────────────────────────────────────────────────────
caso("categoria: 0-6 detrator, 7-8 neutro, 9-10 promotor", () => {
  for (let n = 0; n <= 6; n++) assert.equal(categoriaNps(n), "detractor");
  assert.equal(categoriaNps(7), "passive");
  assert.equal(categoriaNps(8), "passive");
  assert.equal(categoriaNps(9), "promoter");
  assert.equal(categoriaNps(10), "promoter");
});

caso("NPS consolidado = % promotores − % detratores", () => {
  assert.deepEqual(calcularNps([10, 9, 8, 7, 6, 0]), { total: 6, promoters: 2, passives: 2, detractors: 2, nps: 0 });
  assert.equal(calcularNps([10, 10, 6]).nps, 33.3);
  assert.equal(calcularNps([3, 4]).nps, -100);
  assert.equal(calcularNps([]).nps, null);
});

// ─── Nomes ──────────────────────────────────────────────────────────────────
caso("caixa do nome", () => {
  assert.equal(capitalizarNome("  joão   da silva "), "João da Silva");
  assert.equal(capitalizarNome("MARIA-CLARA D'ÁVILA"), "Maria-Clara D'Ávila");
  assert.equal(capitalizarNome("McArthur"), "McArthur", "caixa mista é escolha da pessoa");
});

caso("validação do nome", () => {
  assert.equal(erroNoNome("", "first_name"), "Informe seu nome.");
  assert.equal(erroNoNome("   ", "last_name"), "Informe seu sobrenome.");
  assert.match(erroNoNome("A", "first_name") ?? "", /completo/);
  assert.match(erroNoNome("Jo4o", "first_name") ?? "", /letras/);
  assert.equal(erroNoNome("Ana", "first_name"), null);
  assert.equal(erroNoNome("de Souza Lima", "last_name"), null);
});

caso("casamento de nome com o cadastro da gestão", () => {
  assert.ok(nomeCasaCom("Ana Souza", "ANA PAULA DE SOUZA LIMA"));
  assert.ok(nomeCasaCom("Joao Silva", "JOÃO DA SILVA"));
  assert.ok(!nomeCasaCom("Ana Lima Costa", "ANA PAULA DE SOUZA LIMA"), "sobrenome que não existe no cadastro");
  assert.ok(!nomeCasaCom("Paula Souza", "ANA PAULA DE SOUZA"), "primeiro nome precisa bater");
  assert.ok(!nomeCasaCom("Ana", "ANA SOUZA"), "só o primeiro nome não identifica");
  assert.equal(normalizarParaBusca("José  dos Santos"), "jose santos");
  assert.deepEqual(separarNomeCompleto("MARIA DE LOURDES  COSTA"), { first: "Maria", last: "de Lourdes Costa" });
});

// ─── Payload ────────────────────────────────────────────────────────────────
function payload(extra: Record<string, unknown> = {}) {
  return {
    campaign: "assessoria-nps-2026-09",
    survey_version: "assessoria_nps_v1",
    submission_id: "3f1c8a2e-4b7d-4e2a-9c1f-0d5b6a7e8f90",
    first_name: "Ana",
    last_name: "Souza",
    answers: completo(),
    elapsed_ms: 240000,
    ...extra,
  };
}

caso("schema aceita envio bem formado e recusa o malformado", () => {
  assert.ok(envioSchema.safeParse(payload()).success);
  assert.ok(!envioSchema.safeParse(payload({ submission_id: "123" })).success);
  assert.ok(!envioSchema.safeParse(payload({ campaign: "Com Espaço" })).success);
  assert.ok(!envioSchema.safeParse(payload({ answers: { ...completo(), nps_score: 11 } })).success);
  assert.ok(!envioSchema.safeParse(payload({ answers: { ...completo(), sunday_frequency: "sempre" } })).success);
  assert.ok(!envioSchema.safeParse(payload({ elapsed_ms: -1 })).success);
});

// ─── Código x banco ─────────────────────────────────────────────────────────
caso("todo valor do código existe no CHECK da migration", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20260914120000_assessoria_nps.sql", import.meta.url), "utf8");
  const listas = {
    NEEDS_FEEDBACK,
    MESSAGE_VOLUME,
    WHATSAPP_CONTENT,
    SUNDAY_FREQUENCY,
    WEEKDAY_INTEREST,
    WEEKDAY_COMBINATION,
    PREFERRED_PERIOD,
    PERIODS,
    MORNING_TIME,
    EVENING_TIME,
    WEEKLY_FREQUENCY,
  };
  for (const [nome, valores] of Object.entries(listas)) {
    for (const v of valores) assert.ok(sql.includes(`'${v}'`), `${nome}: '${v}' não aparece na migration`);
  }
  for (const q of QUESTIONS) {
    assert.ok(new RegExp(`\\n\\s+${q.id} `).test(sql), `coluna ${q.id} não existe na migration`);
  }
});

// ─── Resultado ──────────────────────────────────────────────────────────────
if (falhas.length) {
  console.error(falhas.join("\n\n"));
  console.error(`\n${passou} passaram, ${falhas.length} falharam.`);
  process.exit(1);
}
console.log(`✓ ${passou} casos passaram.`);
