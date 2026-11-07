import { API_CORRE, CAMINHO_CORRE, MENSAGENS } from "@/lib/vem-correr-comigo/regras";
import type { ResultadoAcao } from "@/lib/vem-correr-comigo/tipos";
import { rastrearCorre } from "@/lib/vem-correr-comigo/analytics";

export class SessaoExpirada extends Error {}

export async function pedir<T>(caminho: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_CORRE}${caminho}`, init);
  if (res.status === 401) throw new SessaoExpirada();
  return (await res.json()) as T;
}

export const enviarJson = <T,>(caminho: string, corpo: unknown, method = "POST") =>
  pedir<T>(caminho, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });

export const acao = (corpo: Record<string, unknown>) => enviarJson<ResultadoAcao>("/acao", corpo);

export const urlFoto = (codigo: string, versao: number) => `${API_CORRE}/foto/${codigo}?v=${versao}`;

export const rotuloKm = (p: string | null) => (p ?? "").replace(/^(\d+)\s*km$/i, "$1 km");

/** Um grupo pode misturar distâncias: "4 km", "4 e 8 km", "4, 6 e 8 km". */
export const rotuloKmGrupo = (membros: { pelotao: string | null }[]) => {
  const kms = [...new Set(membros.map((m) => parseInt(m.pelotao ?? "", 10)).filter(Number.isFinite))].sort((a, b) => a - b);
  if (kms.length < 2) return kms.length ? `${kms[0]} km` : "";
  return `${kms.slice(0, -1).join(", ")} e ${kms[kms.length - 1]} km`;
};

/** Web Share quando existe; senão, copia. Devolve o que aconteceu para a tela avisar. */
export async function compartilhar(alvo: { tipo: "perfil" | "grupo"; codigo: string; texto: string }): Promise<"compartilhado" | "copiado" | "erro"> {
  const url = `${window.location.origin}${CAMINHO_CORRE}/${alvo.tipo === "grupo" ? "g" : "p"}/${alvo.codigo}`;
  rastrearCorre(alvo.tipo === "grupo" ? "group_shared" : "profile_shared");
  if (navigator.share) {
    try {
      await navigator.share({ text: alvo.texto, url });
      return "compartilhado";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "compartilhado";
    }
  }
  try {
    await navigator.clipboard.writeText(`${alvo.texto} ${url}`);
    return "copiado";
  } catch {
    return "erro";
  }
}

export const TEXTO_PERFIL = "Vou descomplicar meu corre no Dexcomplica! Vem correr comigo?";
export const textoGrupo = (total: number, completo: boolean) =>
  completo
    ? total === 4
      ? "Nosso quarteto está formado! Agora é só descomplicar!"
      : "Nosso grupo está formado! Agora é só descomplicar!"
    : "Já estamos descomplicando juntos! Vem com a gente?";

export { MENSAGENS };
