/**
 * Disparo de teste das três variantes da campanha.
 *
 *   npx tsx --conditions=react-server scripts/send-desafio-esteiras-campanha-test.ts email@destino.com [vagas] [variante]
 *
 * Sem `variante`, manda as três. Vai para UM endereço só: é revisão, não base.
 *
 * Cada variante é renderizada com a data em que ela deve sair de verdade, e não
 * com a de hoje. A contagem regressiva do e-mail é congelada na geração, então
 * revisar o "última chamada" com a data de hoje mostraria "faltam 4 dias" onde
 * a pessoa vai ler "é amanhã".
 *
 * O banner vai como anexo inline (cid:) em vez de URL: enquanto o arquivo não
 * estiver publicado, a URL de produção responde 404 e o teste chegaria com a
 * imagem quebrada. Em produção o template usa a URL pública.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getEmailFrom, getResendClient } from "../lib/resend";
import {
  VARIANTES,
  campanhaRotulo,
  contagemLabel,
  desafioEsteirasCampanhaSubject,
  renderDesafioEsteirasCampanhaEmail,
  type VarianteCampanha,
} from "../lib/emails/desafio-esteiras-campanha";

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

/** Data de disparo prevista de cada variante (horário de Brasília). */
const AGENDA: Record<VarianteCampanha, string> = {
  convite: "2026-08-16T10:00:00-03:00",
  vagas: "2026-08-17T09:00:00-03:00",
  "ultima-chamada": "2026-08-18T09:00:00-03:00",
};

const dia = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

async function main() {
  loadEnvLocal();

  const email = process.argv[2];
  if (!email || !email.includes("@")) {
    console.error("Uso: ... send-desafio-esteiras-campanha-test.ts email@destino.com [vagas] [variante]");
    process.exit(1);
  }
  const vagasRestantes = process.argv[3] ? Number(process.argv[3]) : null;
  const filtro = process.argv[4] as VarianteCampanha | undefined;
  const alvos = filtro ? [filtro] : [...VARIANTES];

  const resend = getResendClient();
  const from = getEmailFrom();
  if (!resend || !from) {
    console.error("Resend não configurado (RESEND_API_KEY / VIP_EMAIL_FROM).");
    process.exit(1);
  }

  const banner = readFileSync(resolve("public/desafio-esteiras-evolve/email/hero-banner.jpg"));

  for (const variante of alvos) {
    const agora = new Date(AGENDA[variante]);
    const assunto = desafioEsteirasCampanhaSubject(variante, { agora, vagasRestantes });
    const html = renderDesafioEsteirasCampanhaEmail({
      variante,
      nome: "Alex",
      vagasRestantes,
      agora,
      heroSrc: `cid:${HERO_CID}`,
      utm: `utm_source=email&utm_medium=teste&utm_campaign=desafio-esteiras&utm_content=${variante}`,
      // Sem descadastro: a rota não existe, e um teste não deve apontar para 404.
      // No broadcast real, o Resend injeta a URL própria dele.
      descadastroUrl: null,
    });

    const { data, error } = await resend.emails.send({
      from,
      to: email,
      // O prefixo existe só no teste, para os três não se confundirem na caixa.
      subject: `[${campanhaRotulo(variante)}] ${assunto}`,
      html,
      attachments: [{ filename: "hero-banner.jpg", content: banner, contentId: HERO_CID }],
    });

    if (error) {
      console.error(`${variante}: ERRO`, error);
      continue;
    }
    console.log(
      `${campanhaRotulo(variante).padEnd(16)} ${dia(AGENDA[variante]).padEnd(22)} ${contagemLabel(agora).padEnd(14)} id ${data?.id}`
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
