"use client";

import { useEffect, useRef } from "react";
import { useLoja } from "./LojaProvider";

/**
 * Avisa o header que esta página tem hero (e qual é), para ele ficar
 * transparente por cima dela. Vai dentro de uma seção com `data-hero`.
 */
export function HeroMarker() {
  const ref = useRef<HTMLSpanElement>(null);
  const { setHero } = useLoja();

  useEffect(() => {
    setHero(ref.current?.closest<HTMLElement>("[data-hero]") ?? null);
    return () => setHero(null);
  }, [setHero]);

  return <span ref={ref} hidden />;
}
