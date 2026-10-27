import type { EstadoInscricao } from "./event.config";

/** O pedaço de `public.eventos` que decide se a LP aceita inscrição. */
export interface EventoOperacional {
  checkin_status: string | null;
  evento_encerrado: boolean | null;
  pelotoes: string[] | null;
  capacidade?: number | null;
  /** Enquanto true, o evento não foi liberado: some do /check-in e a LP fica fechada. */
  oculto_no_checkin_publico?: boolean | null;
}

export interface Estado {
  estado: EstadoInscricao;
  /** Para o log e o relatório, nunca para a tela: o que ainda impede abrir. */
  pendencias: string[];
}

/**
 * Regra única de abertura, usada pela página e pela rota de inscrição.
 *
 * Abre só quando a gestão deixou o evento `aberto` E já existem pelotões e
 * teto de vagas no banco: sem pelotão oficial a pessoa escolheria uma opção
 * inventada, e sem teto não há "vagas limitadas" de verdade.
 */
export function estadoDaInscricao(
  evento: EventoOperacional | null,
  inscritos: number,
  opcoes: { teste?: boolean } = {}
): Estado {
  if (!evento) return { estado: "em_breve", pendencias: ["evento não cadastrado em public.eventos"] };
  if (!liberado(evento) && !opcoes.teste) return { estado: "em_breve", pendencias: ["evento não liberado (oculto)"] };

  if (evento.evento_encerrado === true || evento.checkin_status === "encerrado") {
    return { estado: "encerradas", pendencias: [] };
  }

  const pendencias: string[] = [];
  const pelotoes = pelotoesValidos(evento.pelotoes);
  if (pelotoes.length === 0) pendencias.push("pelotões não definidos");
  const capacidade = typeof evento.capacidade === "number" ? evento.capacidade : null;
  if (capacidade === null) pendencias.push("capacidade não definida");

  if (evento.checkin_status !== "aberto") {
    // Fechado depois de já ter recebido gente = encerrado; antes = ainda vai abrir.
    return { estado: inscritos > 0 ? "encerradas" : "em_breve", pendencias: [...pendencias, "status bloqueado"] };
  }
  if (pendencias.length > 0) return { estado: "em_breve", pendencias };
  if (capacidade !== null && inscritos >= capacidade) return { estado: "esgotado", pendencias: [] };
  return { estado: "abertas", pendencias: [] };
}

/**
 * Liberação do evento: um interruptor só. Enquanto `oculto_no_checkin_publico`
 * estiver ligado, o card real fica fora do /check-in (lá aparece só a vitrine
 * da agenda de novembro), a LP redireciona para o /check-in e a inscrição é
 * recusada. Desligar libera tudo junto.
 */
export function liberado(evento: EventoOperacional | null): boolean {
  return !!evento && evento.oculto_no_checkin_publico !== true;
}

export function pelotoesValidos(pelotoes: string[] | null | undefined): string[] {
  return (pelotoes ?? []).map((p) => String(p ?? "").trim()).filter(Boolean);
}

/** "4km" → "4 km"; o resto passa como veio da gestão. */
export function rotuloPelotao(p: string): string {
  const km = p.trim().match(/^(\d+(?:[.,]\d+)?)\s*km$/i);
  return km ? `${km[1].replace(".", ",")} km` : p.trim();
}
