import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENTO_NOME, EVENTO_SLUG } from "@/lib/dexcomplica-love-run/event.config";
import { getEventoPorId, getParticipantePorToken } from "@/lib/dexcomplica-love-run/db";
import { rotuloPelotao } from "@/lib/dexcomplica-love-run/estado";
import { qrSvg, tokenValido } from "@/lib/dexcomplica-love-run/ticket";
import Ingresso from "./Ingresso";

export const dynamic = "force-dynamic";

/**
 * A URL carrega o token do ingresso: fora dos buscadores e sem Referer para
 * os links de saída (Google Maps, Instagram), para o token não vazar.
 */
export const metadata: Metadata = {
  title: `Seu ingresso · ${EVENTO_NOME}`,
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function IngressoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ novo?: string; email?: string }>;
}) {
  const { token } = await params;
  const q = await searchParams;
  if (!tokenValido(token)) notFound();

  const p = await getParticipantePorToken(token);
  if (!p || p.status === "cancelado") notFound();
  const evento = await getEventoPorId(p.evento_id);
  if (!evento || evento.slug !== EVENTO_SLUG) notFound();

  return (
    <Ingresso
      nome={p.nome_completo}
      pelotao={p.pelotao ? rotuloPelotao(p.pelotao) : null}
      codigo={p.ticket_code}
      qr={await qrSvg(token)}
      presenteEm={p.status === "presente" ? p.checkin_em : null}
      novo={q.novo === "1"}
      token={token}
      semTelefone={!p.telefone}
      emailEnviado={q.email === "1"}
    />
  );
}
