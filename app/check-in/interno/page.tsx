import type { Metadata } from "next";
import { ENV_SENHA, acessoConfigurado, temAcesso } from "@/lib/check-in-interno/auth";
import { VAGAS_LINK, situacaoDoLink } from "@/lib/check-in-interno/eventos";
import { Login } from "./_components/Login";
import { Formulario } from "./_components/Formulario";

/**
 * Inscrição interna no Love Run de sábado: a equipe fura a fila com a LP e o
 * /check-in fechados, até VAGAS_LINK vagas. Senha em CHECKIN_INTERNO_SENHA
 * (ver lib/check-in-interno/auth). Nada do evento sai antes da sessão conferida.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscrição interna",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default async function CheckInInternoPage() {
  if (!acessoConfigurado()) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--ck-tint)]">Acesso fechado</p>
        <p className="mt-3 text-[15px] text-[var(--ck-sec)]">
          Falta configurar a senha: crie a variável <code className="text-white">{ENV_SENHA}</code> na Vercel e publique de
          novo.
        </p>
      </main>
    );
  }

  if (!(await temAcesso())) return <Login />;

  const s = await situacaoDoLink();
  return (
    <Formulario
      evento={s.evento}
      usadas={s.usadas}
      total={VAGAS_LINK}
      motivo={s.motivo}
      erro={s.erro}
    />
  );
}
