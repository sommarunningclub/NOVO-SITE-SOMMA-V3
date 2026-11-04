import { eventosQueContem } from "./comunidade";
import { fmtData, fmtInt } from "../_lib/formato";

/**
 * Marcas que já entraram em movimento com a SOMMA.
 *
 * Regra: só entra o que tem registro. As evidências numéricas vêm do sistema
 * de check-in (comunidade.snapshot.json), nunca digitadas à mão. Projeto que
 * ainda não aconteceu leva status de preparação, nunca de case concluído.
 *
 * Marcas citadas no briefing sem registro encontrado no projeto (Big Box,
 * Liquidz, Track&Field) ficam fora até que alguém traga data, formato e
 * evidência. Para incluir, acrescente um item aqui.
 */
export type StatusCase = "realizado" | "recorrente" | "agendado" | "preparacao";

export const ROTULO_STATUS_CASE: Record<StatusCase, string> = {
  realizado: "Realizado",
  recorrente: "Recorrente",
  agendado: "Agendado",
  preparacao: "Projeto em preparação",
};

export interface Case {
  marca: string;
  status: StatusCase;
  contexto: string;
  experiencia: string;
  papelSomma: string;
  evidencias: string[];
  resultados: { valor: string; rotulo: string }[];
}

function somaConfirmacoes(re: RegExp) {
  const evs = eventosQueContem(re);
  return { evs, total: evs.reduce((s, e) => s + e.participacoes, 0) };
}

const redbull = eventosQueContem(/Red Bull/i)[0];
const wings = eventosQueContem(/Wings/i)[0];
const evolve = somaConfirmacoes(/Evolve/i);
const centauro = eventosQueContem(/Centauro/i)[0];

export const CASES: Case[] = [
  {
    marca: "Red Bull",
    status: "realizado",
    contexto: "Uma edição especial do SOMMA DAY assinada com a marca, fora do sábado habitual.",
    experiencia: `SOMMA DAY × Red Bull, ${redbull ? fmtData(redbull.data) : "abril de 2026"}, e o Wings das Atléticas 2026, ligado ao Wings for Life.`,
    papelSomma: "Formato, comunicação para a comunidade, inscrição e check-in pelo site da SOMMA.",
    evidencias: ["Registros do sistema de check-in", "Páginas dos eventos no site"],
    resultados: [
      ...(redbull
        ? [
            { valor: fmtInt(redbull.participacoes), rotulo: "confirmações no SOMMA DAY × Red Bull" },
            {
              valor: `${Math.round((redbull.estreantes / redbull.participacoes) * 100)}%`,
              rotulo: "eram estreantes na SOMMA",
            },
          ]
        : []),
      ...(wings ? [{ valor: fmtInt(wings.participacoes), rotulo: "confirmações no Wings das Atléticas" }] : []),
    ],
  },
  {
    marca: "Evolve",
    status: "recorrente",
    contexto: "Academia parceira com formatos indoor, em esteira, que complementam a corrida de rua.",
    experiencia:
      "Revezamentos de corrida e o Desafio das Esteiras, em edições ao longo do ano. O LONGÃO, revezamento de 24 horas em esteira, está em preparação.",
    papelSomma: "Criação dos formatos, inscrição com vagas limitadas, comunicação e operação junto com a Evolve.",
    evidencias: ["Registros do sistema de check-in", "Páginas dos desafios no site"],
    resultados: [
      { valor: String(evolve.evs.length), rotulo: "edições realizadas em 2026" },
      { valor: fmtInt(evolve.total), rotulo: "confirmações somadas, em formatos de vagas limitadas" },
    ],
  },
  {
    marca: "Centauro",
    status: "realizado",
    contexto: "Varejo esportivo aproximando a marca de quem já corre toda semana.",
    experiencia: `Edição Aquecimento Centauro Desbrava no Parque da Cidade${centauro ? ` (${fmtData(centauro.data)})` : ""} e um shakeout da SOMMA com a Centauro nas ruas do Rio de Janeiro.`,
    papelSomma: "Encontro aberto à comunidade, comunicação e conteúdo nas redes.",
    evidencias: ["Registros do sistema de check-in", "Conteúdo publicado no Instagram da SOMMA"],
    resultados: centauro
      ? [{ valor: fmtInt(centauro.participacoes), rotulo: "confirmações na edição Centauro Desbrava" }]
      : [],
  },
  {
    marca: "Dexcomplica",
    status: "agendado",
    contexto: "Uma banda e uma comunidade de corrida juntas em um treinão em grupo.",
    experiencia: "Dexcomplica Love Run: treinão de 4, 6 e 8 km em 07/11/2026, com página própria, ingresso digital e transferência de vaga.",
    papelSomma: "Formato, página de inscrição, ingresso com QR, comunicação por e-mail e operação do check-in.",
    evidencias: ["Página do evento no site", "Sistema de inscrição e ingresso"],
    resultados: [{ valor: "Esgotado", rotulo: "inscrições encerradas antes da data do evento" }],
  },
  {
    marca: "Michelob Ultra",
    status: "preparacao",
    contexto: "Uma marca de cerveja ligada ao estilo de vida ativo, entrando pela porta da experiência.",
    experiencia:
      "Plataforma de encontros Michelob Ultra × SOMMA em Brasília, com lista VIP, ingresso digital e check-in. A SOMMA também foi convidada para o Michelob Move Fest, em São Paulo.",
    papelSomma: "Desenho da experiência, plataforma digital própria e operação com a comunidade.",
    evidencias: ["Plataforma desenvolvida pela SOMMA"],
    resultados: [],
  },
];
