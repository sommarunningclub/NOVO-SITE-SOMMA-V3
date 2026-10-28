/**
 * Preenche o telefone das inscrições do Love Run feitas ANTES do campo
 * WhatsApp existir no formulário (28/10/2026), usando o WhatsApp que a pessoa
 * já tinha no cadastro do Somma (`cadastro_site.whatsapp`).
 *
 *   npx tsx scripts/love-run-telefones-retroativo.mts            # só mostra
 *   npx tsx scripts/love-run-telefones-retroativo.mts --aplicar  # grava
 *
 * Só escreve onde o telefone está vazio e só com celular válido, na inscrição
 * (`evento_participantes`) e na lista da gestão (`checkins`). Idempotente.
 * Lê o .env.local; não imprime dado pessoal.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { checarCelularBR, normalizarTelefoneBR } from "../lib/telefone";

const EVENTO = "052dec12-4e69-4df8-a824-28937a80fd5e";
const APLICAR = process.argv.includes("--aplicar");

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")])
);
const sb = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: parts, error } = await sb
  .from("evento_participantes")
  .select("id, pessoa_id, cpf, telefone")
  .eq("evento_id", EVENTO)
  .neq("status", "cancelado");
if (error) throw new Error(error.message);

const semFone = (parts ?? []).filter((p) => !p.telefone);
const { data: cad } = await sb.from("cadastro_site").select("id, whatsapp").in("id", semFone.map((p) => p.pessoa_id));
const foneDe = new Map((cad ?? []).map((c) => [c.id, normalizarTelefoneBR(c.whatsapp ?? "")]));

let gravadas = 0, invalidas = 0, semNumero = 0;
for (const p of semFone) {
  const t = foneDe.get(p.pessoa_id) ?? "";
  if (!t) { semNumero++; continue; }
  if (!checarCelularBR(t).ok) { invalidas++; continue; }
  if (APLICAR) {
    const cpf = String(p.cpf).replace(/\D/g, "");
    const mascarado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
    const a = await sb.from("evento_participantes").update({ telefone: t }).eq("id", p.id).is("telefone", null);
    const b = await sb.from("checkins").update({ telefone: t }).eq("evento_id", EVENTO).in("cpf", [cpf, mascarado]).or("telefone.is.null,telefone.eq.");
    if (a.error || b.error) { console.error("erro:", a.error?.message ?? b.error?.message); continue; }
  }
  gravadas++;
}

console.log(
  `${APLICAR ? "Gravado" : "Simulação (rode com --aplicar para gravar)"}: ${semFone.length} inscrições sem telefone; ` +
    `${gravadas} ${APLICAR ? "preenchidas" : "seriam preenchidas"} pelo cadastro; ${invalidas} com número inválido no cadastro; ${semNumero} sem número no cadastro.`
);
