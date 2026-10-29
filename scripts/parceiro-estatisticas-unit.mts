/**
 * Testes de unidade dos números da página do parceiro.
 *
 *   npx tsx scripts/parceiro-estatisticas-unit.mts
 */
import { resumirInscricoes, rotuloPelotao, rotuloSexo } from "../lib/parceiro/estatisticas";

let ok = 0, bad = 0;
const t = (n: string, c: boolean, d: unknown = "") => { c ? (ok++, console.log("  ✓", n)) : (bad++, console.log("  ✗", n, d)); };

// 20:30Z = 17:30 em Brasília; 02:10Z do dia 30 = 23:10 do dia 29 em Brasília.
const linhas = [
  { data_hora_checkin: "2026-10-28T20:30:00Z", sexo: "feminino", pelotao: "4km" },
  { data_hora_checkin: "2026-10-28T20:45:00Z", sexo: "masculino", pelotao: "4km" },
  { data_hora_checkin: "2026-10-28T21:05:00Z", sexo: "F", pelotao: "8km" },
  { data_hora_checkin: "2026-10-30T02:10:00Z", sexo: null, pelotao: "" },
  { data_hora_checkin: "2026-10-30T13:00:00Z", sexo: "M", pelotao: "Alfa" },
];
const r = resumirInscricoes(linhas, ["4km", "6km", "8km"]);

console.log("Ritmo");
t("dias em Brasília, com dia vazio preenchido", JSON.stringify(r.porDia) === JSON.stringify([
  { dia: "2026-10-28", total: 3 }, { dia: "2026-10-29", total: 1 }, { dia: "2026-10-30", total: 1 },
]), r.porDia);
t("dia de pico", r.diaPico?.dia === "2026-10-28" && r.diaPico.total === 3);
t("hora de pico em Brasília (17h)", r.horaPico?.hora === 17 && r.horaPico.total === 2, r.horaPico);
t("horas da primeira à última, com zeros", r.porHora[0].hora === 10 && r.porHora.at(-1)!.hora === 23 && r.porHora.length === 14);

console.log("Sexo");
t("M/F e grafias longas somam juntas", JSON.stringify(r.porSexo) === JSON.stringify([
  { rotulo: "Feminino", total: 2 }, { rotulo: "Masculino", total: 2 }, { rotulo: "Não informado", total: 1 },
]), r.porSexo);
t("rótulos", rotuloSexo("MASCULINO") === "Masculino" && rotuloSexo("x") === "Não informado");

console.log("Pelotões");
t("ordem do evento, zero incluído, extras e sem pelotão no fim", JSON.stringify(r.porPelotao.map((p) => [p.rotulo, p.total])) ===
  JSON.stringify([["4 km", 2], ["6 km", 0], ["8 km", 1], ["Alfa", 1], ["Sem pelotão", 1]]), r.porPelotao);
t("rótulo de km", rotuloPelotao("2.5km") === "2,5 km" && rotuloPelotao(null) === "Sem pelotão");

console.log("Vazio");
const v = resumirInscricoes([], ["4km"]);
t("sem inscritos não quebra", v.diaPico === null && v.horaPico === null && v.porDia.length === 0 && v.porPelotao[0].total === 0);

console.log(`\n${ok} ok, ${bad} falha(s)`);
process.exit(bad ? 1 : 0);
