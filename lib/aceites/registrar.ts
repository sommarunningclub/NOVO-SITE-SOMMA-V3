import { getServiceSupabase } from "@/lib/supabase";
import { clientIp } from "@/lib/rate-limit";
import { VERSAO_TERMO, type TipoTermo } from "./termos";

type Aceite = {
  tipos: TipoTermo[];
  /** Onde o aceite aconteceu, por ex. "check-in" ou "love-run". */
  origem: string;
  /** Quem marcou: a própria pessoa, a equipe ou quem transferiu o ingresso. */
  forma?: "titular" | "equipe" | "terceiro";
  cpf: string;
  nome?: string | null;
  email?: string | null;
  eventoId?: string | null;
};

/**
 * Grava a prova do aceite. Chame depois que a inscrição ou o cadastro foi salvo,
 * para que envio recusado não vire aceite.
 *
 * Nunca lança: a pessoa já está inscrita, e uma falha aqui não pode virar erro na
 * tela dela no dia do evento. Por isso a falha vai para o log com o CPF mascarado,
 * e quem chama precisa usar `await` para a função serverless não congelar antes.
 */
export async function registrarAceites(request: Request, aceite: Aceite): Promise<boolean> {
  const cpfDigits = aceite.cpf.replace(/\D/g, "");
  try {
    const supabase = getServiceSupabase();
    if (!supabase) throw new Error("Banco indisponível");

    const ip = clientIp(request);
    const { error } = await supabase.from("aceites_termos").insert(
      aceite.tipos.map((tipo) => ({
        tipo,
        versao: VERSAO_TERMO[tipo],
        origem: aceite.origem,
        forma: aceite.forma ?? "titular",
        cpf_digits: cpfDigits,
        nome: aceite.nome ?? null,
        email: aceite.email ?? null,
        evento_id: aceite.eventoId ?? null,
        ip: ip === "desconhecido" ? null : ip,
        user_agent: request.headers.get("user-agent")?.slice(0, 400) ?? null,
      }))
    );
    if (error) throw new Error(error.message);
    return true;
  } catch (erro) {
    console.error(
      `[aceites] Aceite NÃO gravado (${aceite.origem}, CPF final ${cpfDigits.slice(-3)}):`,
      erro instanceof Error ? erro.message : erro
    );
    return false;
  }
}
