import type { Metadata } from "next";
import Link from "next/link";
import { EVENT, EVENT_PATH } from "@/lib/desafio-esteiras/event.config";
import { emailLogoDataUris } from "@/lib/emails/desafio-esteiras-ticket";
import {
  CONVITE_SUBJECTS,
  desafioEsteirasConvitePreheader,
  renderDesafioEsteirasConviteEmail,
} from "@/lib/emails/desafio-esteiras-convite";
import { EmailPreviewFrames } from "../EmailPreviewFrames";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview do convite | Desafio das Esteiras",
  robots: { index: false, follow: false, nocache: true },
};

const NOME_EXEMPLO = "Marina";

export default function ConvitePreviewPage() {
  const logos = emailLogoDataUris();
  const html = renderDesafioEsteirasConviteEmail({
    nome: NOME_EXEMPLO,
    evolveLogoSrc: logos.evolve,
    sommaLogoSrc: logos.somma,
    descadastroUrl: "https://sommaclub.com.br/descadastrar",
  });

  return (
    <main className="dst-grain min-h-[100svh] py-10 md:py-16">
      <div className="dst-wrap">
        <p className="dst-label" style={{ color: "var(--somma)" }}>
          Revisão · nada foi enviado
        </p>
        <h1 className="dst-display mt-3 text-[clamp(2rem,8vw,4.5rem)] leading-[0.85]">
          CONVITE
          <br />
          PARA A BASE
        </h1>
        <p className="mt-5 max-w-[62ch] text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.65)]">
          E-mail de convite do {EVENT.nome} para a lista do SOMMA Club. Celular à esquerda, inbox
          à direita. Exemplo com o nome {NOME_EXEMPLO}; sem nome, o e-mail abre com um
          &ldquo;Oi!&rdquo; e o resto segue igual.
        </p>

        {/* Assunto e preheader são o que decide a abertura, então ficam à vista */}
        <section className="dst-panel mt-9 p-5">
          <p className="dst-label mb-3 text-[color:var(--somma)]">Assuntos para testar</p>
          <ol className="space-y-2">
            {CONVITE_SUBJECTS.map((s, i) => (
              <li key={s} className="text-[0.95rem] leading-relaxed">
                <span className="dst-mono mr-2 text-[0.78rem] text-[color:rgba(242,240,236,0.35)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <p className="dst-label mt-5 mb-2 text-[color:rgba(242,240,236,0.45)]">
            Prévia na caixa de entrada
          </p>
          <p className="text-[0.88rem] leading-relaxed text-[color:rgba(242,240,236,0.6)]">
            {desafioEsteirasConvitePreheader()}
          </p>
        </section>

        <div className="mt-12">
          <EmailPreviewFrames html={html} />
        </div>

        <p className="dst-label mt-12 text-[color:rgba(242,240,236,0.35)]">
          {EVENT_PATH}/email-preview/convite
        </p>
        <Link
          href={`${EVENT_PATH}/email-preview`}
          className="dst-label mt-4 inline-block underline underline-offset-4"
        >
          Ver o e-mail do ticket
        </Link>
      </div>
    </main>
  );
}
