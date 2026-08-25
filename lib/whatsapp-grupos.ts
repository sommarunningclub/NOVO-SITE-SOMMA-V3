/**
 * Grupos de WhatsApp da comunidade.
 *
 * Estavam escritos à mão dentro de `/obrigado`. Como agora o fluxo de
 * identificação também precisa mandar gente para o grupo, os links passam a
 * viver aqui: um lugar só para adicionar, remover ou trocar um convite.
 *
 * A distribuição é aleatória para os grupos crescerem parelhos. Não há estado
 * compartilhado entre visitantes, então isso não garante equilíbrio exato,
 * apenas evita que todo mundo caia no primeiro.
 */
export const WHATSAPP_GRUPOS = [
  "https://chat.whatsapp.com/HqEzvY8SbSvImtGaw3UkEk?mode=gi_t",
  "https://chat.whatsapp.com/B5MSnH8DoasDVfgMlbuAng?mode=gi_t",
] as const;

export function sortearGrupo(): string {
  return WHATSAPP_GRUPOS[Math.floor(Math.random() * WHATSAPP_GRUPOS.length)];
}

/** Abre o grupo em nova aba. Client-side. */
export function abrirGrupo(): void {
  if (typeof window === "undefined") return;
  window.open(sortearGrupo(), "_blank", "noopener,noreferrer");
}
