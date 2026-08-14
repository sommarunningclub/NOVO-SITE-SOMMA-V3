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
import { generateTicketCode, generateTicketToken, extractToken, normalizeTicketCode, ticketPertenceAUnidade, ticketUrl } from "../lib/desafio-esteiras/ticket";
import { ticketQrPng, ticketQrSvg } from "../lib/desafio-esteiras/qr";
import { decodeQrFromRgba } from "../lib/desafio-esteiras/qr-scan";
import { EVENT, FAQ, UNITS } from "../lib/desafio-esteiras/event.config";
import {
  distanciaKm,
  formatarDistancia,
  foraDaRegiao,
  interpretarGeoError,
  modoRota,
  rotaGoogleUrl,
  unidadeMaisProxima,
} from "../lib/desafio-esteiras/geo";
import { adminInscricaoSchema, registrationSchema } from "../lib/desafio-esteiras/schema";
import { renderDesafioEsteirasTicketEmail } from "../lib/emails/desafio-esteiras-ticket";
import QRCode from "qrcode";

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
const png = await ticketQrPng(tok);
t("gera PNG do QR para e-mail", png.length > 200, `${png.length} bytes`);

console.log("\nLeitura de QR (fallback Safari / sem BarcodeDetector)");
const payload = ticketUrl(tok);
const qr = QRCode.create(payload, { errorCorrectionLevel: "M" });
const size = qr.modules.size;
const scale = 4;
const margin = 4;
const width = (size + margin * 2) * scale;
const rgba = new Uint8ClampedArray(width * width * 4);
for (let i = 0; i < rgba.length; i += 4) {
  rgba[i] = 242;
  rgba[i + 1] = 240;
  rgba[i + 2] = 236;
  rgba[i + 3] = 255;
}
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    if (!qr.modules.get(x, y)) continue;
    for (let dy = 0; dy < scale; dy++) {
      for (let dx = 0; dx < scale; dx++) {
        const px = (y + margin) * scale + dy;
        const py = (x + margin) * scale + dx;
        const i = (px * width + py) * 4;
        rgba[i] = 8;
        rgba[i + 1] = 8;
        rgba[i + 2] = 10;
        rgba[i + 3] = 255;
      }
    }
  }
}
t("jsQR lê o payload do ticket sem BarcodeDetector", decodeQrFromRgba(rgba, width, width) === payload, decodeQrFromRgba(rgba, width, width) ?? "null");
t("jsQR ignora ruído que não é QR", decodeQrFromRgba(new Uint8ClampedArray(16), 2, 2) === null);

console.log("\nE-mail do ticket");
const html = renderDesafioEsteirasTicketEmail({
  nome: 'Maria <script>alert(1)</script> Souza',
  email: "maria@example.com",
  ticketCode: "DST-AL-8F4X29",
  ticketUrl: "https://sommaclub.com.br/desafios-das-esteiras-evolve/confirmado/abc",
  unitNome: "Evolve Alameda",
  unitEndereco: "Alameda Shopping — Taguatinga Sul",
  qrSrc: "cid:ticket-qr",
});
t("headline do evento", html.includes("DESAFIO") && html.includes("DAS ESTEIRAS"));
t("código do ticket", html.includes("DST-AL-8F4X29"));
t("QR inline via CID", html.includes('src="cid:ticket-qr"'));
t("layout mobile (max-width: 480px)", html.includes("max-width: 480px"));
t("QR maior no celular (240px)", html.includes("240px !important"));
t("CTA full-width", html.includes("Abrir meu ticket"));
t("imagens das logos no header", html.includes('alt="Evolve"') && html.includes('alt="SOMMA Club"') && html.includes("evolve-logo.png"));
t("escapa HTML do nome", html.includes("Maria &lt;script&gt;alert(1)&lt;/script&gt; Souza") && !html.includes("<script>alert(1)</script>"));
t("viewport mobile", html.includes('width=device-width'));

console.log("\nNormalização de dados");
const base = { unit_id: "vicente-pires", full_name: "  Maria   Souza  ", cpf: "529.982.247-25", birth_date: "1995-04-12", email: "  MARIA@Example.COM ", phone: "+55 (61) 99988-7766", aceite_termos: true, sexo: "feminino", participacao: "competidor" };
const p = registrationSchema.safeParse(base);
t("aceita dados válidos", p.success, p.success ? "" : JSON.stringify(p.error.issues[0]));
if (p.success) {
  t("nome em maiúsculas sem espaços extras", p.data.full_name === "MARIA SOUZA", p.data.full_name);
  t("CPF normalizado para 11 dígitos", p.data.cpf === "52998224725", p.data.cpf);
  t("e-mail minúsculo e sem espaços", p.data.email === "maria@example.com", p.data.email);
  t("telefone sem +55 e sem máscara", p.data.phone === "61999887766", p.data.phone);
  t("nascimento ISO preservado", p.data.birth_date === "1995-04-12", p.data.birth_date);
}
t("aceita nome com partícula", registrationSchema.safeParse({ ...base, full_name: "Ana de Souza" }).success);
t("grava Ana de Souza em maiúsculas", registrationSchema.safeParse({ ...base, full_name: "Ana de Souza" }).success
  && registrationSchema.safeParse({ ...base, full_name: "Ana de Souza" }).data?.full_name === "ANA DE SOUZA");
