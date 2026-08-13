/**
 * Disparo de teste do e-mail do ticket.
 *
 *   npx tsx --conditions=react-server scripts/send-desafio-esteiras-test.ts email@destino.com
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { UNITS } from "../lib/desafio-esteiras/event.config";
import { generateTicketCode, generateTicketToken } from "../lib/desafio-esteiras/ticket";
import { sendDesafioEsteirasTicketEmail } from "../lib/emails/desafio-esteiras-ticket";

function loadEnvLocal() {
  const text = readFileSync(resolve(".env.local"), "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  loadEnvLocal();

  const email = process.argv[2];
  if (!email || !email.includes("@")) {
    console.error("Uso: npx tsx --conditions=react-server scripts/send-desafio-esteiras-test.ts email@destino.com");
    process.exit(1);
  }

  const unit = UNITS.find((u) => u.id === "vicente-pires") ?? UNITS[0];
  const ticketToken = generateTicketToken();
  const ticketCode = generateTicketCode(unit);

  const result = await sendDesafioEsteirasTicketEmail({
    nome: "Alex Rodrigues",
    email,
    ticketCode,
    ticketToken,
    unit,
  });

  if (!result.ok) {
    console.error("ERROR:", result.error);
    process.exit(1);
  }

  console.log("SUCCESS id:", result.id);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
