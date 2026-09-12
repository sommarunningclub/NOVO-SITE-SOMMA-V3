"use client";

import { useEffect } from "react";
import { evento } from "@/lib/somma-day/analytics";

/** Marca a visualização da LP uma vez por carregamento. Sem dado pessoal. */
export default function Rastreio() {
  useEffect(() => {
    evento("lp_visualizada");
  }, []);
  return null;
}
