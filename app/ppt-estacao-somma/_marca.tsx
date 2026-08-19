/**
 * Marcas oficiais SOMMA e Evolve.
 *
 * Arquivos vindos da pasta Apresentacao-Evolve, sem redesenho, recoloração ou
 * mudança de proporção. Só as margens transparentes da Evolve foram aparadas
 * para alinhar com a SOMMA. Cada marca tem a versão certa para cada fundo:
 * em fundo escuro entram as versões brancas, em fundo claro as versões pretas.
 */

export const LOGOS = {
  sommaEscuro: "/estacao-somma/somma-branco-laranja.svg",
  sommaClaro: "/estacao-somma/somma-preto-laranja.png",
  evolveEscuro: "/estacao-somma/evolve-branco.png",
  evolveClaro: "/estacao-somma/evolve-preto-vermelho.png",
  evolvePlusEscuro: "/estacao-somma/evolve-plus-branco.png",
  evolvePlusClaro: "/estacao-somma/evolve-plus-preto.png",
  evolvePlusSimboloEscuro: "/estacao-somma/evolve-plus-simbolo-branco.png",
  evolvePlusSimboloClaro: "/estacao-somma/evolve-plus-simbolo-preto.png",
} as const;

type Tema = "escuro" | "claro";
type Size = "sm" | "md" | "lg";

const ALTURAS: Record<Size, { somma: string; evolve: string; gap: string; label: string }> = {
  sm: { somma: "h-4 md:h-5", evolve: "h-[0.95rem] md:h-[1.2rem]", gap: "gap-4 md:gap-5", label: "text-[9px]" },
  md: { somma: "h-5 md:h-7", evolve: "h-[1.2rem] md:h-[1.7rem]", gap: "gap-5 md:gap-7", label: "text-[10px]" },
  lg: { somma: "h-7 md:h-9", evolve: "h-[1.7rem] md:h-[2.2rem]", gap: "gap-6 md:gap-9", label: "text-[11px]" },
};

export function SommaLogo({ tema = "escuro", className = "" }: { tema?: Tema; className?: string }) {
  return (
    <img
      src={tema === "claro" ? LOGOS.sommaClaro : LOGOS.sommaEscuro}
      alt="SOMMA Club"
      className={`w-auto ${className}`}
    />
  );
}

export function EvolveLogo({ tema = "escuro", className = "" }: { tema?: Tema; className?: string }) {
  return (
    <img
      src={tema === "claro" ? LOGOS.evolveClaro : LOGOS.evolveEscuro}
      alt="Evolve"
      className={`w-auto ${className}`}
    />
  );
}

/** Marca Evolve+ (arquivos oficiais da pasta Apresentacao-Evolve, só com as margens aparadas). */
export function EvolvePlusLogo({
  tema = "escuro",
  className = "",
  simbolo = false,
}: {
  tema?: Tema;
  className?: string;
  /** Só o E com o sinal de mais, sem a palavra. */
  simbolo?: boolean;
}) {
  const src = simbolo
    ? tema === "claro"
      ? LOGOS.evolvePlusSimboloClaro
      : LOGOS.evolvePlusSimboloEscuro
    : tema === "claro"
      ? LOGOS.evolvePlusClaro
      : LOGOS.evolvePlusEscuro;
  return <img src={src} alt="Evolve+" className={`w-auto ${className}`} />;
}

/** SOMMA · powered by · Evolve. */
export function Lockup({
  className = "",
  size = "md",
  tema = "escuro",
}: {
  className?: string;
  size?: Size;
  tema?: Tema;
}) {
  const a = ALTURAS[size];
  const claro = tema === "claro";
  return (
    <div className={`flex items-center ${a.gap} ${className}`}>
      <SommaLogo tema={tema} className={a.somma} />
      <span
        className={`font-display ${a.label} font-medium uppercase tracking-[0.32em] ${claro ? "text-black/40" : "text-white/45"}`}
      >
        powered by
      </span>
      <EvolveLogo tema={tema} className={a.evolve} />
    </div>
  );
}
