/**
 * Eventos da LP para o GTM/GA4 que já rodam no site (app/layout.tsx).
 *
 * REGRA DURA: CPF, e-mail, telefone e nome NUNCA entram aqui. O que sobe é
 * comportamento — etapa alcançada, pelotão escolhido, se o CPF já era da base.
 * É o suficiente para medir funil sem exportar dado pessoal para ferramenta
 * de terceiro.
 */
export type EventoSommaDay =
  | "lp_visualizada"
  | "inscricao_iniciada"
  | "cpf_identificado"
  | "cadastro_completado"
  | "pelotao_escolhido"
  | "inscricao_concluida"
  | "ja_inscrito"
  | "evento_lotado"
  | "mapa_aberto"
  | "calendario_adicionado"
  | "ticket_impresso"
  | "compartilhou";

type Props = Record<string, string | number | boolean | null>;

const PROIBIDOS = ["cpf", "email", "telefone", "whatsapp", "nome", "nascimento"];

export function evento(nome: EventoSommaDay, props: Props = {}) {
  if (typeof window === "undefined") return;

  // Guarda-corpo: se um dia alguém passar dado pessoal aqui, ele não sobe.
  const limpo: Props = {};
  for (const [chave, valor] of Object.entries(props)) {
    if (PROIBIDOS.some((p) => chave.toLowerCase().includes(p))) continue;
    limpo[chave] = valor;
  }

  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ event: `somma_day_${nome}`, ...limpo });
}
