import Image from "next/image";

const M = "/dexcomplica-love-run/marca";

/**
 * As três marcas, nos arquivos oficiais e na proporção certa: Somma e
 * Dexcomplica com o mesmo peso (realização), Monu menor (produção).
 */
export default function Marcas({ tom = "claro", compacto = false }: { tom?: "claro" | "escuro"; compacto?: boolean }) {
  return (
    <div className={`lr-marcas lr-marcas--${tom}${compacto ? " lr-marcas--compacto" : ""}`}>
      <div className="lr-marcas__grupo">
        <span className="lr-marcas__rotulo">Realização</span>
        <span className="lr-marcas__logos">
          <Image
            src={`${M}/${tom === "claro" ? "somma-branca" : "somma-preta"}.svg`}
            alt="Somma Club"
            width={1280}
            height={343}
            className="lr-marcas__somma"
          />
          <span className="lr-marcas__x" aria-hidden="true">×</span>
          <Image src={`${M}/dex-logo.png`} alt="Dexcomplica" width={900} height={194} className="lr-marcas__dex" />
        </span>
      </div>
      <div className="lr-marcas__grupo">
        <span className="lr-marcas__rotulo">Produção</span>
        <Image
          src={`${M}/${tom === "claro" ? "monu-branca" : "monu-preta"}.png`}
          alt="Monu"
          width={520}
          height={134}
          className="lr-marcas__monu"
        />
      </div>
    </div>
  );
}
