/**
 * Grupos de WhatsApp da comunidade.
 *
 * Estavam escritos à mão dentro de `/obrigado`. Como agora o fluxo de
 * identificação também precisa mandar gente para o grupo, os links passam a
 * viver aqui: um lugar só para adicionar, remover ou trocar um convite.
 *
 * Por enquanto o sorteio entre grupos está desligado: o site inteiro (home,
 * `/obrigado` e e-mail de boas-vindas) manda todo mundo para o grupo 3. Para
 * trocar de grupo, basta mudar `GRUPO_ATUAL`.
 */
export const WHATSAPP_GRUPOS = {
  grupo1: "https://chat.whatsapp.com/HqEzvY8SbSvImtGaw3UkEk",
  grupo2: "https://chat.whatsapp.com/B5MSnH8DoasDVfgMlbuAng",
  grupo3: "https://chat.whatsapp.com/Cw7SxDvVDDW6kAW0fj06FT",
} as const;

/** O grupo para onde o site manda todo mundo. */
export const GRUPO_ATUAL: string = WHATSAPP_GRUPOS.grupo3;

/** Abre o grupo em nova aba. Client-side. */
export function abrirGrupo(): void {
  if (typeof window === "undefined") return;
  window.open(GRUPO_ATUAL, "_blank", "noopener,noreferrer");
}
