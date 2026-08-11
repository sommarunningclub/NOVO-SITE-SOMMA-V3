/**
 * Lockup Somma Club × Silver Care.
 *
 * As duas marcas entram nos arquivos oficiais, sem recorte, recoloração ou
 * redesenho. A logo do Somma (/logo-somma.svg) já é a versão para fundo escuro
 * (branco com o laranja da marca). A da Silver Care é preta sobre transparente,
 * então em fundo escuro ela fica sobre uma placa branca; em fundo claro entra
 * direto, sem placa.
 */

const SILVER_LOGO = "/LOGO-SILVER_1_537x.webp";

type Size = "sm" | "md" | "lg";

const ALTURAS: Record<Size, { somma: string; silver: string; gap: string; pad: string }> = {
  sm: { somma: "h-4 md:h-5", silver: "h-5 md:h-6", gap: "gap-3 md:gap-4", pad: "px-3 py-2" },
  md: { somma: "h-5 md:h-6", silver: "h-7 md:h-8", gap: "gap-4 md:gap-5", pad: "px-3.5 py-2.5" },
  lg: { somma: "h-7 md:h-9", silver: "h-9 md:h-12", gap: "gap-5 md:gap-7", pad: "px-4 py-3" },
};

export function Lockup({
  className = "",
  size = "md",
  tema = "escuro",
}: {
  className?: string;
  size?: Size;
  /** `escuro` = deck preto (placa branca na Silver Care). `claro` = fundo bone. */
  tema?: "escuro" | "claro";
}) {
  const a = ALTURAS[size];
  const claro = tema === "claro";

  return (
    <div className={`flex items-center ${a.gap} ${className}`}>
      {claro ? (
        <img src="/logo-somma-dark.png" alt="Somma Club" className={`${a.somma} w-auto`} />
      ) : (
        <img src="/logo-somma.svg" alt="Somma Club" className={`${a.somma} w-auto`} />
      )}

      <span
        className={`font-display text-xl font-light md:text-2xl ${claro ? "text-black/30" : "text-white/40"}`}
        aria-hidden
      >
        ×
      </span>

      {claro ? (
        <img src={SILVER_LOGO} alt="Silver Care" className={`${a.silver} w-auto`} />
      ) : (
        <span className={`flex items-center rounded-xl bg-white ${a.pad}`}>
          <img src={SILVER_LOGO} alt="Silver Care" className={`${a.silver} w-auto`} />
        </span>
      )}
    </div>
  );
}

/** Só a marca da Silver Care, com a placa quando o fundo é escuro. */
export function SilverMark({
  className = "",
  altura = "h-7",
  tema = "escuro",
}: {
  className?: string;
  altura?: string;
  tema?: "escuro" | "claro";
}) {
  if (tema === "claro") {
    return <img src={SILVER_LOGO} alt="Silver Care" className={`${altura} w-auto ${className}`} />;
  }
  return (
    <span className={`inline-flex items-center rounded-lg bg-white px-3 py-2 ${className}`}>
      <img src={SILVER_LOGO} alt="Silver Care" className={`${altura} w-auto`} />
    </span>
  );
}
