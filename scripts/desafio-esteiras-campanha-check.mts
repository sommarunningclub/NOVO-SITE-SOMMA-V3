/**
 * Guardas dos e-mails de campanha antes do disparo para a base.
 *
 *   npx tsx --conditions=react-server scripts/desafio-esteiras-campanha-check.mts [vagasRestantes]
 *
 * Roda as três variantes. Não substitui o preview visual
 * (/desafios-das-esteiras-evolve/email-preview/campanha); checa o que o olho não
 * pega: peso do HTML (o Gmail corta em 102 KB e leva o rodapé junto com o
 * descadastro), travessão na copy, CSS que caixa de entrada ignora, links sem
 * UTM e tags desbalanceadas.
 */
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { VAGAS_TOTAIS } from "../lib/desafio-esteiras/event.config";
import {
  VARIANTES,
  campanhaRotulo,
  contagemLabel,
  desafioEsteirasCampanhaPreheader,
  desafioEsteirasCampanhaSubject,
  diasParaOEvento,
  renderDesafioEsteirasCampanhaEmail,
  type VarianteCampanha,
} from "../lib/emails/desafio-esteiras-campanha";

const VAGAS = process.argv[2] ? Number(process.argv[2]) : 83;

let falhasTotais = 0;

/** Só o texto visível: sem tags, sem comentários HTML, sem <style>. */
function textoVisivel(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ");
}

function checar(variante: VarianteCampanha) {
  const opts = { vagasRestantes: VAGAS };
  const assunto = desafioEsteirasCampanhaSubject(variante, opts);
  const preheader = desafioEsteirasCampanhaPreheader(variante, opts);
  const html = renderDesafioEsteirasCampanhaEmail({
    variante,
    nome: "Marina Souza",
    vagasRestantes: VAGAS,
    descadastroUrl: "https://sommaclub.com.br/descadastrar",
  });
  const kb = Buffer.byteLength(html, "utf8") / 1024;
  const visivel = textoVisivel(html);

  console.log(`\n${"═".repeat(70)}`);
  console.log(`${campanhaRotulo(variante).toUpperCase()}  (${variante})`);
  console.log("═".repeat(70));
  console.log(`Assunto:   ${assunto}  [${assunto.length} caracteres]`);
  console.log(`Preheader: ${preheader}`);
  console.log(`HTML:      ${kb.toFixed(1)} KB`);

  let falhas = 0;
  const checa = (nome: string, ok: boolean, detalhe = "") => {
    if (!ok) { falhas++; falhasTotais++; }
    console.log(`  ${ok ? "✓" : "✗"} ${nome}${ok || !detalhe ? "" : ` ${detalhe}`}`);
  };

  const imgs = html.match(/<img\b[^>]*>/g) ?? [];
  const links = html.match(/href="(https:\/\/sommaclub\.com\.br[^"]*)"/g) ?? [];
  const linksSite = links.filter((h) => !h.includes("/descadastrar"));

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
    imgs.every((t) => /\balt=/.test(t) && /\bwidth=/.test(t) && /\bheight=/.test(t))
  );
  checa("nenhum href relativo", !/href="\/(?!\/)/.test(html));
  checa("UTM em todo link do site", linksSite.every((h) => h.includes("utm_")));
  checa("UTM identifica a variante", linksSite.every((h) => h.includes(`utm_content=${variante}`)));
  checa("link de descadastro presente", html.includes("Descadastrar"));
  checa("<table> balanceadas", (html.match(/<table/g) ?? []).length === (html.match(/<\/table>/g) ?? []).length);
  checa("<td> balanceadas", (html.match(/<td/g) ?? []).length === (html.match(/<\/td>/g) ?? []).length);
  checa("<tr> balanceadas", (html.match(/<tr/g) ?? []).length === (html.match(/<\/tr>/g) ?? []).length);

  const out = join(tmpdir(), `desafio-esteiras-${variante}.html`);
  writeFileSync(out, html);
  console.log(`  arquivo: ${out}`);
  return falhas;
}

console.log(`Contagem: ${contagemLabel()} (${diasParaOEvento()} dias) · ${VAGAS} de ${VAGAS_TOTAIS} vagas abertas`);
for (const v of VARIANTES) checar(v);

console.log(`\n${falhasTotais === 0 ? "Todas as variantes passaram." : `${falhasTotais} guarda(s) falharam.`}`);
process.exit(falhasTotais === 0 ? 0 : 1);
