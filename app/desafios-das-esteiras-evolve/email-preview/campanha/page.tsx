import type { Metadata } from "next";
import Link from "next/link";
import { EVENT, EVENT_PATH, VAGAS_TOTAIS } from "@/lib/desafio-esteiras/event.config";
import { getEventStats } from "@/lib/desafio-esteiras/db";
import { emailLogoDataUris } from "@/lib/emails/desafio-esteiras-ticket";
import {
  VARIANTES,
  campanhaRotulo,
  contagemLabel,
  desafioEsteirasCampanhaPreheader,
  desafioEsteirasCampanhaSubject,
  renderDesafioEsteirasCampanhaEmail,
  type VarianteCampanha,
} from "@/lib/emails/desafio-esteiras-campanha";
import { EmailPreviewFrames } from "../EmailPreviewFrames";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview da campanha | Desafio das Esteiras",
  robots: { index: false, follow: false, nocache: true },
};

const NOME_EXEMPLO = "Marina";

/** Data de disparo prevista de cada variante, espelhando o script de teste. */
const AGENDA: Record<VarianteCampanha, string> = {
  convite: "2026-08-17T21:30:00-03:00",
  vagas: "2026-08-18T09:00:00-03:00",
  "ultima-chamada": "2026-08-19T09:00:00-03:00",
  "lembrete-final": "2026-08-19T16:00:00-03:00",
};

/** Altura do iframe por variante: o convite é bem mais longo que os outros. */
const ALTURA: Record<VarianteCampanha, number> = {
  convite: 2900,
  vagas: 1900,
  "ultima-chamada": 1600,
  "lembrete-final": 1600,
};

const diaLegivel = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

export default async function CampanhaPreviewPage() {
  // O preview usa a contagem real de competidores: é o mesmo número que vai no
  // disparo, então dá para conferir a frase de escassez antes de enviar.
  const stats = await getEventStats();
  const vagasRestantes = Math.max(0, VAGAS_TOTAIS - stats.totalCompetidores);
  const logos = emailLogoDataUris();

  return (
    <main className="dst-grain min-h-[100svh] py-10 md:py-16">
      <div className="dst-wrap">
        <p className="dst-label" style={{ color: "var(--somma)" }}>
          Revisão · nada foi enviado
        </p>
        <h1 className="dst-display mt-3 text-[clamp(2rem,8vw,4.5rem)] leading-[0.85]">
          CAMPANHA
          <br />
          PARA A BASE
        </h1>
        <p className="mt-5 max-w-[62ch] text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.65)]">
          Três e-mails do {EVENT.nome}, um por dia de disparo. Cada um é renderizado com a data em
          que sai de verdade, porque a contagem regressiva é congelada na geração. Exemplo com o
          nome {NOME_EXEMPLO}; sem nome, abre com um &ldquo;Oi!&rdquo; e o resto segue igual.
        </p>
        <p className="mt-3 max-w-[62ch] text-[0.95rem] leading-relaxed text-[color:rgba(242,240,236,0.65)]">
          Hoje há {stats.totalCompetidores} de {VAGAS_TOTAIS} vagas de competidor preenchidas, então{" "}
          <strong style={{ color: "var(--somma)" }}>{vagasRestantes} abertas</strong>. É esse número
          que entra no corpo e no assunto.
        </p>

        {VARIANTES.map((variante) => {
          const agora = new Date(AGENDA[variante]);
          const opts = { agora, vagasRestantes };
          const html = renderDesafioEsteirasCampanhaEmail({
            variante,
            nome: NOME_EXEMPLO,
            evolveLogoSrc: logos.evolve,
            sommaLogoSrc: logos.somma,
            vagasRestantes,
            agora,
            descadastroUrl: "https://sommaclub.com.br/descadastrar",
          });

          return (
            <section key={variante} className="mt-16">
              <div className="dst-panel p-5">
                <p className="dst-label" style={{ color: "var(--somma)" }}>
                  {campanhaRotulo(variante)} · {diaLegivel(AGENDA[variante])} ·{" "}
                  {contagemLabel(agora)}
                </p>
                <p className="mt-3 text-[1.05rem] leading-snug">
                  {desafioEsteirasCampanhaSubject(variante, opts)}
                </p>
                <p className="mt-2 text-[0.85rem] leading-relaxed text-[color:rgba(242,240,236,0.55)]">
                  {desafioEsteirasCampanhaPreheader(variante, opts)}
                </p>
              </div>
              <div className="mt-8">
                <EmailPreviewFrames html={html} altura={ALTURA[variante]} />
              </div>
            </section>
          );
        })}

        <p className="dst-label mt-16 text-[color:rgba(242,240,236,0.35)]">
          {EVENT_PATH}/email-preview/campanha
        </p>
        <div className="mt-4 flex flex-wrap gap-6">
          <Link
            href={`${EVENT_PATH}/email-preview/convite`}
            className="dst-label inline-block underline underline-offset-4"
          >
            Ver o convite curto
          </Link>
          <Link
            href={`${EVENT_PATH}/email-preview`}
            className="dst-label inline-block underline underline-offset-4"
          >
            Ver o e-mail do ticket
          </Link>
        </div>
      </div>
    </main>
  );
}
