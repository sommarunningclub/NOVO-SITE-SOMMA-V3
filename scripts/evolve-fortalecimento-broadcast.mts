/**
 * SUPERSEDIDO por /admin/campanhas. Não use.
 *
 * Este script criava um broadcast direto no Resend, sem registrar nada nas
 * tabelas da régua. Com a régua de 3 etapas isso virou uma armadilha: um disparo
 * que o banco não conhece não tem `campanha_destinatarios`, e então a etapa 2 não
 * tem contra o que calcular "quem não abriu". A régua ficaria quebrada sem erro
 * visível, só com número errado.
 *
 * Por isso ele agora se recusa a rodar, em vez de ser apagado: o histórico do
 * caminho antigo continua legível, sem a possibilidade de alguém executá-lo.
 *
 * O caminho é /admin/campanhas, que faz o mesmo e mais: prévia antes do envio,
 * importação em massa (e não um-a-um), segmento do Resend em vez da audiência
 * deprecada, e o registro que a régua precisa.
 *
 * ── documentação do que ele fazia ────────────────────────────────────────────
 *
 * Criava a audiência no Resend e agendava o broadcast da campanha Evolve.
 *
 *   npx tsx --conditions=react-server scripts/evolve-fortalecimento-broadcast.mts \
 *     <segmento.json> "<nome da audiência>" "<ISO 8601>" <segmento> [--enviar]
 *
 * Exemplo:
 *   ... segmento-cadastro-site.json "Evolve Fortalecimento · Cadastro site" \
 *       "2026-08-19T12:00:00Z" cadastro-site --enviar
 *
 * SEM --enviar o script só simula: mostra o que faria, quantos contatos, o
 * assunto e o link, sem tocar na conta. Com --enviar ele cria a audiência,
 * importa os contatos, cria o broadcast e agenda.
 *
 * Por que broadcast e não um laço de `emails.send`: o broadcast põe o cabeçalho
 * List-Unsubscribe e serve a URL de descadastro por contato, que é justamente o
 * que o projeto não tem (não existe rota /descadastrar). E respeita o rate limit
 * sozinho no envio; um laço com milhares de mensagens não.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getEmailFrom, getResendClient } from "../lib/resend";
import {
  EMAIL_HERO_URL,
  OFERTA,
  SEGMENTOS,
  evolveFortalecimentoPreheader,
  evolveFortalecimentoSubject,
  linkOferta,
  renderEvolveFortalecimentoEmail,
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

interface Contato {
  email: string;
  nome?: string | null;
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * A API do Resend limita a 2 requisições por segundo, e importar a base são
 * milhares de chamadas. Sem espaçar, a importação leva 429 no meio e o segmento
 * entra pela metade sem nada avisar. 550 ms por contato fica sob o teto com folga
 * e ainda tenta de novo quando o servidor reclama.
 */
async function comRetentativa<T>(
  fn: () => Promise<{ data: T | null; error: { message: string } | null }>,
  tentativas = 4
): Promise<{ data: T | null; error: { message: string } | null }> {
  let ultimo: { data: T | null; error: { message: string } | null } = { data: null, error: null };
  for (let i = 0; i < tentativas; i++) {
    ultimo = await fn();
    const msg = ultimo.error?.message ?? "";
    const limite = /rate|too many|429/i.test(msg);
    if (!ultimo.error || !limite) return ultimo;
    await espera(1500 * (i + 1));
  }
  return ultimo;
}

