"use client";

import { useCallback, useRef } from "react";

/** Janela entre o toque e o `change` do input. Mais que isso não é o mesmo gesto. */
const JANELA_MS = 800;

/**
 * Distingue escolha por toque/clique de escolha por teclado.
 *
 * Só o toque avança sozinho para a próxima pergunta. Quem navega por setas
 * dentro de um grupo de rádio muda a seleção a cada tecla; avançar nesse caso
 * arrancaria a pessoa da pergunta no meio da escolha.
 */
export function useIntencaoDePonteiro() {
  const tocadoEm = useRef(0);

  const marcar = useCallback(() => {
    tocadoEm.current = Date.now();
  }, []);

  const consumir = useCallback(() => {
    const valeu = Date.now() - tocadoEm.current < JANELA_MS;
    tocadoEm.current = 0;
    return valeu;
  }, []);

  return { marcar, consumir };
}
