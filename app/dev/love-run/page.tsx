import { notFound } from "next/navigation";
import LoveRunLayout from "@/app/dexcomplica/layout";
import Ingresso from "@/app/dexcomplica/ingresso/[token]/Ingresso";
import { qrSvg } from "@/lib/dexcomplica-love-run/ticket";
import { renderIngressoEmail } from "@/lib/emails/dexcomplica-love-run-ingresso";

export const metadata = {
  title: "Preview: Love Run (ingresso e e-mail)",
  robots: { index: false, follow: false },
};

/** Token de exemplo: não existe no banco, o QR só aponta para uma página 404. */
const TOKEN_EXEMPLO = "previa_previa_previa_previa_previa_previa_x";

/**
 * Só em desenvolvimento: o ingresso e o e-mail com dados fictícios, para
 * revisar o visual sem gravar inscrição de teste no banco.
 *   /dev/love-run            → ingresso (recém-inscrito)
 *   /dev/love-run?presente=1 → ingresso com check-in feito
 *   /dev/love-run?tela=email → e-mail de confirmação
 */
export default async function LoveRunPreview({
  searchParams,
}: {
  searchParams: Promise<{ tela?: string; presente?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = await searchParams;

  if (q.tela === "email") {
    const html = renderIngressoEmail({
      nome: "Maria Fernanda Silva",
      ticketCode: "DLR-8F4X29",
      url: `https://sommaclub.com.br/dexcomplica/ingresso/${TOKEN_EXEMPLO}`,
      pelotao: "6km",
      qrSrc: `data:image/svg+xml;utf8,${encodeURIComponent(await qrSvg(TOKEN_EXEMPLO))}`,
    });
    return <iframe title="Prévia do e-mail" srcDoc={html} style={{ width: "100%", height: "100vh", border: 0 }} />;
  }

  return (
    <LoveRunLayout>
      <Ingresso
        nome="Maria Fernanda Silva"
        pelotao="6 km"
        codigo="DLR-8F4X29"
        qr={await qrSvg(TOKEN_EXEMPLO)}
        presenteEm={q.presente === "1" ? new Date().toISOString() : null}
        novo={q.presente !== "1"}
        emailEnviado
      />
    </LoveRunLayout>
  );
}
