/**
 * Gera o cache de fontes do Google usado no build (ver README.md ao lado).
 * Entrada: captura.jsonl com uma linha {url, css} por pedido do next/font.
 * Saída: arquivos/*.woff2 e respostas.json com o CSS apontando para eles.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const [, , captura] = process.argv;
if (!captura) throw new Error("uso: node scripts/fontes-google/gerar.cjs captura.jsonl");
const pasta = __dirname;
const linhas = fs.readFileSync(captura, "utf8").trim().split("\n").map((l) => JSON.parse(l));

(async () => {
  const respostas = {};
  const baixados = new Map();
  for (const { url, css } of linhas) {
    let saida = css;
    for (const [, remoto] of css.matchAll(/src: url\((.+?)\)/g)) {
      if (!baixados.has(remoto)) {
        const ext = (/\.(woff2|woff|ttf|otf|eot)$/.exec(remoto) || [, "woff2"])[1];
        const nome = crypto.createHash("sha1").update(remoto).digest("hex").slice(0, 16) + "." + ext;
        const destino = path.join(pasta, "arquivos", nome);
        if (!fs.existsSync(destino)) {
          const r = await fetch(remoto);
          if (!r.ok) throw new Error(`falhou ${r.status} ${remoto}`);
          fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
        }
        baixados.set(remoto, nome);
      }
      saida = saida.split(`url(${remoto})`).join(`url(__PASTA__/arquivos/${baixados.get(remoto)})`);
    }
    respostas[url] = saida;
  }
  fs.writeFileSync(path.join(pasta, "respostas.json"), JSON.stringify(respostas, null, 1) + "\n");
  console.log(Object.keys(respostas).length, "pedidos,", baixados.size, "arquivos");
})();
