import { notFound } from "next/navigation";
import {
  ETAPAS,
  OFERTA,
  SEGMENTOS,
  emailHeroDataUri,
  etapaRotulo,
  evolveFortalecimentoPreheader,
  evolveFortalecimentoSubject,
  linkOferta,
  renderEvolveFortalecimentoEmail,
  type EtapaRegua,
} from "@/lib/emails/evolve-fortalecimento";
import { emailLogoDataUris } from "@/lib/emails/desafio-esteiras-ticket";
import { EmailFrames } from "./EmailFrames";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Preview — Campanha Evolve Fortalecimento",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * As três formas que a saudação assume na vida real. A do meio é a que mais
 * importa revisar: boa parte da base entrou sem nome preenchido, e é ela que
 * decide se o título abre "OI, MARINA!" ou "OLÁ!".
 */
const VARIANTES = {
  real: { rotulo: "Com nome", nome: "Marina Souza" as string | null },
  "sem-nome": { rotulo: "Sem nome na base", nome: null },
  broadcast: { rotulo: "Placeholder do Resend", nome: "{{{FIRST_NAME|corredor}}}" as string | null },
} as const;

type VarianteId = keyof typeof VARIANTES;

export default async function EvolveFortalecimentoPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; etapa?: string }>;
}) {
  // Preview de e-mail é ferramenta de bancada: não vai para produção.
  if (process.env.NODE_ENV === "production") notFound();

  const { v, etapa: etapaParam } = await searchParams;
  const variante: VarianteId = v && v in VARIANTES ? (v as VarianteId) : "real";
  const etapa = (ETAPAS.find((e) => String(e) === etapaParam) ?? 1) as EtapaRegua;

  const logos = emailLogoDataUris();
  const html = renderEvolveFortalecimentoEmail({
    nome: VARIANTES[variante].nome,
    segmento: "cadastro-site",
    etapa,
    evolveLogoSrc: logos.evolve,
    sommaLogoSrc: logos.somma,
    // O banner ainda não está publicado; embutido, o preview não depende do deploy.
    heroSrc: emailHeroDataUri(),
    descadastroUrl: "https://sommaclub.com.br/descadastrar",
  });

  const assunto = evolveFortalecimentoSubject(etapa);

  /**
   * O peso é medido no HTML que a pessoa vai receber, não no do preview: aqui as
   * imagens vão embutidas como data URI e inflam o arquivo para mais de 120 KB,
   * o que faria o painel acusar um corte do Gmail que não vai acontecer.
   */
  const kb = (
    Buffer.byteLength(
      renderEvolveFortalecimentoEmail({
        nome: VARIANTES[variante].nome,
        segmento: "cadastro-site",
        etapa,
        descadastroUrl: "https://sommaclub.com.br/descadastrar",
      }),
      "utf8"
    ) / 1024
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-zinc-200">
      <div className="sticky top-0 z-10 border-b border-zinc-300 bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#e2211c]">
              Dev only · nada foi enviado
            </p>
            <h1 className="text-lg font-bold text-zinc-900">
              Campanha Evolve · etapa {etapa} de 3 · {etapaRotulo(etapa)}
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              {etapa === 1
                ? "Vai para toda a base."
                : `Vai só para quem não abriu a etapa ${etapa - 1}.`}{" "}
              {OFERTA.chamadaPreco} {OFERTA.precoLabel}.
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              <span className="font-semibold">Assunto:</span> {assunto}{" "}
              <span className="text-zinc-400">({assunto.length} caracteres)</span>
            </p>
            <p className="mt-0.5 text-sm text-zinc-600">
              <span className="font-semibold">Preheader:</span>{" "}
              {evolveFortalecimentoPreheader(etapa)}
            </p>
            <p className="mt-0.5 text-sm text-zinc-500">
              HTML {kb} KB no disparo real{" "}
              <span className="text-zinc-400">
                (o Gmail corta em 102 KB · no preview o banner vai embutido e infla o número)
              </span>
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {ETAPAS.map((e) => (
                <a
                  key={e}
                  href={`/dev/emails/evolve-fortalecimento?etapa=${e}&v=${variante}`}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    e === etapa
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-900"
                  }`}
                >
                  Etapa {e} · {etapaRotulo(e)}
                </a>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(VARIANTES) as VarianteId[]).map((id) => (
                <a
                  key={id}
                  href={`/dev/emails/evolve-fortalecimento?etapa=${etapa}&v=${id}`}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    id === variante
                      ? "bg-[#e2211c] text-white"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:border-[#e2211c]"
                  }`}
                >
                  {VARIANTES[id].rotulo}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-8">
        <EmailFrames html={html} />

        <div className="mt-10 border-t border-zinc-300 pt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Links rastreáveis por segmento
          </p>
          <ul className="mt-3 space-y-2">
            {SEGMENTOS.map((s) => (
              <li key={s} className="text-sm">
                <span className="font-semibold text-zinc-800">{s}</span>
                <br />
                <a
                  href={linkOferta(s, { etapa })}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-[#e2211c] underline"
                >
                  {linkOferta(s, { etapa })}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-zinc-500">
            No preview o banner vai embutido como data URI. No disparo real ele é servido por{" "}
            <code className="text-zinc-700">/evolve-fortalecimento/email/hero-banner.jpg</code>, que
            precisa de deploy antes do broadcast.
          </p>
        </div>
      </div>
    </div>
  );
}
