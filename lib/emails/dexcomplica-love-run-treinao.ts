import {
  CONCENTRACAO_A_PARTIR,
  CORES,
  DATA_EXTENSO,
  LOCAL_AFTER,
  LOCAL_CORRE,
  SITE_URL,
} from "@/lib/dexcomplica-love-run/event.config";
import {
  DISPLAY,
  TEXTO,
  bloco,
  esc,
  eyebrow,
  grupoWhatsapp,
  letreiro,
  linkSeta,
  p,
  peito,
  titulo,
  casca,
} from "./dexcomplica-love-run-layout";

/**
 * E-mail avulso de 02/11/2026 para todos os inscritos: o Love Run é um
 * treinão em grupo, não uma prova (sem kit, número de peito, cronômetro ou
 * pódio). Aproveita para reforçar o horário novo da concentração, porque quem
 * se inscreveu antes de 01/11 recebeu a confirmação com 06h30.
 * Personalizado por pessoa (link do ingresso), então sai por script.
 */
export const ASSUNTO_TREINAO = "Love Run: é treinão em grupo, não é prova";

const NAO_TEM: [string, string][] = [
  ["Kit de corrida", "Sem camiseta, sacola ou retirada de kit."],
  ["Número de peito", "Ninguém precisa prender número na roupa."],
  ["Chip e cronômetro", "Não tem tempo oficial nem resultado."],
  ["Pódio e premiação", "Ninguém compete com ninguém."],
];

function naoTem(): string {
  return bloco(
    `<div style="font-family:${DISPLAY};font-size:34px;line-height:38px;color:${CORES.tinta};text-transform:uppercase;margin:0 0 12px">O que não tem</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${NAO_TEM.map(
      ([item, detalhe]) =>
        `<tr><td valign="top" width="34" style="padding:10px 0;border-top:2px solid ${CORES.tinta};font-family:${TEXTO};font-size:20px;font-weight:800;color:${CORES.vermelho}">&#10005;</td><td style="padding:10px 0;border-top:2px solid ${CORES.tinta};font-family:${TEXTO};color:${CORES.tinta}"><div style="font-size:17px;font-weight:800">${item}</div><div style="font-size:14px;color:#3a3326">${detalhe}</div></td></tr>`
    ).join("")}</table>`,
    { fundo: CORES.amarelo, cor: CORES.tinta }
  );
}

export function renderTreinao(d: { nome: string; urlIngresso: string; base?: string }): string {
  const nome = esc(d.nome.trim().split(/\s+/)[0] || d.nome);
  const concentracao = CONCENTRACAO_A_PARTIR ?? "em breve";
  const corpo = [
    letreiro(),
    bloco(
      eyebrow("Recado importante") +
        titulo(`${nome}, o Love Run`, "#ffffff", "é um treinão.") +
        p(
          `Queremos deixar bem claro antes de sábado: o Dexcomplica Love Run <strong style="color:#ffffff">não é uma prova de corrida</strong>. É um <strong style="color:#ffffff">treinão em grupo</strong>, gratuito, pra correr junto com a galera, com música, ativações e o after no ${esc(LOCAL_AFTER.nome)}.`
        ),
      { padBottom: 30 }
    ),
    naoTem(),
    bloco(
      eyebrow("O que tem", CORES.amarelo) +
        titulo("Corre junto,", "#ffffff", "no seu ritmo.", CORES.vermelho) +
        p("Você escolheu 4, 6 ou 8 km na inscrição. É só chegar, fazer o check-in com o QR Code do seu ingresso e correr com o seu pelotão.") +
        `<div style="margin:18px 0 0">${peito([
          ["Data", DATA_EXTENSO],
          ["Concentração", concentracao.charAt(0).toUpperCase() + concentracao.slice(1)],
          ["Encontro", esc(LOCAL_CORRE.nome)],
          ["Pelotões", "4, 6 ou 8 km"],
          ["Depois do corre", `After no ${esc(LOCAL_AFTER.nome)}`],
        ])}</div>` +
        `<p style="margin:16px 0 0;font-family:${TEXTO};font-size:15px;line-height:22px;color:${CORES.amarelo};font-weight:700">Atenção ao horário: a concentração agora é ${concentracao}.</p>`
    ),
    bloco(
      eyebrow("Seu ingresso", CORES.amarelo) +
        p("Seu ingresso com QR Code continua no mesmo lugar. É ele que você mostra no check-in.", "#ffffff") +
        `<div style="margin-top:6px">${linkSeta("Abrir meu ingresso", d.urlIngresso)}</div>`,
      { fundo: CORES.vermelho }
    ),
    grupoWhatsapp(),
  ].join("");

  return casca({
    base: d.base ?? SITE_URL,
    preheader: "Sem kit, sem número de peito, sem cronômetro. É todo mundo correndo junto, de graça.",
    heroi: { arquivo: "treinao.jpg", alt: "É treinão, não é prova. Dexcomplica Love Run, sábado 07.11" },
    corpo,
  });
}

export function textoTreinao(d: { nome: string; urlIngresso: string }): string {
  const concentracao = CONCENTRACAO_A_PARTIR ?? "em breve";
  return [
    `Oi, ${d.nome.trim().split(/\s+/)[0]}! Queremos deixar claro antes de sábado: o Dexcomplica Love Run não é uma prova de corrida. É um treinão em grupo, gratuito, com música, ativações e o after no ${LOCAL_AFTER.nome}.`,
    "\nO que não tem: kit de corrida, número de peito, chip ou cronômetro, pódio ou premiação.",
    `\n${DATA_EXTENSO}, concentração ${concentracao}, ${LOCAL_CORRE.nome}. Pelotões de 4, 6 ou 8 km.`,
    `\nSeu ingresso (QR Code do check-in): ${d.urlIngresso}`,
    "\nSomma Club × Dexcomplica · produção Monu",
  ].join("\n");
}
