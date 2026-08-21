import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENT, EVENT_PATH, UNITS } from "@/lib/desafio-esteiras/event.config";
import { ticketQrPng } from "@/lib/desafio-esteiras/qr";
import { generateTicketToken, ticketUrl } from "@/lib/desafio-esteiras/ticket";
import { renderDesafioEsteirasTicketEmail, emailLogoDataUris } from "@/lib/emails/desafio-esteiras-ticket";
import { EmailPreviewFrames } from "./EmailPreviewFrames";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview do e-mail | Desafio das Esteiras",
  robots: { index: false, follow: false, nocache: true },
};

const SAMPLE_UNIT = UNITS.find((u) => u.id === "alameda") ?? UNITS[0];
const SAMPLE_CODE = `DST-${SAMPLE_UNIT.ticketPrefix}-8F4X29`;
const SAMPLE_NAME = "Maria Souza";

/**
 * Preview interno do e-mail — fora do ar em produção.
 *
 * `noindex` não é controle de acesso: a página continuava aberta a quem
 * soubesse a URL, expondo a arte, o texto e a contagem de vagas de uma campanha
 * antes do disparo. Em produção a rota responde 404; em desenvolvimento ela
 * abre normalmente, que é onde a preview serve para alguma coisa.
 */
function previewLiberada(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.EMAIL_PREVIEW_ABERTA === "true";
}

export default async function EmailPreviewPage() {
  if (!previewLiberada()) notFound();

  const token = generateTicketToken();
  const png = await ticketQrPng(token);
  const logos = emailLogoDataUris();
  const html = renderDesafioEsteirasTicketEmail({
    nome: SAMPLE_NAME,
    email: "maria@example.com",
    ticketCode: SAMPLE_CODE,
    ticketUrl: ticketUrl(token),
    unitNome: SAMPLE_UNIT.nome,
    unitEndereco: SAMPLE_UNIT.endereco,
    qrSrc: `data:image/png;base64,${png.toString("base64")}`,
    evolveLogoSrc: logos.evolve,
    sommaLogoSrc: logos.somma,
  });

  return (
    <main className="dst-grain min-h-[100svh] py-10 md:py-16">
      <div className="dst-wrap">
        <p className="dst-label" style={{ color: "var(--somma)" }}>
          Revisão · não enviado
        </p>
        <h1 className="dst-display mt-3 text-[clamp(2rem,8vw,4.5rem)] leading-[0.85]">
          TEMPLATE
          <br />
          DO E-MAIL
        </h1>
        <p className="mt-5 max-w-[62ch] text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.65)]">
          Credencial do {EVENT.nome} que cada inscrito recebe. Celular à esquerda, inbox à
          direita. Dados de exemplo: {SAMPLE_NAME}, {SAMPLE_UNIT.curto}, {SAMPLE_CODE}. O envio
          só entra no cadastro depois da sua aprovação.
        </p>
        <p className="dst-label mt-3 text-[color:rgba(242,240,236,0.35)]">
          {EVENT_PATH}/email-preview
        </p>

        <div className="mt-12">
          <EmailPreviewFrames html={html} />
        </div>
      </div>
    </main>
  );
}
