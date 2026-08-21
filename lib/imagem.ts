/**
 * Reconhecimento de imagem pela assinatura do arquivo.
 *
 * `file.type` e a extensão do nome vêm do cliente e são triviais de forjar.
 * Quem decide o que é a imagem são os primeiros bytes: um script renomeado
 * para `.jpg` não passa daqui, e o `contentType` gravado no storage é o
 * detectado, não o declarado — o que impede servir HTML de um bucket público.
 *
 * Extraído de `lib/desafio-esteiras/perfil.ts`, que era o único lugar do
 * projeto a fazer isso direito, para o upload público do Wings usar a mesma
 * checagem.
 */

export const TIPOS_IMAGEM = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export type TipoImagem = (typeof TIPOS_IMAGEM)[number];

export const EXTENSAO_IMAGEM: Record<TipoImagem, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

function texto(bytes: Uint8Array, inicio: number, fim: number): string {
  return String.fromCharCode(...bytes.slice(inicio, fim));
}

export function detectarImagem(bytes: Uint8Array): TipoImagem | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((b, i) => bytes[i] === b)) return "image/png";

  // WEBP: "RIFF" .... "WEBP"
  if (texto(bytes, 0, 4) === "RIFF" && texto(bytes, 8, 12) === "WEBP") return "image/webp";

  // HEIC/HEIF: caixa "ftyp" seguida da marca do formato (heic, heix, mif1, msf1…)
  if (texto(bytes, 4, 8) === "ftyp") {
    const marca = texto(bytes, 8, 12).toLowerCase();
    if (marca.startsWith("hei")) return "image/heic";
    if (marca === "mif1" || marca === "msf1") return "image/heif";
  }

  return null;
}
