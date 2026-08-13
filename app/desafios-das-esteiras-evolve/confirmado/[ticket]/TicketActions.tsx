"use client";

import { useEffect, useRef, useState } from "react";
import { EVENT, EVENT_PATH, SITE_URL, getUnit } from "@/lib/desafio-esteiras/event.config";
import { track } from "@/lib/desafio-esteiras/analytics";
import { gsap, prefersReducedMotion } from "../../_motion";

interface Props {
  token: string;
  unitId: string;
  ticketCode: string;
}

/**
 * Ações do ticket: compartilhar, adicionar ao calendário e como chegar.
 *
 * A mensagem de compartilhamento não carrega nome, CPF nem código do ticket —
 * só a unidade e a data. O link compartilhado é o da LP, nunca o do ticket
 * (que é uma URL privada com token).
 */
export function TicketActions({ token, unitId, ticketCode }: Props) {
  const [copiado, setCopiado] = useState(false);
  const [suporteShare, setSuporteShare] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const unit = getUnit(unitId);

  useEffect(() => {
    setSuporteShare(typeof navigator !== "undefined" && Boolean(navigator.share));
    track("view_ticket", { unidade: unitId, ticket: ticketCode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!raiz.current || prefersReducedMotion()) return;
    gsap.fromTo(
      raiz.current.querySelectorAll(".acao"),
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.07, delay: 0.7 }
    );
  }, []);

  const texto = [
    "EU TÔ DENTRO.",
    "",
    `${EVENT.nome.toUpperCase()} — ${EVENT.dataLabel}`,
    "EVOLVE + SOMMA CLUB",
    `Minha unidade: ${(unit?.curto ?? "").toUpperCase()}`,
  ].join("\n");

  const linkPublico = `${SITE_URL}${EVENT_PATH}?ref=ticket&utm_source=compartilhamento&utm_medium=social&utm_campaign=desafio-esteiras`;

  async function compartilhar() {
    track("share_ticket", { unidade: unitId, metodo: suporteShare ? "web_share" : "copiar" });

    if (navigator.share) {
      try {
        await navigator.share({ title: EVENT.nome, text: texto, url: linkPublico });
        return;
      } catch {
        // usuário cancelou ou o alvo recusou: cai no copiar
      }
    }

    try {
      await navigator.clipboard.writeText(`${texto}\n\n${linkPublico}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2600);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div ref={raiz} className="mt-8 flex flex-col gap-3">
      <button type="button" onClick={compartilhar} className="dst-btn acao dst-btn--somma w-full">
        {copiado ? "Link copiado ✓" : "Compartilhar"}
      </button>

      <div className="acao grid gap-3 sm:grid-cols-2">
        <a
          href={unit?.googleMapsUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("open_directions", { unidade: unitId, origem: "ticket" })}
          className="dst-btn dst-btn--ghost"
        >
          Como chegar
        </a>
        <a
          href={`/api/desafio-esteiras/calendario/${token}`}
          className="dst-btn dst-btn--ghost"
          data-testid="add-calendario"
        >
          Adicionar ao calendário
        </a>
      </div>

      {/* Card compartilhável — o que a pessoa vê antes de mandar pro grupo */}
      <div className="acao dst-panel mt-4 p-5">
        <p className="dst-label mb-3 text-[color:rgba(242,240,236,0.4)]">Mensagem que será enviada</p>
        <p className="dst-display text-[clamp(1.4rem,6vw,2rem)] leading-[0.95]">EU TÔ DENTRO.</p>
        <p className="dst-label mt-3 leading-relaxed text-[color:rgba(242,240,236,0.6)]">
          {EVENT.nome.toUpperCase()} · {EVENT.dataLabel}
          <br />
          EVOLVE + SOMMA
          <br />
          <span style={{ color: "var(--somma)" }}>
            MINHA UNIDADE: {(unit?.curto ?? "").toUpperCase()}
          </span>
        </p>
      </div>
    </div>
  );
}
