/**
 * Lockup Somma Club × Michelob Ultra.
 *
 * As duas logos oficiais são as da raiz de /public e vêm em versão para fundo
 * claro (Somma em preto, Michelob em azul). Como o deck é azul profundo, cada
 * uma fica sobre uma placa branca — as artes entram intactas, sem recorte,
 * recoloração ou redesenho.
 */
export function Lockup({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const alturas = {
    sm: { somma: "h-4 md:h-5", michelob: "h-7 md:h-8", gap: "gap-3 md:gap-4" },
    md: { somma: "h-5 md:h-6", michelob: "h-9 md:h-11", gap: "gap-4 md:gap-5" },
    lg: { somma: "h-6 md:h-8", michelob: "h-11 md:h-14", gap: "gap-5 md:gap-7" },
  }[size];

  return (
    <div className={`flex items-center ${alturas.gap} ${className}`}>
      <span className="flex items-center rounded-xl bg-white px-3.5 py-2.5 md:px-4 md:py-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-somma-dark.png" alt="Somma Club" className={`${alturas.somma} w-auto`} />
      </span>
      <span className="font-display text-xl font-light text-white/45 md:text-2xl" aria-hidden>
        ×
      </span>
      <span className="flex items-center rounded-xl bg-white px-3.5 py-2 md:px-4 md:py-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Michelob_Ultra_(3).png"
          alt="Michelob Ultra Club"
          className={`${alturas.michelob} w-auto`}
        />
      </span>
    </div>
  );
}
