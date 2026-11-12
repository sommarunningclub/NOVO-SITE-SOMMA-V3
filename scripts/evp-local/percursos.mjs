/**
 * Carrega os GPX de docs/maratonamonumental2026/percursos no site LOCAL (banco
 * de mentira), pelo mesmo caminho do painel: envio, relatório e publicação.
 *
 *   node scripts/evp-local/percursos.mjs
 *
 * Em produção isso se faz à mão, no painel, aba Percursos: é ali que alguém
 * confere o traçado com o mapa oficial antes de publicar.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = process.env.SITE || "http://localhost:3120";
if (!/localhost|127\.0\.0\.1/.test(SITE)) {
  console.error("Este script só roda contra localhost.");
  process.exit(1);
}
const pasta = join(dirname(fileURLToPath(import.meta.url)), "../../docs/maratonamonumental2026/percursos");
const ARQUIVOS = [
  { distancia: "21k", arquivo: "21k-Corrida_matinal.gpx" },
  { distancia: "42k", arquivo: "42k-Maratona_Monumental.gpx" },
];
const FONTE = "gravação de GPS (Strava) de uma corrida no percurso, enviada pela equipe do SOMMA Club";

const login = await fetch(`${SITE}/api/evp/equipe/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "", senha: process.env.EVP_ADMIN_SENHA || "senha-local-de-teste" }),
});
const cookie = login.headers.get("set-cookie")?.split(";")[0];
if (!login.ok || !cookie) throw new Error("Login local falhou");

for (const { distancia, arquivo } of ARQUIVOS) {
  const f = new FormData();
  f.set("distancia", distancia);
  f.set("fonte", FONTE);
  f.set("arquivo", new Blob([readFileSync(join(pasta, arquivo))]), arquivo);
  const r = await fetch(`${SITE}/api/evp/admin/percurso`, { method: "POST", headers: { cookie }, body: f });
  const j = await r.json();
  if (!r.ok) {
    console.log(distancia, "RECUSADO:", j.error);
    continue;
  }
  const rel = j.relatorio;
  console.log(
    `${distancia}: ${(rel.comprimento_m / 1000).toFixed(2)} km medidos, ${rel.diferenca_pct}% do oficial, ` +
      `${rel.pontos_no_arquivo} pontos no arquivo, ${rel.pontos} no mapa`
  );
  rel.avisos.forEach((a) => console.log("   aviso:", a));
  const p = await fetch(`${SITE}/api/evp/admin/percurso`, {
    method: "PATCH",
    headers: { cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ distancia, acao: "publicar", conferido: true }),
  });
  console.log("   publicado no local:", p.ok);
}
