/**
 * O motivo gráfico da página: a linha de batimento que vira coração.
 * Corrida (frequência cardíaca), amor (o coração da Dexcomplica) e música
 * (o pulso da batida) no mesmo traço.
 */
export function Pulso({ className = "" }: { className?: string }) {
  return (
    <svg className={`lr-pulso ${className}`} viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path
        data-pulso
        d="M0 70 H380 l18 -34 l22 70 l24 -96 l20 92 l16 -32 H560
           c10 -28 44 -34 58 -8 c14 -26 48 -20 58 8 c10 30 -30 52 -58 72 c-28 -20 -68 -42 -58 -72 Z
           M676 70 H760 l14 -22 l18 40 l16 -60 l16 58 l12 -16 H1200"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Barras de equalizador: o "volume" da página. Animadas só em CSS e só sem reduced-motion. */
export function Equalizador({ className = "" }: { className?: string }) {
  return (
    <span className={`lr-eq ${className}`} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ animationDelay: `${i * -0.17}s` }} />
      ))}
    </span>
  );
}
