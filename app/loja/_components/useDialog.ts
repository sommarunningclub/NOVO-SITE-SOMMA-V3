"use client";

import { useEffect, useRef } from "react";

/**
 * Liga um <dialog> nativo a um estado booleano. O nativo já entrega o que um
 * painel modal precisa: foco preso, Esc para fechar, resto da página inerte e
 * foco devolvido a quem abriu.
 */
export function useDialog(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return ref;
}
