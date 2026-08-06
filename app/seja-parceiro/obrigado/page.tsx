import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Candidatura recebida | SOMMA Club",
  description: "Recebemos sua candidatura de parceria. Nosso time comercial entra em contato.",
  robots: { index: false, follow: false },
};

export default function SejaParceiroObrigadoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink p-6 text-white">
      <div className="w-full max-w-md text-center">
        {/* Ícone */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-2xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Candidatura recebida
        </p>
        <h1 className="mt-3 text-4xl font-bold">Obrigado!</h1>
        <p className="mt-3 leading-relaxed text-white/60">
          Seus dados chegaram ao nosso time comercial. Em breve entraremos em contato para conversar
          sobre as melhores oportunidades de parceria.
        </p>

        {/* Próximo passo */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-4 w-4 text-primary" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-white/50">
                Próximo passo
              </p>
              <p className="mt-1 text-sm text-white/80">
                Fique atento ao seu e-mail e telefone. Nosso time entra em contato para entender
                melhor o fit entre os dois negócios.
              </p>
            </div>
          </div>
        </div>

        {/* Dica */}
        <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/[0.07] p-5 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Dica</p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/70">
            Verifique a pasta de spam ou promoções — às vezes nossos e-mails caem lá por engano.
          </p>
        </div>

        <Link
          href="/"
          className="mt-8 block w-full rounded-full border border-white/20 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
        >
          Voltar ao site
        </Link>
      </div>
    </main>
  );
}
