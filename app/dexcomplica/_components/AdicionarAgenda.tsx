"use client";

import { useEffect, useRef, useState } from "react";
import { textoIcs, urlGoogleAgenda } from "@/lib/dexcomplica-love-run/agenda";
import { rastrear } from "@/lib/dexcomplica-love-run/analytics";
import { EVENTO_PATH, SITE_URL } from "@/lib/dexcomplica-love-run/event.config";

/**
 * Botão "Adicionar à agenda" com as duas saídas. Com `pessoal`, o .ics e o
 * Google levam o link do ingresso deste aparelho na descrição; sem, levam a
 * página do evento.
 */
export default function AdicionarAgenda({
  pessoal = false,
  origem,
  className = "lr-btn lr-btn--contorno",
}: {
  pessoal?: boolean;
  origem: string;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [urlIngresso, setUrlIngresso] = useState<string | undefined>(undefined);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sempre o domínio oficial: o lembrete precisa abrir o ingresso de qualquer aparelho.
    if (pessoal) setUrlIngresso(`${SITE_URL}${window.location.pathname}`);
  }, [pessoal]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => !caixa.current?.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("click", fora);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", fora);
      window.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const baixarIcs = () => {
    rastrear("calendario_adicionado", { tipo: "ics", origem });
    if (!pessoal) {
      window.location.href = `${EVENTO_PATH}/agenda.ics`;
      return;
    }
    const blob = new Blob([textoIcs(urlIngresso)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dexcomplica-love-run.ics";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    setAberto(false);
  };

  return (
    <div className="lr-agenda" ref={caixa}>
      <button type="button" className={className} aria-expanded={aberto} aria-controls={`lr-agenda-${origem}`} onClick={() => setAberto((v) => !v)}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
          <path d="M3.5 10h17M8 3v4M16 3v4M12 13.2l-.9-.8c-1-.9-1.6-1.4-1.6-2.1 0-.6.5-1 1-1 .4 0 .8.2 1 .5h.1c.3-.3.6-.5 1-.5.6 0 1 .4 1 1 0 .7-.6 1.2-1.6 2.1Z" />
        </svg>
        Adicionar à agenda
      </button>
      {aberto ? (
        <ul id={`lr-agenda-${origem}`} className="lr-agenda__menu">
          <li>
            <a
              href={urlGoogleAgenda(urlIngresso)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                rastrear("calendario_adicionado", { tipo: "google", origem });
                setAberto(false);
              }}
            >
              Google Agenda
            </a>
          </li>
          <li>
            <button type="button" onClick={baixarIcs}>
              Apple, Outlook e outros (.ics)
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
