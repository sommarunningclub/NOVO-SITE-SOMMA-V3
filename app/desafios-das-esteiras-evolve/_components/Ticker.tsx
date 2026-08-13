import { EVENT, UNITS } from "@/lib/desafio-esteiras/event.config";

const ITENS = [
  "4 UNIDADES",
  "1 DESAFIO",
  EVENT.dataLabel,
  EVENT.horaLabel,
  ...UNITS.map((u) => u.curto.toUpperCase()),
  "A CIDADE VAI CORRER JUNTA",
];

/**
 * Ticker horizontal — puro CSS (animação de marquee), zero JS.
 * A trilha é duplicada para o loop não deixar buraco; a cópia é invisível
 * para leitores de tela.
 */
export function Ticker({
  variante = "escuro",
  reverso = false,
}: {
  variante?: "escuro" | "energia" | "papel";
  reverso?: boolean;
}) {
  const estilo =
    variante === "energia"
      ? { background: "var(--energia)", color: "#fff" }
      : variante === "papel"
        ? { background: "var(--paper)", color: "var(--ink)" }
        : { background: "var(--ink-2)", color: "var(--paper)" };

  return (
    <div
      className={`dst-ticker ${reverso ? "dst-ticker--reverse" : ""}`}
      style={estilo}
      role="presentation"
    >
      {[0, 1].map((copia) => (
        <div key={copia} className="dst-ticker__track" aria-hidden={copia === 1}>
          {ITENS.map((item, i) => (
            <span key={`${item}-${i}`} className="flex items-center gap-2.5">
              <span className="dst-display dst-display-condensed text-[clamp(1.1rem,3.4vw,1.9rem)]">
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
