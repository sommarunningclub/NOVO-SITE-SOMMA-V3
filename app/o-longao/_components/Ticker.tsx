import { TICKER_ITENS } from "@/lib/o-longao/copy";

/**
 * Ticker horizontal — puro CSS (marquee), zero JS. A trilha é duplicada para
 * o loop não deixar buraco; a cópia é invisível para leitores de tela.
 * Aceita itens próprios para as faixas narrativas entre seções.
 */
export function Ticker({
  variante = "escuro",
  reverso = false,
  itens = TICKER_ITENS,
}: {
  variante?: "escuro" | "energia" | "timing" | "papel";
  reverso?: boolean;
  itens?: readonly string[];
}) {
  const estilo =
    variante === "energia"
      ? { background: "var(--energia)", color: "#fff" }
      : variante === "timing"
        ? { background: "var(--sinal)", color: "var(--noite)" }
        : variante === "papel"
          ? { background: "var(--papel)", color: "var(--noite)" }
          : { background: "var(--noite-2)", color: "var(--papel)" };

  return (
    <div
      className={`lgo-ticker ${reverso ? "lgo-ticker--reverse" : ""}`}
      style={estilo}
      role="presentation"
    >
      {[0, 1].map((copia) => (
        <div key={copia} className="lgo-ticker__track" aria-hidden={copia === 1}>
          {itens.map((item, i) => (
            <span key={`${item}-${i}`} className="flex items-center gap-2.5">
              <span className="lgo-display lgo-display-condensed text-[clamp(1.1rem,3.4vw,1.9rem)]">
                {item}
              </span>
              <span className="block h-1.5 w-1.5 rotate-45 bg-current opacity-60" />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
