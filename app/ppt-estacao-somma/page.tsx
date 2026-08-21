import { headers } from "next/headers";
import QRCode from "qrcode";
import { Deck } from "./_deck";
import { Gate } from "./_gate";
import { resolveOpcionais } from "./_assets";
import { temAcesso } from "./auth";

export const dynamic = "force-dynamic";

const URL_PRODUCAO = "https://sommaclub.com.br/ppt-estacao-somma/app";

/**
 * URL da experiência no telefone. Em produção é o domínio do site; em
 * desenvolvimento segue o host da requisição (IP da máquina na rede, por
 * exemplo), para o QR funcionar num telefone na mesma rede. `?qr=prod` força a
 * URL de produção, útil para exportar o PDF a partir do ambiente local.
 */
async function urlDoApp(forcarProducao: boolean): Promise<string> {
  if (forcarProducao || process.env.ESTACAO_SOMMA_APP_URL) {
    return process.env.ESTACAO_SOMMA_APP_URL || URL_PRODUCAO;
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "sommaclub.com.br";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || /^\d+\.\d+\.\d+\.\d+/.test(host) ? "http" : "https");
  return `${proto}://${host}/ppt-estacao-somma/app`;
}

export default async function PptEstacaoSommaPage({
  searchParams,
}: {
  searchParams: Promise<{ qr?: string }>;
}) {
  if (!(await temAcesso())) return <Gate />;
  const { qr: modoQr } = await searchParams;
  const url = await urlDoApp(modoQr === "prod");
  const qr = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0A0A0A", light: "#FFFFFF" } });
  return <Deck opcionais={resolveOpcionais()} app={{ url, qr }} />;
}
