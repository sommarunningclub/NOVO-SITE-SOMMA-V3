import Image from "next/image";

/**
 * Lockup da parceria: EVOLVE × SOMMA CLUB.
 * O "×" é um traço com a rampa de energia — é o único lugar da página onde
 * as duas cores se tocam de fato, o que mantém a leitura limpa no resto.
 */
export function Logos({ className = "h-6", showX = true }: { className?: string; showX?: boolean }) {
  return (
    <span className="flex items-center gap-3 md:gap-4">
      <Image
        src="/evolve-logo.svg"
        alt="Evolve"
        width={192}
        height={50}
        priority
        className={`${className} w-auto`}
      />
      {showX && (
        <span aria-hidden className="relative block h-[14px] w-[14px] shrink-0 opacity-90">
          <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rotate-45 bg-[image:var(--energia)]" />
          <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 -rotate-45 bg-[image:var(--energia)]" />
        </span>
      )}
      <Image
        src="/logo-somma.svg"
        alt="SOMMA Club"
        width={192}
        height={51}
        priority
        className={`${className} w-auto`}
      />
    </span>
  );
}
