/**
 * Texto com letras soltas para pularem ao toque (ver Interacoes). Leitor de
 * tela lê a palavra inteira; as letras separadas ficam escondidas dele.
 */
export default function Letras({ texto }: { texto: string }) {
  return (
    <>
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true" data-pula className="lr-letras">
        {Array.from(texto).map((c, i) => (
          <span key={i} className="lr-l">{c}</span>
        ))}
      </span>
    </>
  );
}
