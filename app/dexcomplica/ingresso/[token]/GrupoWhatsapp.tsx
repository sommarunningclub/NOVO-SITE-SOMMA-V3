"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { GRUPO_WHATSAPP } from "@/lib/dexcomplica-love-run/event.config";
import { rastrear } from "@/lib/dexcomplica-love-run/analytics";

const CHAVE = "love-run:grupo-whatsapp";

export function IconeWhatsapp({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.24.68-1.43 1.32-1.97 1.37-.5.05-1.13.07-1.83-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.18-4.94-4.37-.14-.19-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.27-.29.58-.36.78-.36h.56c.18 0 .42-.07.66.5.24.59.83 2.03.9 2.18.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.35 1.46.29.15.46.12.63-.07.17-.19.73-.85.92-1.14.19-.29.39-.24.66-.15.27.1 1.71.81 2 .95.29.15.49.22.56.34.07.12.07.7-.17 1.38Z" />
    </svg>
  );
}

/**
 * Convite para o grupo do evento no WhatsApp, onde saem as novidades e
 * informações. Abre sozinho depois que o ingresso termina de aparecer.
 *
 * Quem entra no grupo não vê mais o convite (neste aparelho); "Agora não"
 * fecha só por esta visita. Esc e clique fora também fecham. O botão fixo
 * das ações do ingresso continua levando ao grupo.
 */
export default function GrupoWhatsapp({ atraso = 2400 }: { atraso?: number }) {
  const [aberto, setAberto] = useState(false);
  const entrar = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    let jaEntrou = false;
    try {
      jaEntrou = localStorage.getItem(CHAVE) === "entrou" || sessionStorage.getItem(CHAVE) === "depois";
    } catch {
      jaEntrou = false;
    }
    if (jaEntrou) return;
    const t = window.setTimeout(() => {
      setAberto(true);
      rastrear("grupo_convite_visto");
    }, atraso);
    return () => window.clearTimeout(t);
  }, [atraso]);

  useEffect(() => {
    if (!aberto) return;
    entrar.current?.focus({ preventScroll: true });
    const esc = (e: KeyboardEvent) => e.key === "Escape" && depois();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const depois = () => {
    try {
      sessionStorage.setItem(CHAVE, "depois");
    } catch {
      /* modo privado */
    }
    setAberto(false);
  };

  const entrou = () => {
    try {
      localStorage.setItem(CHAVE, "entrou");
    } catch {
      /* modo privado */
    }
    rastrear("grupo_whatsapp_clicado", { origem: "popup" });
    setAberto(false);
  };

  if (!aberto) return null;

  return (
    <div className="lr-grupo" onClick={(e) => e.target === e.currentTarget && depois()}>
      <div className="lr-grupo__card" role="dialog" aria-modal="true" aria-labelledby="lr-grupo-titulo" aria-describedby="lr-grupo-texto">
        <button type="button" className="lr-grupo__fechar" onClick={depois} aria-label="Fechar">
          ×
        </button>
        <div className="lr-grupo__selo" aria-hidden="true">
          <IconeWhatsapp className="lr-grupo__icone" />
          <Image src="/dexcomplica-love-run/marca/dex-coracao.png" alt="" width={525} height={502} className="lr-grupo__coracao" />
        </div>
        <p className="lr-grupo__eyebrow">Último passo</p>
        <h2 id="lr-grupo-titulo" className="lr-grupo__titulo">
          Entra no grupo <span>do Love Run</span>
        </h2>
        <p id="lr-grupo-texto" className="lr-grupo__texto">
          É no grupo <strong>{GRUPO_WHATSAPP.nome}</strong> que vamos passar as novidades e as informações do corre.
          Entra agora para não perder nada.
        </p>
        <a
          ref={entrar}
          className="lr-btn lr-btn--whatsapp lr-btn--bloco"
          href={GRUPO_WHATSAPP.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={entrou}
        >
          <IconeWhatsapp className="lr-btn__icone" />
          Entrar no grupo do WhatsApp
        </a>
        <button type="button" className="lr-grupo__depois" onClick={depois}>
          Agora não
        </button>
      </div>
    </div>
  );
}
