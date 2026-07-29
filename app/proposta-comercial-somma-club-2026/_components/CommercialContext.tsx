"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

const MAX_COMPARE = 3;

interface CommercialCtx {
  /** id da oportunidade aberta no modal, ou null. */
  openId: string | null;
  openOpportunity: (id: string) => void;
  closeModal: () => void;
  /** ids selecionados para comparar (máx. 3). */
  compare: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  isComparing: (id: string) => boolean;
  compareFull: boolean;
  maxCompare: number;
}

const Ctx = createContext<CommercialCtx | null>(null);

export function CommercialProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);

  const openOpportunity = useCallback((id: string) => setOpenId(id), []);
  const closeModal = useCallback(() => setOpenId(null), []);

  const toggleCompare = useCallback((id: string) => {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }, []);

  const clearCompare = useCallback(() => setCompare([]), []);
  const isComparing = useCallback((id: string) => compare.includes(id), [compare]);

  const value = useMemo<CommercialCtx>(
    () => ({
      openId,
      openOpportunity,
      closeModal,
      compare,
      toggleCompare,
      clearCompare,
      isComparing,
      compareFull: compare.length >= MAX_COMPARE,
      maxCompare: MAX_COMPARE,
    }),
    [openId, openOpportunity, closeModal, compare, toggleCompare, clearCompare, isComparing],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCommercial(): CommercialCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCommercial deve ser usado dentro de CommercialProvider");
  return ctx;
}
