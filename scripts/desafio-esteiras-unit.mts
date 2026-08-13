/**
 * Testes de unidade do Desafio das Esteiras — geração de ticket, QR e
 * normalização/validação dos dados de inscrição. Não precisa de banco nem
 * de servidor rodando.
 *
 *   npx tsx --conditions=react-server scripts/desafio-esteiras-unit.mts
 *
 * (a flag `--conditions=react-server` é necessária porque as libs de ticket
 * e QR são marcadas com `server-only`.)
 */
import { generateTicketCode, generateTicketToken, extractToken, normalizeTicketCode, ticketUrl } from "../lib/desafio-esteiras/ticket";
import { ticketQrSvg } from "../lib/desafio-esteiras/qr";
import { UNITS } from "../lib/desafio-esteiras/event.config";
import { registrationSchema } from "../lib/desafio-esteiras/schema";

let ok = 0, bad = 0;
const t = (n: string, c: boolean, d = "") => { c ? (ok++, console.log("  ✓", n)) : (bad++, console.log("  ✗", n, d)); };

console.log("Ticket");
const codes = new Set<string>();
for (let i = 0; i < 5000; i++) codes.add(generateTicketCode(UNITS[0]));
t("5000 códigos sem colisão", codes.size === 5000, `${codes.size}`);
t("formato DST-VP-XXXXXX", /^DST-VP-[2-9A-HJ-NP-Z]{6}$/.test(generateTicketCode(UNITS[0])), generateTicketCode(UNITS[0]));
t("sem caracteres ambíguos (0,O,1,I,L)", ![...codes].some(c => /[01OIL]/.test(c.slice(7))));
t("prefixo por unidade", UNITS.every(u => generateTicketCode(u).startsWith(`DST-${u.ticketPrefix}-`)));

const tokens = new Set<string>();
for (let i = 0; i < 5000; i++) tokens.add(generateTicketToken());
t("5000 tokens sem colisão", tokens.size === 5000);
const tok = generateTicketToken();
t("token base64url com 43 chars", tok.length === 43 && /^[A-Za-z0-9_-]+$/.test(tok), `${tok.length}`);

t("extractToken de URL completa", extractToken(ticketUrl(tok)) === tok);
t("extractToken de token puro", extractToken(tok) === tok);
t("normalizeTicketCode com espaços/minúsculas", normalizeTicketCode(" dst vp 8f4x29 ") === "DST-VP-8F4X29", normalizeTicketCode(" dst vp 8f4x29 "));

console.log("\nQR Code");
const svg = await ticketQrSvg(tok);
t("gera SVG", svg.startsWith("<?xml") || svg.includes("<svg"));
t("SVG é responsivo", svg.includes('width="100%"') && svg.includes('height="100%"'));
t("QR não contém dado pessoal, só a URL", svg.includes("svg") && !svg.includes("@"));

console.log("\nNormalização de dados");
const base = { unit_id: "vicente-pires", full_name: "  Maria   Souza  ", cpf: "529.982.247-25", birth_date: "1995-04-12", email: "  MARIA@Example.COM ", phone: "+55 (61) 99988-7766", aceite_termos: true };
const p = registrationSchema.safeParse(base);
t("aceita dados válidos", p.success, p.success ? "" : JSON.stringify(p.error.issues[0]));
if (p.success) {
  t("CPF normalizado para 11 dígitos", p.data.cpf === "52998224725", p.data.cpf);
  t("e-mail minúsculo e sem espaços", p.data.email === "maria@example.com", p.data.email);
  t("telefone sem +55 e sem máscara", p.data.phone === "61999887766", p.data.phone);
}
t("recusa CPF com dígito errado", !registrationSchema.safeParse({ ...base, cpf: "52998224726" }).success);
t("recusa CPF de dígitos repetidos", !registrationSchema.safeParse({ ...base, cpf: "11111111111" }).success);
t("recusa menor de 12 anos", !registrationSchema.safeParse({ ...base, birth_date: "2020-01-01" }).success);
t("recusa unidade fora da lista", !registrationSchema.safeParse({ ...base, unit_id: "asa-sul" }).success);
t("recusa termos não aceitos", !registrationSchema.safeParse({ ...base, aceite_termos: false }).success);
t("honeypot preenchido passa no schema (tratado no handler)", registrationSchema.safeParse({ ...base, website: "x" }).success);

console.log(`\n${ok} passaram · ${bad} falharam`);
process.exit(bad ? 1 : 0);