async function main() {
  console.error(
    "Este script foi supersedido pela régua em /admin/campanhas e não roda mais.\n\n" +
      "Ele criava o broadcast sem registrar em campanha_destinatarios, e sem esse\n" +
      "registro a etapa 2 não tem como calcular quem não abriu a etapa 1.\n\n" +
      "Use o painel: /admin/campanhas (Sincronizar base, Calcular prévia, Agendar)."
  );
  process.exit(1);

  // eslint-disable-next-line no-unreachable
  loadEnvLocal();

  const [arquivo, nomeAudiencia, agendamento, segmentoArg] = process.argv.slice(2);
  const enviar = process.argv.includes("--enviar");

  if (!arquivo || !nomeAudiencia || !agendamento || !segmentoArg) {
    console.error(
      'Uso: ... <segmento.json> "<nome da audiência>" "<ISO 8601>" <segmento> [--enviar]\n' +
        `segmento: ${SEGMENTOS.join(" | ")}`
    );
    process.exit(1);
  }
  if (!SEGMENTOS.includes(segmentoArg as SegmentoBase)) {
    console.error(`Segmento "${segmentoArg}" inválido. Use: ${SEGMENTOS.join(" | ")}`);
    process.exit(1);
  }
  const segmento = segmentoArg as SegmentoBase;

  const quando = new Date(agendamento);
  if (Number.isNaN(quando.getTime())) {
    console.error(
      `Agendamento "${agendamento}" não é uma data reconhecível. Use ISO 8601, ex.: 2026-08-19T12:00:00Z`
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
   * O banner é servido por URL no disparo real, e a URL é de um arquivo novo.
   * Se o deploy ainda não subiu, o broadcast sai com um retângulo quebrado para a
   * base inteira, e não há como recolher. Então o disparo simplesmente não passa
   * daqui antes do arquivo existir em produção.
   */
  const head = await fetch(EMAIL_HERO_URL, { method: "HEAD" });
  const bannerOk = head.ok && (head.headers.get("content-type") ?? "").startsWith("image/");
  console.log(`Banner:      ${EMAIL_HERO_URL} ${bannerOk ? "OK" : `INDISPONÍVEL (${head.status})`}`);
  if (!bannerOk) {
    console.error(
      "\nO banner ainda não está publicado. Faça o deploy de\n" +
        "  public/evolve-fortalecimento/email/hero-banner.jpg\n" +
        "antes de criar o broadcast."
    );
    process.exit(1);
  }

  const href = linkOferta(segmento, { medium: "broadcast" });
  const assunto = evolveFortalecimentoSubject();

  /**
   * O broadcast injeta o nome e a URL de descadastro por contato nestas
   * variáveis. O `|corredor` é o padrão do Resend quando o contato não tem
   * primeiro nome: sem ele o título do e-mail chegaria como "OI, !" para toda a
   * fatia da base que entrou sem nome preenchido.
   */
  const html = renderEvolveFortalecimentoEmail({
    nome: "{{{FIRST_NAME|corredor}}}",
    segmento,
    href,
    descadastroUrl: "{{{RESEND_UNSUBSCRIBE_URL}}}",
  });

  console.log(`Segmento:    ${segmento}`);
  console.log(`Audiência:   ${nomeAudiencia}`);
  console.log(`Contatos:    ${contatos.length}`);
  console.log(`Remetente:   ${from}`);
  console.log(`Assunto:     ${assunto}`);
  console.log(`Preheader:   ${evolveFortalecimentoPreheader()}`);
  console.log(`Oferta:      ${OFERTA.chamadaPreco} ${OFERTA.precoLabel} ${OFERTA.complemento}`);
  console.log(`Destino:     ${href}`);
  console.log(`Agendamento: ${quando.toISOString()} (${quando.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} em Brasília)`);
  console.log(`HTML:        ${(Buffer.byteLength(html, "utf8") / 1024).toFixed(1)} KB`);

  if (!enviar) {
    const minutos = Math.ceil((contatos.length * 0.55) / 60);
    console.log(
      `\n[simulação] Nada foi criado. Repita com --enviar para valer.\n` +
        `A importação de ${contatos.length} contatos leva cerca de ${minutos} min no ritmo da API.`
    );
    return;
  }

  const { data: audiencia, error: erroAud } = await resend.audiences.create({ name: nomeAudiencia });
  if (erroAud || !audiencia) {
    console.error("Erro ao criar audiência:", erroAud);
    process.exit(1);
  }
  console.log(`\nAudiência criada: ${audiencia.id}`);

  let importados = 0;
  const falhas: string[] = [];
  for (const c of contatos) {
    const nome = String(c.nome ?? "").trim().split(/\s+/);
    const { error } = await comRetentativa(() =>
      resend.contacts.create({
        audienceId: audiencia.id,
        email: c.email,
        firstName: nome[0] || undefined,
        lastName: nome.slice(1).join(" ") || undefined,
        unsubscribed: false,
      })
    );
    if (error) {
      falhas.push(`${c.email}: ${error.message}`);
      if (falhas.length <= 5) console.warn(`  falha em ${c.email}: ${error.message}`);
    } else {
      importados++;
    }
    if (importados % 100 === 0) {
      process.stdout.write(`  ${importados}/${contatos.length} importados\r`);
    }
    await espera(550);
  }
  console.log(`\nContatos importados: ${importados} (falhas: ${falhas.length})`);

  if (importados === 0) {
    console.error("Nenhum contato entrou. Broadcast não criado.");
    process.exit(1);
  }

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
    scheduledAt: quando.toISOString(),
  });
  if (erroEnvio) {
    console.error("Erro ao agendar:", erroEnvio);
    process.exit(1);
  }
  console.log(`AGENDADO para ${quando.toISOString()} · id ${envio?.id ?? broadcast.id}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
