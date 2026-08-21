import { notFound } from "next/navigation";
import {
  EVENTO,
  LINK_VENDAS_PENDENTE,
  prazoLabel,
  renderSunsetWineRunEmail,
  sunsetWineRunLogoDataUris,
  sunsetWineRunPreheader,
  sunsetWineRunSubject,
} from "@/lib/emails/sunset-wine-run";
import { EmailFrames } from "./EmailFrames";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Preview — Campanha Sunset Wine Run",
  robots: { index: false, follow: false, nocache: true },
};

const VARIANTES = {
  real: { rotulo: "Com nome", nome: "Marina Souza" as string | null },
  "sem-nome": { rotulo: "Sem nome na base", nome: null },
  broadcast: { rotulo: "Placeholder do Resend", nome: "{{{FIRST_NAME|corredor}}}" as string | null },
} as const;

type VarianteId = keyof typeof VARIANTES;

export default async function SunsetWineRunPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { v } = await searchParams;
  const variante: VarianteId = v && v in VARIANTES ? (v as VarianteId) : "real";

  const logos = sunsetWineRunLogoDataUris();
  const html = renderSunsetWineRunEmail({
    nome: VARIANTES[variante].nome,
    swrLogoSrc: logos.swr,
    sommaLogoSrc: logos.somma,
    descadastroUrl: "https://sommaclub.com.br/descadastrar",
  });

  const assunto = sunsetWineRunSubject();
  /**
   * Medido no HTML de produção (URLs, não data URI): aqui as imagens vão
   * embutidas em base64 e inflam o arquivo para o dobro do real, o que faria
   * o painel acusar um corte do Gmail que não vai acontecer.
   */
  const kb = (
    Buffer.byteLength(
      renderSunsetWineRunEmail({
        nome: VARIANTES[variante].nome,
        descadastroUrl: "https://sommaclub.com.br/descadastrar",
      }),
      "utf8"
    ) / 1024
  ).toFixed(1);
  const linkPendente = EVENTO.linkIngresso === LINK_VENDAS_PENDENTE;

  return (
    <div className="min-h-screen bg-zinc-200">
      <div className="sticky top-0 z-10 border-b border-zinc-300 bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#ff2c03]">
              Dev only · nada foi enviado
            </p>
            <h1 className="text-lg font-bold text-zinc-900">
              Sunset Wine Run · cupom {EVENTO.cupom} · até {prazoLabel()}
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              <span className="font-semibold">Assunto:</span> {assunto}{" "}
              <span className="text-zinc-400">({assunto.length} caracteres)</span>
            </p>
            <p className="mt-0.5 text-sm text-zinc-600">
              <span className="font-semibold">Preheader:</span> {sunsetWineRunPreheader()}
            </p>
            <p className="mt-0.5 text-sm text-zinc-500">
              HTML {kb} KB no disparo real{" "}
              <span className="text-zinc-400">
                (o Gmail corta em 102 KB · no preview as imagens vão embutidas e inflam o número)
              </span>
            </p>
            {linkPendente && (
              <p className="mt-2 max-w-[52ch] rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Link de vendas ainda é placeholder. Nenhum disparo deve sair até esse link ser
                trocado pelo endereço real.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(VARIANTES) as VarianteId[]).map((id) => (
              <a
                key={id}
                href={`/dev/emails/sunset-wine-run?v=${id}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  id === variante
                    ? "bg-[#ff2c03] text-white"
                    : "border border-zinc-300 bg-white text-zinc-700 hover:border-[#ff2c03]"
                }`}
              >
                {VARIANTES[id].rotulo}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-8">
        <EmailFrames html={html} altura={2100} />
      </div>
    </div>
  );
}
