/**
 * Guardas do e-mail da campanha Evolve antes do disparo para a base.
 *
 *   npx tsx --conditions=react-server scripts/evolve-fortalecimento-check.mts
 *
 * Não substitui o preview visual (/dev/emails/evolve-fortalecimento); checa o
 * que o olho não pega: peso do HTML (o Gmail corta em 102 KB e leva o rodapé
 * junto com o descadastro), travessão na copy, CSS que caixa de entrada ignora,
 * links sem UTM e tags desbalanceadas.
 */
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ETAPAS,
  OFERTA,
  SEGMENTOS,
  UTM_CAMPAIGN,
  etapaRotulo,
  evolveFortalecimentoPreheader,
  evolveFortalecimentoSubject,
  linkOferta,
  renderEvolveFortalecimentoEmail,
  type EtapaRegua,
  type SegmentoBase,
} from "../lib/emails/evolve-fortalecimento";

let falhasTotais = 0;

/** Só o texto visível: sem tags, sem comentários HTML, sem <style>. */
function textoVisivel(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ");
}

function checar(etapa: EtapaRegua, segmento: SegmentoBase) {
  const assunto = evolveFortalecimentoSubject(etapa);
  const preheader = evolveFortalecimentoPreheader(etapa);
  const html = renderEvolveFortalecimentoEmail({
    nome: "Marina Souza",
    segmento,
    etapa,
    descadastroUrl: "https://sommaclub.com.br/descadastrar",
  });
  const kb = Buffer.byteLength(html, "utf8") / 1024;
  const visivel = textoVisivel(html);

  console.log(`\n${"═".repeat(70)}`);
  console.log(`ETAPA ${etapa} · ${etapaRotulo(etapa).toUpperCase()} · ${segmento.toUpperCase()}`);
  console.log("═".repeat(70));
  console.log(`Assunto:   ${assunto}  [${assunto.length} caracteres]`);
  console.log(`Preheader: ${preheader}`);
  console.log(`Destino:   ${linkOferta(segmento, { etapa })}`);
  console.log(`HTML:      ${kb.toFixed(1)} KB`);

  let falhas = 0;
  const checa = (nome: string, ok: boolean, detalhe = "") => {
    if (!ok) { falhas++; falhasTotais++; }
    console.log(`  ${ok ? "✓" : "✗"} ${nome}${ok || !detalhe ? "" : ` ${detalhe}`}`);
  };

  const imgs = html.match(/<img\b[^>]*>/g) ?? [];
  const hrefs = (html.match(/href="([^"]+)"/g) ?? []).map((h) => h.slice(6, -1));
  const linksEvolve = hrefs.filter((h) => h.includes("academiaevolve.com.br"));

  // Regra de copy do projeto: sem travessão em nada que a pessoa lê.
  const travessaoCorpo = (visivel.match(/[—–]/g) ?? []).length;
  const travessaoAssunto = (`${assunto} ${preheader}`.match(/[—–]/g) ?? []).length;

  checa("sem travessão no corpo", travessaoCorpo === 0, `(${travessaoCorpo} encontrados)`);
  checa("sem travessão no assunto/preheader", travessaoAssunto === 0);
  checa("assunto cabe na inbox (< 78 caracteres)", assunto.length < 78, `(${assunto.length})`);
  checa("cabe no Gmail sem corte (< 102 KB)", kb < 102, `(${kb.toFixed(1)} KB)`);
  checa("sem flexbox/grid", !/display:\s*(flex|grid)/.test(html));
  checa("sem gradient", !/gradient/i.test(html));
  checa("sem <script>", !/<script/i.test(html));
  checa("preheader oculto", html.includes("mso-hide:all"));
  checa("dark mode do Gmail travado", html.includes('content="light only"'));
  checa("fallback do Outlook (mso)", html.includes("[if mso]"));
  checa(
    "toda imagem com alt, width e height",
    imgs.every((t) => /\balt="[^"]/.test(t) && /\bwidth=/.test(t) && /\bheight=/.test(t))
  );
  checa("nenhum href relativo", !/href="\/(?!\/)/.test(html));
  checa("todo link aponta para a Evolve ou o descadastro",
    hrefs.every((h) => h.includes("academiaevolve.com.br") || h.includes("descadastrar")));
  checa("link da oferta existe", linksEvolve.length > 0, `(${linksEvolve.length})`);
  checa("UTM em todo link da Evolve", linksEvolve.every((h) => h.includes("utm_source=sommaclub")));
  checa("UTM nomeia a campanha", linksEvolve.every((h) => h.includes(`utm_campaign=${UTM_CAMPAIGN}`)));
  // Um campo só carrega etapa e base, que são as duas perguntas da Evolve.
  checa(
    "UTM identifica etapa e base",
    linksEvolve.every((h) => h.includes(`utm_content=etapa-${etapa}-${segmento}`))
  );
  checa("parâmetro origem legível", linksEvolve.every((h) => h.includes("origem=somma-club")));
  checa("link de descadastro presente", html.includes("Descadastrar"));

  // O preço não pode depender de imagem: é o que sobra quando a caixa de
  // entrada bloqueia o banner.
  checa("preço é texto no corpo", visivel.includes(OFERTA.precoLabel));
  checa("plano nomeado no corpo", visivel.toLowerCase().includes("plano fit"));
  checa("gancho preservado no alt do banner",
    imgs.some((t) => /alt="Você já corre todo sábado/.test(t)));

  checa("<table> balanceadas", (html.match(/<table/g) ?? []).length === (html.match(/<\/table>/g) ?? []).length);
  checa("<td> balanceadas", (html.match(/<td/g) ?? []).length === (html.match(/<\/td>/g) ?? []).length);
  checa("<tr> balanceadas", (html.match(/<tr/g) ?? []).length === (html.match(/<\/tr>/g) ?? []).length);

  const out = join(tmpdir(), `evolve-fortalecimento-etapa${etapa}-${segmento}.html`);
  writeFileSync(out, html);
  console.log(`  arquivo: ${out}`);
  return falhas;
}

console.log(`Oferta: ${OFERTA.chamadaPreco} ${OFERTA.precoLabel} ${OFERTA.complemento} (${OFERTA.janela})`);
for (const etapa of ETAPAS) for (const s of SEGMENTOS) checar(etapa, s);

/* Assunto repetido entre etapas anula a régua: a etapa 2 vai justamente para quem
   já ignorou aquele assunto uma vez. */
const assuntos = ETAPAS.map((e) => evolveFortalecimentoSubject(e));
if (new Set(assuntos).size !== assuntos.length) {
  console.log("\n✗ Há assunto repetido entre as etapas da régua.");
  falhasTotais++;
} else {
  console.log("\n✓ Os assuntos das três etapas são distintos.");
}

console.log(`\n${falhasTotais === 0 ? "Todas as etapas passaram." : `${falhasTotais} guarda(s) falharam.`}`);
process.exit(falhasTotais === 0 ? 0 : 1);
