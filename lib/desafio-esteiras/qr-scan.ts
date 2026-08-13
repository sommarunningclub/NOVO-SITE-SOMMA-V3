import jsQR from "jsqr";

/**
 * Decodifica um QR a partir de pixels RGBA.
 *
 * Safari no iPhone não implementa `BarcodeDetector`. A leitura no balcão
 * precisa deste caminho — a câmera abre com getUserMedia e os frames passam
 * aqui, no JavaScript, em qualquer celular.
 */
export function decodeQrFromRgba(
  data: Uint8ClampedArray,
  width: number,
  height: number
): string | null {
  if (width < 8 || height < 8) return null;
  const lido = jsQR(data, width, height, { inversionAttempts: "attemptBoth" });
  const valor = lido?.data?.trim();
  return valor ? valor : null;
}

export function navegadorPodeAbrirCamera(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}
