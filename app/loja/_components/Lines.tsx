/**
 * Headline em linhas com máscara (`.lj-line`), pronta para `data-reveal="lines"`.
 * O ponto final da última linha sai em laranja: é o ponto do logo "somma."
 */
export function Lines({ lines, dot = true }: { lines: string[]; dot?: boolean }) {
  return (
    <>
      {lines.map((line, i) => {
        const accent = dot && i === lines.length - 1 && line.endsWith(".");
        return (
          <span className="lj-line" key={`${i}-${line}`}>
            <span>
              {accent ? line.slice(0, -1) : line}
              {accent ? <span className="lj-dot">.</span> : null}
            </span>
          </span>
        );
      })}
    </>
  );
}
