"use client";

import { Container, Section, SectionTitle, Reveal, Hi } from "../ui";
import { DIGITAL_IMPACT, REACH_SPLIT, CONTENT_FORMATS } from "../../_data/sommaMetrics";

/** Donut simples (SVG) para a distribuição seguidores × não seguidores. */
function DonutSplit() {
  const [a, b] = REACH_SPLIT;
  const r = 52;
  const c = 2 * Math.PI * r;
  const dashA = (a.pct / 100) * c;
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0 -rotate-90" role="img" aria-label={`${a.pct}% de seguidores e ${b.pct}% de não seguidores`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="16" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="var(--somma-primary)"
          strokeWidth="16"
          strokeDasharray={`${dashA} ${c - dashA}`}
          strokeLinecap="round"
        />
        <text x="70" y="66" transform="rotate(90 70 70)" textAnchor="middle" className="fill-white text-[26px] font-black">
          {a.pct}%
        </text>
      </svg>
      <ul className="space-y-3">
        {REACH_SPLIT.map((s, i) => (
          <li key={s.origem} className="flex items-start gap-3">
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${i === 0 ? "bg-[var(--somma-primary)]" : "bg-white/25"}`} />
            <span>
              <span className="font-bold text-white">{s.pct}% </span>
              <span className="text-white/75">{s.origem.toLowerCase()}</span>
              <span className="block text-sm text-white/45">{s.descricao}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ImpactoDigital() {
  return (
    <Section id="impacto-digital" dark>
      <Container>
        <SectionTitle
          kicker="Impacto digital"
          title={
            <>
              Números de <Hi>alcance</Hi> reais, do último mês.
            </>
          }
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Tabela indicador × resultado — vira grid de cards no mobile */}
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="grid grid-cols-2 border-b border-white/10 bg-white/[0.03] px-5 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Indicador</span>
                <span className="text-right text-[11px] font-semibold uppercase tracking-wide text-white/40">Resultado</span>
              </div>
              <dl>
                {DIGITAL_IMPACT.map((row) => (
                  <div key={row.indicador} className="grid grid-cols-2 items-center border-b border-white/[0.06] px-5 py-3.5 last:border-0">
                    <dt className="text-sm text-white/70">{row.indicador}</dt>
                    <dd className="text-right text-base font-bold text-white">{row.resultado}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          {/* Distribuição 70/30 */}
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Origem das visualizações</p>
              <p className="mt-1 text-sm text-white/60">
                70% vieram de seguidores. 30%, de pessoas que ainda não seguiam o perfil.
              </p>
              <div className="mt-6">
                <DonutSplit />
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

export function Formatos() {
  const max = Math.max(...CONTENT_FORMATS.map((f) => f.views));
  return (
    <Section id="formatos" className="bg-[var(--somma-surface)]">
      <Container>
        <SectionTitle
          kicker="Formatos de conteúdo"
          title={
            <>
              Cada formato cumpre um <Hi>papel</Hi>.
            </>
          }
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {CONTENT_FORMATS.map((f, i) => (
            <Reveal key={f.formato} delay={i * 0.06}>
              <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-black text-white">{f.formato}</h3>
                  <span className="text-sm font-semibold text-[var(--somma-primary)]">{f.viewsLabel}</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[var(--somma-primary)]"
                    style={{ width: `${Math.round((f.views / max) * 100)}%` }}
                  />
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-white/65">{f.papel}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
