import {
  AFTER,
  CORES,
  DATA_EXTENSO,
  EVENTO_URL,
  FESTA,
  HORARIO,
  LOCAL_AFTER,
  LOCAL_CORRE,
  PERCURSO,
  SITE_URL,
  urlComoChegar,
} from "@/lib/dexcomplica-love-run/event.config";
import { bloco, botao, casca, eyebrow, grupoWhatsapp, letreiro, linkSeta, mochila, p, peito, selos, titulo } from "./dexcomplica-love-run-layout";

/**
 * E-mails para a BASE de inscritos do Love Run, disparados pelo módulo de
 * E-mail Marketing da gestão (template "HTML personalizado", base
 * `love_run`). Mesmos blocos e mesma cara da LP e da confirmação.
 *
 * Regras do módulo que moldam estes HTMLs:
 * - só `{{nome}}` e `{{primeiro_nome}}` são trocados por pessoa. O ingresso
 *   é pessoal, então o botão leva a `#meu-ingresso` na LP: o aparelho que se
 *   inscreveu abre o ingresso direto; outro aparelho cai na recuperação por CPF;
 * - o rodapé com descadastro é acrescentado pela gestão no envio.
 *
 * Informação ainda não confirmada aparece como [A CONFIRMAR: ...], de
 * propósito: a prévia mostra o buraco e ninguém dispara um e-mail
 * prometendo o que não existe. Preencha o config e o texto aparece.
 */

const A_CONFIRMAR = (o_que: string) =>
  `<span style="background:#ffe1e8;color:#b0170c;font-weight:800;padding:1px 6px;border-radius:4px">[A CONFIRMAR: ${o_que}]</span>`;

export const URL_MEU_INGRESSO = `${EVENTO_URL}#meu-ingresso`;

export interface TemplateCampanha {
  id: string;
  nome: string;
  quando: string;
  base: string;
  assunto: string;
  preheader: string;
  pendencias: string[];
  html: (base?: string) => string;
}

const horario = () =>
  HORARIO.concentracao
    ? `Concentração às ${HORARIO.concentracao}${HORARIO.largada ? `, largada às ${HORARIO.largada}` : ""}`
    : A_CONFIRMAR("horário de concentração e largada");
const percurso = () => (PERCURSO ? PERCURSO.descricao : A_CONFIRMAR("percurso e distâncias dos pelotões"));
const after = () =>
  [AFTER.horario ? `After: ${AFTER.horario}.` : A_CONFIRMAR("horário do after"), AFTER.acesso ?? A_CONFIRMAR("condições de acesso ao after")].join(" ");

const pend = (...xs: (string | false | null)[]) => xs.filter(Boolean) as string[];

const comoChegar = () =>
  `<div style="margin-top:16px">${linkSeta("Como chegar ao Estacionamento 1", urlComoChegar(LOCAL_CORRE))}</div>`;

