import Image from "next/image";

/**
 * Lockup de realização: EVOLVE + SOMMA CLUB, nesta ordem.
 *
 * O "+" é feito com dois traços na rampa de energia, e é o único ponto da
 * página onde as cores das duas marcas se tocam. O resto da identidade fica
 * com o âmbar de cronometragem, então este sinal não compete com nada.
 *
 * As duas artes não têm o mesmo enquadramento: a da Evolve preenche a caixa
 * quase toda, a do Somma tem folga em volta do símbolo. Igualar a altura em
 * CSS deixaria a Evolve visivelmente maior, então a altura dela sai reduzida
 * por um fator óptico. É ajuste de olho, não de matemática.
 *
 * A logo do Somma vem em duas versões no repositório: a clara para fundo
 * escuro e a `-dark` para os blocos `lgo-paper`. A Evolve só existe em
 * branco, então em fundo claro ela é invertida por filtro.
 */
const OPTICO_EVOLVE = 0.82;

export function Logos({
  altura = 26,
  variante = "claro",
  comMais = true,
  className = "",
}: {
  /** Altura da logo do Somma, em px. A da Evolve acompanha opticamente. */
  altura?: number;
  /** `claro` = logos claras sobre fundo escuro. `escuro` = o inverso. */
  variante?: "claro" | "escuro";
  comMais?: boolean;
  className?: string;
}) {
  const noEscuro = variante === "claro";
  const alturaEvolve = Math.round(altura * OPTICO_EVOLVE);

  return (
    <span className={`flex items-center gap-3 md:gap-4 ${className}`}>
      <Image
        src="/evolve-logo.svg"
        alt="Evolve"
        width={192}
        height={50}
        style={{ height: alturaEvolve }}
        // a arte da Evolve é branca; no papel ela precisa virar tinta escura
        className={`w-auto ${noEscuro ? "" : "brightness-0"}`}
      />

      {comMais && (
        <span
          aria-hidden
          className="relative block shrink-0 opacity-90"
          style={{ height: Math.round(altura * 0.5), width: Math.round(altura * 0.5) }}
        >
          <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-[image:var(--energia)]" />
          <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-[image:var(--energia)]" />
        </span>
      )}

      <Image
        src={noEscuro ? "/logo-somma.svg" : "/logo-somma-dark.svg"}
        alt="SOMMA Club"
        width={192}
        height={51}
        style={{ height: altura }}
        className="w-auto"
      />
    </span>
  );
}
