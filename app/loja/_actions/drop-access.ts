"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { getServiceSupabase } from "@/lib/supabase";

/**
 * DROP ACCESS: lista de aviso de drops. Grava na tabela `loja_drop_access`, no
 * mesmo Supabase da gestão, para o disparo sair pela ferramenta de campanhas
 * que a equipe já opera (migration em supabase/migrations).
 */

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  /** honeypot: gente não preenche, robô preenche */
  website: z.string().max(0),
  origem: z.enum(["home", "archive", "pdp"]),
});

export type DropAccessState = { status: "idle" } | { status: "ok" } | { status: "error"; message: string };

export async function joinDropAccess(_prev: DropAccessState, form: FormData): Promise<DropAccessState> {
  const parsed = schema.safeParse({
    email: form.get("email") ?? "",
    website: form.get("website") ?? "",
    origem: form.get("origem") ?? "home",
  });
  if (!parsed.success) {
    // honeypot preenchido responde como sucesso: o robô não aprende nada
    if (form.get("website")) return { status: "ok" };
    return { status: "error", message: "Confira o e-mail e tente de novo." };
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
  const limit = await rateLimit(`loja:drop-access:${ip}`, 5, 60 * 10);
  if (!limit.ok) return { status: "error", message: "Muitas tentativas. Tente de novo em alguns minutos." };

  const supabase = getServiceSupabase();
  if (!supabase) return { status: "error", message: "Cadastro indisponível agora. Tente de novo em instantes." };

  // `upsert` por e-mail: quem já está na lista recebe o mesmo "ok", sem vazar
  // se o endereço existia.
  const { error } = await supabase
    .from("loja_drop_access")
    .upsert({ email: parsed.data.email, origem: parsed.data.origem }, { onConflict: "email", ignoreDuplicates: true });
  if (error) {
    console.error("[loja/drop-access]", error.message);
    return { status: "error", message: "Cadastro indisponível agora. Tente de novo em instantes." };
  }
  return { status: "ok" };
}
