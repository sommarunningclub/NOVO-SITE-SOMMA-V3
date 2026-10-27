const FRASES = ["Desapega", "Desilude", "Dexcomplica", "07.11", "Vem correr", "Love Run"];

/** Faixa vermelha em loop. Puro CSS; com reduced-motion ela para. */
export default function Letreiro() {
  const linha = (
    <>
      {FRASES.map((f) => (
        <span key={f} className="lr-letreiro__item">
          {f}
          <svg viewBox="0 0 24 22" aria-hidden="true">
            <path d="M12 21.2 10.4 19.8C4.6 14.6.8 11.2.8 7A5.9 5.9 0 0 1 6.8 1c1.9 0 3.7.9 5.2 2.3A7.3 7.3 0 0 1 17.2 1a5.9 5.9 0 0 1 6 6c0 4.2-3.8 7.6-9.6 12.8Z" />
          </svg>
        </span>
      ))}
    </>
  );
  return (
    <div className="lr-letreiro" role="presentation">
      <p className="sr-only">Desapega, desilude... Dexcomplica! Dia 7 de novembro, vem correr.</p>
      <div className="lr-letreiro__trilho" aria-hidden="true">
        <div className="lr-letreiro__faixa">{linha}</div>
        <div className="lr-letreiro__faixa">{linha}</div>
      </div>
    </div>
  );
}
