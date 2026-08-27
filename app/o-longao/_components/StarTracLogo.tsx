import Image from "next/image";

/**
 * Logo da marca que equipa a prova.
 *
 * O arquivo original veio em WEBP com fundo branco e o wordmark em preto, que
 * sumiria na página. Em `public/o-longao/` moram duas versões tratadas, as
 * duas sem fundo: `star-trac.png` com o wordmark preto, para os blocos
 * `lgo-paper`, e `star-trac-branco.png` com o wordmark em papel, para o
 * escuro. O selo vermelho é o mesmo nas duas: ele é a marca, não decoração.
 */
const RAZAO = 1137 / 138; // proporção da arte já recortada

export function StarTracLogo({
  altura = 26,
  variante = "claro",
  className = "",
  priority = false,
}: {
  /** Altura em px. A largura acompanha a proporção. */
  altura?: number;
  /** `claro` = wordmark em papel, para fundo escuro. `escuro` = o inverso. */
  variante?: "claro" | "escuro";
  className?: string;
  priority?: boolean;
}) {
  const noEscuro = variante === "claro";
  return (
    <Image
      src={noEscuro ? "/o-longao/star-trac-branco.png" : "/o-longao/star-trac.png"}
      alt="Star Trac"
      width={Math.round(altura * RAZAO)}
      height={altura}
      priority={priority}
      style={{ height: altura }}
      className={`w-auto ${className}`}
    />
  );
}
