/**
 * Cria as audiências no Resend e agenda os dois broadcasts do convite.
 *
 *   npx tsx --conditions=react-server scripts/desafio-esteiras-broadcast.mts <segmento.json> "<nome da audiência>" "<agendamento>" [--enviar]
 *
 * Exemplo:
 *   ... segmento-A-checkins.json "Desafio Esteiras · Check-ins" "2026-08-16T13:00:00Z" --enviar
 *
 * SEM --enviar o script só simula: mostra o que faria, quantos contatos e o
 * assunto, sem tocar na conta. Com --enviar ele cria a audiência, importa os
 * contatos, cria o broadcast e agenda.
 *
 * Por que broadcast e não um laço de `emails.send`: o broadcast do Resend põe
 * o cabeçalho List-Unsubscribe e serve a URL de descadastro por contato — que
 * é justamente o que o projeto não tem (não existe rota /descadastrar). Além
 * disso ele respeita o rate limit sozinho; um laço com milhares de envios não.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { VAGAS_TOTAIS } from "../lib/desafio-esteiras/event.config";
import { getEmailFrom, getResendClient } from "../lib/resend";
import {
  campanhaRotulo,
  contagemLabel,
  desafioEsteirasCampanhaPreheader,
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

interface Contato {
  email: string;
  nome?: string | null;
}

async function main() {
  loadEnvLocal();

  const [arquivo, nomeAudiencia, agendamento, varianteArg] = process.argv.slice(2);
  const variante = (varianteArg ?? "convite") as VarianteCampanha;
  const enviar = process.argv.includes("--enviar");
  const vagasArg = process.argv.find((a) => a.startsWith("--vagas="));
  const vagasRestantes = vagasArg ? Number(vagasArg.split("=")[1]) : null;

  if (!arquivo || !nomeAudiencia || !agendamento) {
    console.error(
      'Uso: ... <segmento.json> "<nome da audiência>" "<ISO 8601>" [variante] [--enviar] [--vagas=N]'
    );
    process.exit(1);
  }

  const contatos: Contato[] = JSON.parse(readFileSync(arquivo, "utf8"));
  const resend = getResendClient();
  const from = getEmailFrom();
  if (!resend || !from) {
    console.error("Resend não configurado.");
    process.exit(1);
  }

  /**
   * A contagem regressiva é congelada no momento em que o HTML é gerado, e um
   * broadcast é gerado agora para sair depois. Sem isto, um e-mail criado no
   * sábado e disparado na segunda chegaria dizendo "faltam 4 dias" quando
   * faltam 2 — e o selo do rodapé mentiria junto. Renderizamos com a data do
   * disparo, não com a de hoje.
   */
  const dataDisparo = new Date(agendamento);
  if (Number.isNaN(dataDisparo.getTime())) {
    console.error(
      `Agendamento "${agendamento}" não é uma data reconhecível. Use ISO 8601, ex.: 2026-08-17T12:00:00Z`
    );
    process.exit(1);
  }

  // O broadcast injeta a URL de descadastro por contato nesta variável.
  const html = renderDesafioEsteirasCampanhaEmail({
    variante,
    nome: "{{{FIRST_NAME|}}}",
    vagasRestantes,
    agora: dataDisparo,
    utm: "utm_source=email&utm_medium=broadcast&utm_campaign=desafio-esteiras",
    descadastroUrl: "{{{RESEND_UNSUBSCRIBE_URL}}}",
  });

  const assunto = desafioEsteirasCampanhaSubject(variante, { agora: dataDisparo, vagasRestantes });

  console.log(`Variante:    ${campanhaRotulo(variante)} (${variante})`);
  console.log(`Audiência:   ${nomeAudiencia}`);
  console.log(`Contatos:    ${contatos.length}`);
  console.log(`Remetente:   ${from}`);
  console.log(`Assunto:     ${assunto}`);
  console.log(`Preheader:   ${desafioEsteirasCampanhaPreheader(variante, { agora: dataDisparo, vagasRestantes })}`);
  console.log(`Agendamento: ${agendamento}`);
  console.log(
    `Corpo:       ${contagemLabel(dataDisparo)}${
      vagasRestantes === null ? ` (regra dos ${VAGAS_TOTAIS})` : ` · ${vagasRestantes} vagas abertas`
    }`
  );

  if (!enviar) {
    console.log("\n[simulação] Nada foi criado. Repita com --enviar para valer.");
    return;
  }

  const { data: audiencia, error: erroAud } = await resend.audiences.create({ name: nomeAudiencia });
  if (erroAud || !audiencia) {
    console.error("Erro ao criar audiência:", erroAud);
    process.exit(1);
  }
  console.log(`\nAudiência criada: ${audiencia.id}`);

  let importados = 0;
  let falhas = 0;
  for (const c of contatos) {
    const nome = String(c.nome ?? "").trim().split(/\s+/);
    const { error } = await resend.contacts.create({
      audienceId: audiencia.id,
      email: c.email,
      firstName: nome[0] || undefined,
      lastName: nome.slice(1).join(" ") || undefined,
      unsubscribed: false,
    });
    if (error) {
      falhas++;
      if (falhas <= 5) console.warn(`  falha em ${c.email}: ${error.message}`);
    } else {
      importados++;
    }
    if (importados % 250 === 0) process.stdout.write(`  ${importados}/${contatos.length}\r`);
  }
  console.log(`\nContatos importados: ${importados} (falhas: ${falhas})`);

  const { data: broadcast, error: erroBc } = await resend.broadcasts.create({
    audienceId: audiencia.id,
    from,
    subject: assunto,
    html,
  });
  if (erroBc || !broadcast) {
    console.error("Erro ao criar broadcast:", erroBc);
    process.exit(1);
  }
  console.log(`Broadcast criado: ${broadcast.id}`);

  const { data: envio, error: erroEnvio } = await resend.broadcasts.send({
    broadcastId: broadcast.id,
    scheduledAt: agendamento,
  });
  if (erroEnvio) {
    console.error("Erro ao agendar:", erroEnvio);
    process.exit(1);
  }
  console.log(`AGENDADO para ${agendamento} · id ${envio?.id ?? broadcast.id}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
