import { SommaSymbol } from "./_components/brand/Logo";

/**
 * Carregando: o símbolo da marca, sem splash. Só aparece se a página demorar;
 * com cache quente o Next nem chega a mostrar.
 */
export default function Loading() {
  return (
    <div className="lj-loading" role="status" aria-label="Carregando">
      <SommaSymbol />
    </div>
  );
}
