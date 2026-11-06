import {
  CONCENTRACAO_A_PARTIR,
  CORES,
  DATA_EXTENSO,
  EVENTO_URL,
  FESTA,
  LOCAL_AFTER,
  LOCAL_CORRE,
  SITE_URL,
} from "@/lib/dexcomplica-love-run/event.config";
import { TEXTO, bloco, botao, casca, esc, eyebrow, linkSeta, p, peito, titulo } from "./dexcomplica-love-run-layout";

/**
 * E-mail avulso de 05/11/2026: lembra o Love Run de sábado e leva para o
 * benefício na Dexcomplica de 28/11 (link do Sympla, válido até segunda 09/11).
 * O texto não diz qual é o benefício porque só o Sympla mostra isso.
 * A campanha sai pelo admin, que troca {{primeiro_nome}} por pessoa.
 */
export const ASSUNTO_FESTA = "Love Run neste sábado, e um benefício na Dexcomplica até segunda";
export const PREHEADER_FESTA = "Treinão com o Lovezinho, after no Oscarito e um benefício para a festa de 28/11.";

const primeiro = (nome: string) => nome.trim().split(/\s+/)[0] || nome;
const inicial = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function renderFesta(d: { nome: string; base?: string }): string {
  const concentracao = CONCENTRACAO_A_PARTIR ?? "em breve";
  const branco = (t: string) => `<strong style="color:#ffffff">${t}</strong>`;
  const corpo = [
    bloco(
      eyebrow("Corre do Lovezinho") +
        titulo(`${esc(primeiro(d.nome))}, sábado`, "#ffffff", "tem Love Run.") +
        p(
          `Somma e Dexcomplica se uniram para um treinão especial, comandado pelo ${branco("Lovezinho")}, o mascote da Dexcomplica. Depois do corre, tem after no ${esc(LOCAL_AFTER.nome)} com várias surpresas.`
        ) +
        `<div style="margin:18px 0 16px">${peito([
          ["Data", DATA_EXTENSO],
          ["Concentração", inicial(concentracao)],
          ["Encontro", esc(LOCAL_CORRE.nome)],
          ["Depois do corre", `After no ${esc(LOCAL_AFTER.nome)}`],
        ])}</div>` +
        linkSeta("Abrir meu ingresso", `${EVENTO_URL}#meu-ingresso`)
    ),
    bloco(
      eyebrow("Benefício especial", CORES.amarelo) +
        titulo("Dexcomplica,", "#ffffff", `${FESTA.data}.`, CORES.amarelo) +
        p(`Preparamos um benefício especial para o nosso time, ${branco("válido até segunda-feira, 09/11")}.`, "#ffffff") +
        p("A festa caminha para a 12ª edição em pouco mais de 3 anos. É prato cheio para quem ama pagode, e também toca funk, piseiro e sertanejo.", "#ffffff") +
        `<p style="margin:0 0 16px;font-family:${TEXTO};font-size:14px;line-height:21px;font-weight:700;color:#ffffff">${esc(FESTA.local ?? "")} · ${esc(FESTA.classificacao)}</p>` +
        botao("Aproveitar o benefício", FESTA.url ?? EVENTO_URL, "amarelo"),
      { fundo: CORES.vermelho }
    ),
  ].join("");

  return casca({
    base: d.base ?? SITE_URL,
    preheader: PREHEADER_FESTA,
    heroi: { arquivo: "festa-28-11.jpg", alt: "Dexcomplica, 28 de novembro" },
    corpo,
  });
}
