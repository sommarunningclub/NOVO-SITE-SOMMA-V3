import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { CAMINHO, PREFIXO_QR } from "@/lib/evp/config";
import { lerIngresso } from "@/lib/evp/db";
import { Obrigado } from "./_components/Obrigado";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Obrigado | Meeting Técnico",
  // O endereço carrega o token do ingresso: fora dos buscadores e sem vazar em link de saída.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <main className="mt-container flex min-h-dvh flex-col items-start justify-center gap-5 py-16">
      <p className="mt-marco"><b>Meeting Técnico</b> Maratona Monumental 2026</p>
      <h1 className="mt-titulo">{titulo}</h1>
      <p className="mt-texto max-w-[34rem]">{texto}</p>
      <Link href={`${CAMINHO}#inscricao`} className="mt-botao mt-botao--cheio">Ir para a página do Meeting</Link>
    </main>
  );
}

export default async function Pagina({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const ingresso = await lerIngresso(t);

  if (!ingresso) {
    return (
      <Aviso
        titulo="Ingresso não encontrado."
        texto="Este link não corresponde a nenhuma inscrição. Abra o link que chegou no seu e-mail de confirmação, ou peça o reenvio na página do Meeting informando o seu CPF."
      />
    );
  }
  if (ingresso.status === "cancelada") {
    return <Aviso titulo="Inscrição cancelada." texto="Esta inscrição foi cancelada e o ingresso não vale mais para o credenciamento. Se foi engano, fale com a equipe do SOMMA Club." />;
  }

  // O QR carrega só um identificador aleatório. Quem valida é o servidor, no credenciamento.
  const qr =
    ingresso.status === "confirmada"
      ? await QRCode.toDataURL(`${PREFIXO_QR}${ingresso.qr_token}`, {
          margin: 1,
          width: 520,
          errorCorrectionLevel: "M",
          color: { dark: "#080808", light: "#F4F1EA" },
        })
      : null;

  return (
    <Obrigado
      qr={qr}
      ingresso={{
        nome: ingresso.nome,
        codigo: ingresso.codigo,
        distancia: ingresso.distancia,
        status: ingresso.status,
        posicao_fila: ingresso.posicao_fila,
        presente: ingresso.presente,
        evento: ingresso.evento,
      }}
    />
  );
}
