/**
 * Maratona do Rio 2027: inscrição da Meia Maratona pela assessoria
 * (/assessoria/maratona-rio-2027-garanta-sua-vaga).
 *
 * A pessoa reserva uma das vagas remanescentes do 2º lote e paga por Pix
 * direto à BORA. Preço, teto de vagas e dados do Pix moram aqui; o banco
 * guarda o valor do momento de cada inscrição.
 */

// Só 50 vagas neste lote (o Alex confirmou em 04/11/2026; a BORA chegou a falar em 78).
export const LIMITE_VAGAS = 50;
export const VALOR_INSCRICAO = 379;
export const VALOR_ESTRUTURA = 100;

export const PROVA_INSCRICAO = {
  id: "21k_sem_camisa",
  nome: "Meia Maratona · 21 km",
  kit: "Kit básico, sem camisa",
} as const;

export const EMAIL_SAC = "sac@boraequipe.com.br";
export const TERMO_URL = "https://www.maratonadorio.com.br/";

/** Pix da BORA, igual ao QR que a BORA divulga (conferido em 04/11/2026). */
export const PIX = {
  chave: "c83ff4de-e554-4aae-8ef4-e1f704898c15",
  recebedor: "BORA ASSESSORIA LTDA",
  cidade: "SAO PAULO",
  cep: "05409000",
  instituicao: "Nu Pagamentos",
};

export function valorTotal(estrutura: boolean): number {
  return VALOR_INSCRICAO + (estrutura ? VALOR_ESTRUTURA : 0);
}

export function reais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

// ─── Pix copia e cola (BR Code estático, padrão EMV do Banco Central) ────────

function campo(id: string, valor: string): string {
  return `${id}${String(valor.length).padStart(2, "0")}${valor}`;
}

/** CRC16-CCITT (poly 0x1021, início 0xFFFF), como pede o manual do BR Code. */
function crc16(texto: string): string {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Código Pix com o valor já preenchido. O `txid` aparece para a BORA no
 * extrato e ajuda a casar o pagamento com a inscrição (só letras e números,
 * até 25).
 */
export function pixCopiaECola(valor: number, txid: string): string {
  const id = txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const corpo =
    campo("00", "01") +
    campo("26", campo("00", "BR.GOV.BCB.PIX") + campo("01", PIX.chave)) +
    campo("52", "0000") +
    campo("53", "986") +
    campo("54", valor.toFixed(2)) +
    campo("58", "BR") +
    campo("59", PIX.recebedor) +
    campo("60", PIX.cidade) +
    campo("61", PIX.cep) +
    campo("62", campo("05", id)) +
    "6304";
  return corpo + crc16(corpo);
}
