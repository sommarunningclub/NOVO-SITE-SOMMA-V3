import type { Draft } from "@/lib/assessoria-nps/survey";
import type { MotivoErro, Origem } from "@/lib/assessoria-nps/analytics";

export interface PayloadEnvio {
  campaign: string;
  survey_version: string;
  submission_id: string;
  first_name: string;
  last_name: string;
  answers: Draft;
  elapsed_ms: number;
  use_invite: boolean;
  attribution: Origem;
}

export type ResultadoEnvio =
  | { tipo: "ok" }
  | { tipo: "ja-respondeu" }
  | { tipo: "erro"; motivo: MotivoErro; mensagem: string; campo: string | null };

const TEMPO_LIMITE_MS = 20_000;
const MSG_GENERICA = "Não conseguimos enviar agora. Suas respostas continuam salvas neste aparelho.";

export async function enviarRespostas(payload: PayloadEnvio): Promise<ResultadoEnvio> {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);

  try {
    const res = await fetch("/api/assessoria/nps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "same-origin",
      cache: "no-store",
      signal: controle.signal,
    });

    let corpo: { ok?: boolean; error?: string; code?: string; campo?: unknown } = {};
    try {
      corpo = await res.json();
    } catch {
      /* resposta sem JSON (proxy, 502 da borda) */
    }

    if (res.ok && corpo.ok) return { tipo: "ok" };
    if (res.status === 409 && corpo.code === "already_answered") return { tipo: "ja-respondeu" };

    const motivo: MotivoErro =
      res.status === 400
        ? "validacao"
        : res.status === 429
          ? "limite"
          : res.status === 410
            ? "encerrada"
            : res.status === 409
              ? "versao"
              : "servidor";

    return {
      tipo: "erro",
      motivo,
      mensagem: corpo.error || MSG_GENERICA,
      campo: typeof corpo.campo === "string" ? corpo.campo : null,
    };
  } catch {
    return {
      tipo: "erro",
      motivo: "rede",
      mensagem: "Parece que a conexão caiu. Suas respostas continuam salvas neste aparelho. Tente enviar de novo.",
      campo: null,
    };
  } finally {
    clearTimeout(relogio);
  }
}