t("recusa só o primeiro nome", !registrationSchema.safeParse({ ...base, full_name: "Maria" }).success);
t("recusa inicial + sobrenome", !registrationSchema.safeParse({ ...base, full_name: "A Silva" }).success);
t("recusa nome com número", !registrationSchema.safeParse({ ...base, full_name: "Maria Souza 2" }).success);
t("recusa CPF com dígito verificador errado", !registrationSchema.safeParse({ ...base, cpf: "52998224726" }).success);
t("recusa telefone com DDD inexistente", !registrationSchema.safeParse({ ...base, phone: "23999887766" }).success);
t("recusa telefone fixo no lugar do celular", !registrationSchema.safeParse({ ...base, phone: "(61) 3333-4444" }).success);
t("recusa celular sem o 9", !registrationSchema.safeParse({ ...base, phone: "6188887766" }).success);
t("recusa celular com 9 + dígito fora da faixa", !registrationSchema.safeParse({ ...base, phone: "61919887766" }).success);
t("recusa celular de dígitos repetidos", !registrationSchema.safeParse({ ...base, phone: "61999999999" }).success);
const br = registrationSchema.safeParse({ ...base, birth_date: "12/04/1995" });
t("aceita dd/mm/aaaa e grava ISO", br.success && br.data.birth_date === "1995-04-12", br.success ? br.data.birth_date : JSON.stringify(br.error?.issues[0]));
t("recusa CPF de dígitos repetidos", !registrationSchema.safeParse({ ...base, cpf: "11111111111" }).success);
t("recusa menor de 12 anos", !registrationSchema.safeParse({ ...base, birth_date: "2020-01-01" }).success);
t("recusa unidade fora da lista", !registrationSchema.safeParse({ ...base, unit_id: "asa-sul" }).success);
t("recusa termos não aceitos", !registrationSchema.safeParse({ ...base, aceite_termos: false }).success);
t("honeypot preenchido passa no schema (tratado no handler)", registrationSchema.safeParse({ ...base, website: "x" }).success);
t("admin inscreve sem aceite de termos", adminInscricaoSchema.safeParse(base).success);
t("admin recusa unidade inválida", !adminInscricaoSchema.safeParse({ ...base, unit_id: "asa-sul" }).success);
const alameda = UNITS.find((u) => u.id === "alameda")!;
t("ticket VP não pertence à Alameda", !ticketPertenceAUnidade("DST-VP-3KWKJG", alameda));
t("ticket VP pertence a Vicente Pires", ticketPertenceAUnidade("DST-VP-3KWKJG", UNITS[0]));

console.log("\nGeo / rota");
const vp = UNITS[0];
t("mesmo ponto ≈ 0 km", distanciaKm({ lat: vp.latitude, lng: vp.longitude }, { lat: vp.latitude, lng: vp.longitude }) < 0.001);
t("pin em Vicente Pires aponta Vicente Pires", unidadeMaisProxima({ lat: vp.latitude, lng: vp.longitude }).unit.id === "vicente-pires");
const sb = UNITS.find((u) => u.id === "samambaia")!;
t("pin em Samambaia aponta Samambaia", unidadeMaisProxima({ lat: sb.latitude, lng: sb.longitude }).unit.id === "samambaia");
const lz = UNITS.find((u) => u.id === "luziania")!;
t("pin em Luziânia aponta Luziânia", unidadeMaisProxima({ lat: lz.latitude, lng: lz.longitude }).unit.id === "luziania");
t("formata metros", formatarDistancia(0.35) === "350 m", formatarDistancia(0.35));
t("formata km com vírgula", formatarDistancia(3.2) === "3,2 km", formatarDistancia(3.2));
t("região DF/GO", !foraDaRegiao(12) && foraDaRegiao(90));
t("rota a pé até 2,5 km", modoRota(1.2) === "walking" && modoRota(8) === "driving");
t("PERMISSION_DENIED vira denied", interpretarGeoError(1).status === "denied");
const dir = rotaGoogleUrl(vp);
t("URL de rota tem destino", dir.includes("destination=-15.8129") && dir.includes("-48.0188"), dir);
const nav = rotaGoogleUrl(vp, { lat: -15.8, lng: -47.9 }, "driving");
t("com GPS inicia navegação", nav.includes("origin=-15.8") && nav.includes("dir_action=navigate"), nav);
t("evento marcado como gratuito", EVENT.gratuito === true);
const faqGratis = FAQ.find((f) => f.p === "O evento é gratuito?");
t("FAQ responde que é gratuito", typeof faqGratis?.r === "string" && /gratuit/i.test(faqGratis.r), String(faqGratis?.r));
t("Vicente Pires tem ficha do Google", vp.google?.rating === 4.4 && vp.google.avaliacoes === 301);

console.log(`\n${ok} passaram · ${bad} falharam`);
process.exit(bad ? 1 : 0);
