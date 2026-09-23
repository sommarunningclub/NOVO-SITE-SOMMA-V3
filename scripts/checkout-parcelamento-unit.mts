/**
 * Testes de unidade do parcelamento do checkout da Assessoria.
 *
 *   npx tsx scripts/checkout-parcelamento-unit.mts
 *
 * Guarda a regra que faltava em 22/09/2026: o total do ciclo NÃO depende do
 * número de parcelas escolhido. Naquele dia uma aluna fechou o Semestral, viu
 * o seletor oferecer "1x" e pagou R$ 200 em vez de R$ 1.200, porque a parcela
 * era fixa na mensalidade do plano e o total virava mensalidade × parcelas.
 */
import {
  PLANOS_PARCELADOS,
  ajustarParcelas,
  parcelasDisponiveis,
  planoParcelado,
  totalDoCiclo,
  totalParcelado,
  valorDaParcela,
} from "../lib/checkout/parcelamento";

let ok = 0, bad = 0;
const t = (n: string, c: boolean, d = "") => { c ? (ok++, console.log("  ✓", n)) : (bad++, console.log("  ✗", n, d)); };

const semestral = PLANOS_PARCELADOS.Semestral;
const anual = PLANOS_PARCELADOS.Anual;

console.log("O total do ciclo não muda com o nº de parcelas");
for (const [nome, plan] of [["Semestral", semestral], ["Anual", anual]] as const) {
  const total = totalDoCiclo(plan);
  for (const n of parcelasDisponiveis(plan, total)) {
    t(`${nome} em ${n}x soma exatamente R$ ${plan.total}`, totalParcelado(total, n) === plan.total, `R$ ${totalParcelado(total, n)}`);
  }
}

console.log("\nREGRESSÃO de 22/09/2026");
t("Semestral em 1x custa R$ 1.200, não R$ 200", valorDaParcela(totalDoCiclo(semestral), 1) === 1200, `R$ ${valorDaParcela(totalDoCiclo(semestral), 1)}`);
t("Semestral em 6x custa R$ 200 a parcela", valorDaParcela(totalDoCiclo(semestral), 6) === 200);
t("Anual em 1x custa R$ 2.160", valorDaParcela(totalDoCiclo(anual), 1) === 2160);
t("Anual em 12x custa R$ 180 a parcela", valorDaParcela(totalDoCiclo(anual), 12) === 180);
t("nenhum parcelamento do Semestral sai por menos de R$ 1.200",
  parcelasDisponiveis(semestral, 1200).every((n) => totalParcelado(1200, n) === 1200));

console.log("\nCupom desconta o ciclo inteiro, não a parcela escolhida");
const semestralCom10 = totalDoCiclo(semestral, 20); // 10% sobre a mensalidade de R$ 200
t("Semestral -10% = R$ 1.080 no ciclo", semestralCom10 === 1080, `R$ ${semestralCom10}`);
t("vale o mesmo em 1x e em 6x", totalParcelado(semestralCom10, 1) === totalParcelado(semestralCom10, 6));
t("Semestral -10% em 6x = R$ 180 a parcela", valorDaParcela(semestralCom10, 6) === 180);
const anualFixo = totalDoCiclo(anual, 50); // cupom fixo de R$ 50 por mensalidade
t("Anual -R$50/mês = R$ 1.560 no ciclo", anualFixo === 1560, `R$ ${anualFixo}`);
t("Anual -R$50/mês em 12x = R$ 130 a parcela", valorDaParcela(anualFixo, 12) === 130);

console.log("\nSó parcelamentos que fecham em centavos exatos");
t("Semestral oferece de 1x a 6x", parcelasDisponiveis(semestral, 1200).join() === "1,2,3,4,5,6");
t("Anual não oferece 7x nem 11x", parcelasDisponiveis(anual, 2160).join() === "1,2,3,4,5,6,8,9,10,12");
t("pedido inexato cai no parcelamento cheio", ajustarParcelas(anual, 2160, 7) === 12 && ajustarParcelas(anual, 2160, 11) === 12);
t("pedido exato é respeitado", ajustarParcelas(anual, 2160, 8) === 8 && ajustarParcelas(semestral, 1200, 1) === 1);

console.log("\nO servidor não aceita qualquer pedido do navegador");
for (const bruto of [0, -3, 99, "1", null, undefined, 1.99, NaN, "abacaxi", 1e9]) {
  const n = ajustarParcelas(semestral, 1200, bruto);
  t(`installmentCount=${JSON.stringify(bruto)} → ${n}x, total R$ 1.200`, totalParcelado(1200, n) === 1200 && n >= 1 && n <= 6, `${n}x`);
}
t("plano desconhecido não é cobrado", planoParcelado("Vitalício") === null && planoParcelado(undefined) === null && planoParcelado("") === null);
t("plano conhecido resolve pelo nome", planoParcelado("Semestral")?.total === 1200 && planoParcelado("Anual")?.total === 2160);
t("nunca abaixo do mínimo do Asaas", valorDaParcela(1, 12) === 5);

console.log(`\n${ok} passaram · ${bad} falharam`);
process.exit(bad ? 1 : 0);
