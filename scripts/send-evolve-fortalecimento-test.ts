/**
 * Disparo de teste da campanha Evolve.
 *
 *   npx tsx --conditions=react-server scripts/send-evolve-fortalecimento-test.ts email@destino.com [nome] [segmento]
 *
 * Vai para UM endereço só: é revisão, não base.
 *
 * O banner vai como anexo inline (cid:) em vez de URL: o arquivo é novo e a URL
 * de produção só responde depois do deploy, então o teste chegaria com a imagem
 * quebrada. As logos já estão publicadas e vão por URL, como no disparo real.
 *
 * O link da oferta sai com `utm_medium=teste`, para o clique de revisão não
 * entrar na conta que a Evolve vai olhar depois.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getEmailFrom, getResendClient } from "../lib/resend";
import {
  ETAPAS,
  OFERTA,
  etapaRotulo,
  evolveFortalecimentoPreheader,
  evolveFortalecimentoSubject,
  linkOferta,
  renderEvolveFortalecimentoEmail,
  type EtapaRegua,
  type SegmentoBase,
} from "../lib/emails/evolve-fortalecimento";

function loadEnvLocal() {
  const text = readFileSync(resolve(".env.local"), "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const HERO_CID = "hero-banner";

async function main() {
  loadEnvLocal();

  const email = process.argv[2];
  if (!email || !email.includes("@")) {
    console.error(
      "Uso: ... send-evolve-fortalecimento-test.ts email@destino.com [nome] [etapa|todas] [segmento]"
    );
    process.exit(1);
  }
  const nome = process.argv[3] ?? null;
  const etapaArg = process.argv[4] ?? "1";
  const segmento = (process.argv[5] as SegmentoBase | undefined) ?? "teste";

  // "todas" manda as três de uma vez, para revisar a régua inteira na caixa.
  const alvos: EtapaRegua[] =
    etapaArg === "todas"
      ? [...ETAPAS]
      : ETAPAS.includes(Number(etapaArg) as EtapaRegua)
        ? [Number(etapaArg) as EtapaRegua]
        : [];
  if (alvos.length === 0) {
    console.error(`Etapa inválida. Use ${ETAPAS.join(", ")} ou "todas".`);
    process.exit(1);
  }

  const resend = getResendClient();
  const from = getEmailFrom();
  if (!resend || !from) {
    console.error("Resend não configurado (RESEND_API_KEY / VIP_EMAIL_FROM).");
    process.exit(1);
  }

  const banner = readFileSync(resolve("public/evolve-fortalecimento/email/hero-banner.jpg"));

  console.log(`Para:      ${email}`);
  console.log(`Remetente: ${from}`);
  console.log(`Oferta:    ${OFERTA.chamadaPreco} ${OFERTA.precoLabel} ${OFERTA.complemento}\n`);

  for (const etapa of alvos) {
    const href = linkOferta(segmento, { medium: "teste", etapa });
    const assunto = evolveFortalecimentoSubject(etapa);
    const html = renderEvolveFortalecimentoEmail({
      nome,
      segmento,
      etapa,
      href,
      heroSrc: `cid:${HERO_CID}`,
      // Sem descadastro: a rota não existe, e um teste não deve apontar para 404.
      // No broadcast real, o Resend injeta a URL própria dele.
      descadastroUrl: null,
    });

    const { data, error } = await resend.emails.send({
      from,
      to: email,
      // O prefixo existe só no teste, para as três não se confundirem na caixa.
      subject: `[TESTE ${etapa}/3] ${assunto}`,
      html,
      attachments: [{ filename: "hero-banner.jpg", content: banner, contentId: HERO_CID }],
    });

    if (error) {
      console.error(`etapa ${etapa}: ERRO`, error);
      continue;
    }
    console.log(
      `etapa ${etapa} · ${etapaRotulo(etapa).padEnd(15)} ${(Buffer.byteLength(html, "utf8") / 1024).toFixed(1)} KB  id ${data?.id}`
    );
    console.log(`  assunto:   ${assunto}`);
    console.log(`  preheader: ${evolveFortalecimentoPreheader(etapa)}`);
    console.log(`  destino:   ${href}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
