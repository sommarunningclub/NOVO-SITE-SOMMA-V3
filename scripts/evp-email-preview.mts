/**
 * Prévia local do e-mail de confirmação do Meeting Técnico (confirmada e lista
 * de espera). Não envia nada.
 *
 *   npx tsx --conditions=react-server scripts/evp-email-preview.mts [saida.html]
 */
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import QRCode from "qrcode";
import { montarEmail } from "../lib/evp/email";

const saida = resolve(process.argv[2] ?? join(process.cwd(), "evp-email-preview.html"));
const qr = await QRCode.toDataURL("SOMMA-EVP:exemplo-de-identificador", {
  margin: 1,
  width: 400,
  errorCorrectionLevel: "M",
  color: { dark: "#080808", light: "#F4F1EA" },
});
const base = {
  nome: "Maria Souza",
  email: "maria@exemplo.com",
  codigo: "MT-BM9JGF",
  ticketToken: "exemplo",
  distancia: "21k" as const,
  evento: { starts_at: null, ends_at: null, local_nome: null, endereco: null },
  motivo: "inscricao" as const,
};
// As logos vêm de public/ pelo caminho do disco: a prévia não depende do site no ar.
const disco = "file://" + resolve("public");
const confirmada = montarEmail({ ...base, status: "confirmada" }, qr, disco);
const espera = montarEmail({ ...base, status: "lista_espera", posicaoFila: 3 }, null, disco);

const quadro = (titulo: string, e: { subject: string; html: string }) =>
  `<div style="flex:1;min-width:340px;max-width:620px"><p style="font:13px sans-serif;color:#333;margin:0 0 8px"><b>${titulo}</b><br>Assunto: ${e.subject}</p><iframe style="width:100%;height:1150px;border:1px solid #ccc" srcdoc="${e.html.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"></iframe></div>`;

writeFileSync(
  saida,
  `<!doctype html><meta charset="utf-8"><body style="margin:0;padding:20px;background:#eee;display:flex;gap:20px;flex-wrap:wrap">${quadro("Vaga confirmada", confirmada)}${quadro("Lista de espera", espera)}</body>`
);
console.log("Prévia em", saida);