export const CAMPANHAS: TemplateCampanha[] = [
  {
    id: "informacoes",
    nome: "Tudo confirmado: horário, percurso e after",
    quando: "Assim que a organização fechar horário, percurso e regras do after",
    base: "love_run (todos)",
    assunto: "Love Run: horário, percurso e o after confirmados",
    preheader: "Tudo o que você precisa saber para sábado, 7 de novembro.",
    pendencias: pend(!HORARIO.concentracao && "horário", !PERCURSO && "percurso", !AFTER.horario && "horário do after", !AFTER.acesso && "acesso ao after"),
    html: (base = SITE_URL) =>
      casca({
        base,
        preheader: "Tudo o que você precisa saber para sábado, 7 de novembro.",
        heroi: { arquivo: "informacoes.jpg", alt: "Tá tudo confirmado. Dexcomplica Love Run, sábado 07.11" },
        corpo: [
          letreiro(),
          bloco(
            eyebrow("O roteiro do corre") +
              titulo("{{primeiro_nome}}, salva", "#ffffff", "o roteiro.") +
              p("O Dexcomplica Love Run tem tudo fechado. Guarda este e-mail: está tudo aqui.") +
              selos([{ t: "Sáb · 07.11", cor: "amarelo" }, { t: "Percurso diferente", cor: "rosa" }]),
            { padBottom: 16 }
          ),
          bloco(
            peito([
              ["Encontro", LOCAL_CORRE.nome],
              ["Horário", horario()],
              ["Percurso", percurso()],
              ["Depois do corre", `${LOCAL_AFTER.nome}. ${after()}`],
            ]) + comoChegar(),
            { padTop: 6 }
          ),
          bloco(
            eyebrow("Seu ingresso", CORES.amarelo) +
              titulo("Deixa o QR", "#ffffff", "na mão.", CORES.amarelo) +
              p("No check-in é só mostrar o QR Code do ingresso (ou falar o código). Abra pelo botão: no celular em que você se inscreveu ele aparece direto.", "#ffffff") +
              botao("Abrir meu ingresso", URL_MEU_INGRESSO, "branco"),
            { fundo: CORES.vermelho }
          ),
          grupoWhatsapp(),
          mochila(),
        ].join(""),
      }),
  },
  {
    id: "vespera",
    nome: "Lembrete da véspera",
    quando: "Sexta, 6 de novembro, fim da tarde",
    base: "love_run (todos)",
    assunto: "Amanhã tem Love Run. Separa o tênis (e a roupa de banho)",
    preheader: "Seu ingresso, o que levar e onde é o encontro.",
    pendencias: pend(!HORARIO.concentracao && "horário"),
    html: (base = SITE_URL) =>
      casca({
        base,
        preheader: "Seu ingresso, o que levar e onde é o encontro.",
        heroi: { arquivo: "vespera.jpg", alt: "É amanhã! Dexcomplica Love Run, sábado 07.11" },
        corpo: [
          letreiro(),
          bloco(
            eyebrow("É amanhã") +
              titulo("{{primeiro_nome}}, amanhã", "#ffffff", "o coração acelera.") +
              p(`Amanhã, ${DATA_EXTENSO.toLowerCase()}, é dia de Dexcomplica Love Run. ${horario()} no ${LOCAL_CORRE.nome}.`) +
              selos([{ t: "Sáb · 07.11", cor: "amarelo" }, { t: "Est. 1 · Parque da Cidade", cor: "vermelho" }]) +
              botao("Abrir meu ingresso", URL_MEU_INGRESSO) +
              comoChegar(),
            { padBottom: 40 }
          ),
          grupoWhatsapp(),
          mochila(),
          bloco(
            eyebrow("Dica de check-in", CORES.amarelo) +
              titulo("Fila andando", "#ffffff", "rapidinho.", CORES.amarelo) +
              p("Chega com o QR Code já aberto no celular (ou com o código anotado). Depois do corre, a experiência continua no Oscarito: ducha, vestiários e after.", "#ffffff"),
            { fundo: CORES.vermelho }
          ),
        ].join(""),
      }),
  },
  {
    id: "pos-corre",
    nome: "Obrigado + condição especial na festa",
    quando: "Sábado, 7 de novembro, depois do corre",
    base: "love_run, segmento presente (só quem fez check-in)",
    assunto: "Você correu com a gente. Sua condição na festa Dexcomplica",
    preheader: "Obrigado por fazer parte do Love Run. O benefício da festa é seu.",
    pendencias: pend(!FESTA.beneficio && "benefício da festa", !FESTA.confirmada && "data e local da festa", !FESTA.url && "link oficial da festa"),
    html: (base = SITE_URL) =>
      casca({
        base,
        preheader: "Obrigado por fazer parte do Love Run. O benefício da festa é seu.",
        heroi: { arquivo: "pos-corre.jpg", alt: "Obrigado por correr. Dexcomplica Love Run" },
        corpo: [
          letreiro(),
          bloco(
            eyebrow("Só pra quem foi") +
              titulo("{{primeiro_nome}}, o Love Run", "#ffffff", "foi só o começo.") +
              p("Obrigado por estar no corre de hoje. Como prometido, quem esteve presente tem uma condição especial na festa Dexcomplica."),
            { padBottom: 10 }
          ),
          bloco(
            `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CORES.amarelo};border-radius:18px;border:3px solid #ffffff"><tr><td style="padding:24px 24px 22px;font-family:Archivo,'Helvetica Neue',Arial,sans-serif;color:${CORES.tinta}">` +
              `<div style="font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px">Sua condição na festa</div>` +
              `<div style="font-family:Anton,Impact,'Arial Black',sans-serif;font-size:30px;line-height:36px;text-transform:uppercase">${FESTA.beneficio ?? A_CONFIRMAR("benefício: percentual, código ou forma de entrega, e regras")}</div>` +
              `</td></tr></table>`,
            { padTop: 6, padBottom: 20 }
          ),
          bloco(
            eyebrow("Festa Dexcomplica", CORES.amarelo) +
              titulo("Desapega,", "#ffffff", "desilude... dexcomplica!", CORES.amarelo) +
              p(`${FESTA.confirmada ? `${FESTA.data}${FESTA.local ? `, ${FESTA.local}` : ""}.` : A_CONFIRMAR("data, local e horário da festa")}`, "#ffffff") +
              p("Este e-mail foi só para quem fez check-in no Love Run.", "#ffe1e8") +
              botao(FESTA.url ? "Garantir meu ingresso da festa" : "Acompanhe a Dexcomplica", FESTA.url ?? FESTA.instagram, "branco"),
            { fundo: CORES.vermelho }
          ),
        ].join(""),
      }),
  },
];
