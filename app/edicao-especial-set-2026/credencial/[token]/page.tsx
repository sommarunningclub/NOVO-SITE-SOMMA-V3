import { redirect } from "next/navigation";

/**
 * A confirmação mudou de endereço: /credencial virou /obrigado, que mostra o
 * ticket E os dados da inscrição. Este redirect existe porque tickets já
 * emitidos (e-mail, QR impresso) apontam para cá — e um QR impresso não se
 * corrige depois.
 */
export default async function CredencialLegado({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/edicao-especial-set-2026/obrigado/${token}`);
}
