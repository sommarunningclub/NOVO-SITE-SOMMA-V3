import "server-only";
import QRCode from "qrcode";
import { qrPayload } from "./ticket";

/**
 * QR do ticket, renderizado como SVG no servidor.
 *
 * O conteúdo é só a URL do ticket (que carrega o token opaco) — nenhum dado
 * pessoal viaja no código. Sair em SVG inline evita uma imagem extra na rede
 * e mantém o QR nítido em qualquer densidade de tela, inclusive impresso.
 */
export async function ticketQrSvg(token: string): Promise<string> {
  const svg = await QRCode.toString(qrPayload(token), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#08080a", light: "#f2f0ec" },
  });

  // A lib emite só `viewBox`. Removemos qualquer dimensão fixa (caso uma versão
  // futura passe a emitir) e fixamos 100% para o QR preencher o container.
  return svg
    .replace(/\s(width|height)="[^"]*"/g, "")
    .replace("<svg ", '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" ');
}
