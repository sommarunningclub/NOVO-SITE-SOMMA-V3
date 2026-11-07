/**
 * Lido pelo next/font via NEXT_FONT_GOOGLE_MOCKED_RESPONSES no `npm run build`.
 * Devolve o CSS guardado com o caminho absoluto dos arquivos desta pasta, que
 * o next/font lê do disco em vez de baixar do Google.
 */
const respostas = require("./respostas.json");
module.exports = Object.fromEntries(
  Object.entries(respostas).map(([url, css]) => [url, css.split("__PASTA__").join(__dirname)])
);
